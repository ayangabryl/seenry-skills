"""Bounded, local-only video evidence. Requires ffmpeg/ffprobe; Python stdlib only."""
import argparse
import hashlib
import html
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlsplit

FORMATS = 'mov,matroska,webm,avi,gif'
LIMITS = [
    'Encoded cadence and decoded images do not establish original capture fidelity or browser performance.',
    'Distinct PNG hashes describe these scaled samples, not unique captured states or perceptual differences.',
    'Frame selection is not normal-speed playback review; inspect continuity in the original clip.',
    'No script output establishes easing, event handlers, keyboard behavior, or interruption recovery.',
]


def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()


def number(value, name):
    try:
        result = float(value)
    except (TypeError, ValueError):
        raise ValueError(f'{name} must be a finite number') from None
    if not math.isfinite(result):
        raise ValueError(f'{name} must be a finite number')
    return result


def local_video(value):
    if '://' in str(value):
        raise ValueError('Supply a local video file, not a URL')
    path = Path(value).expanduser().resolve()
    if not path.is_file() or path.suffix.lower() not in {'.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi', '.gif'}:
        raise ValueError('Supply an existing local MP4, MOV, WebM, MKV, AVI, or GIF')
    if path.stat().st_size > 1024 ** 3:
        raise ValueError('Use a local clip smaller than 1 GiB')
    return path


def source_reference(value):
    if value is None:
        return None
    if re.fullmatch(r'seenry:[A-Za-z0-9._:/-]{1,160}', value):
        return value
    parts = urlsplit(value)
    if (parts.scheme not in ('https', 'http') or not parts.hostname or parts.username is not None
            or parts.password is not None or parts.query or parts.fragment
            or any(ord(c) < 33 for c in value)):
        raise ValueError('Use a public source-page URL without credentials, query, or fragment, or seenry:ID')
    return value


def run(command, timeout=30):
    if not shutil.which(command[0]):
        raise ValueError(f'{command[0]} is unavailable; install it or use an existing video player')
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise ValueError('Media processing exceeded 30 seconds; use a shorter local clip') from None
    if result.returncode:
        # Container tags, signed URLs, and private paths can occur in tool stderr.
        raise ValueError(f'{command[0]} could not process this local clip; raw media diagnostics were withheld')
    return result


def inspect_video(video, source=None):
    path = local_video(video)
    provenance = source_reference(source)
    result = run(['ffprobe', '-v', 'error', '-protocol_whitelist', 'file', '-format_whitelist', FORMATS,
                  '-select_streams', 'v:0', '-show_entries',
                  'stream=codec_name,width,height,start_time,duration,avg_frame_rate,r_frame_rate,time_base,nb_frames:format=start_time,duration',
                  '-of', 'json', str(path)])
    data = json.loads(result.stdout)
    if not data.get('streams'):
        raise ValueError('The clip has no readable video stream')
    stream = data['streams'][0]
    container = data.get('format', {})
    return {'schema': 1, 'source': {'file': path.name, 'bytes': path.stat().st_size,
                                  'sha256': digest(path), 'reference': provenance},
            'video': stream, 'container': container, 'limits': list(LIMITS)}


def selection(times=None, every_frame=False, start=None, end=None, max_frames=24):
    if not isinstance(max_frames, int) or not 1 <= max_frames <= 96:
        raise ValueError('max-frames must be 1–96 (default 24)')
    if every_frame:
        if times is not None or start is None or end is None:
            raise ValueError('Every-frame mode requires start and end, without times')
        start, end = number(start, 'start'), number(end, 'end')
        if start < 0 or end <= start or end - start > 5:
            raise ValueError('Choose a positive every-frame interval no longer than 5 seconds')
        return {'mode': 'every-frame', 'start': start, 'end': end, 'max_frames': max_frames}
    if not times or start is not None or end is not None:
        raise ValueError('Choose explicit times, or every-frame with start and end')
    values = sorted(set(number(t, 'timestamp') for t in times))
    if values[0] < 0 or len(values) > max_frames or values[-1] - values[0] > 30:
        raise ValueError('Choose at most max-frames timestamps in a nonnegative 30-second interval')
    return {'mode': 'selected', 'times': values, 'start': values[0], 'end': values[-1], 'max_frames': max_frames}


