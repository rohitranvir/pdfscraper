"""
services/pdf_parser.py
-----------------------
Extracts raw text from a PDF file using pdfplumber.

This module contains zero LLM logic — its only responsibility is turning
binary PDF bytes into a single clean string so that upstream services can
send it to the language model.
"""

from __future__ import annotations

import io
import logging
import re

import pdfplumber

logger = logging.getLogger(__name__)

# Minimum number of characters required before we consider the extraction
# useful.  Documents with fewer characters are assumed to be scanned /
# image-based and cannot be processed without OCR.
_MIN_TEXT_LENGTH: int = 50


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def extract_text(file_bytes: bytes) -> str:
    """
    Extract all selectable text from a PDF document.

    Iterates over every page, pulls the plain text (preserving whitespace
    layout where possible), joins pages with a newline separator, then strips
    redundant blank lines and leading/trailing whitespace.

    Parameters
    ----------
    file_bytes:
        Raw bytes of the PDF as read from an uploaded file or file handle.

    Returns
    -------
    str
        Cleaned, concatenated text from all pages.

    Raises
    ------
    ValueError
        If pdfplumber cannot open the bytes as a valid PDF, or if the total
        extracted text is shorter than ``_MIN_TEXT_LENGTH`` characters
        (indicating a scanned / image-only PDF).
    """
    logger.info("Starting PDF text extraction (%d bytes).", len(file_bytes))

    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            total_pages = len(pdf.pages)
            logger.info("PDF opened successfully — %d page(s) detected.", total_pages)

            page_texts: list[str] = []
            for page_num, page in enumerate(pdf.pages, start=1):
                text: str | None = page.extract_text()
                if text:
                    page_texts.append(text)
                    logger.debug(
                        "Page %d/%d: extracted %d chars.",
                        page_num, total_pages, len(text),
                    )
                else:
                    logger.warning(
                        "Page %d/%d: no selectable text found "
                        "(may be an image or blank page).",
                        page_num, total_pages,
                    )
    except Exception as exc:
        logger.error("pdfplumber failed to open/read the PDF: %s", exc)
        raise ValueError(f"Could not parse PDF file: {exc}") from exc

    # Join pages with a single newline so page boundaries stay visible to
    # the LLM without introducing excessive blank space.
    raw_combined: str = "\n".join(page_texts)

    # Clean: collapse runs of 3+ newlines down to 2, strip leading/trailing
    # whitespace, and remove non-printable control characters (except \n \t).
    cleaned: str = _clean_text(raw_combined)

    logger.info(
        "Extraction complete — %d page(s) yielded text, total %d chars after cleaning.",
        len(page_texts), len(cleaned),
    )

    # Sanity-check: scanned PDFs produce little or no text
    if len(cleaned) < _MIN_TEXT_LENGTH:
        raise ValueError(
            "PDF appears to be scanned or image-based. "
            "OCR not supported in v1."
        )

    return cleaned


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _clean_text(text: str) -> str:
    """
    Remove noise from concatenated page text.

    Steps
    -----
    1. Strip leading/trailing whitespace from the whole string.
    2. Remove non-printable control characters (except ``\\n`` and ``\\t``).
    3. Collapse runs of three or more consecutive newlines to two newlines
       so the LLM prompt stays compact.
    4. Strip trailing whitespace from every individual line.

    Parameters
    ----------
    text:
        Raw concatenated text from all PDF pages.

    Returns
    -------
    str
        Cleaned text ready for the LLM prompt.
    """
    # Remove control chars except newline (0x0A) and tab (0x09)
    text = re.sub(r"[^\x09\x0A\x20-\x7E\u00A0-\uFFFF]", "", text)

    # Strip trailing spaces on each line
    lines = [line.rstrip() for line in text.splitlines()]
    text = "\n".join(lines)

    # Collapse 3+ consecutive blank lines → 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()
