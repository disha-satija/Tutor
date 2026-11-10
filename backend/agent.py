# Re-exporting agent functions from backend.app.agent to maintain single authoritative source
from backend.app.agent import (
    generate_content_with_llm,
    generate_class_reflection_structured,
    _enforce_single_open_question,
    _generate_fallback_reflection,
    _parse_reflection_sections
)

def generate_class_reflection(notes: str, course_id: int = 1) -> str:
    res = generate_class_reflection_structured(notes, course_id)
    return res["structured_markdown"]

