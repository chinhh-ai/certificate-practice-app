@echo off
echo Starting Frontend...
set NEXT_PUBLIC_API_URL=http://localhost:5000
cd frontend
npm run dev
