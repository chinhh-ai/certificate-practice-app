import requests
from docx import Document

try:
    doc = Document()
    doc.add_paragraph("What is 2+2?\nA. 3\nB. 4\nC. 5\nD. 6\nAnswer: B")
    doc.save("test.docx")
    
    with open("test.docx", "rb") as f:
        resp = requests.post("http://localhost:6100/parse-llm", files={"file": ("test.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")})
    
    print("STATUS:", resp.status_code)
    print("BODY:", resp.text)
except Exception as e:
    print("Exception:", e)
