import os
import json
from openai import OpenAI, AzureOpenAI
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential
import re
import random

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "gpt-4o-mini")

client = None
if LLM_PROVIDER == "openai":
    base_url = os.getenv("OPENAI_API_BASE") or os.getenv("OPENAI_BASE_URL")
    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=base_url
    )
    
elif LLM_PROVIDER == "azure":
    client = AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
    )
elif LLM_PROVIDER == "gemini":
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def call_llm(prompt: str, is_json: bool = False) -> str:
    if LLM_PROVIDER in ["openai", "azure"]:
        response_format = {"type": "json_object"} if is_json else None
        response = client.chat.completions.create(
            model=LLM_MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            response_format=response_format
        )
        return response.choices[0].message.content
    elif LLM_PROVIDER == "gemini":
        model = genai.GenerativeModel(LLM_MODEL_NAME)
        if is_json and not "JSON" in prompt:
            prompt += "\nOutput MUST be a valid JSON."
        response = model.generate_content(prompt)
        return response.text
    else:
        raise ValueError(f"Unsupported LLM provider: {LLM_PROVIDER}")

CHUNK_SIZE = 8000  # characters per chunk sent to LLM

def _parse_chunk(chunk: str) -> list:
    """Call LLM on a single text chunk and return list of questions."""
    prompt = f"""Extract all multiple-choice questions from the following text.
Return a JSON object with key "questions" containing an array of question objects.
Each question object MUST have:
- "question": the question text (string)
- "options": list of answer choices, e.g. ["A. ...", "B. ...", "C. ...", "D. ..."]
- "answer": the correct answer letter only, e.g. "A"
- "difficulty": "easy", "medium" or "hard" based on how complex the question is (always lowercase)
- "explanation": explanation for the correct answer (string or null)

Rules:
- Only include actual exam questions, skip instructions/headers/footers.
- If the chunk contains no questions, return {{"questions": []}}.
- Provide ONLY raw JSON. No markdown formatting.

Text:
{chunk}
"""
    try:
        res = call_llm(prompt, is_json=True)
        res = re.sub(r'^```json\s*|\s*```$', '', res.strip(), flags=re.IGNORECASE)
        res = re.sub(r'^```\s*|\s*```$', '', res.strip())
        data = json.loads(res)
        if isinstance(data, dict):
            return data.get("questions", [])
        if isinstance(data, list):
            return data
        return []
    except Exception as e:
        print(f"[parse_chunk] Error: {e}")
        return []

def parse_text_with_llm(text: str) -> list:
    """Split the full document into chunks and parse each one, aggregating results."""
    if not text or not text.strip():
        return []

    # Split text into overlapping chunks to avoid cutting questions mid-way
    chunks = []
    start = 0
    overlap = 200  # chars to overlap between chunks so split questions aren't lost
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start = end - overlap

    print(f"[parse_text_with_llm] Processing {len(chunks)} chunks from {len(text)} chars of text...")

    all_questions = []
    seen_questions = set()
    for i, chunk in enumerate(chunks):
        print(f"  Chunk {i+1}/{len(chunks)}...")
        questions = _parse_chunk(chunk)
        for q in questions:
            if not isinstance(q, dict):
                continue
            # Deduplicate by question text (first 80 chars)
            key = q.get("question", "")[:80].strip().lower()
            if key and key not in seen_questions:
                seen_questions.add(key)
                all_questions.append(q)

    print(f"[parse_text_with_llm] Extracted {len(all_questions)} unique questions total.")
    return all_questions

def generate_exam_questions(pool: list, num_questions: int, weak_topics: list) -> list:
    # Balancing algorithm for easy/medium/hard could be added here if difficulty exists in DB
    # Currently we prioritize weak areas.
    weak_pool = [q for q in pool if q.get("topic") in weak_topics]
    normal_pool = [q for q in pool if q.get("topic") not in weak_topics]
    
    random.shuffle(weak_pool)
    random.shuffle(normal_pool)
    
    selected = []
    target_weak = min(len(weak_pool), max(1, num_questions // 2))
    
    selected.extend(weak_pool[:target_weak])
    remaining = num_questions - len(selected)
    
    selected.extend(normal_pool[:remaining])
    
    # Fill remaining from weak pool if normal_pool was short
    if len(selected) < num_questions:
        more_needed = num_questions - len(selected)
        selected.extend(weak_pool[target_weak:target_weak+more_needed])
        
    random.shuffle(selected)
    return selected

def review_exam(exam_data: dict) -> str:
    prompt = f"""
    You are an AI tutor. Review the following exam performance and provide a short, encouraging summary 
    highlighting the user's strong areas and topics they need to review. Keep it under 2 paragraphs.
    Data: {json.dumps(exam_data)}
    """
    return call_llm(prompt)
