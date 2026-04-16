"""
routers/claims.py
-----------------
FastAPI router — exposes all claims-processing endpoints.

Endpoints
---------
POST /api/claims/process   — Upload a PDF, run the full pipeline, persist & return result.
POST /api/claims/test      — No upload needed; runs the pipeline on hardcoded FNOL text.
GET  /api/claims/history   — Returns the last 20 processed claims from SQLite.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from sqlalchemy import desc, select

from models.db import AsyncSessionLocal, claims_history, engine, save_claim
from models.schemas import ClaimResponse, ErrorResponse
from services.claim_router import route_claim
from services.field_validator import validate_fields
from services.llm_extractor import extract_fields
from services.pdf_parser import extract_text

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset(
    {"application/pdf", "application/x-pdf", "binary/octet-stream"}
)
_ALLOWED_EXTENSION: str = ".pdf"
_HISTORY_LIMIT: int = 20

# ---------------------------------------------------------------------------
# Hardcoded FNOL sample — used by /test so devs don't need a real PDF
# ---------------------------------------------------------------------------

_SAMPLE_FNOL_TEXT: str = """
FIRST NOTICE OF LOSS — VEHICLE CLAIM

Claim Number   : CLM-2024-00199
Policy Number  : POL-AUTO-887766
Claimant Name  : Michael J. Torres
Contact Phone  : +1-555-347-9021
Contact Email  : m.torres@email.com

Incident Date  : 2024-07-22
Claim Type     : vehicle
Estimated Damage: 14500

Incident Description:
On the morning of 22 July 2024, while travelling southbound on Interstate 95,
the insured vehicle (2021 Toyota Camry, VIN: 4T1BF1FK5MU123456) was struck from
behind by a white SUV that failed to brake at a red light. The impact caused
significant damage to the rear bumper, trunk, and exhaust system. Local police
attended the scene and a report was filed.

