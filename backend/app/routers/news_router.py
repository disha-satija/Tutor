from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.app.database import get_db
from backend.app.models import Fortnight, NewsItem, PromptLog, StudentNote
from backend.app.schemas import (
    FortnightResponse, FortnightCreate,
    NewsItemResponse, NewsItemCreate, NewsItemUpdate,
    NewsAnalyzeRequest, NewsSearchRequest
)
from backend.app.news_retriever import analyze_user_submitted_news, search_live_news

router = APIRouter(prefix="/api/news", tags=["Fortnightly News"])

def get_news_item_response(item: NewsItem, db: Session) -> NewsItemResponse:
    log_id = item.log_id
    if not log_id:
        log = db.query(PromptLog).filter(PromptLog.news_item_id == item.id).first()
        if log:
            log_id = log.id
    
    student_note_text = ""
    if log_id:
        sn = db.query(StudentNote).filter(StudentNote.prompt_log_id == log_id).first()
        if sn:
            student_note_text = sn.note_text

    resp = NewsItemResponse(
        id=item.id,
        course_id=item.course_id or 1,
        fortnight_id=item.fortnight_id,
        log_id=log_id,
        title=item.title,
        date=item.date,
        corporate=item.corporate,
        startup=item.startup,
        collaboration_type=item.collaboration_type,
        source=item.source,
        source_url=item.source_url,
        article_text=item.article_text or "",
        what_happened=item.what_happened,
        summary=item.summary,
        why_it_matters_corporate=item.why_it_matters_corporate,
        why_it_matters_startup=item.why_it_matters_startup,
        why_it_matters_overall=item.why_it_matters_overall,
        relevant_course_concept=item.relevant_course_concept,
        verification_status=item.verification_status or "verified",
        contributor_name=item.contributor_name or "Student",
        student_note=student_note_text,
        created_at=item.created_at or datetime.utcnow()
    )
    return resp

@router.get("/fortnights", response_model=List[FortnightResponse])
def get_fortnights(
    course_id: Optional[int] = Query(1),
    db: Session = Depends(get_db)
):
    if course_id != 1:
        # Fortnightly News is ONLY for Course 1
        return []
    
    fortnights = db.query(Fortnight).filter(Fortnight.course_id == course_id).order_by(Fortnight.fortnight_number.asc()).all()
    resps = []
    for f in fortnights:
        items = [get_news_item_response(n, db) for n in f.news_items]
        resps.append(FortnightResponse(
            id=f.id,
            course_id=f.course_id or 1,
            fortnight_number=f.fortnight_number,
            title=f.title,
            start_date=f.start_date,
            end_date=f.end_date,
            summary=f.summary,
            news_items=items
        ))
    return resps

@router.get("", response_model=List[NewsItemResponse])
def get_all_news(
    course_id: Optional[int] = Query(1),
    db: Session = Depends(get_db)
):
    if course_id != 1:
        return []
    items = db.query(NewsItem).filter(NewsItem.course_id == course_id).order_by(NewsItem.id.desc()).all()
    return [get_news_item_response(item, db) for item in items]

@router.post("/fortnights", response_model=FortnightResponse)
def create_fortnight(
    req: FortnightCreate,
    db: Session = Depends(get_db)
):
    course_id = req.course_id or 1
    if course_id != 1:
        raise HTTPException(status_code=400, detail="Fortnightly News is only available for Course 1.")
    
    existing = db.query(Fortnight).filter(Fortnight.course_id == course_id).all()
    next_num = len(existing) + 1
    
    fortnight = Fortnight(
        course_id=course_id,
        group_id=1,
        fortnight_number=next_num,
        title=req.title.strip(),
        start_date=req.start_date.strip(),
        end_date=req.end_date.strip(),
        summary=req.summary.strip() if req.summary else f"Fortnight {next_num} tracking corporate-startup collaborations."
    )
    db.add(fortnight)
    db.commit()
    db.refresh(fortnight)
    
    return FortnightResponse(
        id=fortnight.id,
        course_id=fortnight.course_id,
        fortnight_number=fortnight.fortnight_number,
        title=fortnight.title,
        start_date=fortnight.start_date,
        end_date=fortnight.end_date,
        summary=fortnight.summary,
        news_items=[]
    )

@router.delete("/fortnights/{fortnight_id}")
def delete_fortnight(
    fortnight_id: int,
    course_id: Optional[int] = Query(1),
    db: Session = Depends(get_db)
):
    fortnight = db.query(Fortnight).filter(Fortnight.id == fortnight_id).first()
    if not fortnight:
        raise HTTPException(status_code=404, detail="Fortnight period not found.")
    
    # Delete associated news logs & notes
    for item in fortnight.news_items:
        logs = db.query(PromptLog).filter(PromptLog.news_item_id == item.id).all()
        for log in logs:
            db.delete(log)
    
    db.delete(fortnight)
    db.commit()
    return {"status": "success", "message": f"Fortnight {fortnight_id} deleted successfully."}

