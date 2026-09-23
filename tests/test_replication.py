import copy, hashlib, importlib.util, json, shutil, tempfile, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def load(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/file);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
packet=load('rep_packet','skills/seenry/scripts/packet.py')
gate=load('rep_gate','skills/seenry/scripts/replication_gate.py')
class Replication(unittest.TestCase):
 def test_replica_excludes_creative_routes(self):
  for stage in packet.STAGES:
   p=packet.compile_packet(stage,project={'intent':'replicate','media':'none','motion':'signature','motion_patterns':['fluid-menu']},research_source='local')
   paths=[r['path'] for r in p['resources']]
   self.assertIn('seenry/references/replication.md',paths)
   self.assertIn('seenry-motion/references/patterns/surfaces.md',paths)
   self.assertFalse(any(x.endswith(('art-direction.md','component-design.md','.html','worked-scores.md')) for x in paths))
   self.assertLess(p['guidance_size']['words'],2500)
 def test_explicit_product_helpers_include_required_runtime_and_usage(self):
  p=packet.compile_packet('build',project={'scope':'component','media':'none','motion':'feedback','motion_helpers':['selection-surface','anchored-surface']},research_source='local')
  paths=[r['path'] for r in p['resources']]
  self.assertIn('seenry-motion/references/system-choreography.md',paths)
  runtime={r['path']:r['sha256'] for r in p['runtime_files']}
  for name in ['selection-surface.mjs','selection-surface.css','anchored-surface.mjs']:
   path='seenry-motion/assets/'+name
   self.assertEqual(runtime[path],hashlib.sha256((ROOT/'skills'/path).read_bytes()).hexdigest())
 def test_selector_conflicts_and_bad_intent(self):
  for project in [{'intent':'copy'},{'motion_patterns':['unknown']},{'motion_patterns':['dialog','dialog']},{'motion_patterns':'dialog'},{'motion':'none','motion_patterns':['dialog']}]:
   with self.assertRaises(ValueError):packet.compile_packet('plan',project=project)
  with self.assertRaises(ValueError):packet.compile_packet('plan',project={'intent':'replicate','media':'none','motion':'none','decision_study':'attention'})
 def test_required_pattern_closure_and_relocation(self):
  with tempfile.TemporaryDirectory() as t:
   dest=Path(t)/'skills';shutil.copytree(ROOT/'skills',dest)
   project={'intent':'replicate','media':'none','motion':'feedback','motion_patterns':['number-change']}
   p=packet.compile_packet('build',project=project,root=dest/'seenry')
   self.assertTrue(any(x['path'].endswith('LICENSE') for x in p['runtime_files']))
   (dest/'seenry-motion/references/patterns/content.md').unlink()
   with self.assertRaises(FileNotFoundError):packet.compile_packet('build',project=project,root=dest/'seenry')
 def test_every_pattern_resolves_without_loading_catalog(self):
  catalog=json.loads((ROOT/'skills/seenry-motion/references/patterns/catalog.json').read_text())
  for name in catalog:
   p=packet.compile_packet('refine',decision='motion',project={'motion':'feedback','motion_patterns':[name]},research_source='local')
   self.assertFalse(any(x['path'].endswith('patterns.md') for x in p['resources']))
   self.assertEqual(sum('/patterns/' in x['path'] for x in p['resources']),1)
 def test_evidence_gate_never_certifies_missing_evidence(self):
  with tempfile.TemporaryDirectory() as t:
   base=Path(t);(base/'source').write_text('source');(base/'output').write_text('output')
   ledger={'schema':1,'required_states':['open'],'motion_states':['open'],'artifacts':{n:{'role':n,'path':n,'sha256':hashlib.sha256((base/n).read_bytes()).hexdigest()} for n in ['source','output']},'measurements':[{'name':k,'state':'open','kind':k,'target':10,'actual':10,'tolerance':1,'basis':'Test fixture only','source_artifact':'source','output_artifact':'output'} for k in ['geometry','type-spacing','motion']],'unresolved':[]}
   self.assertEqual(gate.check(ledger,base)['status'],'matched within recorded tolerances')
   bad=copy.deepcopy(ledger);bad['measurements'][0]['actual']=12
   self.assertEqual(gate.check(bad,base)['status'],'needs revision')
   for mutate in [lambda x:x['measurements'].pop(),lambda x:x['artifacts']['source'].update(sha256='a'*64),lambda x:x['unresolved'].append('Font unknown'),lambda x:x['measurements'][0].update(actual=float('nan')),lambda x:x['artifacts']['output'].update(path='../escape')]:
    bad=copy.deepcopy(ledger);mutate(bad);self.assertEqual(gate.check(bad,base)['status'],'unverified')
