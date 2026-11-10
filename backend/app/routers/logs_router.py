from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database import get_db
from backend.app.models import PromptLog, StudentNote, SessionSchedule
from backend.app.schemas import PromptLogResponse, StudentNoteCreate, StudentNoteResponse

router = APIRouter(prefix="/api/logs", tags=["Prompt Logs"])

@router.get("", response_model=List[PromptLogResponse])
def get_logs(
    course_id: Optional[int] = Query(1),
    mode: Optional[str] = None,
    session_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PromptLog).filter(PromptLog.course_id == course_id)

    if mode:
        query = query.filter(PromptLog.mode == mode)
    if session_id:
        query = query.filter(PromptLog.session_id == session_id)

    logs = query.order_by(PromptLog.id.desc()).all()

    resps = []
    for log in logs:
        session_title = None
        if log.session_id:
            sess = db.query(SessionSchedule).filter(SessionSchedule.id == log.session_id).first()
            if sess:
                session_title = f"{sess.date} ({sess.day_of_week}) — {sess.title}"

        notes = []
        for n in log.student_notes:
            notes.append(StudentNoteResponse(
                id=n.id,
                prompt_log_id=n.prompt_log_id,
                contributor_name=n.contributor_name or "Student",
                note_text=n.note_text,
                created_at=n.created_at
            ))

        resps.append(PromptLogResponse(
            id=log.id,
            course_id=log.course_id or 1,
            group_id=log.group_id,
            contributor_name=log.contributor_name or "Student",
            mode=log.mode,
            session_id=log.session_id,
            session_title=str(session_title) if session_title else None,
            prompt_text=log.prompt_text,
            ai_response=log.ai_response,
            timestamp=log.timestamp,
            student_notes=notes
        ))

    return resps

@router.get("/{log_id}", response_model=PromptLogResponse)
def get_single_log(
    log_id: int,
    db: Session = Depends(get_db)
):
    log = db.query(PromptLog).filter(PromptLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Prompt log entry not found.")

    session_title = None
    if log.session_id:
        sess = db.query(SessionSchedule).filter(SessionSchedule.id == log.session_id).first()
        if sess:
            session_title = f"{sess.date} ({sess.day_of_week}) — {sess.title}"

    notes = []
    for n in log.student_notes:
        notes.append(StudentNoteResponse(
            id=n.id,
            prompt_log_id=n.prompt_log_id,
            contributor_name=n.contributor_name or "Student",
            note_text=n.note_text,
            created_at=n.created_at
        ))

    return PromptLogResponse(
        id=log.id,
        course_id=log.course_id or 1,
        group_id=log.group_id,
        contributor_name=log.contributor_name or "Student",
        mode=log.mode,
        session_id=log.session_id,
        session_title=str(session_title) if session_title else None,
        prompt_text=log.prompt_text,
        ai_response=log.ai_response,
        timestamp=log.timestamp,
        student_notes=notes
    )

@router.post("/{log_id}/note", response_model=StudentNoteResponse)
def add_or_update_student_note(
    log_id: int,
    req: StudentNoteCreate,
    db: Session = Depends(get_db)
):
    log = db.query(PromptLog).filter(PromptLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Prompt log entry not found.")

    if not req.note_text or not req.note_text.strip():
        raise HTTPException(status_code=400, detail="Student note content cannot be empty.")

    contributor = req.contributor_name.strip() if req.contributor_name and req.contributor_name.strip() else "Student"

    existing_note = db.query(StudentNote).filter(StudentNote.prompt_log_id == log_id).first()
    if existing_note:
        existing_note.note_text = req.note_text.strip()
        existing_note.contributor_name = contributor
        db.commit()
        db.refresh(existing_note)
        note = existing_note
    else:
        note = StudentNote(
            prompt_log_id=log_id,
            contributor_name=contributor,
            note_text=req.note_text.strip()
        )
        db.add(note)
        db.commit()
        db.refresh(note)

    return StudentNoteResponse(
        id=note.id,
        prompt_log_id=note.prompt_log_id,
        contributor_name=note.contributor_name,
        note_text=note.note_text,
        created_at=note.created_at
    )
