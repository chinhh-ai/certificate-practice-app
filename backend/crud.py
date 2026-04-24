from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from models import Subject, Question, Attempt, User, Exam, ExamResult, UploadedFile
import schemas
from datetime import datetime, timedelta
import re

# ─── Utils ────────────────────────────────────────────────────────────────────
def _slugify(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

# ─── Subjects ─────────────────────────────────────────────────────────────────
def get_subjects(db: Session):
    return db.query(Subject).order_by(Subject.name).all()

def get_subject_by_slug(db: Session, slug: str):
    return db.query(Subject).filter(Subject.slug == slug).first()

def create_subject(db: Session, data: schemas.SubjectCreate):
    slug = _slugify(data.name)
    existing = db.query(Subject).filter(Subject.slug == slug).first()
    if existing:
        return existing
    subj = Subject(name=data.name, slug=slug, color=data.color or '#4F86C6')
    db.add(subj)
    db.commit()
    db.refresh(subj)
    return subj

def get_or_create_subject_by_name(db: Session, name: str):
    slug = _slugify(name)
    existing = db.query(Subject).filter(Subject.slug == slug).first()
    if existing:
        return existing
    return create_subject(db, schemas.SubjectCreate(name=name))

def update_subject(db: Session, subject_id: str, data: schemas.SubjectUpdate):
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        return None
    subj.name = data.name
    subj.color = data.color or subj.color
    subj.slug = _slugify(data.name)
    db.commit()
    db.refresh(subj)
    return subj

def delete_subject(db: Session, subject_id: str, force: bool = False):
    count = db.query(func.count(Question.id)).filter(Question.subject_id == subject_id, Question.deleted_at == None).scalar()
    if count > 0 and not force:
        return None, count
    if force:
        db.query(Question).filter(Question.subject_id == subject_id).update({"subject_id": None})
    db.query(Subject).filter(Subject.id == subject_id).delete()
    db.commit()
    return True, 0

def get_subject_question_count(db: Session, subject_id: str):
    return db.query(func.count(Question.id)).filter(Question.subject_id == subject_id, Question.deleted_at == None).scalar()

# ─── Questions ────────────────────────────────────────────────────────────────
def get_questions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Question).filter(Question.deleted_at == None).offset(skip).limit(limit).all()

def get_questions_filtered(db: Session, subject_id=None, difficulty=None, file_id=None,
                            has_explanation=None, search=None, page=1, limit=20):
    q = db.query(Question).filter(Question.deleted_at == None)
    if subject_id:
        q = q.filter(Question.subject_id == subject_id)
    if difficulty:
        q = q.filter(Question.difficulty == difficulty)
    if file_id:
        q = q.filter(Question.source_file_id == file_id)
    if has_explanation is not None:
        if has_explanation:
            q = q.filter(Question.explanation != None, Question.explanation != '')
        else:
            q = q.filter(or_(Question.explanation == None, Question.explanation == ''))
    if search:
        q = q.filter(Question.content.ilike(f'%{search}%'))
    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()
    return items, total

def create_question(db: Session, question: schemas.QuestionCreate):
    data = question.model_dump()
    if not data.get('difficulty'):
        data['difficulty'] = 'medium'
    db_q = Question(**data)
    db.add(db_q)
    db.commit()
    db.refresh(db_q)
    return db_q

def update_question(db: Session, question_id: str, data: schemas.QuestionUpdate):
    q = db.query(Question).filter(Question.id == question_id, Question.deleted_at == None).first()
    if not q:
        return None
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(q, field, val)
    db.commit()
    db.refresh(q)
    return q

def soft_delete_question(db: Session, question_id: str):
    q = db.query(Question).filter(Question.id == question_id, Question.deleted_at == None).first()
    if not q:
        return None
    q.deleted_at = datetime.utcnow()
    db.commit()
    return q

def restore_question(db: Session, question_id: str):
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    q = db.query(Question).filter(Question.id == question_id, Question.deleted_at >= cutoff).first()
    if not q:
        return None
    q.deleted_at = None
    db.commit()
    return q

def soft_delete_questions_bulk(db: Session, ids: list):
    qs = db.query(Question).filter(Question.id.in_(ids), Question.deleted_at == None).all()
    for q in qs:
        q.deleted_at = datetime.utcnow()
    db.commit()
    return len(qs)

def bulk_assign_subject(db: Session, ids: list, subject_id: str):
    db.query(Question).filter(Question.id.in_(ids)).update({"subject_id": subject_id}, synchronize_session=False)
    db.commit()
    return len(ids)

