"""Embedding service using sentence-transformers.

Loads a local embedding model and converts text to 384-dimensional vectors.
The model is cached after first download (~80MB).

Usage:
    from app.services.embeddings import EmbeddingService
    svc = EmbeddingService()
    vector = svc.embed("Hello world")
"""

import structlog
from typing import List

logger = structlog.get_logger()

# Model constants
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


class EmbeddingService:
    """Singleton-style service that lazily loads the embedding model."""

    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_model(self):
        """Load the sentence-transformers model (cached on first call)."""
        if self._model is None:
            logger.info("Loading embedding model", model=MODEL_NAME)
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(MODEL_NAME)
            logger.info("Embedding model loaded")

    def embed(self, text: str) -> List[float]:
        """Convert text to a 384-dimensional embedding vector.

        Returns:
            List of 384 floats representing the embedding.
        """
        self._load_model()
        embedding = self._model.encode(text)
        return embedding.tolist()

    def embed_many(self, texts: List[str]) -> List[List[float]]:
        """Convert multiple texts to embeddings in batch.

        Returns:
            List of lists, each inner list has 384 floats.
        """
        self._load_model()
        embeddings = self._model.encode(texts)
        return [e.tolist() for e in embeddings]


# Convenience function
embedding_service = EmbeddingService()


def embed_text(text: str) -> List[float]:
    """Embed a single piece of text."""
    return embedding_service.embed(text)


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed multiple texts in batch."""
    return embedding_service.embed_many(texts)
