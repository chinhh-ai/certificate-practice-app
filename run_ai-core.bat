@echo off
echo Starting AI-Core on port 6100...
cd ai-core
conda run --no-capture-output -n prac_certi uvicorn main:app --host 0.0.0.0 --port 6100 --reload
