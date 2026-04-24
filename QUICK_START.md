# 🚀 Quick Deployment Guide

Get your Certificate Practice App running in production in **5 minutes**.

## Prerequisites (2 min)

1. **Create GitHub Account**: https://github.com/signup
2. **Create Vercel Account**: https://vercel.com/signup (use GitHub login)
3. **Create Render Account**: https://render.com (use GitHub login)
4. **Install Git**: https://git-scm.com

---

## Fast Track (5 min)

### Step 1: Create GitHub Repository (1 min)

```bash
# Initialize local repo (already done if you ran this script)
cd "path/to/Certificate practice app"

# View current status
git status

# If needed, configure git:
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### Step 2: Get GitHub Personal Access Token (1 min)

1. Go to: https://github.com/settings/tokens/new
2. Name it: `vercel-deployment`
3. Select scopes:
   - ✅ `repo` (full access)
   - ✅ `workflow`
4. **Copy the token immediately** (you can't see it again!)

### Step 3: Push Code to GitHub (1 min)

```bash
# Windows
.\deploy.bat

# Mac/Linux
bash deploy.sh
```

Or manually:
```bash
git remote add origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/certificate-practice-app.git
git push -u origin master
```

### Step 4: Deploy Frontend to Vercel (1 min)

**Option A: Connect GitHub to Vercel (Easy)**
1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Paste your GitHub repo URL
4. Vercel auto-deploys on each push! ✅

**Option B: CLI Deploy**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Step 5: Deploy Backend to Render (1 min)

1. Go to https://render.com/new
2. Create Web Service
3. Connect GitHub repo
4. Settings:
   - **Name**: `certificate-backend`
   - **Runtime**: Python 3.11
   - **Build**: `pip install -r requirements.txt`
   - **Start**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Dir**: `backend`

5. Add Environment Variables (Settings tab):
   ```
   DATABASE_URL=postgresql://user:pass@host/db
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-xxx
   ```

6. Click **Create Web Service** - auto-deploys! ✅

---

## All Done! 🎉

Your app is now:
- ✅ **Frontend**: Live on Vercel (auto-deploys on push)
- ✅ **Backend**: Live on Render (auto-deploys on push)
- ✅ **Code**: Stored on GitHub (with version history)

### Verify Deployment

```bash
# Test Frontend
open https://your-app.vercel.app

# Test Backend
curl https://certificate-backend.render.com/subjects

# View Logs
# Vercel: https://vercel.com/dashboard
# Render: https://dashboard.render.com
```

---

## 📦 What Gets Auto-Deployed?

When you `git push`:

```
Your laptop
     ↓
  git push to GitHub
     ↓
┌────┬───────────────────────┐
│ GitHub runs CI/CD tests    │
│ (frontend build, etc.)     │
└────┬───────────────────────┘
     ├─→ Vercel detects change
     │   ↓
     │   Redeploys Frontend ✅
     │   URL: https://your-app.vercel.app
     │
     └─→ Render detects change
         ↓
         Redeploys Backend ✅
         URL: https://certificate-backend.render.com
```

---

## 🔧 Environment Variables Needed

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://certificate-backend.render.com
```

### Backend (Render)
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
AI_CORE_URL=https://certificate-ai-core.render.com
```

### AI Core (Render)
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
```

---

## 🛠️ Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| **Build fails** | Check environment variables in hosting platform |
| **"API not found"** | Update `NEXT_PUBLIC_API_URL` in Vercel to match backend URL |
| **Database error** | Check `DATABASE_URL` format and connectivity |
| **503 Service Unavailable** | Backend may be spinning up, wait 30 seconds |

---

## 📊 Next Steps

1. **Set up monitoring**: Add health checks
2. **Add custom domain**: DNS configuration
3. **Enable SSL**: Automatic (Vercel/Render include it)
4. **Set up database backups**: Automated backups
5. **Monitor logs**: Check performance metrics

---

## 📚 Full Documentation

For detailed setup, see:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete step-by-step
- [README.md](./README.md) - Project overview
- `.env.example` - All environment variables

---

## 🆘 Need Help?

1. **Vercel Docs**: https://vercel.com/docs
2. **Render Docs**: https://render.com/docs
3. **GitHub Docs**: https://docs.github.com

---

**Congratulations! Your app is live! 🚀**

Every time you push code to `master` branch, it automatically redeploys.
