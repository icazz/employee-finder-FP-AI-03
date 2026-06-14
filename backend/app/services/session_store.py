import secrets
from datetime import datetime
from typing import Optional


class InterviewSession:
    def __init__(self, session_id: str, name: str, password: str, email: str = ""):
        self.session_id = session_id
        self.name = name
        self.email = email
        self.password = password
        self.created_at = datetime.now()
        self.active = True
        self.joined = False
        self.joined_at: Optional[datetime] = None
        self.questions: list[dict] = []
        self.answers: dict[int, str] = {}
        self.essay_evaluations: dict[int, dict] = {}
        self.submitted = False
        self.submitted_at: Optional[datetime] = None
        self.topic: str = ""
        self.mc_score: Optional[float] = None
        self.essay_score: Optional[float] = None
        self.final_score: Optional[float] = None

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat(),
            "active": self.active,
            "joined": self.joined,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
            "has_questions": len(self.questions) > 0,
            "question_count": len(self.questions),
            "submitted": self.submitted,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "topic": self.topic,
            "mc_score": self.mc_score,
            "essay_score": self.essay_score,
            "final_score": self.final_score,
        }


_sessions: dict[str, InterviewSession] = {}


def generate_session_id() -> str:
    return secrets.token_urlsafe(12)


def create_session(name: str, password: str, email: str = "", session_id: str = None) -> InterviewSession:
    sid = session_id or generate_session_id()
    session = InterviewSession(sid, name, password, email)
    _sessions[sid] = session
    return session


def get_session(session_id: str) -> Optional[InterviewSession]:
    return _sessions.get(session_id)


def validate_session(session_id: str, password: str) -> Optional[InterviewSession]:
    session = _sessions.get(session_id)
    if not session:
        return None
    if not session.active:
        return None
    if session.password != password:
        return None
    return session


def join_session(session_id: str) -> bool:
    session = _sessions.get(session_id)
    if not session or not session.active:
        return False
    session.joined = True
    session.joined_at = datetime.now()
    return True


def end_session(session_id: str) -> bool:
    session = _sessions.get(session_id)
    if not session:
        return False
    session.active = False
    return session.active


def delete_session(session_id: str) -> bool:
    if session_id in _sessions:
        del _sessions[session_id]
        return True
    return False


def get_all_sessions() -> list[dict]:
    return [s.to_dict() for s in _sessions.values()]


def set_session_questions(session_id: str, questions: list[dict], topic: str) -> bool:
    session = _sessions.get(session_id)
    if not session:
        return False
    session.questions = questions
    session.topic = topic
    return True


def get_session_questions(session_id: str) -> Optional[list[dict]]:
    session = _sessions.get(session_id)
    if not session:
        return None
    return session.questions


def submit_answers(session_id: str, answers: dict[int, str]) -> bool:
    session = _sessions.get(session_id)
    if not session or not session.active:
        return False
    if session.submitted:
        return False
    session.answers = answers
    session.submitted = True
    session.submitted_at = datetime.now()
    return True


def get_session_answers(session_id: str) -> Optional[dict]:
    session = _sessions.get(session_id)
    if not session:
        return None
    return {"answers": session.answers, "questions": session.questions}


def calculate_score(session_id: str) -> Optional[dict]:
    session = _sessions.get(session_id)
    if not session or not session.submitted:
        return None
    
    mc_total_points = 0
    mc_earned_points = 0
    essay_total_points = 0
    essay_earned_points = 0
    
    for q in session.questions:
        q_id = q.get("id")
        q_points = q.get("points", 10)
        q_type = q.get("type", "essay")
        correct_answer = q.get("correct_answer", "")
        
        if q_type == "multiple_choice":
            mc_total_points += q_points
            candidate_answer = session.answers.get(q_id, "")
            if candidate_answer.upper() == correct_answer.upper():
                mc_earned_points += q_points
        elif q_type == "essay":
            essay_total_points += q_points
            evaluation = session.essay_evaluations.get(q_id, {})
            essay_score_pct = evaluation.get("score", 0) / 100.0
            essay_earned_points += q_points * essay_score_pct
    
    if mc_total_points > 0:
        session.mc_score = round((mc_earned_points / mc_total_points) * 100, 2)
    else:
        session.mc_score = None
    
    if essay_total_points > 0:
        session.essay_score = round((essay_earned_points / essay_total_points) * 100, 2)
    else:
        session.essay_score = None
    
    total_points = mc_total_points + essay_total_points
    total_earned = mc_earned_points + essay_earned_points
    
    if total_points > 0:
        session.final_score = round((total_earned / total_points) * 100, 2)
    else:
        session.final_score = 0.0
    
    return {
        "mc_score": session.mc_score,
        "essay_score": session.essay_score,
        "final_score": session.final_score
    }


def cleanup_inactive_sessions():
    to_delete = [sid for sid, s in _sessions.items() if not s.active]
    for sid in to_delete:
        del _sessions[sid]
    return len(to_delete)


def evaluate_essays(session_id: str) -> bool:
    from app.ai.interview import evaluate_essay_answer
    
    session = _sessions.get(session_id)
    if not session or not session.submitted:
        return False
    
    for q in session.questions:
        if q.get("type") == "essay":
            q_id = q.get("id")
            answer = session.answers.get(q_id, "")
            if answer:
                evaluation = evaluate_essay_answer(
                    topic=session.topic,
                    question=q.get("question", ""),
                    answer=answer
                )
                session.essay_evaluations[q_id] = evaluation
    
    return True


def get_session_full_results(session_id: str) -> Optional[dict]:
    session = _sessions.get(session_id)
    if not session:
        return None
    
    results = []
    for q in session.questions:
        q_id = q.get("id")
        q_type = q.get("type", "essay")
        answer = session.answers.get(q_id, "")
        
        result = {
            "id": q_id,
            "type": q_type,
            "question": q.get("question", ""),
            "answer": answer,
            "points": q.get("points", 0),
        }
        
        if q_type == "multiple_choice":
            result["correct_answer"] = q.get("correct_answer", "")
            result["is_correct"] = answer.upper() == q.get("correct_answer", "").upper()
        elif q_type == "essay":
            evaluation = session.essay_evaluations.get(q_id, {})
            result["evaluation"] = evaluation
        
        results.append(result)
    
    return {
        "session_id": session.session_id,
        "name": session.name,
        "email": session.email,
        "topic": session.topic,
        "submitted_at": session.submitted_at.isoformat() if session.submitted_at else None,
        "mc_score": session.mc_score,
        "essay_score": session.essay_score,
        "final_score": session.final_score,
        "results": results
    }
