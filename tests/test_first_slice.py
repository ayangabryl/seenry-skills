import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from test_package import ROOT

SCRIPT = ROOT / 'skills/seenry/scripts/first_slice.py'


class FirstSliceCheckpoint(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.run = self.root / 'checkpoint'
        self.source_root = self.root / 'project'
        self.source_root.mkdir()
        self.source_file = self.source_root / 'index.html'
        self.source_file.write_text('<main>Compare proof states</main>')
        self.brief = self.root / 'brief.md'
        self.brief.write_text('The visitor compares two original proof states.\n')
        self.images = {}
        for name in ('a-desktop', 'a-mobile', 'b-desktop', 'b-mobile', 'desktop', 'mobile'):
            image = self.root / f'{name}.png'
            image.write_bytes(name.encode())
            self.images[name] = image
        self.stub = self.root / 'codex-stub.py'
        self.verdict = self.root / 'verdict.txt'
        self.verdict.write_text('Keep')
        self.stub.write_text(
            '#!/usr/bin/env python3\n'
            'import json, pathlib, sys\n'
            f'verdict = pathlib.Path({str(self.verdict)!r}).read_text().strip()\n'
            'report = pathlib.Path(sys.argv[sys.argv.index("-o") + 1])\n'
            'json.dump({"verdict": verdict, "findings": [], "strengths": [], "limits": []}, report.open("w"))\n'
        )
        if sys.platform == 'win32':
            launcher = self.root / 'codex-stub.cmd'
            launcher.write_text(f'@echo off\r\n"{sys.executable}" "{self.stub}" %*\r\n')
            self.stub = launcher
        else:
            self.stub.chmod(0o755)
        self.call('init', '--run', self.run, '--brief', self.brief,
                  '--decision', 'Which proof is clearer at phone size?', expected=0)

    def call(self, command, *args, expected=None):
        result = subprocess.run([sys.executable, str(SCRIPT), command, *map(str, args)],
                                text=True, capture_output=True)
        if expected is not None:
            self.assertEqual(result.returncode, expected, result.stderr + result.stdout)
        return result

    def study(self, cli=None, expected=None):
        args = ['--run', self.run]
        for name in ('a-desktop', 'a-mobile', 'b-desktop', 'b-mobile'):
            args += [f'--{name}', self.images[name]]
        args += ['--codex-bin', cli or self.stub]
        return self.call('studies', *args, expected=expected)

    def manifest(self):
        return json.loads((self.run / 'manifest.json').read_text())

    def test_chronological_selection_and_slice(self):
        self.call('select', '--run', self.run, '--study', 'A',
                  '--task-anchor', 'Distinguish the selected proof', expected=2)
        self.call('slice', '--run', self.run, '--desktop', self.images['desktop'],
                  '--mobile', self.images['mobile'], '--source-root', self.source_root, expected=2)
        self.study(expected=0)
        self.call('select', '--run', self.run, '--study', 'A',
                  '--task-anchor', 'Distinguish the selected proof', expected=0)
        self.call('slice', '--run', self.run, '--desktop', self.images['desktop'],
                  '--mobile', self.images['mobile'], '--source-root', self.source_root,
                  '--codex-bin', self.stub, expected=0)
        record = self.manifest()
        self.assertEqual(record['slices'][-1]['status'], 'Keep')
        self.assertEqual(record['slices'][-1]['selection']['study'], 'A')
        summary = json.loads((self.run / 'slices/001/gate/summary.json').read_text())
        self.assertIn('selected-study', summary['input_sha256'])
        self.assertEqual(record['slices'][-1]['source']['file_count'], 1)
        self.call('verify', '--run', self.run, expected=0)

    def test_non_keep_cannot_advance(self):
        self.verdict.write_text('Revise')
        self.study(expected=2)
        self.call('select', '--run', self.run, '--study', 'B',
                  '--task-anchor', 'See the proof', expected=2)
        self.assertEqual(self.manifest()['studies'][-1]['status'], 'Revise')
        self.assertFalse((self.run / 'slices').exists())

    def test_changed_source_invalidates_frozen_study(self):
        self.study(expected=0)
        self.images['a-mobile'].write_bytes(b'changed')
        result = self.call('select', '--run', self.run, '--study', 'A',
                           '--task-anchor', 'See the proof', expected=2)
        self.assertIn('Stale', result.stderr)
        self.assertIsNone(self.manifest()['selection'])

    def test_unavailable_cli_does_not_pass_and_keeps_artifacts(self):
        self.study(cli=self.root / 'missing-codex', expected=2)
        record = self.manifest()
        self.assertEqual(record['studies'][-1]['status'], 'Unverified')
        self.assertTrue(Path(record['studies'][-1]['captures']['a-mobile']['copy']).is_file())
        self.call('select', '--run', self.run, '--study', 'A',
                  '--task-anchor', 'See the proof', expected=2)

    def test_unavailable_cli_cannot_clear_finished_slice(self):
        self.study(expected=0)
        self.call('select', '--run', self.run, '--study', 'A',
                  '--task-anchor', 'See the proof', expected=0)
        self.call('slice', '--run', self.run, '--desktop', self.images['desktop'],
                  '--mobile', self.images['mobile'], '--source-root', self.source_root,
                  '--codex-bin',
                  self.root / 'missing-codex', expected=2)
        attempt = self.manifest()['slices'][-1]
        self.assertEqual(attempt['status'], 'Unverified')
        self.assertTrue(Path(attempt['captures']['mobile']['copy']).is_file())

    def test_source_change_invalidates_previous_keep(self):
        self.study(expected=0)
        self.call('select', '--run', self.run, '--study', 'B',
                  '--task-anchor', 'See the proof', expected=0)
        self.call('slice', '--run', self.run, '--desktop', self.images['desktop'],
                  '--mobile', self.images['mobile'], '--source-root', self.source_root,
                  '--codex-bin', self.stub, expected=0)
        self.source_file.write_text('<main>Changed proof</main>')
        result = self.call('verify', '--run', self.run, expected=2)
        self.assertIn('Stale', result.stdout)
        attempt = self.manifest()['slices'][-1]
        self.assertEqual(attempt['status'], 'Stale')
        self.assertEqual(attempt['gate_status'], 'Keep')

    def test_source_scope_excludes_build_and_run_artifacts(self):
        for directory in ('node_modules', 'build', '.git'):
            folder = self.source_root / directory
            folder.mkdir()
            (folder / 'other.js').write_text('changed')
        self.study(expected=0)
        self.call('select', '--run', self.run, '--study', 'A',
                  '--task-anchor', 'See the proof', expected=0)
        self.call('slice', '--run', self.run, '--desktop', self.images['desktop'],
                  '--mobile', self.images['mobile'], '--source-root', self.source_root,
                  '--codex-bin', self.stub, expected=0)
        self.assertEqual(self.manifest()['slices'][-1]['source']['file_count'], 1)
        (self.source_root / 'build' / 'other.js').write_text('again')
        self.call('verify', '--run', self.run, expected=0)

    def test_evaluation_outputs_do_not_stale_source_but_ui_edits_do(self):
        originals = {
            'main.css': b'body { color: black; }',
            'app.js': b'const state = 1;',
            'subject.png': b'local-image-bytes',
            'content.md': b'Visible content',
            'data.json': b'{"label":"Proof"}',
        }
        for name, content in originals.items():
            (self.source_root / name).write_bytes(content)
        self.study(expected=0)
        self.call('select', '--run', self.run, '--study', 'A',
                  '--task-anchor', 'See the proof', expected=0)
        self.call('slice', '--run', self.run, '--desktop', self.images['desktop'],
                  '--mobile', self.images['mobile'], '--source-root', self.source_root,
                  '--codex-bin', self.stub, expected=0)
        for directory in ('evidence', 'studies', 'captures', 'gate-reports', 'reviews'):
            output = self.source_root / directory
            output.mkdir()
            (output / 'capture.png').write_bytes(b'new-evidence')
            (output / 'summary.json').write_text('{"verdict":"Keep"}')
        (self.source_root / 'EVALUATION.md').write_text('Review notes')
        self.call('verify', '--run', self.run, expected=0)
        for name in ('main.css', 'app.js', 'subject.png', 'content.md', 'data.json'):
            path = self.source_root / name
            path.write_bytes(originals[name] + b'changed')
            self.call('verify', '--run', self.run, expected=2)
            self.assertEqual(self.manifest()['slices'][-1]['status'], 'Stale')
            path.write_bytes(originals[name])
            self.call('verify', '--run', self.run, expected=0)

    def test_run_inside_project_is_excluded_from_source_hash(self):
        nested_run = self.source_root / 'review-run'
        self.call('init', '--run', nested_run, '--brief', self.brief,
                  '--decision', 'Which proof is clearer?', expected=0)
        study_args = ['--run', nested_run]
        for name in ('a-desktop', 'a-mobile', 'b-desktop', 'b-mobile'):
            study_args += [f'--{name}', self.images[name]]
        self.call('studies', *study_args, '--codex-bin', self.stub, expected=0)
        self.call('select', '--run', nested_run, '--study', 'A',
                  '--task-anchor', 'See the proof', expected=0)
        self.call('slice', '--run', nested_run, '--desktop', self.images['desktop'],
                  '--mobile', self.images['mobile'], '--source-root', self.source_root,
                  '--codex-bin', self.stub, expected=0)
        record = json.loads((nested_run / 'manifest.json').read_text())
        self.assertEqual(record['slices'][-1]['source']['file_count'], 1)
        self.call('verify', '--run', nested_run, expected=0)

    def test_craft_reference_image_is_bound_to_direction_gate(self):
        image = self.root / 'craft.png'
        image.write_bytes(b'\x89PNG\r\n\x1a\n' + b'\x00\x00\x00\rIHDR'
                          + b'\x00\x00\x00\x01\x00\x00\x00\x01'
                          + b'\x08\x02\x00\x00\x00')
        another = self.root / 'craft-run'
        self.call('init', '--run', another, '--brief', self.brief,
                  '--decision', 'Which proof is clearer?',
                  '--craft-reference-image', image, expected=0)
        args = ['--run', another]
        for name in ('a-desktop', 'a-mobile', 'b-desktop', 'b-mobile'):
            args += [f'--{name}', self.images[name]]
        self.call('studies', *args, '--codex-bin', self.stub, expected=0)
        summary = json.loads((another / 'studies/001/gate/summary.json').read_text())
        self.assertIn('craft-reference-image', summary['input_sha256'])


if __name__ == '__main__':
    unittest.main()
