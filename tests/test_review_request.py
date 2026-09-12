import copy, importlib.util, json, shutil, sys, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
from jsonschema import Draft202012Validator
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
 def test_delivery_size_describes_frozen_anonymous_request_without_entering_it(self):
  original_write=Path.write_text
  for simulate_crlf in (False,True):
   with self.subTest(simulate_crlf=simulate_crlf),tempfile.TemporaryDirectory() as tmp:
    root=self.root(tmp);m=self.manifest();m['brief']='Exporter la photo — 日本語';out=root/'out'
    def write_text(path,content,*args,**kwargs):
     if simulate_crlf and path.name=='request.json':
      return path.write_bytes(content.replace('\n','\r\n').encode('utf-8'))
     return original_write(path,content,*args,**kwargs)
    with patch.object(Path,'write_text',write_text):p=prepare(m,root,out)
    prompt_bytes=(out/'request.json').read_bytes();prompt=prompt_bytes.decode('utf-8')
    size=json.loads((out/'delivery-size.json').read_text(encoding='utf-8'))
    if simulate_crlf:self.assertIn(b'\r\n',prompt_bytes)
    self.assertEqual(json.loads(prompt),p)
    self.assertEqual(p['brief'],m['brief'])
    self.assertEqual(size['prompt_bytes'],len(prompt_bytes))
    self.assertEqual(size['prompt_characters'],len(prompt))
    self.assertEqual(size['image_attachments'],len(json.loads((out/'images.json').read_text(encoding='utf-8'))))
    self.assertEqual(size['external_schema_bytes'],len((out/'response.schema.json').read_bytes()))
    self.assertIsNone(size['token_count'])
    self.assertNotIn('delivery_size',p)
    self.assertNotIn('prompt_bytes',prompt)
    self.assertNotIn('private-condition',json.dumps(size))
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
 def test_scoped_feedback_and_actual_pixels_reach_fresh_review(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=self.root(tmp);m=self.manifest();m['calibration_topics']=['export-feedback']
   p=prepare(m,root,root/'out');case=p['calibration'][0]
   self.assertEqual(case['id'],'export-feedback')
   self.assertIn('feedback_record',case)
   self.assertEqual(len(case['evidence']),4)
   self.assertNotIn('private-condition',json.dumps(p))
   images=json.loads((root/'out/images.json').read_text(encoding='utf-8'))
   self.assertEqual(sum(x['role']=='rejected-example' for x in images),4)
   self.assertEqual(len(p['candidates']),1)
   schema=(root/'out/response.schema.json').read_text(encoding='utf-8')
   self.assertNotIn('calibration-export-feedback',schema)
   for e in case['evidence']:
    import hashlib
    self.assertEqual(hashlib.sha256((root/'out'/e['file']).read_bytes()).hexdigest(),e['sha256'])
 def test_invalid_calibration_does_not_create_partial_request(self):
  for topics in ('', ['not-a-topic'], ['state','state']):
   with tempfile.TemporaryDirectory() as tmp:
    root=self.root(tmp);m=self.manifest();m['calibration_topics']=topics
    with self.assertRaises(ValueError):prepare(m,root,root/'out')
    self.assertFalse((root/'out').exists())
 def test_construction_and_final_have_distinct_acceptance_contracts(self):
  for phase in ('wireframe','type','surface','final'):
   with tempfile.TemporaryDirectory() as tmp:
    root=self.root(tmp);m=self.manifest();m['phase']=phase
    p=prepare(m,root,root/'out')
    expected={'content','hierarchy','geometry'} if phase in ('wireframe','type') else set(CRITERIA)
    self.assertEqual(set(p['criteria']),expected)
    self.assertEqual(set(p['required_review_shape']['candidates'][0]['checks']),expected)
    if phase in ('wireframe','type'):self.assertIn('deferred',p['instructions'])
  with tempfile.TemporaryDirectory() as tmp:
   root=self.root(tmp);m=self.manifest();m['phase']='whatever'
   with self.assertRaises(ValueError):prepare(m,root,root/'out')
   self.assertFalse((root/'out').exists())
 def test_explicit_concept_review_routes_only_construction_criteria_and_schema(self):
  for phase in ('wireframe','type','surface','final'):
   for flag in ({},{'concept_review':False},{'concept_review':True}):
    with self.subTest(phase=phase,flag=flag),tempfile.TemporaryDirectory() as tmp:
     root=self.root(tmp);m=self.manifest();m.update(phase=phase,scope='component',**flag)
     m['brief']='Choose a creative concept with a distinctive idea'
     m['creator_rationale']='Choose private-condition for its author-proclaimed originality.'
     p=prepare(m,root,root/'out')
     construction=phase in ('wireframe','type')
     expected={'content','hierarchy','geometry'} if construction else set(CRITERIA)
     if construction and flag.get('concept_review'):expected.add('concept')
     self.assertEqual(p['concept_review'],flag.get('concept_review',False))
     self.assertEqual(p['concept_review_source'],'manifest' if flag else 'unspecified')
     self.assertEqual(set(p['criteria']),expected)
     self.assertEqual(set(p['required_review_shape']['candidates'][0]['checks']),expected)
     schema=json.loads((root/'out/response.schema.json').read_text())
     checks=schema['properties']['candidates']['items']['properties']['checks']
     self.assertEqual(set(checks['properties']),expected)
     self.assertEqual(set(checks['required']),expected)
     self.assertFalse(checks['additionalProperties'])
     validator=Draft202012Validator(schema)
     response=copy.deepcopy(p['required_review_shape'])
     for check in response['candidates'][0]['checks'].values():check['issue_type']='missing-evidence'
     validator.validate(response)
     wrong=copy.deepcopy(response);wrong_checks=wrong['candidates'][0]['checks']
     if 'concept' in expected:del wrong_checks['concept']
     else:wrong_checks['concept']=copy.deepcopy(next(iter(wrong_checks.values())))
     self.assertTrue(list(validator.iter_errors(wrong)))
     if 'concept' in expected:
      self.assertIn('separately from craft',p['criteria']['concept'])
      self.assertIn('not required',p['criteria']['concept'])
      self.assertIn('geometry and concept',p['instructions'])
      self.assertEqual(checks['properties']['concept']['properties']['artifact']['enum'],
                       [e['file'] for e in p['candidates'][0]['evidence'].values()])
     if construction:
      self.assertEqual({g['path'] for g in p['guidance']},{'seenry/references/'+name for name in
                       ('content-model.md','visual-decisions.md','component-design.md')})
     self.assertNotIn('creator_rationale',p)
     self.assertNotIn('private-condition',json.dumps(p))
 def test_concept_review_rejects_non_boolean_values_before_writing(self):
  for phase in ('wireframe','type','surface','final'):
   for value in (None,0,1,'true','false',[],{}):
    with self.subTest(phase=phase,value=value),tempfile.TemporaryDirectory() as tmp:
     root=self.root(tmp);m=self.manifest();m.update(phase=phase,concept_review=value)
     with self.assertRaisesRegex(ValueError,'concept_review must be a boolean'):
      prepare(m,root,root/'out')
     self.assertFalse((root/'out').exists())
 def test_concept_evidence_and_disposition_are_checked_with_requested_criteria(self):
  for phase in ('wireframe','type'):
   with self.subTest(phase=phase),tempfile.TemporaryDirectory() as tmp:
    root=self.root(tmp);m=self.manifest();m.update(phase=phase,concept_review=True)
    p=prepare(m,root,root/'out');report=copy.deepcopy(p['required_review_shape'])
    report['selected']='A';checks=report['candidates'][0]['checks']
    for check in checks.values():check.update(result='pass',observation='Observed in the supplied opening.')
    concept=checks['concept'];concept.update(result='unverified',issue_type='missing-evidence',
                                           observation='The decisive task relationship is not demonstrated.')
    result=evaluate(report,root/'out',criteria=p['criteria'])
    self.assertEqual(result['status'],'needs-revision')
    self.assertEqual(result['eligible'],[])
    self.assertEqual(result['actions'][0]['next_action'],'collect-evidence')
    concept.update(result='revise',issue_type='observed-defect',observation='The visible arrangement separates the object from its action.')
    self.assertEqual(evaluate(report,root/'out',criteria=p['criteria'])['actions'][0]['next_action'],'repair')
    concept.update(result='pass',issue_type=None,observation='The visible object and action relationship serves the brief.')
    result=evaluate(report,root/'out',criteria=p['criteria'])
    self.assertEqual(result['status'],'ready-for-human-review')
    concept_evidence=next(e for e in result['evidence'] if e['criterion']=='concept')
    self.assertEqual(concept_evidence['artifact'],'A-opening.png')
    self.assertEqual(concept_evidence['sha256'],p['candidates'][0]['evidence']['opening']['sha256'])
    concept['artifact']='missing.png'
    with self.assertRaisesRegex(ValueError,'evidence must be an existing file'):
     evaluate(report,root/'out',criteria=p['criteria'])
    del checks['concept']
    with self.assertRaisesRegex(ValueError,'every visual criterion'):
     evaluate(report,root/'out',criteria=p['criteria'])
 def test_full_review_guidance_is_supplied_with_actual_source_hashes(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=self.root(tmp);p=prepare(self.manifest(),root,root/'out')
   guides={x['path']:x for x in p['guidance']}
   self.assertIn('seenry/references/visual-review.md',guides)
   self.assertIn('seenry/references/quality-diagnosis.md',guides)
   for name,item in guides.items():
    import hashlib
    content=(ROOT/'skills'/name).read_bytes()
    self.assertEqual(item['sha256'],hashlib.sha256(content).hexdigest())
    self.assertEqual(item['content'].encode('utf-8'),content)
   self.assertIn('Inspect every supplied candidate',guides['seenry/references/visual-review.md']['content'])
 def test_missing_guidance_blocks_handoff_and_construction_stays_scoped(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=self.root(tmp)
   with self.assertRaises(FileNotFoundError):prepare(self.manifest(),root,root/'bad',review_root=root/'missing')
   self.assertFalse((root/'bad').exists())
   m=self.manifest();m.update(phase='type',scope='component');p=prepare(m,root,root/'out')
   names={x['path']for x in p['guidance']}
   self.assertIn('seenry/references/component-design.md',names)
   self.assertNotIn('seenry/references/visual-review.md',names)

 def test_actual_review_handoff_routes_factual_needs_without_author_rationale(self):
  for phase in ('wireframe','type','surface','final'):
   for needs in ({},{'media':'needed','motion':'signature'},{'media':'none','motion':'none'}):
    with self.subTest(phase=phase,needs=needs),tempfile.TemporaryDirectory() as tmp:
     root=self.root(tmp);m=self.manifest();m.update(phase=phase,scope='component',**needs)
     m['creator_rationale']='Prefer private-condition because the author says it is premium.'
     prepare(m,root,root/'out')
     p=json.loads((root/'out/request.json').read_text(encoding='utf-8'))
     names={x['path'] for x in p['guidance']}
     for key,path in (('motion','seenry-motion/references/motion-contract.md'),('media','seenry-assets/references/material-review.md')):
      self.assertEqual(path in names,phase in ('surface','final') and needs.get(key)!='none')
      self.assertEqual(p['needs'][key],needs.get(key,'undecided'))
      self.assertEqual(p['needs_source'][key],'manifest' if key in needs else 'unspecified')
     self.assertNotIn('creator_rationale',p)
     self.assertNotIn('private-condition',json.dumps(p))
     if phase in ('surface','final'):self.assertEqual(set(p['criteria']),set(CRITERIA))

 def test_invalid_review_needs_fail_before_partial_output(self):
  for needs in ({'motion':'auto'},{'media':None},{'motion':[]},{'media':'signature'}):
   with tempfile.TemporaryDirectory() as tmp:
    root=self.root(tmp);m=self.manifest();m.update(needs)
    with self.assertRaises(ValueError):prepare(m,root,root/'out')
    self.assertFalse((root/'out').exists())

 def test_review_companion_guides_relocate_and_missing_dependency_blocks(self):
  with tempfile.TemporaryDirectory(prefix='seenry review relocation ') as tmp:
   root=self.root(tmp);relocated=root/'skills';guide_root=relocated/'seenry'
   resources={'seenry':['visual-review.md','quality-diagnosis.md','interaction-review.md'],
              'seenry-motion':['motion-contract.md'],'seenry-assets':['material-review.md']}
   for skill,names in resources.items():
    destination=relocated/skill/'references';destination.mkdir(parents=True)
    for name in names:shutil.copyfile(ROOT/'skills'/skill/'references'/name,destination/name)
   p=prepare(self.manifest(),root,root/'out',review_root=guide_root)
   self.assertEqual(len(p['guidance']),5)
   for entry in p['guidance']:
    self.assertEqual(entry['content'],(relocated/entry['path']).read_text(encoding='utf-8'))
   (relocated/'seenry-motion/references/motion-contract.md').unlink()
   with self.assertRaises(FileNotFoundError):prepare(self.manifest(),root,root/'missing',review_root=guide_root)
   self.assertFalse((root/'missing').exists())

if __name__=='__main__':unittest.main()
