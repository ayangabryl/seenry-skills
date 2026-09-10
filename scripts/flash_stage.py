"""Host-rendered diagnostic stage: Flash authors, host executes and captures.

Alternative for hosts whose model-side terminal is unavailable. Not autonomous parity.
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path


def authentication_blocked(log):
    """Recognize the observed AGY bootstrap failure without exposing auth data."""
    try:
        with Path(log).open('rb') as stream:
            stream.seek(0,2);size=stream.tell();stream.seek(max(0,size-65536))
            tail=stream.read().decode('utf-8',errors='replace')
    except FileNotFoundError:
        return False
    return any('You are not logged into Antigravity.' in line and re.match(r'^[WE]\d{4}\s+.*\s(?:cache|errorreport)\.go:\d+\]', line) for line in tail.splitlines())


def stop_child(child):
    child.terminate()
    try:child.wait(timeout=5)
    except subprocess.TimeoutExpired:child.kill();child.wait(timeout=5)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,required=True);parser.add_argument('--prompt',type=Path,required=True)
    parser.add_argument('--model',default='gemini-3.8-flash-high');parser.add_argument('--timeout',type=int,default=240)
    parser.add_argument('--allow-dir',type=Path,action='append',default=[])
    args=parser.parse_args();args.out=args.out.resolve();args.out.mkdir(parents=True,exist_ok=False)
    prompt=args.prompt.read_text(encoding='utf-8');(args.out/'prompt.txt').write_text(prompt,encoding='utf-8')
    exe=shutil.which('agy')
    if not exe:parser.error('AGY missing; no model substitution')
    command=[exe,'--new-project','--model',args.model,'--mode','accept-edits','--disable-slash-commands','--log-file',str(args.out/'cli.log'),'--output-format','stream-json','--print-timeout',f'{args.timeout}s','--print',prompt]
    for directory in args.allow_dir:command.extend(['--add-dir',str(directory.resolve())])
    runner_hash=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    started=time.time();timed_out=False;blocked_auth=False
    with (args.out/'events.ndjson').open('w') as stdout,(args.out/'stderr.txt').open('w') as stderr:
        child=subprocess.Popen(command,cwd=args.out,stdout=stdout,stderr=stderr,text=True)
        deadline=time.monotonic()+args.timeout+20
        while True:
            if authentication_blocked(args.out/'cli.log'):
                blocked_auth=True;stop_child(child);code=1;break
            remaining=deadline-time.monotonic()
            if remaining<=0:
                timed_out=True;stop_child(child);code=124;break
            try:code=child.wait(timeout=min(1,remaining));break
            except subprocess.TimeoutExpired:continue
        blocked_auth=blocked_auth or authentication_blocked(args.out/'cli.log')
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
            'timed_out':timed_out,'authentication_blocked':blocked_auth,
            'runner_sha256':runner_hash,
            'status':'blocked-authentication' if blocked_auth else ('blocked-permission' if result.get('denied_actions') else ('response-produced' if result.get('response') and code==0 and not timed_out else 'incomplete')),
            'limit':'Host tools and frozen prompts supplied; no independent serving-model attestation.'}
    if init.get('model') and init['model'] != args.model: record['status']='model-configuration-mismatch'
    if blocked_auth:record['required_action']='Sign in to Antigravity; no model generation result is available.'
    record['log_handling']='cli.log is private diagnostic data; inspect only relevant errors and do not publish it as a benchmark asset.'
    (args.out/'run.json').write_text(json.dumps(record,indent=2),encoding='utf-8');print(json.dumps(record,indent=2))


if __name__=='__main__':main()
