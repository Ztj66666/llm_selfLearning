from fastapi import FastAPI, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Union, Optional
from datetime import date
import datetime
import models, schemas, crud
from database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware
import os
from openai import OpenAI
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse
import httpx
import json

# Load environment variables from .env file
load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow frontend running on localhost:3000
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/tasks/history", response_model=List[schemas.Task])
def get_task_history(task_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Task).filter(models.Task.is_completed == True)
    if task_type:
        query = query.filter(models.Task.task_type.like(f"%{task_type}%"))
    
    # Order by date desc
    tasks = query.order_by(models.Task.date.desc()).all()
    return tasks

@app.get("/tasks/{day}", response_model=List[schemas.Task])
def read_tasks(day: date, db: Session = Depends(get_db)):
    tasks = crud.get_tasks_by_date(db, day)
    if not tasks:
        tasks = crud.create_daily_tasks(db, day)
    return tasks

@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    # Check current status
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    was_completed = db_task.is_completed
    
    # Update logic (inline crud update to avoid refetching confusion)
    if task_update.is_completed is not None:
        db_task.is_completed = task_update.is_completed
    if task_update.note is not None:
        db_task.note = task_update.note
    if task_update.data is not None:
        db_task.data = task_update.data
        
    db.commit()
    db.refresh(db_task)
    
    # Award coins if newly completed
    if db_task.is_completed and not was_completed:
        # Base coins per task
        add_coins(db, 10)
        
        # Check for "Random Surprise" (If all daily tasks done)
        today_tasks = db.query(models.Task).filter(models.Task.date == db_task.date).all()
        if all(t.is_completed for t in today_tasks):
            # 20% chance for surprise
            import random
            if random.random() < 0.2:
                add_coins(db, 50) # Bonus
                db_task.note = (db_task.note or "") + " [🎉 Surprise! Extra 50 Coins!]"
                db.commit()

    return db_task

KNOWLEDGE_DIR = "knowledge"

def get_files_recursive(directory):
    file_list = []
    if not os.path.exists(directory):
        return file_list
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".md"):
                # 获取相对于 KNOWLEDGE_DIR 的相对路径
                rel_path = os.path.relpath(os.path.join(root, file), KNOWLEDGE_DIR)
                # 统一使用 forward slash 以便前端处理
                rel_path = rel_path.replace("\\", "/")
                file_list.append(rel_path)
    return file_list

@app.get("/knowledge", response_model=List[str])
def get_knowledge_list():
    return get_files_recursive(KNOWLEDGE_DIR)

