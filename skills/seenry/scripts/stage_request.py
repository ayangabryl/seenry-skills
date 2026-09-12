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


def prepare(stage, project, task, out, root=ROOT, profile='focused', research_source=None, evidence=None, evidence_root=None, lesson_images='attach', revision_source=None, revision_mode='exact', revision_blocks=None):
    root, out = Path(root).resolve(), Path(out).resolve()
    if stage not in AUTHOR_STAGES:
        raise ValueError('Use review_request.py for anonymous comparison/review; keep the author project rationale outside that context')
    if not isinstance(task, str) or not task.strip():
        raise ValueError('The current stage task is required')
    if lesson_images not in ('attach', 'text-only'):
        raise ValueError('lesson_images must be attach or text-only')
    revision = None
    if revision_mode not in ('exact', 'blocks') or (revision_source is None and (revision_mode != 'exact' or revision_blocks)):
        raise ValueError('Block mode requires an existing revision source')
    if revision_blocks and revision_mode != 'blocks': raise ValueError('Selected blocks require block revision mode')
    if revision_source is not None:
        if stage not in ('wireframe', 'type', 'surface', 'build', 'refine'):
            raise ValueError('A source revision requires an implementation stage')
        from artifact_revision import response_schema, block_response_schema, selected_blocks
        source_content = Path(revision_source).read_bytes()
        source_text = source_content.decode('utf-8')
        revision = {'source_file': 'revision-source.txt', 'source_sha256': digest(source_content),
                    'schema_file': 'response.schema.json', 'mode': revision_mode}
        if revision_mode == 'blocks':
            revision['allowed_blocks'] = selected_blocks(source_content, revision_blocks)
            revision_schema = block_response_schema(source_content, revision_blocks)
        else: revision_schema = response_schema(revision['source_sha256'])
        # A common host record already contains this same complete source. Keep
        # one authoritative body in the prompt, without changing caller data or
        # discarding a different historical source that may be intentional.
        revision['deduplicated_project_fields'] = []
        if project.get('retained_source') == source_text:
            project = {**project, 'retained_source': {
                'file': revision['source_file'], 'sha256': revision['source_sha256'],
                'delivery': 'Exact body follows under EXACT CURRENT SOURCE; identical duplicate omitted.'}}
            revision['deduplicated_project_fields'].append('retained_source')
    packet = compile_packet(stage, project=project, profile=profile, research_source=research_source, root=root)
    from workflow import stage_requirements, ORDER
    host_contract = stage_requirements(project, stage) if stage in ORDER else None
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
    if host_contract:
        (out / 'host-contract.json').write_text(json.dumps(host_contract, indent=2) + '\n', encoding='utf-8')
    if revision:
        (out / revision['source_file']).write_bytes(source_content)
        (out / revision['schema_file']).write_text(json.dumps(revision_schema, indent=2) + '\n', encoding='utf-8')
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
        + 'CURRENT AUTHOR/HOST ARTIFACT CONTRACT\n' + json.dumps(host_contract, indent=2) + '\n\n'
        + 'COMPLETE STAGE PACKET\n' + json.dumps(packet, ensure_ascii=False, indent=2) + '\n\n'
        + 'ORDERED IMAGE EVIDENCE\n' + json.dumps(provenance, ensure_ascii=False, indent=2) + '\n\n'
        + 'LESSON IMAGE DELIVERY\n' + json.dumps({'policy':lesson_images, 'not_attached':withheld}, ensure_ascii=False, indent=2) + '\n\n'
        + 'Rejected-example images document an actual rejection and its scoped feedback; they are not target designs. In text-only mode, retain the written lesson but do not claim to have inspected its withheld pixels.\n'
        + 'The host must attach images.json or expose these copied images to image tools. The packet alone does not deliver pixels or prove inspection. '
        + 'Runtime files are staged under runtime/ with their original relative paths and licenses; the implementation host must place them in the project and verify imports. '
        + 'No model call, runtime use, visual acceptance or completed workflow is implied by this handoff.\n'
    )
    if revision:
        if revision_mode == 'blocks':
            prompt += ('\nINLINE BLOCK REVISION RESPONSE\nReturn only source_sha256 and blocks:[{id,content}] under response.schema.json. '
                'Replace the complete content of only the allowed inline style/script blocks. Do not repeat surrounding HTML, opening/closing tags, or unchanged blocks. '
                'The host preserves every source byte outside the selected bodies. This mode fits existing standalone HTML studies whose current changes stay within those blocks; '
                'it cannot perform structural HTML edits. The host must apply the same allowed block IDs and re-render the result.\n'
                + json.dumps(revision) + '\nEXACT CURRENT SOURCE\n' + source_text + '\nEND CURRENT SOURCE\n')
        else: prompt += ('\nSOURCE REVISION RESPONSE\nReturn only the JSON required by response.schema.json: source_sha256 and one to 32 ordered edits with find/replace strings. '
            'Each find must match exactly once after earlier edits. Use enough unchanged context to disambiguate it; no empty find or no-op edit. '
            'Preserve parts outside these edits. The host will apply the operations mechanically into a new artifact and preserve this source and your response. '
            'The revision format changes delivery only; complete the current design stage and retain its required behavior.\n'
            + json.dumps(revision) + '\nEXACT CURRENT SOURCE\n' + source_text + '\nEND CURRENT SOURCE\n')
    (out / 'packet.json').write_text(json.dumps(packet, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (out / 'images.json').write_text(json.dumps(attachments, indent=2) + '\n', encoding='utf-8')
    (out / 'prompt.txt').write_bytes(prompt.encode('utf-8'))
    manifest = {'schema':3, 'stage':stage, 'profile':profile, 'lesson_images':lesson_images, 'withheld_images':withheld, 'revision':revision, 'prompt_sha256':digest(prompt.encode()),
                'host_contract':host_contract,
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
    parser.add_argument('--profile', choices=('complete','focused'), default='focused')
    parser.add_argument('--research-source', choices=SOURCES, default=None, help='Explicit override; otherwise inherit project research_source or auto')
    parser.add_argument('--lesson-images', choices=('attach','text-only'), default='attach', help='Text-only is an explicit evidence-delivery experiment, not full visual inspection')
    parser.add_argument('--evidence', type=Path, help='Ordered path/role records; paths resolve inside this manifest directory')
    parser.add_argument('--revision-source', type=Path, help='Freeze an existing UTF-8 source and request exact model edits instead of a full-file response')
    parser.add_argument('--revision-mode', choices=('exact','blocks'), default='exact')
    parser.add_argument('--revision-blocks', nargs='+', help='Limit block revision to existing inline IDs such as style-0')
    args = parser.parse_args()
    try:
        record = prepare(args.stage, json.loads(args.project.read_text(encoding='utf-8')), args.task.read_text(encoding='utf-8'), args.out,
                         profile=args.profile, research_source=args.research_source,
                         evidence=json.loads(args.evidence.read_text(encoding='utf-8')) if args.evidence else None,
                         evidence_root=args.evidence.parent if args.evidence else None, lesson_images=args.lesson_images, revision_source=args.revision_source,
                         revision_mode=args.revision_mode, revision_blocks=args.revision_blocks)
        print(json.dumps({'out':str(args.out.resolve()), 'images':len(record['images']), 'status':record['status']}))
    except (ValueError, OSError, TypeError, KeyError) as error:
        parser.exit(1, str(error) + '\n')
