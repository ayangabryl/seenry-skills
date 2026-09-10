import hashlib
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class CapturePreservation(unittest.TestCase):
    @unittest.skipUnless(shutil.which('node'), 'Node is not installed')
    def test_recheck_cannot_overwrite_prior_capture_directory(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / 'evidence'
            output.mkdir()
            capture = output / 'opening.png'
            capture.write_bytes(b'Previously cited image bytes')
            before = hashlib.sha256(capture.read_bytes()).hexdigest()
            result = subprocess.run([
                shutil.which('node'), str(ROOT / 'skills/seenry/scripts/browser_evidence.mjs'),
                '--url', 'http://127.0.0.1:1/', '--out', str(output),
                '--playwright', str(Path(temporary) / 'missing-runtime.mjs')
            ], capture_output=True, text=True, timeout=10)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Use a new output directory', result.stderr)
            self.assertEqual(hashlib.sha256(capture.read_bytes()).hexdigest(), before)
            self.assertEqual([p.name for p in output.iterdir()], ['opening.png'])


if __name__ == '__main__':
    unittest.main()
