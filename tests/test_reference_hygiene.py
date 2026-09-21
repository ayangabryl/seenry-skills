"""Keep historical output bias out of installed packets, without losing dependencies."""
import importlib.util
import shutil
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('hygiene_packet', ROOT/'skills/seenry/scripts/packet.py')
packet=importlib.util.module_from_spec(spec);spec.loader.exec_module(packet)

class ReferenceHygiene(unittest.TestCase):
    def test_installed_skills_have_no_frozen_design_screenshots(self):
        images=[p for p in (ROOT/'skills/seenry/references/lessons').rglob('*') if p.suffix.lower() in ('.png','.jpg','.jpeg','.webp')]
        self.assertEqual(images,[])
        self.assertFalse((ROOT/'skills/seenry/assets/studies/website-evidence').exists())
        self.assertTrue((ROOT/'skills/seenry/licenses/NOTICE.md').is_file())
        self.assertTrue((ROOT/'evals/archive/visual-lessons/export-feedback.json').is_file())

    def test_both_profiles_exclude_unrequested_historical_examples(self):
        project={'scope':'component','media':'none','motion':'none'}
        for profile in ('focused','complete'):
            for stage in ('plan','type','surface','prototype','compare','build','review','refine'):
                result=packet.compile_packet(stage,project=project,profile=profile,research_source='local')
                self.assertIsNone(result['visual_lessons'])
                self.assertFalse(any('/archive/' in r['path'] for r in result['resources']))

    def test_selected_exercise_survives_relocation_with_no_repository_archive(self):
        with tempfile.TemporaryDirectory() as temp:
            destination=Path(temp)/'skills'
            shutil.copytree(ROOT/'skills',destination)
            skill=destination/'seenry'
            project={'scope':'component','media':'none','motion':'none','decisions':['controls']}
            result=packet.compile_packet('refine',project=project,root=skill,research_source='local')
            paths=[r['path'] for r in result['resources']]
            self.assertEqual(paths.count('seenry/assets/craft/controls.html'),1)
            self.assertEqual(result['visual_lessons']['lessons'][0]['evidence'],[])
            (skill/'assets/craft/controls.html').unlink()
            with self.assertRaises(FileNotFoundError):
                packet.compile_packet('refine',project=project,root=skill,research_source='local')

    def test_cdn_guidance_is_selected_for_connected_research_only(self):
        guide='seenry-assets/references/seenry-media.md'
        for route in ('auto','mcp','local','web'):
            result=packet.compile_packet('research',research_source=route)
            self.assertEqual(guide in [r['path'] for r in result['resources']],route in ('auto','mcp'))
        narrow=packet.compile_packet('refine',decision='controls',research_source='local')
        self.assertNotIn(guide,[r['path'] for r in narrow['resources']])
