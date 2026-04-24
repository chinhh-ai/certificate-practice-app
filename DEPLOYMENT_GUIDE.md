# 🚀 Complete Deployment Guide

An advanced, step-by-step guide to deploy your Certificate Practice App to production with auto-deployment.

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ GitHub account: https://github.com
- ✅ Vercel account: https://vercel.com
- ✅ Node.js 20+ installed
- ✅ Git installed
- ✅ Backend hosting account (Render, Railway, or similar)
- ✅ PostgreSQL database service (Vercel Postgres, Railway, or Neon)

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   GitHub Repository                 │
│  (Source code + auto-deployment triggers)           │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼──┐     ┌──▼──┐     ┌──▼──┐
    │Vercel│     │Render │   │Neon/Railway│
    │-Front│     │-Backend│  │-Database│
    └──────┘     └───────┘   └────────┘
```

---

## 🔑 Step 1: Create GitHub Repository

### 1.1 Create Repository on GitHub

1. Go to https://github.com/new
2. Enter repository name: `certificate-practice-app`
3. Add description: "A scalable certification practice platform with AI-powered learning"
4. Choose **Private** or **Public**
5. Do NOT initialize with README (we have one)
6. Click **Create repository**

### 1.2 Create GitHub Personal Access Token (PAT)

1. Go to https://github.com/settings/tokens/new
2. Token name: `deployment-token`
3. Expiration: Select appropriate duration
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Click **Generate token**
6. **⚠️ Copy and save this token immediately** (you won't see it again!)

### 1.3 Verify Git Configuration

```bash
# Check git config
git config --global user.name
git config --global user.email

# If not set, configure:
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

---

## 📤 Step 2: Push Code to GitHub

### 2.1 Quick Method (Using Script)

**Windows:**
```bash
cd "path\to\Certificate practice app"
.\deploy.bat
```

**Mac/Linux:**
```bash
cd "path/to/Certificate practice app"
bash deploy.sh
```

### 2.2 Manual Method

```bash
# Navigate to project
cd "path/to/Certificate practice app"

# Add GitHub remote (replace YOUR_USERNAME and YOUR_PAT)
git remote add origin https://YOUR_PAT@github.com/YOUR_USERNAME/certificate-practice-app.git

# Verify remote
git remote -v

# Push code
git push -u origin master

# Verify on GitHub
# Visit: https://github.com/YOUR_USERNAME/certificate-practice-app
```

---

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Initial Deployment Setup

```bash
cd frontend
vercel login
# Follow prompts to authenticate with Vercel

# First deployment
vercel
# Choose:
# - Set up and deploy? → Yes
# - Project name → certificate-app (or your choice)
# - Scope → Your username/team
# - Link to existing project? → No
# - Root directory → ./
```

### 3.3 Production Deployment

```bash
cd frontend
vercel --prod
```

### 3.4 Get Vercel URL

After deployment, Vercel will provide your URL:
- Format: `https://certificate-app.vercel.app`
- Check Vercel Dashboard: https://vercel.com/dashboard

### 3.5 Configure Environment Variables in Vercel

1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url.com` | Production |

4. Redeploy for changes to take effect

---

## 🔧 Step 4: Deploy Backend to Render

### 4.1 Create Render Account

1. Visit https://render.com
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

### 4.2 Deploy Backend Service

1. **New** → **Web Service**
2. Connect your GitHub repository
3. Configure service:
   - **Name**: `certificate-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free (or paid for production)

4. **Advanced Settings**:
   - Python Version: `3.11`
   - Add Environment Variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AI_CORE_URL` | AI Core service URL |
| `LLM_PROVIDER` | `openai` |
| `OPENAI_API_KEY` | Your OpenAI API key |

5. Click **Create Web Service**

### 4.3 Deploy AI Core Service

Repeat the process for AI Core:
1. **New** → **Web Service**
2. Select same repository
3. Configure:
   - **Name**: `certificate-ai-core`
   - **Root Directory**: `ai-core`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Environment Variables**:

| Key | Value |
|-----|-------|
| `LLM_PROVIDER` | `openai` |
| `OPENAI_API_KEY` | Your API key |
| `OPENAI_API_BASE` | https://api.openai.com/v1 |

### 4.4 Get Backend URLs

- Backend URL: `https://certificate-backend.render.com`
- AI Core URL: `https://certificate-ai-core.render.com`

Update in Vercel environment variables:
```
NEXT_PUBLIC_API_URL=https://certificate-backend.render.com
```

---

## 🗄️ Step 5: Deploy PostgreSQL Database

### Option A: Vercel Postgres (Recommended for Vercel)

