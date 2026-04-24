# 🔧 Upgrade Prompt — Certificate Practice App
# Send this directly to Cursor Agent to implement missing features

---

## Context

The app is currently running. Looking at the current dashboard screenshot, the following
features from the PRD supplements (v2.1 and v2.2) are missing or incomplete.
Do NOT rebuild the app from scratch. Make targeted upgrades only.

Reference documents (already in the repo):
- `final_prd_certificate_app_v2.md` — base PRD
- `prd_supplement_v2.1.md` — subject management, upload library, exam persistence, dashboard redesign
- `prd_supplement_v2.2.md` — deletion management, soft delete, undo

---

## What the current app is MISSING (implement all of the following)

---

### BLOCK 1 — Subject / Topic Tagging

**Problem:** Upload form has no subject selector. Questions have no subject association.
Files uploaded have no label showing which course/subject they belong to.

**Tasks:**

1. **DB migration** — run these in order:
```sql
CREATE TABLE IF NOT EXISTS subjects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL UNIQUE,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  color      VARCHAR(7) DEFAULT '#4F86C6',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;

ALTER TABLE uploaded_files
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;

ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;

-- Soft delete support
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE questions       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE exams           ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- backfill: create default subject for existing data
INSERT INTO subjects (name, slug, color) VALUES ('Uncategorized', 'uncategorized', '#7C8394')
ON CONFLICT DO NOTHING;

UPDATE questions SET subject_id = (SELECT id FROM subjects WHERE slug = 'uncategorized')
WHERE subject_id IS NULL;
```

2. **Backend** — add subject endpoints:
```
GET    /subjects                  → list all subjects
POST   /subjects                  → { name, color } → create subject
PUT    /subjects/{id}             → { name, color } → update
DELETE /subjects/{id}?force=false → delete subject (force=true sets questions.subject_id = NULL)
GET    /subjects/{id}/question-count → { count: N }
```

3. **Backend** — update `POST /content/upload`:
   - Accept new field `subject_id` (UUID, required) in multipart form
   - Accept `subject_name` (string, optional) — if provided and subject doesn't exist, auto-create it
   - On parse completion, set `subject_id` on all questions created from this file

4. **Backend** — update `POST /exam/generate`:
   - Accept optional `subject_id` filter
   - Save `subject_id` on the created exam record

5. **Frontend** — update Upload section on Dashboard:
   - Add subject selector dropdown ABOVE the drag-and-drop zone
   - Populated from `GET /subjects`
   - Include "+ New Subject" option that shows an inline input for name + color picker (simple, 8 preset colors)
   - Subject selector is required — "Upload & Parse" button stays disabled until subject is selected
   - Show selected subject as colored badge next to filename after file is chosen

6. **Frontend** — update exam generate form:
   - Add subject filter dropdown (optional — "All subjects" is default)

---

### BLOCK 2 — Uploaded File Library

**Problem:** After upload, there is no way to see what files have been uploaded, their status, or manage them.

**Tasks:**

1. **DB** — ensure `uploaded_files` table has all required columns (from v2.1):
```sql
CREATE TABLE IF NOT EXISTS uploaded_files (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id     UUID REFERENCES subjects(id) ON DELETE SET NULL,
  filename       VARCHAR(255) NOT NULL,
  original_name  VARCHAR(255) NOT NULL,
  file_type      VARCHAR(10) NOT NULL,
  file_size_kb   INT,
  status         VARCHAR(20) DEFAULT 'pending',
  question_count INT DEFAULT 0,
  error_message  TEXT,
  uploaded_at    TIMESTAMP DEFAULT NOW(),
  parsed_at      TIMESTAMP,
  deleted_at     TIMESTAMP DEFAULT NULL
);
```

2. **Backend** — add file endpoints:
```
GET  /content/files                   → list files for current user (exclude deleted_at IS NOT NULL)
GET  /content/files/{id}/status       → { status, question_count, error_message }
DELETE /content/files/{id}            → soft delete file + soft delete its questions
POST /content/files/{id}/restore      → restore within 5-minute window
```

