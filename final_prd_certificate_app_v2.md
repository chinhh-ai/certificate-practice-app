# 📘 Certificate Practice App — PRD v2.0 (Production-Ready)

## 1. Overview

A scalable certification practice platform that supports structured (JSON) and unstructured (PDF/DOCX) inputs, enhanced with multi-provider LLM integration for smarter parsing, intelligent exam generation, and AI-powered answer review.

### Key Principles
- No AI-generated questions — all questions originate from uploaded source data
- No embeddings / vector search
- Parse and normalize existing data only, using LLM assistance where needed
- Focus on UX for real, trackable learning
- LLM providers (OpenAI, Gemini, Azure OpenAI) are configurable via `.env`

---

## 2. System Architecture

### Stack
- **Frontend**: Next.js (Node.js)
- **Backend**: FastAPI
- **AI Core**: Python (parsing + LLM service)
- **DB**: PostgreSQL
- **Storage**: S3 / local filesystem

### Port Allocation

| Service   | Port Range | Default Port |
|-----------|-----------|-------------|
| Frontend  | 6000–6099 | 6000        |
| Backend   | 5000–5099 | 5000        |
| AI Core   | 6100–6199 | 6100        |
| PostgreSQL| 5432      | 5432        |

> All ports must be configurable via `.env` to avoid conflicts with existing services.

### System Flow

```
Upload (PDF / JSON / DOCX)
        ↓
  Backend (port 5000)
        ↓
  AI Core (port 6100)
   ├─ Text Extraction
   ├─ LLM Parsing (OpenAI / Gemini / Azure)
   └─ Structured Question Output
        ↓
  PostgreSQL (save questions)
        ↓
  Frontend (port 6000) ← API calls to Backend
```

---

## 3. LLM Integration

### 3.1 Supported Providers

| Provider     | Purpose                          | Config Key Prefix  |
|-------------|----------------------------------|--------------------|
| OpenAI       | Parsing, review, exam generation | `OPENAI_`          |
| Google Gemini| Parsing, review, exam generation | `GEMINI_`          |
| Azure OpenAI | Enterprise parsing & review      | `AZURE_OPENAI_`    |

### 3.2 Environment Configuration (`.env`)

```env
# Provider selection: openai | gemini | azure
LLM_PROVIDER=openai

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Google Gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-pro

# Azure OpenAI
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Service Ports
FRONTEND_PORT=6000
BACKEND_PORT=5000
AI_CORE_PORT=6100
```

### 3.3 LLM Use Cases

| Feature                  | LLM Role                                                                 |
|--------------------------|--------------------------------------------------------------------------|
| **PDF/DOCX Parsing**     | Extract and normalize malformed question text, multi-line options        |
| **Answer Explanation**   | If explanation is missing from source, LLM can optionally generate one   |
| **Exam Review**          | Analyze user's completed exam and provide feedback on weak areas         |
| **Exam Generation**      | Select questions balancing difficulty level and historically weak topics  |

> **Note on question generation:** LLM does NOT create new questions. It only selects and reorders existing questions from the database.

---

## 4. Data Input Handling

### 4.1 JSON Input

Already structured — directly stored:

```json
{
  "question": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "A",
  "explanation": "Optional explanation text"
}
```

### 4.2 PDF / DOCX Input

**Pipeline:**
```
Raw File → Text Extraction → LLM-assisted Parsing → Normalization → Structured JSON → DB
```

**LLM Parsing Prompt Strategy:**
- Provide extracted text chunk to LLM
- Ask LLM to return structured JSON array of questions with fields: `question`, `options`, `answer`, `explanation`
- If explanation is absent in source, LLM leaves the field empty (no hallucination policy)

**Common Challenges (handled by LLM):**
- Multi-line options
- Broken formatting across pages
- Mixed Vietnamese/English answer labels (Answer / Đáp án)
- Missing answer indicators

---

## 5. Database Schema

### 5.1 `questions`

| Column        | Type      | Notes                                               |
|---------------|-----------|-----------------------------------------------------|
| id            | UUID      | Primary key                                         |
| content       | TEXT      | Question text                                       |
| options       | JSONB     | `{"A": "...", "B": "...", "C": "...", "D": "..."}`  |
| answer        | VARCHAR   | Correct answer key (e.g., "A")                      |
| explanation   | TEXT      | Answer explanation — nullable, filled if available  |
| topic         | VARCHAR   | Topic / category                                    |
| difficulty    | VARCHAR   | easy / medium / hard                                |
| source_file   | VARCHAR   | Original upload filename                            |
| created_at    | TIMESTAMP | Auto-set                                            |

> `explanation` is always nullable. If source data contains an explanation, it is stored. If not, the field remains NULL (LLM fill is opt-in, off by default).

### 5.2 `users`

