@echo off
chcp 65001 >nul
title Convert2UTF8 项目管理工具

:menu
cls
echo.
echo ========================================
echo        Convert2UTF8 项目管理工具
echo ========================================
echo.
echo 请选择要执行的操作：
echo.
echo 1. 创建项目目录结构
echo 2. 配置npm镜像源（阿里云）
echo 3. 安装项目依赖
echo 4. 清理并重新安装依赖
echo 5. 启动后端服务
echo 6. 启动前端服务
echo 7. 启动完整开发环境（前后端）
echo 8. 查看项目状态
echo 9. 退出
echo.
echo ========================================
echo.

set /p choice=请输入选项 (1-9): 

if "%choice%"=="1" goto setup_project
if "%choice%"=="2" goto setup_npm
if "%choice%"=="3" goto install_deps
if "%choice%"=="4" goto clean_install
if "%choice%"=="5" goto start_backend
if "%choice%"=="6" goto start_frontend
if "%choice%"=="7" goto start_all
if "%choice%"=="8" goto show_status
if "%choice%"=="9" goto exit
goto menu

:setup_project
cls
echo.
echo 正在创建项目目录结构...
echo.

REM 创建前端目录结构
echo 创建前端目录...
if not exist frontend\src\components mkdir frontend\src\components
if not exist frontend\src\services mkdir frontend\src\services
if not exist frontend\src\types mkdir frontend\src\types
if not exist frontend\src\utils mkdir frontend\src\utils
if not exist frontend\public mkdir frontend\public

REM 创建后端目录结构
echo 创建后端目录...
if not exist backend\src\controllers mkdir backend\src\controllers
if not exist backend\src\services mkdir backend\src\services
if not exist backend\src\middleware mkdir backend\src\middleware
if not exist backend\src\types mkdir backend\src\types
if not exist backend\src\utils mkdir backend\src\utils
if not exist backend\uploads mkdir backend\uploads
if not exist backend\converted mkdir backend\converted

echo.
echo 项目目录结构创建完成！
echo.
pause
goto menu

:setup_npm
cls
echo.
echo 配置npm使用阿里镜像源...
echo.

echo 设置npm registry为阿里镜像...
call npm config set registry https://registry.npmmirror.com/

echo.
echo 设置其他相关配置...
call npm config set disturl https://registry.npmmirror.com/nodejs-release/
call npm config set sass_binary_site https://registry.npmmirror.com/node-sass/
call npm config set electron_mirror https://registry.npmmirror.com/electron/
call npm config set puppeteer_download_host https://registry.npmmirror.com/chromium-browser-snapshots/

echo.
echo 验证配置...
call npm config get registry

echo.
echo npm源配置完成！
echo 当前使用的registry: https://registry.npmmirror.com/
echo.
pause
goto menu

:install_deps
cls
echo.
echo 正在安装项目依赖...
echo.

echo 配置npm使用阿里镜像源...
call npm config set registry https://registry.npmmirror.com/

echo.
echo 安装前端依赖...
cd frontend
call npm install
cd ..

echo.
echo 安装后端依赖...
cd backend
call npm install
cd ..

echo.
echo 所有依赖安装完成！
echo.
pause
goto menu

:clean_install
cls
echo.
echo 清理之前的安装...

echo.
echo 删除前端node_modules...
if exist frontend\node_modules (
    rmdir /s /q frontend\node_modules
)

echo.
echo 删除前端package-lock.json...
if exist frontend\package-lock.json (
    del frontend\package-lock.json
)

echo.
echo 删除后端node_modules...
if exist backend\node_modules (
    rmdir /s /q backend\node_modules
)

echo.
echo 删除后端package-lock.json...
if exist backend\package-lock.json (
    del backend\package-lock.json
)

echo.
echo 清理完成，开始重新安装...
echo.

call :install_deps
goto menu

:start_backend
cls
echo.
echo 启动后端服务...
echo 后端服务将在 http://localhost:3001 启动
echo 按 Ctrl+C 停止服务
echo.
cd backend
call npm run dev
cd ..
goto menu

:start_frontend
cls
echo.
echo 启动前端服务...
echo 前端服务将在 http://localhost:3000 启动
echo 按 Ctrl+C 停止服务
echo.
cd frontend
call npm start
cd ..
goto menu

:start_all
cls
echo.
echo 启动完整开发环境...
echo 前端: http://localhost:3000
echo 后端: http://localhost:3001
echo.
echo 正在启动后端服务...
start "后端服务" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
echo 正在启动前端服务...
start "前端服务" cmd /k "cd frontend && npm start"
echo.
echo 开发环境启动完成！
echo 请等待服务完全启动后访问前端页面
echo.
pause
goto menu

:show_status
cls
echo.
echo ========================================
echo           项目状态检查
echo ========================================
echo.

echo 检查目录结构...
if exist frontend\src\components (
    echo ✓ 前端目录结构完整
) else (
    echo ✗ 前端目录结构不完整
)

if exist backend\src\controllers (
    echo ✓ 后端目录结构完整
) else (
    echo ✗ 后端目录结构不完整
)

echo.
echo 检查依赖安装...
if exist frontend\node_modules (
    echo ✓ 前端依赖已安装
) else (
    echo ✗ 前端依赖未安装
)

if exist backend\node_modules (
    echo ✓ 后端依赖已安装
) else (
    echo ✗ 后端依赖未安装
)

echo.
echo 检查配置文件...
if exist frontend\package.json (
    echo ✓ 前端配置文件存在
) else (
    echo ✗ 前端配置文件缺失
)

if exist backend\package.json (
    echo ✓ 后端配置文件存在
) else (
    echo ✗ 后端配置文件缺失
)

echo.
echo 检查端口占用...
netstat -an | findstr ":3000" >nul
if %errorlevel%==0 (
    echo ⚠ 端口3000被占用（前端）
) else (
    echo ✓ 端口3000可用
)

netstat -an | findstr ":3001" >nul
if %errorlevel%==0 (
    echo ⚠ 端口3001被占用（后端）
) else (
    echo ✓ 端口3001可用
)

echo.
pause
goto menu

:exit
cls
echo.
echo 感谢使用 Convert2UTF8 项目管理工具！
echo.
exit /b 0 