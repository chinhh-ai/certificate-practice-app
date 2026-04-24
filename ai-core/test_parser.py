from parser import parse_questions

def test_parse_questions():
    sample_text = """
    1. What is the capital of France?
    A. Berlin
    B. Madrid
    C. Paris
    D. Rome
    Đáp án: C
    
    Câu 2: Which protocol is used for secure communication?
    A) HTTP
    B) FTP
    C) HTTPS
    D) SMTP
    Answer: C
    """
    
    questions = parse_questions(sample_text)
    
    assert len(questions) == 2
    
    assert "Paris" in questions[0]["options"][2]
    assert questions[0]["answer"] == "C"
    
    assert "HTTPS" in questions[1]["options"][2]
    assert questions[1]["answer"] == "C"
