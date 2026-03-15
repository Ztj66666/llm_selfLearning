# StudyFlow

学习任务管理系统

## 技术栈

- **Backend**: FastAPI, SQLite
- **Frontend**: Next.js, Tailwind CSS

## 目录结构

```
StudyFlow/
├── backend/            # FastAPI 后端
│   ├── main.py         # 入口文件 & API
│   ├── models.py       # 数据库模型
│   ├── schemas.py      # Pydantic 模型
│   ├── crud.py         # 数据库操作
│   ├── database.py     # 数据库连接
│   └── requirements.txt
└── frontend/           # Next.js 前端
    ├── app/            # 页面
    ├── components/     # 组件
    ├── lib/            # API 封装
    └── types/          # 类型定义
```

## 快速开始

### 1. 启动后端

确保已安装 Python 3.8+

```bash
cd backend

# (可选) 创建并激活虚拟环境
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn main:app --reload
```

后端服务将在 `http://localhost:8000` 运行。
API 文档可见于 `http://localhost:8000/docs`。

### 2. 启动前端

确保已安装 Node.js 18+

```bash
cd frontend

# 安装依赖 (如果尚未安装)
npm install

# 启动开发服务器
npm run dev
```

前端页面将在 `http://localhost:3000` 运行。

## 功能说明

1. **每日任务**: 系统会自动为每天生成 3 个固定任务（八股文、算法、项目）。
2. **打卡**: 点击“打卡”按钮标记完成。
3. **笔记**: 在文本框中输入心得或题号，失去焦点时自动保存。
4. **历史查看**: 可以通过右上角的日期选择器查看历史记录。
