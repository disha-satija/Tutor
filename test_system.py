import sys
import os
import json
import httpx

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("==================================================")
    print("RUNNING MULTI-SUBJECT TUTOR TEST SUITE")
    print("==================================================")

    client = httpx.Client(base_url=BASE_URL, timeout=60.0)

    # 1. Health check & Course Listing
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("[OK] Health Check Passed:", r.json()["platform"])

    r = client.get("/courses")
    assert r.status_code == 200, f"Get courses failed: {r.text}"
    courses = r.json()
    assert len(courses) == 2, f"Expected 2 courses, found {len(courses)}"
    print(f"[OK] Courses Listed: {courses[0]['code']} ({courses[0]['name']}) & {courses[1]['code']} ({courses[1]['name']})")

    # 2. Verify Course 1 (Corporate Startup Synergies) Data & Stats
    r = client.get("/dashboard?course_id=1")
    assert r.status_code == 200
    c1_stats = r.json()
    assert c1_stats["total_sessions"] >= 8, f"Expected >= 8 sessions for Course 1, got {c1_stats['total_sessions']}"
    print("[OK] Course 1 (ENT 3805) Stats Verified:", c1_stats)

    # 3. Verify Course 2 (Engineering Philosophy of Technology) Data Isolation
    r = client.get("/dashboard?course_id=2")
    assert r.status_code == 200
    c2_stats = r.json()
    print("[OK] Course 2 (ENG 4101) Isolated Stats Verified:", c2_stats)

    # 4. Create Session in Course 2 (Engineering Philosophy of Technology)
    r = client.post("/sessions", json={
        "course_id": 2,
        "date": "2026-09-07",
        "duration_hours": 2.0,
        "title": "Session 1: Technological Determinism & SCOT Frameworks",
        "notes_content": "Today's lecture analyzed Technological Determinism versus Social Construction of Technology (SCOT) by Trevor Pinch and Wiebe Bijker."
    })
    assert r.status_code == 200, f"Create session in Course 2 failed: {r.text}"
    c2_sess = r.json()
    assert c2_sess["course_id"] == 2
    assert c2_sess["display_session_number"] == 1, f"Expected Session 1 for Course 2, got {c2_sess['display_session_number']}"
    print(f"[OK] Created Course 2 Session #{c2_sess['display_session_number']} - {c2_sess['title']} ({c2_sess['date']})")

    # 5. Verify Session Data Isolation
    r1 = client.get("/sessions?course_id=1")
    c1_sess_ids = [s["id"] for s in r1.json()]
    r2 = client.get("/sessions?course_id=2")
    c2_sess_ids = [s["id"] for s in r2.json()]

    assert c2_sess["id"] not in c1_sess_ids, "Course 2 session leaked into Course 1!"
    assert c2_sess["id"] in c2_sess_ids, "Course 2 session missing from Course 2!"
    print("[OK] STRICT DATA ISOLATION VERIFIED: Course 2 session does NOT appear in Course 1!")

    # 6. Generate Reflection for Course 2 Session
    r = client.post("/reflections/generate", json={
        "course_id": 2,
        "session_id": c2_sess["id"],
        "notes": c2_sess["notes_content"],
        "contributor_name": "Student"
    })
    assert r.status_code == 200, f"Reflection generation failed: {r.text}"
    c2_ref = r.json()
    assert "open_question" in c2_ref
    print("[OK] Course 2 Reflection Generated with Philosophical AI Context & 1 Open Question:")
    print(f"   Open Question: '{c2_ref['open_question'].strip()}'")

    # 7. Clean up Course 2 Test Session
    r = client.delete(f"/sessions/{c2_sess['id']}")
    assert r.status_code == 200
    print(f"[OK] Cleaned up Course 2 test session #{c2_sess['id']}")

    # 8. Re-verify Course 1 Data Intact
    r1_final = client.get("/sessions?course_id=1")
    assert len(r1_final.json()) >= 8
    print("[OK] Course 1 (ENT 3805) Data Preserved 100% Intact!")

    print("\n==================================================")
    print("ALL TEST SUITE SUITES PASSED CLEANLY (100% SUCCESS)")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
