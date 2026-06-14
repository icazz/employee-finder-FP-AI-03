import io
import re
from typing import Optional
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
    global _csv_store

    if not job_desc.strip():
        raise HTTPException(status_code=400, detail="job_desc cannot be empty.")

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

    # --- Build CSV with emails ---
    _csv_store = build_csv(files)

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
                is_match=c_summary.get("is_match", True),
                reason=c_summary.get("reason", "")
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


class GmailRequest(BaseModel):
    recipients: list[dict]
    subject: str
    body: str


class GmailResponse(BaseModel):
    sent: int
    failed: int
    results: list[dict]


@router.post("/send-gmail", response_model=GmailResponse)
async def send_gmail_endpoint(request: GmailRequest) -> GmailResponse:
    from app.services.gmail_sender import send_gmail

    results = []
    sent = 0
    failed = 0

    for recipient in request.recipients:
        try:
            result = send_gmail(
                to_email=recipient["email"],
                subject=request.subject,
                body=request.body,
                recipient_name=recipient["name"],
            )
            results.append(result)
            sent += 1
        except Exception as exc:
            results.append({"to": recipient["email"], "status": "failed", "error": str(exc)})
            failed += 1

    return GmailResponse(sent=sent, failed=failed, results=results)


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


# ---------------------------------------------------------------------------
# Interview Session endpoints
# ---------------------------------------------------------------------------

class CreateSessionRequest(BaseModel):
    session_id: str
    name: str
    password: str
    email: str = ""


class CreateSessionResponse(BaseModel):
    session_id: str
    name: str
    active: bool


class ValidateSessionRequest(BaseModel):
    password: str


class ValidateSessionResponse(BaseModel):
    valid: bool
    session_id: str = ""
    name: str = ""
    joined: bool = False


class JoinSessionResponse(BaseModel):
    success: bool
    session_id: str = ""
    name: str = ""


class EndSessionResponse(BaseModel):
    success: bool


@router.post("/interview/session", response_model=CreateSessionResponse)
async def create_interview_session(request: CreateSessionRequest) -> CreateSessionResponse:
    from app.services.session_store import create_session

    session = create_session(
        name=request.name,
        password=request.password,
        email=request.email,
        session_id=request.session_id,
    )
    return CreateSessionResponse(
        session_id=session.session_id,
        name=session.name,
        active=session.active,
    )


@router.get("/interview/session/{session_id}")
async def get_session_info(session_id: str):
    from app.services.session_store import get_session

    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session.session_id,
        "name": session.name,
        "active": session.active,
        "joined": session.joined,
    }


@router.post("/interview/session/{session_id}/validate", response_model=ValidateSessionResponse)
async def validate_interview_session(session_id: str, request: ValidateSessionRequest) -> ValidateSessionResponse:
    from app.services.session_store import validate_session

    session = validate_session(session_id, request.password)
    if not session:
        return ValidateSessionResponse(valid=False)
    return ValidateSessionResponse(
        valid=True,
        session_id=session.session_id,
        name=session.name,
        joined=session.joined,
    )


@router.post("/interview/session/{session_id}/join", response_model=JoinSessionResponse)
async def join_interview_session(session_id: str) -> JoinSessionResponse:
    from app.services.session_store import join_session, get_session

    success = join_session(session_id)
    if not success:
        raise HTTPException(status_code=400, detail="Session not active or not found")
    session = get_session(session_id)
    return JoinSessionResponse(
        success=True,
        session_id=session.session_id,
        name=session.name,
    )


@router.post("/interview/session/{session_id}/end", response_model=EndSessionResponse)
async def end_interview_session(session_id: str) -> EndSessionResponse:
    from app.services.session_store import end_session

    success = end_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return EndSessionResponse(success=True)


@router.delete("/interview/session/{session_id}")
async def delete_interview_session(session_id: str):
    from app.services.session_store import delete_session

    success = delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True}


class GenerateQuestionsRequest(BaseModel):
    topic: str
    num_questions: int = 10
    difficulty: str = "medium"


class GenerateQuestionsResponse(BaseModel):
    success: bool
    question_count: int
    questions: list[dict]


@router.post("/interview/session/{session_id}/questions", response_model=GenerateQuestionsResponse)
async def generate_questions(session_id: str, request: GenerateQuestionsRequest) -> GenerateQuestionsResponse:
    from app.services.session_store import get_session, set_session_questions
    from app.ai.interview import generate_interview_questions

    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    questions = generate_interview_questions(
        topic=request.topic,
        num_questions=request.num_questions,
        difficulty=request.difficulty
    )

    set_session_questions(session_id, questions, request.topic)

    return GenerateQuestionsResponse(
        success=True,
        question_count=len(questions),
        questions=questions
    )


@router.get("/interview/session/{session_id}/questions")
async def get_questions(session_id: str):
    from app.services.session_store import get_session, get_session_questions

    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.questions:
        raise HTTPException(status_code=404, detail="No questions generated yet")

    questions_without_answers = []
    for q in session.questions:
        q_copy = q.copy()
        q_copy.pop("correct_answer", None)
        questions_without_answers.append(q_copy)

    return {
        "session_id": session_id,
        "topic": session.topic,
        "questions": questions_without_answers
    }


class SubmitAnswersRequest(BaseModel):
    answers: dict[str, str]


class SubmitAnswersResponse(BaseModel):
    success: bool
    message: str
    mc_score: Optional[float] = None
    essay_score: Optional[float] = None
    final_score: Optional[float] = None


@router.post("/interview/session/{session_id}/submit", response_model=SubmitAnswersResponse)
async def submit_answers(session_id: str, request: SubmitAnswersRequest) -> SubmitAnswersResponse:
    from app.services.session_store import get_session, submit_answers, calculate_score, evaluate_essays

    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.active:
        raise HTTPException(status_code=400, detail="Session is no longer active")

    if session.submitted:
        raise HTTPException(status_code=400, detail="Answers already submitted")

    int_answers = {int(k): v for k, v in request.answers.items()}
    success = submit_answers(session_id, int_answers)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to submit answers")

    evaluate_essays(session_id)
    scores = calculate_score(session_id)

    return SubmitAnswersResponse(
        success=True,
        message="Answers submitted successfully",
        mc_score=scores.get("mc_score") if scores else None,
        essay_score=scores.get("essay_score") if scores else None,
        final_score=scores.get("final_score") if scores else None
    )


@router.get("/interview/session/{session_id}/results")
async def get_results(session_id: str):
    from app.services.session_store import get_session_full_results

    results = get_session_full_results(session_id)
    if not results:
        raise HTTPException(status_code=404, detail="Session not found")

    return results


@router.get("/interview/sessions")
async def get_all_sessions():
    from app.services.session_store import get_all_sessions, get_session_full_results

    sessions = get_all_sessions()
    results = []
    
    for s in sessions:
        session_id = s.get("session_id")
        full_results = get_session_full_results(session_id)
        if full_results:
            results.append(full_results)
        else:
            results.append({
                "session_id": session_id,
                "name": s.get("name"),
                "email": s.get("email"),
                "topic": s.get("topic"),
                "submitted": False,
                "mc_score": None,
                "essay_score": None,
                "final_score": None,
                "results": []
            })
    
    return {"sessions": results}