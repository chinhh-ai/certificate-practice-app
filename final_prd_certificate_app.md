# 📘 Certificate Practice App — Final Production-Ready PRD

## 1. Overview
A scalable certification practice platform that supports structured (JSON) and unstructured (PDF/DOCX) inputs.

### Key Principles
- NO AI-generated questions
- NO embeddings / vector search
- Only parse & normalize existing data
- Focus on UX for real learning

---

## 2. System Architecture

### Stack
- Frontend: Next.js (Node.js)
- Backend: FastAPI
- AI Core: Python (parsing service)
- DB: PostgreSQL
- Storage: S3 / local

### Flow
1. Upload file (PDF/JSON)
2. Backend stores file
3. AI Core parses → structured questions
4. Backend saves to DB
5. Frontend consumes API

---

## 3. Data Input Handling

### 3.1 JSON Input
Already structured:
{
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "answer": "A"
}

→ Directly store

---

### 3.2 PDF Input

Pipeline:
- Extract text
- Split questions (1., 2., ...)
- Extract:
  - Question
  - Options A-D
  - Answer (Answer / Đáp án)

### Challenges
- Multi-line options
- Broken formatting
- Missing answers

---

## 4. Data Model

### Question
- id (uuid)
- content
- options (jsonb)
- answer
- explanation (optional)
- topic
- difficulty

### Attempt
- id
- user_id
- question_id
- selected_answer
- is_correct
- timestamp

---

## 5. Backend (FastAPI)

### Modules
- Auth
- Content
- Practice
- Analytics

### APIs

#### Auth
POST /auth/login
POST /auth/register

#### Content
POST /content/upload
GET /content/questions

#### Practice
GET /practice/questions
POST /practice/submit

#### Analytics
GET /analytics/summary

---

## 6. AI Core (Parsing Only)

### Responsibilities
- Parse PDF/DOCX
- Normalize text
- Extract structured questions

### Pipeline
PDF → Text → Split → Parse → JSON

---

## 7. Practice System

### Modes
- Quick Practice
- Topic Practice
- Exam Mode

### Flow
1. Load questions
2. Select answer
3. Show correct/incorrect
4. Next question
5. Final result

---

## 8. Frontend UX

### Pages

#### Dashboard
- Progress
- Accuracy
- Streak

#### Practice
- Question display
- Options (clickable)
- Highlight answer
- Next button

#### Review
- Show all answers
- Correct vs incorrect

---

## 9. UX Requirements (CRITICAL)

- Instant feedback after answer
- Highlight correct/incorrect
- Progress bar
- Keyboard shortcuts (A/B/C/D)
- Mark for review
- Review mode

---

## 10. Analytics

- Accuracy per topic
- Total attempts
- Weak areas

---

## 11. Security

- JWT auth
- Input validation
- File validation

---

## 12. Deployment

### Docker Services
- frontend
- backend
- ai-core
- postgres

---

## 13. Scaling

- Horizontal backend scaling
- Queue for file processing
- CDN for static assets

---

## 14. Non-functional Requirements

- <300ms API response
- 99.9% uptime
- Handle large PDFs

---

## 15. Roadmap

### Phase 1
- Upload + parse
- Basic practice

### Phase 2
- Analytics
- Review mode

### Phase 3
- UX polish
- Scaling

---

## 16. Key Constraints

- No AI hallucination
- No auto-generated questions
- Data must match source exactly

---

## 17. Success Metrics

- Daily active users
- Completion rate
- Accuracy improvement

---

# ✅ READY FOR IMPLEMENTATION
