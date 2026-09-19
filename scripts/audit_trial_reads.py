"""Reject observed global-skill contamination; not an OS isolation attestation."""
import json,sys
from pathlib import Path
def audit(run):
 records=[]
 for line in (run/'events.ndjson').read_text().splitlines():
  try:e=json.loads(line)
  except ValueError:continue
  i=e.get('item',{});command=i.get('command','')
  if e.get('type')=='item.completed' and i.get('type')=='command_execution' and i.get('exit_code')==0 and any(x in command for x in ['/.codex/skills/','/.agents/skills/','/.claude/skills/','/.cursor/skills/']):
   records.append({'command':command,'finding':'Successful command references global skills outside frozen condition'})
 result={'status':'contaminated' if records else 'clear-observed','findings':records,'limit':'Command-log check only, not proof against hidden ambient content or unlogged reads.'}
 (run/'provenance-audit.json').write_text(json.dumps(result,indent=2));return result
if __name__=='__main__':
 for p in Path(sys.argv[1]).glob('*/events.ndjson'):print(p.parent.name,audit(p.parent)['status'])
