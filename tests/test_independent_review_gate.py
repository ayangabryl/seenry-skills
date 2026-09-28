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

    def test_named_states_are_bounded_and_included_in_review(self):
        states = gate.parse_states(['proof-a=/tmp/a.png', 'saved-b=/tmp/b.webp'])
        self.assertEqual(list(states), ['proof-a', 'saved-b'])
        prompt = gate.review_prompt('whole-screen', 'first-screen', states)
        self.assertIn('proof-a, saved-b', prompt)
        self.assertIn('material, decision and result', prompt)
        for values in (['Proof A=/tmp/a.png'], ['a=/tmp/a.svg'], ['a=/tmp/a.png', 'a=/tmp/b.png'],
                       ['a=/tmp/a.png'] * 5):
            with self.subTest(values=values), self.assertRaises(ValueError):
                gate.parse_states(values)


if __name__ == '__main__':
    unittest.main()
