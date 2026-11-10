from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.app.database import get_db
from backend.app.models import SessionSchedule, Reflection, PromptLog, User, Fortnight, NewsItem, Group
from backend.app.auth import get_current_instructor

router = APIRouter(prefix="/api/instructor", tags=["Instructor Overview"])

@router.get("/overview")
def get_instructor_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> dict:
    group = db.query(Group).first()
    
    total_sessions = db.query(SessionSchedule).count()
    completed_reflections = db.query(SessionSchedule).filter(SessionSchedule.reflection_status == "completed").count()
    pending_reflections = total_sessions - completed_reflections

    total_logs = db.query(PromptLog).count()
    total_news = db.query(NewsItem).count()

    students = db.query(User).filter(User.role == "student").all()
    student_list = [{"id": s.id, "full_name": s.full_name, "email": s.email} for s in students]

    session_overview = []
    sessions = db.query(SessionSchedule).order_by(SessionSchedule.id.asc()).all()
    for s in sessions:
        ref_count = db.query(Reflection).filter(Reflection.session_id == s.id).count()
        session_overview.append({
            "id": s.id,
            "date": s.date,
            "day": s.day_of_week,
            "duration": s.duration_hours,
            "week": s.week_number,
            "title": s.title,
            "notes_status": s.notes_status,
            "reflection_status": s.reflection_status,
            "reflection_count": ref_count
        })

    return {
        "course_name": "Designing Corporate Startup Synergies",
        "group_name": group.name if group else "Group 1",
        "stats": {
            "total_sessions": total_sessions,
            "completed_reflections": completed_reflections,
            "pending_reflections": pending_reflections,
            "total_prompt_logs": total_logs,
            "total_news_items": total_news,
            "completion_percentage": round((completed_reflections / total_sessions * 100), 1) if total_sessions > 0 else 0
        },
        "group_members": student_list,
        "session_schedule_status": session_overview
    }