1. Vercel Dashboard → **Storage** → **Create Database**
2. Select **Postgres**
3. Name: `certificate-db`
4. Choose region nearest to you
5. Click **Create**
6. Copy **Connection String** (starts with `postgres://`)
7. Add to backend environment variables

### Option B: Neon (Fast, Serverless)

1. Visit https://neon.tech
2. Sign up and create project
3. Create database:
   - Database name: `certidb`
   - Owner: `postgres`
4. Get connection string from **Connection Details**
5. Format: `postgresql://user:password@host/certidb`

### Option C: Railway

1. Visit https://railway.app
2. Create new project
3. Add PostgreSQL plugin
4. Configure and get connection string

### 5.1 Initialize Database Schema

1. In Render backend settings, run initialization:
   ```bash
   python migrate_v3.py
   ```

2. Or use direct SQL commands through your database admin panel

---

## ✅ Step 6: Create GitHub Actions for Auto-Deployment

### 6.1 Create Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel and Render

on:
  push:
    branches: [master, main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy Frontend to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
        run: |
          npm install -g vercel
          vercel --prod --token=$VERCEL_TOKEN

      - name: Deploy Backend via Render Webhook
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_WEBHOOK }}
```

### 6.2 Add GitHub Secrets

1. Repository → Settings → **Secrets and variables** → **Actions**
2. Add new secrets:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Get from: https://vercel.com/account/tokens |
| `VERCEL_PROJECT_ID` | From Vercel project settings |
| `VERCEL_ORG_ID` | Your Vercel organization ID |
| `RENDER_DEPLOY_WEBHOOK` | From Render deploy hook |

### 6.3 Get Webhooks

**Vercel Token**: 
- https://vercel.com/account/tokens
- Create new token

**Render Deploy Webhook**:
- Render Dashboard → Backend Service → Settings
- **Deploy Hook** → Create hook
- Copy URL

---

## 🔐 Step 7: Security Checklist

### Environment Variables

✅ Never commit `.env` files  
✅ Use `.env.example` as template  
✅ Store all secrets in hosting platform  
✅ Rotate API keys periodically  
✅ Create separate tokens for each service  

### Production Hardening

```python
# backend/main.py - Add these settings in production
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    # Enable HTTPS only
    app.add_middleware(HTTPSRedirectMiddleware)
    # Add security headers
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["yourdomain.com"])
```

### CORS Configuration

Update CORS for production:

```python
# backend/main.py
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:6005").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🧪 Step 8: Testing Deployment

### 8.1 Test Frontend

```bash
# Visit your Vercel URL
open https://your-app.vercel.app

# Check console for errors
# Test all pages: Dashboard, Upload, Exams, Practice, Review
```

### 8.2 Test Backend

```bash
# Test API health
curl https://your-backend.render.com/

# Test with sample questions
curl -X GET https://your-backend.render.com/subjects
```

### 8.3 Test Database

```bash
# Check connection from backend logs
# Verify tables created:
# - subjects
# - questions
# - users
# - exams
# - attempts
# - exam_results
```

### 8.4 Full Integration Test

1. Upload a question file (PDF/JSON)
2. Create an exam
3. Take practice test
4. Review results
5. Check analytics

---

## 🆘 Troubleshooting

### "Connection refused" - Database
**Solution**: Check DATABASE_URL in environment variables  
**Check**: `psql $DATABASE_URL -c "SELECT 1"`

### "AI Core not responding"
**Solution**: Verify AI_CORE_URL in backend env  
**Check**: `curl $AI_CORE_URL/health`

### "Frontend API errors"
**Solution**: Check NEXT_PUBLIC_API_URL in Vercel  
**Action**: Redeploy frontend after updating vars

### "Build failures"
**Check logs** on hosting platform
**Common issues**:
- Missing environment variables
- Python/Node version mismatch
- Missing dependencies in requirements.txt

### "502 Bad Gateway"
**Causes**: Backend crashed or not responding  
**Fix**: Check backend logs, restart service

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Add to cron job (check every 5 minutes)
curl -f https://your-app.vercel.app/api/health || alert
```

### Log Management

- **Frontend**: Vercel Dashboard → Logs
- **Backend**: Render Dashboard → Logs
- **Database**: PostgreSQL admin console

### Backup Strategy

```bash
# Daily backup of PostgreSQL
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Store S3 or cloud backup
```

---

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **Next.js**: https://nextjs.org/docs
- **PostgreSQL**: https://www.postgresql.org/docs

---

## 🎉 Completion Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] AI Core deployed to Render
- [ ] PostgreSQL database connected
- [ ] Environment variables configured
- [ ] GitHub Actions workflow set up
- [ ] All tests passing
- [ ] Domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring set up

---

**Congratulations! Your app is now live and auto-deploying!** 🚀

For questions or issues, check the [README.md](../README.md) or project issues.
