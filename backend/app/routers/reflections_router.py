from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database import get_db
from backend.app.models import SessionSchedule, Reflection, PromptLog
from backend.app.schemas import ReflectionGenerateRequest, ReflectionResponse
from backend.app.agent import generate_class_reflection_structured

router = APIRouter(prefix="/api/reflections", tags=["Reflections"])

@router.post("/generate", response_model=ReflectionResponse)
def generate_reflection(req: ReflectionGenerateRequest, db: Session = Depends(get_db)):
    course_id = req.course_id or 1
    sess = db.query(SessionSchedule).filter(
        SessionSchedule.id == req.session_id,
        SessionSchedule.course_id == course_id
    ).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Selected class session not found.")

    if not req.notes or not req.notes.strip():
        raise HTTPException(status_code=400, detail="Lecture notes cannot be empty.")

    course_id = req.course_id or sess.course_id or 1
    contributor = req.contributor_name.strip() if req.contributor_name and req.contributor_name.strip() else "Student"

    # 1. Generate structured reflection with strictly 1 open question for the specific course
    result = generate_class_reflection_structured(req.notes, course_id=course_id)

    # 2. Delete any prior reflection/logs for this session to ensure 1 active reflection per session
    db.query(Reflection).filter(Reflection.session_id == sess.id).delete(synchronize_session=False)

    # 3. Update session notes & status
    sess.notes_content = req.notes
    sess.notes_status = "provided"
    sess.reflection_status = "completed"

    # 4. Create Reflection database record
    reflection = Reflection(
        course_id=course_id,
        session_id=sess.id,
        contributor_name=contributor,
        raw_notes=req.notes,
        structured_reflection=result["structured_markdown"],
        key_points=result["key_points"],
        explanation=result.get("explanation", ""),
        important_concepts=result.get("important_concepts", ""),
        examples_cases=result.get("examples_cases", ""),
        insights=result.get("insights", ""),
        open_question=result["open_question"]
    )
    db.add(reflection)
    db.commit()
    db.refresh(reflection)

    # 5. Delete prior prompt log for this session in 'reflection' mode and create new one
    db.query(PromptLog).filter(PromptLog.session_id == sess.id, PromptLog.mode == "reflection").delete(synchronize_session=False)
    prompt_log = PromptLog(
        course_id=course_id,
        group_id=1,
        contributor_name=contributor,
        mode="reflection",
        session_id=sess.id,
        prompt_text=req.notes,
        ai_response=result["structured_markdown"]
    )
    db.add(prompt_log)
    db.commit()
    db.refresh(prompt_log)

    resp = ReflectionResponse.model_validate(reflection)
    resp.log_id = prompt_log.id
    return resp

@router.get("", response_model=List[ReflectionResponse])
def get_all_reflections(
    course_id: Optional[int] = Query(1),
    db: Session = Depends(get_db)
):
    reflections = db.query(Reflection).filter(Reflection.course_id == course_id).order_by(Reflection.id.desc()).all()
    resps = []
    for r in reflections:
        resp = ReflectionResponse.model_validate(r)
        log = db.query(PromptLog).filter(PromptLog.session_id == r.session_id, PromptLog.mode == "reflection").order_by(PromptLog.id.desc()).first()
        if log:
            resp.log_id = log.id
        resps.append(resp)
    return resps

@router.get("/session/{session_id}", response_model=List[ReflectionResponse])
def get_reflections_for_session(session_id: int, db: Session = Depends(get_db)):
    reflections = db.query(Reflection).filter(Reflection.session_id == session_id).order_by(Reflection.id.desc()).all()
    resps = []
    for r in reflections:
        resp = ReflectionResponse.model_validate(r)
        log = db.query(PromptLog).filter(PromptLog.session_id == r.session_id, PromptLog.mode == "reflection").order_by(PromptLog.id.desc()).first()
        if log:
            resp.log_id = log.id
        resps.append(resp)
    return resps

