"""Exercise quality/support disagreement, scoped routing and historical compatibility."""
import copy
import hashlib
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator
from test_package import ROOT, module

gate = module('support_gate', ROOT / 'skills/seenry/scripts/review_gate.py')
packet = module('support_packet', ROOT / 'skills/seenry/scripts/packet.py')


class EvidenceSupport(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / 'observed.png').write_bytes(b'fixture, not a design-quality judgment')
        self.report = {'review_version': 2, 'selected': 'A', 'continue_with': None,
                       'candidates': [{'id': 'A', 'blocking_issues': [], 'checks': {c: {
                           'result': 'pass', 'artifact': 'observed.png',
                           'observation': 'The supplied target is visible in this state.',
                           'issue_type': None, 'support': 'supported',
                           'support_reason': 'Current and narrow states were inspected.',
                           'next_check': None} for c in gate.CRITERIA}}]}

    def tearDown(self):
        self.temp.cleanup()

    def test_uncertain_pass_is_not_eligible(self):
        check = self.report['candidates'][0]['checks']['material']
        check.update(support='uncertain', support_reason='Two palettes may fit the brief.',
                     next_check='Compare only the neutral background on the same composition.')
        result = gate.evaluate(self.report, self.root)
        self.assertEqual(result['eligible'], [])
        self.assertEqual(result['status'], 'needs-revision')
        self.assertEqual(result['actions'][0]['next_action'], 'compare')

    def test_supported_failure_is_not_a_high_quality_score(self):
        self.report['candidates'][0]['checks']['hierarchy'].update(
            result='fail', issue_type='observed-defect', next_check='Repair the clipped action and recheck narrow width.')
        result = gate.evaluate(self.report, self.root)
        self.assertEqual(result['status'], 'needs-revision')
        self.assertEqual(result['actions'][0]['next_action'], 'repair')

    def test_unseen_motion_requests_observation(self):
        self.report['candidates'][0]['checks']['interaction'].update(
            result='unverified', issue_type='missing-evidence', support='uninspected',
            support_reason='Only stills supplied.', next_check='Watch normal-speed playback and interrupt expansion.')
        result = gate.evaluate(self.report, self.root)
        self.assertEqual(result['actions'][0]['next_action'], 'collect-evidence')
        self.assertEqual(result['eligible'], [])

    def test_mixed_problems_keep_each_required_action(self):
        checks = self.report['candidates'][0]['checks']
        checks['interaction'].update(result='unverified', issue_type='missing-evidence', support='uninspected',
            support_reason='No playback.', next_check='Inspect playback.')
        checks['hierarchy'].update(result='revise', issue_type='observed-defect', next_check='Fix clipped heading.')
        result = gate.evaluate(self.report, self.root)
        self.assertEqual(result['actions'][0]['next_action'], 'resolve-checks')
        self.assertEqual({x['next_action'] for x in result['actions'][0]['unresolved']}, {'repair', 'collect-evidence'})

    def test_inconsistent_support_and_missing_next_check_rejected(self):
        cases = [dict(support='uninspected'), dict(support='uncertain'),
                 dict(result='unverified', issue_type='missing-evidence'),
                 dict(support=0.99), dict(support_reason=''),
                 dict(result='fail', next_check='Repair.', issue_type=None)]
        for changes in cases:
            report = copy.deepcopy(self.report)
            report['candidates'][0]['checks']['opening'].update(changes)
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                gate.evaluate(report, self.root)

    def test_schema_requires_support_and_version_but_does_not_certify_quality(self):
        schema = gate.response_schema(['A'], ['observed.png'], review_version=2)
        validator = Draft202012Validator(schema)
        validator.validate(self.report)
        self.assertTrue(gate.evaluate(self.report, self.root)['support_assessed'])
        for key in ('support', 'support_reason', 'next_check'):
            bad = copy.deepcopy(self.report); del bad['candidates'][0]['checks']['opening'][key]
            self.assertTrue(list(validator.iter_errors(bad)))
        bad = copy.deepcopy(self.report); del bad['review_version']
        self.assertTrue(list(validator.iter_errors(bad)))
        legacy = copy.deepcopy(self.report); legacy.pop('review_version')
        for c in legacy['candidates'][0]['checks'].values():
            for key in ('support', 'support_reason', 'next_check'): c.pop(key)
        self.assertFalse(gate.evaluate(legacy, self.root)['support_assessed'])


class DecisionStudies(unittest.TestCase):
    def test_one_selected_case_replaces_generic_example_and_preserves_constraints(self):
        project = {'scope':'component', 'media':'none', 'motion':'none',
                   'decision_study':'attention', 'retained_behavior':['Preserve current selection.']}
        result = packet.compile_packet('refine', decision='controls', project=project, research_source='local')
        paths = [r['path'] for r in result['resources']]
        self.assertEqual(result['project_decisions'], project)
        self.assertIn('seenry/references/studies/attention.md', paths)
        self.assertEqual([p for p in paths if p.endswith('.html')], ['seenry/assets/craft/attention.html'])
        self.assertNotIn('seenry/references/studies/expression.md', paths)
        self.assertEqual(result['research_source'], 'local')
        for r in result['resources']:
            self.assertEqual(r['sha256'], hashlib.sha256((ROOT/'skills'/r['path']).read_bytes()).hexdigest())

    def test_no_selection_has_no_study_cost_and_review_gets_required_support(self):
        result = packet.compile_packet('refine', decision='controls')
        self.assertFalse(any('/studies/' in r['path'] for r in result['resources']))
        for stage in ('review', 'compare'):
            result = packet.compile_packet(stage, research_source='local')
            self.assertIn('seenry/references/review-evidence.md', {r['path'] for r in result['resources']})

    def test_relocates_and_fails_on_missing_required_example(self):
        with tempfile.TemporaryDirectory(prefix='seenry study relocation ') as tmp:
            root = Path(tmp)/'skills'
            shutil.copytree(ROOT/'skills', root)
            (root/'seenry/references/research.md').unlink()
            project={'media':'none','motion':'none','decision_study':'attention'}
            packet.compile_packet('plan', root=root/'seenry', project=project, research_source='local')
            (root/'seenry/assets/craft/attention.html').unlink()
            with self.assertRaises(FileNotFoundError):
                packet.compile_packet('plan', root=root/'seenry', project=project, research_source='local')

    def test_invalid_study_never_silently_ignored(self):
        for value in ('unknown', ['attention'], {}) :
            with self.subTest(value=value), self.assertRaises(ValueError):
                packet.compile_packet('plan', project={'decision_study':value})


if __name__ == '__main__': unittest.main()
