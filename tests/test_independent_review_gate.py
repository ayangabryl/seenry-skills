import unittest

from test_package import module, ROOT


gate = module('independent_review_gate', ROOT / 'skills/seenry/scripts/independent_review_gate.py')


class IndependentReviewGate(unittest.TestCase):
    def test_only_two_clean_keep_verdicts_clear_the_gate(self):
        clean = {'verdict': 'Keep', 'findings': [], 'limits': []}
        self.assertEqual(gate.disposition({}), 'Revise')
        self.assertEqual(gate.disposition({'typography': clean}), 'Revise')
        results = {'typography': clean, 'whole-screen': clean}
        self.assertEqual(gate.disposition(results), 'Keep')
        results['typography'] = {'verdict': 'Keep', 'findings': [{
            'observation': 'Visible issue', 'impact': 'Task cost', 'repair': 'Fix it'
        }], 'limits': []}
        self.assertEqual(gate.disposition(results), 'Revise')
        results['typography'] = clean
        results['whole-screen'] = {'verdict': 'Unverified', 'findings': [], 'limits': ['No mobile capture']}
        self.assertEqual(gate.disposition(results), 'Revise')

    def test_incomplete_structured_review_cannot_clear_the_gate(self):
        with self.assertRaises(ValueError):
            gate.validate_result({'verdict': 'Keep', 'findings': [{'observation': 'Issue'}], 'limits': []})


if __name__ == '__main__':
    unittest.main()
