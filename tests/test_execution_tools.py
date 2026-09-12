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
        if stage in ('wireframe','type'): roles['judgment'] = 1; roles['functional'] = 1
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
        if stage in ('compare','review'):
            image_name=f'{stage}-citation.png'
            (self.root/image_name).write_bytes((ROOT/'skills/seenry/references/lessons/state-B.png').read_bytes())
            report={'candidates':[{'id':'A','checks':{k:{'result':'pass','artifact':image_name,'observation':'Fixture judgment, not a real visual evaluation'} for k in ('subject','opening','hierarchy','material','interaction')},'blocking_issues':[]}],'selected':'A'}
            (self.root/artifacts['judgment'][0]).write_text(json.dumps(report))
        if stage in ('wireframe','type'):
            report={'reviewed_sources':{name:workflow.digest(self.root/name) for name in artifacts['source']},'candidates':[{'id':'study','checks':{k:{'result':'pass','artifact':artifacts['render'][0],'observation':'Fixture layer observation, not visual acceptance'} for k in ('content','hierarchy','geometry')},'blocking_issues':[]}],'selected':'study'}
            (self.root/artifacts['judgment'][0]).write_text(json.dumps(report))
            (self.root/artifacts['functional'][0]).write_text(json.dumps({'reviewed_sources':report['reviewed_sources'],'status':'passed','observations':['Fixture functional result; not a real browser test']}))
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
        typed=packet.compile_packet('type',project={'media':'none','motion':'feedback'})
        self.assertIn('seenry-assets/assets/type.example.json',[r['path'] for r in typed['resources']])

    def test_component_routing_replaces_website_guidance_while_retaining_task_and_material(self):
        project={'scope':'component','brief':'Export this photograph','media':'needed','motion':'feedback','retained_behavior':['Keep the selected width after failure']}
        for profile in ('complete','focused'):
            for stage in ('plan','wireframe','type','surface','build','refine'):
                packet_result=packet.compile_packet(stage,project=project,profile=profile)
                names={r['path'] for r in packet_result['resources']}
                if profile == 'complete' or stage in ('plan','wireframe'):
                    self.assertIn('seenry/references/content-model.md',names)
                self.assertNotIn('seenry/references/art-direction.md',names)
                self.assertNotIn('seenry/references/content-and-finish.md',names)
                self.assertNotIn('seenry/references/studies/hoy.md',names)
                self.assertEqual(packet_result['project_decisions']['retained_behavior'],project['retained_behavior'])
            plan=packet.compile_packet('plan',project=project,profile=profile)
            names={r['path'] for r in plan['resources']}
            self.assertIn('seenry/references/component-record.md',names)
            if profile == 'complete':
                self.assertIn('seenry/references/color-decisions.md',names)
                self.assertIn('seenry/references/studies/component-family.md',names)
            else:
                self.assertNotIn('seenry/references/studies/component-family.md',names)
            self.assertIn('seenry-assets/references/object-material.md',names)
        website=packet.compile_packet('plan',project={**project,'scope':'website'})
        names={r['path'] for r in website['resources']}
        self.assertIn('seenry/references/art-direction.md',names)
        self.assertIn('seenry-assets/references/material-production.md',names)
    def test_expired_budget_stops_new_artifact_records(self):
        data=workflow.load_run(self.root)
        with patch.object(workflow.time,'time',return_value=data['started']+2401):
            with self.assertRaisesRegex(ValueError,'budget exhausted'):workflow.record(self.root,'understand',self.submission('understand'))
        result=workflow.load_run(self.root);self.assertEqual(result['status'],'incomplete-budget');self.assertEqual(result['events'],[])

    def test_transport_failure_closes_attempt_without_changing_earlier_artifacts(self):
        workflow.record(self.root,'understand',self.submission('understand'))
        earlier=copy.deepcopy(workflow.load_run(self.root)['events'])
        result=workflow.stop(self.root,'Model response timed out before source was returned')
        self.assertEqual(result['status'],'incomplete')
        self.assertEqual(result['stopped']['last_stage'],'understand')
        self.assertEqual(result['events'],earlier)
        with self.assertRaisesRegex(ValueError,'stopped'):workflow.record(self.root,'research',self.submission('research'))
        with self.assertRaisesRegex(ValueError,'already stopped'):workflow.stop(self.root,'Overwrite the reason')

    def test_stop_retains_budget_exhaustion_and_requires_reason(self):
        with self.assertRaisesRegex(ValueError,'stopping reason'):workflow.stop(self.root,'')
        data=workflow.load_run(self.root)
        with patch.object(workflow.time,'time',return_value=data['started']+2401):result=workflow.stop(self.root,'Finishing did not complete within the ceiling')
        self.assertEqual(result['status'],'incomplete-budget')

    def test_unresolved_type_layer_blocks_surface_and_preserves_bounded_repair(self):
        for stage in workflow.ORDER[:4]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('type');p=self.root/s['artifacts']['judgment'][0];report=json.loads(p.read_text())
        report['candidates'][0]['checks']['content']['result']='revise';p.write_text(json.dumps(report))
        result=workflow.record(self.root,'type',s)
        self.assertEqual(result['status'],'needs-layer-revision')
        with self.assertRaisesRegex(ValueError,'Construction checkpoint is unresolved'):
            workflow.record(self.root,'surface',self.submission('surface'))
        s=self.submission('type');s['mode']='layer-repair'
        result=workflow.record(self.root,'type',s)
        self.assertEqual(result['repairs'],1)
        self.assertEqual(result['events'][-1]['review_disposition']['status'],'ready-for-next-layer')
        self.assertEqual(result['events'][-2]['review_disposition']['status'],'needs-layer-revision')
        workflow.record(self.root,'surface',self.submission('surface'))

    def test_clean_visual_review_cannot_advance_failed_or_unverified_controls(self):
        for stage in workflow.ORDER[:3]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('wireframe');p=self.root/s['artifacts']['functional'][0];report=json.loads(p.read_text())
        report['status']='failed';report['observations']=['Subtotal input left the computed amount unchanged'];p.write_text(json.dumps(report))
        result=workflow.record(self.root,'wireframe',s)
        self.assertEqual(result['status'],'needs-layer-revision')
        self.assertFalse(result['events'][-1]['functional_cleared'])
        with self.assertRaisesRegex(ValueError,'Construction behavior is unresolved'):workflow.record(self.root,'type',self.submission('type'))
        s=self.submission('wireframe');s['mode']='layer-repair'
        workflow.record(self.root,'wireframe',s)
        s=self.submission('type');s['checks']['functional']='unverified'
        workflow.record(self.root,'type',s)
        with self.assertRaisesRegex(ValueError,'Construction behavior is unresolved'):workflow.record(self.root,'surface',self.submission('surface'))

    def test_construction_behavior_is_bound_to_source_and_missing_evidence_stays_unresolved(self):
        for stage in workflow.ORDER[:3]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('wireframe');p=self.root/s['artifacts']['functional'][0];report=json.loads(p.read_text());report['reviewed_sources']={};p.write_text(json.dumps(report))
        with self.assertRaisesRegex(ValueError,'behavior report must name'):workflow.record(self.root,'wireframe',s)
        s=self.submission('wireframe');del s['artifacts']['functional'];s['unavailable']={'functional':'Browser unavailable'}
        result=workflow.record(self.root,'wireframe',s)
        self.assertFalse(result['events'][-1]['functional_cleared'])
        with self.assertRaisesRegex(ValueError,'Construction behavior is unresolved'):workflow.record(self.root,'type',self.submission('type'))

    def test_missing_layer_review_is_recorded_but_cannot_advance(self):
        for stage in workflow.ORDER[:3]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('wireframe');s['artifacts'].pop('judgment');s['unavailable']={'judgment':'Actual layer inspection unavailable'}
        workflow.record(self.root,'wireframe',s)
        with self.assertRaisesRegex(ValueError,'Construction checkpoint is unresolved'):
            workflow.record(self.root,'type',self.submission('type'))
        result=workflow.record(self.root,'plan',self.submission('plan'))
        self.assertEqual(result['resets'],1)

    def test_stale_layer_source_cannot_be_submitted_as_reviewed(self):
        for stage in workflow.ORDER[:3]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('wireframe');(self.root/s['artifacts']['source'][0]).write_text('Changed after the review')
        with self.assertRaisesRegex(ValueError,'exact current source'):
            workflow.record(self.root,'wireframe',s)

    def candidate_judgment(self, submission, ids, selected, rejected=()):
        path=self.root/submission['artifacts']['judgment'][0]
        report=json.loads(path.read_text());template=report['candidates'][0]
        report['candidates']=[];report['selected']=selected
        for identity in ids:
            candidate=copy.deepcopy(template);candidate['id']=identity
            if identity in rejected:
                candidate['checks']['geometry']['result']='revise'
                candidate['blocking_issues']=['Fixture: action clipped at a narrow width']
            report['candidates'].append(candidate)
        path.write_text(json.dumps(report))

    def test_passing_direction_advances_without_repairing_discarded_sketches(self):
        for stage in workflow.ORDER[:3]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('wireframe');self.candidate_judgment(s,'ABC','B',rejected='AC')
        first=workflow.record(self.root,'wireframe',s)
        self.assertEqual(first['events'][-1]['review_disposition']['eligible'],['B'])
        s=self.submission('type');self.candidate_judgment(s,'B','B')
        result=workflow.record(self.root,'type',s)
        self.assertEqual(result['repairs'],0)
        self.assertEqual(result['events'][-1]['review_disposition']['status'],'ready-for-next-layer')
        self.assertEqual(result['events'][-2]['review_disposition']['actions'][0]['next_action'],'repair')
        workflow.record(self.root,'surface',self.submission('surface'))

    def test_narrowing_cannot_omit_initial_alternatives_or_revive_a_failed_direction(self):
        for stage in workflow.ORDER[:3]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('wireframe');self.candidate_judgment(s,'B','B')
        with self.assertRaisesRegex(ValueError,'every planned candidate'):workflow.record(self.root,'wireframe',s)
        s=self.submission('wireframe');self.candidate_judgment(s,'ABC','B',rejected='AC')
        workflow.record(self.root,'wireframe',s)
        s=self.submission('type');self.candidate_judgment(s,'A','A')
        with self.assertRaisesRegex(ValueError,'rejected direction'):workflow.record(self.root,'type',s)

    def test_selecting_a_failed_candidate_still_blocks_advancement(self):
        for stage in workflow.ORDER[:3]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('wireframe');self.candidate_judgment(s,'ABC','A',rejected='AC')
        workflow.record(self.root,'wireframe',s)
        with self.assertRaisesRegex(ValueError,'Construction checkpoint is unresolved'):
            workflow.record(self.root,'type',self.submission('type'))

    def test_schema_three_keeps_composite_layer_contract(self):
        data=workflow.load_run(self.root);data['schema']=3;workflow.save(self.root,data)
        for stage in workflow.ORDER[:3]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('wireframe');self.candidate_judgment(s,'ABC','B',rejected='AC')
        with self.assertRaisesRegex(ValueError,'one study'):workflow.record(self.root,'wireframe',s)

    def test_system_scope_carries_shared_decisions_without_expanding_component_packets(self):
        project={'scope':'system','media':'none','motion':'feedback','shared_decisions':{'version':'one','navigation':['Library','Settings'],'state_owner':'selected account'}}
        before=json.dumps(project,sort_keys=True)
        for stage in packet.STAGES:
            result=packet.compile_packet(stage,project=project,profile='focused')
            self.assertIn('seenry/references/system-design.md',[r['path'] for r in result['resources']])
            self.assertEqual(result['project_decisions']['shared_decisions'],project['shared_decisions'])
        self.assertEqual(json.dumps(project,sort_keys=True),before)
        small=packet.compile_packet('build',project={**project,'scope':'component'},profile='focused')
        self.assertNotIn('seenry/references/system-design.md',[r['path'] for r in small['resources']])

    def test_feedback_packet_supplies_selected_helper_and_pinned_runtime(self):
        project={'media':'none','motion':'feedback','motion_helpers':['morph-icon','geometry']}
        result=packet.compile_packet('build',project=project,profile='focused')
        resources={r['path']:r for r in result['resources']}
        self.assertIn('seenry-motion/references/adapters.md',resources)
        self.assertIn('export function createMorphIcon',resources['seenry-motion/assets/morph-icon.mjs']['content'])
        runtime={r['path']:r['sha256'] for r in result['runtime_files']}
        self.assertIn('seenry-motion/assets/morphicons/LICENSE',runtime)
        self.assertIn('seenry-motion/assets/morphicons/dom.js',runtime)
        self.assertIn('seenry-motion/assets/geometry-transition.mjs',runtime)
        self.assertFalse(any('scroll-scene' in p for p in runtime))
        self.assertEqual(packet.compile_packet('plan',project=project)['runtime_files'],[])
        for invalid in [['unknown'],['geometry','geometry'],[{}]]:
            with self.assertRaises(ValueError):packet.compile_packet('build',project={**project,'motion_helpers':invalid})
        with self.assertRaises(ValueError):packet.compile_packet('build',project={**project,'motion':'none'})

    def test_repair_direction_is_not_permission_to_expand_failed_material(self):
        for stage in workflow.ORDER[:6]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('compare');p=self.root/s['artifacts']['judgment'][0];j=json.loads(p.read_text())
        j['candidates'][0]['checks']['material']['result']='fail';j['selected']=None;j['continue_with']='A';p.write_text(json.dumps(j))
        result=workflow.record(self.root,'compare',s)
        self.assertEqual(result['status'],'needs-prototype-revision')
        with self.assertRaisesRegex(ValueError,'Comparison is not cleared'):workflow.record(self.root,'build',self.submission('build'))
        workflow.record(self.root,'surface',self.submission('surface'))
        result=workflow.record(self.root,'compare',self.submission('compare'))
        self.assertEqual(result['repairs'],1)
        workflow.record(self.root,'build',self.submission('build'))

    def test_broad_pass_labels_cannot_override_the_actual_review(self):
        for stage in workflow.ORDER[:-1]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('review');p=self.root/s['artifacts']['judgment'][0];j=json.loads(p.read_text())
        j['candidates'][0]['checks']['opening']['result']='revise';p.write_text(json.dumps(j))
        result=workflow.record(self.root,'review',s)
        self.assertEqual(result['status'],'needs-revision')
        self.assertTrue(any(e['role']=='judgment-citation' for e in result['events'][-1]['evidence']))

    def test_resolved_comparison_gap_does_not_erase_history_or_poison_current_state(self):
        for stage in workflow.ORDER[:6]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('compare');s['artifacts'].pop('judgment');s['unavailable']={'judgment':'Review capability unavailable'}
        workflow.record(self.root,'compare',s)
        with self.assertRaisesRegex(ValueError,'Comparison is not cleared'):workflow.record(self.root,'build',self.submission('build'))
        for stage in ('surface','compare','build','review'):result=workflow.record(self.root,stage,self.submission(stage))
        self.assertEqual(result['status'],'ready-for-human-review')
        self.assertTrue(result['events'][6]['unavailable'])

    def test_new_observation_can_refresh_review_without_consuming_code_repair(self):
        for stage in workflow.ORDER[:7]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('compare');s['mode']='evidence-refresh'
        (self.root/'observed-feedback.json').write_text('{"observed":"Completion feedback appears after actual download"}')
        s['artifacts']['evidence']=['observed-feedback.json']
        result=workflow.record(self.root,'compare',s)
        self.assertEqual(result['repairs'],0)
        self.assertEqual(result['events'][-1]['mode'],'evidence-refresh')
        self.assertEqual(len(result['events']),8)

    def test_evidence_refresh_cannot_hide_source_changes_or_repeat_only_judgment(self):
        for stage in workflow.ORDER[:7]:workflow.record(self.root,stage,self.submission(stage))
        s=self.submission('compare');s['mode']='evidence-refresh'
        with self.assertRaisesRegex(ValueError,'new observation artifact'):workflow.record(self.root,'compare',s)
        (self.root/'surface-source-0.txt').write_text('changed design')
        (self.root/'new.json').write_text('{"observation":"new"}');s['artifacts']['evidence']=['new.json']
        with self.assertRaisesRegex(ValueError,'Source changed'):workflow.record(self.root,'compare',s)


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
    def test_met_preview_and_full_candidate_remain_distinct(self):
        obj={'isPublicDomain':True,'primaryImageSmall':'https://example.com/preview.jpg','primaryImage':'https://example.com/full.jpg','title':'Vase','objectURL':'https://example.com/object'}
        with patch.object(assets,'request_json',side_effect=[{'objectIDs':[1]},obj]):
            item=assets.search_met('vase',1)['assets'][0]
        self.assertEqual(item['preview'],obj['primaryImageSmall'])
        self.assertEqual(item['production_candidate'],obj['primaryImage'])
        self.assertFalse(item['selected']);self.assertFalse(item['rights_reviewed'])
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

    def test_descriptor_coverage_distinguishes_missing_evidence_from_nonmatches(self):
        empty=quality.compare({},{})
        self.assertEqual(empty['evidence_status'],'missing')
        self.assertEqual(empty['comparable'],[])
        self.assertEqual(empty['missing'],list(quality.DIMENSIONS))
        self.assertFalse(empty['review_convergence'])
        partial=quality.compare({'palette':'blue','opening':'work first'}, {'palette':'red','medium':'photography'})
        self.assertEqual(partial['evidence_status'],'partial')
        self.assertEqual(partial['comparable'],['palette'])
        self.assertEqual(partial['missing'],[key for key in quality.DIMENSIONS if key!='palette'])
        self.assertEqual(partial['shared'],[])
        self.assertFalse(partial['review_convergence'])
        full=dict.fromkeys(quality.DIMENSIONS,'first')
        different=dict.fromkeys(quality.DIMENSIONS,'second')
        mismatch=quality.compare(full,different)
        self.assertEqual(mismatch['evidence_status'],'complete')
        self.assertEqual(mismatch['comparable'],list(quality.DIMENSIONS))
        self.assertEqual(mismatch['missing'],[])
        self.assertEqual(mismatch['shared'],[])
        self.assertFalse(mismatch['review_convergence'])
        shared=quality.compare(full,full)
        self.assertEqual(shared['evidence_status'],'complete')
        self.assertEqual(shared['shared'],list(quality.DIMENSIONS))
        self.assertTrue(shared['review_convergence'])

    def test_sparse_shared_descriptors_preserve_the_existing_flag(self):
        descriptor=dict.fromkeys(quality.DIMENSIONS[:4],'same')
        result=quality.compare(descriptor,descriptor)
        self.assertEqual(result['evidence_status'],'partial')
        self.assertEqual(result['shared'],list(quality.DIMENSIONS[:4]))
        self.assertEqual(result['missing'],list(quality.DIMENSIONS[4:]))
        self.assertTrue(result['review_convergence'])


if __name__ == '__main__': unittest.main()
