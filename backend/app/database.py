import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from backend.app.models import Course, Group, SessionSchedule, Fortnight, NewsItem, PromptLog, Reflection

    Base.metadata.create_all(bind=engine)

    # Auto-migration for SQLite explanation column if missing
    try:
        with engine.connect() as conn:
            conn.execute(Base.metadata.tables["reflections"].select())
    except Exception:
        pass

    import sqlite3
    if DATABASE_URL.startswith("sqlite"):
        try:
            db_file = DATABASE_URL.replace("sqlite:///", "")
            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(reflections)")
            cols = [info[1] for info in cursor.fetchall()]
            if "explanation" not in cols:
                cursor.execute("ALTER TABLE reflections ADD COLUMN explanation TEXT;")
                conn.commit()
            conn.close()
        except Exception:
            pass

    db = SessionLocal()

    # 1. Seed Courses (Course 1: Corporate Startup Synergies, Course 2: Engineering Philosophy of Technology)
    course1 = db.query(Course).filter(Course.id == 1).first()
    if not course1:
        course1 = Course(
            id=1,
            code="ENT 3805",
            name="Designing Corporate Startup Synergies",
            description="Continuous Assessment tutor for corporate-startup collaboration, CVC models, accelerators, and joint development agreements.",
            icon="📊"
        )
        db.add(course1)
        db.commit()
        db.refresh(course1)

    course2 = db.query(Course).filter(Course.id == 2).first()
    if not course2:
        course2 = Course(
            id=2,
            code="ENG 4101",
            name="Engineering Philosophy of Technology",
            description="Continuous Assessment tutor for engineering epistemology, technological determinism, ethics, mediation, and design philosophy.",
            icon="⚙️"
        )
        db.add(course2)
        db.commit()
        db.refresh(course2)

    # 2. Seed Default Group
    group = db.query(Group).first()
    if not group:
        group = Group(
            name="Syndicate 1",
            course_name="Designing Corporate Startup Synergies",
            description="Official Continuous Assessment syndicate group."
        )
        db.add(group)
        db.commit()
        db.refresh(group)

    # 3. Seed Pre-Created 8 Class Sessions for Course 1 (Aug 3 - Aug 26, 2026)
    existing_sessions = db.query(SessionSchedule).filter(SessionSchedule.course_id == 1).count()
    if existing_sessions == 0:
        semester_sessions = [
            ("2026-08-03", "Monday", 1.0, 1, "Session 1: Course Introduction & Corporate Startup Drivers"),
            ("2026-08-05", "Wednesday", 2.0, 1, "Session 2: Strategic Fit & Corporate Venture Capital (CVC)"),
            ("2026-08-10", "Monday", 1.0, 2, "Session 3: Corporate Accelerators & Pilot Scaling"),
            ("2026-08-12", "Wednesday", 2.0, 2, "Session 4: Ambidexterity & Structural Autonomy vs. Integration"),
            ("2026-08-17", "Monday", 1.0, 3, "Session 5: Intellectual Property, Licensing & Co-Innovation"),
            ("2026-08-19", "Wednesday", 2.0, 3, "Session 6: Cultural Differences & Post-Merger Integration Friction"),
            ("2026-08-24", "Monday", 1.0, 4, "Session 7: Ecosystem Governance & Joint Venture Structures"),
            ("2026-08-26", "Wednesday", 2.0, 4, "Session 8: Measuring Synergies & Long-term Partnership Sustainability")
        ]

        for s_date, day, duration, week_num, title in semester_sessions:
            sess = SessionSchedule(
                course_id=1,
                group_id=group.id,
                date=s_date,
                day_of_week=day,
                duration_hours=duration,
                week_number=week_num,
                title=title,
                notes_status="pending",
                reflection_status="pending"
            )
            db.add(sess)
        db.commit()

    # 4. Seed Fortnights & Sample News Items for Course 1
    existing_fortnights = db.query(Fortnight).filter(Fortnight.course_id == 1).count()
    if existing_fortnights == 0:
        fn1 = Fortnight(
            course_id=1,
            group_id=group.id,
            fortnight_number=1,
            title="Fortnight 1 (3 August – 16 August 2026)",
            start_date="2026-08-03",
            end_date="2026-08-16",
            summary="Initial fortnightly tracking of CVC investments, green energy spin-offs, and enterprise pilot integrations."
        )
        fn2 = Fortnight(
            course_id=1,
            group_id=group.id,
            fortnight_number=2,
            title="Fortnight 2 (17 August – 30 August 2026)",
            start_date="2026-08-17",
            end_date="2026-08-30",
            summary="Second fortnight tracking AI technology partnerships, autonomous driving joint ventures, and strategic acquisitions."
        )
        db.add(fn1)
        db.add(fn2)
        db.commit()
        db.refresh(fn1)
        db.refresh(fn2)

        sample_news = [
            NewsItem(
                course_id=1,
                fortnight_id=fn1.id,
                group_id=group.id,
                title="BMW Group & Bcomp Expand Flax-Fiber Composite Partnership",
                date="2026-08-06",
                corporate="BMW Group (BMW i Ventures)",
                startup="Bcomp (CleanTech)",
                collaboration_type="CVC Investment & Joint Development",
                source="BMW Group Press Club",
                source_url="https://www.press.bmwgroup.com",
                what_happened="BMW i Ventures expanded its strategic investment and co-development agreement with Bcomp to integrate renewable flax-fiber composites into vehicle interiors and motorsport.",
                summary="Bcomp's natural fiber composites replace carbon fiber, cutting manufacturing carbon footprint by 75% while meeting automotive structural rigors.",
                why_it_matters_corporate="Gains immediate access to sustainable materials innovation and ESG compliance without undergoing lengthy internal chemical R&D.",
                why_it_matters_startup="Secures CVC capital, OEM validation, and tier-1 automotive manufacturing scale.",
                why_it_matters_overall="Demonstrates how Corporate Venture Capital combined with Joint Development Agreements enables legacy OEMs to decarbonize rapidly.",
                relevant_course_concept="Corporate Venture Capital (CVC) & Joint Development Agreements (JDA)",
                verification_status="verified",
                contributor_name="Sakshi"
            ),
            NewsItem(
                course_id=1,
                fortnight_id=fn2.id,
                group_id=group.id,
                title="Unilever Foundry Deploys Synthesia AI Video Avatars Globally",
                date="2026-08-20",
                corporate="Unilever",
                startup="Synthesia (AI / Media)",
                collaboration_type="Accelerator Pilot to Enterprise Procurement",
                source="Unilever Press Portal",
                source_url="https://www.unilever.com/news",
                what_happened="Following a 90-day accelerator pilot managed by Unilever Foundry, Unilever rolled out Synthesia's generative video avatar platform across 15 global consumer brand marketing teams.",
                summary="Synthesia provided localized AI video content creation across 30+ languages, reducing turnaround times from 6 weeks to 48 hours.",
                why_it_matters_corporate="Acquires ultra-fast digital content creation capabilities, dramatically reducing global marketing agency expenditure.",
                why_it_matters_startup="Transitions from pilot proof-of-concept into a multi-year enterprise SaaS contract with a Fortune 500 consumer giant.",
                why_it_matters_overall="Highlights how corporate accelerators act as proof-of-concept funnels converting early pilots into global enterprise procurement.",
                relevant_course_concept="Corporate Accelerators & Pilot-to-Procurement Scaleup",
                verification_status="verified",
                contributor_name="Alex"
            )
        ]

        for item in sample_news:
            db.add(item)
        db.commit()

    # 5. Ensure existing records without course_id are associated with Course 1
    db.query(SessionSchedule).filter(SessionSchedule.course_id == None).update({SessionSchedule.course_id: 1})
    db.query(PromptLog).filter(PromptLog.course_id == None).update({PromptLog.course_id: 1})
    db.query(Reflection).filter(Reflection.course_id == None).update({Reflection.course_id: 1})
    db.query(Fortnight).filter(Fortnight.course_id == None).update({Fortnight.course_id: 1})
    db.query(NewsItem).filter(NewsItem.course_id == None).update({NewsItem.course_id: 1})
    db.commit()

    db.close()
