"""
summary.py — Candidate Profile Summarizer & Match Evaluation using Gemini API
"""

import json
import logging
import re
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

_PROMPT_TEMPLATE = """You are an expert HR recruitment assistant.
Analyze the following candidates for the Job Description.

Job Description:
{job_desc}

Candidates to analyze:
{candidates_list}

For each candidate:
1. Write a concise, professional 2-3 sentence profile summary in Indonesian ("profile_summary").
2. Determine if the candidate is a match ("is_match": true/false) based on whether their profile, skills, and background are relevant to the Job Description. If their background is completely unrelated (e.g. a Graphic Designer or SPG applying for a Backend Engineer job), set "is_match" to false.
3. Write a clear, polite explanation in "reason" (in Indonesian) explaining why they match or why they do not match.

Return ONLY a valid JSON object with the following format:
{{
  "candidates": [
    {{
      "filename": "candidate_file.pdf",
      "profile_summary": "Rangkuman profil singkat...",
      "is_match": true,
      "reason": "Alasan..."
    }}
  ]
}}
"""

_GENDER_DETECT_PROMPT = """Analyze the following Job Description and Candidate CVs to extract gender requirements and candidate genders.

Job Description:
{job_desc}

Candidates:
{candidates_list}

Rules:
1. For the Job Description, determine if there is an explicit or implicit gender preference. Return "male", "female", or "none". (For example, jobs like "SPG" or "Sales Promotion Girl" require "female", "SPB" requires "male", or if the text mentions "dibutuhkan wanita" or "pria/wanita" or equivalent requirements).
2. For each candidate, determine their gender based on their name, pronouns, or any explicit details in the CV snippet. Return "male", "female", or "unknown".

Return ONLY a valid JSON object matching the following structure:
{{
  "job_desc_gender_preference": "male" | "female" | "none",
  "candidates": [
    {{
      "filename": "candidate_file.pdf",
      "gender": "male" | "female" | "unknown"
    }}
  ]
}}
"""

def _detect_cv_gender_local(text: str) -> str | None:
    """Fallback local regex gender detection for CV text."""
    text_lower = text.lower()
    if "perempuan" in text_lower or "wanita" in text_lower:
        return "female"
    if "laki-laki" in text_lower or "pria" in text_lower:
        return "male"
    return None

def _detect_jd_gender_local(text: str) -> str | None:
    """Fallback local regex gender preference detection for Job Description."""
    text_lower = text.lower()
    has_female = (
        "spg" in text_lower 
        or "sales promotion girl" in text_lower 
        or "wanita" in text_lower 
        or "perempuan" in text_lower 
        or "cantik" in text_lower
    )
    has_male = (
        "spb" in text_lower 
        or "sales promotion boy" in text_lower 
        or "pria" in text_lower 
        or "laki-laki" in text_lower 
        or "tampan" in text_lower
    )
    
    if has_female and has_male:
        return None
    if has_female:
        return "female"
    if has_male:
        return "male"
    return None

def detect_genders_with_ai(
    job_desc: str,
    candidates: list[tuple[str, str]]
) -> tuple[str | None, dict[str, str | None]]:
    """
    Detect gender preference of the JD and the gender of each candidate using Gemini.
    Returns:
        - jd_gender: "male", "female", or None
        - candidate_genders: dict mapping filename -> "male", "female", or None
    """
    api_key = settings.gemini_api_key
    if not api_key or api_key == "your_gemini_api_key_here":
        logger.info("Gemini API key not configured; using local fallback for gender detection.")
        jd_gender = _detect_jd_gender_local(job_desc)
        cand_genders = {fname: _detect_cv_gender_local(text) for fname, text in candidates}
        return jd_gender, cand_genders
        
    candidates_list_str = ""
    for fname, text in candidates:
        cv_snippet = text[:1000].strip()
        candidates_list_str += f"\n--- FILENAME: {fname} ---\n{cv_snippet}\n"
        
    prompt = _GENDER_DETECT_PROMPT.format(
        job_desc=job_desc[:1500].strip(),
        candidates_list=candidates_list_str
    )
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            res_data = response.json()
            
            raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
            data = json.loads(raw_text)
            
            jd_g = data.get("job_desc_gender_preference")
            jd_gender = jd_g if jd_g in ["male", "female"] else None
            
            cand_genders = {}
            for item in data.get("candidates", []):
                fname = item.get("filename")
                g = item.get("gender")
                cand_genders[fname] = g if g in ["male", "female"] else None
                
            # Fill missing candidates
            for fname, text in candidates:
                if fname not in cand_genders:
                    cand_genders[fname] = _detect_cv_gender_local(text)
                    
            return jd_gender, cand_genders
            
    except Exception as exc:
        logger.warning("Gemini gender detection failed: %s. Using local fallback.", exc)
        jd_gender = _detect_jd_gender_local(job_desc)
        cand_genders = {fname: _detect_cv_gender_local(text) for fname, text in candidates}
        return jd_gender, cand_genders

