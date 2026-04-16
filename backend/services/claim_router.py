"""
services/claim_router.py
-------------------------
Document-type aware claim routing engine.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

# Universal fraud keywords
FRAUD_KEYWORDS: list[str] = [
    "fraud",
    "staged",
    "fake",
    "fabricated",
    "inconsistent",
    "suspicious",
    "false claim"
]

def route_claim(fields: dict, missing: list[str], doc_type: str, completeness_score: float = 100.0) -> dict[str, Any]:
    """
    Apply document-type aware routing rules.
    """
    
    # Check all description fields for fraud keywords
    desc_keys = [k for k in fields.keys() if "description" in k.lower()]
    # If no explicit description field, search all string values as a fallback
    if not desc_keys:
        desc_keys = list(fields.keys())
        
    for k in desc_keys:
        val = fields.get(k)
        if isinstance(val, str):
            matched_keyword = _find_fraud_keyword(val.lower())
            if matched_keyword:
                return _build(
                    "Investigation Flag", 
                    f"Fraud keyword '{matched_keyword}' detected in {k}. Flagging for investigation.",
                    doc_type,
                    completeness_score
                )

    # Missing mandatory fields rule (all types)
    if missing:
        return _build(
            "Manual Review",
            f"Missing {len(missing)} mandatory field(s): {', '.join(missing)}.",
            doc_type,
            completeness_score
        )

    # Document type specific routes
    if doc_type == "insurance_claim":
        claim_type = (fields.get("claim_type") or "").strip().lower()
        damage = _to_float(fields.get("estimated_damage"))
        
        if claim_type == "injury":
            return _build("Specialist Queue", "Injury claims require specialist assessment.", doc_type, completeness_score)
        if damage is not None and damage < 25000:
            return _build("Fast-track", f"Estimated damage ({damage}) is below 25,000 threshold.", doc_type, completeness_score)

    elif doc_type == "medical_claim":
        cost = _to_float(fields.get("estimated_cost"))
        if cost is not None and cost > 100000:
            return _build("High Value Medical Review", f"Medical cost ({cost}) exceeds 100,000.", doc_type, completeness_score)
        return _build("Standard Medical Processing", "Medical claim within standard cost limits.", doc_type, completeness_score)

    elif doc_type == "police_report":
        return _build("Law Enforcement Liaison", "Police report detected. Routing to liaison team.", doc_type, completeness_score)

    elif doc_type == "legal_complaint":
        damages = _to_float(fields.get("claimed_damages"))
        if damages is not None and damages > 50000:
            return _build("Legal Team Escalation", f"Claimed damages ({damages}) exceed 50,000.", doc_type, completeness_score)
        return _build("Standard Legal Review", "Legal complaint within standard damages limits.", doc_type, completeness_score)

    elif doc_type == "property_damage":
        repair_cost = _to_float(fields.get("estimated_repair_cost"))
        if repair_cost is not None and repair_cost > 50000:
            return _build("Senior Adjuster", f"Repair cost ({repair_cost}) exceeds 50,000.", doc_type, completeness_score)
        return _build("Fast-track", "Property damage within fast-track repair limits.", doc_type, completeness_score)

    elif doc_type == "unknown":
        return _build("Manual Review", "Unknown document type cannot be automatically routed.", doc_type, completeness_score)

    # Default
    return _build("Standard Review", "Claim meets all requirements for standard processing.", doc_type, completeness_score)


def _find_fraud_keyword(text: str) -> str | None:
    for keyword in FRAUD_KEYWORDS:
        if keyword in text:
            return keyword
    return None


def _to_float(value: object) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            cleaned = value.strip().lstrip("$€£¥").replace(",", "")
            return float(cleaned)
        except ValueError:
            return None
    return None


def _build(route: str, reasoning: str, doc_type: str, score: float) -> dict[str, Any]:
    return {
        "recommendedRoute": route,
        "reasoning": reasoning,
        "documentType": doc_type,
        "completenessScore": int(score)  # Cast to int as requested
    }
