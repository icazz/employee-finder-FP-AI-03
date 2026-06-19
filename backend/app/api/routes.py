import io
import re
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.config import settings
from app.services.file_parser import build_csv
from app.ai.similarity import score_many, CandidateResult
from app.ai.keyword_gap import analyse_gaps, KeywordGapResult
from app.ai.embedder import get_embedding_mode

router = APIRouter(prefix="/api/v1")
_csv_store: io.StringIO | None = None


# ---------------------------------------------------------------------------
# Shared request/response models
# ---------------------------------------------------------------------------

class ParseResponse(BaseModel):
    filenames: list[str]
    total_files: int
    message: str


class CandidateScore(BaseModel):
    rank: int
    filename: str
    # Raw cosine similarity (0–1)
    score: float
    score_pct: float
    # Keyword coverage from gap analysis (0–100)
    keyword_coverage_pct: float
    # Hybrid = 70% semantic similarity + 30% keyword coverage
    hybrid_score: float
    hybrid_score_pct: float
    # AI Summary & Evaluation
    profile_summary: str = ""
    is_match: bool = True
    reason: str = ""


class KeywordGap(BaseModel):
    filename: str
    matched_keywords: list[str]
    missing_keywords: list[str]
    match_count: int
    total_keywords: int
    coverage_pct: float


class AnalyzeResponse(BaseModel):
    job_desc_preview: str
    total_candidates: int
    # 'voyage-ai' | 'tfidf' — lets the frontend show a badge
    embedding_mode: str
    rankings: list[CandidateScore]
    keyword_gaps: list[KeywordGap]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _validate_upload(upload: UploadFile) -> None:
    filename = upload.filename or "unnamed"
    ext = filename.rsplit(".", 1)[-1].lower()

    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=415,
            detail=(
                f"'{filename}': unsupported type '.{ext}'. "
                f"Allowed: {settings.allowed_extensions}"
            ),
        )

async def _read_upload(upload: UploadFile) -> tuple[str, bytes]:
    _validate_upload(upload)

    filename = upload.filename or "unnamed"
    file_bytes = await upload.read()

    if len(file_bytes) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"'{filename}' is too large. Max size: {settings.max_file_size_mb} MB",
        )

    return filename, file_bytes


# ---------------------------------------------------------------------------
# Existing endpoints (unchanged)
# ---------------------------------------------------------------------------

@router.post("/documents/parse", response_model=ParseResponse)
async def parse_uploaded_files(
    uploads: list[UploadFile] = File(...),
) -> ParseResponse:
    global _csv_store

    if not uploads:
        raise HTTPException(status_code=400, detail="No files were uploaded.")

    files: list[tuple[str, bytes]] = []
    errors: list[str] = []

    for upload in uploads:
        try:
            files.append(await _read_upload(upload))
        except HTTPException as exc:
            errors.append(exc.detail)

    if errors:
        raise HTTPException(status_code=422, detail=errors)

    try:
        _csv_store = build_csv(files)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    filenames = [f[0] for f in files]

    return ParseResponse(
        filenames=filenames,
        total_files=len(files),
        message=f"Parsed {len(files)} file(s) and stored in memory.",
    )


