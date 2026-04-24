# 🤖 Cursor Agent Prompt — Certificate Practice App

> Paste toàn bộ nội dung này vào Cursor **Agent mode** (Ctrl+Shift+P → "Open Agent" hoặc dùng Composer với model Claude Sonnet/Opus).

---

## SYSTEM CONTEXT

You are an expert full-stack engineer and DevOps specialist. Your job is to read a PRD file, then build, configure, and validate a complete production-ready application — using Docker Compose as the only runtime environment.

**Rules you must follow without exception:**
- Read the PRD file FIRST before writing any code
- Build iteratively: scaffold → implement → test → fix → confirm
- STOP and ask the user before any destructive action (delete DB, overwrite .env, expose secrets)
- STOP and ask the user when a decision has 2+ valid approaches with different tradeoffs
- Never skip tests — if a service fails health check, fix it before moving on
- All secrets and ports go in `.env` — never hardcoded
- Commit logical checkpoints with clear git messages after each phase completes

---

## YOUR MISSION

```
PRD file: ./final_prd_certificate_app_v2.md
```

Read it fully. Then execute the following phases in order.

---

## PHASE 0 — Read & Plan

1. Read `./final_prd_certificate_app_v2.md` completely
2. Extract and summarize:
   - All services and their ports
   - All API endpoints
   - Full DB schema (tables + columns + types)
   - LLM providers and config keys needed
   - Frontend pages and their responsibilities
3. Output a **Build Plan** as a checklist — ask user to confirm before proceeding

**STOP HERE. Show build plan. Wait for user confirmation.**

---

## PHASE 1 — Project Scaffold

Create the following directory structure:

```
certificate-app/
├── docker-compose.yml
├── .env.example
├── .env                        ← copy from .env.example, DO NOT commit
├── frontend/                   ← Next.js, port 6000
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── pages/
│       │   ├── index.tsx       ← redirect to /dashboard
│       │   ├── dashboard.tsx
│       │   ├── exam/
│       │   │   ├── create.tsx
│       │   │   └── [id].tsx    ← practice session
│       │   ├── review/
│       │   │   └── [id].tsx
│       │   └── exams.tsx
│       ├── components/
│       └── lib/
│           └── api.ts          ← typed API client (all fetch calls here)
├── backend/                    ← FastAPI, port 5000
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── config.py           ← reads from .env via pydantic-settings
│       ├── database.py
│       ├── models/
│       ├── routers/
│       │   ├── auth.py
│       │   ├── content.py
│       │   ├── exam.py
│       │   ├── practice.py
│       │   ├── analytics.py
│       │   └── llm.py
│       └── services/
│           ├── llm_service.py  ← provider abstraction (openai/gemini/azure)
│           └── exam_service.py
├── ai-core/                    ← Python parsing service, port 6100
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── parser/
│       │   ├── pdf_parser.py
│       │   ├── docx_parser.py
│       │   └── json_parser.py
│       └── llm/
│           ├── provider.py     ← switch between openai/gemini/azure
│           └── prompts.py
└── postgres/
    └── init.sql                ← schema DDL, runs on first boot
```

**Generate `.env.example`:**

```env
# LLM
LLM_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-pro
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Ports
FRONTEND_PORT=6000
BACKEND_PORT=5000
AI_CORE_PORT=6100

# DB
POSTGRES_USER=certapp
POSTGRES_PASSWORD=certapp_secret
POSTGRES_DB=certapp
DATABASE_URL=postgresql://certapp:certapp_secret@postgres:5432/certapp

# Auth
JWT_SECRET=change_me_in_production
JWT_EXPIRE_MINUTES=60

# File upload
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=/tmp/uploads
```

**After scaffold is created:**
- Run `docker compose build` — verify all images build without error
- **STOP. Report build status. Wait for user confirmation to continue.**

---

## PHASE 2 — Database

Implement `postgres/init.sql` with the full schema from the PRD:

Tables to create (in dependency order):
1. `users`
2. `questions`
3. `exams`
4. `attempts`
5. `exam_results`

Requirements:
- All primary keys are `UUID` with `DEFAULT gen_random_uuid()`
- All timestamps use `DEFAULT NOW()`
- `questions.explanation` is `TEXT NULL`
- `questions.options` is `JSONB NOT NULL`
- `exam_results.llm_review` is `TEXT NULL`
- Add indexes on: `attempts(user_id)`, `attempts(exam_id)`, `exam_results(user_id)`, `questions(topic)`, `questions(difficulty)`

