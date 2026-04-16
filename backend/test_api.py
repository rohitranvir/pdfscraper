"""
test_api.py
-----------
Smoke-test suite for the Insurance Claims Agent backend.

Run with:
    python test_api.py

Requirements:
    pip install httpx

The backend must be running:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import json
import sys
import textwrap

import httpx

BASE_URL = "http://localhost:8000"
PASS     = "\033[92m  PASS\033[0m"
FAIL     = "\033[91m  FAIL\033[0m"
HEADER   = "\033[94m{}\033[0m"
BOLD     = "\033[1m{}\033[0m"

# ─── Helpers ──────────────────────────────────────────────────────────────────

def section(title: str) -> None:
    print()
    print(HEADER.format(f"{'─' * 60}"))
    print(BOLD.format(f"  {title}"))
    print(HEADER.format(f"{'─' * 60}"))


def check(label: str, condition: bool, detail: str = "") -> bool:
    status = PASS if condition else FAIL
    print(f"{status}  {label}")
    if detail:
        for line in textwrap.wrap(detail, width=72):
            print(f"        {line}")
    return condition


def pretty(data) -> str:
    return json.dumps(data, indent=2)[:600] + ("…" if len(json.dumps(data)) > 600 else "")


# ─── Test 1: GET /health ──────────────────────────────────────────────────────

def test_health(client: httpx.Client) -> bool:
    section("TEST 1 — GET /health")
    passed = True

    try:
        r = client.get("/health", timeout=10)
    except httpx.ConnectError:
        print(f"{FAIL}  Could not connect to {BASE_URL}")
        print("        Is the backend running?  uvicorn main:app --reload --port 8000")
        return False

    passed &= check("Status code is 200",        r.status_code == 200,
                    f"Got {r.status_code}")
    passed &= check("Response is JSON",           r.headers.get("content-type", "").startswith("application/json"))

    data = r.json()
    passed &= check("Field 'status' == 'ok'",     data.get("status") == "ok",
                    f"Got: {data.get('status')!r}")
    passed &= check("Field 'model' is present",   "model" in data,
                    f"Got: {data}")

    print(f"\n        Response: {pretty(data)}")
    return passed


# ─── Test 2: POST /api/claims/test ────────────────────────────────────────────

def test_claim_test_endpoint(client: httpx.Client) -> bool:
    section("TEST 2 — POST /api/claims/test (hardcoded FNOL sample)")
    passed = True

    try:
        r = client.post("/api/claims/test", timeout=60)
    except httpx.ReadTimeout:
        print(f"{FAIL}  Request timed out after 60 s (LLM call may have stalled).")
        return False

    passed &= check("Status code is 200",              r.status_code == 200,
                    f"Got {r.status_code}: {r.text[:200]}")

    if r.status_code != 200:
        return passed

    data = r.json()

    # Shape checks
    passed &= check("Response has 'extractedFields'",  "extractedFields"  in data)
    passed &= check("Response has 'missingFields'",    "missingFields"    in data)
    passed &= check("Response has 'recommendedRoute'", "recommendedRoute" in data)
    passed &= check("Response has 'reasoning'",        "reasoning"        in data)

    # Content checks
    ef = data.get("extractedFields", {})
    passed &= check("claim_number extracted",          bool(ef.get("claim_number")),
                    f"Got: {ef.get('claim_number')!r}")
    passed &= check("claimant_name extracted",         bool(ef.get("claimant_name")),
                    f"Got: {ef.get('claimant_name')!r}")
    passed &= check("estimated_damage is numeric",
                    isinstance(ef.get("estimated_damage"), (int, float)),
                    f"Got: {ef.get('estimated_damage')!r}")

    # Routing check — sample has damage $14,500 and no fraud keywords
    route = data.get("recommendedRoute", "")
    passed &= check(
        "Route is 'Fast-track' (damage < $25k, all fields present)",
        route == "Fast-track",
        f"Got: {route!r} — reasoning: {data.get('reasoning', '')[:120]}",
    )
    passed &= check("missingFields list is empty",     data.get("missingFields") == [],
                    f"Got: {data.get('missingFields')}")

    print(f"\n        recommendedRoute : {route}")
    print(f"        reasoning        : {data.get('reasoning', '')[:100]}…")
    print(f"\n        extractedFields (summary):")
    for key in ("claim_number", "claimant_name", "claim_type", "estimated_damage"):
        print(f"          {key:25s}: {ef.get(key)}")

    return passed


# ─── Test 3: GET /api/claims/history ─────────────────────────────────────────

def test_history(client: httpx.Client) -> bool:
    section("TEST 3 — GET /api/claims/history")
    passed = True

    try:
        r = client.get("/api/claims/history", timeout=10)
    except httpx.ConnectError:
        print(f"{FAIL}  Could not connect.")
        return False

    passed &= check("Status code is 200",    r.status_code == 200,
                    f"Got {r.status_code}")

    if r.status_code != 200:
        return passed

    data = r.json()
    passed &= check("Response is a list",    isinstance(data, list))

    if isinstance(data, list) and len(data) > 0:
        first = data[0]
        for field in ("id", "filename", "recommended_route",
                      "missing_fields_count", "processed_at"):
            passed &= check(
                f"Record has field '{field}'",
                field in first,
                f"Keys present: {list(first.keys())}",
            )
        print(f"\n        {len(data)} record(s) returned.")
        print(f"        Most recent: route='{first.get('recommended_route')}', "
              f"filename='{first.get('filename')}', "
              f"at={first.get('processed_at')}")
    else:
        print("        History table is empty (run /test first to populate it).")

    return passed


# ─── Test 4: POST /api/claims/process with non-PDF ───────────────────────────

def test_invalid_upload(client: httpx.Client) -> bool:
    section("TEST 4 — POST /api/claims/process (non-PDF should return 415)")
    passed = True

    fake_content = b"This is a plain text file, not a PDF."
    files = {"file": ("report.txt", fake_content, "text/plain")}

    try:
        r = client.post("/api/claims/process", files=files, timeout=10)
    except httpx.ConnectError:
        print(f"{FAIL}  Could not connect.")
        return False

    passed &= check("Status code is 415 (Unsupported Media Type)",
                    r.status_code == 415,
                    f"Got {r.status_code}: {r.text[:120]}")

    return passed


# ─── Runner ───────────────────────────────────────────────────────────────────

def main() -> None:
    print()
    print(BOLD.format("  Insurance Claims Agent — Smoke Test Suite"))
    print(f"  Target: {BASE_URL}")

    results = {}
    with httpx.Client(base_url=BASE_URL) as client:
        results["health"]          = test_health(client)
        results["test_endpoint"]   = test_claim_test_endpoint(client)
        results["history"]         = test_history(client)
        results["invalid_upload"]  = test_invalid_upload(client)

    # ── Summary ───────────────────────────────────────────────────────────
    section("SUMMARY")
    total  = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed

    for name, ok in results.items():
        status = PASS if ok else FAIL
        print(f"{status}  {name}")

    print()
    if failed == 0:
        print(f"\033[92m  All {total} test suites passed ✓\033[0m")
    else:
        print(f"\033[91m  {failed}/{total} test suite(s) failed\033[0m")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
