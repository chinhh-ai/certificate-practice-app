#!/bin/bash
# run_frontend.sh
echo "Starting Frontend..."
export NEXT_PUBLIC_API_URL="http://localhost:5000"
cd frontend
npm run dev
