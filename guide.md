# 📄 Panduan Proyek Terupdate: Employee Finder (Containerized)

Dokumen ini adalah panduan lengkap proyek **Employee Finder** untuk kolaborasi tim (3 orang) selama 4 minggu ke depan. Dokumen ini disesuaikan dengan arsitektur modern berbasis **microservices/multi-container** menggunakan **FastAPI, Docker, dan Nginx**.

---

## 🎯 1. Deskripsi Proyek
**Employee Finder** adalah aplikasi berbasis web yang dirancang khusus untuk HR (Human Resources) agar dapat menyaring, mencocokkan, dan merangking CV kandidat secara otomatis dengan kriteria lowongan pekerjaan (*Job Description*) menggunakan kecerdasan buatan berbasis *Semantic Similarity* (FastAPI + AI model & modern Frontend).

Aplikasi dijalankan dalam lingkungan terisolasi menggunakan **Docker Compose** yang terdiri dari:
1.  **Backend (FastAPI)** untuk memproses parser dokumen dan kalkulasi AI.
2.  **Frontend (React/Vite/Next.js)** sebagai antarmuka pengguna (UI/UX).
3.  **Nginx** sebagai reverse proxy dan gateway pengamanan SSL/TLS (HTTPS).

---

## 🚀 2. Fitur & Skala Prioritas

| No | Fitur | Penjelasan | Prioritas |
|---|---|---|---|
| 1 | **Upload PDF & DOCX CV** | Mengunggah multi-file PDF & DOCX CV, sistem mengekstrak teks secara otomatis di backend. | ⭐ **Wajib** |
| 2 | **Job Desc Textarea** | Kolom input teks kriteria lowongan kerja (Job Description) pada Frontend. | ⭐ **Wajib** |
| 3 | **Semantic Similarity (AI)** | Backend menggunakan AI (seperti Anthropic API atau Sentence-Transformer) untuk menghitung persentase kemiripan makna CV vs JD. | ⭐ **Wajib** |
| 4 | **Ranking Kandidat** | Menampilkan daftar kandidat terurut dari yang paling cocok secara otomatis di UI dashboard. | ⭐ **Wajib** |
| 5 | **Keyword Gap Analysis** | Menganalisis kata kunci/skill penting dari JD yang *ada* atau *tidak ditemukan* di dalam CV kandidat. | 🔵 **Penting** |
| 6 | **Visualisasi Skor** | Grafik/diagram interaktif (misalnya bar chart / gauge) untuk mempermudah HR membandingkan skor antar kandidat. | 🔵 **Penting** |
| 7 | **Export Laporan (CSV/PDF)** | Mengunduh hasil analisis ranking dalam bentuk CSV via endpoint `/api/v1/documents/csv` atau PDF. | 🟡 **Bonus** |

---

## 🔄 3. Alur Kerja Sistem (Workflow)

Sistem beroperasi dengan memisahkan tanggung jawab (separation of concerns) antara Client (Frontend) dan Server (Backend):

### 📥 TAHAP 1: INPUT DATA & PARSING
1.  **Pengiriman Data dari Frontend:**
    *   HR menyalin Job Description ke kolom input dan mengunggah satu atau beberapa berkas CV (PDF/DOCX).
2.  **Parsing Dokumen di Backend:**
    *   Frontend mengirimkan file ke API `/api/v1/documents/parse`.
    *   Backend FastAPI menerima file, memvalidasi ukuran dan ekstensinya melalui `routes.py`, lalu memanggil `file_parser.py` untuk mengekstrak teks (menggunakan `PyMuPDF` untuk PDF dan `python-docx` untuk DOCX).
    *   Data teks hasil parsing disimpan secara aman dalam memori/struktur data buffer CSV.

### 🧠 TAHAP 2: ANALISIS AI (NLP)
3.  **Kalkulasi Kemiripan Makna:**
    *   Backend menggunakan modul AI di `backend/app/ai/` untuk mengubah teks JD dan teks CV menjadi representasi vektor (embedding) baik menggunakan local model `sentence-transformers` maupun cloud-based LLM (`Anthropic API`).
    *   Menghitung kecocokan menggunakan *Cosine Similarity* dan melakukan ekstraksi *Keyword Gap*.
    *   Mengembalikan respons JSON berisi skor persentase kecocokan dan detail gap skill ke Frontend.

### 📊 TAHAP 3: DASHBOARD HASIL & EKSPOR
4.  **Tampilan Dashboard (Frontend):**
    *   Frontend menerima hasil analisis dari backend dan merendernya dalam bentuk tabel ranking interaktif yang dapat diurutkan.
    *   Menampilkan grafik komparatif (misal bar chart) untuk membandingkan skor antar kandidat.
5.  **Ekspor Data:**
    *   HR dapat mengklik tombol "Export CSV" untuk mengunduh laporan mentah melalui endpoint `/api/v1/documents/csv` yang disajikan dalam bentuk streaming respons.

---

## 👥 4. Pembagian Tugas Kelompok (3 Orang)

Untuk kelancaran pengerjaan selama 4 minggu, berikut adalah rincian tugas masing-masing anggota tim yang disesuaikan dengan arsitektur baru:

### 🧑‍💻 Anggota 1: AI & Backend Engineer
*Fokus Utama: Logika AI, Endpoint API FastAPI, & NLP Processing*
*   **Minggu 1:** Riset, setup FastAPI, konfigurasi dependencies di `pyproject.toml`, dan integrasi SDK kecerdasan buatan (Anthropic / local embedder setup).
*   **Minggu 2:** Membuat modul AI utama di `backend/app/ai/embedder.py` dan `similarity.py` untuk mengubah teks menjadi embedding serta menghitung skor *Cosine Similarity*.
*   **Minggu 3:** Implementasi logika *Keyword Gap Analysis* di `backend/app/ai/keyword_gap.py` (mengekstrak entitas kata kunci dari JD dan membandingkannya dengan kata-kata di CV).
*   **Minggu 4:** Optimasi performa AI backend, penanganan error (error-handling) jika API mengalami limitasi, dan melakukan integrasi endpoint REST API dengan Frontend.

