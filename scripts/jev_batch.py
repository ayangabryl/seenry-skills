"""Explicitly budgeted development experiment. Serial calls, immutable inputs, no retries."""
import argparse
from decimal import Decimal
import hashlib
import json
import os
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'skills/seenry/scripts'))
from jev_decision import prepare, evaluate, MODEL


def run(directory, end):
    config_path=directory/'experiment.json'
    raw=config_path.read_bytes();config=json.loads(raw)
    if len(config['requests'])>100 or len({e['path'] for e in config['requests']})!=len(config['requests']):raise ValueError('Invalid request manifest')
    if config['id']!='seenry-100-20260922' or config['model']!=MODEL or config['max_calls']!=100 or config['budget_usd']!='0.50':
        raise ValueError('Only the explicitly authorized 100-call experiment is supported')
    state=Path.home()/'.local/state/seenry'/config['id'];state.mkdir(parents=True,exist_ok=True,mode=0o700)
    digest=hashlib.sha256(json.dumps({k:v for k,v in config.items() if k!="requests"},sort_keys=True).encode()).hexdigest();identity=state/'config.sha256'
    lock=state/'run.lock'
    fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    try:
        if identity.exists() and identity.read_text()!=digest:raise ValueError('Experiment configuration changed')
        if not identity.exists():identity.write_text(digest)
        if (state/'stopped').exists():raise ValueError('Prior uncertain or failed attempt; inspect before a new authorized experiment')
        key_path=Path.home()/'.config/seenry/typesafe-api-key'
        if key_path.stat().st_mode&0o077:raise ValueError('Credential file must have mode600')
        key=key_path.read_text().strip()
        if not key or any(c.isspace()for c in key):raise ValueError('Invalid credential format')
        for entry in config['requests'][:end]:
            source=directory/entry['path'];raw_request=source.read_bytes()
            if hashlib.sha256(raw_request).hexdigest()!=entry['sha256']:raise ValueError('Request changed: '+entry['path'])
            payload,encoded=prepare(json.loads(raw_request));out=directory/'results'/source.name
            if out.exists():
                if json.loads(out.read_text()).get('request_sha256')!=hashlib.sha256(encoded).hexdigest():raise ValueError('Stored result mismatch')
                continue
            out.parent.mkdir(parents=True,exist_ok=True)
            try:
                result=evaluate(payload,encoded,key,state/'ledger.jsonl',max_calls=100,budget=Decimal('0.50'))
                with out.open('x') as stream:json.dump(result,stream,indent=2)
            except Exception:
                (state/'stopped').write_text('Inspect attempt for '+entry['path']+'; no automatic retry.');raise
            print(source.stem+': '+','.join(k+'='+v['choice'] for k,v in result['answers'].items()),flush=True)
    finally:
        os.close(fd);lock.unlink()

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('directory',type=Path);p.add_argument('--through',type=int,default=100);a=p.parse_args()
    if not 1<=a.through<=100:p.error('through must be 1..100')
    try:run(a.directory,a.through)
    except Exception as e:p.exit(1,'Stopped: '+str(e)+'\n')
