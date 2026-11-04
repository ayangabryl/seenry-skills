import json
import subprocess
import tempfile
import unittest
from pathlib import Path

PICK = Path(__file__).resolve().parents[1] / "skills/seenry/scripts/pick.mjs"
SKETCH = PICK.with_name("sketch.mjs")


class PickPersonTest(unittest.TestCase):
    def run_pick(self, tmp, *extra):
        for name in ("a", "b", "c"):
            (tmp / f"{name}.html").write_text(f"<p>{name}</p>")
        files = [str(tmp / f"{n}.html") for n in ("a", "b", "c")]
        return subprocess.run(["node", str(PICK), *files, "--out", str(tmp / "out"), *extra], capture_output=True, text=True)

    def test_records_the_persons_choice(self):
        with tempfile.TemporaryDirectory() as d:
            tmp = Path(d)
            result = self.run_pick(tmp, "--person", "c", "--why", "calmer")
            self.assertEqual(result.returncode, 0, result.stderr)
            pick = json.loads((tmp / "out/pick.json").read_text())
            self.assertEqual(pick["by"], "person")
            self.assertEqual(pick["ranking"][0], "C")
            self.assertEqual(pick["winner_why"], "calmer")

    def test_rejects_an_unknown_label(self):
        with tempfile.TemporaryDirectory() as d:
            tmp = Path(d)
            result = self.run_pick(tmp, "--person", "e")
            self.assertEqual(result.returncode, 2)
            self.assertFalse((tmp / "out/pick.json").exists())


class SketchTest(unittest.TestCase):
    def test_writes_a_labelled_board(self):
        with tempfile.TemporaryDirectory() as d:
            tmp = Path(d)
            for name in ("a", "b"):
                (tmp / f"{name}.html").write_text(f"<p>{name}</p>")
            result = subprocess.run(["node", str(SKETCH), str(tmp / "a.html"), str(tmp / "b.html"), "--captions", "Flat|Raised", "--recommend", "a", "--out", str(tmp / "s"), "--playwright", "/nonexistent.mjs"], capture_output=True, text=True)
            board = (tmp / "s/board.html").read_text() if (tmp / "s/board.html").exists() else ""
            self.assertIn("A · Flat (recommended)", board, result.stderr)
            self.assertIn("B · Raised", board)
            self.assertIn('src="../a.html"', board)


if __name__ == "__main__":
    unittest.main()