| Column       | Type      | Notes          |
|--------------|-----------|----------------|
| id           | UUID      | Primary key    |
| email        | VARCHAR   | Unique         |
| password_hash| VARCHAR   |                |
| created_at   | TIMESTAMP |                |

### 5.3 `exams`

| Column       | Type      | Notes                                        |
|--------------|-----------|----------------------------------------------|
| id           | UUID      | Primary key                                  |
| user_id      | UUID      | FK → users                                   |
| title        | VARCHAR   | Exam title / label                           |
| question_ids | JSONB     | Ordered list of question UUIDs               |
| total_questions | INT    | Number of questions in exam                  |
| mode         | VARCHAR   | quick / topic / exam                         |
| created_at   | TIMESTAMP |                                              |

### 5.4 `attempts`

| Column          | Type      | Notes                          |
|-----------------|-----------|--------------------------------|
| id              | UUID      | Primary key                    |
| user_id         | UUID      | FK → users                     |
| exam_id         | UUID      | FK → exams                     |
| question_id     | UUID      | FK → questions                 |
| selected_answer | VARCHAR   |                                |
| is_correct      | BOOLEAN   |                                |
| time_spent_sec  | INT       | Time on this question          |
| timestamp       | TIMESTAMP |                                |

### 5.5 `exam_results`

| Column          | Type      | Notes                              |
|-----------------|-----------|-------------------------------------|
| id              | UUID      | Primary key                         |
| user_id         | UUID      | FK → users                          |
| exam_id         | UUID      | FK → exams                          |
| score           | FLOAT     | Percentage score (0.0–100.0)        |
| correct_count   | INT       |                                     |
| total_questions | INT       |                                     |
| completed_at    | TIMESTAMP |                                     |
| llm_review      | TEXT      | AI-generated review summary (opt-in)|

---

## 6. Backend (FastAPI — Port 5000)

### 6.1 Modules

- **Auth** — user registration, login, JWT
- **Content** — file upload, question management
- **Exam** — exam creation, configuration
- **Practice** — answer submission, session tracking
- **Analytics** — user progress, performance stats
- **LLM** — proxy to AI Core for review and generation

### 6.2 API Endpoints

#### Auth
```
POST /auth/register
POST /auth/login
POST /auth/refresh
```

#### Content
```
POST   /content/upload              # Upload PDF / JSON / DOCX
GET    /content/questions           # List all questions (paginated)
GET    /content/questions/{id}      # Single question detail
DELETE /content/questions/{id}      # Remove question
```

#### Exam
```
POST  /exam/generate                # Generate exam (see payload below)
GET   /exam/{id}                    # Exam details + questions
GET   /exam/list                    # User's exam history
```

**`POST /exam/generate` payload:**
```json
{
  "total_questions": 30,
  "topic": "networking",
  "mode": "exam",
  "balance_difficulty": true,
  "prioritize_weak": true
}
```

#### Practice
```
GET   /practice/session/{exam_id}   # Load exam session
POST  /practice/submit              # Submit single answer
POST  /practice/complete            # Complete exam, trigger scoring
```

#### Analytics
```
GET  /analytics/summary             # Overall progress overview
GET  /analytics/exams               # Exams created vs completed
GET  /analytics/weak-topics         # Topics with lowest accuracy
GET  /analytics/score-history       # Score per completed exam
```

#### LLM
```
POST /llm/review-exam               # AI review of completed exam
POST /llm/explain/{question_id}     # Request LLM explanation for a question
```

---

## 7. AI Core (Python — Port 6100)

### 7.1 Responsibilities

- Extract text from PDF / DOCX
- LLM-assisted parsing and normalization
- Question structuring and validation
- Exam generation logic (question selection algorithm)
- LLM-powered review generation

### 7.2 Parsing Pipeline

```
File Upload
    ↓
Text Extraction (pdfplumber / python-docx)
    ↓
Chunk by question boundary (regex: "1.", "2.", ...)
    ↓
LLM Parsing (per chunk → structured JSON)
    ↓
Validation (required fields: question, options, answer)
    ↓
Save to DB
```

### 7.3 Exam Generation Algorithm

```
Input: total_questions, topic, balance_difficulty, prioritize_weak
    ↓
Fetch question pool (filtered by topic)
    ↓
Score each question:
  - Base score: uniform
  - Boost: questions with high wrong-answer rate (weak)
  - Weight by difficulty distribution (e.g., 30% easy, 50% medium, 20% hard)
    ↓
LLM selects final list (respects total_questions count)
    ↓
Return ordered question_ids
```

### 7.4 LLM Review Flow

```
Completed exam results (question, correct answer, user answer)
    ↓
LLM prompt: analyze performance, highlight weak areas, give tips
    ↓
Return structured review (topic summary + recommendations)
    ↓
Saved to exam_results.llm_review
```

---

## 8. Frontend (Next.js — Port 6000)

### 8.1 Pages

