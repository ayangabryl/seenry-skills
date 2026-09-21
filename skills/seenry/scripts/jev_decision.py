"""Optional, bounded TypeSafe choice experiment. Dry-run unless --live is supplied."""
import argparse
from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import json
import math
import os
from pathlib import Path
import time
import urllib.error
import urllib.request

MODEL = "jev-1.13.0"
ENDPOINT = "https://api.typesafe.ai/v1/systemone"
# Published 2026-09-22: $0.042 / million input tokens, output free, 64k context.
# Reserve a full maximum-sized request even if it fails or usage is unavailable.
RESERVATION = Decimal("0.002752512")  # 65,536 * 0.042 / 1,000,000
BUDGET = Decimal("0.05")
MAX_CALLS = 12


def prepare(source):
    if set(source) != {"state", "questions"}:
        raise ValueError("Input must contain exactly state and questions")
    if not isinstance(source["state"], (str, dict, list)):
        raise ValueError("State must be text, an object or an array")
    questions = source["questions"]
    if not isinstance(questions, dict) or not 1 <= len(questions) <= 8:
        raise ValueError("Supply 1–8 independent Choice questions")
    for q in questions.values():
        if not isinstance(q, dict) or set(q) != {"type", "instructions", "criteria"}:
            raise ValueError("Each question needs type, instructions and criteria")
        if q["type"] != "choice" or not isinstance(q["instructions"], str) or not q["instructions"].strip():
            raise ValueError("This pilot supports Choice with explicit text instructions")
        criteria = q["criteria"]
        if not isinstance(criteria, dict) or not 2 <= len(criteria) <= 12 or "none" not in criteria:
            raise ValueError("Supply 2–12 choices including a none outcome")
        if any(not isinstance(k, str) or not isinstance(v, str) or not v.strip() for k,v in criteria.items()):
            raise ValueError("Each choice needs a text description")
    payload = dict(source, model=MODEL)
    encoded = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8")
    if len(encoded) > 24000:
        raise ValueError("Pilot request exceeds 24,000 UTF-8 bytes")
    if b"apikey_" in encoded or b"Bearer " in encoded:
        raise ValueError("Do not put credentials in experiment state")
    return payload, encoded


def validate_response(response, payload):
    if response.get("model") != MODEL:
        raise ValueError("Unexpected model version; review pricing before continuing")
    answers = response.get("answers")
    if not isinstance(answers, dict) or set(answers) != set(payload["questions"]):
        raise ValueError("Missing or unexpected answers")
    for name, question in payload["questions"].items():
        answer = answers[name]
        allowed = set(question["criteria"])
        if answer.get("type") != "choice" or answer.get("choice") not in allowed:
            raise ValueError("Invalid choice; never use it as executable code")
        probs = answer.get("probabilities", {})
        if set(probs) != allowed or any(type(v) not in (int,float) or not math.isfinite(v) or not 0 <= v <= 1 for v in probs.values()):
            raise ValueError("Invalid probability distribution")
        if not math.isclose(sum(probs.values()), 1, abs_tol=0.02):
            raise ValueError("Probability distribution does not sum to one")
        confidence = answer.get("confidence")
        if type(confidence) not in (int,float) or not math.isfinite(confidence) or not 0 <= confidence <= 1:
            raise ValueError("Invalid confidence")
    usage = response.get("usage", {})
    for field in ("input_tokens", "output_tokens"):
        if type(usage.get(field)) is not int or usage[field] < 0:
            raise ValueError("Missing or invalid usage")
    if usage["input_tokens"] > 65536:
        raise ValueError("Usage exceeded the reserved model context; stop the pilot")
    return response


def reserve(ledger, *, max_calls=MAX_CALLS, budget=BUDGET):
    if type(max_calls) is not int or not 1 <= max_calls <= 200 or not Decimal(0) < budget <= Decimal("5"):
        raise ValueError("Invalid explicitly configured experiment limit")
    ledger.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    lock = ledger.with_suffix(".lock")
    fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    try:
        rows = [json.loads(line) for line in ledger.read_text().splitlines()] if ledger.exists() else []
        total = sum((Decimal(row["reserved_usd"]) for row in rows), Decimal(0))
        if len(rows) >= max_calls or total + RESERVATION > budget:
            raise ValueError("Pilot budget exhausted; do not reset the ledger to retry")
        entry = {"at": datetime.now(timezone.utc).isoformat(), "reserved_usd": str(RESERVATION), "model": MODEL}
        with ledger.open("a", encoding="utf-8") as stream:
            os.chmod(ledger, 0o600)
            stream.write(json.dumps(entry) + "\n")
    finally:
        os.close(fd)
        lock.unlink()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def evaluate(payload, encoded, key, ledger, *, max_calls=MAX_CALLS, budget=BUDGET):
    reserve(ledger, max_calls=max_calls, budget=budget)
    request = urllib.request.Request(ENDPOINT, data=encoded, headers={
        "Authorization": "Bearer " + key, "Content-Type": "application/json"})
    started = time.monotonic()
    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=30) as response:
            raw = response.read(262145)
        if len(raw) > 262144:
            raise ValueError("Oversized response")
        result = validate_response(json.loads(raw), payload)
    except urllib.error.HTTPError as exc:
        # Do not log provider bodies, which might echo request content.
        raise ValueError(f"TypeSafe HTTP {exc.code}; no automatic retry; reservation retained") from None
    except (urllib.error.URLError, TimeoutError):
        raise ValueError("TypeSafe connection failed; no automatic retry; reservation retained") from None
    return {"provider": "typesafe", "live": True, "model": result["model"],
            "request_sha256": hashlib.sha256(encoded).hexdigest(),
            "elapsed_ms": round((time.monotonic()-started)*1000),
            "answers": result["answers"], "usage": result["usage"],
            "estimated_usd": str(Decimal(result["usage"]["input_tokens"])*Decimal("0.042")/1000000),
            "visual_quality": "unverified", "human_acceptance": "pending"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()
    try:
        if args.output.exists():
            raise ValueError("Output exists; use a new filename to preserve evidence")
        payload, encoded = prepare(json.loads(args.input.read_text(encoding="utf-8")))
        result = {"live": False, "request": payload, "request_bytes": len(encoded),
                  "reserved_per_call_usd": str(RESERVATION), "visual_quality": "unverified"}
        if args.live:
            key_path = Path.home()/".config/seenry/typesafe-api-key"
            key = os.environ.get("TYPESAFE_API_KEY", "").strip()
            if not key and key_path.is_file():
                if os.name == "posix" and key_path.stat().st_mode & 0o077:
                    raise ValueError("Credential file must have mode 600")
                key = key_path.read_text().strip()
            if not key or any(ch.isspace() for ch in key):
                raise ValueError("Set TYPESAFE_API_KEY or ~/.config/seenry/typesafe-api-key; never put it in the repo")
            result = evaluate(payload, encoded, key, Path.home()/".local/state/seenry/jev-pilot.jsonl")
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("x", encoding="utf-8") as stream:
            json.dump(result, stream, indent=2, ensure_ascii=False, allow_nan=False)
            stream.write("\n")
        print(f"Saved {'live decision' if args.live else 'dry-run request'}: {args.output}")
    except (OSError, ValueError, TypeError, KeyError) as exc:
        parser.exit(1, f"Stopped: {exc}\n")


if __name__ == "__main__":
    main()
