# 📄 Panduan Proyek: Employee Finder

Dokumen ini adalah panduan lengkap proyek **Employee Finder** untuk kolaborasi tim (3 orang) selama 4 minggu ke depan. Dokumen ini mencakup pembagian tugas, fitur-fitur utama, alur kerja sistem, dan panduan teknologi yang digunakan.

---

## 🎯 1. Deskripsi Proyek
**Employee Finder** adalah aplikasi berbasis web (Streamlit) yang dirancang khusus untuk HR (Human Resources) agar dapat menyaring, mencocokkan, dan merangking CV kandidat secara otomatis dengan kriteria lowongan pekerjaan (*Job Description*) menggunakan kecerdasan buatan berbasis *Semantic Similarity* (IndoBERT/Sentence-Transformer).

---

## 🚀 2. Fitur & Skala Prioritas

| No | Fitur | Penjelasan | Prioritas |
|---|---|---|---|
| 1 | **Upload PDF CV** | Mengunggah file PDF CV, sistem mengekstrak teks di dalamnya secara otomatis. | ⭐ **Wajib** |
| 2 | **Job Desc Textarea** | Form input berbasis teks untuk HR menempelkan (*copy-paste*) kriteria lowongan kerja (Job Description). | ⭐ **Wajib** |
| 3 | **Semantic Similarity (AI)** | Menggunakan model NLP (seperti IndoBERT/Sentence-Transformer) untuk menghitung persentase kemiripan makna CV vs JD. | ⭐ **Wajib** |
| 4 | **Ranking Kandidat** | Menampilkan daftar kandidat terurut dari yang paling cocok secara otomatis. | ⭐ **Wajib** |
| 5 | **Keyword Gap Analysis** | Menganalisis kata kunci/skill penting apa saja dari JD yang *ada* atau *tidak ditemukan* di dalam CV kandidat. | 🔵 **Penting** |
| 6 | **Visualisasi Skor** | Grafik/diagram interaktif (misalnya bar chart) untuk mempermudah HR membandingkan skor antar kandidat. | 🔵 **Penting** |
| 7 | **Export PDF** | Fitur untuk mengunduh hasil analisis ranking dan detail kecocokan kandidat menjadi file laporan PDF. | 🟡 **Bonus** |

---

## 🔄 3. Alur Kerja Sistem (Workflow)

Berikut adalah alur perjalanan aplikasi dari sudut pandang pengguna (HR):

### 📥 TAHAP 1: INPUT DATA
1. **Input Job Description**
   * HR menyalin (*copy-paste*) kriteria lowongan pekerjaan ke kolom *textarea* yang disediakan di aplikasi.
2. **Upload PDF CV**
   * HR mengunggah (*upload*) satu atau beberapa file PDF CV kandidat sekaligus.
3. **Auto-Extraction**
   * Sistem secara otomatis mengekstrak teks dari file PDF dan menampilkannya kembali ke layar agar bisa dikoreksi/diedit oleh HR jika ada kesalahan ekstraksi.

### 🧠 TAHAP 2: ANALISIS AI
4. **Klik Tombol "Analisis"**
   * HR menekan tombol untuk memulai pemrosesan kecocokan dokumen.
5. **NLP & Similarity Engine**
   * AI memproses teks JD dan CV menggunakan model embedding (IndoBERT/Sentence-Transformer) untuk menghitung skor kemiripan makna (*Cosine Similarity*).

### 📊 TAHAP 3: DASHBOARD HASIL
6. **Ranking Dashboard**
   * Menampilkan tabel ranking kandidat dari persentase kecocokan tertinggi ke terendah, lengkap dengan visualisasi grafik *bar chart*.
7. **Detail Analisis & Keyword Gap**
   * HR dapat mengklik kandidat tertentu untuk melihat kecocokan aspek serta daftar kata kunci/skill yang kurang (*missing keywords*).
8. **Export PDF**
   * HR mengunduh hasil rangkuman analisis dan tabel ranking dalam bentuk laporan PDF siap pakai.

---

## 👥 4. Pembagian Tugas Kelompok (3 Orang)

Untuk kelancaran pengerjaan selama 4 minggu, berikut adalah rincian tugas dan jadwal pengerjaan masing-masing anggota tim:

