import importlib.util,json,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def load(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
lessons=load('lessons',ROOT/'skills/seenry/scripts/lesson_packet.py')
probe=load('probe',ROOT/'skills/seenry/scripts/reviewer_probe.py')
packet=load('packet',ROOT/'skills/seenry/scripts/packet.py')
class VisualLessons(unittest.TestCase):
 def test_selected_lessons_have_actual_images_and_countercases(self):
  for topic in ['state','hierarchy','color','enclosure','controls','continuity','finish','export-feedback']:
   p=lessons.select([topic]);self.assertEqual(len(p['lessons']),1);self.assertTrue(p['lessons'][0]['countercase'])
   self.assertGreaterEqual(len(p['lessons'][0]['evidence']),2)
 def test_topics_are_bounded_and_exact(self):
  for topics in [[],['unknown'],['state','state'],['state','color','controls']]:
   with self.assertRaises(ValueError):lessons.select(topics)
 def test_stage_routes_assets_as_actual_evidence(self):
  p=packet.compile_packet('surface',project={'media':'none','motion':'none','scope':'component','decisions':['enclosure']})
  self.assertEqual([x['id'] for x in p['visual_lessons']['lessons']],['enclosure'])
 def test_focused_packet_records_unsupplied_entrypoint_and_reduces_repeated_text(self):
  project={'media':'none','motion':'feedback','scope':'component','decisions':['state']}
  complete=packet.compile_packet('plan',project=project)
  focused=packet.compile_packet('plan',project=project,profile='focused')
  self.assertFalse(focused['entrypoint']['body_supplied'])
  self.assertEqual(complete['entrypoint']['sha256'],focused['entrypoint']['sha256'])
  self.assertLess(sum(len(x['content']) for x in focused['resources']),sum(len(x['content']) for x in complete['resources']))
  self.assertEqual([x['id'] for x in focused['visual_lessons']['lessons']],['state'])
  default=packet.compile_packet('plan',project={k:v for k,v in project.items() if k!='decisions'},profile='focused')
  self.assertIsNone(default['visual_lessons'])
  with self.assertRaises(ValueError):packet.compile_packet('plan',profile='unknown')
 def test_observed_preference_does_not_invent_source_html(self):
  lesson=lessons.select(['finish'])['lessons'][0]
  self.assertTrue(all(x['html'] is None for x in lesson['evidence']))
 def test_feedback_reaches_the_packet_with_exact_render_provenance(self):
  item=lessons.select(['export-feedback'])['lessons'][0]
  feedback=item['feedback_record']['record']
  self.assertTrue(feedback['quotation']);self.assertEqual({x['human_decision'] for x in feedback['artifacts']},{'reject'})
  actual={e['file']:e['sha256'] for e in item['evidence']}
  self.assertEqual(actual,{e['file']:e['image_sha256'] for e in feedback['artifacts']})
 def test_explicit_feedback_survives_planning_build_and_review_handoffs(self):
  project={'scope':'component','media':'needed','motion':'feedback','decisions':['export-feedback']}
  for profile in ('complete','focused'):
   for stage in ('plan','wireframe','type','surface','compare','build','review','refine'):
    p=packet.compile_packet(stage,project=project,profile=profile)
    lesson=p['visual_lessons']['lessons'][0]
    self.assertEqual(lesson['id'],'export-feedback')
    self.assertEqual({x['human_decision'] for x in lesson['feedback_record']['record']['artifacts']},{'reject'})
    if stage in ('plan','type','surface','build','refine'):
     self.assertIn('seenry/references/content-and-finish.md',[r['path'] for r in p['resources']])
 def test_blinding_hides_labels_and_original_filenames(self):
  with tempfile.TemporaryDirectory() as tmp:
   source=Path(tmp);(source/'obvious-good.png').write_bytes((lessons.ROOT/'state-B.png').read_bytes())
   manifest={'cases':[{'id':'gold-secret','brief':'Choose a track','question':'Which works?','human_labels':[{'secret':'expected'}],'variants':[{'id':'good','image':'obvious-good.png'}]}]}
   public=probe.prepare(manifest,source,source/'out',42)
   text=json.dumps(public);self.assertNotIn('gold-secret',text);self.assertNotIn('expected',text);self.assertNotIn('obvious-good',text)
 def test_normalize_and_order_consistency_do_not_claim_accuracy(self):
  key={'cases':[{'public_id':'case-1','id':'state','map':{'A':{'id':'one'},'B':{'id':'two'}}}]}
  review={'cases':[{'id':'case-1','preferred':'B','observation':'Concrete difference','repair':'No change'}]}
  first=probe.normalize(review,key);self.assertEqual(first['state']['preferred'],'two')
  score=probe.compare(first,first);self.assertEqual(score['consistent_choices'],1);self.assertNotIn('accuracy',score)
  with self.assertRaises(ValueError):probe.normalize({'cases':[]},key)
  review['cases'][0]['preferred']='secret'
  with self.assertRaises(ValueError):probe.normalize(review,key)
if __name__=='__main__':unittest.main()
