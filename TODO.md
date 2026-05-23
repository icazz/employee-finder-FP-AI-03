# ✅ TODO — Employee Finder

Daftar task pengerjaan proyek selama 4 minggu. Update status saat mengerjakan.

> **Legenda Status:**
> - `[ ]` = Belum dikerjakan
> - `[/]` = Sedang dikerjakan
> - `[x]` = Selesai

---

## 🗓️ Minggu 1: Setup & Fondasi

### 🔧 Setup Umum (Semua Anggota)
- [ ] Clone repository dan setup environment Python lokal
- [ ] Install semua dependency dari `requirements.txt`
- [ ] Sepakati format output antar fungsi (dokumentasi singkat di grup)
- [ ] Buat branch masing-masing (`feat/ai-model`, `feat/ui`, `feat/integration`)

### 🧑‍💻 Anggota 1 (AI & Backend)
- [ ] Riset dan pilih model embedding terbaik (IndoBERT vs `paraphrase-multilingual-MiniLM-L12-v2`)
- [ ] Test load model di `model/embedder.py` dan pastikan tidak ada error
- [ ] Tulis fungsi `get_embedding(text)` yang mengembalikan numpy array

### 🧑‍💻 Anggota 2 (Frontend & Streamlit)
- [ ] Desain layout dan tema warna aplikasi di `app/main.py`
- [ ] Buat komponen sidebar navigasi antar halaman
- [ ] Setup halaman `1_Input.py` dengan textarea Job Description

### 🧑‍💻 Anggota 3 (Integration & Utility)
- [ ] Implementasikan `extract_text_from_pdf()` di `utils/pdf_extractor.py`
- [ ] Test ekstraksi PDF dengan 2-3 file CV berbeda
- [ ] Implementasikan `clean_text()` di `utils/preprocessor.py`

---

## 🗓️ Minggu 2: Fitur Inti (Core Feature)

### 🧑‍💻 Anggota 1 (AI & Backend)
- [ ] Implementasikan `calculate_similarity()` di `model/similarity.py`
- [ ] Implementasikan `rank_candidates()` yang mengembalikan list terurut
- [ ] Test similarity dengan pasangan CV dan JD dummy (cek apakah skor masuk akal)
- [ ] Dokumentasikan format input/output fungsi AI untuk Anggota 3

### 🧑‍💻 Anggota 2 (Frontend & Streamlit)
- [ ] Tambahkan komponen upload multi-file PDF di `1_Input.py`
- [ ] Tampilkan teks hasil ekstraksi PDF di textarea yang bisa diedit
- [ ] Tambahkan validasi form (JD kosong, tidak ada file, dsb.)

### 🧑‍💻 Anggota 3 (Integration & Utility)
- [ ] Hubungkan `pdf_extractor.py` dengan halaman input di Streamlit
- [ ] Sambungkan model similarity (Anggota 1) ke alur data di Streamlit
- [ ] Simpan hasil analisis ke `st.session_state` agar bisa diakses halaman Result

---

## 🗓️ Minggu 3: Fitur Lanjutan (Advanced Feature)

### 🧑‍💻 Anggota 1 (AI & Backend)
- [ ] Implementasikan `extract_keywords()` di `model/keyword_gap.py`
- [ ] Implementasikan `analyze_keyword_gap()` yang mengembalikan dict `{found, missing}`
- [ ] Test akurasi keyword gap dengan beberapa pasang CV dan JD nyata

### 🧑‍💻 Anggota 2 (Frontend & Streamlit)
- [ ] Buat tabel ranking interaktif di `2_Result.py` menggunakan `st.dataframe`
- [ ] Implementasikan bar chart skor kandidat di `charts.py` menggunakan Plotly
- [ ] Tambahkan tampilan detail keyword gap (skill ✅ vs skill ❌) per kandidat
- [ ] Tambahkan filter kandidat berdasarkan ambang batas skor (`st.slider`)

### 🧑‍💻 Anggota 3 (Integration & Utility)
- [ ] Implementasikan `generate_pdf_report()` di `utils/exporter.py`
- [ ] Test download laporan PDF dan pastikan isi laporan benar
- [ ] Tambahkan fitur dropdown template JD di halaman input

---

## 🗓️ Minggu 4: Polish, Testing & Presentasi

### 🔧 Semua Anggota (Kolaborasi)
- [ ] Merge semua branch ke `main` dan selesaikan konflik
- [ ] Lakukan end-to-end testing dengan data nyata (minimal 5 CV + 1 JD)
- [ ] Perbaiki bug yang ditemukan saat testing
- [ ] Pastikan aplikasi bisa dijalankan dari nol dengan `pip install -r requirements.txt`

### 🧑‍💻 Anggota 2 (Frontend & Streamlit)
- [ ] Polish UI: loading spinner saat proses AI, pesan error yang informatif
- [ ] Cek tampilan di layar kecil (laptop) agar tidak terpotong

### 🧑‍💻 Anggota 3 (Integration & Utility)
- [ ] Update `README.md` dengan cara install dan jalankan aplikasi
- [ ] Siapkan slide/demo untuk presentasi
- [ ] Buat video demo singkat (jika diperlukan)

---

## 📊 Progress Summary

| Minggu | Anggota 1 | Anggota 2 | Anggota 3 |
|---|---|---|---|
| Minggu 1 | `[ ]` | `[ ]` | `[ ]` |
| Minggu 2 | `[ ]` | `[ ]` | `[ ]` |
| Minggu 3 | `[ ]` | `[ ]` | `[ ]` |
| Minggu 4 | `[ ]` | `[ ]` | `[ ]` |

> Update tabel di atas setiap akhir minggu dengan `[ ]`, `[/]`, atau `[x]`.
