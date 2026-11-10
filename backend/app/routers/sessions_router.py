from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.app.database import get_db
from backend.app.models import SessionSchedule, Reflection, PromptLog, StudentNote
from backend.app.schemas import SessionScheduleResponse, SessionCreate, SessionUpdate, SessionNotesSubmit

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

def calculate_day_and_week(date_str: str):
    """Calculates day of week and week number relative to semester start (Aug 3, 2026)."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        day_name = dt.strftime("%A")
        start_dt = datetime(2026, 8, 3)
        delta_days = (dt - start_dt).days
        week_num = max(1, (delta_days // 7) + 1)
        return day_name, week_num
    except Exception:
        return "Monday", 1

@router.get("", response_model=List[SessionScheduleResponse])
def get_sessions(
    course_id: Optional[int] = Query(1),
    db: Session = Depends(get_db)
):
    # 1. Fetch chronological ascending list for the specific course to assign course-specific session numbers (Session 1, 2, ... N)
    asc_sessions = db.query(SessionSchedule).filter(SessionSchedule.course_id == course_id).order_by(SessionSchedule.date.asc(), SessionSchedule.id.asc()).all()
    session_num_map = {s.id: idx for idx, s in enumerate(asc_sessions, start=1)}

    # 2. Fetch descending list (Newest First) for display
    desc_sessions = db.query(SessionSchedule).filter(SessionSchedule.course_id == course_id).order_by(SessionSchedule.date.desc(), SessionSchedule.id.desc()).all()

    resps = []
    for s in desc_sessions:
        item = SessionScheduleResponse.model_validate(s)
        item.display_session_number = session_num_map.get(s.id, 1)
        resps.append(item)
    return resps

@router.get("/{session_id}", response_model=SessionScheduleResponse)
def get_session_by_id(
    session_id: int,
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(SessionSchedule).filter(SessionSchedule.id == session_id)
    if course_id:
        query = query.filter(SessionSchedule.course_id == course_id)
    sess = query.first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")

    asc_sessions = db.query(SessionSchedule).filter(SessionSchedule.course_id == sess.course_id).order_by(SessionSchedule.date.asc(), SessionSchedule.id.asc()).all()
    display_num = 1
    for idx, s in enumerate(asc_sessions, start=1):
        if s.id == sess.id:
            display_num = idx
            break

    item = SessionScheduleResponse.model_validate(sess)
    item.display_session_number = display_num
    return item

@router.post("", response_model=SessionScheduleResponse)
def create_session(req: SessionCreate, db: Session = Depends(get_db)):
    if not req.date or not req.date.strip():
        raise HTTPException(status_code=400, detail="Session date is required.")
    if not req.title or not req.title.strip():
        raise HTTPException(status_code=400, detail="Session title/topic is required.")

    course_id = req.course_id or 1
    date_str = req.date.strip()
    day_name, week_num = calculate_day_and_week(date_str)
    duration = req.duration_hours if req.duration_hours and req.duration_hours > 0 else 1.0
    has_notes = bool(req.notes_content and req.notes_content.strip())

    sess = SessionSchedule(
        course_id=course_id,
        group_id=1,
        date=date_str,
        day_of_week=day_name,
        duration_hours=duration,
        week_number=week_num,
        title=req.title.strip(),
        notes_content=req.notes_content.strip() if has_notes else "",
        notes_status="provided" if has_notes else "pending",
        reflection_status="pending"
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)

    asc_sessions = db.query(SessionSchedule).filter(SessionSchedule.course_id == course_id).order_by(SessionSchedule.date.asc(), SessionSchedule.id.asc()).all()
    display_num = 1
    for idx, s in enumerate(asc_sessions, start=1):
        if s.id == sess.id:
            display_num = idx
            break

    item = SessionScheduleResponse.model_validate(sess)
    item.display_session_number = display_num
    return item

@router.put("/{session_id}", response_model=SessionScheduleResponse)
def update_session(session_id: int, req: SessionUpdate, db: Session = Depends(get_db)):
    sess = db.query(SessionSchedule).filter(SessionSchedule.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")

    if req.date and req.date.strip():
        date_str = req.date.strip()
        day_name, week_num = calculate_day_and_week(date_str)
        sess.date = date_str
        sess.day_of_week = day_name
        sess.week_number = week_num

    if req.duration_hours and req.duration_hours > 0:
        sess.duration_hours = req.duration_hours

    if req.title and req.title.strip():
        sess.title = req.title.strip()

    if req.notes_content is not None:
        sess.notes_content = req.notes_content.strip()
        sess.notes_status = "provided" if req.notes_content.strip() else "pending"

    db.commit()
    db.refresh(sess)

    asc_sessions = db.query(SessionSchedule).filter(SessionSchedule.course_id == sess.course_id).order_by(SessionSchedule.date.asc(), SessionSchedule.id.asc()).all()
    display_num = 1
    for idx, s in enumerate(asc_sessions, start=1):
        if s.id == sess.id:
            display_num = idx
            break

    item = SessionScheduleResponse.model_validate(sess)
    item.display_session_number = display_num
    return item

@router.delete("/{session_id}")
def delete_session(
    session_id: int,
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(SessionSchedule).filter(SessionSchedule.id == session_id)
    if course_id:
        query = query.filter(SessionSchedule.course_id == course_id)
    sess = query.first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")

    db.query(Reflection).filter(Reflection.session_id == session_id).delete(synchronize_session=False)

    logs = db.query(PromptLog).filter(PromptLog.session_id == session_id).all()
    for log in logs:
        db.query(StudentNote).filter(StudentNote.prompt_log_id == log.id).delete(synchronize_session=False)
        db.delete(log)

    db.delete(sess)
    db.commit()

    return {"status": "deleted", "id": session_id}
