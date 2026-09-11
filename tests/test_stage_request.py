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
    def test_identical_retained_source_is_delivered_once_without_mutating_project(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);source=root/'current.html'
            text='<html><style>h1{color:red}</style><body>Unique source marker é</body></html>'
            source.write_bytes(text.encode('utf-8'))
            project={**self.project(),'retained_source':text}
            out=root/'request'
            manifest=request.prepare('type',project,'Refine type',out,revision_source=source,revision_mode='blocks')
            self.assertEqual(project['retained_source'],text)
            self.assertEqual(manifest['revision']['deduplicated_project_fields'],['retained_source'])
            packet=json.loads((out/'packet.json').read_text(encoding='utf-8'))
            delivered=packet['project_decisions']['retained_source']
            self.assertEqual(delivered['sha256'],hashlib.sha256(source.read_bytes()).hexdigest())
            self.assertEqual((out/delivered['file']).read_bytes(),source.read_bytes())
            self.assertEqual((out/'prompt.txt').read_text(encoding='utf-8').count('Unique source marker'),1)

    def test_different_retained_source_is_not_silently_discarded(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);source=root/'current.html';source.write_bytes(b'<html>Current</html>')
            project={**self.project(),'retained_source':'<html>Earlier design</html>'}
            out=root/'request';manifest=request.prepare('refine',project,'Refine',out,revision_source=source)
            self.assertEqual(manifest['revision']['deduplicated_project_fields'],[])
            packet=json.loads((out/'packet.json').read_text(encoding='utf-8'))
            self.assertEqual(packet['project_decisions']['retained_source'],project['retained_source'])

    def test_type_block_handoff_preserves_markup_and_scopes_changes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);source=root/'wire.html';source.write_bytes(b'<html><style>h1{font-size:20px}</style><body><h1>Export</h1><script>let working=true;</script></body></html>')
            out=root/'type'
            manifest=request.prepare('type',self.project(),'Resolve actual typography',out,revision_source=source,revision_mode='blocks',revision_blocks=['style-0'])
            self.assertEqual((out/'revision-source.txt').read_bytes(),source.read_bytes())
            schema=json.loads((out/'response.schema.json').read_text(encoding='utf-8'))
            self.assertEqual(schema['properties']['blocks']['items']['properties']['id']['enum'],['style-0'])
            self.assertEqual(manifest['revision']['mode'],'blocks')
            self.assertIn('working=true',(out/'prompt.txt').read_text(encoding='utf-8'))

    def test_host_sees_recorder_requirements_before_authoring(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            for stage, role in [('research','material'),('surface','crop'),('wireframe','functional')]:
                out=root/stage
                request.prepare(stage,self.project(),'Complete this stage',out)
                contract=json.loads((out/'host-contract.json').read_text(encoding='utf-8'))
                self.assertEqual(contract['minimum_artifact_counts'][role],1)
                self.assertIn(json.dumps(contract,indent=2),(out/'prompt.txt').read_text(encoding='utf-8'))
            out=root/'plan'
            request.prepare('plan',self.project(),'Plan the alternatives',out)
            contract=json.loads((out/'host-contract.json').read_text(encoding='utf-8'))
            self.assertEqual(contract['concept_records']['required_string_fields'],['id','idea','evidence','risk'])
            self.assertEqual(contract['concept_records']['count'],3)

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

    def test_number_runtime_and_licenses_are_complete_in_the_handoff(self):
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/'handoff'
            project={**self.project(),'motion_helpers':['number'],'decisions':[]}
            manifest=request.prepare('surface',project,'Show the actual changed quantity',out)
            prompt=(out/'prompt.txt').read_text(encoding='utf-8')
            self.assertIn('reserveValues',prompt)
            self.assertIn('Non-Latin numerals',prompt)
            runtime=out/'runtime/seenry-motion/assets'
            self.assertTrue((runtime/'number-transition.mjs').is_file())
            for name in ['LICENSE.md','esm-env/LICENSE','index.mjs','lite.mjs','esm-env/browser-fallback.js']:
                self.assertTrue((runtime/'number-flow'/name).is_file(),name)
            for item in manifest['runtime_files']:
                self.assertEqual(hashlib.sha256((out/'runtime'/item['path']).read_bytes()).hexdigest(),item['sha256'])

    def test_type_checkpoint_receives_number_geometry_without_unrelated_motion_engines(self):
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/'handoff'
            project={**self.project(),'motion_helpers':['number','morph-icon'],'decisions':[]}
            manifest=request.prepare('type',project,'Inspect the actual number reading edge',out)
            runtime=out/'runtime/seenry-motion/assets'
            self.assertTrue((runtime/'number-transition.mjs').is_file())
            self.assertTrue((runtime/'number-flow/esm-env/LICENSE').is_file())
            self.assertFalse((runtime/'morph-icon.mjs').exists())
            for item in manifest['runtime_files']:
                self.assertEqual(hashlib.sha256((out/'runtime'/item['path']).read_bytes()).hexdigest(),item['sha256'])

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

    def test_revision_handoff_freezes_exact_source_and_transport_schema(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);source=root/'previous.html';source.write_bytes('Héllo\r\n'.encode())
            out=root/'request';manifest=request.prepare('refine',self.project(),'Repair actual evidence',out,revision_source=source)
            self.assertEqual((out/'revision-source.txt').read_bytes(),source.read_bytes())
            self.assertEqual(manifest['revision']['source_sha256'],hashlib.sha256(source.read_bytes()).hexdigest())
            schema=json.loads((out/'response.schema.json').read_text(encoding='utf-8'))
            self.assertEqual(schema['properties']['source_sha256']['enum'],[manifest['revision']['source_sha256']])
            self.assertIn('ordered edits',(out/'prompt.txt').read_text(encoding='utf-8'))
            self.assertEqual(manifest['prompt_sha256'],hashlib.sha256((out/'prompt.txt').read_bytes()).hexdigest())
            self.assertEqual(source.read_bytes(),'Héllo\r\n'.encode())
            with self.assertRaises(ValueError):request.prepare('plan',self.project(),'Plan',root/'invalid',revision_source=source)
            self.assertFalse((root/'invalid').exists())


if __name__=='__main__':unittest.main()