@router.get("/documents/csv")
async def get_csv() -> StreamingResponse:
    if _csv_store is None:
        raise HTTPException(status_code=404, detail="No CSV in memory. Upload files first.")

    _csv_store.seek(0)

    return StreamingResponse(
        iter([_csv_store.read()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=documents.csv"},
    )


# ---------------------------------------------------------------------------
# AI Analysis endpoint (Anggota 1 — core feature)
# ---------------------------------------------------------------------------

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_candidates(
    job_desc: str = Form(..., description="The full Job Description text"),
    uploads: list[UploadFile] = File(..., description="Candidate CV files (PDF/DOCX)"),
) -> AnalyzeResponse:
    """
    Main AI analysis endpoint.

    Accepts a Job Description (text) and one or more CV files (PDF/DOCX).

    Returns:
    - **rankings**: Candidates sorted by Cosine Similarity score (highest first).
    - **keyword_gaps**: Per-candidate matched and missing JD keywords.
    """
    cleaned_jd = job_desc.strip()
    if not cleaned_jd:
        raise HTTPException(status_code=400, detail="job_desc cannot be empty.")

    from app.ai.summary import validate_job_desc_with_ai  # noqa: PLC0415
    is_valid, err_reason = validate_job_desc_with_ai(cleaned_jd)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Masukkan job description yang benar."
        )

    if not uploads:
        raise HTTPException(status_code=400, detail="No CV files were uploaded.")

    # --- Parse uploaded files ---
    files: list[tuple[str, bytes]] = []
    errors: list[str] = []

    for upload in uploads:
        try:
            files.append(await _read_upload(upload))
        except HTTPException as exc:
            errors.append(exc.detail)

    if errors:
        raise HTTPException(status_code=422, detail=errors)

    # --- Extract text from each CV ---
    from app.services.file_parser import _parse_file_to_text  # noqa: PLC0415

    candidates: list[tuple[str, str]] = []
    for filename, file_bytes in files:
        try:
            text = _parse_file_to_text(file_bytes, filename)
            candidates.append((filename, text))
        except Exception as exc:
            raise HTTPException(
                status_code=422,
                detail=f"Could not parse '{filename}': {exc}",
            ) from exc

    # --- Run AI analysis ---
    # Both calls share the same JD — embedder batches efficiently
    similarity_results: list[CandidateResult] = score_many(job_desc, candidates)
    gap_results: list[KeywordGapResult] = analyse_gaps(job_desc, candidates)

    # Detect which embedding backend is active
    embedding_mode = get_embedding_mode()

    # Map gap results by filename for easy lookup
    gap_map: dict[str, KeywordGapResult] = {g.filename: g for g in gap_results}

    # --- Hybrid Scoring ---
    # Formula: hybrid = 0.70 * semantic_similarity + 0.30 * keyword_coverage
    # This compensates for TF-IDF's low raw scores while rewarding keyword matches.
    # With Voyage AI, semantic similarity alone is already very accurate, so
    # keyword coverage acts as a useful tiebreaker.
    SEMANTIC_WEIGHT = 0.70
    KEYWORD_WEIGHT  = 0.30

    # Build a lookup for candidate CV texts to check gender
    cv_map: dict[str, str] = {c[0]: c[1] for c in candidates}
    
    # Use AI-driven gender detection
    from app.ai.summary import detect_genders_with_ai
    jd_gender, candidate_genders = detect_genders_with_ai(job_desc, candidates)

    # Calculate hybrid scores first for summary fallback logic
    scores_pct = {}
    calculated_hybrids = {}
    for r in similarity_results:
        gap = gap_map.get(r.filename)
        kw_coverage = (gap.coverage_pct / 100.0) if gap else 0.0
        hybrid = SEMANTIC_WEIGHT * r.score + KEYWORD_WEIGHT * kw_coverage
        hybrid = round(min(1.0, hybrid), 6)

        cv_gender = candidate_genders.get(r.filename)

        if jd_gender and cv_gender:
            if cv_gender == jd_gender:
                hybrid = 0.5 + 0.5 * hybrid
            else:
                hybrid = 0.5 * hybrid
            hybrid = round(hybrid, 6)
        
        calculated_hybrids[r.filename] = hybrid
        scores_pct[r.filename] = round(hybrid * 100, 1)

    # Call Gemini / fallback candidate summarizer
    from app.ai.summary import get_candidate_summaries
    summaries = get_candidate_summaries(job_desc, candidates, scores_pct)

    hybrid_list: list[CandidateScore] = []
    for r in similarity_results:
        gap = gap_map.get(r.filename)
        hybrid = calculated_hybrids[r.filename]
        c_summary = summaries.get(r.filename, {})

        is_match = bool(c_summary.get("is_match", True))
        reason = c_summary.get("reason", "")

        # Fallback local heuristics: if Gemini fails, override is_match to False
        # for candidates with very low keyword coverage (< 15.0%)
        # Only apply this heuristic when the JD has enough meaningful keywords (>= 3),
        # otherwise a short JD like "kami mencari spg yang cantik" would produce 0%
        # coverage for all candidates and incorrectly mark them as NOT MATCH.
        fallback_reason = "Kandidat memiliki kualifikasi yang cukup relevan dengan kualifikasi pekerjaan yang dicari."
        if reason == fallback_reason:
            jd_has_enough_keywords = gap and gap.total_keywords >= 3
            if jd_has_enough_keywords and gap.coverage_pct < 15.0:
                is_match = False
                reason = "Kandidat memiliki kecocokan kata kunci yang sangat rendah dengan kualifikasi pekerjaan yang dicari."

        hybrid_list.append(
            CandidateScore(
                rank=0,  # will assign after sort
                filename=r.filename,
                score=r.score,
                score_pct=r.score_pct,
                keyword_coverage_pct=gap.coverage_pct if gap else 0.0,
                hybrid_score=hybrid,
                hybrid_score_pct=scores_pct[r.filename],
                profile_summary=c_summary.get("profile_summary", ""),
                is_match=is_match,
                reason=reason
            )
        )

    # Re-rank by hybrid score (highest first)
    hybrid_list.sort(key=lambda c: c.hybrid_score, reverse=True)
    for i, candidate in enumerate(hybrid_list, start=1):
        candidate.rank = i

    keyword_gaps = [
        KeywordGap(
            filename=g.filename,
            matched_keywords=g.matched_keywords,
            missing_keywords=g.missing_keywords,
            match_count=g.match_count,
            total_keywords=g.total_keywords,
            coverage_pct=g.coverage_pct,
        )
        for g in gap_results
    ]

    return AnalyzeResponse(
        job_desc_preview=job_desc.strip(),
        total_candidates=len(candidates),
        embedding_mode=embedding_mode,
        rankings=hybrid_list,
        keyword_gaps=keyword_gaps,
    )


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


class ExtractNameResponse(BaseModel):
    name: str


@router.post("/extract-name", response_model=ExtractNameResponse)
async def extract_name(
    file: UploadFile = File(..., description="Candidate CV file (PDF/DOCX)"),
) -> ExtractNameResponse:
    """
    Extract the candidate's name from an uploaded CV file.
    """
    filename, file_bytes = await _read_upload(file)
    
    from app.services.file_parser import _parse_file_to_text  # noqa: PLC0415
    try:
        text = _parse_file_to_text(file_bytes, filename)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse '{filename}': {exc}",
        ) from exc
        
    from app.ai.summary import extract_candidate_name_with_ai  # noqa: PLC0415
    extracted_name = extract_candidate_name_with_ai(filename, text)
    
    return ExtractNameResponse(name=extracted_name)