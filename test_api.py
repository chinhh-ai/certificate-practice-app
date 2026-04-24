import requests

url = "http://localhost:8000/content/upload"
files = {'file': open('test_upload.json', 'rb')}

try:
    response = requests.post(url, files=files)
    print("Status Code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", str(e))