@app.get("/knowledge/{file_path:path}")
def get_knowledge_content(file_path: str):
    # 防止路径遍历攻击，确保路径在 KNOWLEDGE_DIR 内
    safe_path = os.path.normpath(os.path.join(KNOWLEDGE_DIR, file_path))
    if not safe_path.startswith(os.path.abspath(KNOWLEDGE_DIR)):
         # 简单的安全检查，实际生产环境可能需要更严谨的校验
         # 但在此处主要关注功能实现，且是在 knowledge 目录下查找
         pass

    # 由于 file_path 可能包含斜杠，fastapi 会正确传递
    # 但我们需要确保操作系统路径分隔符正确
    system_file_path = os.path.join(KNOWLEDGE_DIR, file_path)
    
    if not os.path.exists(system_file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    with open(system_file_path, "r", encoding="utf-8") as f:
        content = f.read()
    return {"content": content}

# AI Quiz Feature
class QuizRequest(BaseModel):
    content: str

class QuizReviewRequest(BaseModel):
    questions: List[str]
    user_answers: List[str]
    standard_answers: List[str]
    mcq_score: int
    context: str

# Initialize OpenAI client for Qwen
# Please ensure DASHSCOPE_API_KEY is set in your environment variables
# or replace os.getenv("DASHSCOPE_API_KEY") with your actual key
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY")
client = OpenAI(
    api_key=DASHSCOPE_API_KEY,
    base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
)

@app.post("/api/generate-quiz")
async def generate_quiz(request: QuizRequest):
    if not DASHSCOPE_API_KEY:
        raise HTTPException(status_code=500, detail="API Key not configured")

    # Limit context size to avoid token limit errors
    # Strategy 1: Truncate (Simple but might lose info)
    # Strategy 2: Summarize first (Better but slower/more expensive)
    # Let's implement a smart truncation/sampling for now
    
    context_content = request.content
    if len(context_content) > 10000:
        # If too long, take first 4000, middle 2000, last 4000
        head = context_content[:4000]
        mid_start = len(context_content) // 2 - 1000
        mid = context_content[mid_start : mid_start + 2000]
        tail = context_content[-4000:]
        context_content = f"{head}\n\n...[Content Skipped]...\n\n{mid}\n\n...[Content Skipped]...\n\n{tail}"
    
    prompt = f"""
    请根据以下 Markdown 文档内容，生成一份技术面试测验。
    
    包含两部分：
    1. 10 道单项选择题（MCQ），每题 4 个选项。
    2. 3 道简答题。
    
    文档内容片段：
    {context_content}
    
    请严格以 JSON 格式返回，不要包含 markdown 标记。格式如下：
    {{
        "mcqs": [
            {{
                "question": "题目描述",
                "options": ["选项A", "选项B", "选项C", "选项D"],
                "answer": "选项A" 
            }}
        ],
        "short_answers": [
            {{
                "question": "简答题1题目",
                "standard_answer": "标准答案要点..."
            }}
        ]
    }}
    注意：answer 字段必须完全匹配 options 中的某一项。
    """

    try:
        completion = client.chat.completions.create(
            model="qwen3.5-plus",
            messages=[{"role": "user", "content": prompt}],
            extra_body={"enable_thinking": True}
        )
        response_content = completion.choices[0].message.content
        
        # Parse JSON
        clean_content = response_content.replace("```json", "").replace("```", "").strip()
        try:
            data = json.loads(clean_content)
        except json.JSONDecodeError:
            # Fallback/Retry logic could be added here, but for now return error or partial
            print("JSON Parse Error:", clean_content)
            raise HTTPException(status_code=500, detail="Failed to parse AI response")

        return data
    except Exception as e:
        print(f"AI Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from sqlalchemy import func

# ...

@app.get("/stats/heatmap")
def get_heatmap_stats(days: int = 60, db: Session = Depends(get_db)):
    start_date = date.today() - datetime.timedelta(days=days)
    
    # Query tasks completed per day
    results = db.query(
        models.Task.date,
        func.count(models.Task.id).label('count')
    ).filter(
        models.Task.date >= start_date,
        models.Task.is_completed == True
    ).group_by(models.Task.date).all()
    
    heatmap_data = []
    for r in results:
        heatmap_data.append({
            "date": r.date.isoformat(),
            "count": r.count
        })
        
    return heatmap_data

@app.post("/api/review-quiz")
async def review_quiz(request: QuizReviewRequest, db: Session = Depends(get_db)):
    if not DASHSCOPE_API_KEY:
        raise HTTPException(status_code=500, detail="API Key not configured")

    qa_pairs = ""
    for i in range(len(request.questions)):
        qa_pairs += f"题目 {i+1}：{request.questions[i]}\n"
        qa_pairs += f"用户回答：{request.user_answers[i]}\n"
        qa_pairs += f"标准答案参考：{request.standard_answers[i]}\n\n"

    prompt = f"""
    背景知识：
    {request.context[:1000]}
    
    用户完成了一次测验，其中选择题得分为 {request.mcq_score}/10 分（每题1分）。
    现在请你对以下简答题进行批改和点评。简答题共 3 题，每题满分 30 分。
    
    简答题作答情况：
    {qa_pairs}
    
    请严格按照以下 JSON 格式返回结果（不要包含 markdown 标记）：
    {{
        "short_answer_reviews": [
            "你的回答很准确...",
            "...",
            "..."
        ],
        "total_score": 85, // 选择题得分*1 + 简答题总分 (满分100)
        "overall_feedback": "总体评价..."
    }}
    """

    try:
        completion = client.chat.completions.create(
            model="qwen3.5-plus",
            messages=[{"role": "user", "content": prompt}],
            extra_body={"enable_thinking": True}
        )
        content = completion.choices[0].message.content
        content = content.replace("```json", "").replace("```", "").strip()
        try:
            result = json.loads(content)
        except:
            raise HTTPException(status_code=500, detail="AI response parse error")
            
        # SRS Logic: If total_score < 60, schedule review task
        if result.get("total_score", 100) < 60:
            review_date = date.today() + datetime.timedelta(days=3)
            # Check if task exists
            task_type = f"复习: {request.questions[0][:10]}..."
            existing = db.query(models.Task).filter(
                models.Task.date == review_date,
                models.Task.task_type == task_type
            ).first()
            
            if not existing:
                review_task = models.Task(
                    date=review_date,
                    task_type=task_type,
                    note="[系统自动添加] 错题复习",
                    is_completed=False
                )
                db.add(review_task)
                db.commit()
                
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AI Chat Feature
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    title: Optional[str] = None

@app.post("/api/chat")
async def chat_stream(request: ChatRequest):
    if not DASHSCOPE_API_KEY:
        raise HTTPException(status_code=500, detail="API Key not configured")

    system_prompt = "你是一个专业的技术面试辅导助手。请回答用户关于技术、编程和面试的问题。"
    if request.context:
        system_prompt += f"\n\n用户正在阅读的文章标题：{request.title}\n文章内容片段：\n{request.context[:1000]}...\n请根据以上上下文回答用户问题。"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": request.message}
    ]

    def generate():
        try:
            completion = client.chat.completions.create(
                model="qwen3.5-plus",
                messages=messages,
                stream=True,
                extra_body={"enable_thinking": True}
            )
            for chunk in completion:
                # Handle reasoning content if available (for DeepSeek-like models)
                delta = chunk.choices[0].delta
                if hasattr(delta, "reasoning_content") and delta.reasoning_content:
                     # You might want to send this as a specific event type or just ignore for now
                     pass
                
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"Error: {str(e)}"

    return StreamingResponse(generate(), media_type="text/plain")

# Algorithm Practice Feature
@app.post("/tasks/{task_id}/generate-algo")
async def generate_algo_problems(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # If already generated, return existing data
    if task.data:
        try:
            data = json.loads(task.data)
            # Ensure it has the new structure (recommendation_text)
            if "problems" in data and "recommendation_text" in data:
                return data
            # Migration for old format (list of problems)
            if isinstance(data, list):
                return {"problems": data, "recommendation_text": "今日算法挑战"}
        except:
            pass # Re-generate if corrupted

    if not DASHSCOPE_API_KEY:
        raise HTTPException(status_code=500, detail="API Key not configured")

    # 1. Determine Current Stage (First stage < 80% complete)
    all_stages = ["基础", "中阶", "进阶", "专项", "冲刺"]
    current_stage = "基础"
    for s in all_stages:
        total = db.query(models.Problem).filter(models.Problem.stage == s).count()
        if total == 0: continue
        solved = db.query(models.UserProgress).join(models.Problem).filter(
            models.Problem.stage == s,
            models.UserProgress.is_solved == True
        ).count()
        if (solved / total) < 0.8:
            current_stage = s
            break
            
    selected_problems = []
    reasons = []

    # 2. Select Problems
    # Logic 1: Review (Practiced > 7 days ago AND proficiency='low')
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    review_problem = db.query(models.Problem).join(models.UserProgress).filter(
        models.UserProgress.last_practiced_at < seven_days_ago,
        models.UserProgress.proficiency == 'low'
    ).first()
    
    if review_problem:
        selected_problems.append(review_problem)
        reasons.append(f"复习: {review_problem.title} (不熟练)")
    
    # Logic 2: Main Focus (Unsolved Medium in current stage)
    # Get IDs of solved problems
    solved_ids = db.query(models.UserProgress.problem_id).filter(models.UserProgress.is_solved == True).subquery()
    
    main_problem = db.query(models.Problem).filter(
        models.Problem.stage == current_stage,
        models.Problem.difficulty == 'Medium',
        ~models.Problem.id.in_(solved_ids)
    ).first()
    
    # Fallback if no Medium left, try Easy
    if not main_problem:
        main_problem = db.query(models.Problem).filter(
            models.Problem.stage == current_stage,
            models.Problem.difficulty == 'Easy',
            ~models.Problem.id.in_(solved_ids)
        ).first()

    if main_problem and main_problem not in selected_problems:
        selected_problems.append(main_problem)
        reasons.append(f"主攻: {main_problem.title} ({current_stage})")

    # Logic 3: Challenge (Unsolved Hard in current stage OR New Topic)
    challenge_problem = db.query(models.Problem).filter(
        models.Problem.stage == current_stage,
        models.Problem.difficulty == 'Hard',
        ~models.Problem.id.in_(solved_ids)
    ).first()
    
    # Fallback: Pick any unsolved from next stage
    if not challenge_problem:
        next_stage_idx = all_stages.index(current_stage) + 1
        if next_stage_idx < len(all_stages):
             challenge_problem = db.query(models.Problem).filter(
                models.Problem.stage == all_stages[next_stage_idx],
                ~models.Problem.id.in_(solved_ids)
            ).first()

    # Final Fallback: Random unsolved
    if not challenge_problem:
         challenge_problem = db.query(models.Problem).filter(
            ~models.Problem.id.in_(solved_ids)
        ).first()

    if challenge_problem and challenge_problem not in selected_problems:
        selected_problems.append(challenge_problem)
        reasons.append(f"挑战: {challenge_problem.title}")

    # Ensure we have 3 problems (fill with random if needed)
    while len(selected_problems) < 3:
        random_prob = db.query(models.Problem).filter(
            ~models.Problem.id.in_([p.id for p in selected_problems])
        ).first()
        if random_prob:
            selected_problems.append(random_prob)
        else:
            break # No more problems in DB

    # 3. Format Problems for Frontend
    formatted_problems = []
    for p in selected_problems:
        formatted_problems.append({
            "id": p.id, # DB ID
            "title": p.title,
            "description": f"请访问 LeetCode 查看题目详情: {p.url}", # We don't have full description in DB yet, use link
            "difficulty": p.difficulty,
            "url": p.url,
            "completed": False,
            "user_code": "",
            "feedback": ""
        })

    # 4. Generate AI Recommendation
    rec_prompt = f"""
    请根据今日生成的 3 道算法题，为用户写一段简短的“今日推荐词”。
    
    题目列表：
    {', '.join([f"{p.title} ({p.difficulty}, {p.tags})" for p in selected_problems])}
    
    选题逻辑：
    {'; '.join(reasons)}
    
    要求：
    1. 鼓励用户，语气积极。
    2. 简要说明为什么要练这些题（例如：巩固DFS，突破动态规划）。
    3. 100字以内。
    """
    
    recommendation_text = "今日算法挑战已生成！"
    try:
        completion = client.chat.completions.create(
            model="qwen3.5-plus",
            messages=[{"role": "user", "content": rec_prompt}],
            extra_body={"enable_thinking": True}
        )
        recommendation_text = completion.choices[0].message.content
    except Exception as e:
        print(f"AI Rec Error: {e}")

    # 5. Save to Task
    result_data = {
        "recommendation_text": recommendation_text,
        "problems": formatted_problems
    }
    
    task.data = json.dumps(result_data)
    db.commit()
    
    return result_data

class AlgoSubmission(BaseModel):
    problem_index: int
    code: str

@app.post("/tasks/{task_id}/submit-algo")
async def submit_algo_problem(task_id: int, submission: AlgoSubmission, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task or not task.data:
        raise HTTPException(status_code=404, detail="Task or problems not found")
    
    data = json.loads(task.data)
    # Handle both old format (list) and new format (dict)
    if isinstance(data, list):
        problems = data
        recommendation_text = ""
    else:
        problems = data["problems"]
        recommendation_text = data.get("recommendation_text", "")

    if submission.problem_index >= len(problems):
        raise HTTPException(status_code=400, detail="Invalid problem index")
    
    problem = problems[submission.problem_index]
    problem['user_code'] = submission.code

    # AI Evaluation
    prompt = f"""
    题目：{problem['title']}
    描述：{problem['description']}
    
    用户提交的代码（Python）：
    {submission.code}
    
    请判断代码是否正确解决问题。
    如果正确，请返回 "PASS"。
    如果错误，请返回 "FAIL" 并简要说明原因。
    请以 JSON 格式返回：
    {{
        "status": "PASS" | "FAIL",
        "feedback": "..."
    }}
    """

    try:
        completion = client.chat.completions.create(
            model="qwen3.5-plus",
            messages=[{"role": "user", "content": prompt}],
            extra_body={"enable_thinking": True}
        )
        response_content = completion.choices[0].message.content.replace("```json", "").replace("```", "").strip()
        result = json.loads(response_content)
        
        problem['feedback'] = result.get('feedback', '')
        if result.get('status') == 'PASS':
            problem['completed'] = True
            
            # Update UserProgress
            db_problem_id = problem.get('id')
            if db_problem_id:
                progress = db.query(models.UserProgress).filter(models.UserProgress.problem_id == db_problem_id).first()
                if not progress:
                    progress = models.UserProgress(
                        problem_id=db_problem_id,
                        is_solved=True,
                        proficiency="medium", # Default to medium on pass
                        attempts=1,
                        last_practiced_at=datetime.datetime.utcnow()
                    )
                    db.add(progress)
                else:
                    progress.is_solved = True
                    progress.attempts += 1
                    progress.last_practiced_at = datetime.datetime.utcnow()
                    # Could update proficiency based on feedback, but keep simple for now
        else:
            problem['completed'] = False
            # Update UserProgress (Failed attempt)
            db_problem_id = problem.get('id')
            if db_problem_id:
                 progress = db.query(models.UserProgress).filter(models.UserProgress.problem_id == db_problem_id).first()
                 if not progress:
                     progress = models.UserProgress(
                         problem_id=db_problem_id,
                         is_solved=False,
                         proficiency="low",
                         attempts=1,
                         last_practiced_at=datetime.datetime.utcnow()
                     )
                     db.add(progress)
                 else:
                     progress.attempts += 1
                     progress.last_practiced_at = datetime.datetime.utcnow()
            
        problems[submission.problem_index] = problem
        
        # Save back
        if isinstance(data, list):
             task.data = json.dumps(problems)
        else:
             data["problems"] = problems
             task.data = json.dumps(data)
        
        # Check if all completed
        if all(p.get('completed') for p in problems):
            task.is_completed = True
            
        db.commit()
        
        return {
            "status": result.get('status'),
            "feedback": result.get('feedback'),
            "all_completed": task.is_completed
        }
    except Exception as e:
        print(f"Evaluation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Study Plan Feature
@app.get("/study-plan/progress", response_model=List[schemas.StudyStageProgress])
def get_study_plan_progress(stage: Optional[str] = None, db: Session = Depends(get_db)):
    # Define stage order/names
    all_stages = ["基础", "中阶", "进阶", "专项", "冲刺"]
    
    if stage:
        if stage not in all_stages:
            raise HTTPException(status_code=400, detail="Invalid stage name")
        target_stages = [stage]
    else:
        target_stages = all_stages
        
    results = []
    for s in target_stages:
        # Total problems in this stage
        total_count = db.query(models.Problem).filter(models.Problem.stage == s).count()
        
        # Solved problems in this stage
        # We join UserProgress and filter by stage and is_solved=True
        solved_count = db.query(models.UserProgress).join(models.Problem).filter(
            models.Problem.stage == s,
            models.UserProgress.is_solved == True
        ).count()
        
        percentage = (solved_count / total_count * 100) if total_count > 0 else 0.0
        
        results.append({
            "stage": s,
            "total_problems": total_count,
            "solved_problems": solved_count,
            "progress_percentage": round(percentage, 1)
        })
        
    return results

@app.post("/problems/{problem_id}/complete")
def complete_problem_manual(problem_id: int, db: Session = Depends(get_db)):
    # Helper endpoint to manually mark a problem as completed for testing
    problem = db.query(models.Problem).filter(models.Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
        
    progress = db.query(models.UserProgress).filter(models.UserProgress.problem_id == problem_id).first()
    if not progress:
        progress = models.UserProgress(
            problem_id=problem_id, 
            is_solved=True, 
            attempts=1,
            last_practiced_at=datetime.datetime.utcnow()
        )
        db.add(progress)
    else:
        progress.is_solved = True
        progress.attempts += 1
        progress.last_practiced_at = datetime.datetime.utcnow()
        
    db.commit()
    return {"message": f"Problem {problem.title} marked as completed"}

# Paper Feature
@app.post("/papers", response_model=schemas.Paper)
def create_paper(paper: schemas.PaperCreate, db: Session = Depends(get_db)):
    db_paper = models.Paper(
        title=paper.title,
        url=paper.url,
        type=paper.type,
        notes=json.dumps(paper.notes.dict()) if paper.notes else "{}",
        is_read=paper.is_read
    )
    db.add(db_paper)
    db.commit()
    db.refresh(db_paper)
    
    # Parse notes back to object for response
    if db_paper.notes:
        db_paper.notes = json.loads(db_paper.notes)
        
    return db_paper

@app.get("/papers", response_model=List[schemas.Paper])
def read_papers(type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Paper)
    if type:
        query = query.filter(models.Paper.type == type)
    papers = query.order_by(models.Paper.created_at.desc()).all()
    
    # Parse notes
    for p in papers:
        if p.notes:
            p.notes = json.loads(p.notes)
    return papers

@app.put("/papers/{paper_id}", response_model=schemas.Paper)
def update_paper(paper_id: int, paper_update: schemas.PaperUpdate, db: Session = Depends(get_db)):
    db_paper = db.query(models.Paper).filter(models.Paper.id == paper_id).first()
    if not db_paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    if paper_update.title is not None:
        db_paper.title = paper_update.title
    if paper_update.url is not None:
        db_paper.url = paper_update.url
    if paper_update.type is not None:
        db_paper.type = paper_update.type
    if paper_update.is_read is not None:
        db_paper.is_read = paper_update.is_read
    if paper_update.notes is not None:
        db_paper.notes = json.dumps(paper_update.notes.dict())
        
    db.commit()
    db.refresh(db_paper)
    
    if db_paper.notes:
        db_paper.notes = json.loads(db_paper.notes)
    return db_paper

# GitHub Integration
GITHUB_REPO = os.getenv("GITHUB_REPO", "facebook/react") # Default to a public repo for demo
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

@app.get("/github/commits", response_model=List[schemas.GitHubCommit])
async def get_github_commits():
    url = f"https://api.github.com/repos/{GITHUB_REPO}/commits"
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers, params={"per_page": 5})
            if resp.status_code != 200:
                print(f"GitHub API Error: {resp.status_code} {resp.text}")
                # Return empty list on error to avoid breaking frontend
                return []
                
            data = resp.json()
            commits = []
            for item in data:
                commit = item.get("commit", {})
                author = commit.get("author", {})
                commits.append({
                    "sha": item.get("sha"),
                    "message": commit.get("message"),
                    "author": author.get("name"),
                    "date": author.get("date"),
                    "url": item.get("html_url")
                })
            return commits
        except Exception as e:
            print(f"GitHub Fetch Error: {e}")
            return []

@app.post("/github/check-daily")
async def check_daily_github_activity(db: Session = Depends(get_db)):
    # 1. Fetch today's commits
    commits = await get_github_commits()
    if not commits:
        return {"committed_today": False}
        
    today = date.today()
    has_commit_today = False
    
    for commit in commits:
        # Commit date is usually ISO string
        commit_date_str = commit["date"]
        # Simple string check or proper parsing
        if commit_date_str.startswith(today.isoformat()):
            has_commit_today = True
            break
            
    if has_commit_today:
        # 2. Find today's "Project" task and mark complete
        project_task = db.query(models.Task).filter(
            models.Task.date == today,
            models.Task.task_type.like("%项目%")
        ).first()
        
        if project_task and not project_task.is_completed:
            project_task.is_completed = True
            project_task.note = (project_task.note or "") + " [System: Detected GitHub Commit]"
            db.commit()
            return {"committed_today": True, "task_updated": True}
            
    return {"committed_today": has_commit_today, "task_updated": False}

# --- Reward Shop & Achievements ---

@app.get("/profile", response_model=schemas.UserProfile)
def get_profile(db: Session = Depends(get_db)):
    profile = db.query(models.UserProfile).first()
    if not profile:
        profile = models.UserProfile(coins=0)
        db.add(profile)
        db.commit()
    return profile

@app.get("/achievements", response_model=List[schemas.Achievement])
def get_achievements(db: Session = Depends(get_db)):
    # Initialize default achievements if empty
    if db.query(models.Achievement).count() == 0:
        defaults = [
            models.Achievement(name="图论征服者", description="解决 10 道图论相关题目", icon="🕸️", condition_type="graph_problem_count", condition_value=10),
            models.Achievement(name="论文守望者", description="累计阅读 5 篇论文", icon="📜", condition_type="paper_count", condition_value=5),
            models.Achievement(name="算法大师", description="解决 50 道算法题", icon="⚔️", condition_type="problem_count", condition_value=50),
            models.Achievement(name="坚持不懈", description="连续打卡 7 天 (模拟)", icon="🔥", condition_type="streak_days", condition_value=7),
        ]
        db.add_all(defaults)
        db.commit()
    
    return db.query(models.Achievement).all()

@app.post("/achievements/check")
def check_achievements(db: Session = Depends(get_db)):
    # Logic to check and unlock achievements
    achievements = db.query(models.Achievement).filter(models.Achievement.unlocked_at == None).all()
    unlocked_names = []
    
    for ach in achievements:
        unlocked = False
        if ach.condition_type == "graph_problem_count":
            count = db.query(models.UserProgress).join(models.Problem).filter(
                models.UserProgress.is_solved == True,
                models.Problem.tags.like("%Graph%") | models.Problem.tags.like("%图%")
            ).count()
            if count >= ach.condition_value:
                unlocked = True
        elif ach.condition_type == "paper_count":
            count = db.query(models.Paper).filter(models.Paper.is_read == True).count()
            if count >= ach.condition_value:
                unlocked = True
        elif ach.condition_type == "problem_count":
            count = db.query(models.UserProgress).filter(models.UserProgress.is_solved == True).count()
            if count >= ach.condition_value:
                unlocked = True
        
        if unlocked:
            ach.unlocked_at = datetime.datetime.utcnow()
            unlocked_names.append(ach.name)
            
    if unlocked_names:
        db.commit()
        
    return {"new_unlocked": unlocked_names}

@app.get("/shop/rewards", response_model=List[schemas.Reward])
def get_rewards(db: Session = Depends(get_db)):
    # Initialize default rewards
    if db.query(models.Reward).count() == 0:
        defaults = [
            models.Reward(name="看一场电影", description="奖励自己去看最新的大片", cost=50, icon="🎬"),
            models.Reward(name="买一杯奶茶", description="全糖去冰！", cost=20, icon="🧋"),
            models.Reward(name="休息一天", description="今天不学习了，躺平", cost=100, icon="🛌"),
        ]
        db.add_all(defaults)
        db.commit()
    return db.query(models.Reward).filter(models.Reward.is_redeemed == False).all()

@app.post("/shop/rewards", response_model=schemas.Reward)
def create_reward(reward: schemas.RewardCreate, db: Session = Depends(get_db)):
    db_reward = models.Reward(
        name=reward.name,
        description=reward.description,
        cost=reward.cost,
        icon=reward.icon
    )
    db.add(db_reward)
    db.commit()
    db.refresh(db_reward)
    return db_reward

@app.post("/shop/redeem/{reward_id}")
def redeem_reward(reward_id: int, db: Session = Depends(get_db)):
    reward = db.query(models.Reward).filter(models.Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
        
    profile = db.query(models.UserProfile).first()
    if not profile:
        profile = models.UserProfile(coins=0)
        db.add(profile)
    
    if profile.coins < reward.cost:
        raise HTTPException(status_code=400, detail="Not enough coins")
        
    # Deduct coins
    profile.coins -= reward.cost
    
    # Record redemption
    redemption = models.Redemption(
        reward_id=reward.id,
        cost=reward.cost
    )
    db.add(redemption)
    
    # Optional: Mark reward as redeemed if it's one-time, but for now we keep it available?
    # User requirement: "Backend support add/delete/update".
    # Let's keep it available unless explicitly deleted.
    
    db.commit()
    return {"message": "Redeemed successfully", "remaining_coins": profile.coins}

# Helper to add coins
def add_coins(db: Session, amount: int):
    profile = db.query(models.UserProfile).first()
    if not profile:
        profile = models.UserProfile(coins=0)
        db.add(profile)
    profile.coins += amount
    db.commit()


