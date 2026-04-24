from fastapi import FastAPI, UploadFile, File, HTTPException
from dotenv import load_dotenv
import tempfile

load_dotenv()
import shutil
import os
from parser import extract_text_from_pdf, extract_text_from_docx, parse_questions
from llm_service import parse_text_with_llm, generate_exam_questions, review_exam
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI(title="AI Core Parsing Service")

@app.post("/parse")
async def parse_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, file.filename)
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        if file.filename.endswith('.pdf'):
            text = extract_text_from_pdf(temp_path)
        else:
            text = extract_text_from_docx(temp_path)
            
        questions = parse_questions(text)
        return {"filename": file.filename, "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/parse-llm")
async def parse_file_llm(file: UploadFile = File(...)):
    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, file.filename)
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        if file.filename.endswith('.pdf'):
            text = extract_text_from_pdf(temp_path)
        else:
            text = extract_text_from_docx(temp_path)
            
        questions = parse_text_with_llm(text)
        return {"filename": file.filename, "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

class ExamGenRequest(BaseModel):
    pool: List[Dict[str, Any]]
    num_questions: int
    weak_topics: List[str]

@app.post("/generate-exam")
def generate_exam(req: ExamGenRequest):
    selected = generate_exam_questions(req.pool, req.num_questions, req.weak_topics)
    return {"questions": selected}

class ReviewRequest(BaseModel):
    exam_data: Dict[str, Any]

@app.post("/review-exam")
def review_exam_endpoint(req: ReviewRequest):
    review = review_exam(req.exam_data)
    return {"review": review}
