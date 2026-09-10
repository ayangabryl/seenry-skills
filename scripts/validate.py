"""Validate installable skills and example calls; no network or library mutations."""
import json,re,hashlib
from pathlib import Path
import yaml
from jsonschema import Draft202012Validator
root=Path(__file__).resolve().parents[1]
contract=json.loads((root/'skills/seenry/references/mcp-tools.json').read_text(encoding='utf-8'))
tools={t['name']:t for t in contract['tools']}
for tool in tools.values():Draft202012Validator.check_schema(tool['inputSchema'])
skills={}
for entry in sorted((root/'skills').glob('*/SKILL.md')):
    text=entry.read_text(encoding='utf-8');parts=text.split('---',2)
    assert len(parts)==3 and not parts[0].strip(),f'{entry}: missing frontmatter'
    meta=yaml.safe_load(parts[1]);name=entry.parent.name
    assert meta['name']==name and re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*',name)
    assert len(name)<=64 and 1<=len(meta['description'])<=1024
    ui=yaml.safe_load((entry.parent/'agents/openai.yaml').read_text(encoding='utf-8'))
    assert not ui.get('dependencies', {}).get('tools'), f'{entry}: core skills must work without mandatory MCP tools'
    for path in re.findall(r'\]\(([^)#]+)',parts[2]):
        if not re.match(r'https?://',path):assert (entry.parent/path).is_file(),f'Missing reference: {entry} -> {path}'
    skills[name]=meta
assert json.loads((root/'.mcp.json').read_text(encoding='utf-8'))['mcpServers']['web-atlas']['url']==contract['endpoint']
cases=json.loads((root/'evals/scenarios.json').read_text(encoding='utf-8'));calls=0
for case in cases:
    assert all(name in skills for name in case['skills'])
    assert case['request'] and case['check']
    for call in case['calls']:
        assert call['name'] in tools
        Draft202012Validator(tools[call['name']]['inputSchema']).validate(call['arguments']);calls+=1
print(f'Validated {len(skills)} skills, {len(tools)} tool schemas and {calls} example calls in {len(cases)} scenarios.')

# Follow references in supporting documents too, not just entrypoint links.
for doc in (root / 'skills').rglob('*.md'):
    for link in re.findall(r'\]\(([^)#]+)', doc.read_text(encoding='utf-8')):
        if not re.match(r'https?://', link):
            assert (doc.parent / link).is_file(), f'Missing reference: {doc} -> {link}'
manifest_path = root / 'skills/seenry-motion/assets/morphicons/manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
for item in manifest['files']:
    assert hashlib.sha256((manifest_path.parent / item['file']).read_bytes()).hexdigest() == item['sha256'], item['file']
print('Supporting links and bundled Morphicons source hashes verified.')
