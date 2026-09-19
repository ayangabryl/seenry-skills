import importlib.util,json,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('audit',ROOT/'scripts/audit_trial_reads.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ReadAudit(unittest.TestCase):
 def test_successful_foreign_read_blocks_and_failed_read_does_not_prove_loading(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);event={'type':'item.completed','item':{'type':'command_execution','exit_code':0,'command':'cat /Users/example/.codex/skills/seenry/SKILL.md'}}
   (p/'events.ndjson').write_text(json.dumps(event));self.assertEqual(m.audit(p)['status'],'contaminated')
   event['item']['exit_code']=1;(p/'events.ndjson').write_text(json.dumps(event));self.assertEqual(m.audit(p)['status'],'clear-observed')
 def test_frozen_relative_resource_is_allowed(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);(p/'events.ndjson').write_text(json.dumps({'type':'item.completed','item':{'type':'command_execution','exit_code':0,'command':'cat skills/seenry/SKILL.md'}}));self.assertEqual(m.audit(p)['findings'],[])
