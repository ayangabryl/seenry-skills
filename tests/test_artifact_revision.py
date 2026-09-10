import hashlib,json,subprocess,sys,tempfile,unittest
from pathlib import Path
from jsonschema import Draft202012Validator
from test_package import module,ROOT
revision=module('artifact_revision',ROOT/'skills/seenry/scripts/artifact_revision.py')
class ArtifactRevision(unittest.TestCase):
 def response(self,source,edits):return {'source_sha256':hashlib.sha256(source).hexdigest(),'edits':edits}
 def test_exact_unicode_and_crlf_preserved(self):
  source='a\r\n<button>Exporté</button>\r\n日本語'.encode()
  value,record=revision.apply_revision(source,self.response(source,[{'find':'Exporté','replace':'Télécharger'}]))
  self.assertEqual(value,source.replace('Exporté'.encode(),'Télécharger'.encode()))
  self.assertEqual(record['result_sha256'],hashlib.sha256(value).hexdigest())
 def test_ordered_edits_can_target_previous_result(self):
  source=b'first other';value,_=revision.apply_revision(source,self.response(source,[{'find':'first','replace':'second'},{'find':'second other','replace':'final'}]));self.assertEqual(value,b'final')
 def test_deletion_is_supported_but_insertion_needs_context(self):
  source=b'prefix suffix';value,_=revision.apply_revision(source,self.response(source,[{'find':'prefix ','replace':''}]));self.assertEqual(value,b'suffix')
  with self.assertRaises(ValueError):revision.apply_revision(source,self.response(source,[{'find':'','replace':'ambiguous'}]))
 def test_wrong_hash_and_ambiguous_or_missing_source_rejected(self):
  source=b'one one two';r=self.response(source,[{'find':'two','replace':'three'}]);r['source_sha256']='0'*64
  with self.assertRaises(ValueError):revision.apply_revision(source,r)
  for before in ('one','missing'):
   with self.assertRaises(ValueError):revision.apply_revision(source,self.response(source,[{'find':before,'replace':'new'}]))
 def test_invalid_and_noop_revisions_rejected(self):
  source=b'hello'
  for edits in ([],[{'find':'hello','replace':'hello'}],[{'find':'hello','replace':'new','extra':True}],[{'find':'hello','replace':None}], [{'find':'hello','replace':'changed'},{'find':'changed','replace':'hello'}]):
   with self.assertRaises(ValueError):revision.apply_revision(source,self.response(source,edits))
 def test_transport_schema_pins_source(self):
  source=b'text';r=self.response(source,[{'find':'text','replace':'new'}]);v=Draft202012Validator(revision.response_schema(r['source_sha256']));self.assertFalse(list(v.iter_errors(r)));r['source_sha256']='0'*64;self.assertTrue(list(v.iter_errors(r)))
 def test_cli_preserves_source_and_refuses_overwrite_or_partial_artifact(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp);source=p/'source.html';source.write_bytes(b'hello');response=p/'edits.json';response.write_text(json.dumps(self.response(source.read_bytes(),[{'find':'hello','replace':'new'}])),encoding='utf-8');out=p/'next.html'
   cmd=[sys.executable,str(ROOT/'skills/seenry/scripts/artifact_revision.py'),'--source',str(source),'--response',str(response),'--out',str(out)]
   self.assertEqual(subprocess.run(cmd,capture_output=True).returncode,0);self.assertEqual(source.read_bytes(),b'hello');self.assertEqual(out.read_bytes(),b'new')
   self.assertNotEqual(subprocess.run(cmd,capture_output=True).returncode,0);self.assertEqual(out.read_bytes(),b'new')
   out.unlink();response.write_text(json.dumps(self.response(source.read_bytes(),[{'find':'absent','replace':'new'}])),encoding='utf-8');self.assertNotEqual(subprocess.run(cmd,capture_output=True).returncode,0);self.assertFalse(out.exists())
