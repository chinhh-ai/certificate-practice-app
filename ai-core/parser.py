from pypdf import PdfReader
from docx import Document
import re

def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(file_path: str) -> str:
    doc = Document(file_path)
    return "\n".join([p.text for p in doc.paragraphs])

def parse_questions(text: str) -> list:
    """
    Splits unstructured text into structured questions.
    Pipeline: text -> split -> extract question, options, answer.
    """
    # This regex looks for patterns like "1.", "2.", "Câu 1:", "Question 1:" etc.
    # to split the text into individual questions.
    # It assumes questions are separated by a blank line or a new question number.
    questions = []
    
    # Split text into chunks that start with a number followed by a dot or 'Câu'/'Question'
    # Use split regex keeping the delimiters
    parts = re.split(r'\n(?=\d+[\.\)]|Câu\s+\d+:|Question\s+\d+:)', text, flags=re.IGNORECASE)
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
            
        # Try to extract elements
        # Default simple extraction
        q_data = {
            "question": "",
            "options": [],
            "answer": "",
            "difficulty": "medium"
        }
        
        # Heuristic approach:
        # Options usually start with A., B., C., D. or A), B), C), D)
        # Answer usually introduced by "Answer:", "Đáp án:"
        
        lines = part.split('\n')
        current_section = "question"
        q_text = []
        options = []
        current_option = ""
        answer = ""
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check for answer
            answer_match = re.match(r'^(?:Answer|Đáp án|Response):\s*([A-DA-D])', line, flags=re.IGNORECASE)
            if answer_match:
                answer = answer_match.group(1).upper()
                if current_option:
                    options.append(current_option.strip())
                    current_option = ""
                current_section = "done"
                continue
            
            # Check for option (A., B., C., D. or A), B), C), D))
            opt_match = re.match(r'^([A-D])[\.\)]\s*(.*)', line)
            if opt_match:
                if current_option:
                    options.append(current_option.strip())
                current_section = "options"
                current_option = line # Store the whole line or just content? Usually just content makes sense but let's keep it with A.
                continue
                
            if current_section == "question":
                q_text.append(line)
            elif current_section == "options":
                current_option += " " + line
        
        if current_option:
            options.append(current_option.strip())
            
        q_data["question"] = "\n".join(q_text).strip()
        
        # Clean question prefix (e.g. "1. " or "Câu 1:")
        q_data["question"] = re.sub(r'^(?:\d+[\.\)]|Câu\s+\d+:|Question\s+\d+:)\s*', '', q_data["question"], flags=re.IGNORECASE)
        
        if options:
            q_data["options"] = options
            
        if answer:
            q_data["answer"] = answer
        elif options:
            # If no explicit answer label is found, let's see if something like 'Answer: A' was appended to the last option or question.
            pass
            
        if q_data["question"] and len(q_data["options"]) > 0:
            questions.append(q_data)
            
    return questions
