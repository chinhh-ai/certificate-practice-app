from database import engine, SessionLocal
from sqlalchemy import text
import models

def run_migration():
    print("Migrating: Adding question_ids to exams...")
    with engine.connect() as conn:
        try:
            # Using raw SQL to stay safe
            conn.execute(text("ALTER TABLE exams ADD COLUMN IF NOT EXISTS question_ids JSONB DEFAULT '[]'::jsonb;"))
            conn.commit()
            print("Successfully updated exams table with question_ids.")
        except Exception as e:
            print(f"Migration error: {e}")

if __name__ == "__main__":
    run_migration()
