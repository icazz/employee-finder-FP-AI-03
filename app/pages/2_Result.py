import streamlit as st
import pandas as pd

# =============================================
# Halaman 2: Hasil Ranking & Analisis
# Anggota 2: Frontend & Streamlit Developer
# =============================================

st.set_page_config(page_title="Hasil Ranking - Employee Finder", page_icon="📊", layout="wide")

st.title("📊 Hasil Ranking Kandidat")
st.markdown("---")

# Cek apakah data sudah ada dari halaman Input
if "jd_text" not in st.session_state or "uploaded_files" not in st.session_state:
    st.warning("⚠️ Belum ada data untuk dianalisis. Silakan kembali ke halaman **Input Data** terlebih dahulu.")
    st.stop()

# -----------------------------------------------
# SECTION 1: Ranking Table
# -----------------------------------------------
st.subheader("🏆 Tabel Ranking Kandidat")

# TODO (Anggota 1 & 3): Ganti dummy data di bawah ini dengan hasil
#   dari model.similarity dan utils.pdf_extractor yang sesungguhnya.
# Contoh format data yang diharapkan:
# results = [
#     {"Rank": 1, "Nama CV": "budi_cv.pdf", "Skor Kecocokan (%)": 87.5, "Status": "✅ Sangat Cocok"},
#     {"Rank": 2, "Nama CV": "ani_cv.pdf",  "Skor Kecocokan (%)": 72.3, "Status": "🟡 Cukup Cocok"},
# ]

st.info("🚧 Halaman ini masih dalam pengembangan. Hasil ranking akan tampil di sini setelah model AI terintegrasi.")

# -----------------------------------------------
# SECTION 2: Visualisasi Skor
# -----------------------------------------------
st.markdown("---")
st.subheader("📈 Visualisasi Skor Kecocokan")

# TODO (Anggota 2): Implementasi bar chart di sini menggunakan komponen charts.py
# from app.components.charts import render_score_chart
# render_score_chart(results)

# -----------------------------------------------
# SECTION 3: Detail Kandidat (Keyword Gap)
# -----------------------------------------------
st.markdown("---")
st.subheader("🔍 Detail Analisis Kandidat")

# TODO (Anggota 1): Tampilkan hasil keyword gap analysis di sini
# Contoh output yang diharapkan:
# st.markdown("**Skill yang ditemukan di CV:** Python ✅, SQL ✅, Komunikasi ✅")
# st.markdown("**Skill yang KURANG di CV:** Machine Learning ❌, Tableau ❌")

# -----------------------------------------------
# SECTION 4: Export PDF
# -----------------------------------------------
st.markdown("---")
col1, col2, col3 = st.columns([1, 2, 1])
with col2:
    export_btn = st.button("📄 Export Laporan PDF", type="secondary", use_container_width=True)

if export_btn:
    # TODO (Anggota 3): Panggil fungsi exporter.py di sini
    # from utils.exporter import generate_pdf_report
    # pdf_bytes = generate_pdf_report(results)
    # st.download_button("⬇️ Download PDF", data=pdf_bytes, file_name="laporan_ranking.pdf", mime="application/pdf")
    st.warning("🚧 Fitur export PDF sedang dalam pengembangan.")
