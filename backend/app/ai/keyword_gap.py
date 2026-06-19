"""
keyword_gap.py — Keyword Gap Analysis for Employee Finder

This module extracts meaningful keywords/skills from a Job Description and
then determines, for each candidate CV, which of those keywords are present
("matched") and which are missing ("gap").

Algorithm
---------
1.  Extract candidate keywords from the JD via a multi-step pipeline:
    a.  Tokenise & lower-case.
    b.  Remove stopwords (built-in English list — no NLTK download needed).
    c.  Keep only tokens whose length is >= 2.
    d.  Re-assemble n-grams (bigrams/trigrams) that appear frequently in the JD
        so that compound skills like "machine learning" or "project management"
        are captured as single units.
    e.  Optionally expand with Anthropic Claude to extract structured skill
        entities (soft skills, tools, certifications).

2.  For each CV, check which keywords appear in the CV text (case-insensitive
    substring match).

Public API
----------
  analyse_gap(job_desc: str, cv_text: str) -> KeywordGapResult
  analyse_gaps(job_desc: str, candidates: list[tuple[str, str]]) -> list[KeywordGapResult]
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from itertools import combinations

import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# English stop-words (compact hardcoded list — no NLTK dependency)
# ---------------------------------------------------------------------------

_STOPWORDS: frozenset[str] = frozenset(
    """
    a about above after again against all also am an and any are aren't as at be
    because been before being below between both but by can can't cannot could
    couldn't did didn't do does doesn't doing don't down during each few for from
    further get got had hadn't has hasn't have haven't having he he'd he'll he's
    her here here's hers herself him himself his how how's i i'd i'll i'm i've if
    in into is isn't it it's its itself let's me more most mustn't my myself no
    nor not of off on once only or other ought our ours ourselves out over own
    same shan't she she'd she'll she's should shouldn't so some such than that
    that's the their theirs them themselves then there there's these they they'd
    they'll they're they've this those through to too under until up very was
    wasn't we we'd we'll we're we've were weren't what what's when when's where
    where's which while who who's whom why why's will with won't would wouldn't
    you you'd you'll you're you've your yours yourself yourselves
    dan di ke dari dalam dengan untuk pada yang adalah bisa dapat memiliki mempunyai
    yaitu atau sebagai akan telah sudah oleh serta bahwa ialah itu ini juga saya
    kami mereka ia dia kita anda kamu secara dengan untuk
    """.split()
)

# Tokens that look purely numeric or are too generic even outside the stopword list
_GENERIC_TOKENS: frozenset[str] = frozenset(
    ["experience", "ability", "knowledge", "understanding", "skill", "skills",
     "work", "working", "team", "years", "year", "good", "strong", "excellent",
     "required", "preferred", "plus", "must", "like", "using", "used", "use",
     "etc", "eg", "ie", "also", "including", "include", "includes",
     "pengalaman", "kemampuan", "pengetahuan", "pemahaman", "keterampilan",
     "kerja", "bekerja", "tim", "tahun", "baik", "kuat", "luar", "biasa",
     "dibutuhkan", "diutamakan", "harus", "seperti", "menggunakan", "digunakan",
     "dll", "dlsb", "memiliki", "mempunyai", "mencapai", "membuat"]
)


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class KeywordGapResult:
    filename: str
    matched_keywords: list[str] = field(default_factory=list)
    missing_keywords: list[str] = field(default_factory=list)
    match_count: int = 0
    total_keywords: int = 0
    coverage_pct: float = 0.0   # matched / total * 100


# ---------------------------------------------------------------------------
# Keyword extraction helpers
# ---------------------------------------------------------------------------

def _tokenise(text: str) -> list[str]:
    """Lower-case and split on non-alphanumeric boundaries."""
    text = text.lower()
    tokens = re.findall(r"[a-z][a-z0-9+#.\-]*", text)
    return tokens


def _is_valid_token(tok: str) -> bool:
    if len(tok) < 2:
        return False
    if tok in _STOPWORDS:
        return False
    if tok in _GENERIC_TOKENS:
        return False
    # Skip pure digit strings
    if re.fullmatch(r"\d+", tok):
        return False
    return True


def _extract_ngrams(tokens: list[str], n: int) -> list[str]:
    """Return all n-grams as space-joined strings."""
    return [" ".join(tokens[i:i + n]) for i in range(len(tokens) - n + 1)]


def _local_keyword_extraction(job_desc: str) -> list[str]:
    """
    Extract keywords from *job_desc* using a purely local, no-dependency
    approach.

    Returns a deduplicated list of keywords, preferring longer n-grams where
    they appear at least twice in the JD text.
    """
    tokens = _tokenise(job_desc)
    jd_lower = job_desc.lower()

    # --- Step 1: unigrams ---
    unigrams = [t for t in tokens if _is_valid_token(t)]

    # --- Step 2: bigrams that appear at least twice in JD ---
    bigrams = [
        bg for bg in _extract_ngrams(tokens, 2)
        if all(_is_valid_token(w) for w in bg.split())
        and jd_lower.count(bg) >= 1   # at least once (JDs are often short)
    ]

    # --- Step 3: trigrams that appear at least twice in JD ---
    trigrams = [
        tg for tg in _extract_ngrams(tokens, 3)
        if all(_is_valid_token(w) for w in tg.split())
        and jd_lower.count(tg) >= 2
    ]

    # Build set of final keywords; prefer longer n-grams over their components
    all_candidates: list[str] = trigrams + bigrams + unigrams
    seen: set[str] = set()
    selected: list[str] = []

    for kw in all_candidates:
        if kw in seen:
            continue
        # Skip if this keyword is already covered as part of a longer ngram
        already_subsumed = any(kw in chosen for chosen in selected)
        if not already_subsumed:
            selected.append(kw)
            seen.add(kw)

    # De-duplicate unigram components already covered by bigrams/trigrams
    final: list[str] = []
    for kw in selected:
        if " " not in kw:  # unigram
            if any(kw in multi for multi in selected if " " in multi):
                continue  # already covered
        final.append(kw)

    # Limit to top-50 most informative (longer first, then alpha)
    final.sort(key=lambda k: (-len(k.split()), k))
    return list(dict.fromkeys(final))[:50]


# ---------------------------------------------------------------------------
# AI-enhanced extraction (Anthropic Claude)
# ---------------------------------------------------------------------------

_EXTRACTION_PROMPT = """You are a skilled HR analyst.
Extract a comprehensive list of skills, tools, technologies, frameworks,
certifications, and domain-specific keywords from the following Job Description.
Return ONLY a valid JSON array of strings (lowercase, no duplicates).
Aim for 20–40 items. Do not include generic words like "experience" or "team".

