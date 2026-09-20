"""Bounded, local design-history replay. No generation or aesthetic oracle."""
import argparse
import hashlib
import json
import math
from pathlib import Path


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def validate(history):
    if history.get("version") != 1:
        raise ValueError("Unsupported history version")
    if digest(history["criteria"]["path"]) != history["criteria"]["sha256"]:
        raise ValueError("Acceptance criteria changed; start a new experiment")
    seen = {}
    for node in history["nodes"]:
        if node["id"] in seen or (node["parent"] and node["parent"] not in seen):
            raise ValueError("Duplicate node or missing earlier parent")
        if not isinstance(node["cost_seconds"], (int, float)) or not math.isfinite(node["cost_seconds"]) or node["cost_seconds"] < 0:
            raise ValueError("Cost must be finite and nonnegative")
        if node["acceptance"] not in ("pending", "accepted", "rejected"):
            raise ValueError("Invalid acceptance")
        if node["acceptance"] != "pending" and node.get("reviewer") != "human":
            raise ValueError("Human acceptance cannot be supplied by a model")
        for artifact in node["artifacts"]:
            if digest(artifact["path"]) != artifact["sha256"]:
                raise ValueError("Recorded artifact changed: " + artifact["path"])
        seen[node["id"]] = node
    if sum(n["cost_seconds"] for n in history["nodes"]) > history.get("budget_seconds", float("inf")):
        raise ValueError("Experiment budget exhausted; preserve excess attempts outside this run")
    if sum(n.get("kind") == "repair" for n in history["nodes"]) > 2:
        raise ValueError("Two repair passes exhausted")
    if sum(n.get("kind") == "direction-reset" for n in history["nodes"]) > 1:
        raise ValueError("Direction reset exhausted")
    return history


def replay(history, policy, budget):
    validate(history)
    # Only pre-attempt action tags influence order. Never sort by outcome/acceptance.
    order = policy.get("priority", [])
    visited, elapsed, accepted, trace = set(), 0, [], []
    nodes = history["nodes"]
    while True:
        available = [n for n in nodes if n["id"] not in visited
                     and (not n["parent"] or n["parent"] in visited)
                     and elapsed + n["cost_seconds"] <= budget]
        if not available:
            break
        node = min(available, key=lambda n: (order.index(n["action"]) if n["action"] in order else len(order), nodes.index(n)))
        visited.add(node["id"])
        elapsed += node["cost_seconds"]
        trace.append(node["id"])
        if node["functional"] == "passed" and node["acceptance"] == "accepted":
            accepted.append(node["id"])
            if policy.get("stop_on_acceptance", True):
                break
    return {"policy": policy["name"], "visited": trace, "recorded_seconds": elapsed,
            "accepted": accepted, "status": "recorded-success" if accepted else "no-recorded-success",
            "scope": "Recorded branches only; no prediction of unseen designs or model improvement"}


def promotion(evidence):
    required = ("fresh_brief", "counterexample_checked", "critical_checks_passed",
                "human_accepted", "preferred_over_frozen", "no_critical_regression")
    missing = [key for key in required if evidence.get(key) is not True]
    return {"status": "eligible-for-maintainer-review" if not missing else "not-supported",
            "missing": missing, "automatic_publish": False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    init = sub.add_parser("init")
    init.add_argument("--out", type=Path, required=True)
    init.add_argument("--criteria", type=Path, required=True)
    init.add_argument("--brief", required=True)
    init.add_argument("--budget", type=float, default=1200)
    add = sub.add_parser("record")
    add.add_argument("--history", type=Path, required=True)
    add.add_argument("--node", type=Path, required=True)
    run = sub.add_parser("replay")
    run.add_argument("--history", type=Path, required=True)
    run.add_argument("--policies", type=Path, required=True)
    run.add_argument("--budget", type=float, required=True)
    promote = sub.add_parser("promotion-check")
    promote.add_argument("--evidence", type=Path, required=True)
    args = parser.parse_args()
    if args.command == "init":
        if not math.isfinite(args.budget) or args.budget <= 0:
            parser.error("Budget must be positive and finite")
        criteria = args.criteria.resolve()
        value = {"version": 1, "brief": args.brief, "budget_seconds": args.budget,
                 "criteria": {"path": str(criteria), "sha256": digest(criteria)}, "nodes": []}
        with args.out.open("x") as f:
            json.dump(value, f, indent=2)
    elif args.command == "record":
        value = validate(json.loads(args.history.read_text()))
        node = json.loads(args.node.read_text())
        node["artifacts"] = [{"path": str(Path(a).resolve()), "sha256": digest(a)} for a in node["artifacts"]]
        value["nodes"].append(node)
        validate(value)
        temporary = args.history.with_suffix(".tmp")
        temporary.write_text(json.dumps(value, indent=2))
        temporary.replace(args.history)
    elif args.command == "replay":
        if not math.isfinite(args.budget) or args.budget <= 0:
            parser.error("Budget must be positive")
        history = json.loads(args.history.read_text())
        print(json.dumps([replay(history, p, args.budget) for p in json.loads(args.policies.read_text())], indent=2))
    else:
        print(json.dumps(promotion(json.loads(args.evidence.read_text())), indent=2))


if __name__ == "__main__":
    main()
