"""Select small, rendered decision lessons. Screenshots are evidence, not approvals."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'references/lessons'

def select(topics, root=ROOT):
    if not isinstance(topics, list) or not topics or len(topics)>2 or len(set(topics))!=len(topics):
        raise ValueError('Select one or two distinct decision topics')
    root=Path(root).resolve()
    data=json.loads((root/'index.json').read_text(encoding='utf-8'))
    catalog={item['id']:item for item in data['lessons']}
    if any(t not in catalog for t in topics):
        raise ValueError('Unknown topic; available: '+', '.join(catalog))
    lessons=[]
    for topic in topics:
        item=dict(catalog[topic]);evidence=[]
        if 'feedback_file' in item:
            name=item.pop('feedback_file');path=(root/name).resolve()
            if not path.is_relative_to(root) or path.suffix!='.json':raise ValueError('Invalid feedback path')
            content=path.read_bytes()
            item['feedback_record']={'file':name,'sha256':hashlib.sha256(content).hexdigest(),'record':json.loads(content)}
        for name in item.pop('inspect'):
            path=(root/name).resolve()
            if not path.is_relative_to(root) or path.suffix!='.png':raise ValueError('Invalid lesson path')
            content=path.read_bytes()
            if not content.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('Missing actual PNG capture')
            source = path.with_suffix('.html')
            evidence.append({'file':name,'sha256':hashlib.sha256(content).hexdigest(),'html':source.name if source.is_file() else None})
        item['evidence']=evidence;lessons.append(item)
    return {'schema':1,'lessons':lessons,'evidence_root':str(root),
        'instructions':'Inspect these actual renders at ordinary size. State the relationship you transfer and what must differ for this brief. Do not copy the sample identity. Supplied files are not proof of inspection. If image inspection is unavailable, use text guidance and leave visual verification pending.',
        'limit':'Evidence types and preference scope are stated per case. A teaching hypothesis or single pairwise preference is not universal acceptance or a measured population improvement.'}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('topics',nargs='+');args=parser.parse_args()
    try:print(json.dumps(select(args.topics),indent=2))
    except (ValueError,OSError,KeyError) as error:parser.exit(1,str(error)+'\n')
