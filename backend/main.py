"""
main.py
-------
Entry point for the Autonomous Insurance Claims Processing Agent API.

Startup sequence
----------------
1. Load .env (GROQ_API_KEY, DATABASE_URL, etc.)
2. Create FastAPI app with lifespan handler → calls init_db()
3. Register CORS middleware
4. Mount /api/claims router
5. Expose GET /health

Run with uvicorn
----------------
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.db import init_db
from models.schemas import HealthResponse
from routers import claims

# ---------------------------------------------------------------------------
# Environment — load before anything else reads os.getenv()
# ---------------------------------------------------------------------------
load_dotenv()

_MODEL_NAME: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown hooks
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.

    Startup  : Initialise the SQLite database (creates tables if absent).
    Shutdown : Nothing to clean up for now — add connection-pool disposal
               here if you switch to PostgreSQL.
    """
    await init_db()
    yield


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    lifespan=lifespan,
    title="Insurance Claims Agent",
    description=(
        "Autonomous AI-powered insurance claims processing. "
        "Extracts structured fields from FNOL PDFs using Groq LLaMA 3.3-70b, "
        "detects missing data, and routes claims via deterministic rules."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------------------------
# CORS middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # CRA / alternate dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(claims.router, prefix="/api/claims", tags=["Claims"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Liveness check",
    description="Returns the API status and the active LLM model name.",
)
async def health_check() -> dict:
    """
    Confirm the API is alive and return the active Groq model identifier.

    Returns
    -------
    dict
        ``{"status": "ok", "model": "<model-name>"}``
    """
    return {"status": "ok", "model": _MODEL_NAME}


# ---------------------------------------------------------------------------
# Dev entrypoint (uvicorn direct launch)
# ---------------------------------------------------------------------------

# To start the server locally run:
#
#   uvicorn main:app --reload --host 0.0.0.0 --port 8000
#
# Swagger UI → http://localhost:8000/docs
# ReDoc      → http://localhost:8000/redoc
# Health     → http://localhost:8000/health

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