# ─── Uploaded Files ───────────────────────────────────────────────────────────
def create_uploaded_file(db: Session, filename: str, user_id: str, question_count: int = 0,
                          subject_id: str = None, file_type: str = None, file_size_kb: int = None):
    f = UploadedFile(filename=filename, original_name=filename, user_id=user_id,
                     question_count=question_count, subject_id=subject_id,
                     file_type=file_type, file_size_kb=file_size_kb,
                     status='done', parsed_at=datetime.utcnow())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f

def get_uploaded_files(db: Session, user_id: str):
    files = db.query(UploadedFile).filter(UploadedFile.user_id == user_id, UploadedFile.deleted_at == None).order_by(UploadedFile.created_at.desc()).all()
    result = []
    for f in files:
        subj = db.query(Subject).filter(Subject.id == f.subject_id).first() if f.subject_id else None
        d = {c.name: getattr(f, c.name) for c in f.__table__.columns}
        d['subject_name'] = subj.name if subj else None
        d['subject_color'] = subj.color if subj else None
        result.append(d)
    return result

def soft_delete_file(db: Session, file_id: str, user_id: str):
    f = db.query(UploadedFile).filter(UploadedFile.id == file_id, UploadedFile.user_id == user_id, UploadedFile.deleted_at == None).first()
    if not f:
        return None, 0
    f.deleted_at = datetime.utcnow()
    qs = db.query(Question).filter(Question.source_file_id == file_id, Question.deleted_at == None).all()
    for q in qs:
        q.deleted_at = datetime.utcnow()
    db.commit()
    return f, len(qs)

def restore_file(db: Session, file_id: str, user_id: str):
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    f = db.query(UploadedFile).filter(UploadedFile.id == file_id, UploadedFile.user_id == user_id, UploadedFile.deleted_at >= cutoff).first()
    if not f:
        return None
    f.deleted_at = None
    qs = db.query(Question).filter(Question.source_file_id == file_id).all()
    for q in qs:
        q.deleted_at = None
    db.commit()
    return f

# ─── Attempts ─────────────────────────────────────────────────────────────────
def upsert_attempt(db: Session, attempt: schemas.AttemptCreate, user_id: str):
    is_correct = 0
    if attempt.question_id:
        question = db.query(Question).filter(Question.id == attempt.question_id).first()
        is_correct = 1 if question and question.answer == attempt.selected_answer else 0
    
    if attempt.exam_id and attempt.question_id:
        existing = db.query(Attempt).filter(Attempt.exam_id == attempt.exam_id, Attempt.question_id == attempt.question_id).first()
        if existing:
            existing.selected_answer = attempt.selected_answer
            existing.is_correct = is_correct
            existing.time_spent_sec = attempt.time_spent_sec
            existing.timestamp = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing
            
    a = Attempt(**attempt.model_dump(), user_id=user_id, is_correct=is_correct)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a

# ─── Exams ────────────────────────────────────────────────────────────────────
def create_exam(db: Session, exam: schemas.ExamCreate, user_id: str):
    e = Exam(num_questions=exam.num_questions, user_id=user_id, subject_id=exam.subject_id, question_ids=exam.question_ids or [])
    db.add(e)
    db.commit()
    db.refresh(e)
    return e

