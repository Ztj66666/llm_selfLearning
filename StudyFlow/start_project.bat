@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo       StudyFlow 一键启动脚本
echo ==========================================

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 检查后端配置
if not exist "backend\.env" (
    echo [警告] 未检测到 backend\.env 文件！
    echo 请在 backend 目录下创建 .env 文件并配置 DASHSCOPE_API_KEY
    echo.
)

echo [1/2] 正在启动后端服务 (Backend)...
cd backend

:: 检查/创建 Python 虚拟环境
if not exist "venv" (
    echo    - 未检测到虚拟环境，正在创建...
    python -m venv venv
    echo    - 正在安装依赖 (首次运行可能较慢)...
    venv\Scripts\pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
)

:: 在新窗口启动后端
start "StudyFlow Backend" cmd /k "venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8001"

echo [2/2] 正在启动前端服务 (Frontend)...
cd ..\frontend

:: 检查 Node 依赖
if not exist "node_modules" (
    echo    - 未检测到 Node 依赖，正在安装...
    call npm install --registry=https://registry.npmmirror.com
)

:: 在新窗口启动前端
start "StudyFlow Frontend" cmd /k "npm run dev"

echo.
echo ==========================================
echo    服务已启动！
echo.
echo    前端访问地址: http://localhost:3000
echo    后端API文档:  http://localhost:8001/docs
echo.
echo    请不要关闭弹出的两个 CMD 窗口
echo ==========================================
pause