def _fallback_summary(filename: str, cv_text: str, score_pct: float) -> dict:
    """Fallback local extraction if Gemini API is unavailable."""
    # Find Ringkasan Profil if present
    match = re.search(r"ringkasan profil(.*?)pengalaman kerja", cv_text, re.IGNORECASE | re.DOTALL)
    if match:
        summary_text = match.group(1).strip()
    else:
        summary_text = cv_text.strip()[:150]
        if len(cv_text) > 150:
            summary_text += "..."
            
    summary_clean = " ".join(summary_text.split())
    if len(summary_clean) > 200:
        summary_clean = summary_clean[:197] + "..."
        
    is_match = score_pct >= 40.0
    reason = (
        "Kandidat memiliki kualifikasi yang cukup relevan dengan kualifikasi pekerjaan yang dicari."
        if is_match else
        "Kandidat kurang relevan dengan spesifikasi pekerjaan yang dicari."
    )
    
    return {
        "filename": filename,
        "profile_summary": summary_clean if summary_clean else "Profil singkat kandidat.",
        "is_match": is_match,
        "reason": reason
    }

def get_candidate_summaries(
    job_desc: str,
    candidates: list[tuple[str, str]],
    scores_pct: dict[str, float]
) -> dict[str, dict]:
    """
    Generate summaries and matching status for candidates.
    Uses Gemini API (gemini-2.5-flash) and falls back to local rules if not available.
    """
    api_key = settings.gemini_api_key
    if not api_key or api_key == "your_gemini_api_key_here":
        logger.info("Gemini API key not configured; using local fallback summaries.")
        return {fname: _fallback_summary(fname, text, scores_pct.get(fname, 0.0)) for fname, text in candidates}
        
    # Format candidates text for the prompt
    candidates_list_str = ""
    for fname, text in candidates:
        # Send a snippet of the CV (first 1200 characters) to save token limit and keep prompt efficient
        cv_snippet = text[:1200].strip()
        candidates_list_str += f"\n--- FILENAME: {fname} ---\n{cv_snippet}\n"
        
    prompt = _PROMPT_TEMPLATE.format(
        job_desc=job_desc[:2000].strip(),
        candidates_list=candidates_list_str
    )
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            res_data = response.json()
            
            # Extract content from Gemini response
            raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
            data = json.loads(raw_text)
            
            result_map = {}
            for item in data.get("candidates", []):
                fname = item.get("filename")
                result_map[fname] = {
                    "filename": fname,
                    "profile_summary": item.get("profile_summary", ""),
                    "is_match": bool(item.get("is_match", True)),
                    "reason": item.get("reason", "")
                }
                
            # Fill in any missing candidates in the API response using fallback
            for fname, text in candidates:
                if fname not in result_map:
                    result_map[fname] = _fallback_summary(fname, text, scores_pct.get(fname, 0.0))
                    
            return result_map
            
    except Exception as exc:
        logger.warning("Gemini candidate summarization failed: %s. Falling back.", exc)
        return {fname: _fallback_summary(fname, text, scores_pct.get(fname, 0.0)) for fname, text in candidates}


