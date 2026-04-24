# Deployment Configuration Files

## Vercel Configuration

### vercel.json (create in `frontend/` directory)

```json
{
  "buildCommand": "npm install && npm run build",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://your-backend-render-url.com/api"
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-render-url.com/api/:path*"
    }
  ]
}
```

### Vercel CLI Deployment Command

```bash
cd frontend
vercel --prod
```

## Render Configuration

### backend/render.yaml (create in `backend/` directory)

```yaml
services:
  - type: web
    name: certificate-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: AI_CORE_URL
        value: https://your-ai-core-render-url.com
        sync: false
      - key: PORT
        value: 5000
        sync: false
```

### ai-core/render.yaml (create in `ai-core/` directory)

```yaml
services:
  - type: web
    name: certificate-ai-core
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: LLM_PROVIDER
        value: openai
        sync: false
      - key: LLM_MODEL_NAME
        value: gpt-5
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: OPENAI_API_BASE
        value: https://your-openai-endpoint.com/v1
        sync: false
      - key: PORT
        value: 6100
        sync: false
```

### Render CLI Deployment Commands

```bash
# Install Render CLI
npm install -g @render-cloud/cli

# Deploy backend
cd backend
render deploy

# Deploy AI core
cd ../ai-core
render deploy
```

## Supabase Configuration

### Supabase Setup

1. Create project at https://supabase.com
2. Get connection string from Settings > Database > Connection
3. Connection string format:
   ```
   postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
   ```

### Supabase CLI (optional)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Environment Variables Summary

### Vercel (Frontend)
| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_API_URL | https://your-backend-render-url.com/api |

### Render (Backend)
| Variable | Value |
|----------|-------|
| DATABASE_URL | postgresql://user:password@supabase-db-url:5432/certidb |
| AI_CORE_URL | https://your-ai-core-render-url.com |
| PORT | 5000 |

### Render (AI Core)
| Variable | Value |
|----------|-------|
| LLM_PROVIDER | openai |
| LLM_MODEL_NAME | gpt-5 |
| OPENAI_API_KEY | sk-your-openai-key |
| OPENAI_API_BASE | https://your-openai-endpoint.com/v1 |
| PORT | 6100 |

## Security Considerations

1. **Never commit secrets to git** - Use platform environment variables
2. **Use .env files for local development only** - Add to .gitignore
3. **Rotate API keys regularly** - Especially for OpenAI
4. **Use HTTPS only** - All platforms support HTTPS by default
5. **Implement rate limiting** - Add to backend to prevent abuse

## CORS Configuration for Backend

Update `backend/main.py` to include CORS:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.vercel.app",
        "https://your-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Database Migration

If you have existing database schema, create migration files:

```bash
# In backend directory
pip install alembic
alembic init
```

## Monitoring and Logging

### Vercel
- View logs: Vercel Dashboard > Your Project > Deployments > Logs
- Analytics: Vercel Dashboard > Analytics

### Render
- View logs: Render Dashboard > Your Service > Logs
- Monitoring: Render Dashboard > Your Service > Monitoring

### Supabase
- View logs: Supabase Dashboard > Logs
- Database metrics: Supabase Dashboard > Settings > Database
