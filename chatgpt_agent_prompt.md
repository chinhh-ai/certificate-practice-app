You are an autonomous senior full-stack engineer and AI system builder.

Your goal is to build a complete, production-ready application by reading a local file:

👉 `final_prd_certificate_app.md`

You MUST strictly follow the requirements in that file.

---

# 🔥 PRIMARY TASK

1. Read and fully understand:

```
final_prd_certificate_app.md
```

2. Based on that file, you must:

* Design system architecture
* Implement backend (FastAPI)
* Implement AI core (parsing service ONLY)
* Implement frontend (Next.js)
* Setup database (PostgreSQL)
* Setup Docker
* Write tests
* Run and debug until everything works

---

# ⚠️ CRITICAL RULES

* DO NOT generate any questions
* DO NOT use embeddings or vector search
* ONLY parse and normalize input data
* Preserve original content EXACTLY
* Follow PRD strictly — do not simplify

---

# ⚙️ ENVIRONMENT SETUP (MANDATORY)

You MUST execute and verify:

## Step 1 — Create environment

```bash
conda create -n prac_certi python=3.12 -y
```

## Step 2 — Activate environment

```bash
conda activate prac_certi
```

## Step 3 — Install dependencies

### Backend

```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-multipart
```

### AI Core

```bash
pip install pypdf python-docx regex
```

### Dev tools

```bash
pip install pytest black isort
```

### Frontend

```bash
npm install next react react-dom axios
```

You must verify all installations succeed.

---

# 🏗️ IMPLEMENTATION PLAN

You MUST follow this order:

## Phase 1 — Project Setup

* Create project structure:

  * backend/
  * ai-core/
  * frontend/
  * docker-compose.yml

---

## Phase 2 — AI CORE (HIGH PRIORITY)

Implement:

* PDF parser
* DOCX parser
* Question extractor

Pipeline:
PDF → text → split → parse → structured JSON

You must handle:

* multi-line questions
* multi-line options
* inconsistent formatting

---

## Phase 3 — BACKEND (FastAPI)

Implement:

* File upload API
* Call AI core for parsing
* Store questions in PostgreSQL

Endpoints:

* POST /content/upload
* GET /practice/questions
* POST /practice/submit

---

## Phase 4 — DATABASE

* Setup PostgreSQL

* Create tables:

  * users
  * questions
  * attempts

* Add migrations

---

## Phase 5 — FRONTEND (Next.js)

Build UI:

### Practice Page

* Show question
* Show options
* Click to select
* Highlight correct/incorrect
* Next button

### Dashboard

* Progress
* Accuracy

### Review Page

* Show results after completion

---

## Phase 6 — DOCKER

Create docker-compose:

* backend
* ai-core
* frontend
* postgres

---

# 🧪 TESTING (MANDATORY)

You MUST implement and run tests:

## 1. Parser tests

* PDF → correctly parsed questions

## 2. API tests

* Upload works
* Questions returned correctly

## 3. End-to-end flow

* Upload → parse → store → practice → submit

---

# 🔁 AUTONOMOUS LOOP (VERY IMPORTANT)

You MUST continuously:

1. Write code
2. Run the app
3. Run tests
4. Detect errors
5. Fix errors

Repeat until:

* No runtime errors
* All APIs work
* Frontend works correctly
* Data is correct
* Tests pass

DO NOT STOP EARLY.

---

# 📊 VALIDATION CHECKLIST

Before finishing, verify:

* [ ] Upload JSON works
* [ ] Upload PDF works
* [ ] Questions parsed correctly
* [ ] Practice flow works
* [ ] Answer validation works
* [ ] UI usable
* [ ] No crashes
* [ ] Tests pass

---

# 📦 FINAL OUTPUT

You MUST provide:

1. Full project structure
2. All source code
3. Setup instructions
4. How to run locally
5. Test results

---

# 🚀 START NOW

Read `final_prd_certificate_app.md` and begin building step-by-step.

Do not stop until the system is fully working and production-ready.
