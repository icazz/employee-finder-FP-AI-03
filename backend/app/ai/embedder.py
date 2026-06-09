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
from app.core.config import settings

logger = logging.getLogger(__name__)

# Name of the sentence-transformers model to use.
# multilingual-e5-base: medium (~470MB), multilingual (excellent for Indonesian), high accuracy.
_ST_MODEL_NAME = "intfloat/multilingual-e5-base"


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
    if not settings.use_local_embeddings:
        logger.debug("Local embeddings are disabled by configuration.")
        return None
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
# Hugging Face Inference API (Cloud, preferred if token configured)
# ---------------------------------------------------------------------------

def _hf_api_embeddings(texts: list[str]) -> list[list[float]] | None:
    """
    Encode texts using Hugging Face Inference API.
    Returns None if the API call fails or is unconfigured.
    """
    token = settings.hf_api_key
    if not token or token == "your_huggingface_token_here":
        return None

    url = f"https://api-inference.huggingface.co/models/{_ST_MODEL_NAME}"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"inputs": texts}

    import httpx
    try:
        with httpx.Client() as client:
            response = client.post(url, json=payload, headers=headers, timeout=20.0)
            response.raise_for_status()
            data = response.json()

            # Handle different API response types
            if isinstance(data, list):
                if len(data) > 0 and isinstance(data[0], list):
                    if len(data[0]) > 0 and isinstance(data[0][0], list):
                        # Mean pool the 3D token embeddings
                        pooled = []
                        for text_emb in data:
                            num_tokens = len(text_emb)
                            dim = len(text_emb[0])
                            avg_emb = [sum(tok[i] for tok in text_emb) / num_tokens for i in range(dim)]
                            pooled.append(avg_emb)
                        return pooled
                    return data
                elif len(data) > 0 and isinstance(data[0], (int, float)):
                    return [data]
            raise ValueError(f"Unexpected HF API response type: {type(data)}")
    except Exception as exc:
        logger.warning("Hugging Face Inference API failed: %s. Falling back.", exc)
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_embedding_mode() -> str:
    """Return which embedding backend is currently active."""
    if settings.hf_api_key and settings.hf_api_key != "your_huggingface_token_here":
        return "huggingface-api"
    if settings.use_local_embeddings and _get_st_model() is not None:
        return "sentence-transformers"
    return "tfidf"


def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Return a list of embedding vectors, one per input text.

    Priority:
      1. Hugging Face Inference API (Cloud, if token configured)
      2. sentence-transformers (local, semantic, free)
      3. TF-IDF (keyword-based, no dependencies)
    """
    cleaned = [_clean_text(t) for t in texts]

    # --- 1. Hugging Face Inference API ---
    api_result = _hf_api_embeddings(cleaned)
    if api_result is not None:
        logger.info("Embeddings generated via Hugging Face Inference API (%d texts)", len(texts))
        return api_result

    # --- 2. sentence-transformers (Local) ---
    st_result = _st_embeddings(cleaned)
    if st_result is not None:
        logger.debug("Embeddings via sentence-transformers (%d texts)", len(texts))
        return st_result

    # --- 3. Fallback: TF-IDF ---
    logger.info("Falling back to TF-IDF embeddings for %d texts", len(texts))
    return _tfidf_embeddings(cleaned)


def get_embedding(text: str) -> list[float]:
    """Convenience wrapper for a single text."""
    return get_embeddings([text])[0]
