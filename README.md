# 📘 Certificate Practice App

A scalable certification practice platform that supports structured (JSON) and unstructured (PDF/DOCX) inputs, enhanced with multi-provider LLM integration for smarter parsing, intelligent exam generation, and AI-powered answer review.

## 🏗️ Architecture

### Stack
- **Frontend**: Next.js 16+ (React 19+)
- **Backend**: FastAPI (Python)
- **AI Core**: Python LLM Service (parsing + review)
- **Database**: PostgreSQL 15+
- **Deployment**: Vercel (Frontend), Python hosting (Backend & AI Core)

### Service Ports
| Service   | Port  | Environment |
|-----------|-------|-------------|
| Frontend  | 6005  | `FRONTEND_PORT` |
| Backend   | 5000  | `BACKEND_PORT` |
| AI Core   | 6100  | `AI_CORE_PORT` |
| PostgreSQL| 5432  | `DATABASE_PORT` |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.9+
- PostgreSQL 15+
- Git

### 1. Local Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/certificate-practice-app.git
cd certificate-practice-app

# Configure environment
cp .env.example .env
# Edit .env with your actual API keys and configuration
```

### 2. Database Setup

```bash
# Using Docker (recommended)
docker-compose up postgres -d

# Or create PostgreSQL database manually
createdb certidb
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (if needed)
python migrate_v3.py

# Start server
uvicorn main:app --reload --port 5000
```

### 4. AI Core Setup

```bash
cd ai-core
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start service
uvicorn main:app --reload --port 6100
```

### 5. Frontend Setup

```bash
cd frontend
npm install

# Development
npm run dev

# Visit http://localhost:6005
```

## 📋 Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# LLM Provider: openai | gemini | azure
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_API_BASE=https://api.openai.com/v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/certidb

# Service URLs
NEXT_PUBLIC_API_URL=http://localhost:5000
AI_CORE_URL=http://localhost:6100
```

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ✅ API Health Checks

- **Backend**: `http://localhost:5000/docs` (Swagger UI)
- **AI Core**: `http://localhost:6100/health`
- **Frontend**: `http://localhost:6005`

## 📦 Features

✅ Multi-format file upload (JSON, PDF, DOCX)  
✅ Smart question parsing with LLM  
✅ Exam generation with difficulty balancing  
✅ AI-powered answer review and feedback  
✅ Performance analytics and weak topic tracking  
✅ Soft delete with scheduled purge  
✅ Multi-LLM provider support (OpenAI, Gemini, Azure)

## 🔐 Security

- ✅ `.env` file excluded from git (see `.gitignore`)
- ✅ CORS configured for cross-origin requests
- ✅ SQL injection protection via SQLAlchemy ORM
- ✅ Rate limiting ready (can be added)
- ✅ API key rotation support

## 📚 API Documentation

- **Subjects**: CRUD operations
- **Content**: File upload, parsing
- **Exams**: Creation, completion, review
- **Analytics**: User performance metrics
- **Admin**: Data management, reset tokens

Full API docs available at `/docs` endpoint when backend is running.

## 🛠️ Troubleshooting

### "Connection refused" error
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`

### "AI Core not responding"
- Verify AI Core service is running on port 6100
- Check `AI_CORE_URL` in backend `.env`

### Frontend API errors
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running
- Check CORS configuration

## 📝 License

ISC License - see project for details

## 👥 Contributing

1. Create a feature branch
2. Commit changes
3. Push to GitHub
4. Open a Pull Request

---

**Built with ❤️ for certification professionals**
