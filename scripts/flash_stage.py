"""Host-rendered diagnostic stage: Flash authors, host executes and captures.

Alternative for hosts whose model-side terminal is unavailable. Not autonomous parity.
"""
import argparse
import hashlib
import json
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,required=True);parser.add_argument('--prompt',type=Path,required=True)
    parser.add_argument('--model',default='gemini-3.8-flash-high');parser.add_argument('--timeout',type=int,default=240)
    parser.add_argument('--allow-dir',type=Path,action='append',default=[])
    args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=False)
    prompt=args.prompt.read_text(encoding='utf-8');(args.out/'prompt.txt').write_text(prompt,encoding='utf-8')
    exe=shutil.which('agy')
    if not exe:parser.error('AGY missing; no model substitution')
    command=[exe,'--new-project','--model',args.model,'--mode','accept-edits','--disable-slash-commands','--output-format','stream-json','--print-timeout',f'{args.timeout}s','--print',prompt]
    for directory in args.allow_dir:command.extend(['--add-dir',str(directory.resolve())])
    started=time.time()
    with (args.out/'events.ndjson').open('w') as stdout,(args.out/'stderr.txt').open('w') as stderr:
        child=subprocess.Popen(command,cwd=args.out,stdout=stdout,stderr=stderr,text=True)
        try:code=child.wait(timeout=args.timeout+20)
        except subprocess.TimeoutExpired:child.terminate();child.wait(timeout=10);code=124
    init={};result={}
    for line in (args.out/'events.ndjson').read_text(encoding='utf-8').splitlines():
        try:row=json.loads(line)
        except ValueError:continue
        if row.get('event')=='init':init=row.get('init',{})
        if row.get('event')=='result':result=row.get('result',{})
    (args.out/'result.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    (args.out/'answer.md').write_text(result.get('response') or '',encoding='utf-8')
    record={'model_requested':args.model,'runtime_configured_model':init.get('model'),'reported_model':result.get('model'),
            'started_at':datetime.fromtimestamp(started,timezone.utc).isoformat(),
            'prompt_sha256':hashlib.sha256(prompt.encode()).hexdigest(),'elapsed':time.time()-started,'exit_code':code,
            'usage':result.get('usage'),'denied_actions':result.get('denied_actions',[]),'mode':'host-rendered',
            'status':'blocked-permission' if result.get('denied_actions') else ('response-produced' if result.get('response') else 'incomplete'),
            'limit':'Host tools and frozen prompts supplied; no independent serving-model attestation.'}
    if init.get('model') and init['model'] != args.model: record['status']='model-configuration-mismatch'
    (args.out/'run.json').write_text(json.dumps(record,indent=2),encoding='utf-8');print(json.dumps(record,indent=2))


if __name__=='__main__':main()
