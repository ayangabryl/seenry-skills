"""Check context routing without paying for another broad generation benchmark."""
import hashlib
import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'skills/seenry/scripts'))
from packet import compile_packet


class FocusedRouting(unittest.TestCase):
    def test_generic_component_context_stays_bounded_and_keeps_actual_decisions(self):
        project={'scope':'component','media':'none','motion':'feedback',
                 'retained_behavior':['Keep the chosen date on failure']}
        for stage in ('plan','type','surface','build','review'):
            p=compile_packet(stage,project=project,profile='focused')
            self.assertLess(p['guidance_size']['words'],3200,stage)
            self.assertEqual(p['project_decisions'],project)
            self.assertIsNone(p['visual_lessons'])
            paths={r['path'] for r in p['resources']}
            self.assertNotIn('seenry/references/art-direction.md',paths)
            self.assertNotIn('seenry/references/studies/hoy.md',paths)
            for resource in p['resources']:
                self.assertEqual(resource['sha256'],hashlib.sha256((ROOT/'skills'/resource['path']).read_bytes()).hexdigest())

    def test_review_receives_applicable_motion_and_material_without_callsite_flags(self):
        for stage in ('compare','review'):
            p=compile_packet(stage,profile='focused',project={'scope':'component','media':'needed','motion':'feedback'})
            paths={r['path'] for r in p['resources']}
            self.assertIn('seenry-motion/references/motion-contract.md',paths)
            self.assertIn('seenry-assets/references/object-material.md',paths)
            self.assertIn('seenry/references/visual-review.md',paths)
            self.assertNotIn('seenry-motion/references/expressive-effects.md',paths)
        p=compile_packet('review',profile='focused',project={'media':'none','motion':'none'})
        self.assertFalse(any(r['path'].startswith(('seenry-motion/','seenry-assets/')) for r in p['resources']))

    def test_selected_color_question_loads_full_guide_and_real_lesson_images(self):
        project={'scope':'component','media':'none','motion':'none','decisions':['color']}
        p=compile_packet('surface',project=project,profile='focused')
        self.assertIn('seenry/references/color-decisions.md',{r['path'] for r in p['resources']})
        self.assertEqual([x['id'] for x in p['visual_lessons']['lessons']],['color'])
        self.assertTrue(p['visual_lessons']['lessons'][0]['evidence'])

    def test_cli_defaults_to_focused_and_complete_remains_explicit(self):
        cli=ROOT/'skills/seenry/scripts/packet.py'
        def run(*args):
            return json.loads(subprocess.check_output([sys.executable,str(cli),'plan',*args],text=True))
        focused=run();complete=run('--profile','complete')
        self.assertEqual(focused['profile'],'focused')
        self.assertFalse(focused['entrypoint']['body_supplied'])
        self.assertTrue(complete['entrypoint']['body_supplied'])
        self.assertLess(focused['guidance_size']['words'],complete['guidance_size']['words'])
