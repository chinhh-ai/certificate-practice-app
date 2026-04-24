"""
Migration v2.1+v2.2: subjects, subject_id FKs, exam persistence
Run: conda run -n prac_certi python backend/migrate_v2.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from database import engine
from sqlalchemy import text

migrations = [
    # subjects table
    """
    CREATE TABLE IF NOT EXISTS subjects (
      id         VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name       VARCHAR(100) NOT NULL UNIQUE,
      slug       VARCHAR(100) NOT NULL UNIQUE,
      color      VARCHAR(7)   DEFAULT '#4F86C6',
      created_at TIMESTAMP    DEFAULT NOW()
    )
    """,

    # Add subject_id columns
    "ALTER TABLE questions       ADD COLUMN IF NOT EXISTS subject_id VARCHAR REFERENCES subjects(id) ON DELETE SET NULL",
    "ALTER TABLE uploaded_files  ADD COLUMN IF NOT EXISTS subject_id VARCHAR REFERENCES subjects(id) ON DELETE SET NULL",
    "ALTER TABLE exams           ADD COLUMN IF NOT EXISTS subject_id VARCHAR REFERENCES subjects(id) ON DELETE SET NULL",

    # Exam persistence
    "ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE",
    "ALTER TABLE exams ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP",

    # Ensure uploaded_files has all v2.1 columns
    "ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS original_name VARCHAR(255)",
    "ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS file_type VARCHAR(10)",
    "ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS file_size_kb INT",
    "ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'done'",
    "ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS error_message TEXT",
    "ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMP",

    # Backfill
    "INSERT INTO subjects (name, slug, color) VALUES ('Uncategorized', 'uncategorized', '#7C8394') ON CONFLICT DO NOTHING",
    "UPDATE questions SET subject_id = (SELECT id FROM subjects WHERE slug = 'uncategorized') WHERE subject_id IS NULL",
    "UPDATE exams SET is_completed = TRUE WHERE id IN (SELECT exam_id FROM exam_results) AND is_completed IS NOT DISTINCT FROM FALSE",
]

with engine.connect() as conn:
    for sql in migrations:
        stmt = sql.strip()
        print(f"Running: {stmt[:80]}...")
        try:
            conn.execute(text(stmt))
            conn.commit()
            print("  OK")
        except Exception as e:
            conn.rollback()
            print(f"  SKIP: {e}")

print("\n✅ Migration v2.1+v2.2 complete!")
