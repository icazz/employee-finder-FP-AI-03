import streamlit as st

# =============================================
# Employee Finder - Entry Point
# Anggota 2: Frontend & Streamlit Developer
# =============================================

st.set_page_config(
    page_title="Employee Finder",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Sidebar Navigasi ---
st.sidebar.title("🔍 Employee Finder")
st.sidebar.markdown("Dashboard HR untuk analisis kecocokan CV dan Job Description menggunakan AI.")
st.sidebar.markdown("---")

# --- Halaman Utama ---
st.title("🔍 Employee Finder")
st.subheader("Platform Analisis CV Berbasis AI untuk HR")

st.markdown("""
Selamat datang di **Employee Finder**! Aplikasi ini membantu HR dalam:
- 📄 **Menganalisis CV kandidat** secara otomatis dari file PDF
- 🎯 **Mencocokkan CV dengan Job Description** menggunakan AI Semantic Similarity
- 📊 **Merangking kandidat** dari yang paling cocok hingga yang kurang cocok
- 🔍 **Mengidentifikasi Keyword Gap** (skill yang kurang dari kandidat)

---

### 📖 Cara Penggunaan:
1. Buka halaman **Input Data** di sidebar → Upload CV & masukkan Job Description
2. Klik tombol **"Analisis"** untuk memproses data
3. Lihat **Hasil Ranking** di halaman Result

👈 Gunakan **sidebar kiri** untuk navigasi antar halaman.
""")

st.info("💡 **Tips:** Anda dapat mengupload beberapa CV sekaligus untuk perbandingan antar kandidat.")
