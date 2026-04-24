"""
Migration script: Add soft-delete columns and new tables for v2.2
Run from the project root with: conda run -n prac_certi python backend/migrate.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from database import engine
from sqlalchemy import text

migrations = [
    # Soft-delete columns
    "ALTER TABLE questions    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL",
    "ALTER TABLE exams        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL",
    "ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL",

    # source_file_id on questions (will be linked after uploaded_files table is created)
    # exam_id on attempts
    "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS exam_id VARCHAR REFERENCES exams(id) ON DELETE CASCADE",
    "ALTER TABLE attempts ALTER COLUMN question_id DROP NOT NULL",

    # uploaded_files table
    """
    CREATE TABLE IF NOT EXISTS uploaded_files (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR NOT NULL,
        question_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP DEFAULT NULL
    )
    """,

    # source_file_id on questions
    "ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_file_id VARCHAR REFERENCES uploaded_files(id) ON DELETE SET NULL",

    # Cascade FK fixes for attempts
    "ALTER TABLE attempts DROP CONSTRAINT IF EXISTS attempts_question_id_fkey",
    "ALTER TABLE attempts ADD CONSTRAINT attempts_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE",
    "ALTER TABLE exam_results DROP CONSTRAINT IF EXISTS exam_results_exam_id_fkey",
    "ALTER TABLE exam_results ADD CONSTRAINT exam_results_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE",
]

with engine.connect() as conn:
    for sql in migrations:
        stmt = sql.strip()
        print(f"Running: {stmt[:70]}...")
        try:
            conn.execute(text(stmt))
            conn.commit()
            print("  OK")
        except Exception as e:
            print(f"  SKIP (already done or error): {e}")
            conn.rollback()

print("\n✅ Migration complete!")
