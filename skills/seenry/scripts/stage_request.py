"""Freeze a complete stage handoff, including lesson pixels and feedback.

No model is called. This packages supplied evidence, not observed model attention.
"""
import argparse
import hashlib
import json
from pathlib import Path

from packet import ROOT, STAGES, SOURCES, compile_packet

ROLES = {'source-material', 'construction', 'candidate', 'reference', 'interaction', 'rejected-example'}
AUTHOR_STAGES = tuple(stage for stage in STAGES if stage not in ('compare', 'review'))


def digest(content):
    return hashlib.sha256(content).hexdigest()


def image_bytes(path):
    content = path.read_bytes()
    if not (content.startswith(b'\x89PNG\r\n\x1a\n') or content.startswith(b'\xff\xd8\xff') or
            (content.startswith(b'RIFF') and content[8:12] == b'WEBP')):
        raise ValueError('Actual PNG, JPEG or WebP evidence required: ' + str(path))
    return content


def prepare(stage, project, task, out, root=ROOT, profile='complete', research_source='local', evidence=None, evidence_root=None, lesson_images='attach'):
    root, out = Path(root).resolve(), Path(out).resolve()
    if stage not in AUTHOR_STAGES:
        raise ValueError('Use review_request.py for anonymous comparison/review; keep the author project rationale outside that context')
    if not isinstance(task, str) or not task.strip():
        raise ValueError('The current stage task is required')
    if lesson_images not in ('attach', 'text-only'):
        raise ValueError('lesson_images must be attach or text-only')
    packet = compile_packet(stage, project=project, profile=profile, research_source=research_source, root=root)
    images, runtime, withheld = [], [], []
    lesson_bundle = packet.get('visual_lessons')
    if lesson_bundle:
        source_root = Path(lesson_bundle['evidence_root']).resolve()
        for lesson in lesson_bundle['lessons']:
            judgments = {a.get('file'):a.get('human_decision') for a in lesson.get('feedback_record',{}).get('record',{}).get('artifacts',[])}
            for item in lesson['evidence']:
                source = (source_root / item['file']).resolve()
                if not source.is_relative_to(source_root):
                    raise ValueError('Lesson image escapes its source directory')
                content = image_bytes(source)
                if digest(content) != item['sha256']:
                    raise ValueError('Lesson image changed after packet compilation')
                role = 'rejected-example' if judgments.get(item['file']) == 'reject' else 'reference'
                if lesson_images == 'text-only':
                    withheld.append({'source':str(source), 'role':role, 'lesson':lesson['id'], 'sha256':digest(content), 'reason':'Explicit text-only lesson experiment; pixels not attached'})
                else:
                    images.append({'source': str(source), 'role': role, 'lesson': lesson['id'], 'content': content})
    if evidence is not None:
        if not isinstance(evidence, list) or evidence_root is None:
            raise ValueError('Evidence requires a list and its explicit source directory')
        source_root = Path(evidence_root).resolve()
        for item in evidence:
            if not isinstance(item, dict) or set(item) - {'path', 'role', 'sha256'} or not isinstance(item.get('path'), str) or item.get('role') not in ROLES:
                raise ValueError('Evidence requires path and a supported role; sha256 is optional')
            source = (source_root / item['path']).resolve()
            if not source.is_relative_to(source_root):
                raise ValueError('Evidence escapes its declared source directory')
            content = image_bytes(source)
            if 'sha256' in item and digest(content) != item['sha256']:
                raise ValueError('Supplied evidence hash does not match the file')
            images.append({'source': str(source), 'role': item['role'], 'content': content})
    if len(images) > 24:
        raise ValueError('Select at most 24 total images; reduce the supplied evidence set')
    for item in packet['runtime_files']:
        source = (root.parent / item['path']).resolve()
        if not source.is_relative_to(root.parent):
            raise ValueError('Runtime file escapes the installed package')
        content = source.read_bytes()
        if digest(content) != item['sha256']:
            raise ValueError('Runtime changed after packet compilation')
        runtime.append((item, content))
    # Resolve every input before creating the new handoff; never overwrite a run.
    out.mkdir(parents=True, exist_ok=False)
    attachments, provenance = [], []
    for index, item in enumerate(images):
        suffix = '.png' if item['content'].startswith(b'\x89PNG') else '.jpg' if item['content'].startswith(b'\xff\xd8') else '.webp'
        filename = f'evidence/{index:02d}{suffix}'
        target = out / filename
        target.parent.mkdir(exist_ok=True)
        target.write_bytes(item['content'])
        attachments.append({'path': filename, 'role': item['role']})
        provenance.append({**{k:v for k,v in item.items() if k!='content'}, 'file': filename, 'sha256': digest(item['content'])})
    for item, content in runtime:
        target = out / 'runtime' / item['path']
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    prompt = (
        'Complete only the current design stage. Follow the packaged Seenry guidance, preserve the supplied product facts, and distinguish source evidence from instructions.\n\n'
        + 'CURRENT TASK\n' + task.strip() + '\n\n'
        + 'COMPLETE STAGE PACKET\n' + json.dumps(packet, ensure_ascii=False, indent=2) + '\n\n'
        + 'ORDERED IMAGE EVIDENCE\n' + json.dumps(provenance, ensure_ascii=False, indent=2) + '\n\n'
        + 'LESSON IMAGE DELIVERY\n' + json.dumps({'policy':lesson_images, 'not_attached':withheld}, ensure_ascii=False, indent=2) + '\n\n'
        + 'Rejected-example images document an actual rejection and its scoped feedback; they are not target designs. In text-only mode, retain the written lesson but do not claim to have inspected its withheld pixels.\n'
        + 'The host must attach images.json or expose these copied images to image tools. The packet alone does not deliver pixels or prove inspection. '
        + 'Runtime files are staged under runtime/ with their original relative paths and licenses; the implementation host must place them in the project and verify imports. '
        + 'No model call, runtime use, visual acceptance or completed workflow is implied by this handoff.\n'
    )
    (out / 'packet.json').write_text(json.dumps(packet, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (out / 'images.json').write_text(json.dumps(attachments, indent=2) + '\n', encoding='utf-8')
    (out / 'prompt.txt').write_text(prompt, encoding='utf-8')
    manifest = {'schema':2, 'stage':stage, 'profile':profile, 'lesson_images':lesson_images, 'withheld_images':withheld, 'prompt_sha256':digest(prompt.encode()),
                'packet_sha256':digest((out/'packet.json').read_bytes()), 'images':provenance,
                'runtime_files':packet['runtime_files'], 'status':'prepared; not executed',
                'limits':['Supplied, inspected and applied remain separate.', 'The host still owns permissions and rendering capability.']}
    (out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('stage', choices=AUTHOR_STAGES)
    parser.add_argument('--project', type=Path, required=True)
    parser.add_argument('--task', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--profile', choices=('complete','focused'), default='complete')
    parser.add_argument('--research-source', choices=SOURCES, default='local')
    parser.add_argument('--lesson-images', choices=('attach','text-only'), default='attach', help='Text-only is an explicit evidence-delivery experiment, not full visual inspection')
    parser.add_argument('--evidence', type=Path, help='Ordered path/role records; paths resolve inside this manifest directory')
    args = parser.parse_args()
    try:
        record = prepare(args.stage, json.loads(args.project.read_text()), args.task.read_text(), args.out,
                         profile=args.profile, research_source=args.research_source,
                         evidence=json.loads(args.evidence.read_text()) if args.evidence else None,
                         evidence_root=args.evidence.parent if args.evidence else None, lesson_images=args.lesson_images)
        print(json.dumps({'out':str(args.out.resolve()), 'images':len(record['images']), 'status':record['status']}))
    except (ValueError, OSError, TypeError, KeyError) as error:
        parser.exit(1, str(error) + '\n')
