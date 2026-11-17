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
writeFileSync(join(out,'board.png'),'mock pixels '+process.hrtime.bigint());
writeFileSync(join(out,'first.png'),'mock pixels '+process.hrtime.bigint());
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

TEARDOWN = """# Teardown

## Reference A: workflow landing page
- Product UI: 22 UI elements in the app window (sidebar, breadcrumb, 3 avatars, 2 actions), 2 visualisation types.
- Headline: 64px, weight 300, 2 lines, tracking -0.03em. Hues: 1 (cobalt) plus white.
- Interlock: the grass image sits in front of the app, hiding its lower 40%.
- Motif: the grass repeats at the bottom of 3 tiles in section 2. Logos: 6 marks, icon and wordmark, white.
- Buttons: 44px, pill tab bar with 4 tabs.

## Reference B: integration dashboard
- Product UI: 18 UI elements, 4 metric cards each with its own mini visual, 3 visualisation types.
- Headline: 68px, weight 300, 2 lines. Hues: 1 warm accent on black.
- Interlock: the dashboard is translucent to the photo at its top and melts into the page over 120px.
- Motif: the logo tile repeats with connectors in section 2. Logos: 6 marks in one colour.
- Buttons: 40px with an icon tile of 28px.
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
        for name in ('motion_contract.mjs','history.mjs','workdir.mjs','execution_bar.mjs','judge_pair.mjs','model_cli.mjs','motion_doc.mjs','blockers.mjs'):
            dep=ROOT/'skills/seenry/scripts'/name
            if dep.exists(): shutil.copyfile(dep,self.scripts/name)
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
        (self.project/'DESIGN.md').write_text('# Brand guidelines\nTest only\nStack: Astro, because it is a content page with no accounts.\n')
        (self.project/'brief.md').write_text('Test the gate offline.')
        (self.project/'.seenry/idea.md').write_text('Idea fixture. '*60)
        (self.project/'.seenry/motion.md').write_text('Motion fixture. '*40)
        (self.project/'.seenry/identity.md').write_text('Identity fixture. '*40)
        (self.project/'.seenry/identity.html').write_text('<p>Identity fixture</p>')
        (self.project/'.seenry/research/pack.md').write_text('Test pack')
        (self.project/'.seenry/explore/pick.json').write_text('{}')
        for name in ['a.png','b.png']:
            (self.project/'.seenry/refs'/name).write_bytes(b'local test reference')
        (self.project/'.seenry/refs'/'kept.md').write_text('- a.png: two-column hero with the product working; fits a tool people try first.\n')
        (self.project/'tokens.css').write_text(':root { --color-text: black; }')
        (self.project/'.seenry/teardown.md').write_text(TEARDOWN)
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

    def run_gate(self, target='index.html', studio=True):
        # The critic and motion judges run only with --studio (or in an unattended run); these tests are about them.
        env=self.isolated_env()
        return subprocess.run([NODE,str(self.scripts/'check.mjs'),target,'--brief','brief.md',*(['--studio'] if studio else [])],cwd=self.project,
                              env=env,text=True,capture_output=True,timeout=30)

    def count_model_calls(self):
        for name in ('critic.mjs','motion_judge.mjs'):
            script=self.scripts/name
            script.write_text(script.read_text()+"\nimport {appendFileSync as _log} from 'node:fs';\n_log(new URL('./model-calls.log', import.meta.url), '"+name+"\\n');\n")
        return self.scripts/'model-calls.log'

    def canvas_manifest(self, **manifest):
        d=self.project/'.seenry/canvas';d.mkdir(parents=True,exist_ok=True)
        (d/'canvas.json').write_text(json.dumps(manifest))
        return d/'canvas.json'

    def test_default_run_passes_on_the_checks_alone_and_asks_no_model(self):
        calls=self.count_model_calls()
        # The written study belongs to --studio: the default path needs neither a teardown nor a composition.
        (self.project/'.seenry/teardown.md').unlink();(self.project/'.seenry/refs/kept.md').unlink()
        result=self.run_gate(studio=False)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertIn('CHECKS PASS round 1: 0 blockers. No model scored this page',result.stdout)
        self.assertNotIn('PASS round 1: critic',result.stdout)
        self.assertFalse(calls.exists(),'a model was asked')
        self.assertFalse(list((self.project/'.seenry/review').glob('critic-*.json')))
        history=json.loads((self.project/'.seenry/review/check.json').read_text())
        self.assertEqual([(h['blockers'],h['critic'],h.get('mechanical')) for h in history],[(0,None,True)])

    def test_studio_flag_still_needs_the_teardown_and_runs_the_critic(self):
        calls=self.count_model_calls()
        (self.project/'.seenry/teardown.md').unlink()
        blocked=self.run_gate()
        self.assert_blocked(blocked);self.assertIn('teardown:',blocked.stdout);self.assertFalse(calls.exists())
        (self.project/'.seenry/teardown.md').write_text(TEARDOWN)
        result=self.run_gate()
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertIn('PASS round',result.stdout);self.assertIn('critic.mjs',calls.read_text())

    def test_unattended_run_is_judged_by_the_critic_without_the_flag(self):
        calls=self.count_model_calls()
        self.canvas_manifest(started='2026-01-01T00:00:00.000Z',unattended={'at':'2026-01-01T00:04:00.000Z','reason':'a headless run'})
        result=self.run_gate(studio=False)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertIn('critic.mjs',calls.read_text());self.assertIn('PASS round',result.stdout)
        self.assertIn('Unattended run (a headless run)',result.stdout)

    def test_a_pick_is_the_go_ahead_and_the_passing_gate_stamps_the_build_time(self):
        manifest=self.canvas_manifest(started='2026-01-01T00:00:00.000Z',firstOption='2026-01-01T00:04:00.000Z')
        blocked=self.run_gate(studio=False)
        self.assert_blocked(blocked);self.assertIn('approval: no option is picked and no screen is approved',blocked.stdout)
        self.assertNotIn('built',json.loads(manifest.read_text()))
        self.canvas_manifest(started='2026-01-01T00:00:00.000Z',firstOption='2026-01-01T00:04:00.000Z',picked='2026-01-01T00:06:00.000Z')
        result=self.run_gate(studio=False)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        self.assertRegex(result.stdout,r'first sketch at 4 min, pick at 6 min, build finished at \d+ min\.')
        after=json.loads(manifest.read_text())
        self.assertEqual((after['timing']['firstSketchSeconds'],after['timing']['pickSeconds']),(240,360))
        self.assertGreater(after['timing']['builtSeconds'],360);self.assertIn('built',after)

    def test_a_gate_that_stops_on_blockers_still_keeps_the_build_time_and_names_the_second_round(self):
        manifest=self.canvas_manifest(started='2026-01-01T00:00:00.000Z',firstOption='2026-01-01T00:04:00.000Z',picked='2026-01-01T00:06:00.000Z')
        (self.scripts/'review_board.mjs').write_text(BOARD.replace('{blockers:0}','{blockers:3}'))
        first=self.run_gate(studio=False)
        self.assert_blocked(first);self.assertIn('FAIL round 1: 3 blocker(s)',first.stdout)
        self.assertIn('build finished at',first.stdout);self.assertNotIn('second round',first.stdout)
        self.assertGreater(json.loads(manifest.read_text())['timing']['builtSeconds'],360)
        (self.project/'app.css').write_text('main { color: navy; }')
        second=self.run_gate(studio=False)
        self.assertIn('That was the second round: report what is left instead of a third.',second.stdout)

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
        for _ in range(2): self.assertEqual(self.run_gate().returncode,1)
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
        return subprocess.run([NODE,str(self.scripts/'check.mjs'),'index.html','--brief','brief.md','--fast','--studio'],cwd=self.project,
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

    def test_identical_pixels_after_a_code_change_reuse_the_critic_verdict(self):
        (self.scripts/'review_board.mjs').write_text(BOARD.replace("'mock pixels '+process.hrtime.bigint()","'same pixels'"))
        (self.scripts/'critic.mjs').write_text(CRITIC + "\nimport {appendFileSync} from 'node:fs';\nappendFileSync(new URL('./critic-calls.log', import.meta.url), 'called\\n');\n")
        first=self.run_gate();self.assertEqual(first.returncode,0,first.stdout+first.stderr)
        (self.project/'app.js').write_text('globalThis.example=false;')
        second=self.run_gate()
        self.assertIn('reusing its critic verdict',second.stdout,second.stdout+second.stderr)
        self.assertEqual((self.scripts/'critic-calls.log').read_text().count('called'),1)
        self.assertTrue(self.latest_history()['reusedCritic'])

    def test_low_reference_fit_blocks_a_high_overall_score(self):
        (self.scripts/'critic.mjs').write_text(CRITIC.replace("{scores:{overall:9}}","{scores:{overall:9,reference_fit:6},fixes:[]}"))
        r=self.run_gate()
        self.assertNotEqual(r.returncode,0,r.stdout+r.stderr)
        self.assertIn('Reference fit 6/10',r.stdout)
        self.assertNotIn('PASS round',r.stdout)

    def test_copied_reference_blocks_a_passing_score(self):
        (self.scripts/'critic.mjs').write_text(CRITIC.replace("{scores:{overall:9}}","{scores:{overall:9,reference_fit:9},copies_reference:'a.png',fixes:[]}"))
        r=self.run_gate()
        self.assertNotEqual(r.returncode,0,r.stdout+r.stderr)
        self.assertIn('Copied reference',r.stdout)

    def run_mode_gate(self, mode):
        return subprocess.run([NODE,str(self.scripts/'check.mjs'),'index.html','--brief','brief.md','--mode',mode,'--studio'],cwd=self.project,
                              env=self.isolated_env(),text=True,capture_output=True,timeout=30)

    def test_low_impact_blocks_a_high_overall_score(self):
        (self.scripts/'critic.mjs').write_text(CRITIC.replace("{scores:{overall:9}}","{scores:{overall:9,impact:7},fixes:[]}"))
        r=self.run_gate()
        self.assertNotEqual(r.returncode,0,r.stdout+r.stderr)
        self.assertIn('Impact 7/10',r.stdout)
        self.assertNotIn('PASS round',r.stdout)

    def test_quick_mode_rescores_once_after_the_fixes(self):
        self.critic_score(7)
        first=self.run_mode_gate('quick')
        self.assertEqual(first.returncode,1,first.stdout+first.stderr)
        self.assertIn('re-scores the fixed page once',first.stdout)
        self.assertNotIn('stop',self.latest_history())
        (self.project/'app.css').write_text('main { color: #111; }')
        second=self.run_mode_gate('quick')
        self.assertEqual(second.returncode,3,second.stdout+second.stderr)
        self.assertIn('QUICK final round 2',second.stdout)
        self.assertEqual(len(list((self.project/'.seenry/review').glob('critic-*.json'))),2)
        (self.project/'app.css').write_text('main { color: #222; }')
        third=self.run_mode_gate('quick')
        self.assertIn('QUICK verified',third.stdout,third.stdout+third.stderr)
        self.assertEqual(len(list((self.project/'.seenry/review').glob('critic-*.json'))),2)

    def test_level_reference_reaches_the_critic(self):
        (self.scripts/'critic.mjs').write_text(CRITIC + "\nimport {appendFileSync} from 'node:fs';\nappendFileSync(new URL('./critic-args.log', import.meta.url), JSON.stringify(a)+'\\n');\n")
        (self.project/'.seenry/level').mkdir()
        (self.project/'.seenry/level/post.png').write_bytes(b'level reference pixels')
        (self.project/'.seenry/level.md').write_text('Register: loud\nAllow: twoToneHead\n' + 'Hero image share 60 percent, cut-out subject. '*12)
        r=self.run_gate()
        self.assertEqual(r.returncode,0,r.stdout+r.stderr)
        args=json.loads((self.scripts/'critic-args.log').read_text().splitlines()[-1])
        self.assertIn('--level',args)
        self.assertTrue(args[args.index('--level-refs')+1].endswith('post.png'))

    def test_level_images_without_a_level_sheet_block(self):
        (self.project/'.seenry/level').mkdir()
        (self.project/'.seenry/level/post.png').write_bytes(b'level reference pixels')
        r=self.run_gate();self.assert_blocked(r)
        self.assertIn('level reference: write',r.stdout)

    def photo_report(self, hero, other):
        (self.project/'index.html').write_text('<img src="photo.webp"><img src="detail.webp"><main data-seenry-signature="fixture">Test</main>')
        (self.project/'detail.webp').write_bytes(b'detail image bytes')
        review=self.project/'.seenry/review';review.mkdir(parents=True,exist_ok=True)
        (review/'photos.json').write_text(json.dumps({'images':[{'image':'photo.webp','hero':True,'overall':hero},{'image':'detail.webp','hero':False,'overall':other}]}))

    def test_quick_mode_holds_the_first_screen_image_to_eight(self):
        self.photo_report(hero=7,other=6)
        r=self.run_mode_gate('quick');self.assert_blocked(r)
        self.assertIn('first-screen image until it scores 8',r.stdout)
        self.assertFalse(list((self.project/'.seenry/review').glob('critic-*.json')))

    def test_quick_mode_keeps_a_six_outside_the_first_screen(self):
        self.photo_report(hero=8,other=6)
        r=self.run_mode_gate('quick')
        self.assertNotIn('photographs',r.stdout,r.stdout+r.stderr)
        self.assertTrue(list((self.project/'.seenry/review').glob('critic-*.json')))

    def test_missing_teardown_blocks_before_the_critic(self):
        (self.project/'.seenry/teardown.md').unlink()
        r=self.run_gate();self.assert_blocked(r)
        self.assertIn('teardown:',r.stdout)
        self.assertIn('does not exist',r.stdout)
        self.assertFalse(list((self.project/'.seenry/review').glob('critic-*.json')))

    def test_a_blocking_pair_verdict_stops_the_gate_and_prints_above_the_board(self):
        pair=self.project/'.seenry/canvas/.renders/pair';pair.mkdir(parents=True)
        (self.project/'.seenry/canvas/home.options').mkdir()
        (self.project/'.seenry/canvas/home.options/a.html').write_text('<p>a</p>')
        (self.project/'.seenry/canvas/canvas.json').write_text(json.dumps({'unattended':{'reason':'test'}}))
        entries=[{'frame':'home/a','src':'home.options/a.html','reference':'ref.png','verdict':{'reskin':False,'less_finished':True,'gaps':['product UI: 14 kinds, yours has 1']}},
                 {'frame':'home/gone','src':'home.options/gone.html','reference':'ref.png','verdict':{'reskin':True,'reskin_why':'archived'}}]
        (pair/'pair.json').write_text(json.dumps({'entries':entries}))
        (self.scripts/'review_board.mjs').write_text(BOARD+"\nconsole.log('BOARD OUTPUT');")
        r=self.run_gate();self.assert_blocked(r)
        self.assertIn('pair: home/a: visibly less finished than ref.png: product UI: 14 kinds, yours has 1',r.stdout)
        self.assertNotIn('home/gone',r.stdout)
        full=(self.project/'.seenry/review/blockers.txt').read_text()
        self.assertLess(full.index('do these first'),full.index('BOARD OUTPUT'))
        self.assertNotIn('BOARD OUTPUT',r.stdout,'the short check prints ranked blockers, not every section')

    def test_the_critic_is_given_the_references_the_composition_names(self):
        for name in ['c.png','z-kept.png']:
            (self.project/'.seenry/refs'/name).write_bytes(b'local test reference')
        (self.project/'.seenry/compose.md').write_text('Composed from z-kept.png (the image in front of the app) and b.png. '*8)
        (self.scripts/'critic.mjs').write_text(CRITIC.replace("writeFileSync(a[a.indexOf('--out')+1]","writeFileSync(a[a.indexOf('--out')+1]+'.refs',a[a.indexOf('--refs')+1]);writeFileSync(a[a.indexOf('--out')+1]"))
        r=self.run_gate()
        refs=next((self.project/'.seenry/review').glob('critic-*.json.refs')).read_text()
        names=[Path(x).name for x in refs.split(',')]
        self.assertEqual(names,['a.png','b.png','z-kept.png'],r.stdout+r.stderr)  # kept.md cites a.png; c.png is cited nowhere

    def test_teardown_without_measurements_blocks(self):
        (self.project/'.seenry/teardown.md').write_text('# Teardown\n\n## Reference A\n'+'It looks clean and premium with a strong hero and good type. '*6+'\n\n## Reference B\n'+'It feels modern and has a nice dashboard with pleasant colours. '*6)
        r=self.run_gate();self.assert_blocked(r)
        self.assertIn('fewer than five numbers',r.stdout)

    def test_canvas_workflow_files_satisfy_the_gate_without_the_older_studio_files(self):
        for name in ['idea.md','motion.md','identity.md','identity.html','research/pack.md','explore/pick.json','refs/kept.md']:
            (self.project/'.seenry'/name).unlink()
        (self.project/'DESIGN.md').write_text('Stack: Astro + Motion, because it is a landing page.\n')
        (self.project/'index.html').write_text('<link rel="stylesheet" href="app.css"><main>Test</main>')
        (self.project/'.seenry/compose.md').write_text('Hero: reference A for the app sinking into the image (40% hidden), reference B for metric cards with their own mini visual; idea: the waterline. '*3)
        r=self.run_gate()
        self.assertEqual(r.returncode,0,r.stdout+r.stderr)
        self.assertNotIn('steps missing',r.stdout)

    def test_a_build_with_no_stack_line_blocks_and_default_plain_html_warns(self):
        (self.project/'DESIGN.md').write_text('# Brand guidelines\nNo stack here.\n')
        r=self.run_gate();self.assert_blocked(r)
        self.assertIn('stack: ',r.stdout);self.assertIn('has no line `Stack:',r.stdout)
        (self.project/'DESIGN.md').write_text('Stack: Next.js + Base UI\n')
        r=self.run_gate();self.assert_blocked(r)
        self.assertIn('gives no reason',r.stdout)
        (self.project/'DESIGN.md').write_text('Stack: plain HTML and CSS, because it is simple.\n')
        r=self.run_gate()
        self.assertEqual(r.returncode,0,r.stdout+r.stderr)
        self.assertIn('stack (a warning, not a blocker)',r.stdout)
        (self.project/'DESIGN.md').write_text('Stack: plain HTML and CSS, because the user asked for no build step.\n')
        r=self.run_gate()
        self.assertEqual(r.returncode,0,r.stdout+r.stderr)
        self.assertNotIn('stack (a warning',r.stdout)
        (self.project/'DESIGN.md').write_text('Stack: plain HTML and CSS, because it is simple.\n')
        (self.project/'package.json').write_text('{}')
        r=self.run_gate()
        self.assertNotIn('stack (a warning',r.stdout)

    def test_references_without_a_composition_block(self):
        (self.project/'.seenry/refs/kept.md').unlink()
        r=self.run_gate();self.assert_blocked(r)
        self.assertIn('composition: write',r.stdout)

    def test_low_execution_blocks_a_high_overall_score(self):
        (self.scripts/'critic.mjs').write_text(CRITIC.replace("{scores:{overall:9}}","{scores:{overall:9,impact:9,execution:7},fixes:[]}"))
        r=self.run_gate()
        self.assertNotEqual(r.returncode,0,r.stdout+r.stderr)
        self.assertIn('Execution 7/10',r.stdout)
        self.assertNotIn('PASS round',r.stdout)

    def canvas(self):
        d=self.project/'.seenry/canvas';d.mkdir()
        (d/'tokens.css').write_text(':root { --color-text: black; }')
        return d

    def test_canvas_with_no_approval_blocks(self):
        self.canvas()
        r=self.run_gate();self.assert_blocked(r)
        self.assertIn('approval: no option is picked and no screen is approved',r.stdout)
        self.assertIn('--unattended',r.stdout)

    def test_canvas_with_an_approved_screen_passes(self):
        d=self.canvas()
        (d/'review.json').write_text(json.dumps({'frames':{'01-home/01-home':{'status':'approved','at':1}}}))
        r=self.run_gate()
        self.assertEqual(r.returncode,0,r.stdout+r.stderr)
        self.assertNotIn('Unattended',r.stdout)

    def test_recorded_unattended_run_passes_and_is_reported_as_unapproved(self):
        d=self.canvas()
        (d/'canvas.json').write_text(json.dumps({'unattended':{'at':'2026-11-16','reason':'headless test run'}}))
        r=self.run_gate()
        self.assertEqual(r.returncode,0,r.stdout+r.stderr)
        self.assertIn('Unattended run (headless test run)',r.stdout)
        self.assertIn('not approved',r.stdout)

if __name__=='__main__': unittest.main()