Job Description:
{job_desc}"""


def _ai_keyword_extraction(job_desc: str) -> list[str] | None:
    """
    Use Anthropic Claude to extract structured keywords.
    Returns None if the API key is missing or the call fails.
    """
    api_key = settings.anthropic_api_key
    if not api_key:
        return None

    payload = {
        "model": "claude-haiku-4-5",
        "max_tokens": 1024,
        "messages": [
            {
                "role": "user",
                "content": _EXTRACTION_PROMPT.format(job_desc=job_desc[:6000]),
            }
        ],
    }
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                "https://api.anthropic.com/v1/messages",
                json=payload,
                headers=headers,
            )

        if response.status_code != 200:
            logger.warning(
                "Claude API error %s: %s",
                response.status_code,
                response.text[:200],
            )
            return None

        text = response.json()["content"][0]["text"].strip()
        # Extract JSON array even if Claude adds surrounding prose
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if not match:
            return None
        keywords: list[str] = json.loads(match.group())
        return [str(k).lower().strip() for k in keywords if isinstance(k, str)]

    except Exception as exc:  # noqa: BLE001
        logger.warning("Claude keyword extraction failed: %s", exc)
        return None


def extract_jd_keywords(job_desc: str) -> list[str]:
    """
    Extract keywords from a Job Description.

    Tries Claude first; falls back to local extraction.
    """
    ai_keywords = _ai_keyword_extraction(job_desc)
    if ai_keywords:
        logger.debug("Keywords extracted via Claude (%d keywords)", len(ai_keywords))
        return ai_keywords

    logger.info("Falling back to local keyword extraction")
    return _local_keyword_extraction(job_desc)


# ---------------------------------------------------------------------------
# Gap analysis
# ---------------------------------------------------------------------------

def _keyword_present(keyword: str, cv_lower: str) -> bool:
    """Return True if *keyword* appears in the CV text (case-insensitive)."""
    return keyword.lower() in cv_lower


def analyse_gap(job_desc: str, filename: str, cv_text: str) -> KeywordGapResult:
    """
    Analyse keyword coverage for a single candidate CV.

    Returns a KeywordGapResult with matched / missing keyword lists.
    """
    keywords = extract_jd_keywords(job_desc)
    cv_lower = cv_text.lower()

    matched = [kw for kw in keywords if _keyword_present(kw, cv_lower)]
    missing = [kw for kw in keywords if not _keyword_present(kw, cv_lower)]

    total = len(keywords)
    coverage = round((len(matched) / total * 100) if total > 0 else 0.0, 1)

    return KeywordGapResult(
        filename=filename,
        matched_keywords=sorted(matched),
        missing_keywords=sorted(missing),
        match_count=len(matched),
        total_keywords=total,
        coverage_pct=coverage,
    )


def analyse_gaps(
    job_desc: str,
    candidates: list[tuple[str, str]],
) -> list[KeywordGapResult]:
    """
    Analyse keyword gaps for multiple candidates.

    Parameters
    ----------
    job_desc:   The full Job Description text.
    candidates: List of (filename, cv_text) tuples.

    Returns
    -------
    List of KeywordGapResult, one per candidate (order preserved).
    """
    # Extract keywords once and reuse — more efficient than calling for each CV
    keywords = extract_jd_keywords(job_desc)
    results: list[KeywordGapResult] = []

    for filename, cv_text in candidates:
        cv_lower = cv_text.lower()
        matched = [kw for kw in keywords if _keyword_present(kw, cv_lower)]
        missing = [kw for kw in keywords if not _keyword_present(kw, cv_lower)]
        total = len(keywords)
        coverage = round((len(matched) / total * 100) if total > 0 else 0.0, 1)

        results.append(
            KeywordGapResult(
                filename=filename,
                matched_keywords=sorted(matched),
                missing_keywords=sorted(missing),
                match_count=len(matched),
                total_keywords=total,
                coverage_pct=coverage,
            )
        )

    return results
