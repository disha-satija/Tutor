from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False) # e.g. "ENT 3805"
    name = Column(String, nullable=False) # e.g. "Designing Corporate Startup Synergies"
    description = Column(Text, nullable=True)
    icon = Column(String, default="📚")
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("SessionSchedule", back_populates="course")
    prompt_logs = relationship("PromptLog", back_populates="course")
    fortnights = relationship("Fortnight", back_populates="course")

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    course_name = Column(String, default="Designing Corporate Startup Synergies")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("SessionSchedule", back_populates="group")
    prompt_logs = relationship("PromptLog", back_populates="group")
    fortnights = relationship("Fortnight", back_populates="group")

class SessionSchedule(Base):
    __tablename__ = "session_schedules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), default=1)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    date = Column(String, nullable=False) # e.g. "2026-08-03"
    day_of_week = Column(String, nullable=False) # e.g. "Monday"
    duration_hours = Column(Float, nullable=False) # 1.0 or 2.0
    week_number = Column(Integer, nullable=False) # 1 to 4
    title = Column(String, nullable=False)
    notes_content = Column(Text, default="")
    notes_status = Column(String, default="pending") # "pending", "provided"
    reflection_status = Column(String, default="pending") # "pending", "completed"
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="sessions")
    group = relationship("Group", back_populates="sessions")
    reflections = relationship("Reflection", back_populates="session")

class Reflection(Base):
    __tablename__ = "reflections"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), default=1)
    session_id = Column(Integer, ForeignKey("session_schedules.id"), nullable=False)
    contributor_name = Column(String, default="Student")
    raw_notes = Column(Text, nullable=False)
    structured_reflection = Column(Text, nullable=False)
    key_points = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    important_concepts = Column(Text, nullable=True)
    examples_cases = Column(Text, nullable=True)
    insights = Column(Text, nullable=True)
    open_question = Column(Text, nullable=False) # MUST BE EXACTLY ONE QUESTION
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("SessionSchedule", back_populates="reflections")

class PromptLog(Base):
    __tablename__ = "prompt_logs"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), default=1)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    contributor_name = Column(String, default="Student")
    mode = Column(String, nullable=False) # "reflection" or "news"
    session_id = Column(Integer, ForeignKey("session_schedules.id"), nullable=True)
    fortnight_id = Column(Integer, ForeignKey("fortnights.id"), nullable=True)
    news_item_id = Column(Integer, ForeignKey("news_items.id"), nullable=True)
    prompt_text = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="prompt_logs")
    group = relationship("Group", back_populates="prompt_logs")
    student_notes = relationship("StudentNote", back_populates="prompt_log", cascade="all, delete-orphan")

class StudentNote(Base):
    __tablename__ = "student_notes"

    id = Column(Integer, primary_key=True, index=True)
    prompt_log_id = Column(Integer, ForeignKey("prompt_logs.id"), nullable=False)
    contributor_name = Column(String, default="Student")
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    prompt_log = relationship("PromptLog", back_populates="student_notes")

class Fortnight(Base):
    __tablename__ = "fortnights"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), default=1)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    fortnight_number = Column(Integer, nullable=False) # 1, 2, 3...
    title = Column(String, nullable=False) # e.g. "Fortnight 1 (3 August – 16 August 2026)"
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="fortnights")
    group = relationship("Group", back_populates="fortnights")
    news_items = relationship("NewsItem", back_populates="fortnight", cascade="all, delete-orphan")

class NewsItem(Base):
    __tablename__ = "news_items"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), default=1)
    fortnight_id = Column(Integer, ForeignKey("fortnights.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    log_id = Column(Integer, ForeignKey("prompt_logs.id"), nullable=True)
    title = Column(String, nullable=False)
    date = Column(String, nullable=False)
    corporate = Column(String, nullable=False)
    startup = Column(String, nullable=False)
    collaboration_type = Column(String, nullable=False)
    source = Column(String, nullable=False)
    source_url = Column(String, nullable=False)
    article_text = Column(Text, nullable=True)
    what_happened = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    why_it_matters_corporate = Column(Text, nullable=False)
    why_it_matters_startup = Column(Text, nullable=False)
    why_it_matters_overall = Column(Text, nullable=False)
    relevant_course_concept = Column(String, nullable=False)
    verification_status = Column(String, default="verified")
    contributor_name = Column(String, default="Student")
    created_at = Column(DateTime, default=datetime.utcnow)

    fortnight = relationship("Fortnight", back_populates="news_items")
