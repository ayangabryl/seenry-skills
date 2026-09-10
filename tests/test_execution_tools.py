import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def load(name, relative):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    result = importlib.util.module_from_spec(spec); spec.loader.exec_module(result)
    return result


workflow = load('workflow', 'skills/seenry/scripts/workflow.py')
packet = load('packet_new', 'skills/seenry/scripts/packet.py')
assets = load('assets', 'skills/seenry-assets/scripts/asset_studio.py')
types = load('types_new', 'skills/seenry-assets/scripts/type_lab.py')
quality = load('quality', 'skills/seenry/scripts/quality_cases.py')


class Execution(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.root = Path(self.temp.name) / 'run'
        workflow.initialize(self.root, {'brief':'A studio', 'model':'test', 'scope':'website', 'research_source':'local','media':'needed','motion':'signature'})
    def tearDown(self): self.temp.cleanup()
    def submission(self, stage):
        roles = dict(workflow.ROLES[stage])
        if stage == 'research': roles['material'] = 1
        if stage == 'plan': roles['score'] = 1
        if stage == 'surface': roles['crop'] = 1
        if stage == 'review': roles['recording'] = 1
        artifacts = {}
        for role, count in roles.items():
            artifacts[role] = []
            for i in range(count):
                name = f'{stage}-{role}-{i}.txt'
                content = json.dumps([{'id':s,'idea':s,'evidence':'proposed','risk':'unreviewed'} for s in 'ABC']) if role == 'concepts' else 'test fixture evidence'
                if role in ('render','crop'):
                    import base64
                    (self.root/name).write_bytes(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nVUAAAAASUVORK5CYII='))
                elif role=='recording':(self.root/name).write_bytes(b'\x1a\x45\xdf\xa3test-header-fixture')
                else:(self.root/name).write_text(content)
                artifacts[role].append(name)
        return {'observation':'Fixture record, not visual inspection','artifacts':artifacts,
                'reviewer':'test fixture','checks':dict.fromkeys(('functional','visual','motion','material'),'pass')}
    def test_cannot_skip_wireframes_or_invent_missing_media(self):
        with self.assertRaisesRegex(ValueError,'Expected understand'): workflow.record(self.root,'build',self.submission('build'))
        workflow.record(self.root,'understand',self.submission('understand'))
        s=self.submission('research'); del s['artifacts']['material']
        with self.assertRaisesRegex(ValueError,'material'): workflow.record(self.root,'research',s)
    def test_source_edits_preserve_history_but_snapshot_changes_fail(self):
        s=self.submission('understand'); data=workflow.record(self.root,'understand',s)
        (self.root/s['artifacts']['brief'][0]).write_text('later edit')
        workflow.load_run(self.root)
        (self.root/data['events'][0]['evidence'][0]['snapshot']).write_text('tampered')
        with self.assertRaisesRegex(ValueError,'Changed'):workflow.load_run(self.root)
    def test_explicit_unavailable_never_counts_as_ready(self):
        for stage in workflow.ORDER:
            s=self.submission(stage)
            if stage=='review':s['unavailable']={'recording':'No browser recording tool'}; del s['artifacts']['recording']
            result=workflow.record(self.root,stage,s)
        self.assertEqual(result['status'],'needs-revision')
    def test_ready_is_only_human_review_and_repairs_are_bounded(self):
        for stage in workflow.ORDER: result=workflow.record(self.root,stage,self.submission(stage))
        self.assertEqual(result['status'],'ready-for-human-review')
        for _ in range(2):
            for stage in ('build','review'):workflow.record(self.root,stage,self.submission(stage))
        with self.assertRaisesRegex(ValueError,'exhausted'):workflow.record(self.root,'build',self.submission('build'))
    def test_path_escape_rejected_before_snapshot(self):
        (self.root.parent/'outside.txt').write_text('outside')
        s=self.submission('understand');s['artifacts']['brief']=['../outside.txt']
        with self.assertRaisesRegex(ValueError,'inside'):workflow.record(self.root,'understand',s)
        self.assertFalse((self.root/'history').exists())
    def test_written_claim_is_not_a_render(self):
        for stage in ('understand','research','plan'):workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('wireframe');(self.root/s['artifacts']['render'][0]).write_text('Looks great')
        with self.assertRaisesRegex(ValueError,'not written claims'):workflow.record(self.root,'wireframe',s)
    def test_early_support_and_deliberate_no_media(self):
        result=packet.compile_packet('plan',research_source='web',project={'media':'needed','motion':'signature'})
        names=[r['path'] for r in result['resources']]
        self.assertIn('seenry-assets/references/material-production.md',names)
        self.assertIn('seenry-motion/references/worked-scores.md',names)
        result=packet.compile_packet('plan',project={'media':'none','motion':'none'})
        self.assertFalse(any(r['path'].startswith('seenry-assets') for r in result['resources']))
    def test_expired_budget_stops_new_artifact_records(self):
        data=workflow.load_run(self.root)
        with patch.object(workflow.time,'time',return_value=data['started']+2401):
            with self.assertRaisesRegex(ValueError,'budget exhausted'):workflow.record(self.root,'understand',self.submission('understand'))
        result=workflow.load_run(self.root);self.assertEqual(result['status'],'incomplete-budget');self.assertEqual(result['events'],[])


class Material(unittest.TestCase):
    def fixture(self): return json.loads((ROOT/'skills/seenry-assets/assets/candidates.example.json').read_text())
    def test_temporary_or_unreviewed_asset_cannot_pass_production(self):
        data=self.fixture()
        with self.assertRaises(ValueError):assets.validate(data,production=True)
        data['assets'][0].update(selected=True,rights_reviewed=True,status='final',reason='Approved for this use')
        with self.assertRaises(ValueError):assets.validate(data,production=True)
        data['assets'][0].update(license='CC0',source='https://www.metmuseum.org/art/collection/search/472562',rights_url='https://www.metmuseum.org/hubs/open-access')
        self.assertEqual(assets.validate(data,production=True)['pending'],[])
    def test_board_escapes_labels_and_rejects_executable_urls(self):
        data=self.fixture();data['assets'][0]['title']='<script>alert(1)</script>'
        with tempfile.TemporaryDirectory() as temporary:
            out=Path(temporary)/'board.html';assets.board(data,Path(temporary),out)
            self.assertNotIn('<script>',out.read_text());self.assertIn('&lt;script&gt;',out.read_text())
        data['assets'][0]['preview']='javascript:alert(1)'
        with self.assertRaises(ValueError):assets.validate(data)
    def test_met_non_public_domain_results_are_not_assets(self):
        with patch.object(assets,'request_json',side_effect=[{'objectIDs':[1]},{'isPublicDomain':False,'primaryImageSmall':'https://example.com/a.jpg'}]):
            self.assertEqual(assets.search_met('test',1)['assets'],[])
    def test_type_study_uses_content_and_rejects_css_injection(self):
        data=json.loads((ROOT/'skills/seenry-assets/assets/type.example.json').read_text())
        data['heading']='<script>bad</script>';self.assertNotIn('<script>',types.render(data))
        data['fonts'][0]['weight_range']='400;}body{display:none'
        with self.assertRaises(ValueError):types.render(data)


class Calibration(unittest.TestCase):
    def test_unlabeled_cases_have_no_claimed_accuracy(self):
        result=quality.summary([{'project':'a','split':'holdout','human_labels':[]}])
        self.assertEqual(result['unlabeled'],1);self.assertEqual(result['human_labeled'],0)
    def test_split_leakage_and_descriptor_flags(self):
        with self.assertRaises(ValueError):quality.summary([{'project':'a','split':s} for s in ('development','holdout')])
        self.assertFalse(quality.compare({'palette':'blue'},{'palette':'blue'})['review_convergence'])
        descriptor=dict.fromkeys(quality.DIMENSIONS,'same')
        self.assertTrue(quality.compare(descriptor,descriptor)['review_convergence'])


if __name__ == '__main__': unittest.main()
