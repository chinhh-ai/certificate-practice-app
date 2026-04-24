from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Query, Form
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import models, schemas, crud
from database import SessionLocal, engine
from apscheduler.schedulers.background import BackgroundScheduler
import requests, json, os, secrets
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Certificate Practice API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

AI_CORE_URL = os.getenv("AI_CORE_URL", "http://localhost:6100")
_reset_tokens: dict = {}

# ─── Background purge job ─────────────────────────────────────────────────────
def _purge_job():
    db = SessionLocal()
    try:
        crud.purge_expired_soft_deletes(db)
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(_purge_job, 'interval', minutes=10)
scheduler.start()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db)):
    return crud.get_or_create_user(db, "testuser")

# ──────────────────────────────────────────
# BLOCK 1 — Subjects
# ──────────────────────────────────────────
@app.get("/subjects")
def list_subjects(db: Session = Depends(get_db)):
    return crud.get_subjects(db)

@app.post("/subjects", response_model=schemas.Subject)
def create_subject(data: schemas.SubjectCreate, db: Session = Depends(get_db)):
    return crud.create_subject(db, data)

@app.put("/subjects/{subject_id}", response_model=schemas.Subject)
def update_subject(subject_id: str, data: schemas.SubjectUpdate, db: Session = Depends(get_db)):
    s = crud.update_subject(db, subject_id, data)
    if not s:
        raise HTTPException(404, "Subject not found")
    return s

@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: str, force: bool = Query(False), db: Session = Depends(get_db)):
    ok, count = crud.delete_subject(db, subject_id, force)
    if ok is None:
        raise HTTPException(409, f"Subject has {count} questions. Use ?force=true to unlink them.")
    return {"deleted": 1}

@app.get("/subjects/{subject_id}/question-count")
def get_subject_question_count(subject_id: str, db: Session = Depends(get_db)):
    return {"count": crud.get_subject_question_count(db, subject_id)}