**📂 Folder/File yang Dikerjakan:**
*   `backend/app/ai/` (Baru - berisi logic embedder, similarity, dan keyword gap)
*   `backend/app/api/routes.py` (Bagian penanganan endpoint kalkulasi AI)
*   `backend/pyproject.toml` (Mengelola library Python backend)

---

### 🧑‍💻 Anggota 2: Frontend Developer
*Fokus Utama: Desain UI, Integrasi REST API, State Management, & Visualisasi*
*   **Minggu 1:** Inisialisasi boilerplate React/Vite/Next.js di folder `frontend/` dan mendesain tema UI dashboard HR yang bersih, modern, dan responsif.
*   **Minggu 2:** Membuat halaman input form (Job Description textarea) dan area drag-and-drop untuk upload berkas CV. Mengintegrasikannya dengan API parsing backend (`/api/v1/documents/parse`).
*   **Minggu 3:** Membuat halaman visualisasi dashboard hasil analisis, menampilkan tabel ranking kandidat, dan membuat grafik interaktif (misal Recharts / Chart.js) untuk perbandingan skor.
*   **Minggu 4:** Menyempurnakan UI/UX (menambahkan loading spinner saat AI menganalisis, alert penanganan error jika API gagal), serta tombol untuk ekspor data.

**📂 Folder/File yang Dikerjakan:**
*   `frontend/` (Seluruh kode frontend, komponen UI, routing, dan pemanggilan API fetch/axios)
*   `docker/Dockerfile.frontend` (Konfigurasi build & run frontend container)

---

### 🧑‍💻 Anggota 3: DevOps & Integration Engineer
*Fokus Utama: Parser Dokumen, Konfigurasi Docker & Nginx, Keamanan, & Ekspor*
*   **Minggu 1:** Setup orkestrasi container Docker (`docker-compose.yml`), konfigurasi Nginx (`nginx/nginx.conf`) untuk reverse proxy lalu lintas HTTPS port 443, serta manajemen SSL/TLS certificates lokal.
*   **Minggu 2:** Implementasi parser dokumen tingkat lanjut di `backend/app/services/file_parser.py` menggunakan `PyMuPDF` (PDF) dan `python-docx` (DOCX), serta endpoint parsing di `routes.py`.
*   **Minggu 3:** Membuat fitur ekspor laporan di backend (seperti generator streaming CSV di `/api/v1/documents/csv`), mengelola file konfigurasi `.env` dan sistem logging backend (`structlog`).
*   **Minggu 4:** Melakukan pengujian integrasi akhir secara menyeluruh (End-to-End Testing antar container), memastikan keamanan komunikasi jaringan internal Docker, dan mengoptimalkan build production multi-stage Dockerfile.

**📂 Folder/File yang Dikerjakan:**
*   `backend/app/services/file_parser.py` (Parser PDF & DOCX)
*   `nginx/nginx.conf` (Proxy dan SSL Routing)
*   `docker/Dockerfile.backend` (Optimasi docker build backend)
*   `docker-compose.yml` (Orkestrasi multi-container)

---

## 📅 5. Timeline Kolaborasi

```
        Minggu 1                   Minggu 2                   Minggu 3                   Minggu 4
┌─────────────────────────┐┌─────────────────────────┐┌─────────────────────────┐┌─────────────────────────┐
│ Anggota 1 (FastAPI & AI)││ Anggota 1 (Embeddings)  ││ Anggota 1 (Keyword Gap) ││ Integrasi E2E,          │
│                         ││                         ││                         ││ Pengujian Bersama,      │
├─────────────────────────┤├─────────────────────────┤├─────────────────────────┤│ Optimasi Kecepatan,     │
│ Anggota 2 (FE Boilerplate││ Anggota 2 (Upload UI &  ││ Anggota 2 (Dashboard &  ││ Dan Bug Fixing          │
│ & Theme Layout)         ││ Parse API Integration)  ││ Chart Visualisation)    ││                         │
├─────────────────────────┤├─────────────────────────┤├─────────────────────────┤│                         │
│ Anggota 3 (Docker Compose││ Anggota 3 (File Parser ││ Anggota 3 (CSV/PDF Export││                         │
│ Setup & Nginx Gateway)  ││ PDF/DOCX Implementation)││ service & .env setup)   ││                         │
└─────────────────────────┘└─────────────────────────┘└─────────────────────────┘└─────────────────────────┘
```

---

## 🛠️ 6. Panduan Teknologi & Library Container

*   **Runtime Environment:** `Docker` & `Docker Compose`
*   **Reverse Proxy / Web Server:** `nginx:1.27-alpine` (terkonfigurasi SSL/TLS TLSv1.2 & TLSv1.3)
*   **Backend Framework:** `FastAPI` (Python 3.11-slim)
*   **Backend Package Manager:** `uv` (diintegrasikan di Dockerfile untuk install dependensi secepat kilat)
*   **AI/NLP Models:** `Anthropic Python SDK` (untuk model AI modern seperti Claude Sonnet) atau `sentence-transformers` (untuk embedding lokal berbasis model multilingual).
*   **Document Extractor:** `pymupdf` (fitz) & `python-docx`
*   **Frontend Stack:** React (Vite) / Next.js dengan visualisasi berbasis `Recharts` / `Chart.js` yang responsif.