#### `/dashboard`
- Total exams created
- Total exams completed
- Average score across all exams
- Score history chart (per exam over time)
- Accuracy per topic (bar chart)
- Study streak tracker
- Weak area highlights

#### `/exam/create`
- Select topic / mode (Quick / Topic / Exam)
- **Question count input box** (user enters number, e.g., 30)
- Balance difficulty toggle (easy / medium / hard ratio)
- Prioritize weak questions toggle
- "Generate Exam" button → calls `POST /exam/generate`

#### `/practice/{exam_id}`
- Question display with numbered progress (e.g., "Question 5 / 30")
- Options (A/B/C/D) — clickable cards
- Keyboard shortcuts: A, B, C, D to select; Enter/Space to confirm
- Progress bar
- Mark for Review flag
- Instant feedback after answer:
  - Highlight correct answer (green)
  - Highlight wrong selection (red)
  - Show explanation if available
- Next / Previous navigation
- Timer (exam mode)

#### `/review/{exam_id}`
- Full list of all questions in exam
- Show user answer vs correct answer per question
- Color-coded: correct (green), incorrect (red), skipped (grey)
- Explanation panel per question
- Score summary at top: `Score: 23/30 (76.7%)`
- AI Review section (if LLM review is enabled): tips and weak area summary
- "Retry Exam" button

#### `/exams`
- List of all exams (created + completed)
- Per exam: title, date created, date completed, score achieved, number of questions
- Filter by: completed / pending / topic

### 8.2 UX Requirements (Critical)

- Instant feedback after answer selection (no page reload)
- Highlight correct/incorrect immediately
- Smooth progress bar update
- Keyboard shortcuts throughout practice
- Mark for review — revisit before submitting
- Mobile-responsive layout
- Loading skeletons for API calls
- Error states with retry buttons

---

## 9. Security

- JWT authentication with refresh tokens
- Role-based access (user / admin)
- Input validation on all endpoints (Pydantic models)
- File validation on upload: type check (PDF/JSON/DOCX), size limit
- LLM API keys never exposed to frontend (server-side only)
- Rate limiting on LLM endpoints to control costs
- CORS policy configured per environment

---

## 10. Deployment (Docker Compose)

```yaml
services:
  frontend:
    ports: ["6000:6000"]

  backend:
    ports: ["5000:5000"]

  ai-core:
    ports: ["6100:6100"]

  postgres:
    ports: ["5432:5432"]
```

All `.env` values injected at runtime. No secrets in image layers.

---

## 11. Scaling

- Horizontal backend scaling behind load balancer
- Async queue (Celery + Redis) for file processing and LLM calls
- LLM call retry logic with exponential backoff
- CDN for static frontend assets
- PostgreSQL connection pooling (PgBouncer)

---

## 12. Non-Functional Requirements

| Requirement      | Target                          |
|-----------------|----------------------------------|
| API response    | < 300ms (non-LLM endpoints)      |
| LLM response    | < 10s with streaming UX feedback |
| Uptime          | 99.9%                            |
| Large PDF parse | Support up to 200-page PDFs      |
| Concurrent users| 500+ with horizontal scaling     |

---

## 13. Analytics Tracking

### User-Level Metrics
- Exams created (total count)
- Exams completed (total count)
- Score per exam (historical list)
- Accuracy per topic
- Weak areas (topics with < 60% accuracy)
- Average score across all exams
- Study streak (consecutive active days)

### System-Level Metrics
- Total questions uploaded per source file
- Parsing success/failure rate per file
- LLM API call latency and token usage
- Error rate per endpoint

---

## 14. Roadmap

### Phase 1 — Core Platform
- File upload (PDF / JSON / DOCX)
- LLM-assisted parsing
- Basic question management
- Quick practice mode
- JWT authentication

### Phase 2 — Smart Exam System
- AI-powered exam generation with question count input
- Difficulty balancing algorithm
- Weak question prioritization
- Exam result tracking
- Dashboard with score history

### Phase 3 — Review & Analytics
- LLM exam review
- Full review page per exam
- Weak topic analytics
- Explanation panel with LLM fallback

### Phase 4 — UX Polish & Scale
- Mobile optimization
- Keyboard shortcut enhancements
- Export results to PDF
- Multi-language support
- Horizontal backend scaling
- Admin dashboard for content management

---

## 15. Key Constraints

- No AI hallucination: LLM must not create questions that do not exist in source
- Explanation field is stored only if present in source data; LLM-generated explanations are opt-in and clearly labeled
- LLM provider, model, and API keys must be fully configurable without code changes
- Port assignments must not conflict with common dev services (no 8000–8099 range)

---

## 16. Success Metrics

- Daily active users
- Exam completion rate
- Accuracy improvement over time per user
- LLM review engagement rate
- Parsing success rate (> 95% of uploaded files parsed cleanly)

---

# ✅ READY FOR IMPLEMENTATION — v2.0
