@echo off
chcp 65001 >nul
title Convert2UTF8 开发环境启动器

echo.
echo ========================================
echo      Convert2UTF8 开发环境启动器
echo ========================================
echo.

echo 检查项目状态...
if not exist frontend\node_modules (
    echo 前端依赖未安装，正在安装...
    cd frontend
    call npm install
    cd ..
)

if not exist backend\node_modules (
    echo 后端依赖未安装，正在安装...
    cd backend
    call npm install
    cd ..
)

if not exist epub-service\venv (
    echo EPUB微服务Python环境未安装，正在创建...
    cd epub-service
    python -m venv venv
    if %errorlevel% neq 0 (
        echo ❌ 创建虚拟环境失败，尝试使用系统Python直接安装依赖...
        pip install -r requirements.txt
        cd ..
        goto :skip_venv
    )
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
) else (
    echo EPUB微服务Python环境已存在
)
:skip_venv

echo.
echo 检查端口占用...
netstat -an | findstr ":3000" >nul
if %errorlevel%==0 (
    echo ⚠ 警告：端口3000被占用，前端服务可能无法启动
)

netstat -an | findstr ":3001" >nul
if %errorlevel%==0 (
    echo ⚠ 警告：端口3001被占用，后端服务可能无法启动
)

netstat -an | findstr ":5001" >nul
if %errorlevel%==0 (
    echo ⚠ 警告：端口5001被占用，EPUB微服务可能无法启动
)

echo.
echo 启动开发环境...
echo 前端服务: http://localhost:3000
echo 后端服务: http://localhost:3001
echo EPUB微服务: http://localhost:5001
echo.

echo 正在启动EPUB微服务...
if exist epub-service\venv (
    start "EPUB微服务" cmd /k "cd epub-service && venv\Scripts\activate.bat && python app.py"
) else (
    start "EPUB微服务" cmd /k "cd epub-service && python app.py"
)

echo 等待EPUB微服务启动...
timeout /t 3 /nobreak >nul

echo 正在启动后端服务...
start "后端服务" cmd /k "cd backend && npm run dev"

echo 等待后端服务启动...
timeout /t 3 /nobreak >nul

echo 正在启动前端服务...
start "前端服务" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo 开发环境启动完成！
echo ========================================
echo.
echo 前端页面: http://localhost:3000
echo 后端API:  http://localhost:3001
echo EPUB微服务: http://localhost:5001
echo.
echo 提示：
echo - 前端服务启动可能需要几分钟时间
echo - 如果页面无法访问，请等待服务完全启动
echo - 按 Ctrl+C 可以停止服务
echo.
pause 