Validate by:
```bash
docker compose up postgres -d
docker compose exec postgres psql -U certapp -d certapp -c "\dt"
# Expected: 5 tables listed
```

**STOP. Show table list output. Wait for confirmation.**

---

## PHASE 3 — AI Core Service (Port 6100)

### 3.1 LLM Provider Abstraction

Implement `ai-core/app/llm/provider.py`:
- Class `LLMProvider` with method `complete(prompt: str) -> str`
- Switch based on `LLM_PROVIDER` env var
- Support: `openai`, `gemini`, `azure`
- Raise clear error if provider is unsupported or key is missing

### 3.2 PDF/DOCX Parser

Implement parsing pipeline:
- PDF: use `pdfplumber`
- DOCX: use `python-docx`
- Split text into question chunks by pattern: `^\d+[\.\)]\s`
- For each chunk, call LLM with this prompt structure:

```
You are a question extractor. Given raw text from a certification exam document, extract the question, answer options, correct answer, and explanation (if present).

Return ONLY a valid JSON object with this exact structure:
{
  "question": "...",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
  "answer": "A",
  "explanation": "..." or null
}

Do NOT invent or modify any content. If explanation is not present in the text, set it to null.
If you cannot extract a valid question, return: {"error": "unparseable"}

Raw text:
{chunk}
```

- Filter out chunks where LLM returns `{"error": "unparseable"}`
- Return list of valid question objects

### 3.3 API Endpoints (FastAPI)

```
POST /parse          ← receives file bytes, returns parsed questions array
GET  /health         ← returns {"status": "ok", "provider": "<current LLM provider>"}
```

Validate:
```bash
docker compose up ai-core -d
curl http://localhost:6100/health
# Expected: {"status": "ok", "provider": "openai"}
```

**STOP. Show health check response. Wait for confirmation.**

---

## PHASE 4 — Backend API (Port 5000)

Implement all routers per PRD Section 6.2. Key implementation notes:

### Auth
- `POST /auth/register` — hash password with `bcrypt`, return JWT
- `POST /auth/login` — verify password, return JWT + refresh token
- JWT middleware: inject `current_user` into protected routes

### Content
- `POST /content/upload` — accept multipart file (PDF/JSON/DOCX), forward to AI Core `/parse`, save returned questions to DB
- `GET /content/questions` — paginated, filterable by `topic` and `difficulty`

### Exam
- `POST /exam/generate` — implement selection algorithm:
  ```
  1. Fetch question pool filtered by topic
  2. Score each question: base=1.0, boost wrong-rate questions by (wrong_rate * 2)
  3. Apply difficulty distribution: 30% easy, 50% medium, 20% hard
  4. Sample `total_questions` from scored pool (weighted random)
  5. Save as new exam record, return exam_id
  ```

### Practice
- `POST /practice/submit` — save attempt, return `{is_correct, correct_answer, explanation}`
- `POST /practice/complete` — compute score, save `exam_results`, optionally trigger LLM review

### Analytics
- `GET /analytics/summary` — return: `{total_exams_created, total_exams_completed, average_score, streak_days}`
- `GET /analytics/score-history` — list of `{exam_id, title, score, completed_at}`
- `GET /analytics/weak-topics` — topics where accuracy < 60%, sorted by accuracy ASC

### LLM Router
- `POST /llm/review-exam` — fetch exam + all attempts, send to AI Core for review, save to `exam_results.llm_review`

Validate:
```bash
docker compose up backend -d
curl http://localhost:5000/health
# Run: pytest backend/tests/ -v
# Expected: all tests pass
```

Write tests for:
- Auth register + login flow
- Upload → parse → questions saved
- Exam generate returns correct question count
- Submit answer updates attempt correctly
- Analytics summary returns correct counts

**STOP. Show test results. Wait for confirmation.**

---

## PHASE 5 — Frontend (Port 6000)

### `/dashboard`
- Fetch `GET /analytics/summary` → show cards: Exams Created, Exams Completed, Average Score, Streak
- Fetch `GET /analytics/score-history` → render line chart (use `recharts`)
- Fetch `GET /analytics/weak-topics` → render bar chart

### `/exam/create`
- Form fields:
  - Topic selector (dropdown, populated from distinct topics in DB)
  - **Number of questions** — `<input type="number" min="5" max="200" />` with label "How many questions?"
  - Mode selector: Quick / Topic / Exam
  - Toggle: Balance difficulty
  - Toggle: Prioritize weak questions
- Submit → `POST /exam/generate` → redirect to `/practice/{exam_id}`

