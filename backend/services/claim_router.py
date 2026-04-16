"""
services/claim_router.py
-------------------------
Pure-Python, deterministic claim routing engine.

No LLM calls are made here.  Every decision is based solely on the
extracted fields dict and the missing-fields list produced by the upstream
services, making routing fully testable, auditable, and instantaneous.

Routing priority (highest wins — first match is returned)
----------------------------------------------------------
1. Any fraud keyword found in ``incident_description``  → "Investigation Flag"
2. Any field present in the *missing* list              → "Manual Review"
3. ``claim_type`` == "injury"                           → "Specialist Queue"
4. ``estimated_damage`` < 25 000                        → "Fast-track"
5. Everything else                                      → "Standard Review"
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ROUTE_INVESTIGATION: str = "Investigation Flag"
ROUTE_MANUAL_REVIEW: str = "Manual Review"
ROUTE_SPECIALIST:    str = "Specialist Queue"
ROUTE_FAST_TRACK:    str = "Fast-track"
ROUTE_STANDARD:      str = "Standard Review"

FRAUD_KEYWORDS: list[str] = [
    "fraud",
    "inconsistent",
    "staged",
    "fake",
    "fabricated",
]

_FAST_TRACK_THRESHOLD: float = 25_000.0


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def route_claim(fields: dict, missing: list[str]) -> dict[str, str]:
    """
    Apply deterministic routing rules and return the route and its reasoning.

    Parameters
    ----------
    fields:
        Normalised extraction dict from ``llm_extractor.extract_fields``.
    missing:
        List of mandatory field names flagged by
        ``field_validator.validate_fields``.

    Returns
    -------
    dict with exactly two keys:
        ``"recommendedRoute"`` — one of the ROUTE_* module-level constants.
        ``"reasoning"``        — one clear sentence explaining the decision.
    """
    description: str   = (fields.get("incident_description") or "").lower()
    claim_type:  str   = (fields.get("claim_type")           or "").strip().lower()
    raw_damage          = fields.get("estimated_damage")

    # -- Rule 1: Fraud / staging indicators ----------------------------------
    matched_keyword = _find_fraud_keyword(description)
    if matched_keyword:
        reason = (
            f"The incident description contains the fraud indicator "
            f"'{matched_keyword}', so this claim has been flagged for "
            f"investigation regardless of damage amount or completeness."
        )
        logger.info("Route → %s  [fraud keyword: '%s']", ROUTE_INVESTIGATION, matched_keyword)
        return _build(ROUTE_INVESTIGATION, reason)

    # -- Rule 2: Missing mandatory fields ------------------------------------
    if missing:
        fields_str = ", ".join(f"'{f}'" for f in missing)
        reason = (
            f"The claim is missing mandatory field(s) {fields_str}, "
            f"so it requires manual review before it can be processed further."
        )
        logger.info("Route → %s  [missing: %s]", ROUTE_MANUAL_REVIEW, missing)
        return _build(ROUTE_MANUAL_REVIEW, reason)

    # -- Rule 3: Injury claim ------------------------------------------------
    if claim_type == "injury":
        reason = (
            "The claim type is 'injury', which requires specialist medical "
            "and legal assessment and cannot be handled through the standard pipeline."
        )
        logger.info("Route → %s  [claim_type=injury]", ROUTE_SPECIALIST)
        return _build(ROUTE_SPECIALIST, reason)

    # -- Rule 4: Low-value fast-track ----------------------------------------
    damage = _to_float(raw_damage)
    if damage is not None and damage < _FAST_TRACK_THRESHOLD:
        reason = (
            f"All mandatory fields are present, no fraud indicators were detected, "
            f"and the estimated damage ({damage:,.2f}) is below the "
            f"{_FAST_TRACK_THRESHOLD:,.0f} threshold, qualifying this claim for fast-track processing."
        )
        logger.info("Route → %s  [damage=%.2f < %.0f]", ROUTE_FAST_TRACK, damage, _FAST_TRACK_THRESHOLD)
        return _build(ROUTE_FAST_TRACK, reason)

    # -- Rule 5: Default standard review -------------------------------------
    damage_str = f"{damage:,.2f}" if damage is not None else "unknown"
    reason = (
        f"All mandatory fields are present, no fraud indicators were detected, "
        f"but the estimated damage ({damage_str}) meets or exceeds the "
        f"{_FAST_TRACK_THRESHOLD:,.0f} threshold, so this claim requires standard review."
    )
    logger.info("Route → %s  [default, damage=%s]", ROUTE_STANDARD, damage_str)
    return _build(ROUTE_STANDARD, reason)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _find_fraud_keyword(description: str) -> str | None:
    """
    Scan *description* for any entry in ``FRAUD_KEYWORDS``.

    The check is case-insensitive (the caller should pass a lowercased string).
    Returns the first matched keyword, or ``None`` if none found.

    Parameters
    ----------
    description:
        Lowercased incident description text.

    Returns
    -------
    str | None
        The matched keyword, or ``None``.
    """
    for keyword in FRAUD_KEYWORDS:
        if keyword in description:
            return keyword
    return None


def _to_float(value: object) -> float | None:
    """
    Safely convert an arbitrary LLM-extracted value to ``float``.

    Handles ``int``, ``float``, and numeric strings, including those with
    currency symbols or comma separators.  Returns ``None`` on failure so
    the caller can apply fallback logic rather than crashing.

    Parameters
    ----------
    value:
        Raw value from the extraction dict.

    Returns
    -------
    float | None
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            cleaned = value.strip().lstrip("$€£¥").replace(",", "")
            return float(cleaned)
        except ValueError:
            logger.warning("Could not convert estimated_damage %r to float.", value)
            return None
    return None


def _build(route: str, reasoning: str) -> dict[str, str]:
    """
    Construct the routing result dict.

    Parameters
    ----------
    route:
        One of the ROUTE_* module-level constants.
    reasoning:
        Single-sentence explanation of the routing decision.

    Returns
    -------
    dict[str, str]
        ``{"recommendedRoute": route, "reasoning": reasoning}``
    """
    return {"recommendedRoute": route, "reasoning": reasoning}
