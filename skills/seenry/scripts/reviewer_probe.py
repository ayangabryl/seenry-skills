"""Blind visual probes and order consistency. Never manufacture human taste labels."""
import argparse, hashlib, json, random, shutil
from pathlib import Path

def write(path,data):path.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
def prepare(manifest, source, out, seed):
    out=Path(out);out.mkdir(parents=True,exist_ok=False)
    rng=random.Random(seed);public=[];private=[]
    cases=list(manifest['cases']);rng.shuffle(cases)
    for i,case in enumerate(cases):
        if not case.get('id') or not case.get('brief'):raise ValueError('Case id and factual brief required')
        variants=list(case['variants']);rng.shuffle(variants);key={};display=[]
        for j,variant in enumerate(variants):
            path=Path(source)/variant['image'];content=path.read_bytes()
            if not content.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('Probe images must be actual PNG files')
            label=chr(65+j);name=f'case-{i+1}-{label}.png';shutil.copy2(path,out/name)
            key[label]={'id':variant['id'],'sha256':hashlib.sha256(content).hexdigest()}
            display.append({'label':label,'image':name})
        public.append({'id':f'case-{i+1}','brief':case['brief'],'question':case['question'],'variants':display})
        private.append({'public_id':f'case-{i+1}','id':case['id'],'map':key,'human_labels':case.get('human_labels',[])})
    write(out/'cases.json',{'cases':public});write(out/'private-key.json',{'seed':seed,'cases':private})
    return public

def normalize(response,key):
    keys={c['public_id']:c for c in key['cases']};seen=set();normalized={}
    for answer in response['cases']:
        ident=answer['id']
        if ident not in keys or ident in seen:raise ValueError('Unknown or repeated case')
        seen.add(ident);case=keys[ident];choice=answer['preferred']
        if choice not in (*case['map'],'equal','reject-all','unverified'):raise ValueError('Unknown preference')
        if not answer.get('observation') or not answer.get('repair'):raise ValueError('Observable reason and repair required')
        normalized[case['id']]={'preferred':case['map'][choice]['id'] if choice in case['map'] else choice,
            'observation':answer['observation'],'repair':answer['repair']}
    if set(keys)!=seen:raise ValueError('Incomplete review')
    return normalized

def compare(first,second):
    if set(first)!=set(second):raise ValueError('Different case sets')
    return {'cases':len(first),'consistent_choices':sum(first[k]['preferred']==second[k]['preferred'] for k in first),
        'changes':[{'id':k,'first':first[k]['preferred'],'second':second[k]['preferred']} for k in first if first[k]['preferred']!=second[k]['preferred']],
        'limit':'Order consistency only, not correctness, human agreement or taste accuracy.'}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);s=p.add_subparsers(dest='cmd',required=True)
    a=s.add_parser('prepare');a.add_argument('manifest',type=Path);a.add_argument('--out',type=Path,required=True);a.add_argument('--seed',type=int,required=True)
    a=s.add_parser('normalize');a.add_argument('response',type=Path);a.add_argument('--key',type=Path,required=True);a.add_argument('--out',type=Path,required=True)
    a=s.add_parser('compare');a.add_argument('first',type=Path);a.add_argument('second',type=Path)
    args=p.parse_args()
    try:
        load=lambda f:json.loads(f.read_text(encoding='utf-8'))
        if args.cmd=='prepare':print(json.dumps({'cases':len(prepare(load(args.manifest),args.manifest.parent,args.out,args.seed))}))
        elif args.cmd=='normalize':write(args.out,normalize(load(args.response),load(args.key)))
        else:print(json.dumps(compare(load(args.first),load(args.second)),indent=2))
    except (OSError,ValueError,KeyError,TypeError) as e:p.exit(1,str(e)+'\n')