### `/practice/[id]`
- Load exam questions from `GET /practice/session/{exam_id}`
- Render one question at a time
- Option cards: click or press A/B/C/D key to select
- Press Enter or Space to confirm answer → `POST /practice/submit`
- After submit:
  - Correct: highlight selected green, show explanation
  - Wrong: highlight selected red, highlight correct green, show explanation
- Progress bar: `current / total`
- "Mark for Review" button — flag question, show flagged indicator
- "Next" / "Previous" navigation
- "Finish Exam" button → `POST /practice/complete` → redirect to `/review/{exam_id}`

### `/review/[id]`
- Fetch all attempts for exam
- Show score banner: `Score: 23/30 (76.7%)`
- List all questions with: user answer, correct answer, color-coded result, explanation
- If `llm_review` is available: show "AI Review" card with tips
- "Retry" button → `POST /exam/generate` with same config → new exam

### `/exams`
- Table of all exams: Title, Questions, Date Created, Completed, Score
- Filter tabs: All / Completed / In Progress

**Use TypeScript throughout. All API calls go through `src/lib/api.ts`.**

Validate:
```bash
docker compose up frontend -d
# Open http://localhost:6000 — check all 4 pages load without console errors
# Run: npx playwright test (if playwright is set up) OR manually verify each page
```

**STOP. Report which pages are working. Wait for confirmation.**

---

## PHASE 6 — Integration & Full Stack Test

Run the full stack:
```bash
docker compose up --build
```

Execute end-to-end smoke test sequence:

```
1. Register new user via POST /auth/register
2. Login → get JWT token
3. Upload a sample JSON file with 10 questions via POST /content/upload
4. Verify 10 questions saved: GET /content/questions
5. Generate exam (10 questions): POST /exam/generate
6. Submit answers for all 10 questions: POST /practice/submit (×10)
7. Complete exam: POST /practice/complete
8. Verify exam result saved: GET /analytics/score-history
9. Verify dashboard shows updated stats: GET /analytics/summary
10. Request LLM review: POST /llm/review-exam
11. Verify review saved in exam_results
```

All 11 steps must succeed (2xx responses) before Phase 6 is complete.

**STOP. Show smoke test results (pass/fail per step). Wait for confirmation.**

---

## PHASE 7 — Hardening & Cleanup

1. **Environment validation** — on startup, backend and ai-core must check required env vars and fail fast with a clear error message if missing
2. **Error handling** — all endpoints return structured errors: `{"error": "message", "code": "ERROR_CODE"}`
3. **File validation** — reject uploads that are not PDF/JSON/DOCX or exceed `MAX_FILE_SIZE_MB`
4. **CORS** — configure allowed origins from `.env`
5. **LLM rate limiting** — max 10 LLM calls per minute per user
6. **Docker health checks** — add `healthcheck` to all services in `docker-compose.yml`
7. **README.md** — write a concise setup guide:
   - Prerequisites
   - `cp .env.example .env` + fill in API keys
   - `docker compose up --build`
   - First user registration
   - How to upload questions

Final validation:
```bash
docker compose down -v
docker compose up --build
# All services must reach healthy status within 60 seconds
docker compose ps
# Expected: all services "healthy"
```

**STOP. Show `docker compose ps` output. Confirm all healthy.**

---

## DEFINITION OF DONE

The build is complete when ALL of the following are true:

- [ ] `docker compose up --build` completes with 0 errors
- [ ] All 4 services show `healthy` in `docker compose ps`
- [ ] All 5 DB tables exist and are indexed
- [ ] Backend tests pass: `pytest backend/tests/ -v`
- [ ] All 4 frontend pages load without JS console errors
- [ ] End-to-end smoke test: all 11 steps return 2xx
- [ ] `.env.example` has all required keys documented
- [ ] `README.md` covers setup in under 10 steps

---

## IMPORTANT REMINDERS

- **Never commit `.env`** — add it to `.gitignore` immediately in Phase 1
- **Never hardcode API keys, passwords, or secrets** anywhere in source code
- **Ask before dropping/resetting the database**
- **If a phase fails**, diagnose the root cause, fix it, re-run the validation for that phase before moving to the next
- **LLM calls are expensive** — in tests, mock the LLM provider unless explicitly testing LLM integration
- **Explanation field** — always nullable, never fabricated if not in source data

---

*Prompt version: 1.0 | Target: Cursor Agent Mode | Stack: Next.js + FastAPI + PostgreSQL + Docker*
