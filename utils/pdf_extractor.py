import fitz  # PyMuPDF
import io

# =============================================
# Modul Ekstraksi Teks dari PDF
# Anggota 3: Integration & Utility Engineer
# =============================================

def extract_text_from_pdf(file) -> str:
    """
    Mengekstrak seluruh teks dari file PDF yang diunggah.
    Mendukung objek file Streamlit (UploadedFile) maupun bytes.

    Args:
        file: File PDF. Bisa berupa:
              - st.UploadedFile (dari st.file_uploader)
              - bytes / BytesIO object

    Returns:
        str: Teks yang berhasil diekstrak dari semua halaman PDF.
             Mengembalikan string kosong jika ekstraksi gagal.
    """
    # TODO (Anggota 3): Implementasikan ekstraksi PDF ini
    try:
        # Baca file sebagai bytes
        if hasattr(file, 'read'):
            file_bytes = file.read()
        else:
            file_bytes = file

        # Buka dokumen PDF dari bytes
        doc = fitz.open(stream=file_bytes, filetype="pdf")

        extracted_text = ""
        for page_num, page in enumerate(doc):
            page_text = page.get_text()
            extracted_text += f"\n--- Halaman {page_num + 1} ---\n"
            extracted_text += page_text

        doc.close()
        return extracted_text.strip()

    except Exception as e:
        print(f"[ERROR] Gagal mengekstrak PDF: {e}")
        return ""


def extract_multiple_pdfs(files: list) -> list[dict]:
    """
    Mengekstrak teks dari beberapa file PDF sekaligus.

    Args:
        files (list): Daftar file PDF yang diunggah.

    Returns:
        list[dict]: Daftar hasil ekstraksi.
            Format: [{"name": str, "cv_text": str, "success": bool}, ...]
    """
    # TODO (Anggota 3): Implementasikan batch extraction ini
    results = []
    for file in files:
        text = extract_text_from_pdf(file)
        results.append({
            "name": file.name if hasattr(file, 'name') else "unknown.pdf",
            "cv_text": text,
            "success": len(text) > 0
        })
    return results
