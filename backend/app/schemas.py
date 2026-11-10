from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Course Schemas
class CourseResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    icon: str = "📚"
    created_at: datetime

    class Config:
        from_attributes = True

# Session Schemas
class SessionScheduleResponse(BaseModel):
    id: int
    course_id: int
    group_id: int
    date: str
    day_of_week: str
    duration_hours: float
    week_number: int
    title: str
    notes_content: Optional[str] = ""
    notes_status: str
    reflection_status: str
    display_session_number: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SessionCreate(BaseModel):
    course_id: Optional[int] = 1
    date: str # "YYYY-MM-DD"
    duration_hours: Optional[float] = 1.0
    title: str
    notes_content: Optional[str] = ""
    contributor_name: Optional[str] = "Student"

class SessionUpdate(BaseModel):
    date: Optional[str] = None
    duration_hours: Optional[float] = None
    title: Optional[str] = None
    notes_content: Optional[str] = None

class SessionNotesSubmit(BaseModel):
    notes_content: str

# Reflection Schemas
class ReflectionGenerateRequest(BaseModel):
    course_id: Optional[int] = 1
    session_id: int
    notes: str
    contributor_name: Optional[str] = "Student"

class ReflectionResponse(BaseModel):
    id: int
    course_id: int
    session_id: int
    contributor_name: Optional[str] = "Student"
    raw_notes: str
    structured_reflection: str
    key_points: Optional[str] = None
    explanation: Optional[str] = None
    important_concepts: Optional[str] = None
    examples_cases: Optional[str] = None
    insights: Optional[str] = None
    open_question: str
    created_at: datetime
    log_id: Optional[int] = None

    class Config:
        from_attributes = True

# Student Note Schemas
class StudentNoteCreate(BaseModel):
    note_text: str
    contributor_name: Optional[str] = "Student"

class StudentNoteResponse(BaseModel):
    id: int
    prompt_log_id: int
    contributor_name: str
    note_text: str
    created_at: datetime

    class Config:
        from_attributes = True

# Prompt Log Schemas
class PromptLogResponse(BaseModel):
    id: int
    course_id: int
    group_id: int
    contributor_name: str
    mode: str
    session_id: Optional[int] = None
    session_title: Optional[str] = None
    fortnight_id: Optional[int] = None
    news_item_id: Optional[int] = None
    prompt_text: str
    ai_response: str
    timestamp: datetime
    student_notes: List[StudentNoteResponse] = []

    class Config:
        from_attributes = True

# Fortnight Schemas
class FortnightCreate(BaseModel):
    course_id: Optional[int] = 1
    title: str # e.g. "31 August – 13 September 2026"
    start_date: str # e.g. "2026-08-31"
    end_date: str # e.g. "2026-09-13"
    summary: Optional[str] = ""

# News Schemas
class NewsAnalyzeRequest(BaseModel):
    course_id: Optional[int] = 1
    fortnight_id: int
    title: Optional[str] = ""
    source: Optional[str] = ""
    source_url: str
    date: Optional[str] = None
    corporate: Optional[str] = ""
    startup: Optional[str] = ""
    article_text: Optional[str] = ""
    contributor_name: Optional[str] = "Student"

class NewsItemCreate(BaseModel):
    course_id: Optional[int] = 1
    fortnight_id: int
    title: str
    date: str
    corporate: str
    startup: str
    collaboration_type: str
    source: str
    source_url: str
    article_text: Optional[str] = ""
    what_happened: str
    summary: str
    why_it_matters_corporate: str
    why_it_matters_startup: str
    why_it_matters_overall: str
    relevant_course_concept: str
    verification_status: Optional[str] = "verified"
    contributor_name: Optional[str] = "Student"

class NewsItemUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    corporate: Optional[str] = None
    startup: Optional[str] = None
    collaboration_type: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    article_text: Optional[str] = None
    what_happened: Optional[str] = None
    why_it_matters_corporate: Optional[str] = None
    why_it_matters_startup: Optional[str] = None
    why_it_matters_overall: Optional[str] = None
    relevant_course_concept: Optional[str] = None

class NewsItemResponse(BaseModel):
    id: int
    course_id: int
    fortnight_id: int
    log_id: Optional[int] = None
    title: str
    date: str
    corporate: str
    startup: str
    collaboration_type: str
    source: str
    source_url: str
    article_text: Optional[str] = ""
    what_happened: str
    summary: str
    why_it_matters_corporate: str
    why_it_matters_startup: str
    why_it_matters_overall: str
    relevant_course_concept: str
    verification_status: str
    contributor_name: Optional[str] = "Student"
    student_note: Optional[str] = ""
    created_at: datetime

    class Config:
        from_attributes = True

class NewsSearchRequest(BaseModel):
    course_id: Optional[int] = 1
    query: Optional[str] = "corporate startup collaboration CVC investment"
    fortnight_id: int
    contributor_name: Optional[str] = "Student"

class FortnightResponse(BaseModel):
    id: int
    course_id: int
    fortnight_number: int
    title: str
    start_date: str
    end_date: str
    summary: Optional[str] = None
    news_items: List[NewsItemResponse] = []

    class Config:
        from_attributes = True

# Dashboard Stats
class DashboardOverviewResponse(BaseModel):
    course_id: int
    course_code: str
    course_name: str
    group_name: str
    total_sessions: int
    completed_reflections: int
    pending_reflections: int
    total_logs: int
    total_fortnights: int
    total_news_items: int
    completion_percentage: float
