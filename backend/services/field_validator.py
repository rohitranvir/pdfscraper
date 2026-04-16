"""
services/field_validator.py
----------------------------
Document-type aware validation of extracted fields.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

# Define mandatory fields per document type
MANDATORY_FIELDS = {
    "insurance_claim": [
        "claimant_name", "policy_number", "incident_date",
        "incident_description", "claim_type", "estimated_damage"
    ],
    "medical_claim": [
        "patient_name", "treatment_date", "hospital_name",
        "diagnosis", "estimated_cost"
    ],
    "police_report": [
        "report_number", "incident_date", "location",
        "incident_description", "involved_parties"
    ],
    "legal_complaint": [
        "plaintiff", "defendant", "filing_date",
        "complaint_description", "claimed_damages"
    ],
    "property_damage": [
        "property_address", "owner_name", "damage_type",
        "incident_date", "estimated_repair_cost"
    ],
    "unknown": []
}

# String values that count as "not provided" even when the key exists.
_EMPTY_SENTINELS: frozenset[str] = frozenset({"unknown", "", "null", "none", "n/a", "na", "not provided"})


def validate_fields(fields: dict, doc_type: str) -> tuple[list[str], float]:
    """
    Return missing mandatory fields and a completeness score (0-100) based on doc_type.
    """
    mandatory = MANDATORY_FIELDS.get(doc_type, [])
    
    if not mandatory:
        # If no mandatory fields apply, it's 100% complete and nothing is missing
        return [], 100.0

    missing: list[str] = []

    for field in mandatory:
        value = fields.get(field)
        
        # Check standard absence/emptiness
        if _is_missing(value):
            missing.append(field)
        
        # Additional numeric bounds checking for cost/damage fields
        elif field in ["estimated_damage", "estimated_cost", "estimated_repair_cost", "claimed_damages"]:
            if not _is_numeric(value):
                logger.warning("Field '%s' has non-numeric value %r — treating as missing.", field, value)
                missing.append(field)

    found_count = len(mandatory) - len(missing)
    completeness_score = (found_count / len(mandatory)) * 100.0

    logger.info("Validation for %s: %d missing fields. Score: %.1f%%", 
                doc_type, len(missing), completeness_score)

    return missing, completeness_score


def _is_missing(value: object) -> bool:
    """Return True if value represents absence."""
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip().lower() in _EMPTY_SENTINELS
    if isinstance(value, list) and len(value) == 0:
        return True
    return False


def _is_numeric(value: object) -> bool:
    """Return True if value can be parsed as a number."""
    if isinstance(value, (int, float)):
        return True
    if isinstance(value, str):
        cleaned = value.strip().lstrip("$€£¥").replace(",", "")
        try:
            float(cleaned)
            return True
        except ValueError:
            return False
    return False
