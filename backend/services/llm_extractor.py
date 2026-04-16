"""
services/llm_extractor.py
--------------------------
Sends raw PDF text to Groq llama-3.3-70b-versatile and returns a structured
dictionary of extracted insurance-claim fields.

Design notes
------------
* Loads GROQ_API_KEY from the environment via python-dotenv at import time.
* Uses the official ``groq`` Python SDK (synchronous client wrapped in
  ``asyncio.to_thread`` so the FastAPI endpoint stays non-blocking).
* The system prompt instructs the model to emit **only** raw JSON — no
  markdown fences, no prose — and lists every expected field with its type.
* JSON parsing is guarded with try/except; on failure the raw response is
  logged and a descriptive ValueError is raised.
* All fields missing from the JSON are normalised to ``None`` (or ``[]``
  for the ``supporting_docs`` array) so downstream validation can work with
  a consistent shape.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

from dotenv import load_dotenv
from groq import Groq

# Load .env file so GROQ_API_KEY is available even when the process is not
# started by a shell that has already exported it.
load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# ---------------------------------------------------------------------------
# Field schema — drives both the system prompt and result normalisation
# ---------------------------------------------------------------------------

# Each entry:  field_name → (json_type_hint, description_for_prompt)
_FIELDS: dict[str, tuple[str, str]] = {
    "claim_number":          ("string",            "unique claim identifier"),
    "claimant_name":         ("string",            "full name of the person filing the claim"),
    "policy_number":         ("string",            "insurance policy number"),
    "incident_date":         ("string (ISO 8601)", "date of the incident, YYYY-MM-DD"),
    "incident_description":  ("string",            "narrative description of what happened"),
    "claim_type":            ("string",            "MUST be one of: property | vehicle | injury | liability"),
    "estimated_damage":      ("number",            "monetary estimate of damages as a plain float, no currency symbol"),
    "contact_phone":         ("string | null",     "claimant's phone number"),
    "contact_email":         ("string | null",     "claimant's email address"),
    "witness_info":          ("string | null",     "witness name(s) and/or contact details"),
    "police_report_number":  ("string | null",     "police or incident report reference number"),
    "supporting_docs":       ("array of strings",  "list of attached or mentioned document names; use [] if none"),
}

# Build the field-list section of the system prompt dynamically so adding a
# new field only requires touching _FIELDS.
_FIELD_LINES: str = "\n".join(
    f'  "{name}": <{type_hint}> — {desc}'
    for name, (type_hint, desc) in _FIELDS.items()
)

_SYSTEM_PROMPT: str = f"""
You are an expert insurance claims analyst.
Your task is to extract structured information from the raw text of an
insurance First Notice of Loss (FNOL) or claims document.

OUTPUT RULES — follow these exactly:
1. Return ONLY a single, valid JSON object.
2. Do NOT include markdown code fences (``` or ```json).
3. Do NOT include any explanatory text before or after the JSON.
4. Every key listed below MUST appear in the JSON.
5. If a field is not found in the document set its value to null
   (or [] for array fields).

REQUIRED JSON KEYS AND TYPES:
{_FIELD_LINES}
""".strip()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def extract_fields(raw_text: str) -> dict[str, Any]:
    """
    Call the Groq LLM to extract structured claim fields from raw PDF text.

    The function is declared ``async`` so it can be awaited by the FastAPI
    endpoint; internally it calls the synchronous Groq SDK inside
    ``asyncio.to_thread`` to avoid blocking the event loop.

    Parameters
    ----------
    raw_text:
        Full plain-text content extracted from the PDF by ``pdf_parser``.

    Returns
    -------
    dict[str, Any]
        A dictionary whose keys match ``_FIELDS``.  Fields that the LLM could
        not find have a value of ``None`` (or ``[]`` for ``supporting_docs``).

    Raises
    ------
    ValueError
        If the LLM response cannot be parsed as JSON, or if the Groq API call
        itself fails.
    """
    import asyncio  # local import to keep module-level imports clean

    if not _GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY is not set.  "
            "Copy .env.example → .env and add your key."
        )

    user_message: str = (
        "Extract the insurance claim fields from the document text below.\n\n"
        "--- DOCUMENT START ---\n"
        f"{raw_text}\n"
        "--- DOCUMENT END ---"
    )

    logger.info(
        "Sending %d chars of PDF text to Groq model '%s'.",
        len(raw_text), _MODEL,
    )

    # Run synchronous Groq SDK call in a thread pool so we do not block the
    # FastAPI event loop.
    raw_response: str = await asyncio.to_thread(
        _call_groq, user_message
    )

    return _parse_response(raw_response)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _call_groq(user_message: str) -> str:
    """
    Perform the synchronous Groq API call and return the raw message content.

    Parameters
    ----------
    user_message:
        The user-role message containing the PDF text.

    Returns
    -------
    str
        Raw string content from the first choice of the completion response.

    Raises
    ------
    ValueError
        Wraps any exception raised by the Groq SDK so callers see a consistent
        error type.
    """
    try:
        client = Groq(api_key=_GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user",   "content": user_message},
            ],
            temperature=0.0,    # fully deterministic extraction
            max_tokens=1024,
            # Ask Groq to constrain output to a JSON object when supported
            response_format={"type": "json_object"},
        )
        raw: str = completion.choices[0].message.content or ""
        logger.debug("Groq raw response (first 500 chars): %s", raw[:500])
        return raw

    except Exception as exc:
        logger.error("Groq API call failed: %s", exc)
        raise ValueError(f"Groq API error: {exc}") from exc


def _parse_response(raw: str) -> dict[str, Any]:
    """
    Parse the LLM string response into a Python dict and normalise it.

    Strips any accidental markdown code fences before attempting JSON
    parsing.  On failure, logs the full raw response at ERROR level and
    raises a descriptive ValueError.

    Parameters
    ----------
    raw:
        Raw string returned by the Groq completion.

    Returns
    -------
    dict[str, Any]
        Normalised extraction dict with all schema keys present.

    Raises
    ------
    ValueError
        When the response cannot be parsed as valid JSON.
    """
    # Defensive strip: remove ```json ... ``` or ``` ... ``` wrappers in case
    # the model ignores the no-fences instruction.
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        # Remove opening fence (with optional language tag) and closing fence
        cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
        cleaned = cleaned.strip()

    try:
        parsed: dict[str, Any] = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error(
            "JSON parse failed.\n"
            "  Error   : %s\n"
            "  Raw resp: %s",
            exc, raw,
        )
        raise ValueError(
            f"LLM returned invalid JSON (offset {exc.pos}): {exc.msg}. "
            "Raw response has been logged at ERROR level."
        ) from exc

    return _normalise(parsed)


def _normalise(raw: dict[str, Any]) -> dict[str, Any]:
    """
    Ensure every schema key is present in the returned dict.

    Missing keys are inserted as ``None``; ``supporting_docs`` defaults to
    ``[]`` so callers can safely iterate it without a None-check.

    Parameters
    ----------
    raw:
        Dict parsed directly from the LLM JSON response.

    Returns
    -------
    dict[str, Any]
        Complete dict with all ``_FIELDS`` keys present.
    """
    result: dict[str, Any] = {}
    for key in _FIELDS:
        value = raw.get(key)
        if key == "supporting_docs" and value is None:
            value = []
        result[key] = value

    logger.info(
        "Extraction normalised — %d/%d fields populated.",
        sum(1 for v in result.values() if v not in (None, [])),
        len(_FIELDS),
    )
    return result



