import importlib.util
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('video_frames', ROOT / 'skills/seenry-motion/scripts/video_frames.py')
video = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(video)


class InputBounds(unittest.TestCase):
    def test_rejects_remote_media_and_secret_bearing_source_urls(self):
        with self.assertRaisesRegex(ValueError, 'local video'):
            video.local_video('https://example.com/a.mp4')
        for source in ('https://user:secret@example.com/a', 'https://example.com/a?token=secret',
                       'https://example.com/a#secret', 'javascript:alert(1)', 'file:///private/a', 'https://example.com/\nsecret'):
            with self.subTest(source=source), self.assertRaises(ValueError):
                video.source_reference(source)
        self.assertEqual(video.source_reference('seenry:journey/123'), 'seenry:journey/123')

    def test_modes_and_budgets_are_explicit(self):
        for args in ({}, {'times': [float('nan')]}, {'times': [0, 31]}, {'times': [-1]},
                     {'every_frame': True, 'start': 0, 'end': 6}, {'every_frame': True, 'start': 0},
                     {'times': [0], 'max_frames': 97}, {'times': [0], 'start': 0}):
            with self.subTest(args=args), self.assertRaises(ValueError):
                video.selection(**args)


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'ffmpeg and ffprobe unavailable')
class LocalVideoEvidence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='seenry-frame-test-')
        cls.root = Path(cls.temp.name)
        cls.source = cls.root / 'variable.mp4'
        # Real variable presentation times, B-frames, and nonzero source origin.
        subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i',
                        'testsrc2=size=160x90:rate=10:duration=2', '-vf', "select='not(between(n,3,5))'",
                        '-fps_mode', 'vfr', '-c:v', 'mpeg4', '-bf', '2', '-pix_fmt', 'yuv420p',
                        '-output_ts_offset', '3', str(cls.source)], check=True, capture_output=True, timeout=30)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_selected_times_preserve_actual_pts_and_source_hash(self):
        out = self.root / 'selected'
        report = video.extract_video(self.source, out, times=[0.05, 0.31, 0.35, 1.31], source='seenry:fixture')
        self.assertEqual([f['relative_timestamp_seconds'] for f in report['frames']], [0.1, 0.6, 1.4])
        self.assertEqual(report['frames'][1]['requested_times_seconds'], [0.31, 0.35])
        self.assertAlmostEqual(report['frames'][1]['source_pts_seconds'], 3.6)
        self.assertEqual(report['source']['sha256'], video.digest(self.source))
        self.assertFalse(report['playback_reviewed'])
        self.assertEqual(json.loads((out / 'manifest.json').read_text()), report)
        self.assertIn('crypto.subtle.digest', (out / 'contact-sheet.html').read_text())
        self.assertNotIn(str(self.root), (out / 'contact-sheet.html').read_text())
        self.assertTrue(all((out / f['file']).read_bytes().startswith(b'\x89PNG') for f in report['frames']))

    def test_every_frame_retains_gaps_and_excludes_endpoint(self):
        report = video.extract_video(self.source, self.root / 'all', every_frame=True, start=0.1, end=0.8)
        self.assertEqual([f['relative_timestamp_seconds'] for f in report['frames']], [0.1, 0.2, 0.6, 0.7])

    def test_excess_frames_or_missing_timestamp_leave_no_partial_study(self):
        for name, options in [('excess', dict(every_frame=True, start=0, end=1.8, max_frames=3)),
                              ('past-end', dict(times=[3]))]:
            out = self.root / name
            with self.subTest(name=name), self.assertRaises(ValueError):
                video.extract_video(self.source, out, **options)
            self.assertFalse(out.exists())
        self.assertFalse(list(self.root.glob('.video-study-*')))

    def test_existing_output_and_playlist_disguised_as_video_are_rejected(self):
        out = self.root / 'existing'
        out.mkdir()
        sentinel = out / 'keep.txt'
        sentinel.write_text('keep')
        with self.assertRaisesRegex(ValueError, 'already exists'):
            video.extract_video(self.source, out, times=[0])
        self.assertEqual(sentinel.read_text(), 'keep')
        fake = self.root / 'playlist.mp4'
        fake.write_text('#EXTM3U\nhttps://example.com/secret.mp4?token=private\n')
        with self.assertRaises(ValueError) as error:
            video.inspect_video(fake)
        self.assertNotIn('private', str(error.exception))


if __name__ == '__main__':
    unittest.main()
