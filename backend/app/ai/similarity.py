"""
similarity.py — Cosine Similarity computation for Employee Finder

This module converts raw text into embeddings (via embedder.py) and
calculates pairwise cosine similarity scores.

Public API
----------
  score_one(job_desc: str, cv_text: str) -> float
      Returns a single similarity score in [0.0, 1.0].

  score_many(job_desc: str, candidates: list[tuple[str, str]]) -> list[CandidateResult]
      Ranks a list of (filename, cv_text) pairs by similarity score,
      highest first.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

from app.ai.embedder import get_embeddings


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class CandidateResult:
    filename: str
    score: float                          # 0.0 – 1.0
    score_pct: float                      # 0 – 100 (rounded to 1 decimal)
    rank: int = field(default=0)


# ---------------------------------------------------------------------------
# Core math
# ---------------------------------------------------------------------------

def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """
    Compute cosine similarity between two real-valued vectors.

    Returns a value in [-1.0, 1.0], but for embedding vectors produced by
    standard models it is effectively in [0.0, 1.0].
    """
    if len(vec_a) != len(vec_b):
        # Dimension mismatch — can happen if fallback returned zero-vectors
        return 0.0

    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    # Clamp to [0, 1] because floating-point arithmetic can give tiny negatives
    return max(0.0, min(1.0, dot / (norm_a * norm_b)))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def score_one(job_desc: str, cv_text: str) -> float:
    """Return cosine similarity between a job description and a single CV text."""
    jd_vec, cv_vec = get_embeddings([job_desc, cv_text])
    return _cosine_similarity(jd_vec, cv_vec)


def score_many(
    job_desc: str,
    candidates: list[tuple[str, str]],
) -> list[CandidateResult]:
    """
    Rank multiple CVs against a job description.

    Parameters
    ----------
    job_desc:   The full job description text.
    candidates: List of (filename, cv_text) tuples.

    Returns
    -------
    A list of CandidateResult objects sorted by score descending (best match first).
    """
    if not candidates:
        return []

    filenames = [c[0] for c in candidates]
    texts = [job_desc] + [c[1] for c in candidates]

    all_vecs = get_embeddings(texts)
    jd_vec = all_vecs[0]
    cv_vecs = all_vecs[1:]

    results: list[CandidateResult] = []
    for i, (fname, _) in enumerate(candidates):
        raw_score = _cosine_similarity(jd_vec, cv_vecs[i])
        results.append(
            CandidateResult(
                filename=fname,
                score=round(raw_score, 6),
                score_pct=round(raw_score * 100, 1),
            )
        )

    # Sort descending by score
    results.sort(key=lambda r: r.score, reverse=True)

    # Assign ranks after sorting
    for rank, result in enumerate(results, start=1):
        result.rank = rank

    return results
