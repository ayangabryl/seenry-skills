import hashlib, importlib.util, unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('edits', Path(__file__).resolve().parents[1] / 'skills/seenry/scripts/edit_response.py')
edits = importlib.util.module_from_spec(spec); spec.loader.exec_module(edits)

class ExactEdits(unittest.TestCase):
    def test_applies_only_unique_context_on_matching_source(self):
        source = 'red green blue'
        response = {'source_sha256': hashlib.sha256(source.encode()).hexdigest(), 'edits': [{'old': 'green', 'new': 'yellow'}]}
        self.assertEqual(edits.apply(source, response), 'red yellow blue')
        with self.assertRaises(ValueError): edits.apply(source + '!', response)
        response['edits'] = [{'old': 'absent', 'new': 'new'}]
        with self.assertRaises(ValueError): edits.apply(source, response)
    def test_ambiguous_context_is_rejected(self):
        source = 'red red'
        with self.assertRaises(ValueError): edits.apply(source, {'source_sha256': hashlib.sha256(source.encode()).hexdigest(), 'edits': [{'old': 'red', 'new': 'blue'}]})

if __name__ == '__main__': unittest.main()
