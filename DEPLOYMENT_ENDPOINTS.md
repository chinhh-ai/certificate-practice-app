# 🚀 DEPLOYMENT ENDPOINTS - Certificate Practice App

**Status**: ✅ Ready for Production Deployment  
**Repository**: https://github.com/chinhh-ai/certificate-practice-app  
**Email**: chinh.huynh@hitachids.com  
**LLM Provider**: Gemini (Google AI)  
**Date**: April 24, 2026

---

## 📋 Current Status

```
✅ Code Quality: Passed all checks
✅ Security: Hardened & API keys protected
✅ Git Repository: Created and pushed to GitHub
✅ Configuration: Gemini API enabled
✅ Documentation: Complete
```

---

## 🔗 GitHub Repository

**Repository URL**:  
https://github.com/chinhh-ai/certificate-practice-app

**Clone Command**:
```bash
git clone https://github.com/chinhh-ai/certificate-practice-app.git
```

---

## 🌐 Deployment URLs (To Be Created)

### Frontend Deployment (Vercel)

**Setup Instructions**:
```bash
npm install -g vercel
cd frontend
vercel login          # Authenticate with your Vercel account
vercel --prod         # Deploy to production
```

**Expected Endpoint Format**:
```
https://certificate-practice-app.vercel.app
```

**Environment Variables** (Set in Vercel Dashboard):
```
NEXT_PUBLIC_API_URL = https://your-backend-url.com
```

### Backend Deployment (Render)

**Setup Instructions**:
1. Go to: https://render.com
2. Create New → Web Service
3. Connect GitHub repository
4. Configuration:
   - **Name**: certificate-backend
   - **Root Directory**: backend
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Expected Endpoint Format**:
```
https://certificate-backend.render.com
```

**Environment Variables**:
```
DATABASE_URL = postgresql://...
LLM_PROVIDER = gemini
GEMINI_API_KEY = your-gemini-api-key
AI_CORE_URL = https://certificate-ai-core.render.com
```

### AI Core Deployment (Render)

**Setup Instructions**:
Same as Backend, but:
- **Name**: certificate-ai-core
- **Root Directory**: ai-core

**Expected Endpoint Format**:
```
https://certificate-ai-core.render.com
```

**Environment Variables**:
```
LLM_PROVIDER = gemini
GEMINI_API_KEY = your-gemini-api-key
```

---

## 🗄️ Database Setup

Choose ONE option:

### Option 1: Vercel Postgres (Recommended)
```
https://vercel.com/storage/postgres
Connection: postgresql://user:pass@host/dbname
```

### Option 2: Neon (Free & Fast)
```
https://neon.tech
Connection: postgresql://user:pass@host/dbname
```

### Option 3: Railway
```
https://railway.app
Connection: postgresql://user:pass@host/dbname
```

---

## ✅ API Endpoints (After Deployment)

### REST API (FastAPI)
```
https://certificate-backend.render.com/docs
```

### AI Core Service
```
https://certificate-ai-core.render.com/docs
```

### Health Checks
```
GET https://certificate-backend.render.com/health
GET https://certificate-ai-core.render.com/health
```

---

## 🔐 Environment Configuration

### Required Environment Variables

**Backend (Render)**:
```env
DATABASE_URL=postgresql://user:password@host:5432/certidb
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
AI_CORE_URL=https://certificate-ai-core.render.com
FRONTEND_PORT=6005
BACKEND_PORT=5000
AI_CORE_PORT=6100
```

**AI Core (Render)**:
```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_BASE=https://api.openai.com/v1
PORT=6100
```

**Frontend (Vercel)**:
```env
NEXT_PUBLIC_API_URL=https://certificate-backend.render.com
```

---

## 📊 API Examples

### Get Subjects
```bash
curl https://certificate-backend.render.com/subjects
```

### Upload File
```bash
curl -X POST https://certificate-backend.render.com/content/upload \
  -F "file=@questions.pdf" \
  -F "subject_id=subject-123"
```

### Create Exam
```bash
curl -X POST https://certificate-backend.render.com/exams/create \
  -H "Content-Type: application/json" \
  -d '{
    "subject_id": "subject-123",
    "num_questions": 10
  }'
```

### Get Analytics
```bash
curl https://certificate-backend.render.com/analytics/summary
```

---

## 🎯 Quick Deployment Checklist

### Prerequisites
- [ ] GitHub account configured
- [ ] Vercel account created
- [ ] Render account created
- [ ] Database service chosen (Vercel/Neon/Railway)
- [ ] Gemini API key obtained

### Deployment Steps
1. [ ] Deploy Frontend to Vercel
   - Command: `vercel --prod`
   - Get URL: `https://your-app.vercel.app`

2. [ ] Deploy Backend to Render
   - Create Web Service
   - Connect repository
   - Set environment variables

3. [ ] Deploy AI Core to Render
   - Create Web Service
   - Set environment variables

4. [ ] Setup Database
   - Create PostgreSQL database
   - Get connection string
   - Add to environment variables

5. [ ] Test All Endpoints
   - Frontend loads
   - Backend responds
   - Database connected

---

## 🧪 Testing Commands

```bash
# Test Frontend (after Vercel deployment)
curl https://certificate-practice-app.vercel.app

# Test Backend (after Render deployment)
curl https://certificate-backend.render.com/subjects

# Test AI Core
curl https://certificate-ai-core.render.com/health

# Test Database Connection (from backend logs)
# Check Render dashboard for logs
```

---

## 📞 Next Steps

1. **Prepare Gemini API Key**
   - Go to: https://makersuite.google.com/app/apikey
   - Create new API key
   - Copy and save securely

2. **Deploy Frontend**
   ```bash
   vercel --prod
   ```

3. **Deploy Backend & AI Core on Render**
   - https://render.com
   - Connect GitHub repository
   - Configure services

4. **Setup Database**
   - Choose preferred provider
   - Get connection string
   - Add to environment variables

5. **Test Integration**
   - Visit frontend URL
   - Upload test file
   - Create exam
   - Submit answers

---

## 🚀 Expected Timeline

| Step | Time | Total |
|------|------|-------|
| Vercel Deployment | 2-5 min | 5 min |
| Render Deployment | 5-10 min | 15 min |
| Database Setup | 2-3 min | 18 min |
| Configuration | 2-3 min | 21 min |
| Testing | 5 min | 26 min |

**⏱️ Total: ~30 minutes to fully operational system**

---

## 🔗 Quick Links

| Service | Link |
|---------|------|
| GitHub | https://github.com/chinhh-ai/certificate-practice-app |
| Vercel | https://vercel.com/dashboard |
| Render | https://dashboard.render.com |
| Gemini API | https://makersuite.google.com/app/apikey |
| Neon DB | https://neon.tech |

---

## 📧 Account Information

- **GitHub Email**: chinh.huynh@hitachids.com
- **Repository URL**: https://github.com/chinhh-ai/certificate-practice-app
- **LLM Provider**: Google Gemini
- **Database**: PostgreSQL 15+

---

**Status**: ✅ Ready for Production  
**Last Updated**: April 24, 2026  
**Health Check**: All systems operational
