import re
from sklearn.feature_extraction.text import TfidfVectorizer

# =============================================
# Modul Keyword Gap Analysis
# Anggota 1: AI & Backend Engineer
# =============================================

def extract_keywords(text: str, top_n: int = 20) -> list[str]:
    """
    Mengekstrak kata kunci penting dari sebuah teks menggunakan TF-IDF.

    Args:
        text (str): Teks input (biasanya Job Description).
        top_n (int): Jumlah kata kunci teratas yang diambil.

    Returns:
        list[str]: Daftar kata kunci.
    """
    # TODO (Anggota 1): Implementasikan ekstraksi keyword ini
    # Bersihkan teks dari karakter khusus
    clean_text = re.sub(r'[^\w\s]', ' ', text.lower())

    # Gunakan TF-IDF untuk menemukan kata yang paling relevan
    vectorizer = TfidfVectorizer(
        stop_words=None,  # Tambahkan stopwords Bahasa Indonesia jika diperlukan
        max_features=top_n,
        ngram_range=(1, 2)  # Ambil kata tunggal dan dua kata (bigram)
    )
    try:
        vectorizer.fit([clean_text])
        keywords = vectorizer.get_feature_names_out().tolist()
    except Exception:
        keywords = []

    return keywords


def analyze_keyword_gap(jd_text: str, cv_text: str) -> dict:
    """
    Menganalisis kata kunci dari JD mana yang ada dan tidak ada di CV.

    Args:
        jd_text (str): Teks Job Description.
        cv_text (str): Teks CV kandidat.

    Returns:
        dict: Hasil analisis dengan dua key:
            - "found"   : list kata kunci yang DITEMUKAN di CV
            - "missing" : list kata kunci yang TIDAK DITEMUKAN di CV
    """
    # TODO (Anggota 1): Implementasikan analisis gap ini
    jd_keywords = extract_keywords(jd_text)
    cv_text_lower = cv_text.lower()

    found = []
    missing = []

    for keyword in jd_keywords:
        if keyword in cv_text_lower:
            found.append(keyword)
        else:
            missing.append(keyword)

    return {
        "found": found,
        "missing": missing
    }
