import copy
import tempfile
import unittest
from jsonschema import Draft202012Validator
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

    def test_missing_observation_routes_to_evidence_not_speculative_repair(self):
        check = self.report['candidates'][0]['checks']['interaction']
        check.update(result='unverified', issue_type='missing-evidence')
        result = gate.evaluate(self.report, self.root)
        self.assertEqual(result['status'], 'needs-revision')
        self.assertEqual(result['actions'][0]['next_action'], 'collect-evidence')
        check.update(result='revise', issue_type='observed-defect')
        self.assertEqual(gate.evaluate(self.report, self.root)['actions'][0]['next_action'], 'repair')

    def test_structured_transport_rejects_format_drift_but_not_a_bad_judgment(self):
        schema=gate.response_schema(['A'],['capture.png'])
        Draft202012Validator.check_schema(schema);validator=Draft202012Validator(schema)
        report=copy.deepcopy(self.report);report['continue_with']=None
        for check in report['candidates'][0]['checks'].values():check['issue_type']=None
        self.assertFalse(list(validator.iter_errors(report)))
        bad=copy.deepcopy(report);bad['candidates'][0]['checks']['opening']['result']='excellent'
        self.assertTrue(list(validator.iter_errors(bad)))
        bad=copy.deepcopy(report);bad['candidates'][0]['checks']['opening']['artifact']='invented.png'
        self.assertTrue(list(validator.iter_errors(bad)))
        report['candidates'][0]['checks']['opening']['result']='fail'
        self.assertFalse(list(validator.iter_errors(report)))
        self.assertEqual(gate.evaluate(report,self.root)['status'],'needs-revision')

    def test_structured_transport_requires_every_candidate(self):
        schema=gate.response_schema(['A','B','C'],['capture.png'])
        validator=Draft202012Validator(schema)
        report=copy.deepcopy(self.report);report['continue_with']=None
        for check in report['candidates'][0]['checks'].values():check['issue_type']=None
        self.assertTrue(list(validator.iter_errors(report)))
        for identity in ('B','C'):
            candidate=copy.deepcopy(report['candidates'][0]);candidate['id']=identity
            report['candidates'].append(candidate)
        self.assertFalse(list(validator.iter_errors(report)))
        report['candidates'].append(copy.deepcopy(report['candidates'][0]))
        self.assertTrue(list(validator.iter_errors(report)))
