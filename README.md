# Employee Finder

Aplikasi web berbasis Streamlit untuk HR yang dapat **menyaring, mencocokkan, dan merangking CV kandidat** secara otomatis menggunakan AI berbasis *Semantic Similarity* (IndoBERT/Sentence-Transformer).

## 🚀 Cara Menjalankan

```bash
# 1. Clone repo
git clone https://github.com/icazz/employee-finder-FP-AI-03.git
cd employee-finder-FP-AI-03

# 2. Install dependencies
pip install -r requirements.txt

# 3. Jalankan aplikasi
streamlit run app/main.py
```

## 📁 Struktur Folder

```
FP-AI/
├── app/
│   ├── main.py                 # Entry point aplikasi Streamlit
│   ├── pages/
│   │   ├── 1_Input.py          # Halaman input Job Description & upload CV
│   │   └── 2_Result.py         # Halaman hasil ranking & analisis
│   └── components/
│       └── charts.py           # Komponen grafik/visualisasi
├── model/
│   ├── embedder.py             # Load model & buat embedding vektor
│   ├── similarity.py           # Hitung Cosine Similarity score
│   └── keyword_gap.py          # Analisis keyword gap (skill yang kurang)
├── utils/
│   ├── pdf_extractor.py        # Ekstraksi teks dari file PDF
│   ├── exporter.py             # Export hasil analisis ke PDF
│   └── preprocessor.py        # Preprocessing & cleaning teks
├── data/
│   └── templates/              # Template Job Description siap pakai
│       ├── data_analyst.txt
│       ├── frontend_developer.txt
│       └── marketing_executive.txt
├── guide.md                    # Panduan proyek & pembagian tugas
├── TODO.md                     # Daftar task pengerjaan
├── requirements.txt            # Daftar dependency Python
└── README.md
```

## 👥 Tim Pengembang

| Anggota | Peran |
|---|---|
| Anggota 1 | AI & Backend Engineer (Model NLP, Embedding, Keyword Gap) |
| Anggota 2 | Frontend & Streamlit Developer (UI, Visualisasi, Dashboard) |
| Anggota 3 | Integration & Utility Engineer (PDF Extractor, Export, Testing) |
