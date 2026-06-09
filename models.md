# 🤖 Spesifikasi Model AI - Employee Finder

Dokumen ini menjelaskan rincian arsitektur model kecerdasan buatan (AI) yang digunakan di backend sistem **Employee Finder** untuk penyaringan dan pemeringkatan CV kandidat.

---

## 1. Model AI Generatif & Analitis: `gemini-1.5-flash`
Model bahasa besar (LLM) dari Google yang diakses melalui API resmi Google AI Studio.

- **Fungsi Utama**:
  1. **Dynamic Gender Detection (AI-Driven)**: Menganalisis teks lowongan kerja (*Job Description*) dan potongan isi CV untuk mendeteksi persyaratan gender dan jenis kelamin kandidat secara kontekstual tanpa aturan kata kunci statis (*hardcoded*).
  2. **Profile Summarization**: Menganalisis CV kandidat secara kualitatif dan merangkum profil profesional mereka dalam 2-3 kalimat berbahasa Indonesia.
  3. **Evaluasi & Badge Kelayakan**: Menilai kelayakan kandidat secara holistik untuk menentukan status pencocokan (*MATCH* atau *NOT MATCH*) serta menyusun argumen penjelas (*reason*) dalam bahasa Indonesia yang ramah dan formal.
- **Mekanisme Fallback (Fault-Tolerance)**:
  Apabila API Key Gemini tidak terkonfigurasi pada file `.env` atau panggilan API gagal, backend otomatis beralih menggunakan parser berbasis aturan (*rule-based regex parser*) lokal untuk meminimalkan kegagalan total sistem.

---

## 2. Model Text Embedding: `intfloat/multilingual-e5-base`
Model representasi vektor teks multibahasa berbasis arsitektur Transformer yang dioptimalkan untuk tugas pencarian informasi dan kesamaan kalimat.

- **Fungsi Utama**:
  Mengubah teks panjang (seluruh deskripsi pekerjaan dan isi CV) menjadi vektor numerik padat (embeddings). Vektor ini menangkap makna semantik dari kata-kata tersebut. Backend menggunakan hasil vektor ini untuk mengkalkulasi **Skor Kemiripan Semantik (Semantic Similarity Score)** menggunakan metode *Cosine Similarity*.
- **Metode Eksekusi (Fleksibel)**:
  1. **Hugging Face Inference API (Cloud Mode - Utama)**:
     Menggunakan token `HF_API_KEY` di file `.env` untuk mengirim teks dan menerima embedding dari API Hugging Face. Menghemat RAM dan ruang disk pada server hosting secara signifikan.
  2. **Sentence-Transformers (Local Mode - Alternatif)**:
     Jika diaktifkan lewat file `.env` (`USE_LOCAL_EMBEDDINGS=true`), model diunduh sekali (~470MB) dan dijalankan secara lokal di dalam container backend.
  3. **TF-IDF (Fallback)**:
     Jika cloud API dan model lokal tidak tersedia, backend menggunakan representasi TF-IDF klasikal via `scikit-learn` untuk menghitung frekuensi pencocokan kata secara offline.

---

## 3. Kombinasi Skor (Hybrid Scoring)
Sistem memadukan performa AI dengan analisis kata kunci teknis menggunakan formula hibrida:
- **Semantic Weight**: 70% (kalkulasi model E5)
- **Keyword Coverage Weight**: 30% (menganalisis persentase kecocokan kata kunci teknis penting secara eksak).

Formula:
`Skor Akhir = 0.70 * Skor Semantik + 0.30 * Cakupan Kata Kunci`

*Catatan: Jika kriteria preferensi gender terdeteksi dan kandidat tidak memenuhi kriteria tersebut, skor hibrida akhir akan diskalakan ke bawah (rentang 0.0 - 0.5) agar kandidat dengan gender yang sesuai tetap menempati ranking atas.*
