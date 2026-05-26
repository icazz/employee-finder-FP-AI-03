# Employee Finder (Containerized Version)

Aplikasi web modern berbasis microservices untuk HR yang dirancang untuk **menyaring, menganalisis, dan merangking CV kandidat** secara otomatis. Aplikasi ini membandingkan kesesuaian antara dokumen CV (PDF/DOCX) dengan kriteria lowongan pekerjaan (*Job Description*) menggunakan AI berbasis *Semantic Similarity* (FastAPI + NLP Service).

Aplikasi ini kini telah dimodernisasi menggunakan arsitektur **multi-container (Docker & Docker Compose)** dengan **Nginx** sebagai reverse proxy berkemampuan HTTPS.

---

## 🛠️ Arsitektur & Teknologi

Sistem dibangun menggunakan arsitektur microservices terisolasi:

*   **Backend (FastAPI - Python 3.11):** 
    *   Layanan REST API berkinerja tinggi untuk parsing dokumen (`PyMuPDF` & `python-docx`) dan analisis NLP.
    *   Manajemen dependensi modern menggunakan **`uv`** (package manager super cepat).
*   **Frontend (Single Page Application):** 
    *   Antarmuka web interaktif yang dikembangkan secara terpisah di folder `frontend/` untuk melayani kebutuhan HR.
*   **Reverse Proxy & Gateway (Nginx):** 
    *   Menangani perutean (routing) lalu lintas HTTPS pada port `443` secara aman ke Backend (`/api/`) dan Frontend.
    *   Otomatis mengalihkan lalu lintas HTTP (`80`) ke HTTPS (`443`).
*   **Orkestrasi (Docker Compose):**
    *   Mengatur siklus hidup seluruh container (`backend`, `frontend`, dan `nginx`) dalam jaringan bridge internal yang aman.

---

## 📁 Struktur Folder Baru

```text
FP-AI/
├── backend/                  # Layanan backend berbasis FastAPI
│   ├── app/
│   │   ├── ai/               # Logika AI & Pemrosesan Bahasa Alami (NLP)
│   │   ├── api/
│   │   │   └── routes.py     # Endpoint API (FastAPI)
│   │   └── services/
│   │       └── file_parser.py# Parser dokumen (PDF & DOCX) ke teks
│   └── pyproject.toml        # Konfigurasi dependensi backend (uv / Hatchling)
├── frontend/                 # Aplikasi frontend (SPA / React / Vite / Next.js)
├── docker/                   # Konfigurasi Dockerfile multi-stage
│   ├── Dockerfile.backend    # Dockerfile untuk runtime backend (FastAPI)
│   └── Dockerfile.frontend   # Dockerfile untuk runtime frontend
├── nginx/                    # Konfigurasi Web Server / Gateway
│   └── nginx.conf            # Konfigurasi Nginx (HTTPS, Proxy api & ws)
├── docker-compose.yml        # Orkestrasi multi-container Docker
├── guide.md                  # Panduan proyek & pembagian tugas terupdate
├── requirements.txt          # Dependensi Python lokal (legacy / development)
└── README.md                 # Dokumentasi utama proyek
```

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini dijalankan menggunakan **Docker Compose** agar semua layanan dapat berjalan secara otomatis dan terkonfigurasi dengan benar.

### Prasyarat
*   Sudah menginstal [Docker](https://www.docker.com/) dan [Docker Compose](https://docs.docker.com/compose/).
*   Sertifikat SSL (`origin.crt` dan `origin.key`) yang diletakkan di dalam folder `./certs/` untuk mendukung protokol HTTPS pada Nginx.

### Langkah-langkah:

1.  **Clone Repositori:**
    ```bash
    git clone https://github.com/icazz/employee-finder-FP-AI-03.git
    cd employee-finder-FP-AI-03
    ```

2.  **Konfigurasi Environment Variables:**
    Buat file `.env` di root direktori untuk menyimpan konfigurasi API Key dan pengaturan lainnya:
    ```env
    # Contoh isi .env
    ANTHROPIC_API_KEY=your_api_key_here
    ALLOWED_EXTENSIONS=pdf,docx
    MAX_FILE_SIZE_MB=25
    ```

3.  **Setup SSL Certificates (Lokal / Development):**
    Buat folder `certs` di root direktori dan letakkan sertifikat SSL Anda di sana:
    ```bash
    mkdir certs
    # Letakkan origin.crt dan origin.key di dalam folder certs/
    ```

4.  **Jalankan dengan Docker Compose:**
    ```bash
    docker compose up --build
    ```
    *Perintah ini akan membangun image backend & frontend secara otomatis, lalu menjalankan semua container.*

5.  **Akses Aplikasi:**
    Buka peramban (browser) Anda dan akses:
    *   Frontend: [https://localhost](https://localhost)
    *   API Backend (Health check): [https://localhost/api/v1/health](https://localhost/api/v1/health)

---

## 👥 Tim Pengembang & Peran Baru

Dengan perubahan ke arsitektur containerized, pembagian peran disesuaikan menjadi lebih spesifik:

| Anggota | Peran Baru | Deskripsi Tanggung Jawab |
|---|---|---|
| **Anggota 1** | **AI & Backend Engineer** | Pengembangan API FastAPI (`backend/app/`), integrasi LLM/NLP (Anthropic/Sentence-Transformers), logika *similarity matching*, dan *keyword gap analysis*. |
| **Anggota 2** | **Frontend Developer** | Membangun UI/UX dashboard HR di folder `frontend/`, manajemen state, integrasi API, dan visualisasi grafik interaktif. |
| **Anggota 3** | **DevOps & Integration Engineer** | Containerization (Docker), orkestrasi (Docker Compose), konfigurasi gateway (Nginx & SSL/TLS), parsing file (`file_parser.py`), dan E2E Testing. |
