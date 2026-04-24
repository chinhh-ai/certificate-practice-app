# Certificate Practice App - Vercel Deployment Plan

## Architecture Overview

```mermaid
graph TB
    User[User Browser] -->|HTTPS| Vercel[Vercel Frontend]
    Vercel -->|HTTPS| RenderBackend[Render Backend API]
    Vercel -->|HTTPS| RenderAICore[Render AI Core API]
    RenderBackend -->|PostgreSQL| Supabase[Supabase Database]
    RenderBackend -->|HTTPS| RenderAICore
    RenderAICore -->|HTTPS| OpenAI[OpenAI API]
```

## Service Breakdown

| Service | Platform | Purpose |
|---------|----------|---------|
| Frontend | Vercel | Next.js application |
| Backend API | Render | FastAPI REST API |
| AI Core | Render | FastAPI LLM/Parser service |
| Database | Supabase | PostgreSQL database |

## Environment Variables

### Vercel (Frontend)
```
NEXT_PUBLIC_API_URL=https://your-backend-render-url.com/api
```

### Render (Backend)
```
DATABASE_URL=postgresql://user:password@supabase-db-url:5432/certidb
AI_CORE_URL=https://your-ai-core-render-url.com
PORT=5000
```

### Render (AI Core)
```
LLM_PROVIDER=openai
LLM_MODEL_NAME=gpt-5
OPENAI_API_KEY=sk-your-openai-key
OPENAI_API_BASE=https://your-openai-endpoint.com/v1
PORT=6100
```

## Deployment Steps

### 1. Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Note your database connection string (found in Settings > Database > Connection)
3. Run database migrations (if any)

### 2. Deploy Backend to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (DATABASE_URL, AI_CORE_URL, PORT)
5. Deploy

### 3. Deploy AI Core to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `ai-core`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (LLM_PROVIDER, LLM_MODEL_NAME, OPENAI_API_KEY, OPENAI_API_BASE, PORT)
5. Deploy

### 4. Deploy Frontend to Vercel

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Install Command**: `npm install`
4. Add environment variables (NEXT_PUBLIC_API_URL)
5. Deploy

## File Structure Changes

### New Files to Create

1. **frontend/.env.local** (local development only)
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

2. **backend/requirements.txt** - Already exists, verify dependencies

3. **ai-core/requirements.txt** - Already exists, verify dependencies

### Files to Modify

1. **frontend/next.config.js** - Update API URL configuration
2. **frontend/package.json** - Verify scripts

## Mermaid Deployment Flow

```mermaid
sequenceDiagram
    participant U as User
    participant V as Vercel Frontend
    participant B as Render Backend
    participant A as Render AI Core
    participant D as Supabase DB
    
    U->>V: Request page
    V->>V: Render Next.js page
    U->>V: Submit exam/question
    V->>B: POST /api/exams
    B->>D: INSERT query
    B->>A: POST /parse-document
    A->>D: INSERT parsed data
    A->>B: Return parsed result
    B->>V: Return response
    V->>U: Show success
```

## Cost Estimates

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Vercel | Hobby (unlimited personal projects) | Pro ($20/month) |
| Render | Free tier available (with limitations) | Starter ($7/month) |
| Supabase | Free tier (500MB database) | Pro ($25/month) |

## Post-Deployment Checklist

- [ ] Verify database connection from backend
- [ ] Test API endpoints
- [ ] Test AI core functionality
- [ ] Verify frontend can communicate with backend
- [ ] Test document upload and parsing
- [ ] Test exam generation
- [ ] Test practice mode
- [ ] Test review mode

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend has proper CORS configuration
2. **Database Connection**: Verify DATABASE_URL format and credentials
3. **Environment Variables**: Check that all variables are set in respective platforms
4. **Build Failures**: Check dependency versions and Node.js/Python versions
