"""Run one diagnostic Flash task through installed AGY with real host tools.

Preserves prompts, frozen skills, events and failures. Does not certify the result.
"""
import argparse
import hashlib
import json
import shutil
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', type=Path, required=True)
    parser.add_argument('--model', default='gemini-3.8-flash-high')
    parser.add_argument('--brief', default='Create a fresh, high-quality website for a design studio.')
    parser.add_argument('--timeout', type=int, default=1200)
    parser.add_argument('--assets', type=Path)
    parser.add_argument('--playwright', type=Path)
    args = parser.parse_args(); root = args.run.resolve()
    if root.exists(): parser.error('Preserve previous runs; choose a new directory')
    if not 60 <= args.timeout <= 2400: parser.error('Use a 60–2400 second bound')
    exe = shutil.which('agy')
    if not exe: parser.error('AGY is unavailable; no substitute model was used')
    root.mkdir(parents=True)
    shutil.copytree(ROOT/'skills',root/'frozen',ignore=shutil.ignore_patterns('__pycache__'))
    if args.assets: shutil.copytree(args.assets,root/'assets')
    resource_hashes = {p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()}
    prompt = f'''User request: {args.brief}
Use Seenry at {root}/frozen/seenry/SKILL.md and its sibling support. This is a new fictional sample; no real clients, awards, metrics, location or business performance are supplied. Invented work must be truthfully self-initiated. Do not let the implementation stack invent the studio's service or niche. Choose a useful truthful contact path; no backend is supplied.
Work inside {root}. You may use available native tools for public research, source/item checks, actual images, commands, file editing, rendering and inspection. No MCP is required; this diagnostic uses the ordinary-web route. No image generation and no other design skills. The host has not provided a visual direction or stronger-model critique.
Read the execution guide. Make project.json with media=undecided or needed and motion=signature or undecided, scope=website, research_source=web and your configured model. Use focused packet.py stages with --project. Record product facts separately from proposals.
Plan before product code. Save DESIGN.md and three distinct concept records; generate actual small wireframes for all three, render and inspect them. Refine real type and image crop/motion proofs before selecting. Preserve the actual files and screenshots in construction/. Use workflow.py in a separate evidence-run/ directory if practical; otherwise retain explicit stage timestamps and hashes and report that the coordinator was not used. A retrospective grid overlay is not construction history.
Use real relevant temporary imagery or original concept artwork when needed, with asset-manifest.json and exact sources. The bundled asset helper can search Met public-domain art without a key; it is only one optional source and does not prescribe the studio subject. Available assets/ contains permitted fonts/icon/motion libraries if supplied. Build a convincing whole-page sequence rather than a grid of implementation diagrams. Implement one subject-relevant interaction with keyboard/touch and reduced-motion behavior.
Finish at site/index.html with relative local assets where permitted. You can start a local server and use available browser tools. Playwright module if available: {str(args.playwright) if args.playwright else 'project-installed playwright'}. The included browser_evidence.mjs captures viewports and scripted interactions; add actual business-result assertions. Watch normal-speed motion if supported and label it unverified otherwise. Review the opening and whole page; a functional pass is not visual acceptance. One reset and two repair passes maximum.
Save verification.json with actual checks, provenance, missing evidence and status. Do not claim user acceptance or superiority. Preserve failures. Complete the site within {args.timeout} seconds; report incomplete work accurately. No external publishing, messages, installs outside this workspace, or changes to global configuration. Return the output path and actual result at the end. Do not ask for a planning approval already covered by this request.
'''
    (root/'prompt.txt').write_text(prompt,encoding='utf-8')
    metadata={'schema':1,'requested_model':args.model,'brief':args.brief,'started':time.time(),'timeout':args.timeout,
              'kind':'diagnostic tool-enabled run, not matched causal benchmark','resources':resource_hashes,
              'assistance':{'host':'Skill/tool development, factual constraints and available asset/runtime setup','image_generation':False,'stronger_model_design_corrections':False},
              'ambient_limit':'New AGY project requested; serving identity and hidden ambient context not independently attested.'}
    args_list=[exe,'--new-project','--model',args.model,'--mode','accept-edits','--disable-slash-commands','--output-format','stream-json','--print-timeout',f'{args.timeout}s','--print',prompt]
    with (root/'events.ndjson').open('w') as stdout,(root/'stderr.txt').open('w') as stderr:
        process=subprocess.Popen(args_list,cwd=root,stdout=stdout,stderr=stderr,text=True)
        try:code=process.wait(timeout=args.timeout+20)
        except subprocess.TimeoutExpired:process.terminate();process.wait(timeout=10);code=124
    result={};init={}
    for line in (root/'events.ndjson').read_text(encoding='utf-8').splitlines():
        try:row=json.loads(line)
        except ValueError:continue
        if row.get('event')=='init':init=row.get('init',{})
        if row.get('event')=='result':result=row.get('result',{})
    metadata.update(exit_code=code,elapsed=time.time()-metadata['started'],runtime_configured_model=init.get('model'),
                    reported_model=result.get('model'),usage=result.get('usage'),provider_status=result.get('status'),
                    denied_actions=result.get('denied_actions',[]),output_exists=(root/'site/index.html').is_file(),
                    status='blocked-host-permission' if result.get('denied_actions') else ('needs-host-inspection' if (root/'site/index.html').is_file() else 'incomplete-no-artifact'))
    (root/'experiment.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
    (root/'result.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps({k:v for k,v in metadata.items() if k!='resources'},indent=2))


if __name__=='__main__':main()
