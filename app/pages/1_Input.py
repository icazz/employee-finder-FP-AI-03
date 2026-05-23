import streamlit as st
import sys
import os

# Tambahkan root ke path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# =============================================
# Halaman 1: Input Data
# Anggota 2: Frontend & Streamlit Developer
# Anggota 3: Integration (PDF Extractor)
# =============================================

st.set_page_config(page_title="Input Data - Employee Finder", page_icon="📥", layout="wide")

st.title("📥 Input Data")
st.markdown("Masukkan **Job Description** dan **upload CV kandidat** untuk dianalisis.")
st.markdown("---")

# -----------------------------------------------
# SECTION 1: Job Description Input
# -----------------------------------------------
st.subheader("1️⃣ Job Description (JD)")

# TODO (Anggota 2): Tambahkan dropdown template JD
# template = st.selectbox("Gunakan Template:", ["-- Tidak Ada --", "Data Analyst", "Frontend Developer", "Marketing Executive"])

jd_text = st.text_area(
    label="Tempel teks Job Description di sini:",
    placeholder="Contoh: Kami mencari seorang Data Analyst dengan kemampuan Python, SQL, dan visualisasi data...",
    height=250,
    key="jd_input"
)

st.markdown("---")

# -----------------------------------------------
# SECTION 2: Upload CV
# -----------------------------------------------
st.subheader("2️⃣ Upload CV Kandidat (PDF)")

uploaded_files = st.file_uploader(
    label="Upload satu atau lebih file CV dalam format PDF:",
    type=["pdf"],
    accept_multiple_files=True,
    key="cv_upload"
)

# TODO (Anggota 3): Implementasikan ekstraksi teks PDF di sini
# from utils.pdf_extractor import extract_text_from_pdf
# if uploaded_files:
#     for file in uploaded_files:
#         extracted_text = extract_text_from_pdf(file)
#         st.text_area(f"Teks dari {file.name}:", value=extracted_text, height=200)

if uploaded_files:
    st.success(f"✅ {len(uploaded_files)} file berhasil diupload.")
    for file in uploaded_files:
        st.markdown(f"- 📄 `{file.name}`")

st.markdown("---")

# -----------------------------------------------
# SECTION 3: Tombol Analisis
# -----------------------------------------------
col1, col2, col3 = st.columns([1, 2, 1])
with col2:
    analyze_btn = st.button("🔍 Mulai Analisis", type="primary", use_container_width=True)

if analyze_btn:
    if not jd_text.strip():
        st.error("❌ Job Description tidak boleh kosong!")
    elif not uploaded_files:
        st.error("❌ Harap upload minimal satu file CV!")
    else:
        # TODO (Anggota 1 & 3): Jalankan proses AI similarity di sini
        # Simpan hasil ke st.session_state agar bisa diakses di halaman Result
        st.session_state["jd_text"] = jd_text
        st.session_state["uploaded_files"] = uploaded_files
        st.success("✅ Data berhasil disimpan! Buka halaman **Result** untuk melihat hasil ranking.")
