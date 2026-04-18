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
    Top-level response returned by POST /api/claims/process and /api/claims/test.
    """

    documentType: str = Field(
        ...,
        description="The identified type of document.",
        examples=["insurance_claim", "medical_claim", "police_report", "unknown"]
    )
    
    confidence: str = Field(
        ...,
        description="Confidence level of the LLM extraction.",
        examples=["high", "medium", "low"]
    )

    completenessScore: int = Field(
        ...,
        description="Score between 0 and 100 representing how many mandatory fields were found.",
        examples=[100, 85, 0]
    )

    extractedFields: dict[str, Any] = Field(
        ...,
        description="Dictionary of all fields extracted from the PDF by the LLM.",
        examples=[
            {
                "claim_number": "CLM-2024-00123",
                "estimated_damage": 18000.0,
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
        description="Routing decision based on rules.",
        examples=["Fast-track"],
    )

    reasoning: str = Field(
        ...,
        description="Plain-text explanation of the routing decision.",
        examples=["All mandatory fields are present. Route to Fast-track."],
    )


# ---------------------------------------------------------------------------
# Error
# ---------------------------------------------------------------------------


class ErrorResponse(BaseModel):
    """Standard error envelope returned on 4xx / 5xx responses."""

    detail: str = Field(..., description="Human-readable error message.")


# ---------------------------------------------------------------------------
# Action Endpoints
# ---------------------------------------------------------------------------

class DispatchRequest(BaseModel):
    claim_id: str
    route: str
    extractedFields: dict[str, Any]

class ActionResponse(BaseModel):
    success: bool
    message: str
    claim_id: str | None = None
    dispatched_at: str | None = None

class OverrideRequest(BaseModel):
    claim_id: str
    reason: str

class DiscardRequest(BaseModel):
    claim_id: str

class AnalyticsResponse(BaseModel):
    total_claims: int
    fast_track_count: int
    manual_review_count: int
    investigation_count: int
    specialist_count: int
    standard_count: int
    avg_completeness_score: float
    recent_claims: list[dict[str, Any]]