# ──────────────────────────────────────────
# BLOCK 2 — Content Upload + File Library
# ──────────────────────────────────────────
@app.post("/content/upload")
async def upload_content(
    file: UploadFile = File(...),
    subject_id: Optional[str] = Form(None),
    subject_name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    # Resolve subject
    if not subject_id and subject_name:
        subj = crud.get_or_create_subject_by_name(db, subject_name)
        subject_id = subj.id
    elif not subject_id:
        default = crud.get_subject_by_slug(db, 'uncategorized')
        subject_id = default.id if default else None

    file_size_kb = None
    file_type = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'unknown'

    if file.filename.endswith('.json'):
        content = await file.read()
        data = json.loads(content)
        if isinstance(data, dict):
            data = [data]
        db_file = crud.create_uploaded_file(db, file.filename, user.id, question_count=len(data), subject_id=subject_id, file_type='json')
        saved_qs = []
        for q in data:
            q_create = schemas.QuestionCreate(
                content=q.get("question", ""), options=q.get("options", []),
                answer=q.get("answer", ""), topic=q.get("topic"),
                difficulty=q.get("difficulty"), explanation=q.get("explanation"),
                source_file_id=db_file.id, subject_id=subject_id
            )
            saved_qs.append(crud.create_question(db, q_create))
        return {"status": "success", "imported": len(saved_qs), "file_id": db_file.id}

    elif file.filename.endswith(('.pdf', '.docx')):
        try:
            raw_content = await file.read()
            file_size_kb = len(raw_content) // 1024
            files = {"file": (file.filename, raw_content, file.content_type)}
            response = requests.post(f"{AI_CORE_URL}/parse-llm", files=files)
            response.raise_for_status()
            parsed_data = response.json()
            questions = parsed_data.get("questions", [])
            db_file = crud.create_uploaded_file(db, file.filename, user.id, question_count=len(questions),
                                                 subject_id=subject_id, file_type=file_type, file_size_kb=file_size_kb)
            saved_qs = []
            for q_data in questions:
                if not isinstance(q_data, dict):
                    continue
                q_create = schemas.QuestionCreate(
                    content=q_data.get("question", ""), options=q_data.get("options", []),
                    answer=q_data.get("answer", ""), explanation=q_data.get("explanation"),
                    source_file_id=db_file.id, subject_id=subject_id
                )
                saved_qs.append(crud.create_question(db, q_create))
            return {"status": "success", "imported": len(saved_qs), "file_id": db_file.id}
        except Exception as e:
            raise HTTPException(500, f"Failed to parse via AI Core: {str(e)}")
    else:
        raise HTTPException(400, "Unsupported file format")

@app.get("/content/files")
def list_files(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return crud.get_uploaded_files(db, user.id)

@app.get("/content/files/{file_id}/status")
def get_file_status(file_id: str, db: Session = Depends(get_db)):
    f = db.query(models.UploadedFile).filter(models.UploadedFile.id == file_id).first()
    if not f:
        raise HTTPException(404, "File not found")
    return {"status": f.status, "question_count": f.question_count, "error_message": f.error_message}

@app.delete("/content/files/{file_id}")
def delete_file(file_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    f, deleted_q = crud.soft_delete_file(db, file_id, user.id)
    if not f:
        raise HTTPException(404, "File not found")
    return {"deleted_file": 1, "deleted_questions": deleted_q, "file_id": file_id}

@app.post("/content/files/{file_id}/restore")
def restore_file(file_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    f = crud.restore_file(db, file_id, user.id)
    if not f:
        raise HTTPException(404, "File not found or restore window expired")
    return {"restored": True}

# ──────────────────────────────────────────
# BLOCK 3 — Question Bank
# ──────────────────────────────────────────
@app.get("/content/questions")
def list_questions(
    subject_id: Optional[str] = None, difficulty: Optional[str] = None,
    file_id: Optional[str] = None, has_explanation: Optional[bool] = None,
    search: Optional[str] = None, page: int = 1, limit: int = 20,
    db: Session = Depends(get_db)
):
    items, total = crud.get_questions_filtered(db, subject_id, difficulty, file_id, has_explanation, search, page, limit)
    return {"items": items, "total": total, "page": page, "pages": max(1, -(-total // limit))}

@app.put("/content/questions/{question_id}")
def update_question(question_id: str, data: schemas.QuestionUpdate, db: Session = Depends(get_db)):
    q = crud.update_question(db, question_id, data)
    if not q:
        raise HTTPException(404, "Question not found")
    return q

@app.delete("/content/questions/bulk")
def delete_questions_bulk(req: schemas.BulkIdsRequest, db: Session = Depends(get_db)):
    count = crud.soft_delete_questions_bulk(db, req.ids)
    return {"deleted_questions": count}

@app.patch("/content/questions/bulk/subject")
def bulk_assign_subject(req: schemas.BulkSubjectRequest, db: Session = Depends(get_db)):
    crud.bulk_assign_subject(db, req.ids, req.subject_id)
    return {"updated": len(req.ids)}

@app.delete("/content/questions/{question_id}")
def delete_question(question_id: str, db: Session = Depends(get_db)):
    q = crud.soft_delete_question(db, question_id)
    if not q:
        raise HTTPException(404, "Question not found")
    return {"deleted": 1}

@app.post("/content/questions/{question_id}/restore")
def restore_question(question_id: str, db: Session = Depends(get_db)):
    q = crud.restore_question(db, question_id)
    if not q:
        raise HTTPException(404, "Question not found or restore window expired")
    return {"restored": True}

# ──────────────────────────────────────────
# BLOCK 4 — Practice, Exams & Review
# ──────────────────────────────────────────
@app.get("/practice/questions", response_model=list[schemas.Question])
def get_practice_questions(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return crud.get_questions(db, skip=skip, limit=limit)

@app.post("/practice/submit", response_model=schemas.Attempt)
def submit_answer(attempt: schemas.AttemptCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return crud.upsert_attempt(db, attempt, user.id)

@app.post("/practice/generate-exam")
def generate_practice_exam(
    num_questions: int = 50,
    subject_id: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    if subject_id == "": subject_id = None
    all_qs = crud.get_questions(db, skip=0, limit=2000)
    if subject_id:
        all_qs = [q for q in all_qs if str(q.subject_id) == subject_id]
    analytics = crud.get_analytics(db, user.id)
    weak_topics = analytics.get("weak_topics", [])
    pool = [{"id": str(q.id), "content": q.content, "options": q.options, "answer": q.answer,
             "topic": q.topic, "difficulty": q.difficulty, "explanation": q.explanation} for q in all_qs]
    try:
        resp = requests.post(f"{AI_CORE_URL}/generate-exam", json={"pool": pool, "num_questions": num_questions, "weak_topics": weak_topics})
        resp.raise_for_status()
        exam_questions = resp.json().get("questions", [])
        q_ids = [str(q.get("id")) for q in exam_questions]
        exam = crud.create_exam(db, schemas.ExamCreate(num_questions=len(exam_questions), subject_id=subject_id, question_ids=q_ids), user.id)
        return {"exam": exam, "questions": exam_questions}
    except Exception as e:
        raise HTTPException(500, f"Failed to generate exam: {str(e)}")

@app.get("/practice/exam/{exam_id}")
def get_exam_for_resume(exam_id: str, db: Session = Depends(get_db)):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(404, "Exam not found")
    # Fetch questions based on stored IDs
    q_ids = exam.question_ids or []
    questions = db.query(models.Question).filter(models.Question.id.in_(q_ids)).all()
    q_map = {str(q.id): q for q in questions}
    ordered = [q_map[qid] for qid in q_ids if qid in q_map]
    
    # Fetch existing attempts to resume progress
    attempts = db.query(models.Attempt).filter(models.Attempt.exam_id == exam_id).all()
    
    return {"exam": exam, "questions": ordered, "attempts": attempts}

class SubmitExamRequest(BaseModel):
    exam_id: str
    attempts: List[schemas.AttemptCreate]

@app.post("/practice/submit-exam")
def submit_exam(req: SubmitExamRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    correct_count = 0
    recorded = []
    for attempt in req.attempts:
        attempt.exam_id = req.exam_id
        saved = crud.upsert_attempt(db, attempt, user.id)
        if saved.is_correct == 1:
            correct_count += 1
        recorded.append({"question_id": saved.question_id, "is_correct": saved.is_correct, "time_spent_sec": saved.time_spent_sec})
    total = len(req.attempts)
    score = int((correct_count / total * 100)) if total > 0 else 0
    crud.mark_exam_complete(db, req.exam_id)
    llm_review = None
    try:
        payload = {"exam_data": {"score": score, "total": total, "correct": correct_count, "attempts": recorded}}
        review_resp = requests.post(f"{AI_CORE_URL}/review-exam", json=payload)
        if review_resp.status_code == 200:
            llm_review = review_resp.json().get("review")
    except:
        pass
    
    result = crud.upsert_exam_result(db, schemas.ExamResultCreate(exam_id=req.exam_id, score=score, llm_review=llm_review))
    return result

@app.get("/exam/list")
def list_exams(status: str = "all", subject_id: Optional[str] = None, page: int = 1, limit: int = 20,
               db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    items, total = crud.get_exam_list(db, user.id, status, subject_id, page, limit)
    return {"items": items, "total": total, "page": page, "pages": max(1, -(-total // limit))}

@app.get("/review/{exam_id}")
def get_review(exam_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    data = crud.get_exam_review(db, exam_id, user.id)
    if not data:
        raise HTTPException(404, "Exam not found")
    return data

@app.delete("/exam/{exam_id}")
def delete_exam(exam_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    e = crud.soft_delete_exam(db, exam_id, user.id)
    if not e:
        raise HTTPException(404, "Exam not found")
    return {"deleted_exam": 1}

@app.post("/exam/{exam_id}/restore")
def restore_exam(exam_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    e = crud.restore_exam(db, exam_id, user.id)
    if not e:
        raise HTTPException(404, "Exam not found or restore window expired")
    return {"restored": True}

@app.delete("/exam/bulk")
def delete_exams_bulk(req: schemas.BulkIdsRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    count = crud.soft_delete_exams_bulk(db, req.ids, user.id)
    return {"deleted_exams": count}

# ──────────────────────────────────────────
# BLOCK 5 — Nuclear Deletion
# ──────────────────────────────────────────
def _validate_token(user_id: str, token: str):
    stored = _reset_tokens.get(user_id)
    if not stored or stored["token"] != token or stored["expires"] < datetime.utcnow():
        raise HTTPException(403, "Invalid or expired confirmation token")
    del _reset_tokens[user_id]

@app.post("/user/data/reset-token")
def get_reset_token(user: models.User = Depends(get_current_user)):
    token = secrets.token_hex(8)
    _reset_tokens[user.id] = {"token": token, "expires": datetime.utcnow() + timedelta(minutes=5)}
    return {"token": token, "expires_in": 300}

@app.delete("/user/data/exams")
def delete_all_exams(req: schemas.NuclearRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    _validate_token(user.id, req.confirmation_token)
    count = crud.delete_all_user_exams(db, user.id)
    return {"deleted_exams": count}

@app.delete("/user/data/questions")
def delete_all_questions(req: schemas.NuclearRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    _validate_token(user.id, req.confirmation_token)
    count = crud.delete_all_user_questions(db, user.id)
    return {"deleted_questions": count}

@app.delete("/user/data/all")
def delete_all_data(req: schemas.NuclearRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    _validate_token(user.id, req.confirmation_token)
    e = crud.delete_all_user_exams(db, user.id)
    q = crud.delete_all_user_questions(db, user.id)
    return {"deleted_exams": e, "deleted_questions": q}

# ──────────────────────────────────────────
# BLOCK 6 — Analytics
# ──────────────────────────────────────────
@app.get("/analytics/summary")
def analytics_summary(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return crud.get_analytics(db, user.id)

@app.get("/analytics/score-history")
def score_history(subject_id: Optional[str] = None, limit: int = 50, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return crud.get_score_history(db, user.id, subject_id, limit)

@app.get("/analytics/by-subject")
def analytics_by_subject(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return crud.get_analytics_by_subject(db, user.id)

@app.get("/analytics/activity")
def analytics_activity(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return crud.get_analytics_activity(db, user.id)

@app.get("/user/data/stats")
def data_stats(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return crud.get_data_stats(db, user.id)
