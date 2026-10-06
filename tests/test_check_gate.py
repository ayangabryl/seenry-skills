"""Offline control-flow regressions for check.mjs. All children are local stubs.

These tests prove evidence handling, never actual visual or motion quality.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
NODE = shutil.which('node')

def resolved_existing_path(value):
    return Path(value).resolve(strict=True)

BOARD = r"""import {writeFileSync,mkdirSync,appendFileSync} from 'node:fs';
import {join} from 'node:path';
const a=process.argv.slice(2), out=a[a.indexOf('--out')+1];
mkdirSync(out,{recursive:true});
writeFileSync(join(out,'board.json'),JSON.stringify({blockers:0}));
writeFileSync(join(out,'board.png'),'mock pixels');
writeFileSync(join(out,'first.png'),'mock pixels');
appendFileSync(join(out,'board-calls.log'),'called\n');
"""
CRITIC = r"""import {writeFileSync} from 'node:fs';
const a=process.argv.slice(2);
writeFileSync(a[a.indexOf('--out')+1],JSON.stringify({scores:{overall:9}}));
"""
MOTION = r"""import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const a=process.argv.slice(2), out=a[a.indexOf('--out')+1];
const config=JSON.parse(readFileSync(new URL('./motion-config.json',import.meta.url),'utf8'));
mkdirSync(out,{recursive:true});
writeFileSync(join(out,'args.json'),JSON.stringify(a));
if(config.output !== null) writeFileSync(join(out,'motion.json'),typeof config.output==='string'?config.output:JSON.stringify(config.output));
process.exit(config.exit);
"""

@unittest.skipUnless(NODE, 'Node is unavailable')
class CheckGate(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='seenry-check-regression-')
        self.root = Path(self.temp.name)
        self.scripts = self.root/'scripts'
        self.project = self.root/'project'
        for p in [self.scripts, self.project/'.seenry/research', self.project/'.seenry/refs', self.project/'.seenry/explore']:
            p.mkdir(parents=True)
        shutil.copyfile(ROOT/'skills/seenry/scripts/check.mjs',self.scripts/'check.mjs')
        contract=ROOT/'skills/seenry/scripts/motion_contract.mjs'
        if contract.exists(): shutil.copyfile(contract,self.scripts/'motion_contract.mjs')
        (self.scripts/'review_board.mjs').write_text(BOARD)
        (self.scripts/'screens.mjs').write_text(BOARD)
        (self.scripts/'critic.mjs').write_text(CRITIC)
        (self.scripts/'motion_judge.mjs').write_text(MOTION)
        (self.scripts/'motion_video.mjs').write_text(MOTION)
        (self.project/'index.html').write_text('<link rel="stylesheet" href="app.css"><script src="app.js"></script><main data-seenry-signature="fixture">Test</main>')
        (self.project/'app.css').write_text('main { color: black; }')
        (self.project/'app.js').write_text('globalThis.example=true;')
        (self.project/'photo.webp').write_bytes(b'original image bytes')
        (self.project/'font.woff2').write_bytes(b'original font bytes')
        (self.project/'DESIGN.md').write_text('# Brand guidelines\nTest only')
        (self.project/'brief.md').write_text('Test the gate offline.')
        (self.project/'.seenry/idea.md').write_text('Idea fixture. '*60)
        (self.project/'.seenry/motion.md').write_text('Motion fixture. '*40)
        (self.project/'.seenry/research/pack.md').write_text('Test pack')
        (self.project/'.seenry/explore/pick.json').write_text('{}')
        for name in ['a.png','b.png']:
            (self.project/'.seenry/refs'/name).write_bytes(b'local test reference')
        self.configure()

    def tearDown(self):
        self.temp.cleanup()

    def configure(self, output='default', exit_code=0):
        if output == 'default': output=self.quality_result(score=9,outcome='pass')
        (self.scripts/'motion-config.json').write_text(json.dumps({'output':output,'exit':exit_code}))

    def isolated_env(self):
        home=self.root/'empty-home';home.mkdir(exist_ok=True)
        env={'PATH':str(Path(NODE).parent),'HOME':str(home),'USERPROFILE':str(home),
             'TEMP':str(self.root),'TMP':str(self.root),'LANG':'C.UTF-8'}
        # Windows Node needs the OS runtime location even with an isolated profile.
        # Preserve only these platform settings, never the parent's credentials.
        for name in ['SystemRoot','WINDIR','SystemDrive','COMSPEC','PATHEXT']:
            if name in os.environ: env[name]=os.environ[name]
        return env

    def run_gate(self, target='index.html'):
        env=self.isolated_env()
        return subprocess.run([NODE,str(self.scripts/'check.mjs'),target,'--brief','brief.md'],cwd=self.project,
                              env=env,text=True,capture_output=True,timeout=30)

    def run_native_gate(self, screens='screen.png'):
        env=self.isolated_env()
        return subprocess.run([NODE,str(self.scripts/'check.mjs'),'--screens',screens,'--video','screen.mov',
                               '--brief','brief.md'],cwd=self.project,env=env,text=True,capture_output=True,timeout=30)

    def assert_blocked(self, result):
        self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertNotIn('PASS round',result.stdout)

    def mark_stopped(self, target='index.html'):
        first=self.run_gate(target)
        self.assertEqual(first.returncode,0,first.stdout+first.stderr)
        p=self.project/'.seenry/review/check.json'
        history=json.loads(p.read_text());history[-1]['stop']='test completed round budget'
        p.write_text(json.dumps(history))
        return (self.project/'.seenry/review/board-calls.log').read_text()

    def test_valid_complete_evidence_passes(self):
        result=self.run_gate()
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertIn('motion 9/10',result.stdout)

    def test_runtime_environment_is_allowlisted_without_credentials(self):
        with patch.dict(os.environ, {'SystemRoot':r'C:\Windows','SEENRY_PRO_KEY':'test-secret',
                                     'OPENAI_API_KEY':'test-secret','ANTHROPIC_API_KEY':'test-secret'}):
            env=self.isolated_env()
        self.assertEqual(env['SystemRoot'],r'C:\Windows')
        self.assertEqual(env['HOME'],str(self.root/'empty-home'))
        self.assertEqual(env['USERPROFILE'],env['HOME'])
        for name in ['SEENRY_PRO_KEY','OPENAI_API_KEY','ANTHROPIC_API_KEY']:
            self.assertNotIn(name,env)

    def test_missing_result_blocks_even_zero_exit(self):
        self.configure(output=None)
        self.assert_blocked(self.run_gate())

    def test_failed_motion_process_blocks_without_result(self):
        self.configure(output=None,exit_code=2)
        result=self.run_gate();self.assert_blocked(result)
        self.assertIn('UNVERIFIED',result.stdout)

    def test_failed_process_cannot_reuse_a_passing_result(self):
        self.configure(exit_code=2)
        self.assert_blocked(self.run_gate())

    def test_existing_round_result_cannot_certify_a_fresh_attempt(self):
        old=self.project/'.seenry/review/motion-1';old.mkdir(parents=True)
        old.joinpath('motion.json').write_text(json.dumps({'violations':[],'verdict':{'scores':{'overall':9}}}))
        self.configure(output=None)
        self.assert_blocked(self.run_gate())

    def test_malformed_result_blocks(self):
        self.configure(output='{invalid JSON')
        self.assert_blocked(self.run_gate())

    def test_null_or_incomplete_verdict_blocks(self):
        for data in [{'violations':[],'verdict':None},{'violations':[]},{'verdict':{'scores':{'overall':9}}}]:
            with self.subTest(data=data):
                self.configure(output=data);self.assert_blocked(self.run_gate())

    def test_non_numeric_or_out_of_range_score_blocks(self):
        for score in ['9',None,-1,11]:
            with self.subTest(score=score):
                self.configure(output={'violations':[],'verdict':{'scores':{'overall':score}}})
                self.assert_blocked(self.run_gate())

    def test_below_target_is_not_pass(self):
        self.configure(output={'violations':[],'verdict':{'scores':{'overall':0}}})
        self.assert_blocked(self.run_gate())

    def test_motion_eight_does_not_meet_release_nine_target(self):
        self.configure(output={'violations':[],'verdict':{'scores':{'overall':8}}})
        result=self.run_gate();self.assert_blocked(result)
        self.assertIn('target 9',result.stdout)

    def test_motion_violation_is_not_pass(self):
        self.configure(output={'violations':['unverified keyboard reversal'],'verdict':{'scores':{'overall':9}}})
        self.assert_blocked(self.run_gate())

    def quality_result(self, score=8, violations=None, outcome='quality-fail'):
        keys=['origin','attachment','choreography','character','exit','continuity','interruption','states','reduced_motion','overall']
        verdict={'scores':dict.fromkeys(keys,score),'rows':[{'interaction':'Card','score':score,'note':'Review fixture'}],
                 'verdict':'Complete fixture','fixes':[{'interaction':'Card','problem':'A test finding','fix':'Apply the fixture repair'}]}
        return {'outcome':outcome,'violations':violations or [],'verdict':verdict,'interactions':[{'label':'Card'}]}

    def latest_history(self):
        return json.loads((self.project/'.seenry/review/check.json').read_text())[-1]

    def test_completed_quality_failure_retains_history_snapshot_and_previous_round(self):
        self.configure(output=self.quality_result(),exit_code=1)
        first=self.run_gate();self.assertEqual(first.returncode,1,first.stdout+first.stderr)
        self.assertIn('FAIL round 1',first.stdout);self.assertNotIn('UNVERIFIED',first.stdout)
        row=self.latest_history();self.assertEqual(row['motion'],8);self.assertNotIn('motionError',row)
        self.assertTrue((self.project/'.seenry/review/round-1/index.html').exists())
        previous=str(self.project/'.seenry'/row['motionEvidence']/'motion.json')
        second=self.run_gate();self.assertEqual(second.returncode,1,second.stdout+second.stderr)
        row=self.latest_history();args=json.loads((self.project/'.seenry'/row['motionEvidence']/'args.json').read_text())
        self.assertIn('--prev',args)
        # macOS may spell the same temporary path through /var or /private/var.
        self.assertEqual(resolved_existing_path(args[args.index('--prev')+1]),resolved_existing_path(previous))

    def test_previous_evidence_alias_resolves_to_the_same_existing_file(self):
        target=self.root/'evidence.json';target.write_text('{}')
        alias=self.root/'alias.json'
        try: alias.symlink_to(target)
        except (OSError,NotImplementedError) as error: self.skipTest(f'Symlink creation unavailable: {error}')
        self.assertEqual(resolved_existing_path(alias),resolved_existing_path(target))

    def test_previous_evidence_identity_rejects_different_or_missing_files(self):
        first=self.root/'first.json';second=self.root/'second.json'
        first.write_text('{}');second.write_text('{}')
        self.assertNotEqual(resolved_existing_path(first),resolved_existing_path(second))
        with self.assertRaises(FileNotFoundError): resolved_existing_path(self.root/'missing.json')

    def test_completed_violation_is_failed_quality_not_tool_error(self):
        self.configure(output=self.quality_result(score=9,violations=['held animation']),exit_code=1)
        result=self.run_gate();self.assertEqual(result.returncode,1,result.stdout+result.stderr)
        self.assertIn('FAIL round',result.stdout);self.assertNotIn('motionError',self.latest_history())
        self.assertEqual(self.latest_history()['motionViolations'],1)

    def test_completed_quality_failures_obey_stopping_budget(self):
        self.configure(output=self.quality_result(),exit_code=1)
        for _ in range(3): self.assertEqual(self.run_gate().returncode,1)
        stopped=self.run_gate();self.assertEqual(stopped.returncode,3,stopped.stdout+stopped.stderr)
        self.assertIn('quality target was not reached',stopped.stdout)
        calls=(self.project/'.seenry/review/board-calls.log').read_text()
        again=self.run_gate();self.assertEqual(again.returncode,3,again.stdout+again.stderr)
        self.assertIn('STOPPED',again.stdout)
        self.assertEqual((self.project/'.seenry/review/board-calls.log').read_text(),calls)

    def test_unmarked_nonzero_low_result_still_blocks(self):
        self.configure(output={'violations':[],'verdict':{'scores':{'overall':8}}},exit_code=1)
        result=self.run_gate();self.assertEqual(result.returncode,2);self.assertIn('UNVERIFIED',result.stdout)
        self.assertIn('motionError',self.latest_history())

    def test_quality_marker_never_overrides_tool_exit(self):
        for code in [0,2,7]:
            with self.subTest(code=code):
                self.configure(output=self.quality_result(),exit_code=code)
                result=self.run_gate();self.assertEqual(result.returncode,2,result.stdout+result.stderr)
                self.assertIn('motionError',self.latest_history())

    def test_contradictory_or_unknown_motion_outcome_blocks(self):
        for score,outcome,code in [(9,'quality-fail',1),(8,'pass',0),(9,'unverified',0),(9,'unexpected',0),(9,None,0),(9,'pass',1)]:
            with self.subTest(score=score,outcome=outcome,code=code):
                self.configure(output=self.quality_result(score=score,outcome=outcome),exit_code=code)
                result=self.run_gate();self.assertEqual(result.returncode,2,result.stdout+result.stderr)
                self.assertIn('UNVERIFIED',result.stdout)

    def test_quality_marker_cannot_complete_missing_or_invalid_evidence(self):
        for result in [{'outcome':'quality-fail','violations':[],'verdict':None},
                       {'outcome':'quality-fail','verdict':{'scores':{'overall':8}}},
                       self.quality_result(score='8'), self.quality_result(score=11)]:
            with self.subTest(result=result):
                self.configure(output=result,exit_code=1)
                gate=self.run_gate();self.assertEqual(gate.returncode,2);self.assertIn('UNVERIFIED',gate.stdout)

    def test_explicit_complete_pass_keeps_zero_exit(self):
        self.configure(output=self.quality_result(score=9,outcome='pass'),exit_code=0)
        result=self.run_gate();self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertIn('PASS round',result.stdout)

    def test_overall_nine_cannot_average_away_any_low_motion_criterion(self):
        for key in ['origin','attachment','choreography','character','exit','continuity','interruption','states','reduced_motion']:
            with self.subTest(key=key):
                data=self.quality_result(score=9,outcome='quality-fail');data['verdict']['scores'][key]=8
                self.configure(output=data,exit_code=1);result=self.run_gate()
                self.assertEqual(result.returncode,1,result.stdout+result.stderr);self.assertIn('FAIL round',result.stdout)
                self.assertIn(f'criterion {key}: 8/10',result.stdout);self.assertNotIn('motionError',self.latest_history())
                # Each independent criterion has its own fresh review budget.
                (self.project/'.seenry/review/check.json').write_text('[]')

    def test_reported_low_row_blocks_and_false_pass_marker_is_unverified(self):
        data=self.quality_result(score=9,outcome='quality-fail');data['verdict']['rows'][0]['score']=8
        self.configure(output=data,exit_code=1);result=self.run_gate();self.assertEqual(result.returncode,1,result.stdout)
        self.assertIn('interaction Card: 8/10',result.stdout)
        data['outcome']='pass';self.configure(output=data,exit_code=0)
        result=self.run_gate();self.assertEqual(result.returncode,2,result.stdout);self.assertIn('UNVERIFIED',result.stdout)

    def test_missing_or_unmatched_interaction_coverage_is_unverified(self):
        for rows,interactions in [([], [{'label':'Card'}]),([{'interaction':'Card','score':9,'note':'fixture'}], []),
                                  ([{'interaction':'Card','score':9,'note':'fixture'}], [{'label':'Card'},{'label':'Menu'}]),
                                  ([{'interaction':'Invented','score':9,'note':'fixture'}], [{'label':'Card'}])]:
            with self.subTest(rows=rows,interactions=interactions):
                data=self.quality_result(score=9,outcome='pass');data['verdict']['rows']=rows;data['interactions']=interactions
                self.configure(output=data,exit_code=0);result=self.run_gate();self.assertEqual(result.returncode,2,result.stdout)
                self.assertIn('UNVERIFIED',result.stdout)

    def test_valid_scoped_pass_names_only_covered_interactions(self):
        self.configure(output=self.quality_result(score=9,outcome='pass'));result=self.run_gate()
        self.assertEqual(result.returncode,0,result.stdout);self.assertIn('other components unverified',result.stdout)
        scope=self.latest_history()['motionCoverage'];self.assertEqual(scope['capturedLabels'],['Card']);self.assertEqual(scope['reviewedLabels'],['Card'])

    def test_legacy_overall_only_web_result_has_clear_upgrade_failure(self):
        self.configure(output={'violations':[],'verdict':{'scores':{'overall':9}}})
        result=self.run_gate();self.assertEqual(result.returncode,2,result.stdout+result.stderr)
        self.assertIn('legacy web motion result',result.stdout);self.assertIn('upgrade the motion judge',result.stdout)
        self.assertNotIn('PASS round',result.stdout)

    def test_native_legacy_pass_is_explicitly_not_web_criterion_certification(self):
        self.native_fixture();self.configure(output={'violations':[],'verdict':{'scores':{'overall':9}}})
        result=self.run_native_gate();self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertIn('legacy overall-only evidence; per-criterion coverage unverified',result.stdout)

    def test_board_blocker_exits_before_motion_policy(self):
        script=self.scripts/'review_board.mjs';script.write_text(script.read_text().replace('blockers:0','blockers:1'))
        result=self.run_gate();self.assertEqual(result.returncode,1,result.stdout+result.stderr)
        self.assertNotIn('ReferenceError',result.stderr);self.assertNotIn('PASS round',result.stdout)

    def test_native_legacy_low_result_is_completed_quality_failure(self):
        self.native_fixture();self.configure(output={'violations':[],'verdict':{'scores':{'overall':8}}})
        result=self.run_native_gate();self.assertEqual(result.returncode,1,result.stdout+result.stderr)
        self.assertNotIn('motionError',self.latest_history())

    def test_marked_overall_only_judgment_is_never_complete(self):
        self.configure(output={'outcome':'pass','violations':[],'verdict':{'scores':{'overall':9},'rows':[],'fixes':[],'verdict':'ok'}})
        gate=self.run_gate();self.assertEqual(gate.returncode,2);self.assertIn('UNVERIFIED',gate.stdout)
        self.assertIn('malformed marked motion judgment',gate.stdout)

    def test_marked_judgment_requires_every_declared_score(self):
        for key in ['origin','attachment','choreography','character','exit','continuity','interruption','states','reduced_motion','overall']:
            with self.subTest(key=key):
                result=self.quality_result(score=9,outcome='pass');del result['verdict']['scores'][key]
                self.configure(output=result);gate=self.run_gate();self.assertEqual(gate.returncode,2,gate.stdout+gate.stderr)

    def test_marked_judgment_rejects_malformed_rows_fixes_and_fields(self):
        cases=[]
        for field,value in [('rows',None),('rows',[None]),('rows',[{'interaction':'Card','score':9}]),
                            ('rows',[{'interaction':'Card','score':'9','note':'fixture'}]),
                            ('fixes',[]),('fixes',[None]),('fixes',[{'interaction':'Card','problem':'fixture'}]),
                            ('fixes',[{'interaction':'Card','problem':'fixture','fix':42}]),('verdict',42)]:
            result=self.quality_result(score=9,outcome='pass');result['verdict'][field]=value;cases.append(result)
        result=self.quality_result(score=9,outcome='pass');result['verdict']['scores']['origin']=8.5;cases.append(result)
        result=self.quality_result(score=9,outcome='pass');result['verdict']['scores']['origin']=0;cases.append(result)
        result=self.quality_result(score=9,outcome='pass');result['verdict']['unexpected']=True;cases.append(result)
        result=self.quality_result(score=9,outcome='pass');result['violations']=[42];cases.append(result)
        for result in cases:
            with self.subTest(result=result):
                self.configure(output=result);gate=self.run_gate();self.assertEqual(gate.returncode,2,gate.stdout+gate.stderr)

    def test_marked_judgment_rejects_invalid_producer_annotations(self):
        for key,value in [('cli',9),('runs',[]),('runs',[11]),('stillOpen',{'criteria':['bogus'],'interactions':[]})]:
            with self.subTest(key=key,value=value):
                result=self.quality_result(score=9,outcome='pass');result['verdict'][key]=value
                self.configure(output=result);self.assertEqual(self.run_gate().returncode,2)

    def test_annotations_never_override_a_below_floor_criterion(self):
        result=self.quality_result(score=9,outcome='quality-fail');result['verdict']['scores']['origin']=1
        result['verdict']['cli']='codex';result['verdict']['runs']=[9,8,9]
        result['verdict']['stillOpen']={'criteria':['origin'],'interactions':['Card']}
        self.configure(output=result,exit_code=1);gate=self.run_gate();self.assertEqual(gate.returncode,1,gate.stdout+gate.stderr)

    def test_stricter_policy_rechecks_previously_stopped_identical_web_source(self):
        for previous_policy in [None,'web-overall-only-v0']:
            with self.subTest(previous_policy=previous_policy):
                (self.project/'.seenry/review').mkdir(exist_ok=True)
                (self.project/'.seenry/review/check.json').write_text('[]')
                before=self.mark_stopped();path=self.project/'.seenry/review/check.json';history=json.loads(path.read_text())
                if previous_policy is None: history[-1].pop('motionPolicy',None)
                else: history[-1]['motionPolicy']=previous_policy
                path.write_text(json.dumps(history));result=self.run_gate()
                self.assertEqual(result.returncode,0,result.stdout+result.stderr)
                self.assertNotEqual((self.project/'.seenry/review/board-calls.log').read_text(),before)
                self.assertEqual(self.latest_history()['motionPolicy'],'web-motion-criteria-rows-9-v1')

    def test_unchanged_local_source_stays_stopped(self):
        before=self.mark_stopped();result=self.run_gate()
        self.assertEqual(result.returncode,3,result.stdout+result.stderr)
        self.assertEqual((self.project/'.seenry/review/board-calls.log').read_text(),before)

    def test_css_js_image_font_and_brief_edits_reverify(self):
        self.mark_stopped()
        for name in ['app.css','app.js','photo.webp','font.woff2','brief.md','.seenry/refs/a.png']:
            with self.subTest(file=name):
                calls=self.project/'.seenry/review/board-calls.log';before=calls.read_text()
                p=self.project/name;p.write_bytes(p.read_bytes()+b'changed')
                result=self.run_gate()
                self.assertEqual(result.returncode,0,result.stdout+result.stderr)
                self.assertNotEqual(calls.read_text(),before)

    def test_url_without_immutable_identity_reverifies(self):
        target='https://example.invalid/local-stub-only'
        before=self.mark_stopped(target);result=self.run_gate(target)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertNotEqual((self.project/'.seenry/review/board-calls.log').read_text(),before)

    def test_symlinked_source_is_not_treated_as_immutable(self):
        link=self.project/'linked.css'
        try: link.symlink_to(self.project/'app.css')
        except OSError: self.skipTest('Symlinks unavailable')
        before=self.mark_stopped();result=self.run_gate()
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertNotEqual((self.project/'.seenry/review/board-calls.log').read_text(),before)

    def test_failed_review_can_retry_the_same_changed_source(self):
        self.mark_stopped()
        (self.project/'app.css').write_text('main { color: red; }')
        self.configure(output=None,exit_code=2)
        self.assert_blocked(self.run_gate())
        before=(self.project/'.seenry/review/board-calls.log').read_text()
        self.configure()
        result=self.run_gate()
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertNotEqual((self.project/'.seenry/review/board-calls.log').read_text(),before)

    def test_different_target_in_same_directory_reverifies(self):
        shutil.copyfile(self.project/'index.html',self.project/'other.html')
        before=self.mark_stopped();result=self.run_gate('other.html')
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertNotEqual((self.project/'.seenry/review/board-calls.log').read_text(),before)

    def test_parent_directory_dependency_is_unbound_and_reverifies(self):
        nested=self.project/'pages';nested.mkdir()
        (nested/'index.html').write_text('<link rel="stylesheet" href="../app.css"><main data-seenry-signature="fixture">Test</main>')
        shutil.copyfile(self.project/'DESIGN.md',nested/'DESIGN.md')
        before=self.mark_stopped('pages/index.html')
        (self.project/'app.css').write_text('main { color: red; }')
        result=self.run_gate('pages/index.html')
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertNotEqual((self.project/'.seenry/review/board-calls.log').read_text(),before)

    def test_source_inside_seenry_still_has_identity(self):
        nested=self.project/'.seenry/explore'
        (nested/'index.html').write_text('<main data-seenry-signature="fixture">Test</main>')
        shutil.copyfile(self.project/'DESIGN.md',nested/'DESIGN.md')
        before=self.mark_stopped('.seenry/explore/index.html')
        (nested/'index.html').write_text('<main data-seenry-signature="fixture">Changed</main>')
        result=self.run_gate('.seenry/explore/index.html')
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertNotEqual((self.project/'.seenry/review/board-calls.log').read_text(),before)

    def test_source_changing_while_judged_does_not_pass(self):
        with (self.scripts/'review_board.mjs').open('a') as f:
            f.write("\nwriteFileSync('app.css','main { display: none; }');\n")
        result=self.run_gate();self.assert_blocked(result)
        self.assertIn('source changed during review',result.stdout)

    def test_unbound_reference_does_not_disable_local_change_detection(self):
        p=self.project/'index.html';p.write_text(p.read_text()+'<a href="https://example.invalid/">Reference</a>')
        self.test_source_changing_while_judged_does_not_pass()

    def test_hidden_asset_directory_edits_reverify(self):
        d=self.project/'.assets';d.mkdir();css=d/'theme.css';css.write_text('main { color: black; }')
        p=self.project/'index.html';p.write_text(p.read_text()+'<link rel="stylesheet" href=".assets/theme.css">')
        before=self.mark_stopped();css.write_text('main { color: red; }')
        result=self.run_gate()
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertNotEqual((self.project/'.seenry/review/board-calls.log').read_text(),before)

    def test_unquoted_parent_asset_is_unbound(self):
        nested=self.project/'pages';nested.mkdir()
        (nested/'index.html').write_text('<link rel=stylesheet href=../app.css><main data-seenry-signature=fixture>Test</main>')
        shutil.copyfile(self.project/'DESIGN.md',nested/'DESIGN.md')
        before=self.mark_stopped('pages/index.html')
        (self.project/'app.css').write_text('main { color: red; }')
        result=self.run_gate('pages/index.html')
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertNotEqual((self.project/'.seenry/review/board-calls.log').read_text(),before)

    def test_linked_excluded_directory_is_unbound(self):
        for directory in ['.seenry','node_modules']:
            with self.subTest(directory=directory):
                d=self.project/directory;d.mkdir(exist_ok=True)
                css=d/'theme.css';css.write_text('main { color: black; }')
                p=self.project/'index.html'
                p.write_text('<link rel="stylesheet" href="'+directory+'/theme.css"><main data-seenry-signature="fixture">Test</main>')
                before=self.mark_stopped();css.write_text('main { color: red; }')
                result=self.run_gate()
                self.assertEqual(result.returncode,0,result.stdout+result.stderr)
                self.assertNotEqual((self.project/'.seenry/review/board-calls.log').read_text(),before)

    def native_fixture(self):
        (self.project/'screen.png').write_bytes(b'native screenshot fixture')
        (self.project/'screen.mov').write_bytes(b'native recording fixture')

    def test_native_route_retains_completed_evidence_support(self):
        self.native_fixture();result=self.run_native_gate()
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)

    def test_native_route_blocks_unjudged_motion(self):
        self.native_fixture();self.configure(output={'violations':[],'verdict':None})
        self.assert_blocked(self.run_native_gate())

    def test_native_capture_edit_reverifies_after_stop(self):
        self.native_fixture();result=self.run_native_gate()
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        p=self.project/'.seenry/review/check.json';history=json.loads(p.read_text())
        history[-1]['stop']='test completed native budget';p.write_text(json.dumps(history))
        before=(self.project/'.seenry/review/board-calls.log').read_text()
        (self.project/'screen.png').write_bytes(b'changed native screenshot')
        result=self.run_native_gate()
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertNotEqual((self.project/'.seenry/review/board-calls.log').read_text(),before)

    def test_native_capture_changed_during_review_blocks(self):
        self.native_fixture()
        with (self.scripts/'screens.mjs').open('a') as f:
            f.write("\nwriteFileSync('screen.png','changed during native review');\n")
        result=self.run_native_gate();self.assert_blocked(result)
        self.assertIn('source changed during review',result.stdout)

    def run_fast_gate(self):
        return subprocess.run([NODE,str(self.scripts/'check.mjs'),'index.html','--brief','brief.md','--fast'],cwd=self.project,
                              env=self.isolated_env(),text=True,capture_output=True,timeout=30)

    def critic_score(self, score):
        (self.scripts/'critic.mjs').write_text("import {writeFileSync} from 'node:fs';\nconst a=process.argv.slice(2);\n"
            f"writeFileSync(a[a.indexOf('--out')+1],JSON.stringify({{scores:{{overall:{score}}}}}));\n")

    def motion_calls(self):
        return list((self.project/'.seenry/review').glob('motion-*/args.json'))

    def test_fast_mode_defers_browser_motion_until_last_critic_round(self):
        self.critic_score(7)
        first=self.run_fast_gate()
        self.assertEqual(first.returncode,1,first.stdout+first.stderr)
        self.assertIn('Motion is judged in the browser',first.stdout)
        self.assertEqual(self.motion_calls(),[])
        self.assertTrue(self.latest_history()['motionSkipped'])
        (self.project/'app.css').write_text('main { color: #111; }')
        self.run_fast_gate()
        self.assertEqual(self.motion_calls(),[])
        (self.project/'app.css').write_text('main { color: #222; }')
        third=self.run_fast_gate()
        self.assertEqual(len(self.motion_calls()),1,third.stdout+third.stderr)
        self.assertNotIn('PASS round',third.stdout)

    def test_fast_mode_runs_motion_as_soon_as_the_critic_passes(self):
        result=self.run_fast_gate()
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertEqual(len(self.motion_calls()),1)
        self.assertIn('PASS round 1',result.stdout)

    def test_static_motion_scan_blocks_before_the_critic(self):
        shutil.copyfile(ROOT/'skills/seenry/scripts/motion_scan.mjs',self.scripts/'motion_scan.mjs')
        (self.project/'app.css').write_text('main { transition: all 900ms ease; }')
        result=self.run_gate();self.assert_blocked(result)
        self.assertIn('motion scan',result.stdout)
        self.assertIn('transition-all',result.stdout)
        self.assertFalse(list((self.project/'.seenry/review').glob('critic-*.json')))

if __name__=='__main__': unittest.main()
