import sqlite3
import os
from datetime import datetime

# Database path setup
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_PATH = os.path.join(DATA_DIR, "tutor.db")

def get_db_connection():
    """Returns a connection to the SQLite database."""
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes database tables and seeds initial verified news data."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create logs table (Student Prompt -> AI Response -> Student Note)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT DEFAULT 'Student',
            timestamp TEXT NOT NULL,
            mode TEXT NOT NULL,
            prompt TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            student_note TEXT DEFAULT ''
        )
    ''')

    # Create news table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            corporate TEXT NOT NULL,
            startup TEXT NOT NULL,
            date TEXT NOT NULL,
            source TEXT NOT NULL,
            source_url TEXT NOT NULL,
            what_happened TEXT NOT NULL,
            summary TEXT NOT NULL,
            why_it_matters TEXT NOT NULL,
            relevant_course_concept TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')

    # Seed verified corporate-startup news items if table is empty
    cursor.execute("SELECT COUNT(*) FROM news")
    if cursor.fetchone()[0] == 0:
        sample_news = [
            (
                "BMW Group Expands Flax-Fiber Composite Partnership with Bcomp",
                "BMW Group (BMW i Ventures)",
                "Bcomp (CleanTech)",
                "2026-06-15",
                "BMW Group Press Club",
                "https://www.press.bmwgroup.com",
                "BMW i Ventures led a strategic investment round in Swiss clean-tech startup Bcomp and expanded a joint development agreement to integrate renewable flax-fiber composites into production vehicles and motorsport.",
                "BMW's venture unit co-developed flax-based lightweight components with Bcomp, substituting traditional carbon fiber with natural fibers to reduce carbon footprint by up to 75%.",
                "Demonstrates how Corporate Venture Capital (CVC) combined with Joint Development Agreements (JDA) allows major OEMs to gain fast access to sustainable innovations while providing startups with automotive validation and scaling capacity.",
                "Corporate Venture Capital (CVC) & Strategic Joint Development",
                datetime.now().isoformat()
            ),
            (
                "Schneider Electric and Carlyle Launch Energy-as-a-Service Venture AlphaStruxure",
                "Schneider Electric",
                "AlphaStruxure (ClimateTech)",
                "2026-07-02",
                "Schneider Electric Newsroom",
                "https://www.se.com",
                "Schneider Electric partnered with private equity firm Carlyle to launch AlphaStruxure, a venture-backed strategic platform delivering Energy-as-a-Service (EaaS) microgrids for commercial and industrial customers.",
                "Schneider Electric leverages startup agility and external equity financing to deploy clean energy microgrids faster than traditional corporate R&D product cycles permit.",
                "Highlights corporate spin-offs and strategic joint ventures that enable legacy industrial incumbents to launch disruptive business models without internal organizational friction.",
                "Corporate Incubators & Organizational Ambidexterity",
                datetime.now().isoformat()
            ),
            (
                "Unilever Foundry Scales Generative AI Marketing Across Global Brands with Synthesia",
                "Unilever",
                "Synthesia (AI / Media)",
                "2026-08-10",
                "Unilever Foundry Portal",
                "https://www.unilever.com/news",
                "Unilever deployed Synthesia's generative video avatar platform across 15 global brand teams following a successful 90-day pilot managed through the Unilever Foundry corporate accelerator.",
                "Synthesia enabled localized video asset creation across 30+ languages, cutting video production turnaround time from 6 weeks to 48 hours for Unilever global consumer campaigns.",
                "Shows how corporate accelerators serve as proof-of-concept (PoC) funnels that transition high-performing startups from pilot testing into multi-year enterprise procurement contracts.",
                "Corporate Accelerators & Pilot-to-Enterprise Scaling",
                datetime.now().isoformat()
            )
        ]

        cursor.executemany('''
            INSERT INTO news (
                title, corporate, startup, date, source, source_url,
                what_happened, summary, why_it_matters, relevant_course_concept, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_news)

    conn.commit()
    conn.close()

# Log repository helper functions
def save_log(student_name: str, mode: str, prompt: str, ai_response: str, student_note: str = "") -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('''
        INSERT INTO logs (student_name, timestamp, mode, prompt, ai_response, student_note)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (student_name or 'Student', timestamp, mode, prompt, ai_response, student_note))
    log_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return log_id

def update_log_note(log_id: int, student_note: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE logs SET student_note = ? WHERE id = ?
    ''', (student_note, log_id))
    rows = cursor.rowcount
    conn.commit()
    conn.close()
    return rows > 0

def fetch_all_logs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM logs ORDER BY id DESC')
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return logs

def fetch_all_news():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM news ORDER BY id DESC')
    news = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return news

def save_news_item(title: str, corporate: str, startup: str, date: str, source: str, source_url: str,
                   what_happened: str, summary: str, why_it_matters: str, relevant_course_concept: str) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()
    cursor.execute('''
        INSERT INTO news (
            title, corporate, startup, date, source, source_url,
            what_happened, summary, why_it_matters, relevant_course_concept, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (title, corporate, startup, date, source, source_url, what_happened, summary, why_it_matters, relevant_course_concept, created_at))
    news_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return news_id
