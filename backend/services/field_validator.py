"""
services/field_validator.py
----------------------------
Deterministic, zero-LLM validation of extracted claim fields.

Checks every mandatory field for absence, emptiness, or placeholder sentinel
values (``None``, ``""``, ``"UNKNOWN"``).  Also verifies that
``estimated_damage``, when present, is a real numeric value.

No external dependencies beyond the Python standard library.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Field definitions
# ---------------------------------------------------------------------------

MANDATORY_FIELDS: list[str] = [
    "claim_number",
    "claimant_name",
    "policy_number",
    "incident_date",
    "incident_description",
    "claim_type",
    "estimated_damage",
]

# String values that count as "not provided" even when the key exists.
# Checked case-insensitively so "unknown", "Unknown", "UNKNOWN" all match.
_EMPTY_SENTINELS: frozenset[str] = frozenset({"unknown", "", "null", "none", "n/a", "na", "not provided"})


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def validate_fields(fields: dict) -> list[str]:
    """
    Return the names of mandatory fields that are absent, empty, or invalid.

    A mandatory field is considered missing when its value is:
    - ``None``
    - An empty string ``""``
    - A sentinel string such as ``"UNKNOWN"``, ``"null"``, ``"N/A"`` etc.
      (compared case-insensitively).

    Additionally, ``estimated_damage`` is validated to be numeric (``int`` or
    ``float``).  If the value is a non-numeric string (e.g. ``"TBD"``) it is
    also added to the missing list.

    Parameters
    ----------
    fields:
        Normalised extraction dict returned by ``llm_extractor.extract_fields``.

    Returns
    -------
    list[str]
        Ordered list of missing mandatory field names.  An empty list means
        all mandatory fields are present and valid.

    Examples
    --------
    >>> validate_fields({"claim_number": "CLM-001", "claimant_name": None, ...})
    ['claimant_name', ...]

    >>> validate_fields({"estimated_damage": "not sure", ...})
    [..., 'estimated_damage']
    """
    missing: list[str] = []

    for field in MANDATORY_FIELDS:
        value = fields.get(field)

        if field == "estimated_damage":
            # Special numeric validation — runs even when value is not None
            if _is_missing(value):
                logger.debug("Mandatory field '%s' is absent/empty.", field)
                missing.append(field)
            elif not _is_numeric(value):
                logger.warning(
                    "Field 'estimated_damage' has non-numeric value %r — treating as missing.",
                    value,
                )
                missing.append(field)
        else:
            if _is_missing(value):
                logger.debug("Mandatory field '%s' is absent/empty.", field)
                missing.append(field)

    if missing:
        logger.info("Missing / invalid mandatory fields (%d): %s", len(missing), missing)
    else:
        logger.info("All %d mandatory fields passed validation.", len(MANDATORY_FIELDS))

    return missing


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _is_missing(value: object) -> bool:
    """
    Return ``True`` when *value* should be treated as not provided.

    Parameters
    ----------
    value:
        Raw value from the extraction dict (any type).

    Returns
    -------
    bool
    """
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip().lower() in _EMPTY_SENTINELS
    return False


def _is_numeric(value: object) -> bool:
    """
    Return ``True`` when *value* can be interpreted as a valid number.

    Accepts ``int``, ``float``, and numeric strings (with optional leading
    currency symbols or comma separators that the LLM sometimes includes).

    Parameters
    ----------
    value:
        Raw value from the extraction dict.

    Returns
    -------
    bool
    """
    if isinstance(value, (int, float)):
        return True
    if isinstance(value, str):
        # Strip common currency / formatting characters then attempt parse
        cleaned = value.strip().lstrip("$€£¥").replace(",", "")
        try:
            float(cleaned)
            return True
        except ValueError:
            return False
    return False
