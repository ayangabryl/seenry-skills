"""Check context routing without paying for another broad generation benchmark."""
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'skills/seenry/scripts'))
from packet import STAGES, compile_packet


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

    def test_guide_topics_are_bounded_and_separate_from_rendered_lessons(self):
        project={'scope':'component','media':'none','motion':'none'}
        for topics in (None, 'subject-fit', ['unknown'], ['subject-fit','subject-fit'], ['brand-guidelines','brand-guidelines'], [{}]):
            with self.subTest(topics=topics), self.assertRaisesRegex(ValueError,'guide_topics'):
                compile_packet('review',project={**project,'guide_topics':topics},profile='focused')
        for profile in ('focused','complete'):
            base=compile_packet('review',project=project,profile=profile)
            guided=compile_packet('review',project={**project,'guide_topics':['subject-fit','convergence']},profile=profile)
            self.assertEqual(guided['visual_lessons'],base['visual_lessons'])
        explicit=compile_packet('review',project={**project,'guide_topics':['subject-fit'],'decisions':['color']},profile='focused')
        self.assertEqual([x['id'] for x in explicit['visual_lessons']['lessons']],['color'])

    def test_selected_guides_follow_scope_and_relevant_stages_without_default_cost(self):
        relevant={'plan','prototype','compare','review','refine'}
        for scope in ('component','website'):
            project={'scope':scope,'media':'none','motion':'none','retained_behavior':['Preserve the current choice']}
            for stage in STAGES:
                with self.subTest(scope=scope,stage=stage):
                    base=compile_packet(stage,project=project,profile='focused')
                    empty=compile_packet(stage,project={**project,'guide_topics':[]},profile='focused')
                    self.assertEqual(empty['resources'],base['resources'])
                    self.assertEqual(empty['guidance_size'],base['guidance_size'])
                    selected={**project,'guide_topics':['subject-fit','convergence']}
                    guided=compile_packet(stage,project=selected,profile='focused')
                    paths=[r['path'] for r in guided['resources']]
                    self.assertEqual(guided['project_decisions'],selected)
                    self.assertIsNone(guided['visual_lessons'])
                    self.assertEqual(len(paths),len(set(paths)))
                    if stage in relevant:
                        self.assertIn('seenry/references/quality-diagnosis.md',paths)
                        if stage in ('plan','prototype','refine'):
                            self.assertIn('seenry/references/'+('component-design.md' if scope=='component' else 'art-direction.md'),paths)
                    else:
                        self.assertEqual(guided['resources'],base['resources'])
                    if scope=='component':
                        self.assertNotIn('seenry/references/art-direction.md',paths)

    def test_convergence_does_not_add_a_new_organizing_idea_or_change_runtime(self):
        project={'scope':'component','media':'none','motion':'feedback','motion_helpers':['geometry'],'research_source':'local'}
        for stage in ('prototype','review','refine'):
            base=compile_packet(stage,project=project,profile='focused')
            guided=compile_packet(stage,project={**project,'guide_topics':['convergence']},profile='focused')
            extra={r['path'] for r in guided['resources']}-{r['path'] for r in base['resources']}
            self.assertEqual(extra,{'seenry/references/quality-diagnosis.md'})
            self.assertEqual(guided['runtime_files'],base['runtime_files'])
            self.assertEqual(guided['research_source'],'local')

    def test_brand_guidelines_are_explicit_and_do_not_add_unrelated_guidance(self):
        guide='seenry-branding/references/project-guidelines.md'
        relevant={'plan','type','prototype','surface','build','review','refine'}
        for profile in ('focused','complete'):
            for scope in ('component','website','system'):
                project={'scope':scope,'media':'none','motion':'none','research_source':'local',
                         'shared_decisions':{'path':'BRAND.md','version':'2',
                                             'rules':{'action':'Use the existing primary action component',
                                                      'secondary_text':'var(--text-secondary)'}}}
                original=json.dumps(project,sort_keys=True)
                for stage in STAGES:
                    with self.subTest(profile=profile,scope=scope,stage=stage):
                        base=compile_packet(stage,project=project,profile=profile)
                        selected={**project,'guide_topics':['brand-guidelines']}
                        guided=compile_packet(stage,project=selected,profile=profile)
                        base_paths={r['path'] for r in base['resources']}
                        paths=[r['path'] for r in guided['resources']]
                        self.assertNotIn(guide,base_paths)
                        self.assertEqual(set(paths)-base_paths,{guide} if stage in relevant else set())
                        self.assertEqual(len(paths),len(set(paths)))
                        self.assertNotIn('seenry-branding/assets/BRAND.example.md',paths)
                        self.assertEqual(guided['project_decisions'],selected)
                        self.assertEqual(guided['visual_lessons'],base['visual_lessons'])
                        self.assertEqual(guided['runtime_files'],base['runtime_files'])
                        self.assertEqual(guided['research_source'],'local')
                self.assertEqual(json.dumps(project,sort_keys=True),original)

    def test_brand_guidelines_combine_with_diagnosis_and_selected_lessons(self):
        guide='seenry-branding/references/project-guidelines.md'
        project={'scope':'component','media':'none','motion':'none','decisions':['color']}
        for topics in (['subject-fit'],['convergence'],['subject-fit','convergence']):
            for stage in ('plan','surface','review'):
                with self.subTest(topics=topics,stage=stage):
                    base=compile_packet(stage,project={**project,'guide_topics':topics},profile='focused')
                    guided=compile_packet(stage,project={**project,'guide_topics':topics+['brand-guidelines']},profile='focused')
                    self.assertEqual({r['path'] for r in guided['resources']}-{r['path'] for r in base['resources']},{guide})
                    self.assertEqual(guided['visual_lessons'],base['visual_lessons'])
                    if stage in ('plan','review'):
                        self.assertIn('seenry/references/quality-diagnosis.md',{r['path'] for r in guided['resources']})

    def test_brand_guideline_handoff_relocates_offline_and_preserves_project_rules(self):
        from stage_request import prepare
        project={'scope':'system','media':'none','motion':'none','research_source':'local',
                 'guide_topics':['brand-guidelines'],
                 'shared_decisions':{'path':'docs/identity.md','version':'2026-09-12',
                                     'rules':['Body text uses the bundled sans family.',
                                              'Use var(--action-primary) for the primary action.']}}
        original=json.dumps(project,sort_keys=True)
        with tempfile.TemporaryDirectory() as temporary:
            destination=Path(temporary)/'skills'
            shutil.copytree(ROOT/'skills',destination)
            relocated=destination/'seenry'
            (relocated/'references/mcp-tools.json').unlink()
            (relocated/'references/research.md').unlink()
            (destination/'seenry-branding/assets/BRAND.example.md').unlink(missing_ok=True)
            guide=destination/'seenry-branding/references/project-guidelines.md'
            out=Path(temporary)/'request'
            prepare('build',project,'Extend the settings screen using the supplied identity rules.',out,root=relocated)
            packet=json.loads((out/'packet.json').read_text())
            resource=next(r for r in packet['resources'] if r['path']=='seenry-branding/references/project-guidelines.md')
            self.assertEqual(resource['content'],guide.read_text())
            self.assertEqual(resource['sha256'],hashlib.sha256(guide.read_bytes()).hexdigest())
            self.assertEqual(packet['project_decisions']['shared_decisions'],project['shared_decisions'])
            self.assertEqual(packet['research_source'],'local')
            self.assertIn(json.dumps(project['shared_decisions']['rules'][1]),(out/'prompt.txt').read_text())
            self.assertEqual(json.dumps(project,sort_keys=True),original)
            guide.unlink()
            compile_packet('build',project={**project,'guide_topics':[]},profile='focused',root=relocated)
            compile_packet('research',project=project,profile='focused',root=relocated)
            missing_out=Path(temporary)/'missing-guide-request'
            with self.assertRaisesRegex(FileNotFoundError,'project-guidelines.md'):
                prepare('build',project,'Extend the settings screen.',missing_out,root=relocated)
            self.assertFalse(missing_out.exists())

    def test_cli_defaults_to_focused_and_complete_remains_explicit(self):
        cli=ROOT/'skills/seenry/scripts/packet.py'
        def run(*args):
            return json.loads(subprocess.check_output([sys.executable,str(cli),'plan',*args],text=True))
        focused=run();complete=run('--profile','complete')
        self.assertEqual(focused['profile'],'focused')
        self.assertFalse(focused['entrypoint']['body_supplied'])
        self.assertTrue(complete['entrypoint']['body_supplied'])
        self.assertLess(focused['guidance_size']['words'],complete['guidance_size']['words'])