def upsert_exam_result(db: Session, result: schemas.ExamResultCreate):
    existing = db.query(ExamResult).filter(ExamResult.exam_id == result.exam_id, ExamResult.deleted_at == None).first()
    if existing:
        existing.score = result.score
        existing.llm_review = result.llm_review
        existing.created_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    r = ExamResult(**result.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

def mark_exam_complete(db: Session, exam_id: str):
    e = db.query(Exam).filter(Exam.id == exam_id).first()
    if e:
        e.is_completed = True
        e.completed_at = datetime.utcnow()
        db.commit()

def get_exam_list(db: Session, user_id: str, status: str = 'all', subject_id: str = None, page: int = 1, limit: int = 20):
    q = db.query(Exam).filter(Exam.user_id == user_id, Exam.deleted_at == None)
    if status == 'completed':
        q = q.filter(Exam.is_completed == True)
    elif status == 'in_progress':
        q = q.filter(Exam.is_completed == False)
    if subject_id:
        q = q.filter(Exam.subject_id == subject_id)
    total = q.count()
    exams = q.order_by(Exam.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    items = []
    for e in exams:
        subj = db.query(Subject).filter(Subject.id == e.subject_id).first() if e.subject_id else None
        result = db.query(ExamResult).filter(ExamResult.exam_id == e.id, ExamResult.deleted_at == None).order_by(ExamResult.created_at.desc()).first()
        items.append({
            "id": e.id, "subject_id": e.subject_id,
            "subject_name": subj.name if subj else "All Subjects",
            "subject_color": subj.color if subj else "#7C8394",
            "num_questions": e.num_questions, "is_completed": e.is_completed,
            "score": result.score if result else None,
            "created_at": e.created_at, "completed_at": e.completed_at
        })
    return items, total

def get_exam_review(db: Session, exam_id: str, user_id: str):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == user_id).first()
    if not exam:
        return None
    result = db.query(ExamResult).filter(ExamResult.exam_id == exam_id, ExamResult.deleted_at == None).first()
    attempts = db.query(Attempt).filter(Attempt.exam_id == exam_id).all()
    questions_data = []
    for attempt in attempts:
        q = db.query(Question).filter(Question.id == attempt.question_id).first() if attempt.question_id else None
        if q:
            questions_data.append({
                "id": q.id, "content": q.content, "options": q.options,
                "correct_answer": q.answer, "explanation": q.explanation,
                "selected_answer": attempt.selected_answer,
                "is_correct": attempt.is_correct, "time_spent_sec": attempt.time_spent_sec
            })
    return {
        "exam_id": exam_id, "score": result.score if result else 0,
        "llm_review": result.llm_review if result else None,
        "completed_at": exam.completed_at, "num_questions": exam.num_questions,
        "correct_count": sum(1 for q in questions_data if q["is_correct"]),
        "questions": questions_data
    }

def soft_delete_exam(db: Session, exam_id: str, user_id: str):
    e = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == user_id, Exam.deleted_at == None).first()
    if not e:
        return None
    e.deleted_at = datetime.utcnow()
    result = db.query(ExamResult).filter(ExamResult.exam_id == exam_id).first()
    if result:
        result.deleted_at = datetime.utcnow()
    db.commit()
    return e

def restore_exam(db: Session, exam_id: str, user_id: str):
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    e = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == user_id, Exam.deleted_at >= cutoff).first()
    if not e:
        return None
    e.deleted_at = None
    result = db.query(ExamResult).filter(ExamResult.exam_id == exam_id).first()
    if result:
        result.deleted_at = None
    db.commit()
    return e

def soft_delete_exams_bulk(db: Session, ids: list, user_id: str):
    exams = db.query(Exam).filter(Exam.id.in_(ids), Exam.user_id == user_id, Exam.deleted_at == None).all()
    for e in exams:
        e.deleted_at = datetime.utcnow()
        r = db.query(ExamResult).filter(ExamResult.exam_id == e.id).first()
        if r:
            r.deleted_at = datetime.utcnow()
    db.commit()
    return len(exams)

def delete_all_user_exams(db: Session, user_id: str):
    exams = db.query(Exam).filter(Exam.user_id == user_id, Exam.deleted_at == None).all()
    for e in exams:
        e.deleted_at = datetime.utcnow()
        r = db.query(ExamResult).filter(ExamResult.exam_id == e.id).first()
        if r:
            r.deleted_at = datetime.utcnow()
    db.commit()
    return len(exams)

def delete_all_user_questions(db: Session, user_id: str):
    files = db.query(UploadedFile).filter(UploadedFile.user_id == user_id, UploadedFile.deleted_at == None).all()
    total = 0
    for f in files:
        _, q_count = soft_delete_file(db, f.id, user_id)
        total += q_count
    return total

def purge_expired_soft_deletes(db: Session):
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    db.query(Question).filter(Question.deleted_at != None, Question.deleted_at < cutoff).delete(synchronize_session=False)
    db.query(ExamResult).filter(ExamResult.deleted_at != None, ExamResult.deleted_at < cutoff).delete(synchronize_session=False)
    db.query(Exam).filter(Exam.deleted_at != None, Exam.deleted_at < cutoff).delete(synchronize_session=False)
    db.query(UploadedFile).filter(UploadedFile.deleted_at != None, UploadedFile.deleted_at < cutoff).delete(synchronize_session=False)
    db.commit()

