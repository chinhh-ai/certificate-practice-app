from sqlalchemy import Column, String, JSON, Integer, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

def gen_id():
    return str(uuid.uuid4())

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True)
    color = Column(String(7), default='#4F86C6')
    created_at = Column(DateTime, default=datetime.utcnow)

class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=True)
    file_type = Column(String(10), nullable=True)
    file_size_kb = Column(Integer, nullable=True)
    status = Column(String(20), default='done')
    question_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    parsed_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)

class Question(Base):
    __tablename__ = "questions"
    id = Column(String, primary_key=True, default=gen_id)
    content = Column(String, nullable=False)
    options = Column(JSON, nullable=False)
    answer = Column(String, nullable=False)
    explanation = Column(String, nullable=True)
    topic = Column(String, nullable=True)
    difficulty = Column(String, nullable=True)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    source_file_id = Column(String, ForeignKey("uploaded_files.id", ondelete="SET NULL"), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_id)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Attempt(Base):
    __tablename__ = "attempts"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    question_id = Column(String, ForeignKey("questions.id", ondelete="CASCADE"), nullable=True)
    exam_id = Column(String, ForeignKey("exams.id", ondelete="CASCADE"), nullable=True)
    selected_answer = Column(String)
    is_correct = Column(Integer)
    time_spent_sec = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Exam(Base):
    __tablename__ = "exams"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    num_questions = Column(Integer, nullable=False)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    question_ids = Column(JSON, default=list) # List of UUID strings

class ExamResult(Base):
    __tablename__ = "exam_results"
    id = Column(String, primary_key=True, default=gen_id)
    exam_id = Column(String, ForeignKey("exams.id", ondelete="CASCADE"))
    score = Column(Integer, nullable=False)
    llm_review = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
