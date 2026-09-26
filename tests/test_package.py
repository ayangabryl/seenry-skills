import importlib.util
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]

def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

installer = module('seenry_install', ROOT / 'scripts/install.py')
packet = module('seenry_packet', ROOT / 'skills/seenry/scripts/packet.py')

class Installation(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.home = Path(self.temp.name) / 'home'
        self.home.mkdir()
    def tearDown(self):
        self.temp.cleanup()
    def test_dry_run_keeps_unrelated_skills(self):
        unrelated = self.home / '.codex/skills/unrelated'
        unrelated.mkdir(parents=True)
        (unrelated / 'SKILL.md').write_text('keep me')
        plan = installer.plan(self.home)
        self.assertEqual(plan['status'], 'planned')
        self.assertEqual(plan['old'], [])
        self.assertEqual((unrelated / 'SKILL.md').read_text(), 'keep me')
        self.assertFalse((self.home / '.agents/skills/seenry').exists())
    def test_shared_install_idempotence_and_rollback(self):
        unrelated = self.home / '.codex/skills/unrelated'
        unrelated.mkdir(parents=True)
        (unrelated / 'SKILL.md').write_text('keep me')
        plan = installer.plan(self.home)
        manifest = installer.apply(plan)
        for name in installer.NAMES:
            canonical = self.home / '.agents/skills' / name
            for agent in installer.AGENTS[1:]:
                self.assertEqual((self.home / f'.{agent}/skills' / name).resolve(), canonical.resolve())
        self.assertEqual(installer.plan(self.home)['status'], 'unchanged')
        installer.undo(plan, manifest.parent)
        self.assertFalse((self.home / '.agents/skills/seenry').exists())
        self.assertEqual((unrelated / 'SKILL.md').read_text(), 'keep me')
    def test_copy_mode_and_upgrade_rollback(self):
        first = installer.plan(self.home, link_mode='copy')
        installer.apply(first)
        with self.assertRaises(ValueError):
            installer.plan(self.home)
        second = installer.plan(self.home, replace=True)
        manifest = installer.apply(second)
        installer.undo(second, manifest.parent)
        for name in installer.NAMES:
            self.assertFalse((self.home / '.codex/skills' / name).is_symlink())
    def test_rollback_refuses_to_erase_later_edits(self):
        plan = installer.plan(self.home)
        manifest = installer.apply(plan)
        target = self.home / '.agents/skills/seenry/SKILL.md'
        target.write_text(target.read_text(encoding='utf-8') + '\nUser edit\n', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'content changed'):
            installer.undo(plan, manifest.parent)
        self.assertTrue((self.home / '.codex/skills/seenry').is_symlink())
        self.assertIn('User edit', target.read_text(encoding='utf-8'))
    def test_runtime_bytecode_does_not_become_installed_source_or_block_rollback(self):
        source=self.home/'checkout';shutil.copytree(ROOT/'skills',source/'skills')
        cache=source/'skills/seenry/scripts/__pycache__';cache.mkdir(exist_ok=True)
        (cache/'local.pyc').write_bytes(b'local runtime cache')
        plan=installer.plan(self.home,source=source);manifest=installer.apply(plan)
        installed=self.home/'.agents/skills/seenry/scripts/__pycache__'
        self.assertFalse(installed.exists())
        installed.mkdir();(installed/'other.pyc').write_bytes(b'created by using the skill')
        self.assertEqual(installer.plan(self.home,source=source)['status'],'unchanged')
        installer.undo(plan,manifest.parent)
        self.assertFalse((self.home/'.agents/skills/seenry').exists())
    def test_failed_symlink_creation_rolls_back_partial_install(self):
        plan = installer.plan(self.home)
        with patch.object(Path, 'symlink_to', side_effect=OSError('no symlink privilege')):
            with self.assertRaises(OSError):
                installer.apply(plan)
        self.assertFalse((self.home / '.agents/skills/seenry').exists())
    def test_missing_source_rejected_before_install(self):
        with self.assertRaises(ValueError):
            installer.plan(self.home, source=self.home)
        self.assertFalse((self.home / '.agents/skills/seenry').exists())
    def test_missing_backup_stops_rollback_before_removing_install(self):
        first = installer.plan(self.home)
        installer.apply(first)
        source = self.home / 'updated'
        shutil.copytree(ROOT / 'skills', source / 'skills')
        (source / 'skills/seenry/SKILL.md').write_text('updated skill')
        second = installer.plan(self.home, source=source, replace=True)
        manifest = installer.apply(second)
        shutil.rmtree(manifest.parent / 'entries/agents/seenry')
        with self.assertRaisesRegex(ValueError, 'Missing archive'):
            installer.undo(second, manifest.parent)
        self.assertEqual((self.home / '.agents/skills/seenry/SKILL.md').read_text(), 'updated skill')

class Packets(unittest.TestCase):
    def test_no_mcp_packet_works_without_server_contract_or_lookup_guide(self):
        with tempfile.TemporaryDirectory() as temporary:
            destination = Path(temporary) / 'skills'
            shutil.copytree(ROOT / 'skills', destination)
            relocated = destination / 'seenry'
            (relocated / 'references/mcp-tools.json').unlink()
            (relocated / 'references/research.md').unlink()
            for stage in packet.STAGES:
                result = packet.compile_packet(stage, motion=True, assets=True, root=relocated, research_source='local', profile='complete')
                self.assertEqual(result['research_source'], 'local')
                paths = [r['path'] for r in result['resources']]
                self.assertIn('seenry/references/without-mcp.md', paths)
                self.assertNotIn('seenry/references/research.md', paths)
            with self.assertRaises(FileNotFoundError):
                packet.compile_packet('research', root=relocated, research_source='mcp')

    def test_stage_selection_is_complete_and_hashed(self):
        for stage in packet.STAGES:
            result = packet.compile_packet(stage, motion=True, assets=True)
            self.assertEqual(result['evidence'], 'supplied-only')
            self.assertTrue(all(len(x['sha256']) == 64 and x['content'] for x in result['resources']))
            self.assertEqual(len(result['resources']), len(set(x['path'] for x in result['resources'])))
    def test_relocation_and_missing_optional_dependency(self):
        with tempfile.TemporaryDirectory() as temporary:
            destination = Path(temporary) / 'skills'
            shutil.copytree(ROOT / 'skills', destination)
            relocated = destination / 'seenry'
            self.assertEqual(packet.compile_packet('research'), packet.compile_packet('research', root=relocated))
            shutil.rmtree(destination / 'seenry-motion')
            packet.compile_packet('plan', root=relocated)
            with self.assertRaises(FileNotFoundError):
                packet.compile_packet('plan', motion=True, root=relocated)
    def test_focused_lessons_resolve_from_relocated_install_without_mcp(self):
        with tempfile.TemporaryDirectory() as temporary:
            destination=Path(temporary)/'skills';shutil.copytree(ROOT/'skills',destination)
            relocated=destination/'seenry'
            (relocated/'references/mcp-tools.json').unlink()
            result=packet.compile_packet('prototype',root=relocated,research_source='local',profile='focused',project={'scope':'component','media':'needed','motion':'feedback','decisions':['controls'],'guide_topics':['subject-fit','convergence']})
            resources={r['path']:r for r in result['resources']}
            self.assertIn('seenry/references/quality-diagnosis.md',resources)
            self.assertIn('seenry/references/component-design.md',resources)
            self.assertNotIn('seenry/references/art-direction.md',resources)
            self.assertEqual(result['research_source'],'local')
            lessons=result['visual_lessons'];evidence_root=Path(lessons['evidence_root'])
            self.assertTrue(evidence_root.is_relative_to(destination.resolve()))
            for lesson in lessons['lessons']:
                self.assertEqual(lesson['evidence'],[])
                for resource in lesson['resources']:
                    self.assertTrue((relocated/resource['path']).is_file())
                    self.assertIn('seenry/'+resource['path'],resources)

if __name__ == '__main__':
    unittest.main()
