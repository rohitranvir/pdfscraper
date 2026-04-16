"""
services/llm_extractor.py
-------------------------
LLM abstraction layer using Groq's API for dynamic document type detection
and structured field extraction.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any
import asyncio

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

logger = logging.getLogger(__name__)

_GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

def _get_client() -> Groq:
    if not _GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY environment variable is not set. Check your .env file.")
    return Groq(api_key=_GROQ_API_KEY)


def _call_groq_json(system_prompt: str, user_message: str) -> dict:
    """Helper to call Groq API and strictly parse JSON output."""
    client = _get_client()
    try:
        completion = client.chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0,  # Deterministic output
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content or ""
        cleaned = raw.strip()
        
        # Clean up markdown JSON fences if the LLM returned them despite JSON mode
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
            cleaned = cleaned.strip()
            
        return json.loads(cleaned)
    except Exception as exc:
        logger.error("Groq JSON API call failed: %s", exc)
        raise ValueError(f"LLM API failure: {exc}") from exc


async def detect_document_type(raw_text: str) -> str:
    """
    Send raw text to Groq and identify what type of document this is.
    
    Returns one of:
    "insurance_claim", "medical_claim", "police_report", 
    "legal_complaint", "property_damage", "accident_report", "unknown"
    """
    system_prompt = """
    You are an expert AI document classifier. Analyze the provided text and classify the document into exactly one of the following types:
    - insurance_claim (ACORD, FNOL, general insurance forms)
    - medical_claim (Hospital discharge, treatment bills)
    - police_report (Official police incident records)
    - legal_complaint (Lawsuits, plaintiff/defendant filings)
    - property_damage (Contractor estimates, property inspection reports)
    - accident_report (General accident description not directly an insurance or police form)
    - unknown (Any other type of text that doesn't fit the above)
    
    Return ONLY a JSON object with a single key 'document_type' containing the exact classification string.
    """
    # Just send the first chunk of text to save tokens, usually enough to identify doc type
    user_message = f"--- DOCUMENT TEXT ---\n{raw_text[:3000]}\n--- END ---"
    
    try:
        data = await asyncio.to_thread(_call_groq_json, system_prompt, user_message)
        doc_type = data.get("document_type", "unknown")
        logger.info("Detected document type: %s", doc_type)
        return doc_type
    except Exception as exc:
        logger.error("Failed to detect document type: %s", exc)
        return "unknown"


async def extract_fields(raw_text: str, doc_type: str) -> dict[str, Any]:
    """
    Based on the document type, use a different extraction prompt to pull out
    dynamic sets of fields.
    
    Returns a predictable structure:
    {
      "documentType": str,
      "extractedFields": dict,
      "confidence": "high" | "medium" | "low"
    }
    """
    
    # 1. Provide specific instructions based on doc_type
    if doc_type == "insurance_claim":
        instructions = "Extract: policy_number, claimant_name, incident_date, estimated_damage, claim_type, incident_description, claim_number, contact_phone, contact_email."
    elif doc_type == "medical_claim":
        instructions = "Extract: patient_name, diagnosis, treatment_date, hospital_name, doctor_name, estimated_cost, insurance_id."
    elif doc_type == "police_report":
        instructions = "Extract: report_number, officer_name, incident_date, location, involved_parties, incident_description, case_status."
    elif doc_type == "legal_complaint":
        instructions = "Extract: case_number, plaintiff, defendant, filing_date, court_name, complaint_description, claimed_damages."
    elif doc_type == "property_damage":
        instructions = "Extract: property_address, owner_name, damage_type, incident_date, estimated_repair_cost, contractor_estimate, insurance_carrier."
    else:
        instructions = "Extract whatever key entities and meaningful data fields are present in the text dynamically. Return them as key-value pairs."

    # 2. Build the full system prompt
    system_prompt = f"""
    You are an expert OCR and data extraction agent. 
    Your task is to extract structured information from the provided raw text, knowing that it is classified as a '{doc_type}'.
    
    {instructions}
    
    CRITICAL RULES:
    1. If a value is present anywhere in the text in any format, extract it. Only set an object key to null if it is truly absent.
    2. Fields may appear anywhere, not just as labeled fields.
    3. For estimated damage/costs, always return as a plain number (e.g. 12000), no currency symbols.
    4. You MUST output valid JSON matching this exact structure:
    {{
      "documentType": "{doc_type}",
      "extractedFields": {{
            // your extracted key-value pairs go here
      }},
      "confidence": "high" // or "medium" or "low" based on extraction quality
    }}
    """
    
    user_message = f"--- DOCUMENT TEXT ---\n{raw_text}\n--- END ---"
    
    try:
        data = await asyncio.to_thread(_call_groq_json, system_prompt, user_message)
        
        # Ensure we always return the expected 3-part dictionary format
        return {
            "documentType": data.get("documentType", doc_type),
            "extractedFields": data.get("extractedFields", {}),
            "confidence": data.get("confidence", "low")
        }
    except Exception as exc:
        logger.error("Failed to extract fields for document type '%s': %s", doc_type, exc)
        raise