@router.post("/analyze", response_model=NewsItemResponse)
def analyze_news_update(
    req: NewsAnalyzeRequest,
    db: Session = Depends(get_db)
):
    course_id = req.course_id or 1
    if course_id != 1:
        raise HTTPException(status_code=400, detail="Fortnightly News is only available for Course 1.")
    
    fortnight = db.query(Fortnight).filter(Fortnight.id == req.fortnight_id).first()
    if not fortnight:
        raise HTTPException(status_code=404, detail="Selected fortnight period not found.")

    contributor = req.contributor_name.strip() if req.contributor_name and req.contributor_name.strip() else "Student"

    # Analyze via Gemini AI
    analysis_input = {
        "title": req.title or "",
        "source": req.source or "",
        "source_url": req.source_url or "",
        "date": req.date or "",
        "corporate": req.corporate or "",
        "startup": req.startup or "",
        "article_text": req.article_text or ""
    }

    structured = analyze_user_submitted_news(analysis_input)

    # Construct formatted AI response text for prompt log
    ai_response_text = f"""### Fortnightly News Analysis

**NEWS SUMMARY**
- **What Happened**: {structured.get('what_happened')}
- **Companies Involved**: {structured.get('corporate')} (Corporate) & {structured.get('startup')} (Startup)

**COLLABORATION TYPE**
- {structured.get('collaboration_type')}

**WHY IT MATTERS FOR CORPORATE-STARTUP COLLABORATION**
- **Relevance**: {structured.get('why_it_matters_overall')}
- **Corporate Gains**: {structured.get('why_it_matters_corporate')}
- **Startup Gains**: {structured.get('why_it_matters_startup')}
- **Course Concept**: {structured.get('relevant_course_concept')}
"""

    prompt_summary = f"Fortnightly News Submission: Headline='{req.title or structured.get('title')}', Source='{req.source or structured.get('source')}', URL='{req.source_url}'\n\nContent:\n{req.article_text or 'No raw text provided.'}"

    # Create PromptLog record
    prompt_log = PromptLog(
        course_id=course_id,
        group_id=1,
        contributor_name=contributor,
        mode="news",
        fortnight_id=fortnight.id,
        prompt_text=prompt_summary,
        ai_response=ai_response_text
    )
    db.add(prompt_log)
    db.commit()
    db.refresh(prompt_log)

    # Create NewsItem record
    item = NewsItem(
        course_id=course_id,
        fortnight_id=fortnight.id,
        group_id=1,
        log_id=prompt_log.id,
        title=structured.get("title") or req.title or "Corporate-Startup News Update",
        date=structured.get("date") or req.date or "2026-09-09",
        corporate=structured.get("corporate") or req.corporate or "Corporate Partner",
        startup=structured.get("startup") or req.startup or "Startup Innovator",
        collaboration_type=structured.get("collaboration_type") or "Strategic Partnership",
        source=structured.get("source") or req.source or "News Source",
        source_url=req.source_url if req.source_url else structured.get("source_url", "#"),
        article_text=req.article_text or "",
        what_happened=structured.get("what_happened") or "News summary.",
        summary=structured.get("summary") or "Executive summary.",
        why_it_matters_corporate=structured.get("why_it_matters_corporate") or "Corporate gains market innovation.",
        why_it_matters_startup=structured.get("why_it_matters_startup") or "Startup gains validation and scale.",
        why_it_matters_overall=structured.get("why_it_matters_overall") or "Demonstrates strategic synergy.",
        relevant_course_concept=structured.get("relevant_course_concept") or "Corporate-Startup Strategic Fit",
        verification_status="verified",
        contributor_name=contributor
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Link news_item_id to prompt_log
    prompt_log.news_item_id = item.id
    db.commit()

    return get_news_item_response(item, db)

@router.put("/{item_id}", response_model=NewsItemResponse)
def update_news_item(
    item_id: int,
    req: NewsItemUpdate,
    db: Session = Depends(get_db)
):
    item = db.query(NewsItem).filter(NewsItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="News update item not found.")

    if req.title is not None: item.title = req.title.strip()
    if req.date is not None: item.date = req.date.strip()
    if req.corporate is not None: item.corporate = req.corporate.strip()
    if req.startup is not None: item.startup = req.startup.strip()
    if req.collaboration_type is not None: item.collaboration_type = req.collaboration_type.strip()
    if req.source is not None: item.source = req.source.strip()
    if req.source_url is not None: item.source_url = req.source_url.strip()
    if req.article_text is not None: item.article_text = req.article_text.strip()
    if req.what_happened is not None: item.what_happened = req.what_happened.strip()
    if req.why_it_matters_corporate is not None: item.why_it_matters_corporate = req.why_it_matters_corporate.strip()
    if req.why_it_matters_startup is not None: item.why_it_matters_startup = req.why_it_matters_startup.strip()
    if req.why_it_matters_overall is not None: item.why_it_matters_overall = req.why_it_matters_overall.strip()
    if req.relevant_course_concept is not None: item.relevant_course_concept = req.relevant_course_concept.strip()

    db.commit()
    db.refresh(item)
    return get_news_item_response(item, db)

@router.delete("/{item_id}")
def delete_news_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(NewsItem).filter(NewsItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="News update item not found.")

    # Delete linked PromptLogs & StudentNotes
    logs = db.query(PromptLog).filter(
        (PromptLog.news_item_id == item.id) | (PromptLog.id == item.log_id)
    ).all()
    for log in logs:
        db.delete(log)

    db.delete(item)
    db.commit()
    return {"status": "success", "message": f"News item {item_id} deleted successfully."}
