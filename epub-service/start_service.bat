@echo off
echo ========================================
echo EPUB转换服务启动脚本
echo ========================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python 3.7+
    pause
    exit /b 1
)

echo Python版本检查通过
echo.

REM 检查依赖是否安装
echo 检查依赖包...
python -c "import flask, ebooklib, bs4, chardet" >nul 2>&1
if errorlevel 1 (
    echo 正在安装依赖包...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo 错误: 依赖包安装失败
        pause
        exit /b 1
    )
    echo 依赖包安装完成
) else (
    echo 依赖包检查通过
)

echo.
echo 启动EPUB转换服务...
echo 服务地址: http://localhost:5001
echo 按 Ctrl+C 停止服务
echo.

python app.py

pause 