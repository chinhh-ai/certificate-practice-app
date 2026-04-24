from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# ─── Subjects ─────────────────────────────────────────────────────────────────
class SubjectBase(BaseModel):
    name: str
    color: Optional[str] = '#4F86C6'

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: str
    slug: str
    created_at: datetime
    class Config:
        from_attributes = True

# ─── Questions ────────────────────────────────────────────────────────────────
class QuestionBase(BaseModel):
    content: str
    options: List[str]
    answer: str
    explanation: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    subject_id: Optional[str] = None
    source_file_id: Optional[str] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(BaseModel):
    content: Optional[str] = None
    options: Optional[List[str]] = None
    answer: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[str] = None
    subject_id: Optional[str] = None

class Question(QuestionBase):
    id: str
    class Config:
        from_attributes = True

class PaginatedQuestions(BaseModel):
    items: List[Question]
    total: int
    page: int
    pages: int

# ─── Attempts ─────────────────────────────────────────────────────────────────
class AttemptBase(BaseModel):
    question_id: Optional[str] = None
    exam_id: Optional[str] = None
    selected_answer: str
    time_spent_sec: Optional[int] = None

class AttemptCreate(AttemptBase):
    pass

class Attempt(AttemptBase):
    id: str
    user_id: str
    is_correct: int
    timestamp: datetime
    class Config:
        from_attributes = True

# ─── Exams ────────────────────────────────────────────────────────────────────
class ExamBase(BaseModel):
    num_questions: int

class ExamCreate(ExamBase):
    subject_id: Optional[str] = None
    question_ids: Optional[List[str]] = []

class Exam(ExamBase):
    id: str
    user_id: str
    subject_id: Optional[str] = None
    question_ids: Optional[List[str]] = []
    is_completed: bool = False
    created_at: datetime
    completed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ExamListItem(BaseModel):
    id: str
    subject_id: Optional[str] = None
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None
    num_questions: int
    is_completed: bool
    score: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ─── Exam Results ─────────────────────────────────────────────────────────────
class ExamResultBase(BaseModel):
    exam_id: str
    score: int
    llm_review: Optional[str] = None

class ExamResultCreate(ExamResultBase):
    pass

class ExamResult(ExamResultBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# ─── Uploaded Files ───────────────────────────────────────────────────────────
class UploadedFileOut(BaseModel):
    id: str
    filename: str
    original_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size_kb: Optional[int] = None
    status: Optional[str] = 'done'
    question_count: int = 0
    subject_id: Optional[str] = None
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    parsed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ─── Analytics ────────────────────────────────────────────────────────────────
class AnalyticsSummary(BaseModel):
    total_exams_created: int = 0
    total_exams_completed: int = 0
    average_score: float = 0
    streak_days: int = 0
    total_questions_answered: int = 0
    total_files_uploaded: int = 0
    weak_topics: List[str] = []
    score_history: List[Any] = []

class SubjectBreakdown(BaseModel):
    subject_id: str
    subject_name: str
    color: str
    total_attempted: int
    correct: int
    accuracy: float
    exams_count: int

# ─── Misc ─────────────────────────────────────────────────────────────────────
class BulkIdsRequest(BaseModel):
    ids: List[str]

class BulkSubjectRequest(BaseModel):
    ids: List[str]
    subject_id: str

class DeleteResponse(BaseModel):
    deleted: int
    message: str

class NuclearRequest(BaseModel):
    confirmation_token: str

class DataStats(BaseModel):
    total_files: int
    total_questions: int
    total_exams_created: int
    total_exams_completed: int