def extract_candidate_name_with_ai(filename: str, text: str) -> str:
    """
    Extract candidate name from CV text using Gemini or a clean fallback.
    """
    api_key = settings.gemini_api_key
    
    # Fallback to cleaning up the filename
    def _clean_filename(fname: str) -> str:
        # Strip extension
        name = fname.rsplit(".", 1)[0]
        # Replace hyphens/underscores/special characters with spaces
        name = re.sub(r"[-_]+", " ", name)
        # Remove common phrases like "cv", "resume", "resume pdf", "evaluasi", etc.
        name = re.sub(r"\b(cv|resume|pdf|curriculum|vitae|file|karyawan|calon|tugas|hasil|result)\b", "", name, flags=re.IGNORECASE)
        # Remove extra spaces
        name = " ".join(name.split())
        # Capitalize words
        name = name.title()
        return name if name else "Karyawan Baru"

    if not api_key or api_key == "your_gemini_api_key_here":
        logger.info("Gemini API key not configured; using filename clean-up fallback.")
        return _clean_filename(filename)

    prompt = f"""Analyze the following candidate CV or resume text and extract the candidate's full name.

Candidate CV text snippet:
{text[:1200]}

Filename: {filename}

Rules:
1. Identify the full name of the candidate. Usually, it is prominently featured at the beginning of the text or CV.
2. If no name can be confidently identified, use the filename as a clue.
3. Return ONLY a valid JSON object matching the following structure:
{{
  "name": "Candidate Full Name"
}}
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            res_data = response.json()
            raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
            data = json.loads(raw_text)
            extracted_name = data.get("name", "").strip()
            if extracted_name:
                return extracted_name
    except Exception as exc:
        logger.warning("Gemini candidate name extraction failed: %s. Using filename fallback.", exc)
        
    return _clean_filename(filename)


_COMMON_WORDS = {
    # Indonesian common and recruitment words
    "dan", "yang", "untuk", "dengan", "saya", "kami", "kita", "kamu", "dia", "mereka",
    "adalah", "sebagai", "dari", "di", "ke", "ini", "itu", "atau", "bisa", "dapat",
    "ada", "tidak", "bukan", "hanya", "sangat", "lebih", "telah", "sudah", "dalam",
    "pada", "oleh", "secara", "karena", "jika", "mencari", "butuh", "lowongan",
    "loker", "kerja", "posisi", "kandidat", "pelamar", "syarat", "kualifikasi",
    "pengalaman", "kemampuan", "keahlian", "bidang", "minimal", "maksimal",
    "pria", "wanita", "laki", "perempuan", "pendidikan", "jurusan", "lulusan",
    "utama", "tugas", "tanggung", "jawab", "deskripsi", "pekerjaan", "perusahaan",
    "bisnis", "industri", "sistem", "aplikasi", "data", "teknologi", "informasi",
    "komunikasi", "tim", "collab", "kolaborasi", "mampu", "menguasai", "memiliki",
    "mengembangkan", "membuat", "mengelola", "mengoperasikan", "magang", "seleksi",
    # English common and recruitment words
    "the", "and", "to", "of", "a", "in", "for", "is", "on", "that", "by", "this",
    "with", "i", "you", "it", "not", "or", "be", "are", "from", "at", "as", "your",
    "we", "us", "our", "an", "will", "can", "but", "more", "has", "have", "had",
    "job", "description", "requirements", "qualification", "experience", "skills",
    "responsibilities", "candidate", "role", "apply", "cv", "resume", "spg", "spb",
    "sales", "engineer", "developer", "designer", "staff", "manager", "admin",
    "hiring", "recruit", "recruitment", "looking", "search", "seek", "position",
    "full", "time", "part", "intern", "internship", "graduate", "degree", "education",
    "major", "business", "company", "team", "work", "develop", "manage", "lead"
}


def validate_job_desc_with_ai(job_desc: str) -> tuple[bool, str]:
    """
    Validate if the Job Description text is coherent and has context.
    Returns:
        - is_valid: bool
        - message: str (error message or explanation)
    """
    cleaned_jd = job_desc.strip()
    if not cleaned_jd:
        return False, "Job description cannot be empty."

    # Pre-parse words for local checks
    words = [w.lower().strip(".,;:!?()\"'-") for w in cleaned_jd.split()]
    words = [w for w in words if w]
    
    # 1. Length constraint
    if len(cleaned_jd) < 20 or len(words) < 4:
        return False, "Masukkan job description yang benar (minimal 20 karakter dan 4 kata)."

    api_key = settings.gemini_api_key
    if not api_key or api_key == "your_gemini_api_key_here":
        # Fallback local heuristic check
        # Count matching common/recruitment words
        valid_word_count = sum(1 for w in words if w in _COMMON_WORDS)
        
        # Calculate ratio of recognized words
        if len(words) >= 4:
            common_ratio = valid_word_count / len(words)
            if common_ratio < 0.15:
                return False, "Masukkan job description yang benar."
        return True, ""

    # Call Gemini to validate Job Description quality/context
    prompt = f"""Analyze the following text and determine if it is a coherent job description, kriteria pekerjaan, lowongan kerja, or related recruitment text in any language.
Gibberish, contextless sentences, random strings of words (like "saya idnej aoispc cjadnco nsdoinci"), or text that makes no sense as a job post or candidate requirements should be classified as invalid.

Text:
{cleaned_jd}

Return ONLY a valid JSON object matching the following structure:
{{
  "is_valid": true or false,
  "reason": "Explanation in Indonesian why it is valid or invalid"
}}
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            res_data = response.json()
            raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
            data = json.loads(raw_text)
            is_valid = bool(data.get("is_valid", True))
            reason = data.get("reason", "Masukkan job description yang benar.")
            return is_valid, reason
    except Exception as exc:
        logger.warning("Gemini JD validation failed: %s. Using local fallback.", exc)
        # Fallback to local check
        valid_word_count = sum(1 for w in words if w in _COMMON_WORDS)
        if len(words) >= 4:
            common_ratio = valid_word_count / len(words)
            if common_ratio < 0.15:
                return False, "Masukkan job description yang benar."
        return True, ""

