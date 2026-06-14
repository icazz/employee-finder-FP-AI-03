"""
interview.py — AI Interview Question Generator & Evaluator using Ollama
"""

import json
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = settings.ollama_base_url
OLLAMA_MODEL = "qwen2.5:7b"

_QUESTION_GENERATE_PROMPT = """Kamu adalah HR interviewer profesional.
Generate pertanyaan interview berdasarkan topik dan requirements berikut.

Topik/Context:
{topic}

Requirements:
- Generate tepat {num_questions} pertanyaan
- Campuran pilihan ganda dan essay
- Pilihan ganda harus punya 4 opsi (A, B, C, D) dengan satu jawaban benar
- Pertanyaan dalam Bahasa Indonesia
- Pertanyaan profesional dan relevan dengan topik
- Tingkat kesulitan: {difficulty}

Return HANYA valid JSON object dengan format berikut:
{{
  "questions": [
    {{
      "id": 1,
      "type": "multiple_choice" | "essay",
      "question": "Pertanyaan dalam Bahasa Indonesia",
      "options": ["A. Opsi 1", "B. Opsi 2", "C. Opsi 3", "D. Opsi 4"],
      "correct_answer": "A",
      "points": 10
    }}
  ]
}}

Note: Untuk essay, set "options" ke array kosong [] dan "correct_answer" ke string kosong "".
"""

_ESSAY_EVALUATE_PROMPT = """Kamu adalah HR interviewer profesional yang menilai jawaban essay kandidat.

Topik/Job Context:
{topic}

Pertanyaan:
{question}

Jawaban Kandidat:
{answer}

Evaluasi jawaban kandidat berdasarkan:
1. Relevansi dengan pertanyaan dan topik
2. Kedalaman pemahaman
3. Kejelasan ekspresi
4. Aplikasi praktis

Return HANYA valid JSON object dengan format berikut:
{{
  "score": 0-100,
  "feedback": "Feedback singkat dalam Bahasa Indonesia (2-3 kalimat)",
  "strengths": "Kelebihan jawaban (atau string kosong)",
  "weaknesses": "Kekurangan jawaban (atau string kosong)",
  "is_relevant": true/false
}}
"""


def _call_ollama(prompt: str, timeout: float = 120.0) -> str:
    url = f"{OLLAMA_BASE_URL}/api/generate"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": 4096,
        }
    }

    with httpx.Client(timeout=timeout) as client:
        response = client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()


def _extract_json(text: str) -> dict:
    import re
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        return json.loads(match.group(0))
    return json.loads(text)


def generate_interview_questions(
    topic: str,
    num_questions: int = 10,
    difficulty: str = "medium"
) -> list[dict]:
    prompt = _QUESTION_GENERATE_PROMPT.format(
        topic=topic[:2000].strip(),
        num_questions=num_questions,
        difficulty=difficulty
    )

    try:
        raw_text = _call_ollama(prompt, timeout=120.0)
        data = _extract_json(raw_text)
        questions = data.get("questions", [])

        if len(questions) < num_questions:
            logger.warning(f"Generated {len(questions)} questions, expected {num_questions}")

        return questions[:num_questions]

    except Exception as exc:
        logger.warning("Ollama question generation failed: %s. Using fallback.", exc)
        return _fallback_questions(topic, num_questions)


def evaluate_essay_answer(
    topic: str,
    question: str,
    answer: str
) -> dict:
    prompt = _ESSAY_EVALUATE_PROMPT.format(
        topic=topic[:1000].strip(),
        question=question[:500].strip(),
        answer=answer[:2000].strip()
    )

    try:
        raw_text = _call_ollama(prompt, timeout=60.0)
        data = _extract_json(raw_text)

        return {
            "score": min(100, max(0, int(data.get("score", 50)))),
            "feedback": data.get("feedback", ""),
            "strengths": data.get("strengths", ""),
            "weaknesses": data.get("weaknesses", ""),
            "is_relevant": data.get("is_relevant", True)
        }

    except Exception as exc:
        logger.warning("Ollama essay evaluation failed: %s. Using fallback.", exc)
        return _fallback_essay_evaluation(answer)


def _fallback_essay_evaluation(answer: str) -> dict:
    word_count = len(answer.split())

    if word_count < 10:
        score = 20
        feedback = "Jawaban terlalu singkat dan kurang mendalam."
    elif word_count < 30:
        score = 50
        feedback = "Jawaban cukup relevan namun bisa lebih mendalam."
    elif word_count < 60:
        score = 70
        feedback = "Jawaban cukup baik dan menunjukkan pemahaman yang memadai."
    else:
        score = 80
        feedback = "Jawaban komprehensif dan menunjukkan pemahaman yang baik."

    return {
        "score": score,
        "feedback": feedback,
        "strengths": "Menunjukkan usaha untuk menjawab",
        "weaknesses": "Evaluasi AI tidak tersedia, penilaian manual disarankan",
        "is_relevant": True
    }


def _fallback_questions(topic: str, num_questions: int) -> list[dict]:
    questions = []

    mc_questions = [
        {
            "id": 1,
            "type": "multiple_choice",
            "question": f"Manakah yang paling terkait dengan topik '{topic}'?",
            "options": ["A. Konsep dasar", "B. Penerapan praktis", "C. Teori lanjutan", "D. Semua benar"],
            "correct_answer": "D",
            "points": 10
        },
        {
            "id": 2,
            "type": "multiple_choice",
            "question": f"Apa langkah pertama dalam pendekatan '{topic}'?",
            "options": ["A. Perencanaan", "B. Eksekusi", "C. Evaluasi", "D. Dokumentasi"],
            "correct_answer": "A",
            "points": 10
        },
    ]

    essay_questions = [
        {
            "id": 3,
            "type": "essay",
            "question": f"Jelaskan pemahaman Anda tentang '{topic}' dan bagaimana Anda akan menerapkannya dalam pekerjaan.",
            "options": [],
            "correct_answer": "",
            "points": 20
        },
        {
            "id": 4,
            "type": "essay",
            "question": f"Berikan contoh pengalaman Anda yang relevan dengan '{topic}'.",
            "options": [],
            "correct_answer": "",
            "points": 20
        },
    ]

    questions = mc_questions + essay_questions

    while len(questions) < num_questions:
        idx = len(questions) + 1
        questions.append({
            "id": idx,
            "type": "essay",
            "question": f"Pertanyaan tambahan #{idx} tentang '{topic}': Jelaskan pendapat Anda.",
            "options": [],
            "correct_answer": "",
            "points": 15
        })

    return questions[:num_questions]
