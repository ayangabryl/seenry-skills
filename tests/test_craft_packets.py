import hashlib
import importlib.util
import shutil
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('craft_packet',ROOT/'skills/seenry/scripts/packet.py')
packet=importlib.util.module_from_spec(spec);spec.loader.exec_module(packet)

class CraftPackets(unittest.TestCase):
 def test_default_and_historical_mode(self):
  self.assertEqual(packet.compile_packet('plan')['profile'],'focused')
  self.assertTrue(packet.compile_packet('plan',profile='complete')['entrypoint']['body_supplied'])
 def test_narrow_decisions_preserve_project_without_unrelated_guidance(self):
  project={'scope':'component','media':'none','motion':'feedback','retained_behavior':['Keep selected date on cancel']}
  for decision in packet.CRAFT_DECISIONS:
   p=packet.compile_packet('refine',decision=decision,project=project,research_source='local')
   self.assertEqual(p['project_decisions'],project)
   self.assertEqual(p['evidence'],'supplied-only')
   self.assertEqual(len(p['resources']),4 if decision in ('layout','typography','color','controls') else 3)
   self.assertEqual(sum(r['path'].endswith('.html') for r in p['resources']),1)
   self.assertLess(p['guidance_size']['words'],2500)
   for r in p['resources']:
    self.assertEqual(r['sha256'],hashlib.sha256((ROOT/'skills'/r['path']).read_bytes()).hexdigest())
   self.assertNotIn('seenry/references/research.md',[r['path'] for r in p['resources']])
 def test_relocation_offline_and_missing_dependency(self):
  with tempfile.TemporaryDirectory() as t:
   dest=Path(t)/'skills';shutil.copytree(ROOT/'skills',dest)
   root=dest/'seenry'
   (root/'references/research.md').unlink()
   packet.compile_packet('refine',decision='controls',root=root,research_source='local')
   (root/'assets/craft/controls.html').unlink()
   with self.assertRaises(FileNotFoundError):packet.compile_packet('refine',decision='controls',root=root)
 def test_invalid_selection_is_not_silently_ignored(self):
  with self.assertRaises(ValueError):packet.compile_packet('refine',decision='unknown')
  with self.assertRaises(ValueError):packet.compile_packet('refine',decision='color',profile='complete')
  with self.assertRaises(ValueError):packet.compile_packet('refine',decision='motion',project={'motion':'none'})

 def test_focused_motion_supplies_explicit_helpers_and_runtime(self):
  p=packet.compile_packet('refine',decision='motion',project={'motion':'feedback','motion_helpers':['geometry','icon-swap']})
  resources={r['path'] for r in p['resources']}
  runtime={r['path'] for r in p['runtime_files']}
  self.assertIn('seenry-motion/references/product-transitions.md',resources)
  for f in ['geometry-transition.mjs','icon-swap.mjs']:
   self.assertIn('seenry-motion/assets/'+f,resources)
   self.assertIn('seenry-motion/assets/'+f,runtime)
  self.assertFalse(any('number-flow/' in x for x in runtime))

 def test_scroll_helper_does_not_load_utility_transition_recipes(self):
  p=packet.compile_packet('refine',decision='motion',project={'motion':'scroll','motion_helpers':['scroll']})
  paths={r['path'] for r in p['resources']}
  self.assertIn('seenry-motion/references/scroll-choreography.md',paths)
  self.assertNotIn('seenry-motion/references/product-transitions.md',paths)

 def test_focused_helper_closure_relocates_and_rejects_missing_runtime(self):
  project={'motion':'feedback','motion_helpers':['morph-icon']}
  with tempfile.TemporaryDirectory() as t:
   dest=Path(t)/'skills';shutil.copytree(ROOT/'skills',dest)
   p=packet.compile_packet('refine',decision='motion',project=project,root=dest/'seenry',research_source='local')
   self.assertTrue(any(x['path'].endswith('LICENSE') for x in p['runtime_files']))
   (dest/'seenry-motion/assets/morphicons/dom.js').unlink()
   with self.assertRaises(FileNotFoundError):packet.compile_packet('refine',decision='motion',project=project,root=dest/'seenry')

 def test_focused_helpers_validate_even_with_other_decision(self):
  for helpers in ['geometry',['unknown'],['geometry','geometry'],[{}]]:
   with self.assertRaises(ValueError):packet.compile_packet('refine',decision='controls',project={'motion_helpers':helpers})
  with self.assertRaises(ValueError):packet.compile_packet('refine',decision='controls',project={'motion':'none','motion_helpers':['geometry']})
