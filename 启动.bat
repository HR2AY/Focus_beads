@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title Focus Beads 启动器
cd /d "%~dp0"

echo ================================================
echo         Focus Beads 一键启动工具
echo ================================================
echo.

:: ========== 检查 Node.js ==========
echo [1/4] 检查 Node.js...
node -v >nul 2>&1
if !errorlevel! neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    echo        下载地址: https://nodejs.org/
    goto :fail
)
for /f "tokens=*" %%i in ('node -v 2^>nul') do set "NODE_VER=%%i"
echo       [OK] Node.js !NODE_VER!

:: ========== 检查 pnpm ==========
echo [2/4] 检查 pnpm...
pnpm -v >nul 2>&1
if !errorlevel! neq 0 (
    echo       [提示] 未找到 pnpm，正在自动安装...
    call npm install -g pnpm
    pnpm -v >nul 2>&1
    if !errorlevel! neq 0 (
        echo [错误] pnpm 安装失败，请手动执行: npm install -g pnpm
        goto :fail
    )
)
for /f "tokens=*" %%i in ('pnpm -v 2^>nul') do set "PNPM_VER=%%i"
echo       [OK] pnpm !PNPM_VER!

:: ========== 检查依赖 ==========
echo [3/4] 检查依赖库...
if not exist "node_modules" (
    echo       [提示] 未找到依赖库，正在安装（首次可能需要几分钟）...
    call pnpm install
    if !errorlevel! neq 0 (
        echo [错误] 依赖安装失败，请检查网络后重试
        goto :fail
    )
    echo       [OK] 依赖安装完成
) else (
    echo       [OK] 依赖库已存在
)

:: ========== 启动开发服务器 ==========
echo [4/4] 启动开发服务器...
echo.
echo ================================================
echo   启动后浏览器将自动打开
echo   关闭此窗口即可停止服务
echo ================================================
echo.

timeout /t 2 /nobreak >nul
start "" http://localhost:5173/beads/

:: 直接在当前窗口运行 dev，关闭窗口即停止
pnpm dev
goto :eof

:fail
echo.
echo 按任意键退出...
pause >nul
exit /b 1
