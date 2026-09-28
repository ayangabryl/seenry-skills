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

    def test_full_page_scope_reviews_the_complete_task(self):
        clean = {'verdict': 'Keep', 'findings': [], 'limits': ['Static captures do not prove behavior']}
        self.assertEqual(gate.disposition({'whole-screen': clean}, 'full-page'), 'Keep')
        self.assertEqual(gate.disposition({'typography': clean}, 'full-page'), 'Revise')
        prompt = gate.review_prompt('whole-screen', 'full-page')
        self.assertIn('complete page', prompt)
        self.assertIn('full-page captures', prompt)
        self.assertIn('responsive reflow', prompt)
        self.assertNotIn('first-screen captures', prompt)


if __name__ == '__main__':
    unittest.main()
