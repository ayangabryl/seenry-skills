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
    def legacy(self):
        old = self.home / '.codex/skills/design-judgment'
        old.mkdir(parents=True)
        (old / 'SKILL.md').write_text('old entrypoint')
        (old / 'runtime.py').write_text('preserve this tool')
        alias = self.home / '.agents/skills/design-judgment'
        alias.parent.mkdir(parents=True)
        alias.symlink_to(old, target_is_directory=True)
        return old, alias
    def test_dry_run_never_moves_legacy(self):
        old, alias = self.legacy()
        before = installer.signature(old)
        plan = installer.plan(self.home, migrate=True)
        self.assertEqual(before, installer.signature(old))
        self.assertTrue(alias.is_symlink())
        self.assertEqual(len(plan['old']), 2)
    def test_shared_install_archive_idempotence_and_rollback(self):
        old, alias = self.legacy()
        unrelated = self.home / '.codex/skills/unrelated'
        unrelated.mkdir()
        (unrelated / 'SKILL.md').write_text('keep me')
        plan = installer.plan(self.home, migrate=True)
        manifest = installer.apply(plan)
        self.assertFalse(installer.exists(old))
        self.assertFalse(installer.exists(alias))
        backup = manifest.parent / 'entries/codex/design-judgment'
        self.assertEqual((backup / 'runtime.py').read_text(encoding='utf-8'), 'preserve this tool')
        for name in installer.NAMES:
            canonical = self.home / '.agents/skills' / name
            for agent in installer.AGENTS[1:]:
                self.assertEqual((self.home / f'.{agent}/skills' / name).resolve(), canonical.resolve())
        self.assertEqual(installer.plan(self.home, migrate=True)['status'], 'unchanged')
        installer.undo(plan, manifest.parent)
        self.assertTrue(alias.is_symlink())
        self.assertEqual((old / 'SKILL.md').read_text(encoding='utf-8'), 'old entrypoint')
        self.assertEqual((unrelated / 'SKILL.md').read_text(encoding='utf-8'), 'keep me')
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
    def test_failed_symlink_creation_restores_all_old_content(self):
        old, alias = self.legacy()
        plan = installer.plan(self.home, migrate=True)
        with patch.object(Path, 'symlink_to', side_effect=OSError('no symlink privilege')):
            with self.assertRaises(OSError):
                installer.apply(plan)
        self.assertEqual((old / 'runtime.py').read_text(encoding='utf-8'), 'preserve this tool')
        self.assertTrue(alias.is_symlink())
        self.assertFalse((self.home / '.agents/skills/seenry').exists())
    def test_missing_source_rejected_before_migration(self):
        old, _ = self.legacy()
        with self.assertRaises(ValueError):
            installer.plan(self.home, source=self.home, migrate=True)
        self.assertTrue((old / 'SKILL.md').exists())
    def test_rollback_collision_is_all_or_nothing(self):
        old, _ = self.legacy()
        plan = installer.plan(self.home, migrate=True)
        manifest = installer.apply(plan)
        old.mkdir()
        (old / 'user.txt').write_text('new work')
        with self.assertRaisesRegex(ValueError, 'collision'):
            installer.undo(plan, manifest.parent)
        self.assertTrue((self.home / '.codex/skills/seenry').is_symlink())

class Packets(unittest.TestCase):
    def test_optional_motion_study_is_scoped_hashed_and_relocatable(self):
        project = {'media': 'none', 'motion': 'signature', 'motion_libraries': ['liquid-gooey', 'metal-fx']}
        with tempfile.TemporaryDirectory() as temporary:
            destination = Path(temporary) / 'skills'
            shutil.copytree(ROOT / 'skills', destination)
            for stage in ('plan', 'wireframe', 'surface', 'compare', 'review'):
                result = packet.compile_packet(stage, project=project, profile='focused', root=destination / 'seenry', research_source='local')
                study = [r for r in result['resources'] if r['path'].endswith('/libraries-dev.md')]
                self.assertEqual(len(study), 1)
                self.assertEqual(len(study[0]['sha256']), 64)
                self.assertIn('paused', study[0]['content'])
            (destination / 'seenry-motion/references/libraries-dev.md').unlink()
            with self.assertRaises(FileNotFoundError):
                packet.compile_packet('plan', project=project, root=destination / 'seenry')
        ordinary = packet.compile_packet('plan', project={'media': 'none', 'motion': 'feedback'}, profile='focused')
        self.assertFalse(any(r['path'].endswith('/libraries-dev.md') for r in ordinary['resources']))

    def test_optional_motion_library_selection_rejects_invalid_or_conflicting_input(self):
        for libraries in ('liquid-gooey', ['unknown'], ['metal-fx', 'metal-fx'], [None], [{}]):
            with self.assertRaises(ValueError):
                packet.compile_packet('plan', project={'media': 'none', 'motion': 'signature', 'motion_libraries': libraries})
        with self.assertRaises(ValueError):
            packet.compile_packet('plan', project={'media': 'none', 'motion': 'none', 'motion_libraries': ['border-beam']})

    def test_no_mcp_packet_works_without_server_contract_or_lookup_guide(self):
        with tempfile.TemporaryDirectory() as temporary:
            destination = Path(temporary) / 'skills'
            shutil.copytree(ROOT / 'skills', destination)
            relocated = destination / 'seenry'
            (relocated / 'references/mcp-tools.json').unlink()
            (relocated / 'references/research.md').unlink()
            for stage in packet.STAGES:
                result = packet.compile_packet(stage, motion=True, assets=True, root=relocated, research_source='local')
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
            result=packet.compile_packet('surface',root=relocated,research_source='local',profile='focused',project={'media':'needed','motion':'feedback','decisions':['controls']})
            lessons=result['visual_lessons'];evidence_root=Path(lessons['evidence_root'])
            self.assertTrue(evidence_root.is_relative_to(destination.resolve()))
            for lesson in lessons['lessons']:
                for image in lesson['evidence']:
                    self.assertTrue((evidence_root/image['file']).is_file())

if __name__ == '__main__':
    unittest.main()
