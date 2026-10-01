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

ROOT = Path(__file__).resolve().parents[1]
NODE = shutil.which('node')

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
        if output == 'default': output={'violations':[],'verdict':{'scores':{'overall':9}}}
        (self.scripts/'motion-config.json').write_text(json.dumps({'output':output,'exit':exit_code}))

    def run_gate(self, target='index.html'):
        env={'PATH':str(Path(NODE).parent),'HOME':str(self.root/'empty-home'),'LANG':'C.UTF-8'}
        return subprocess.run([NODE,str(self.scripts/'check.mjs'),target,'--brief','brief.md'],cwd=self.project,
                              env=env,text=True,capture_output=True,timeout=30)

    def run_native_gate(self, screens='screen.png'):
        env={'PATH':str(Path(NODE).parent),'HOME':str(self.root/'empty-home'),'LANG':'C.UTF-8'}
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

    def test_motion_violation_is_not_pass(self):
        self.configure(output={'violations':['unverified keyboard reversal'],'verdict':{'scores':{'overall':9}}})
        self.assert_blocked(self.run_gate())

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

if __name__=='__main__': unittest.main()
