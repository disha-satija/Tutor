# Re-exporting prompts from backend.app.prompts to ensure single authoritative implementation
from backend.app.prompts import (
    get_corporate_startup_reflection_prompt,
    get_philosophy_reflection_prompt,
    get_class_reflection_system_prompt,
    CLASS_REFLECTION_SYSTEM_PROMPT,
    FORTNIGHTLY_NEWS_SYSTEM_PROMPT
)

__all__ = [
    "get_corporate_startup_reflection_prompt",
    "get_philosophy_reflection_prompt",
    "get_class_reflection_system_prompt",
    "CLASS_REFLECTION_SYSTEM_PROMPT",
    "FORTNIGHTLY_NEWS_SYSTEM_PROMPT"
]

