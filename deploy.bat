@echo off
REM ============================================================================
REM GitHub & Vercel Deployment Script for Windows
REM ============================================================================
REM This script helps you:
REM 1. Create a GitHub repository
REM 2. Push code to GitHub
REM 3. Deploy to Vercel
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Certificate Practice App - Deployment
echo ==========================================
echo.

REM Step 1: GitHub Setup
echo [Step 1] GitHub Repository Setup
echo You need to create a GitHub repository first.
echo Visit: https://github.com/new
echo.
set /p GITHUB_USERNAME=Enter your GitHub username: 
set /p REPO_NAME=Enter the repository name (e.g., certificate-practice-app): 
set /p GITHUB_TOKEN=Enter your GitHub personal access token (PAT): 

REM Validate inputs
if "%GITHUB_USERNAME%"=="" (
    echo Error: Missing GitHub username
    exit /b 1
)
if "%REPO_NAME%"=="" (
    echo Error: Missing repository name
    exit /b 1
)
if "%GITHUB_TOKEN%"=="" (
    echo Error: Missing GitHub token
    exit /b 1
)

set REPO_URL=https://%GITHUB_TOKEN%@github.com/%GITHUB_USERNAME%/%REPO_NAME%.git

echo.
echo Configuration:
echo   Repository: %GITHUB_USERNAME%/%REPO_NAME%
echo.

REM Step 2: Add Remote and Push
echo [Step 2] Pushing Code to GitHub
echo.

cd /d "%~dp0"

REM Remove existing remote if any
git remote remove origin 2>nul

REM Add new remote
git remote add origin %REPO_URL%

REM Push to main branch
echo Pushing code to GitHub...
git push -u origin master

if %errorlevel% neq 0 (
    echo Error: Failed to push code
    exit /b 1
)

echo.
echo Code pushed successfully!
echo.

REM Step 3: Vercel Setup
echo [Step 3] Vercel Deployment
echo Vercel deployment requires:
echo 1. A Vercel account (https://vercel.com)
echo 2. Vercel CLI installed (npm install -g vercel)
echo 3. GitHub repository linked to Vercel
echo.

set /p HAS_VERCEL=Have you installed Vercel CLI? (y/n): 
if /i "%HAS_VERCEL%"=="y" (
    set /p DEPLOY_NOW=Deploy frontend now? (y/n): 
    if /i "%DEPLOY_NOW%"=="y" (
        cd /d "%~dp0frontend"
        echo Deploying frontend to Vercel...
        call vercel --prod
        cd /d "%~dp0"
        echo.
        echo Frontend deployed!
    )
) else (
    echo Install Vercel CLI with: npm install -g vercel
)

echo.
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Set environment variables in Vercel:
echo    - NEXT_PUBLIC_API_URL (your backend URL)
echo    - DATABASE_URL (PostgreSQL connection)
echo.
echo 2. Deploy backend to a hosting service:
echo    - Render: https://render.com
echo    - Railway: https://railway.app
echo    - PythonAnywhere: https://www.pythonanywhere.com
echo.
echo 3. Deploy PostgreSQL database:
echo    - Vercel Postgres: https://vercel.com/storage/postgres
echo    - Railway: https://railway.app
echo    - Neon: https://neon.tech
echo.

pause
