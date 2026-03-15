// 智能判断 API 地址
const getBaseUrl = () => {
  // 1. 如果配置了环境变量，优先使用
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. 如果是浏览器环境 (客户端渲染)
  if (typeof window !== 'undefined') {
    // 开发环境默认连接本地后端
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8001/api';
    }
    // 生产环境直连后端 Render 域名 (Fallback)
    return 'https://llm-selflearning.onrender.com/api';
  }

  // 3. 服务端渲染 (SSR) 环境
  // 在 Docker 内部网络中，前端容器通过服务名访问后端
  if (process.env.DOCKER_ENV) {
    return 'http://backend:8000/api';
  }

  return 'http://localhost:8001/api';
};

export const API_URL = getBaseUrl();

export async function getTasks(date: string) {
  const res = await fetch(`${API_URL}/tasks/${date}`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function getTaskHistory(taskType?: string) {
  const url = taskType 
    ? `${API_URL}/tasks/history?task_type=${encodeURIComponent(taskType)}`
    : `${API_URL}/tasks/history`;
    
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch task history');
  return res.json();
}

export async function updateTask(id: number, data: { is_completed?: boolean; note?: string }) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function getKnowledgeList(): Promise<string[]> {
  const res = await fetch(`${API_URL}/knowledge`);
  if (!res.ok) throw new Error('Failed to fetch knowledge list');
  return res.json();
}

export async function getKnowledgeContent(filename: string): Promise<{ content: string }> {
  const res = await fetch(`${API_URL}/knowledge/${filename}`);
  if (!res.ok) throw new Error('Failed to fetch knowledge content');
  return res.json();
}

export async function generateAlgoProblems(taskId: number) {
  const res = await fetch(`${API_URL}/tasks/${taskId}/generate-algo`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to generate algorithm problems');
  return res.json();
}

export async function submitAlgoProblem(taskId: number, problemIndex: number, code: string) {
  const res = await fetch(`${API_URL}/tasks/${taskId}/submit-algo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem_index: problemIndex, code }),
  });
  if (!res.ok) throw new Error('Failed to submit algorithm problem');
  return res.json();
}

// Paper API
export async function getPapers(type?: string) {
  const url = type ? `${API_URL}/papers?type=${type}` : `${API_URL}/papers`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch papers');
  return res.json();
}

export async function createPaper(paper: any) {
  const res = await fetch(`${API_URL}/papers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paper),
  });
  if (!res.ok) throw new Error('Failed to create paper');
  return res.json();
}

export async function updatePaper(id: number, paper: any) {
  const res = await fetch(`${API_URL}/papers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paper),
  });
  if (!res.ok) throw new Error('Failed to update paper');
  return res.json();
}

// GitHub API
export async function getGitHubCommits() {
  const res = await fetch(`${API_URL}/github/commits`);
  if (!res.ok) throw new Error('Failed to fetch commits');
  return res.json();
}

export async function checkDailyGitHub() {
  const res = await fetch(`${API_URL}/github/check-daily`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to check github activity');
  return res.json();
}

// Shop & Achievements
export async function getProfile() {
  const res = await fetch(`${API_URL}/profile`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function getAchievements() {
  const res = await fetch(`${API_URL}/achievements`);
  if (!res.ok) throw new Error('Failed to fetch achievements');
  return res.json();
}

export async function checkAchievements() {
  const res = await fetch(`${API_URL}/achievements/check`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to check achievements');
  return res.json();
}

export async function getRewards() {
  const res = await fetch(`${API_URL}/shop/rewards`);
  if (!res.ok) throw new Error('Failed to fetch rewards');
  return res.json();
}

export async function createReward(reward: any) {
  const res = await fetch(`${API_URL}/shop/rewards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reward),
  });
  if (!res.ok) throw new Error('Failed to create reward');
  return res.json();
}

export async function redeemReward(rewardId: number) {
  const res = await fetch(`${API_URL}/shop/redeem/${rewardId}`, { method: 'POST' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to redeem reward');
  }
  return res.json();
}

export async function getHeatmapStats() {
  const res = await fetch(`${API_URL}/stats/heatmap`);
  if (!res.ok) throw new Error('Failed to fetch heatmap');
  return res.json();
}

export async function generateQuiz(content: string) {
  const res = await fetch(`${API_URL}/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to generate quiz');
  return res.json();
}

export async function reviewQuiz(data: any) {
  const res = await fetch(`${API_URL}/review-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to review quiz');
  return res.json();
}