3. **Frontend** — create new page `/upload` (separate from dashboard):
   - Left column (40%): upload form (subject selector + drag-drop zone + button)
   - Right column (60%): file library table
   - File library columns: filename, subject badge, file type, question count, status chip, upload date, delete icon
   - Status chips: Pending (grey), Parsing (blue animated pulse), Done (green), Failed (red)
   - Poll `GET /content/files/{id}/status` every 3 seconds while status is `pending` or `parsing`
   - On "Done": update row question count without page reload
   - Delete icon (trash) appears on row hover → opens confirmation dialog
   - Filter bar above table: filter by subject, filter by status

4. **Frontend** — update Dashboard "Upload Study Material" section:
   - Keep the upload widget on dashboard for quick uploads
   - Add a "View all files →" link below the upload zone that goes to `/upload`
   - After successful upload, show a small file entry appear below the upload zone

---

### BLOCK 3 — Question Bank Page

**Problem:** No way to browse, search, or manage individual questions.

**Tasks:**

1. **Backend** — update `GET /content/questions`:
```
GET /content/questions
  ?subject_id=    (filter by subject)
  ?difficulty=    (easy|medium|hard)
  ?file_id=       (filter by source file)
  ?has_explanation= (true|false)
  ?search=        (text search on question content)
  ?page=1&limit=20
  → { items: [...], total, page, pages }
```

2. **Backend** — add:
```
PUT    /content/questions/{id}         → { content, options, answer, explanation, difficulty, subject_id }
DELETE /content/questions/{id}         → soft delete
DELETE /content/questions/bulk         → body: { ids: [...] } → soft delete all
PATCH  /content/questions/bulk/subject → body: { ids: [...], subject_id }
POST   /content/questions/{id}/restore → restore within 5-minute window
```

3. **Frontend** — create page `/questions`:
   - Left sidebar (220px): filter panel
     - Subject multi-select (color badges)
     - Difficulty checkboxes (Easy / Medium / Hard)
     - Source file dropdown
     - Has explanation toggle
   - Main area: paginated table
     - Columns: #, Question (2-line truncate), Subject, Difficulty, Answer, Has Explanation, Actions
     - Row checkbox for bulk select
     - Bulk action bar (appears when rows selected): "Reassign Subject" | "Delete X"
     - Actions column: Edit button | Delete button
   - Edit question: opens modal with all fields editable (question text, options A-D, answer, explanation, subject, difficulty)
   - Add link to `/questions` in the main navigation

---

### BLOCK 4 — Exam Persistence & History

**Problem:** Exams disappear after completion. No way to review past exams or retry them.

**Tasks:**

1. **DB**:
```sql
ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
```
Backfill: `UPDATE exams SET is_completed = TRUE WHERE id IN (SELECT exam_id FROM exam_results);`

2. **Backend** — update `POST /practice/complete`:
   - Set `exams.is_completed = TRUE`, `exams.completed_at = NOW()`
   - Never delete exams on completion

3. **Backend** — update `GET /exam/list`:
```
GET /exam/list
  ?status=completed|in_progress|all
  ?subject_id=
  ?page=1&limit=20
  → { items: [{id, title, subject, score, total_questions, is_completed, created_at, completed_at}], total }
```

4. **Backend** — ensure `GET /review/{exam_id}` returns:
   - All questions in exam
   - Per question: user's selected answer, correct answer, is_correct, explanation, time_spent_sec
   - Exam summary: score, correct_count, total_questions, completed_at

5. **Frontend** — upgrade `/exams` page to card grid:
   - Replace table with card grid (2–3 columns responsive)
   - Each card: subject badge, title, score ring (color-coded ≥80% green / 60-79% amber / <60% red / in-progress grey), question count, date, action buttons
   - Completed card actions: "Review" | "Retry" | "⋯ → Delete"
   - In-progress card actions: "Continue" | "Abandon" | "⋯ → Delete"
   - Filter bar: All / Completed / In Progress + subject dropdown
   - Empty state: "No exams yet — Generate your first exam →"

