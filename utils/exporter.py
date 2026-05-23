from fpdf import FPDF
from datetime import datetime

# =============================================
# Modul Export Laporan ke PDF
# Anggota 3: Integration & Utility Engineer
# =============================================

class ReportPDF(FPDF):
    """Kelas PDF kustom dengan header dan footer otomatis."""

    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.cell(0, 10, "Employee Finder - Laporan Analisis Kandidat", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", size=9)
        self.cell(0, 6, f"Digenerate pada: {datetime.now().strftime('%d %B %Y, %H:%M')}", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Halaman {self.page_no()}", align="C")


def generate_pdf_report(jd_text: str, results: list[dict]) -> bytes:
    """
    Menggenerate laporan PDF berisi tabel ranking dan detail analisis.

    Args:
        jd_text (str): Teks Job Description yang digunakan sebagai referensi.
        results (list[dict]): Daftar hasil ranking kandidat.
            Format: [{"rank": int, "name": str, "score": float, "status": str}, ...]

    Returns:
        bytes: File PDF dalam bentuk bytes, siap di-download.
    """
    # TODO (Anggota 3): Implementasikan generate PDF ini
    pdf = ReportPDF()
    pdf.add_page()

    # --- Section: Job Description ---
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "Job Description:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", size=10)
    pdf.multi_cell(0, 7, jd_text[:500] + ("..." if len(jd_text) > 500 else ""))
    pdf.ln(5)

    # --- Section: Tabel Ranking ---
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "Hasil Ranking Kandidat:", new_x="LMARGIN", new_y="NEXT")

    # Header tabel
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(220, 220, 220)
    pdf.cell(15,  9, "Rank",          border=1, fill=True)
    pdf.cell(70,  9, "Nama CV",       border=1, fill=True)
    pdf.cell(40,  9, "Skor (%)",      border=1, fill=True)
    pdf.cell(60,  9, "Status",        border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

    # Isi tabel
    pdf.set_font("Helvetica", size=10)
    for item in results:
        pdf.cell(15, 9, str(item.get("rank", "-")),     border=1)
        pdf.cell(70, 9, str(item.get("name", "-")),     border=1)
        pdf.cell(40, 9, f"{item.get('score', 0):.1f}%", border=1)
        # Bersihkan emoji untuk PDF (FPDF tidak mendukung emoji)
        status_clean = item.get("status", "-").replace("✅", "[OK]").replace("🟡", "[~]").replace("❌", "[X]")
        pdf.cell(60, 9, status_clean, border=1, new_x="LMARGIN", new_y="NEXT")

    pdf_bytes = pdf.output()
    return bytes(pdf_bytes)
