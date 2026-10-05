import importlib.util
import tempfile
import unittest
from pathlib import Path


script = Path(__file__).resolve().parents[1] / "skills/seenry/scripts/link_targets.py"
spec = importlib.util.spec_from_file_location("link_targets", script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class LinkTargetsTest(unittest.TestCase):
    def test_flags_dead_fragments_and_unverified_contact(self):
        with tempfile.TemporaryDirectory() as directory:
            page = Path(directory) / "replica.html"
            page.write_text('<main id="top"></main><a href="#top">Home</a><a href="#work">Work</a>'
                            '<a href="mailto:hello@example.test">Contact</a>', encoding="utf-8")
            self.assertEqual(
                [(item["href"], item["reason"]) for item in module.inspect(page, set())],
                [("#work", "fragment target absent"),
                 ("mailto:hello@example.test", "destination needs source evidence")],
            )

    def test_verified_target_does_not_clear_a_different_dead_link(self):
        with tempfile.TemporaryDirectory() as directory:
            page = Path(directory) / "replica.html"
            page.write_text('<a href="https://example.test/contact">Contact</a>'
                            '<a href="#missing">Work</a>', encoding="utf-8")
            findings = module.inspect(page, {"https://example.test/contact"})
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0]["href"], "#missing")


if __name__ == "__main__":
    unittest.main()
