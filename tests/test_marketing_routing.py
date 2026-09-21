import hashlib
import importlib.util
import shutil
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('marketing_packet', ROOT/'skills/seenry/scripts/packet.py')
packet = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packet)
GUIDE = 'seenry/references/marketing-evidence.md'

class MarketingRouting(unittest.TestCase):
    def test_selected_argument_preserves_project_without_default_cost(self):
        project = {'scope':'website','media':'none','motion':'none','research_source':'local'}
        for stage in ('plan','prototype','build','review'):
            base = packet.compile_packet(stage, project=project)
            selected = {**project, 'guide_topics':['marketing-evidence']}
            result = packet.compile_packet(stage, project=selected)
            added = {r['path'] for r in result['resources']} - {r['path'] for r in base['resources']}
            self.assertEqual(added, {GUIDE})
            self.assertEqual(result['project_decisions'], selected)
            guide = next(r for r in result['resources'] if r['path']==GUIDE)
            self.assertEqual(guide['sha256'], hashlib.sha256((ROOT/'skills'/GUIDE).read_bytes()).hexdigest())
    def test_component_and_narrow_fixes_do_not_load_marketing(self):
        project = {'scope':'website','media':'none','motion':'feedback','guide_topics':['marketing-evidence']}
        for decision in ('typography','color','controls','motion'):
            p = packet.compile_packet('refine', decision=decision, project=project)
            self.assertNotIn(GUIDE,{r['path'] for r in p['resources']})
        p = packet.compile_packet('plan', project={**project,'scope':'component'})
        self.assertNotIn(GUIDE,{r['path'] for r in p['resources']})
    def test_art_direction_relocates_and_missing_guide_fails(self):
        with tempfile.TemporaryDirectory() as temp:
            target=Path(temp)/'skills';shutil.copytree(ROOT/'skills',target)
            project={'scope':'website','guide_topics':['marketing-evidence']}
            p=packet.compile_packet('plan',decision='art-direction',root=target/'seenry',research_source='local',project=project)
            self.assertIn(GUIDE,{r['path'] for r in p['resources']})
            (target/GUIDE).unlink()
            with self.assertRaises(FileNotFoundError):
                packet.compile_packet('plan',decision='art-direction',root=target/'seenry',project=project)

if __name__=='__main__': unittest.main()
