import importlib.util,tempfile,unittest,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('human_review',ROOT/'skills/seenry/scripts/human_review.py');human=importlib.util.module_from_spec(spec);spec.loader.exec_module(human)
class HumanReview(unittest.TestCase):
 def test_rejection_attaches_only_to_reviewed_source_bytes(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);source=root/'index.html';source.write_text('original');digest=hashlib.sha256(source.read_bytes()).hexdigest()
   human.record(root,'index.html',digest,'reject','user','Neither','Anonymous review of A and B')
   self.assertEqual(human.assess(root,'index.html')['status'],'human-rejected')
   source.write_text('revision')
   self.assertEqual(human.assess(root,'index.html')['status'],'unreviewed-current-source')
   self.assertEqual(human.assess(root,'index.html')['older_source_records'],1)
   with self.assertRaisesRegex(ValueError,'changed'):human.record(root,'index.html',digest,'accept','user','A','Review')
 def test_preference_is_not_absolute_acceptance_and_history_is_append_only(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);(root/'index.html').write_text('artifact');digest=hashlib.sha256((root/'index.html').read_bytes()).hexdigest()
   human.record(root,'index.html',digest,'prefer','user','B','Keep B over A')
   self.assertEqual(human.assess(root,'index.html')['status'],'human-preferred-relative')
   human.record(root,'index.html',digest,'reject','user','Still not enough','Subsequent review of same artifact')
   self.assertEqual(human.assess(root,'index.html')['status'],'human-rejected')
   self.assertEqual(len(list((root/'human-reviews').glob('*.json'))),2)
 def test_missing_quote_and_path_escape_do_not_create_feedback(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);(root/'index.html').write_text('artifact');digest=hashlib.sha256((root/'index.html').read_bytes()).hexdigest()
   with self.assertRaises(ValueError):human.record(root,'index.html',digest,'accept','user','','Missing evidence')
   with self.assertRaises(ValueError):human.assess(root,'../index.html')
   self.assertFalse((root/'human-reviews').exists())
if __name__=='__main__':unittest.main()
