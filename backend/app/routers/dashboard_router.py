from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from backend.app.database import get_db
from backend.app.models import SessionSchedule, Reflection, PromptLog, Fortnight, NewsItem, Group, Course
from backend.app.schemas import DashboardOverviewResponse

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Overview"])

@router.get("", response_model=DashboardOverviewResponse)
def get_dashboard_stats(
    course_id: Optional[int] = Query(1),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        course = db.query(Course).filter(Course.id == 1).first()

    group = db.query(Group).first()

    total_sessions = db.query(SessionSchedule).filter(SessionSchedule.course_id == course_id).count()
    completed_reflections = db.query(SessionSchedule).filter(
        SessionSchedule.course_id == course_id,
        SessionSchedule.reflection_status == "completed"
    ).count()
    pending_reflections = total_sessions - completed_reflections

    total_logs = db.query(PromptLog).filter(PromptLog.course_id == course_id).count()
    total_fortnights = db.query(Fortnight).filter(Fortnight.course_id == course_id).count()
    total_news = db.query(NewsItem).filter(NewsItem.course_id == course_id).count()

    completion_percentage = round((completed_reflections / total_sessions * 100), 1) if total_sessions > 0 else 0.0

    return DashboardOverviewResponse(
        course_id=course.id,
        course_code=course.code,
        course_name=course.name,
        group_name=group.name if group else "Continuous Assessment Group",
        total_sessions=total_sessions,
        completed_reflections=completed_reflections,
        pending_reflections=pending_reflections,
        total_logs=total_logs,
        total_fortnights=total_fortnights,
        total_news_items=total_news,
        completion_percentage=completion_percentage
    )

@router.get("/overview")
def get_overview_matrix(
    course_id: Optional[int] = Query(1),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        course = db.query(Course).filter(Course.id == 1).first()

    group = db.query(Group).first()

    total_sessions = db.query(SessionSchedule).filter(SessionSchedule.course_id == course_id).count()
    completed_reflections = db.query(SessionSchedule).filter(
        SessionSchedule.course_id == course_id,
        SessionSchedule.reflection_status == "completed"
    ).count()
    pending_reflections = total_sessions - completed_reflections

    total_logs = db.query(PromptLog).filter(PromptLog.course_id == course_id).count()
    total_news = db.query(NewsItem).filter(NewsItem.course_id == course_id).count()

    # Ascending for display numbers
    asc_sessions = db.query(SessionSchedule).filter(SessionSchedule.course_id == course_id).order_by(SessionSchedule.date.asc(), SessionSchedule.id.asc()).all()
    session_num_map = {s.id: idx for idx, s in enumerate(asc_sessions, start=1)}

    # Descending for display
    desc_sessions = db.query(SessionSchedule).filter(SessionSchedule.course_id == course_id).order_by(SessionSchedule.date.desc(), SessionSchedule.id.desc()).all()

    session_overview = []
    for s in desc_sessions:
        ref_count = db.query(Reflection).filter(Reflection.session_id == s.id).count()
        session_overview.append({
            "id": s.id,
            "display_session_number": session_num_map.get(s.id, 1),
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
        "course_id": course.id,
        "course_code": course.code,
        "course_name": course.name,
        "group_name": group.name if group else "Group 1",
        "stats": {
            "total_sessions": total_sessions,
            "completed_reflections": completed_reflections,
            "pending_reflections": pending_reflections,
            "total_prompt_logs": total_logs,
            "total_news_items": total_news,
            "completion_percentage": round((completed_reflections / total_sessions * 100), 1) if total_sessions > 0 else 0
        },
        "session_schedule_status": session_overview
    }
