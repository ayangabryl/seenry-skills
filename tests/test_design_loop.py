import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("design_loop", Path(__file__).parents[1] / "scripts/design_loop.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class ReplayTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.file = Path(self.tmp.name) / "criteria.txt"
        self.file.write_text("Fixed human gate")
        self.h = {"version": 1, "criteria": {"path": str(self.file), "sha256": m.digest(self.file)}, "nodes": []}
    def node(self, id, parent=None, action="layout", accepted=False, cost=10):
        return {"id": id, "parent": parent, "action": action, "cost_seconds": cost,
                "functional": "passed", "acceptance": "accepted" if accepted else "rejected",
                "reviewer": "human", "artifacts": []}
    def test_cannot_replay_unseen_or_skip_parent(self):
        self.h["nodes"] = [self.node("root"), self.node("child", "root", "motion", True)]
        r = m.replay(self.h, {"name": "motion-first", "priority": ["motion"]}, 10)
        self.assertEqual(r["visited"], ["root"])
        self.assertEqual(r["accepted"], [])
    def test_no_outcome_leak_in_order(self):
        self.h["nodes"] = [self.node("bad"), self.node("good", accepted=True)]
        self.assertEqual(m.replay(self.h, {"name": "chronological"}, 10)["visited"], ["bad"])
    def test_pending_is_not_accepted(self):
        n = self.node("a"); n.update(acceptance="pending", reviewer="model")
        self.h["nodes"] = [n]
        self.assertEqual(m.replay(self.h, {"name": "a"}, 20)["status"], "no-recorded-success")
    def test_criteria_tampering_fails(self):
        self.file.write_text("Relaxed gate")
        with self.assertRaises(ValueError): m.validate(self.h)
    def test_model_cannot_approve(self):
        n = self.node("a", accepted=True); n["reviewer"] = "model"; self.h["nodes"] = [n]
        with self.assertRaises(ValueError): m.validate(self.h)
    def test_artifact_tampering_fails(self):
        n = self.node("a"); n["artifacts"] = [{"path": str(self.file), "sha256": "wrong"}]; self.h["nodes"] = [n]
        with self.assertRaises(ValueError): m.validate(self.h)
    def test_functional_failure_blocks_success(self):
        n = self.node("a", accepted=True); n["functional"] = "failed"; self.h["nodes"] = [n]
        self.assertEqual(m.replay(self.h, {"name": "a"}, 20)["accepted"], [])
    def test_budget_and_repair_limit(self):
        self.h["budget_seconds"] = 5
        self.h["nodes"] = [self.node("a")]
        with self.assertRaises(ValueError): m.validate(self.h)
        self.h["budget_seconds"] = 100
        self.h["nodes"] = [dict(self.node(str(i)), kind="repair") for i in range(3)]
        with self.assertRaises(ValueError): m.validate(self.h)
    def test_promotion_requires_transfer(self):
        self.assertEqual(m.promotion({"human_accepted": True})["status"], "not-supported")

if __name__ == "__main__": unittest.main()
