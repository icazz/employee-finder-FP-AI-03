import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

# =============================================
# Komponen Visualisasi Grafik
# Anggota 2: Frontend & Streamlit Developer
# =============================================

def render_score_bar_chart(results: list[dict]):
    """
    Menampilkan bar chart skor kecocokan tiap kandidat.

    Args:
        results (list[dict]): List hasil analisis.
            Format: [{"Nama CV": str, "Skor Kecocokan (%)": float}, ...]
    """
    # TODO (Anggota 2): Implementasikan chart ini
    df = pd.DataFrame(results)
    fig = px.bar(
        df,
        x="Nama CV",
        y="Skor Kecocokan (%)",
        color="Skor Kecocokan (%)",
        color_continuous_scale="Teal",
        title="📊 Perbandingan Skor Kecocokan Kandidat",
        text="Skor Kecocokan (%)",
        range_y=[0, 100]
    )
    fig.update_traces(texttemplate='%{text:.1f}%', textposition='outside')
    fig.update_layout(coloraxis_showscale=False, xaxis_title="Kandidat", yaxis_title="Skor (%)")
    return fig


def render_score_gauge(score: float, candidate_name: str):
    """
    Menampilkan gauge/speedometer untuk skor satu kandidat.

    Args:
        score (float): Skor kecocokan (0–100).
        candidate_name (str): Nama kandidat.
    """
    # TODO (Anggota 2): Implementasikan gauge ini
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=score,
        title={"text": f"Skor: {candidate_name}"},
        gauge={
            "axis": {"range": [0, 100]},
            "bar": {"color": "#10B981"},
            "steps": [
                {"range": [0, 50], "color": "#FEE2E2"},
                {"range": [50, 75], "color": "#FEF3C7"},
                {"range": [75, 100], "color": "#D1FAE5"},
            ],
        }
    ))
    return fig
