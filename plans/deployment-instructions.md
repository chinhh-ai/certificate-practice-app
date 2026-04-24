# Step-by-Step Deployment Instructions

## Prerequisites

- GitHub account (for connecting repositories)
- Vercel account (https://vercel.com/signup)
- Render account (https://render.com/signup)
- Supabase account (https://supabase.com/signup)
- OpenAI API key (already in your .env file)

---

## Phase 1: Set Up Supabase Database

### Step 1.1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - **Project Name**: certificate-practice-app
   - **Database Password**: (choose a strong password)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (for development)
4. Click "Create new project"

### Step 1.2: Get Database Connection String

1. In Supabase Dashboard, go to **Settings** > **Database**
2. Scroll to **Connection** section
3. Copy the **URI** connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Save this string - you'll need it for Render

### Step 1.3: Create Database Schema

If you have existing migrations, run them:

```bash
# Create a migrations folder in backend
mkdir backend/migrations
cd backend/migrations

# Create schema.sql with your table definitions
# (Copy from your existing database)
```

---

## Phase 2: Deploy Backend to Render

### Step 2.1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 2.2: Create Backend Service

1. Click **New** > **Plus** > **Web Service**
2. Connect your GitHub account
3. Select your repository
4. Configure:
   - **Name**: certificate-backend
   - **Root Directory**: `backend`
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free (for development)

### Step 2.3: Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

| Key | Value |
|-----|-------|
| DATABASE_URL | postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres |
| AI_CORE_URL | https://certificate-ai-core.onrender.com (will be created later) |
| PORT | 5000 |

### Step 2.4: Deploy

1. Click **Create Web Service**
2. Wait for build to complete (~5-10 minutes)
3. Copy the service URL (e.g., `https://certificate-backend.onrender.com`)

---

## Phase 3: Deploy AI Core to Render

### Step 3.1: Create AI Core Service

1. Click **New** > **Plus** > **Web Service**
2. Select your repository
3. Configure:
   - **Name**: certificate-ai-core
   - **Root Directory**: `ai-core`
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free (for development)

### Step 3.2: Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

| Key | Value |
|-----|-------|
| LLM_PROVIDER | openai |
| LLM_MODEL_NAME | gpt-5 |
| OPENAI_API_KEY | sk-S2R8gUZEpgseu8HSMguxXQ |
| OPENAI_API_BASE | https://your-openai-endpoint.com/v1 |
| PORT | 6100 |

**IMPORTANT**: Update `OPENAI_API_BASE` to a publicly accessible URL. The current value `http://172.18.16.59:4000/v1` is an internal IP and won't work from Render.

### Step 3.3: Deploy

1. Click **Create Web Service**
2. Wait for build to complete
3. Copy the service URL (e.g., `https://certificate-ai-core.onrender.com`)

### Step 3.4: Update Backend Environment

1. Go to Backend service in Render dashboard
2. Edit Environment variables
3. Update `AI_CORE_URL` to the new AI Core URL
4. Click **Save** (will trigger redeploy)

---

## Phase 4: Deploy Frontend to Vercel

### Step 4.1: Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 4.2: Create Vercel Project

1. Click **Add New Project**
2. Import your Git repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `.next`

### Step 4.3: Add Environment Variables

In Vercel dashboard, go to **Settings** > **Environment Variables**:

| Name | Value |
|------|-------|
| NEXT_PUBLIC_API_URL | https://certificate-backend.onrender.com/api |

### Step 4.4: Deploy

1. Click **Deploy**
2. Wait for build to complete (~3-5 minutes)
3. Copy the deployment URL (e.g., `https://certificate-practice-app.vercel.app`)

---

## Phase 5: Update Code for Production

### Step 5.1: Update Backend CORS

Edit `backend/main.py` to add CORS middleware:

```python
from fastapi.middleware.cors import CORSMiddleware

# Add this after creating your FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://certificate-practice-app.vercel.app",
        "https://your-custom-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 5.2: Update Frontend API URL

Edit `frontend/next.config.js`:

```javascript
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://certificate-backend.onrender.com/api"
  }
}

module.exports = nextConfig
```

### Step 5.3: Create vercel.json in frontend

Create `frontend/vercel.json`:

```json
{
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://certificate-backend.onrender.com/api"
  }
}
```

---

## Phase 6: Testing

### Test Checklist

1. **Frontend loads**: Visit your Vercel URL
2. **API connection**: Check browser console for API errors
3. **Upload document**: Test the upload feature
4. **Generate exam**: Test exam generation
5. **Practice mode**: Test practice questions
6. **Review mode**: Test review functionality

### Debugging Tips

If you encounter issues:

1. **Check Render logs**: Render Dashboard > Your Service > Logs
2. **Check Vercel logs**: Vercel Dashboard > Your Project > Deployments > Logs
3. **Check Supabase logs**: Supabase Dashboard > Logs
4. **Test API directly**: Use Postman or curl to test backend endpoints

---

## Phase 7: Custom Domain (Optional)

### Vercel Custom Domain

1. Go to Vercel Dashboard > Your Project > Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

### Render Custom Domain

1. Go to Render Dashboard > Your Service > Settings
2. Scroll to **Custom Domain**
3. Add your domain
4. Update DNS records

---

## Troubleshooting

### Issue: Backend can't connect to Supabase

**Solution**: 
- Verify DATABASE_URL format
- Check Supabase firewall settings (allow Render IPs)
- Test connection with psql

### Issue: CORS errors in browser

**Solution**:
- Update CORS origins in backend
- Include both HTTP and HTTPS URLs
- Clear browser cache

### Issue: Build fails on Render

**Solution**:
- Check requirements.txt has all dependencies
- Verify Python version compatibility
- Check build logs for specific errors

### Issue: Frontend can't reach backend

**Solution**:
- Verify NEXT_PUBLIC_API_URL is correct
- Check backend is running (not on free tier sleep)
- Test with curl: `curl https://certificate-backend.onrender.com/health`

---

## Post-Deployment Maintenance

### Regular Tasks

1. **Monitor logs**: Check for errors daily
2. **Update dependencies**: Run `pip install --upgrade -r requirements.txt` monthly
3. **Backup database**: Export Supabase data weekly
4. **Rotate API keys**: Change OpenAI key quarterly

### Scaling Considerations

If you need more resources:

| Service | Upgrade Option | Cost |
|---------|---------------|------|
| Vercel | Pro Plan | $20/month |
| Render | Starter | $7/month |
| Supabase | Pro Plan | $25/month |

---

## Quick Reference

### Service URLs (replace with your actual URLs)

```
Frontend: https://certificate-practice-app.vercel.app
Backend:  https://certificate-backend.onrender.com
AI Core:  https://certificate-ai-core.onrender.com
Database: postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

### Important Files

- `backend/main.py` - Add CORS middleware
- `frontend/next.config.js` - Update API URL
- `frontend/vercel.json` - Vercel configuration

### Commands

```bash
# Deploy to Vercel
cd frontend
vercel --prod

# Deploy to Render (via GitHub integration)
# No command needed - push to GitHub triggers deploy
```
