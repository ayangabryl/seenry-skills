"""Select a bounded technical exercise. No archived screenshot is a design standard."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'references/lessons'

def select(topics, root=ROOT):
    if not isinstance(topics, list) or not topics or len(topics)>2 or any(not isinstance(t,str) for t in topics) or len(set(topics))!=len(topics):
        raise ValueError('Select one or two distinct decision topics')
    root=Path(root).resolve()
    skill_root=root.parent.parent
    data=json.loads((root/'index.json').read_text(encoding='utf-8'))
    if data.get('schema') != 2:
        raise ValueError('Archived image lessons are not current skill guidance; use the repository archive helper explicitly')
    catalog={item['id']:item for item in data['lessons']}
    if any(t not in catalog for t in topics):
        raise ValueError('Unknown topic; available: '+', '.join(catalog))
    lessons=[]
    for topic in topics:
        item=dict(catalog[topic]);resources=[]
        for name in item.pop('resources'):
            path=(skill_root/name).resolve()
            if not path.is_relative_to(skill_root) or path.suffix not in ('.md','.html'):
                raise ValueError('Invalid exercise resource path')
            content=path.read_bytes()
            resources.append({'path':name,'sha256':hashlib.sha256(content).hexdigest()})
        item['resources']=resources
        item['evidence']=[]
        lessons.append(item)
    return {'schema':2,'lessons':lessons,'evidence_root':str(root),
        'instructions':'Use the selected relationship and countercase on the project’s actual content. The supplied HTML demonstrates mechanics, not premium styling. Render before judging it. Use task-relevant inspected references for visual quality. No reference pixels or human acceptance are supplied by this exercise.',
        'limit':'Legacy topic names remain compatible, but archived benchmark screenshots and preference labels are excluded from installed guidance.'}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('topics',nargs='+');args=parser.parse_args()
    try:print(json.dumps(select(args.topics),indent=2,ensure_ascii=False))
    except (ValueError,OSError,KeyError) as error:parser.exit(1,str(error)+'\n')