Police Report Number : PR-20240722-0089
Witness: Sarah Nguyen — +1-555-887-2211
Supporting Documents : police_report.pdf, damage_photos.zip, repair_estimate.pdf
""".strip()


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _validate_pdf_upload(file: UploadFile) -> None:
    """
    Raise HTTP 415 if the upload is not a PDF by content-type OR extension.

    Parameters
    ----------
    file:
        The ``UploadFile`` received from the multipart form.

    Raises
    ------
    HTTPException (415)
        When the file is not identifiable as a PDF.
    """
    content_type_ok = file.content_type in _ALLOWED_CONTENT_TYPES
    filename = file.filename or ""
    extension_ok = filename.lower().endswith(_ALLOWED_EXTENSION)

    if not (content_type_ok or extension_ok):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Only PDF files are accepted. "
                f"Received content-type='{file.content_type}', filename='{filename}'."
            ),
        )


async def _run_pipeline(raw_text: str, filename: str | None = None) -> ClaimResponse:
    """
    Execute the full extraction → validation → routing → persistence pipeline.

    Parameters
    ----------
    raw_text:
        Plain text extracted from a PDF (or the hardcoded sample for /test).
    filename:
        Original filename, stored in the DB for audit purposes.

    Returns
    -------
    ClaimResponse
        Fully populated response model ready to be returned to the client.

    Raises
    ------
    HTTPException (422)
        When the LLM extraction or any downstream service fails.
    HTTPException (500)
        On unexpected errors.
    """
    # -- Step 1: LLM field extraction ----------------------------------------
    try:
        extracted: dict[str, Any] = await extract_fields(raw_text)
    except ValueError as exc:
        logger.error("LLM extraction failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Field extraction failed: {exc}",
        ) from exc
    except Exception as exc:
        logger.error("Unexpected error during LLM extraction: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during field extraction.",
        ) from exc

    # -- Step 2: Validate / detect missing fields ----------------------------
    try:
        missing: list[str] = validate_fields(extracted)
    except Exception as exc:
        logger.error("Field validation error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Field validation error: {exc}",
        ) from exc

    # -- Step 3: Route claim -------------------------------------------------
    try:
        routing: dict[str, str] = route_claim(extracted, missing)
    except Exception as exc:
        logger.error("Routing engine error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Routing engine error: {exc}",
        ) from exc

    # -- Step 4: Persist to SQLite -------------------------------------------
    try:
        await save_claim(
            {
                "filename":             filename,
                "recommended_route":    routing["recommendedRoute"],
                "missing_fields_count": len(missing),
                "estimated_damage":     extracted.get("estimated_damage"),
                "claim_type":           extracted.get("claim_type"),
            }
        )
    except Exception as exc:
        # Non-fatal: log and continue — don't fail the request over DB write
        logger.error("Failed to persist claim to SQLite: %s", exc)

    return ClaimResponse(
        extractedFields=extracted,
        missingFields=missing,
        recommendedRoute=routing["recommendedRoute"],
        reasoning=routing["reasoning"],
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/process",
    response_model=ClaimResponse,
    responses={
        415: {"model": ErrorResponse, "description": "Non-PDF file uploaded."},
        422: {"model": ErrorResponse, "description": "Text extraction or LLM failure."},
        500: {"model": ErrorResponse, "description": "Internal server error."},
    },
    summary="Process an insurance claims PDF",
    description=(
        "Upload an FNOL or insurance PDF.  The system extracts structured fields "
        "via Groq LLaMA 3.3-70b, detects missing mandatory fields, applies "
        "deterministic routing rules, saves the result to SQLite, and returns "
        "a ClaimResponse."
    ),
)
async def process_claim(
    file: UploadFile = File(..., description="The insurance / FNOL PDF to process."),
) -> ClaimResponse:
    """
    Full claims-processing pipeline triggered by a PDF upload.

    Steps
    -----
    1. Validate MIME type / file extension.
    2. Read PDF bytes and extract raw text via pdfplumber.
    3. Send raw text to Groq LLaMA for structured field extraction.
    4. Detect missing mandatory fields.
    5. Apply deterministic routing rules.
    6. Persist record to SQLite (non-fatal if DB write fails).
    7. Return ClaimResponse.
    """
    _validate_pdf_upload(file)

    # Read bytes
    try:
        pdf_bytes: bytes = await file.read()
        logger.info("Received file '%s' — %d bytes.", file.filename, len(pdf_bytes))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to read uploaded file: {exc}",
        ) from exc

    # Extract text from PDF
    try:
        raw_text: str = extract_text(pdf_bytes)
    except ValueError as exc:
        logger.warning("PDF text extraction: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error("Unexpected error in PDF parser: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while parsing the PDF.",
        ) from exc

    return await _run_pipeline(raw_text, filename=file.filename)


@router.post(
    "/test",
    response_model=ClaimResponse,
    summary="Test endpoint — no PDF upload required",
    description=(
        "Runs the full extraction → validation → routing pipeline on a "
        "hardcoded sample FNOL document (vehicle claim, damage \\$14,500).  "
        "Useful for verifying the backend is wired correctly without needing "
        "a real PDF."
    ),
)
async def test_claim() -> ClaimResponse:
    """
    Dry-run the pipeline using a built-in sample FNOL document.

    Expected route: Fast-track
    (all fields present, no fraud keywords, damage < 25 000)
    """
    logger.info("Test endpoint called — using hardcoded FNOL sample.")
    return await _run_pipeline(_SAMPLE_FNOL_TEXT, filename="__test_sample__.pdf")


@router.get(
    "/history",
    summary="Retrieve the last 20 processed claims",
    description="Returns the most recently processed claims from the SQLite database, newest first.",
)
async def get_history() -> list[dict]:
    """
    Fetch the last ``_HISTORY_LIMIT`` claim records from ``claims_history``.

    Returns
    -------
    list[dict]
        Each item contains: id, filename, recommended_route, missing_fields_count,
        estimated_damage, claim_type, processed_at (ISO 8601 string).
    """
    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                select(claims_history)
                .order_by(desc(claims_history.c.processed_at))
                .limit(_HISTORY_LIMIT)
            )
            rows = result.mappings().all()
    except Exception as exc:
        logger.error("Failed to fetch claims history: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not retrieve claims history: {exc}",
        ) from exc

    return [
        {
            "id":                   row["id"],
            "filename":             row["filename"],
            "recommended_route":    row["recommended_route"],
            "missing_fields_count": row["missing_fields_count"],
            "estimated_damage":     row["estimated_damage"],
            "claim_type":           row["claim_type"],
            "processed_at":         row["processed_at"].isoformat()
                                    if row["processed_at"] else None,
        }
        for row in rows
    ]