6. **Frontend** — upgrade `/review/[id]` page:
   - Score banner at top: large score percentage + correct/total count + time taken
   - Full question list (not just summary):
     - Each question: full text, all 4 options displayed
     - Highlight: user pick (blue), correct answer (green), wrong pick (red)
     - Explanation panel below each question (collapsed by default, auto-expand if wrong answer)
   - Stats sidebar (sticky): correct / incorrect / skipped + accuracy by topic
   - "Retry" button → calls `POST /exam/generate` with same subject/config → redirects to new exam
   - "AI Review" section at bottom (if `llm_review` exists in exam_results)

---

### BLOCK 5 — Deletion Features

**Problem:** Data Management section exists on dashboard but Delete All / Full Reset buttons are not functional. No per-item deletion on file library or exam history.

**Tasks:**

1. **Backend** — add deletion endpoints:
```
DELETE /exam/{id}                  → soft delete exam + cascade to attempts + exam_result
DELETE /exam/bulk                  → body: { ids: [...] }
DELETE /content/files/{id}         → soft delete file + its questions
POST   /exam/{id}/restore          → restore within 5 minutes
POST   /content/files/{id}/restore → restore within 5 minutes

# Nuclear (require confirmation_token)
POST   /user/data/reset-token      → returns { token, expires_in: 300 }
DELETE /user/data/exams            → body: { confirmation_token }
DELETE /user/data/questions        → body: { confirmation_token }
DELETE /user/data/all              → body: { confirmation_token }
```

2. **Backend** — add background purge job:
   - Every 10 minutes, hard-delete rows where `deleted_at < NOW() - INTERVAL '5 minutes'`
   - Apply to: `uploaded_files`, `questions`, `exams`

3. **Frontend** — build reusable `ConfirmDialog` component:
   - Props: `title`, `description`, `itemsSummary: string[]`, `onConfirm`, `onCancel`
   - "Confirm" button disabled for first 2 seconds after open
   - ESC to cancel, click outside to cancel

4. **Frontend** — build `NuclearConfirmDialog` component:
   - Shows list of what will be deleted with counts
   - Input field: user must type exact phrase to enable confirm button
   - Phrases: `DELETE MY EXAMS` / `DELETE MY QUESTIONS` / `RESET ALL MY DATA`
   - Two-step: first call `POST /user/data/reset-token`, then call delete endpoint with token

5. **Frontend** — wire up Dashboard Data Management section:
   - "Documents & Questions" card: show live counts from `GET /analytics/summary`
   - "Exams & Results" card: show live counts
   - Both cards: add "Manage →" link to `/upload` and `/exams` respectively
   - "Delete all exam history" → NuclearConfirmDialog → `DELETE /user/data/exams`
   - "Delete all questions & documents" → NuclearConfirmDialog → `DELETE /user/data/questions`
   - "Reset all my data" → NuclearConfirmDialog → `DELETE /user/data/all`

6. **Frontend** — add undo toast:
   - After any single-item delete (file, exam, question): show toast "Deleted · Undo" for 5 seconds
   - Undo calls the corresponding `/restore` endpoint
   - Use a `useToast` hook — toast stacks at bottom-right, auto-dismiss after 5s

---

### BLOCK 6 — Dashboard Analytics Upgrade

**Problem:** Dashboard shows only 2 stat cards. Missing score timeline, subject breakdown, and activity heatmap.

**Tasks:**

1. **Backend** — add analytics endpoints:
```
GET /analytics/summary
  → { total_exams_created, total_exams_completed, average_score, streak_days,
      total_questions_answered, total_files_uploaded }

GET /analytics/score-history?subject_id=&limit=50
  → [{ exam_id, title, subject_name, subject_color, score, completed_at }]

GET /analytics/by-subject
  → [{ subject_id, subject_name, color, total_attempted, correct, accuracy, exams_count }]

GET /analytics/activity
  → [{ date: "YYYY-MM-DD", count: N }]   ← last 365 days
```

2. **Frontend** — upgrade Dashboard layout (dark theme already in place):