def contact_sheet(report):
    cards = ''.join(f'<figure><button data-time="{f["media_time_seconds"]:.6f}">'
                    f'<img src="{f["file"]}" alt="Video frame at {f["relative_timestamp_seconds"]:.6f} seconds">'
                    f'</button><figcaption>{f["relative_timestamp_seconds"]:.6f} s'
                    f' · source PTS {f["source_pts_seconds"]:.6f}</figcaption></figure>' for f in report['frames'])
    source = report['source']
    return f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Local video study</title><style>body{{font:16px system-ui;max-width:1200px;margin:32px auto;padding:0 20px;background:#f5f5f3;color:#202020}}video{{width:100%;max-height:65vh;background:#111}}.frames{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}}figure{{margin:0}}button{{padding:0;border:0;background:none;cursor:pointer}}img{{width:100%;display:block}}figcaption,code{{font-size:12px;overflow-wrap:anywhere}}li{{margin-block:8px}}</style>
<h1>Local video study</h1><p>{html.escape(source['file'])} · {html.escape(source['reference'] or 'Supplied local clip')}</p>
<p>SHA-256: <code>{source['sha256']}</code></p>
<p>Open the original file below to review at normal speed. Frames use actual presentation timestamps relative to the first video stream’s declared start. Click a frame to seek; a browser seek is a playback aid, not frame-accurate evidence.</p>
<input id="choose" type="file" accept="video/*,image/gif" aria-label="Open original video locally"><p id="status">No playback has been reviewed by this tool.</p><video id="clip" controls preload="metadata"></video>
<h2>Extracted frames</h2><div class="frames">{cards}</div><h2>Evidence limits</h2><ul>{''.join('<li>'+html.escape(x)+'</li>' for x in report['limits'])}</ul>
<script>const clip=document.getElementById('clip');let objectURL;document.getElementById('choose').onchange=async e=>{{const file=e.target.files[0];if(!file)return;const status=document.getElementById('status');status.textContent='Checking local source hash…';if(file.size!=={source['bytes']}){{status.textContent='File size differs from the evidence source.';return}}if(!crypto.subtle){{status.textContent='Hash verification unavailable; open the original in your video player.';return}}const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join('');if(hash!=='{source['sha256']}'){{status.textContent='File hash differs from the evidence source.';return}}if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(file);clip.src=objectURL;clip.playbackRate=1;status.textContent='Source hash verified locally. Play at 1× and record your own observations.'}};document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>{{if(clip.src){{clip.pause();clip.currentTime=Number(b.dataset.time)}}}});</script></html>'''


def extract_video(video, output, *, source=None, times=None, every_frame=False, start=None, end=None, max_frames=24, width=640):
    plan = selection(times, every_frame, start, end, max_frames)
    if not isinstance(width, int) or not 160 <= width <= 1280:
        raise ValueError('width must be 160–1280 pixels')
    path = local_video(video)
    out = Path(output).expanduser().resolve()
    if out.exists():
        raise ValueError('Output already exists; choose a new study directory')
    report = inspect_video(path, source)
    origin = number(report['video'].get('start_time', 0), 'video start')
    container_start = number(report['container'].get('start_time', 0), 'container start')
    seek = max(0, origin - container_start + plan['start'])
    if every_frame:
        expression = f'gte(t,{origin + plan["start"]:.9f})*lt(t,{origin + plan["end"]:.9f})'
    else:
        expression = '+'.join(f'(gte(t,{origin + t:.9f})*(isnan(prev_selected_t)+lt(prev_selected_t,{origin + t:.9f})))' for t in plan['times'])
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.video-study-', dir=out.parent) as temporary:
        stage = Path(temporary)
        result = run(['ffmpeg', '-hide_banner', '-nostdin', '-loglevel', 'info', '-copyts',
                      '-protocol_whitelist', 'file', '-format_whitelist', FORMATS,
                      '-ss', f'{seek:.9f}', '-t', f'{plan["end"] - plan["start"] + 2:.9f}',
                      '-i', str(path), '-map', '0:v:0', '-an', '-sn', '-dn',
                      '-vf', f"select='{expression}',scale='min({width},iw)':-2,showinfo",
                      '-fps_mode', 'passthrough', '-frames:v', str(max_frames + 1),
                      str(stage / 'frame-%03d.png')])
        time_bases = re.findall(r'config in time_base:\s*(\d+)/(\d+)', result.stderr)
        if not time_bases or len(set(time_bases)) != 1:
            raise ValueError('The decoded timestamp time base is unavailable or changed')
        numerator, denominator = map(int, time_bases[0])
        stamps = [int(pts) for pts in re.findall(r'\bn:\s*\d+\s+pts:\s*(-?\d+)\s+pts_time:', result.stderr)]
        files = sorted(stage.glob('frame-*.png'))
        if len(files) > max_frames:
            raise ValueError('The interval exceeds max-frames; shorten it or explicitly raise the bound (maximum 96)')
        if not files or len(stamps) < len(files):
            raise ValueError('No timestamped frames were found in the selected interval')
        # showinfo can log a queued frame beyond the output limit; pair only emitted files.
        frames = [{'file': f.name, 'source_pts': stamps[i], 'time_base': f'{numerator}/{denominator}',
                   'source_pts_seconds': stamps[i] * numerator / denominator,
                   'relative_timestamp_seconds': round(stamps[i] * numerator / denominator - origin, 9),
                   'media_time_seconds': round(stamps[i] * numerator / denominator - container_start, 9),
                   'sha256': digest(f)} for i, f in enumerate(files)]
        if not every_frame:
            for t in plan['times']:
                frame = next((f for f in frames if f['relative_timestamp_seconds'] >= t - 1e-6), None)
                if frame is None:
                    raise ValueError('A requested timestamp has no following frame within the bounded clip window')
                frame.setdefault('requested_times_seconds', []).append(t)
        if digest(path) != report['source']['sha256']:
            raise ValueError('The source changed during extraction; retry with a stable local copy')
        report.update(selection=plan, frames=frames, distinct_sample_image_hashes=len({f['sha256'] for f in frames}),
                      playback_reviewed=False, output_width_limit=width,
                      timestamp_basis='Source presentation time; relative times subtract the video stream start_time.')
        report['limits'].append('Selected times use the first decoded frame at or after each request; several requests can share a frame. Every-frame intervals include start and exclude end. Selection searches at most two seconds beyond the final request.')
        (stage / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
        (stage / 'contact-sheet.html').write_text(contact_sheet(report), encoding='utf-8')
        stage.rename(out)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    for name in ('inspect', 'extract'):
        command = commands.add_parser(name)
        command.add_argument('video')
        command.add_argument('--source', help='Public source-page URL without secrets, or seenry:ID; never fetched')
        if name == 'extract':
            command.add_argument('--out', required=True)
            choice = command.add_mutually_exclusive_group(required=True)
            choice.add_argument('--times', nargs='+', type=float)
            choice.add_argument('--every-frame', action='store_true')
            command.add_argument('--start', type=float)
            command.add_argument('--end', type=float)
            command.add_argument('--max-frames', type=int, default=24)
            command.add_argument('--width', type=int, default=640)
    args = vars(parser.parse_args())
    command = args.pop('command')
    try:
        if command == 'inspect':
            result = inspect_video(**args)
        else:
            args['output'] = args.pop('out')
            result = extract_video(**args)
        print(json.dumps(result, indent=2))
    except (ValueError, OSError, json.JSONDecodeError) as error:
        # Avoid leaking raw local paths from OS exceptions.
        parser.exit(2, f'video_frames: {error if isinstance(error, ValueError) else "Local file operation failed"}\n')


if __name__ == '__main__':
    main()
