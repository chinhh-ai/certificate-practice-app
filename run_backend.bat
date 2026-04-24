@echo off
echo Starting Backend on port 5000...
set DATABASE_URL=postgresql://user:password@localhost:5432/certidb
set AI_CORE_URL=http://localhost:6100
cd backend
conda run --no-capture-output -n prac_certi uvicorn main:app --host 0.0.0.0 --port 5000 --reload
