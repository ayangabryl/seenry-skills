import copy, importlib.util, json, sys, tempfile, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'skills/seenry/scripts'))
from review_request import prepare
from review_gate import evaluate, CRITERIA
class ReviewRequest(unittest.TestCase):
 def manifest(self):
  return {'brief':'Choose a useful design','candidates':[{'id':'private-condition','opening':'source.png','narrow':'source.png','sequence':'source.png','behavior':{'status':'unverified','observations':['No interaction evidence supplied.']}}]}
 def root(self,tmp):
  root=Path(tmp);(root/'source.png').write_bytes((ROOT/'skills/seenry/references/lessons/state-B.png').read_bytes());return root
 def test_keeps_criteria_and_evidence_roles_separate(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=self.root(tmp);p=prepare(self.manifest(),root,root/'out')
   self.assertEqual(set(p['required_review_shape']['candidates'][0]['checks']),set(CRITERIA))
   self.assertNotIn('private-condition',json.dumps(p))
   self.assertEqual(set(p['candidates'][0]['evidence']),{'opening','narrow','sequence','behavior'})
   self.assertEqual(evaluate(p['required_review_shape'],root/'out')['status'],'needs-revision')
   self.assertEqual(json.loads((root/'out/private-key.json').read_text())['mapping'][0]['original_id'],'private-condition')
 def test_missing_view_cannot_be_substituted_with_a_written_claim(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=self.root(tmp);m=self.manifest();m['candidates'][0].pop('opening')
   with self.assertRaises(ValueError):prepare(m,root,root/'out')
   self.assertFalse((root/'out').exists())
 def test_path_escape_and_fake_image_are_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=self.root(tmp);m=self.manifest();m['candidates'][0]['opening']='../elsewhere.png'
   with self.assertRaises(ValueError):prepare(m,root,root/'out')
   (root/'source.png').write_text('I inspected the design')
   with self.assertRaises(ValueError):prepare(self.manifest(),root,root/'out')
 def test_no_overwrite_or_duplicate_candidate_labels(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=self.root(tmp);m=self.manifest();m['candidates']*=2
   with self.assertRaises(ValueError):prepare(m,root,root/'out')
   prepare(self.manifest(),root,root/'out')
   with self.assertRaises(FileExistsError):prepare(self.manifest(),root,root/'out')
 def test_actual_states_keep_context_hashes_and_anonymous_names(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=self.root(tmp);m=self.manifest()
   m['candidates'][0]['states']=[{'path':'source.png','observation':'After selecting the second image at 390px.'}]
   p=prepare(m,root,root/'out');e=p['candidates'][0]['evidence']['state-0']
   self.assertEqual(e['file'],'A-state-0.png')
   self.assertIn('second image',e['observation'])
   self.assertEqual((root/'out/A-state-0.png').read_bytes(),(root/'source.png').read_bytes())
   self.assertNotIn('private-condition',json.dumps(p))
   self.assertIn('A-state-0.png',json.dumps(json.loads((root/'out/response.schema.json').read_text())))
 def test_invalid_state_evidence_is_rejected_before_writing(self):
  for state in ({'path':'../elsewhere.png','observation':'Clicked'}, {'path':'source.png'}, {'path':'source.png','observation':''}):
   with tempfile.TemporaryDirectory() as tmp:
    root=self.root(tmp);m=self.manifest();m['candidates'][0]['states']=[state]
    with self.assertRaises(ValueError):prepare(m,root,root/'out')
    self.assertFalse((root/'out').exists())
if __name__=='__main__':unittest.main()
