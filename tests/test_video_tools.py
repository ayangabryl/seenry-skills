"""seenry-video mixer and film check on synthetic audio. Skipped without ffmpeg or numpy.

These prove the tools' arithmetic and gates, not how a film looks or sounds.
"""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / 'skills/seenry-video/scripts'
READY = shutil.which('ffmpeg') and shutil.which('ffprobe') and importlib.util.find_spec('numpy')


def tone(path, seconds, freq, volume=.3):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f'sine=frequency={freq}:duration={seconds}',
                    '-af', f'volume={volume}', '-ac', '2', str(path)], check=True)


@unittest.skipUnless(READY, 'needs ffmpeg, ffprobe and numpy')
class VideoTools(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        (self.dir / 'media/vo').mkdir(parents=True)
        tone(self.dir / 'media/music.wav', 12, 220)
        tone(self.dir / 'media/tick.wav', .5, 1800, .8)
        tone(self.dir / 'media/vo/001.00.wav', 1.5, 440)
        tone(self.dir / 'media/vo/003.00.wav', 1.0, 330)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=white:s=320x180:d=6:r=30',
                        '-pix_fmt', 'yuv420p', '-c:v', 'libx264', str(self.dir / 'film.silent.mp4')], check=True)
        self.cues = {'duration': 6, 'video': 'film.silent.mp4', 'out': 'film.mp4',
                     'music': {'file': 'media/music.wav', 'edit': [[0, 2], [6, None]], 'fade_out': .5},
                     'sfx': [{'file': 'media/tick.wav', 'at': 2.0, 'gain': .4, 'count': 3, 'step': .5}],
                     'voice': {'dir': 'media/vo'}}
        self.write('cues.json', self.cues)

    def tearDown(self):
        shutil.rmtree(self.dir)

    def write(self, name, data):
        (self.dir / name).write_text(json.dumps(data), encoding='utf-8')

    def run_tool(self, *args):
        return subprocess.run([sys.executable, *map(str, args)], capture_output=True, text=True, cwd=self.dir)

    def test_mix_masters_to_target_and_check_passes_with_sourced_claims(self):
        self.write('claims.json', [{'time': 2, 'text': '64px', 'kind': 'measured', 'source': 'get_tokens example'},
                                   {'time': 4, 'text': 'build animation', 'kind': 'dramatised'}])
        mixed = self.run_tool(SCRIPTS / 'mix.py', self.dir / 'cues.json')
        self.assertEqual(mixed.returncode, 0, mixed.stderr)
        self.assertTrue((self.dir / 'film.mp4').exists())
        checked = self.run_tool(SCRIPTS / 'film_check.py', self.dir / 'cues.json')
        self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)
        self.assertIn('PASS', checked.stdout)

    def test_check_rejects_unsourced_claims_and_missing_ledger(self):
        self.assertEqual(self.run_tool(SCRIPTS / 'mix.py', self.dir / 'cues.json').returncode, 0)
        missing = self.run_tool(SCRIPTS / 'film_check.py', self.dir / 'cues.json')
        self.assertEqual(missing.returncode, 1)
        self.assertIn('no claims.json', missing.stdout)
        self.write('claims.json', [{'time': 2, 'text': 'Used by 10,000 teams', 'kind': 'quoted'}])
        unsourced = self.run_tool(SCRIPTS / 'film_check.py', self.dir / 'cues.json')
        self.assertEqual(unsourced.returncode, 1)
        self.assertIn('unsourced claim at 2s', unsourced.stdout)

    def test_check_flags_a_voice_line_that_runs_into_the_next(self):
        tone(self.dir / 'media/vo/001.00.wav', 3.0, 440)
        self.write('claims.json', [])
        self.assertEqual(self.run_tool(SCRIPTS / 'mix.py', self.dir / 'cues.json').returncode, 0)
        checked = self.run_tool(SCRIPTS / 'film_check.py', self.dir / 'cues.json')
        self.assertEqual(checked.returncode, 1)
        self.assertIn('runs 1.00s into the next cue', checked.stdout)

    def test_mix_refuses_a_silent_cue_sheet(self):
        self.write('cues.json', {'duration': 6})
        silent = self.run_tool(SCRIPTS / 'mix.py', self.dir / 'cues.json', '--no-video')
        self.assertNotEqual(silent.returncode, 0)
        self.assertIn('silent', silent.stderr)


if __name__ == '__main__':
    unittest.main()
