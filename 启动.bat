@echo off
chcp 65001 >nul
title Focus Beads 启动器

echo ================================================
echo         Focus Beads 一键启动工具
echo ================================================
echo.

:: 检查 Node.js
echo [1/4] 检查 Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    echo        下载地址: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [OK] Node.js %NODE_VER%

:: 检查 pnpm
echo [2/4] 检查 pnpm...
pnpm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 未找到 pnpm，正在自动安装...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo [错误] pnpm 安装失败，请检查网络或手动执行: npm install -g pnpm
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VER=%%i
echo [OK] pnpm %PNPM_VER%

:: 检查 node_modules
echo [3/4] 检查依赖库...
if not exist "%~dp0node_modules" (
    echo [提示] 未找到依赖库，正在安装（首次可能需要几分钟）...
    cd /d "%~dp0"
    pnpm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败，请检查网络后重试
        pause
        exit /b 1
    )
    echo [OK] 依赖安装完成
) else (
    echo [OK] 依赖库已存在
)

:: 启动开发服务器
echo [4/4] 启动开发服务器...
echo.
echo ================================================
echo   服务启动后将自动打开浏览器
echo   按 Ctrl+C 可停止服务
echo ================================================
echo.

cd /d "%~dp0"
start "" cmd /c "pnpm dev"

:: 等待服务启动后打开浏览器
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo 服务已在后台运行，浏览器已自动打开
echo 关闭此窗口不会停止服务（请在另一个命令行窗口按 Ctrl+C 停止）
echo.
pause
