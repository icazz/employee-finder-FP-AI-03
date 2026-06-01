"""
embedder.py — Text embedding module for Employee Finder

Strategy (priority order):
  1. sentence-transformers (PRIMARY) — Local model, FREE, no API key needed.
     Uses 'all-MiniLM-L6-v2': 384-dim, fast, ~80MB, strong semantic understanding.
     Model is downloaded once on first use and cached inside the container.
  2. TF-IDF (FALLBACK) — Pure scikit-learn. Zero dependencies, works offline.
     Lower accuracy but always available.

Public API
----------
  get_embedding(text: str) -> list[float]
  get_embeddings(texts: list[str]) -> list[list[float]]
  get_embedding_mode() -> str   # 'sentence-transformers' | 'tfidf'
"""

from __future__ import annotations

import logging
import re
from functools import lru_cache

logger = logging.getLogger(__name__)

# Name of the sentence-transformers model to use.
# all-MiniLM-L6-v2: tiny (~80MB), fast, great for semantic similarity tasks.
_ST_MODEL_NAME = "all-MiniLM-L6-v2"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clean_text(text: str) -> str:
    """Normalise whitespace and strip control characters."""
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)
    return " ".join(text.split())


# ---------------------------------------------------------------------------
# sentence-transformers (PRIMARY — local, free)
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_st_model():
    """
    Lazy-load the SentenceTransformer model.
    Cached so the model is only loaded once per process lifetime (~1-2 seconds).
    Returns None if sentence-transformers is not installed.
    """
    try:
        # pyrefly: ignore [missing-import]
        from sentence_transformers import SentenceTransformer  # noqa: PLC0415
        logger.info("Loading sentence-transformers model: %s", _ST_MODEL_NAME)
        model = SentenceTransformer(_ST_MODEL_NAME)
        logger.info("sentence-transformers model loaded successfully.")
        return model
    except ImportError:
        logger.warning(
            "sentence-transformers not installed. "
            "Run: pip install sentence-transformers"
        )
        return None
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to load sentence-transformers model: %s", exc)
        return None


def _st_embeddings(texts: list[str]) -> list[list[float]] | None:
    """
    Encode texts using sentence-transformers.
    Returns None if the model is unavailable.
    """
    model = _get_st_model()
    if model is None:
        return None

    try:
        # encode() returns a numpy ndarray of shape (N, 384)
        vectors = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
        # Normalize to unit length for stable cosine similarity
        norms = (vectors ** 2).sum(axis=1, keepdims=True) ** 0.5
        norms = norms.clip(min=1e-9)
        vectors = vectors / norms
        return [row.tolist() for row in vectors]
    except Exception as exc:  # noqa: BLE001
        logger.warning("sentence-transformers encode failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# TF-IDF fallback (always available)
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_tfidf_vectorizer():
    """
    Lazy-import scikit-learn and return a configured TfidfVectorizer.
    Cached so we only instantiate it once.
    """
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer  # noqa: PLC0415
        return TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),
            min_df=1,
            max_features=4096,
            sublinear_tf=True,
        )
    except ImportError:
        logger.warning("scikit-learn not installed; TF-IDF fallback unavailable")
        return None


def _tfidf_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Compute TF-IDF vectors. Vocabulary is built on-the-fly from the input texts.
    """
    vectorizer = _get_tfidf_vectorizer()
    if vectorizer is None:
        # Ultimate fallback — zero vectors (cosine similarity will return 0)
        return [[0.0] for _ in texts]

    matrix = vectorizer.fit_transform(texts)
    dense = matrix.toarray()
    return [row.tolist() for row in dense]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_embedding_mode() -> str:
    """Return which embedding backend is currently active."""
    return "sentence-transformers" if _get_st_model() is not None else "tfidf"


def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Return a list of embedding vectors, one per input text.

    Priority:
      1. sentence-transformers (local, semantic, free)
      2. TF-IDF (keyword-based, no dependencies)
    """
    cleaned = [_clean_text(t) for t in texts]

    # --- Primary: sentence-transformers ---
    st_result = _st_embeddings(cleaned)
    if st_result is not None:
        logger.debug("Embeddings via sentence-transformers (%d texts)", len(texts))
        return st_result

    # --- Fallback: TF-IDF ---
    logger.info("Falling back to TF-IDF embeddings for %d texts", len(texts))
    return _tfidf_embeddings(cleaned)


def get_embedding(text: str) -> list[float]:
    """Convenience wrapper for a single text."""
    return get_embeddings([text])[0]
