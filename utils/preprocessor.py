import re

# =============================================
# Modul Preprocessing Teks
# Anggota 3: Integration & Utility Engineer
# =============================================

def clean_text(text: str) -> str:
    """
    Membersihkan teks dari karakter yang tidak dibutuhkan sebelum diproses AI.

    Args:
        text (str): Teks mentah dari PDF atau textarea.

    Returns:
        str: Teks yang sudah bersih dan siap diproses.
    """
    # TODO (Anggota 3): Implementasikan cleaning text ini

    # Hapus karakter non-ASCII
    text = text.encode("ascii", errors="ignore").decode()

    # Hapus baris pemisah seperti "--- Halaman X ---"
    text = re.sub(r'--- Halaman \d+ ---', '', text)

    # Hapus spasi berlebih dan baris kosong ganda
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)

    return text.strip()


def preprocess_for_model(text: str) -> str:
    """
    Preprocessing akhir sebelum teks dimasukkan ke model embedding.
    Hanya ambil teks yang paling informatif, potong jika terlalu panjang.

    Args:
        text (str): Teks yang sudah dibersihkan.

    Returns:
        str: Teks final yang siap diembedding (max 512 token).
    """
    # TODO (Anggota 3): Sesuaikan batasan token dengan model yang dipakai
    text = clean_text(text)

    # Potong teks yang terlalu panjang (model biasanya max 512 token ≈ ~1500 karakter)
    MAX_CHARS = 2000
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]

    return text
