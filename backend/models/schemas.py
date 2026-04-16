"""
models/schemas.py
-----------------
Pydantic v2 models (request / response shapes) for the Claims Processing API.
All serialisation, validation, and OpenAPI schema generation is derived from
these models — no ad-hoc dicts should cross the API boundary.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Shared / primitives
# ---------------------------------------------------------------------------


class HealthResponse(BaseModel):
    """Liveness-check response returned by GET /health."""

    status: str = Field(
        ...,
        description="'ok' when the service is healthy.",
        examples=["ok"],
    )
    model: str | None = Field(
        default=None,
        description="Active Groq LLM model identifier.",
        examples=["llama-3.3-70b-versatile"],
    )


# ---------------------------------------------------------------------------
# Claims processing
# ---------------------------------------------------------------------------


class ClaimResponse(BaseModel):
    """
    Top-level response returned by POST /api/claims/process.

    Attributes
    ----------
    extractedFields:
        Dictionary of all fields extracted from the PDF by the LLM.
        Keys are field names (e.g. ``"claim_number"``, ``"estimated_damage"``);
        values are the extracted values or ``None`` when not found.
    missingFields:
        List of mandatory field names that were either absent from the document
        or could not be extracted with sufficient confidence.
    recommendedRoute:
        One of: ``"Fast-track"``, ``"Manual Review"``,
        ``"Investigation Flag"``, ``"Specialist Queue"``,
        ``"Standard Review"``.
    reasoning:
        Human-readable explanation of why a particular route was chosen,
        including which rules fired and which fields influenced the decision.
    """

    extractedFields: dict[str, Any] = Field(
        ...,
        description="All fields extracted from the PDF by the LLM.",
        examples=[
            {
                "claim_number": "CLM-2024-00123",
                "claimant_name": "Jane Doe",
                "policy_number": "POL-987654",
                "incident_date": "2024-03-15",
                "incident_description": "Vehicle collision at highway junction.",
                "claim_type": "vehicle",
                "estimated_damage": 18000.0,
                "contact_phone": "+1-555-0100",
                "contact_email": "jane.doe@example.com",
                "witness_info": None,
                "police_report_number": "PR-20240315-042",
                "supporting_docs": ["photos.zip"],
            }
        ],
    )

    missingFields: list[str] = Field(
        ...,
        description="Mandatory field names that could not be extracted.",
        examples=[["witness_info"]],
    )

    recommendedRoute: str = Field(
        ...,
        description=(
            "Routing decision. One of: Fast-track | Manual Review | "
            "Investigation Flag | Specialist Queue | Standard Review."
        ),
        examples=["Fast-track"],
    )

    reasoning: str = Field(
        ...,
        description="Plain-text explanation of the routing decision.",
        examples=[
            "All mandatory fields are present. Estimated damage (18,000) is "
            "below the 25,000 threshold and claim type is not injury. "
            "No fraud indicators detected — routed to Fast-track."
        ],
    )


# ---------------------------------------------------------------------------
# Error
# ---------------------------------------------------------------------------


class ErrorResponse(BaseModel):
    """Standard error envelope returned on 4xx / 5xx responses."""

    detail: str = Field(..., description="Human-readable error message.")
