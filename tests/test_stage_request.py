import hashlib
import importlib.util
import json
import sys
import tempfile
import subprocess
import os
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / 'skills/seenry/scripts'
sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location('stage_request_tested', SCRIPTS/'stage_request.py')
request = importlib.util.module_from_spec(spec)
spec.loader.exec_module(request)


class StageRequest(unittest.TestCase):
    def test_cli_reads_utf8_independently_of_locale(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/'project.json').write_text(json.dumps({'brief':'Français — 日本語','scope':'component','media':'none','motion':'none'},ensure_ascii=False),encoding='utf-8')
            (root/'task.txt').write_text('Vérifier 日本語',encoding='utf-8')
            env={**os.environ,'PYTHONUTF8':'0','PYTHONCOERCECLOCALE':'0','LC_ALL':'C','PYTHONIOENCODING':'ascii'}
            result=subprocess.run([sys.executable,str(SCRIPTS/'stage_request.py'),'understand','--project',str(root/'project.json'),'--task',str(root/'task.txt'),'--out',str(root/'request')],env=env,capture_output=True,timeout=15)
            self.assertEqual(result.returncode,0,result.stderr)
            prompt=(root/'request/prompt.txt').read_text(encoding='utf-8')
            self.assertIn('Français — 日本語',prompt)
            self.assertIn('Vérifier 日本語',prompt)

    def project(self):
        return {'scope':'component', 'media':'needed', 'motion':'feedback',
                'motion_helpers':['morph-icon'], 'decisions':['export-feedback'],
                'brief':'Export the selected photograph', 'retained_behavior':['Keep color and aspect ratio']}

    def test_feedback_pixels_and_runtime_survive_the_actual_model_handoff(self):
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/'handoff'
            manifest=request.prepare('build',self.project(),'Finish the selected component',out)
            packet=json.loads((out/'packet.json').read_text(encoding='utf-8'))
            prompt=(out/'prompt.txt').read_text(encoding='utf-8')
            self.assertIn(json.dumps(packet,ensure_ascii=False,indent=2),prompt)
            self.assertIn('Clean but insufficiently creative',prompt)
            self.assertIn('Keep color and aspect ratio',prompt)
            self.assertEqual(len(manifest['images']),4)
            self.assertEqual({x['role'] for x in manifest['images']},{'rejected-example'})
            for image in manifest['images']:
                self.assertEqual(hashlib.sha256((out/image['file']).read_bytes()).hexdigest(),image['sha256'])
            for item in manifest['runtime_files']:
                self.assertEqual(hashlib.sha256((out/'runtime'/item['path']).read_bytes()).hexdigest(),item['sha256'])
            self.assertTrue((out/'runtime/seenry-motion/assets/morphicons/LICENSE').is_file())
            self.assertEqual(manifest['status'],'prepared; not executed')

    def test_text_only_experiment_keeps_feedback_and_records_withheld_pixels(self):
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/'handoff'
            manifest=request.prepare('build',self.project(),'Finish',out,lesson_images='text-only')
            self.assertEqual(manifest['images'],[])
            self.assertEqual(len(manifest['withheld_images']),4)
            self.assertIn('Clean but insufficiently creative',(out/'prompt.txt').read_text(encoding='utf-8'))
            self.assertEqual(json.loads((out/'images.json').read_text(encoding='utf-8')),[])
            self.assertFalse((out/'evidence').exists())
            self.assertTrue((out/'runtime/seenry-motion/assets/morphicons/LICENSE').is_file())

    def test_original_asset_and_construction_keep_distinct_ordered_roles(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            source=ROOT/'skills/seenry/references/lessons/state-A.png'
            for name in ['photo.png','wireframe.png']:(root/name).write_bytes(source.read_bytes())
            out=root/'handoff'
            manifest=request.prepare('understand',self.project(),'Read the brief',out,
                evidence=[{'path':'photo.png','role':'source-material'},{'path':'wireframe.png','role':'construction'}],evidence_root=root)
            self.assertEqual([x['role'] for x in manifest['images']],['source-material','construction'])
            self.assertEqual(json.loads((out/'images.json').read_text(encoding='utf-8')),[
                {'path':'evidence/00.png','role':'source-material'}, {'path':'evidence/01.png','role':'construction'}])

    def test_bad_evidence_and_changed_hashes_fail_before_creating_a_partial_handoff(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'image.png').write_bytes((ROOT/'skills/seenry/references/lessons/state-A.png').read_bytes())
            cases=[{'path':'image.png','role':'source-material','sha256':'0'*64},
                   {'path':'image.png','role':'approved'}, {'path':'../outside.png','role':'candidate'}]
            for index,item in enumerate(cases):
                out=root/f'bad-{index}'
                with self.assertRaises(ValueError):request.prepare('understand',self.project(),'Read',out,evidence=[item],evidence_root=root)
                self.assertFalse(out.exists())

    def test_an_existing_request_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/'handoff';request.prepare('understand',self.project(),'First task',out)
            original=(out/'prompt.txt').read_bytes()
            with self.assertRaises(FileExistsError):request.prepare('understand',self.project(),'Second task',out)
            self.assertEqual((out/'prompt.txt').read_bytes(),original)

    def test_creator_handoff_cannot_be_mistaken_for_an_anonymous_review(self):
        with tempfile.TemporaryDirectory() as tmp:
            for stage in ('compare','review'):
                out=Path(tmp)/stage
                with self.assertRaisesRegex(ValueError,'review_request.py'):
                    request.prepare(stage,self.project(),'Review',out)
                self.assertFalse(out.exists())


if __name__=='__main__':unittest.main()