### 🧑‍💻 Anggota 1: AI & Backend Engineer
*Fokus Utama: Model NLP, Embedding, & Logika Similarity*
* **Minggu 1:** Riset dan setup environment model (IndoBERT atau Sentence-Transformer multilingual seperti `paraphrase-multilingual-MiniLM-L12-v2`).
* **Minggu 2:** Membuat fungsi utama untuk mengubah teks CV dan JD menjadi embedding vektor, lalu menghitung skor kecocokan menggunakan *Cosine Similarity*.
* **Minggu 3:** Implementasi logika *Keyword Gap Analysis* (ekstraksi kata kunci penting dari JD dan membandingkannya dengan isi CV untuk mencari kata kunci yang tidak ditemukan).
* **Minggu 4:** Optimasi performa model AI, pengujian akurasi pencocokan, dan membantu integrasi akhir ke UI.

### 🧑‍💻 Anggota 2: Frontend & Streamlit Developer
*Fokus Utama: Desain UI, Layout Dashboard, & Visualisasi*
* **Minggu 1:** Desain struktur halaman web, setup dasar Streamlit, dan membuat layout/tema dashboard HR yang bersih dan responsif.
* **Minggu 2:** Membuat form input interaktif untuk penempelan Job Description dan komponen visualisasi penampung teks CV hasil ekstraksi.
* **Minggu 3:** Membuat tabel ranking kandidat yang interaktif (bisa di-sort/filter) serta grafik visualisasi (bar chart/gauge) menggunakan Plotly atau Altair.
* **Minggu 4:** Menyempurnakan UI/UX (menambahkan loading spinner, alert penanganan error, styling) dan integrasi visual akhir.

### 🧑‍💻 Anggota 3: Integration & Utility Engineer
*Fokus Utama: Ekstraksi Dokumen, Ekspor Data, & Integrasi Sistem*
* **Minggu 1:** Implementasi pembaca PDF menggunakan library `PyMuPDF` (fitz) atau `pdfplumber` untuk mengekstrak teks dari file CV yang diunggah.
* **Minggu 2:** Menghubungkan fungsi ekstraksi PDF dengan komponen input text di Streamlit, serta menyambungkannya ke fungsi similarity buatan Anggota 1.
* **Minggu 3:** Membuat fitur **Export PDF** (menggunakan library `fpdf2` atau `reportlab`) agar HR bisa mengunduh rangkuman ranking dalam bentuk file PDF yang rapi.
* **Minggu 4:** Melakukan pengujian integrasi akhir secara menyeluruh (End-to-End Testing), mendokumentasikan kode, dan mempersiapkan materi demo presentasi kelompok.

---

## 📅 5. Timeline Kolaborasi

```
       Minggu 1                   Minggu 2                   Minggu 3                   Minggu 4
┌─────────────────────────┐┌─────────────────────────┐┌─────────────────────────┐┌─────────────────────────┐
│ Anggota 1 (AI Setup)    ││ Anggota 1 (Embedding)   ││ Anggota 1 (Keyword Gap) ││ Integrasi Akhir &       │
├─────────────────────────┤├─────────────────────────┤├─────────────────────────┤│ Evaluasi Bersama        │
│ Anggota 2 (UI Layout)   ││ Anggota 2 (Input Forms) ││ Anggota 2 (Visualisasi) ││                         │
├─────────────────────────┤├─────────────────────────┤├─────────────────────────┤│ Bug Fixing &            │
│ Anggota 3 (PDF Reader)  ││ Anggota 3 (Integrasi AI)││ Anggota 3 (Export PDF)  ││ Dokumen Presentasi      │
└─────────────────────────┘└─────────────────────────┘└─────────────────────────┘└─────────────────────────┘
```

---

## 🛠️ 6. Teknologi & Library yang Direkomendasikan

* **Web Framework:** `streamlit`
* **AI/Embedding Model:** `sentence-transformers` (menggunakan model multilingual seperti `paraphrase-multilingual-MiniLM-L12-v2` yang sangat baik dalam memahami konteks Bahasa Indonesia & Inggris).
* **PDF Extractor:** `pymupdf` (atau diimpor sebagai `fitz`) — sangat cepat dan akurat.
* **Visualisasi Grafik:** `plotly` atau `altair` (terintegrasi bawaan di Streamlit).
* **PDF Generator (Export):** `fpdf2` (ringan dan mudah digunakan untuk membuat dokumen PDF baru dari Python).
