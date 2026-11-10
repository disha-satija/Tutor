# Corporate Startup & Continuous Assessment Tutor Platform

> **Supported Courses:**
> 1. **ENT 3805 — Designing Corporate Startup Synergies**
> 2. **ENG 4101 — Engineering Philosophy of Technology**
>
> **Evaluation Component:** Continuous Assessment Tutor Portfolio  
> **Weightage:** 20% Continuous Assessment  

---

## 📌 Multi-Subject Platform Architecture

The **Corporate Startup Tutor** platform has been expanded into a multi-subject AI Continuous Assessment workspace.

### 🌟 Key Architecture Highlights:
1. **Subject Selection Landing Page**:
   - Opening `http://127.0.0.1:8000` presents a clean subject selection landing page:
     - 📊 **Designing Corporate Startup Synergies** (`ENT 3805`) `[ Enter Course ]`
     - ⚙️ **Engineering Philosophy of Technology** (`ENG 4101`) `[ Enter Course ]`
2. **Subject Workspace & Data Isolation**:
   - Each course operates in its own isolated workspace.
   - Database entities (`SessionSchedule`, `Reflection`, `PromptLog`, `StudentNote`, `Fortnight`, `NewsItem`) are explicitly associated with `course_id`.
   - **`ENT 3805` Data**: All pre-existing 8 class sessions, reflections, prompt logs, and fortnightly collaboration news are preserved 100% intact under `Course 1`.
   - **`ENG 4101` Data**: Starts cleanly with 0 sessions under `Course 2`. Session numbering restarts at `Session 1` for Course 2.
3. **Course-Specific AI System Context**:
   - `ENT 3805` AI Context: Synthesizes reflections using Corporate Venture Capital, accelerators, joint ventures, and open innovation frameworks.
   - `ENG 4101` AI Context: Synthesizes reflections using technological determinism, postphenomenology, SCOT, engineering ethics, and technological mediation frameworks.
   - Both course contexts strictly enforce **EXACTLY ONE open question**.
4. **Header Navigation & Switching**:
   - Workspace header displays the active subject code and name.
   - Includes a prominent **`"← Switch Subject"`** button returning to the Subject Selection screen without altering any data.

---

## 🚀 Quick Start & Run Commands

```bash
# Navigate to project directory
cd "c:/Documents/Btech resources/Btech - Sem 7/Designing Corporate Startup Synergies/Startup Endsem project"

# Start FastAPI Backend Server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Open your browser to:  
👉 **`http://127.0.0.1:8000`**

---

## 🧪 Automated Test Suite Execution

Run `python test_system.py` in your terminal to verify course selection, data isolation, course-specific AI reflection generation, and data preservation:

```bash
python test_system.py
```

Expected output: `ALL TEST SUITE SUITES PASSED CLEANLY (100% SUCCESS)`
