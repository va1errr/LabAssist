"""
CLI script to embed all lab documents in the database.

Reads lab_doc entries, generates embeddings using sentence-transformers,
and updates the embedding column.

Usage:
    cd backend
    python -m embed_docs
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine, select

from app.config import settings
from app.models.models import LabDoc
from app.services.embeddings import EmbeddingService


def embed_all_lab_docs():
    """Generate and store embeddings for all lab documents."""
    engine = create_engine(settings.sync_database_url)
    svc = EmbeddingService()

    with Session(engine) as session:
        docs = session.exec(select(LabDoc)).all()
        if not docs:
            print("No lab documents found. Run `python -m seed` first.")
            return

        texts = [d.content for d in docs]
        print(f"Embedding {len(docs)} lab documents...")

        embeddings = svc.embed_many(texts)

        for doc, embedding in zip(docs, embeddings):
            doc.embedding = embedding
            session.add(doc)

        session.commit()
        print(f"Successfully embedded {len(docs)} lab documents.")


if __name__ == "__main__":
    embed_all_lab_docs()
