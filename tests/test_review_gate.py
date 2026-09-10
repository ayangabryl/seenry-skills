import copy
import tempfile
import unittest
from pathlib import Path
from test_package import module, ROOT

gate = module('review_gate', ROOT / 'skills/seenry/scripts/review_gate.py')


class ReviewDisposition(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / 'capture.png').write_bytes(b'render fixture')
        self.report = {'candidates': [{'id': 'A', 'checks': {c: {
            'result': 'pass', 'artifact': 'capture.png', 'observation': 'Recorded observation.'
        } for c in gate.CRITERIA}, 'blocking_issues': []}], 'selected': 'A'}

    def tearDown(self):
        self.temp.cleanup()

    def test_functional_success_cannot_override_visual_failure(self):
        for result in ('revise', 'fail', 'unverified'):
            report = copy.deepcopy(self.report)
            report['candidates'][0]['checks']['opening']['result'] = result
            self.assertEqual(gate.evaluate(report, self.root)['status'], 'needs-revision')

    def test_success_is_only_ready_for_human_review(self):
        result = gate.evaluate(self.report, self.root)
        self.assertEqual(result['status'], 'ready-for-human-review')
        self.assertEqual(len(result['evidence']), 5)
        self.assertTrue(all(len(e['sha256']) == 64 for e in result['evidence']))

    def test_missing_evidence_and_path_escape_rejected(self):
        for artifact in ('missing.png', '../outside.png'):
            self.report['candidates'][0]['checks']['opening']['artifact'] = artifact
            with self.assertRaises(ValueError):
                gate.evaluate(self.report, self.root)

    def test_blocker_or_no_selection_is_not_ready(self):
        self.report['candidates'][0]['blocking_issues'] = ['Motion not verified']
        self.assertEqual(gate.evaluate(self.report, self.root)['status'], 'needs-revision')
        self.report['candidates'][0]['blocking_issues'] = []
        self.report['selected'] = None
        self.assertEqual(gate.evaluate(self.report, self.root)['status'], 'needs-revision')

    def test_unknown_selection_and_missing_criterion_rejected(self):
        self.report['selected'] = 'B'
        with self.assertRaises(ValueError):
            gate.evaluate(self.report, self.root)
        self.report['selected'] = 'A'
        del self.report['candidates'][0]['checks']['opening']
        with self.assertRaises(ValueError):
            gate.evaluate(self.report, self.root)
