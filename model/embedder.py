from sentence_transformers import SentenceTransformer
import numpy as np

# =============================================
# Model Embedding Loader
# Anggota 1: AI & Backend Engineer
# =============================================

# Model multilingual yang mendukung Bahasa Indonesia & Inggris
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

# Load model sekali saja dan cache menggunakan @st.cache_resource
# Catatan: gunakan dekorator ini saat diintegrasikan ke Streamlit
_model = None

def get_model() -> SentenceTransformer:
    """
    Load dan cache model Sentence-Transformer.
    Hanya load sekali selama runtime untuk efisiensi.

    Returns:
        SentenceTransformer: Model yang sudah di-load.
    """
    global _model
    if _model is None:
        print(f"[INFO] Loading model: {MODEL_NAME}...")
        _model = SentenceTransformer(MODEL_NAME)
        print("[INFO] Model berhasil di-load.")
    return _model


def get_embedding(text: str) -> np.ndarray:
    """
    Mengubah teks menjadi vektor embedding.

    Args:
        text (str): Teks input (CV atau JD).

    Returns:
        np.ndarray: Vektor embedding 1D.
    """
    # TODO (Anggota 1): Implementasikan fungsi ini
    model = get_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding


def get_embeddings_batch(texts: list[str]) -> np.ndarray:
    """
    Mengubah list teks menjadi batch embedding sekaligus (lebih efisien).

    Args:
        texts (list[str]): Daftar teks input.

    Returns:
        np.ndarray: Matrix embedding 2D (N x dimensi_model).
    """
    # TODO (Anggota 1): Implementasikan batch embedding ini
    model = get_model()
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
    return embeddings
