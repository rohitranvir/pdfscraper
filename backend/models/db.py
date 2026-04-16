"""
models/db.py
------------
Async SQLite persistence layer using SQLAlchemy (async core) + aiosqlite.

Provides:
  - ``engine``        — shared async engine (singleton via module-level init)
  - ``init_db()``     — creates the ``claims_history`` table if absent
  - ``save_claim()``  — inserts a single processed-claim record

The database file path is read from the ``DATABASE_URL`` environment
variable (default: ``sqlite+aiosqlite:///./claims.db`` relative to the
working directory where uvicorn is started).

Table: claims_history
---------------------
| Column               | Type      | Notes                               |
|----------------------|-----------|-------------------------------------|
| id                   | INTEGER   | Primary key, auto-increment         |
| filename             | TEXT      | Original uploaded filename          |
| recommended_route    | TEXT      | One of the ROUTE_* constants        |
| missing_fields_count | INTEGER   | len(missingFields) from response    |
| estimated_damage     | REAL      | Parsed float, NULL if not extracted |
| claim_type           | TEXT      | property/vehicle/injury/liability   |
| doc_type             | TEXT      | The detected document type          |
| processed_at         | TIMESTAMP | UTC timestamp set at insert time    |
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Float, Integer, MetaData, String, Table, insert
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Engine (module-level singleton)
# ---------------------------------------------------------------------------

_DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./claims.db",
)

engine: AsyncEngine = create_async_engine(
    _DATABASE_URL,
    echo=False,   # set True temporarily to log SQL statements
    future=True,
    # NOTE: do NOT pass connect_args={"check_same_thread": False} here.
    # aiosqlite manages its own thread internally; that kwarg is only valid
    # for the synchronous sqlite3 driver and raises TypeError with aiosqlite.
)

# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

metadata = MetaData()

claims_history = Table(
    "claims_history",
    metadata,
    Column("id",                   Integer,  primary_key=True, autoincrement=True),
    Column("filename",             String,   nullable=True),
    Column("recommended_route",    String,   nullable=False),
    Column("missing_fields_count", Integer,  nullable=False, default=0),
    Column("estimated_damage",     Float,    nullable=True),
    Column("claim_type",           String,   nullable=True),
    Column("doc_type",             String,   nullable=True),
    Column(
        "processed_at",
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    ),
)

# ---------------------------------------------------------------------------
# Async session factory (available for future query endpoints)
# ---------------------------------------------------------------------------

AsyncSessionLocal: sessionmaker = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def init_db() -> None:
    """
    Create all tables defined in ``metadata`` if they do not already exist.

    Should be called once at application startup (e.g. from a FastAPI
    ``lifespan`` handler or an ``on_event("startup")`` hook in ``main.py``).

    Raises
    ------
    Exception
        Re-raises any SQLAlchemy or aiosqlite exception so the caller can
        decide whether to abort startup.
    """
    logger.info("Initialising database at '%s'.", _DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(metadata.create_all)
    logger.info("Database tables created / verified.")


async def save_claim(data: dict) -> None:
    """
    Insert a single processed-claim record into ``claims_history``.

    Parameters
    ----------
    data:
        Dictionary with the following keys (all optional unless noted):

        - ``filename``             (str | None)   — uploaded file name
        - ``recommended_route``    (str, required) — routing decision
        - ``missing_fields_count`` (int)           — number of missing fields
        - ``estimated_damage``     (float | None)  — damage estimate
        - ``claim_type``           (str | None)    — claim category
        - ``doc_type``             (str | None)    — detected document classification

    The ``processed_at`` timestamp is always set by the database layer to
    ``datetime.now(timezone.utc)`` and must **not** be supplied by the caller.

    Raises
    ------
    ValueError
        If ``recommended_route`` is absent from *data*.
    Exception
        Re-raises any SQLAlchemy / aiosqlite exception on write failure.
    """
    if not data.get("recommended_route"):
        raise ValueError("'recommended_route' is required in data dict for save_claim().")

    record: dict = {
        "filename":             data.get("filename"),
        "recommended_route":    data["recommended_route"],
        "missing_fields_count": int(data.get("missing_fields_count", 0)),
        "estimated_damage":     _to_float(data.get("estimated_damage")),
        "claim_type":           data.get("claim_type"),
        "doc_type":             data.get("doc_type", "unknown"),
        "processed_at":         datetime.now(timezone.utc),
    }

    logger.debug("Saving claim record: %s", record)

    async with engine.begin() as conn:
        await conn.execute(insert(claims_history).values(**record))

    logger.info(
        "Claim saved — route='%s', filename='%s', damage=%s.",
        record["recommended_route"],
        record["filename"],
        record["estimated_damage"],
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _to_float(value: object) -> float | None:
    """
    Safely convert *value* to ``float`` for storage.

    Returns ``None`` on failure so the column stays NULL rather than raising.

    Parameters
    ----------
    value:
        Any value extracted from the claims fields dict.

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
            return float(value.strip().lstrip("$€£¥").replace(",", ""))
        except ValueError:
            return None
    return None
