import unittest

from test_package import module, ROOT


gate = module('independent_flow_gate', ROOT / 'skills/seenry-apps/scripts/independent_flow_gate.py')


class IndependentFlowGate(unittest.TestCase):
    def test_both_reviews_must_clear_without_findings(self):
        keep = {'verdict': 'Keep', 'findings': [], 'limits': ['Static captures do not verify taps']}
        self.assertEqual(gate.disposition({'visual': keep, 'flow': keep}), 'Keep')
        self.assertEqual(gate.disposition({'visual': keep}), 'Revise')
        revise = {'verdict': 'Revise', 'findings': [
            {'observation': 'Result hidden', 'impact': 'Task unclear', 'repair': 'Show result'}
        ], 'limits': []}
        self.assertEqual(gate.disposition({'visual': keep, 'flow': revise}), 'Revise')
        self.assertEqual(gate.disposition({'visual': keep, 'flow': {'verdict': 'Unverified', 'findings': [], 'limits': ['No result']}}), 'Revise')
        self.assertEqual(gate.disposition({'visual': keep, 'flow': {**revise, 'verdict': 'Keep'}}), 'Revise')

    def test_incomplete_review_rejected(self):
        with self.assertRaises(ValueError):
            gate.validate_result({'verdict': 'Keep', 'findings': [{'observation': 'Issue'}], 'limits': []})


if __name__ == '__main__':
    unittest.main()