**Row 1 — Stat cards** (expand from 2 to 4):
- Exams Completed (existing)
- Overall Accuracy (existing, rename to "Average Score")
- Questions Answered (new) — from `total_questions_answered`
- Study Streak (new) — from `streak_days`, show flame emoji + "N days"

**Row 2 — Charts** (add below stat cards):
- Score Timeline (2/3 width): `recharts LineChart`
  - X-axis: exam dates, Y-axis: score %
  - One line per subject, each line colored by subject color
  - Dashed reference line at 80%
  - Subject toggle chips above chart
  - Data from `GET /analytics/score-history`
- Subject Breakdown (1/3 width): `recharts PieChart` (donut)
  - Each slice = one subject, colored by subject color
  - Below: ranked list with accuracy % bars
  - Data from `GET /analytics/by-subject`

**Row 3 — Activity Heatmap** (full width, add below charts):
- 52×7 grid of small squares (GitHub contribution style)
- Color intensity based on questions answered that day (5 levels using subject accent blue)
- Hover tooltip: date + count
- Month labels on X-axis
- Data from `GET /analytics/activity`

**Row 4 — Bottom panels** (already partially exists, enhance):
- Recent Exams (left): last 5 completed, each row has subject badge + score chip + "Review →"
- Weak Topics (right): subjects with accuracy < 70%, sorted worst first, each row has "Practice →" shortcut that pre-fills `/exam/create` with that subject

---

### BLOCK 7 — Navigation Update

**Problem:** New pages (`/upload`, `/questions`, `/exams`) need to be reachable from the nav.

**Tasks:**

1. Update the main sidebar/navbar to include:
```
Dashboard     → /dashboard
Upload        → /upload       (new)
Questions     → /questions    (new)
Exams         → /exams        (new, if not already linked)
```

2. Add breadcrumbs to `/questions`, `/upload`, `/review/[id]` pages.

---

## Implementation Order (do in this sequence)

```
1. DB migrations (BLOCK 1 schema first, then BLOCK 4, BLOCK 5)
2. BLOCK 1 backend (subjects CRUD + upload update)
3. BLOCK 5 backend (all deletion endpoints + purge job)
4. BLOCK 4 backend (exam persistence + review endpoint)
5. BLOCK 6 backend (analytics endpoints)
6. BLOCK 2 backend (file library endpoints)
7. BLOCK 3 backend (question bank endpoints)

8. BLOCK 7 frontend (navigation first — needed for all pages)
9. BLOCK 1 frontend (subject selector on upload widget)
10. BLOCK 5 frontend (ConfirmDialog + NuclearConfirmDialog components + wire dashboard buttons)
11. BLOCK 2 frontend (/upload page with file library)
12. BLOCK 4 frontend (/exams card grid + /review extended)
13. BLOCK 3 frontend (/questions bank page)
14. BLOCK 6 frontend (dashboard charts + heatmap)
```

---

## Validation Checklist

After implementation, verify each block:

- [ ] BLOCK 1: Upload widget has subject selector. Uploaded questions have correct `subject_id` in DB.
- [ ] BLOCK 2: `/upload` page shows file library. Status updates live while parsing.
- [ ] BLOCK 3: `/questions` page lists all questions with filters. Edit modal saves correctly.
- [ ] BLOCK 4: After completing an exam, it appears in `/exams`. Review page shows full question list with highlights.
- [ ] BLOCK 5: Dashboard Delete All buttons trigger typed confirmation. Single-item deletes show undo toast. Data is actually removed after 5 minutes.
- [ ] BLOCK 6: Dashboard shows 4 stat cards + score timeline chart + donut chart + heatmap.
- [ ] BLOCK 7: All new pages reachable from navigation.

---

## Do NOT change

- Port assignments (frontend: 6000, backend: 5000, ai-core: 6100)
- Auth flow (JWT)
- Existing practice session flow (`/practice/[id]`)
- Docker Compose configuration (unless adding a new service)
- `.env` structure (only add new keys, never remove existing)

---

*Upgrade prompt version: 1.0 | Targets current running app | Based on supplements v2.1 + v2.2*