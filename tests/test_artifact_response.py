import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('artifact', Path(__file__).resolve().parents[1] / 'skills/seenry/scripts/artifact_response.py')
artifact = importlib.util.module_from_spec(spec)
spec.loader.exec_module(artifact)

class ArtifactResponse(unittest.TestCase):
    def test_preserves_code_and_accepts_only_outer_fence_removal(self):
        html = '<!doctype html><html><head><style>p{color:red}</style></head><body><p title="Quoted">Text</p><script>const x="\\n";</script></body></html>'
        self.assertEqual(artifact.extract(html), html)
        self.assertEqual(artifact.extract('```html\n' + html + '\n```'), html)
    def test_rejects_incomplete_or_miswrapped_transport(self):
        for text in ['<!doctype html><html><head></head><body><header class=',
                     '{"html":"<!doctype html>"}',
                     '<!doctype html><html><head></head><body></body></html> This is perfect!',
                     '<!doctype html><html><head></head><body><script>broken</body></html>']:
            with self.assertRaises(ValueError): artifact.extract(text)

if __name__ == '__main__': unittest.main()
