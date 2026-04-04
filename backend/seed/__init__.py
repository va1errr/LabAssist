"""
Seed script to populate database with demo users and lab documents.
Run with: python -m seed
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.models import User, Question, Answer, LabDoc
from sqlmodel import SQLModel, create_engine, Session


async def seed_db():
    """Seed the database with demo data."""
    engine = create_engine(str(settings.database_url).replace("+asyncpg", ""))
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # Check if already seeded
        if session.query(User).first():
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # Create demo users
        student = User(username="student_demo", role="student")
        ta = User(username="ta_demo", role="ta")
        admin = User(username="admin", role="admin")
        session.add_all([student, ta, admin])
        session.commit()

        print(f"Created users: {student.username}, {ta.username}, {admin.username}")

        # Lab documents will be loaded from markdown files
        # and embedded by the RAG pipeline
        lab_docs = [
            LabDoc(
                lab_number=1,
                title="Introduction to Python",
                content=open(
                    os.path.join(os.path.dirname(__file__), "lab_01_intro_to_python.md")
                ).read(),
            ),
            LabDoc(
                lab_number=2,
                title="Data Structures",
                content=open(
                    os.path.join(os.path.dirname(__file__), "lab_02_data_structures.md")
                ).read(),
            ),
            LabDoc(
                lab_number=3,
                title="File I/O and Error Handling",
                content=open(
                    os.path.join(os.path.dirname(__file__), "lab_03_file_io.md")
                ).read(),
            ),
        ]
        session.add_all(lab_docs)
        session.commit()

        print(f"Seeded {len(lab_docs)} lab documents")
        print("Done!")


if __name__ == "__main__":
    asyncio.run(seed_db())