# ─── Analytics ────────────────────────────────────────────────────────────────
def get_analytics(db: Session, user_id: str):
    attempts = db.query(Attempt).filter(Attempt.user_id == user_id).all()
    total_q_answered = len(attempts)
    correct = sum(1 for a in attempts if a.is_correct == 1)
    exams = db.query(Exam).filter(Exam.user_id == user_id, Exam.deleted_at == None).all()
    results = db.query(ExamResult).join(Exam).filter(Exam.user_id == user_id, ExamResult.deleted_at == None).all()
    avg_score = (sum(r.score for r in results) / len(results)) if results else 0
    files = db.query(UploadedFile).filter(UploadedFile.user_id == user_id, UploadedFile.deleted_at == None).count()
    weak_areas = {}
    for a in attempts:
        if a.is_correct == 0 and a.question_id:
            q = db.query(Question).filter(Question.id == a.question_id).first()
            if q and q.topic:
                weak_areas[q.topic] = weak_areas.get(q.topic, 0) + 1
    weak_topics = [t for t, _ in sorted(weak_areas.items(), key=lambda x: x[1], reverse=True)[:5]]
    score_history = [{"date": r.created_at.strftime("%Y-%m-%d"), "score": r.score} for r in results]
    return {
        "total_attempts": total_q_answered, "correct": correct,
        "accuracy": (correct / total_q_answered * 100) if total_q_answered else 0,
        "total_exams_created": len(exams), "total_exams_completed": len(results),
        "average_score": round(avg_score, 1), "streak_days": 0,
        "total_questions_answered": total_q_answered, "total_files_uploaded": files,
        "weak_topics": weak_topics, "score_history": score_history
    }

def get_score_history(db: Session, user_id: str, subject_id: str = None, limit: int = 50):
    q = db.query(ExamResult, Exam).join(Exam).filter(Exam.user_id == user_id, ExamResult.deleted_at == None)
    if subject_id:
        q = q.filter(Exam.subject_id == subject_id)
    rows = q.order_by(ExamResult.created_at.asc()).limit(limit).all()
    result = []
    for r, e in rows:
        subj = db.query(Subject).filter(Subject.id == e.subject_id).first() if e.subject_id else None
        result.append({
            "exam_id": e.id, "subject_name": subj.name if subj else "All",
            "subject_color": subj.color if subj else "#58a6ff",
            "score": r.score, "completed_at": r.created_at.isoformat()
        })
    return result

def get_analytics_by_subject(db: Session, user_id: str):
    subjects = get_subjects(db)
    result = []
    for subj in subjects:
        attempts = db.query(Attempt).join(Question, Attempt.question_id == Question.id).filter(
            Attempt.user_id == user_id, Question.subject_id == subj.id).all()
        if not attempts:
            continue
        correct = sum(1 for a in attempts if a.is_correct == 1)
        exams_count = db.query(func.count(Exam.id)).filter(Exam.user_id == user_id, Exam.subject_id == subj.id, Exam.deleted_at == None).scalar()
        result.append({
            "subject_id": subj.id, "subject_name": subj.name, "color": subj.color,
            "total_attempted": len(attempts), "correct": correct,
            "accuracy": round(correct / len(attempts) * 100, 1), "exams_count": exams_count
        })
    return sorted(result, key=lambda x: x["accuracy"])

def get_analytics_activity(db: Session, user_id: str):
    from sqlalchemy import cast, Date as DateType
    rows = db.query(cast(Attempt.timestamp, DateType), func.count(Attempt.id)).filter(
        Attempt.user_id == user_id,
        Attempt.timestamp >= datetime.utcnow() - timedelta(days=365)
    ).group_by(cast(Attempt.timestamp, DateType)).all()
    return [{"date": str(date), "count": count} for date, count in rows]

def get_data_stats(db: Session, user_id: str):
    files = db.query(func.count(UploadedFile.id)).filter(UploadedFile.user_id == user_id, UploadedFile.deleted_at == None).scalar()
    questions = db.query(func.count(Question.id)).filter(Question.deleted_at == None).scalar()
    exams = db.query(func.count(Exam.id)).filter(Exam.user_id == user_id, Exam.deleted_at == None).scalar()
    completed = db.query(func.count(ExamResult.id)).join(Exam).filter(Exam.user_id == user_id, ExamResult.deleted_at == None).scalar()
    return {"total_files": files, "total_questions": questions, "total_exams_created": exams, "total_exams_completed": completed}

# ─── User ─────────────────────────────────────────────────────────────────────
def get_or_create_user(db: Session, username: str):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        user = User(username=username, hashed_password="hashed")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
