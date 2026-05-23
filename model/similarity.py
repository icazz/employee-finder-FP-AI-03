import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from model.embedder import get_embedding, get_embeddings_batch

# =============================================
# Modul Perhitungan Cosine Similarity
# Anggota 1: AI & Backend Engineer
# =============================================

def calculate_similarity(jd_text: str, cv_text: str) -> float:
    """
    Menghitung skor kecocokan antara satu CV dan satu Job Description.

    Args:
        jd_text (str): Teks Job Description.
        cv_text (str): Teks CV kandidat.

    Returns:
        float: Skor kecocokan dalam bentuk persentase (0.0 - 100.0).
    """
    # TODO (Anggota 1): Implementasikan fungsi ini
    jd_embedding = get_embedding(jd_text).reshape(1, -1)
    cv_embedding = get_embedding(cv_text).reshape(1, -1)

    score = cosine_similarity(jd_embedding, cv_embedding)[0][0]
    return round(float(score) * 100, 2)  # Konversi ke persentase


def rank_candidates(jd_text: str, candidates: list[dict]) -> list[dict]:
    """
    Merangking daftar kandidat berdasarkan skor kecocokan dengan JD.

    Args:
        jd_text (str): Teks Job Description.
        candidates (list[dict]): Daftar kandidat.
            Format: [{"name": str, "cv_text": str}, ...]

    Returns:
        list[dict]: Daftar kandidat terurut dari skor tertinggi.
            Format: [{"rank": int, "name": str, "score": float, "status": str}, ...]
    """
    # TODO (Anggota 1): Implementasikan fungsi ranking ini
    results = []
    for candidate in candidates:
        score = calculate_similarity(jd_text, candidate["cv_text"])
        status = _get_status_label(score)
        results.append({
            "name": candidate["name"],
            "score": score,
            "status": status
        })

    # Urutkan dari skor tertinggi ke terendah
    results.sort(key=lambda x: x["score"], reverse=True)

    # Tambahkan nomor ranking
    for i, result in enumerate(results):
        result["rank"] = i + 1

    return results


def _get_status_label(score: float) -> str:
    """
    Mengkonversi skor kecocokan menjadi label status yang mudah dibaca HR.

    Args:
        score (float): Skor kecocokan (0.0 - 100.0).

    Returns:
        str: Label status.
    """
    if score >= 75:
        return "✅ Sangat Cocok"
    elif score >= 55:
        return "🟡 Cukup Cocok"
    else:
        return "❌ Kurang Cocok"
