import importlib.util,json,tempfile,unittest
from unittest.mock import patch
from contextlib import redirect_stdout
import io
import os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
s=importlib.util.spec_from_file_location('luna',ROOT/'scripts/luna_stage.py');luna=importlib.util.module_from_spec(s);s.loader.exec_module(luna)
class LunaAdapter(unittest.TestCase):
 def test_relative_output_path_stays_valid_after_child_changes_directory(self):
  with tempfile.TemporaryDirectory(dir=ROOT) as tmp:
   out=Path(tmp)/'nested'/'run';out.mkdir(parents=True)
   relative=Path(os.path.relpath(out))
   command=luna.command_for('/bin/codex',relative,[])
   destination=Path(command[command.index('-o')+1])
   self.assertTrue(destination.is_absolute())
   self.assertEqual(destination.parent,out.resolve())
   (out/destination).write_text('Actual child output')
   self.assertEqual((out/'answer.md').read_text(encoding='utf-8'),'Actual child output')
 def test_fresh_config_option_is_explicit_and_does_not_change_the_requested_model(self):
  ordinary=luna.command_for('/bin/codex',Path('/tmp/output'),[])
  fresh=luna.command_for('/bin/codex',Path('/tmp/output'),[],True)
  self.assertNotIn('--ignore-user-config',ordinary)
  self.assertIn('--ignore-user-config',fresh)
  self.assertEqual(fresh[fresh.index('-m')+1],'gpt-5.6-luna')
  self.assertIn('--ephemeral',fresh)
 def test_shell_feature_disable_is_opt_in_and_preserves_read_only_and_model(self):
  ordinary=luna.command_for('/bin/codex',Path('/tmp/output'),[])
  restricted=luna.command_for('/bin/codex',Path('/tmp/output'),[],disable_shell=True)
  self.assertNotIn('--disable',ordinary)
  self.assertEqual(restricted[restricted.index('--disable')+1],'shell_tool')
  self.assertEqual(restricted[restricted.index('-m')+1],'gpt-5.6-luna')
  self.assertIn('read-only',restricted)
 def test_response_schema_path_survives_child_directory_change(self):
  with tempfile.TemporaryDirectory(dir=ROOT) as tmp:
   schema=Path(tmp)/'response.schema.json';schema.write_text('{"type":"object"}')
   relative=Path(os.path.relpath(schema))
   command=luna.command_for('/bin/codex',Path(tmp),[],output_schema=relative)
   self.assertEqual(command[command.index('--output-schema')+1],str(schema.resolve()))
   self.assertNotIn('--output-schema',luna.command_for('/bin/codex',Path(tmp),[]))
 def test_explicit_image_order_is_the_actual_cli_order(self):
  with tempfile.TemporaryDirectory() as tmp:
   r=Path(tmp)
   for name in ['b.png','a.png']:(r/name).write_bytes((ROOT/'skills/seenry/references/lessons/state-B.png').read_bytes())
   m=r/'images.json';m.write_text(json.dumps(['b.png','a.png','b.png']))
   images=luna.explicit_images(m,[r]);command=luna.command_for('/bin/codex',r,images)
   self.assertEqual([command[i+1] for i,v in enumerate(command)if v=='-i'],[str((r/'b.png').resolve()),str((r/'a.png').resolve())])
   self.assertEqual(command[-1],'-');self.assertIn('gpt-5.6-luna',command);self.assertIn('read-only',command)
 def test_missing_or_unreadable_visual_material_is_not_silently_dropped(self):
  with tempfile.TemporaryDirectory() as tmp:
   r=Path(tmp);m=r/'images.json';m.write_text('["absent.png"]')
   with self.assertRaises(ValueError):luna.explicit_images(m,[r])
   (r/'absent.png').write_text('Image inspected')
   with self.assertRaises(ValueError):luna.explicit_images(m,[r])
 def test_original_material_and_construction_roles_survive_delivery(self):
  with tempfile.TemporaryDirectory() as tmp:
   r=Path(tmp);img=(ROOT/'skills/seenry/references/lessons/state-B.png').read_bytes()
   for n in ['asset.png','study.png']:(r/n).write_bytes(img)
   m=r/'images.json';m.write_text(json.dumps([{'path':'asset.png','role':'source-material'},{'path':'study.png','role':'construction'}]))
   result=luna.explicit_images(m,[r]);self.assertEqual([x['role'] for x in result],['source-material','construction'])
   m.write_text(json.dumps([{'path':'asset.png','role':'source-material'},{'path':'asset.png','role':'construction'}]))
   with self.assertRaises(ValueError):luna.explicit_images(m,[r])
 def test_manifest_respects_its_explicit_resource_scope(self):
  with tempfile.TemporaryDirectory() as tmp:
   r=Path(tmp);m=r/'images.json';(r/'a.png').write_bytes((ROOT/'skills/seenry/references/lessons/state-B.png').read_bytes());m.write_text('["a.png"]')
   with self.assertRaises(ValueError):luna.explicit_images(m,[r/'other'])
 def test_interruption_terminates_child_and_preserves_incomplete_record(self):
  class Child:
   returncode=130
   calls=0
   stopped=False
   def communicate(self,*args,**kwargs):
    self.calls+=1
    if self.calls==1:raise KeyboardInterrupt()
   def terminate(self):self.stopped=True
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);prompt=root/'prompt.txt';prompt.write_text('A bounded test');out=root/'run';child=Child()
   with patch('sys.argv',['luna_stage.py','--prompt',str(prompt),'--out',str(out)]),patch.object(luna.shutil,'which',return_value='/fake/codex'),patch.object(luna.subprocess,'Popen',return_value=child) as popen,redirect_stdout(io.StringIO()):
    luna.main()
   result=json.loads((out/'run.json').read_text(encoding='utf-8'))
   self.assertEqual(popen.call_args.kwargs['encoding'],'utf-8')
   self.assertTrue(child.stopped);self.assertTrue(result['interrupted']);self.assertFalse(result['timed_out'])
   self.assertEqual(result['status'],'incomplete');self.assertEqual(result['exit_code'],130);self.assertIsNone(result['usage'])
if __name__=='__main__':unittest.main()
