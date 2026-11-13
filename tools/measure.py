"""Measure a reference channel's shorts: numbers, not opinions. Private study only.

  ~/.faceless-shorts/venv/bin/python -I measure.py <channel_dir>        e.g. ~/shorts-studio/references/ricksclips

Reads <channel_dir>/vids/*.mp4 (+ .info.json from yt-dlp) and writes:
  measure/<id>.json        per-video numbers (look, camera, cuts, script, loudness)
  sheets/<id>_1s.jpg       one frame per second (whole video)          sheets/<id>_hook30.jpg  first 4 s at 30 fps
  transcripts/<id>.txt     Whisper transcript with word timings
  summary.json             channel medians + per-video table             summary.md  the same, readable
Camera motion = phase correlation between consecutive frames (whole frame for pan/tilt, left/right + top/bottom halves
for zoom), in px per frame at 720p width. A frame is "still" if pan < 0.5 px/f and zoom < 0.05 %/f.
"""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np

CH = Path(sys.argv[1]).expanduser()
OUT_M, OUT_S, OUT_T = CH / 'measure', CH / 'sheets', CH / 'transcripts'
for d in (OUT_M, OUT_S, OUT_T): d.mkdir(parents=True, exist_ok=True)
FF = str(Path('~/.local/bin/ffmpeg').expanduser()); FP = str(Path('~/.local/bin/ffprobe').expanduser())
GW, GH = 144, 256          # analysis size (vertical 9:16)
CW, CHh = 90, 160          # colour sample size
SCALE720 = 720 / GW

def probe(v):
    j = json.loads(subprocess.run([FP, '-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', str(v)], capture_output=True, text=True).stdout)
    vs = [s for s in j['streams'] if s['codec_type'] == 'video'][0]; n, d = vs['r_frame_rate'].split('/')
    return float(j['format']['duration']), float(n) / float(d), vs['width'], vs['height']

def frames(v, w, h, gray):
    pix = 'gray' if gray else 'rgb24'; ch = 1 if gray else 3
    raw = subprocess.run([FF, '-v', 'error', '-i', str(v), '-vf', f'scale={w}:{h}:flags=area', '-f', 'rawvideo', '-pix_fmt', pix, '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8); n = a.size // (w * h * ch)
    return a[:n * w * h * ch].reshape(n, h, w) if gray else a[:n * w * h * ch].reshape(n, h, w, 3)

WIN = np.outer(np.hanning(GH), np.hanning(GW)).astype(np.float32)
def pshift(a, b, win):
    A = np.fft.rfft2(a * win); B = np.fft.rfft2(b * win); R = A * np.conj(B); R /= np.abs(R) + 1e-9
    r = np.fft.irfft2(R, s=a.shape); i = np.argmax(r); dy, dx = np.unravel_index(i, r.shape); h, w = r.shape
    def sub(c, n, axis):   # parabolic sub-pixel refinement
        idx = [dy, dx]; vals = []
        for o in (-1, 0, 1): idx2 = list(idx); idx2[axis] = (c + o) % n; vals.append(r[tuple(idx2)])
        den = vals[0] - 2 * vals[1] + vals[2]; return c + (0.5 * (vals[0] - vals[2]) / den if abs(den) > 1e-9 else 0)
    fy, fx = sub(dy, h, 0), sub(dx, w, 1)
    if fy > h / 2: fy -= h
    if fx > w / 2: fx -= w
    return fx, fy, float(r.max())

def motion(g):
    g = g.astype(np.float32) / 255; n = len(g)
    hw, hh = GW // 2, GH // 2
    wl = np.outer(np.hanning(GH), np.hanning(hw)).astype(np.float32); wt = np.outer(np.hanning(hh), np.hanning(GW)).astype(np.float32)
    pan, zoom, conf = np.zeros(n), np.zeros(n), np.zeros(n)
    for i in range(1, n):
        a, b = g[i - 1], g[i]
        dx, dy, c = pshift(b, a, WIN); pan[i] = np.hypot(dx, dy) * SCALE720; conf[i] = c
        lx, _, _ = pshift(b[:, :hw], a[:, :hw], wl); rx, _, _ = pshift(b[:, hw:], a[:, hw:], wl)
        _, ty, _ = pshift(b[:hh], a[:hh], wt); _, by, _ = pshift(b[hh:], a[hh:], wt)
        zoom[i] = 100 * 0.5 * ((rx - lx) / (GW / 2) + (by - ty) / (GH / 2))   # % scale change per frame (+ = push in)
    # half-frame shifts are noisy during fast pans / parallax: drop implausible values, then a 5-frame median
    zoom[np.abs(zoom) > 3] = 0
    from scipy.ndimage import median_filter
    return pan, median_filter(zoom, size=5, mode='nearest'), conf

def cuts(g, fps):
    s = g[:, ::4, ::4].astype(np.float32) / 255; d = np.r_[0, np.abs(np.diff(s, axis=0)).mean(axis=(1, 2))]
    lum = g.mean(axis=(1, 2)) / 255; out, flashes = [], []
    for i in range(1, len(d)):
        lo = max(1, i - 8); ctx = np.median(np.r_[d[lo:i], d[i + 1:i + 9]]) if len(d) > 2 else 0
        if d[i] > max(0.11, 4 * ctx):
            if i + 6 < len(lum) and abs(lum[i + 5] - lum[i - 1]) < 0.04 and lum[i] - lum[i - 1] > 0.15: flashes.append(i / fps)
            elif not out or i / fps - out[-1] > 0.25: out.append(i / fps)
    return out, flashes, d

def look(rgb):
    x = rgb.astype(np.float32) / 255; r, g, b = x[..., 0], x[..., 1], x[..., 2]
    l = 0.299 * r + 0.587 * g + 0.114 * b; mx, mn = x.max(-1), x.min(-1); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    rg, yb = r - g, 0.5 * (r + g) - b; colorful = np.sqrt(rg.std((1, 2)) ** 2 + yb.std((1, 2)) ** 2) + 0.3 * np.sqrt(rg.mean((1, 2)) ** 2 + yb.mean((1, 2)) ** 2)
    gy, gx = np.abs(np.diff(l, axis=1))[:, :, :-1], np.abs(np.diff(l, axis=2))[:, :-1, :]; edge = (gx + gy) > 0.25
    ink = (l[:, :-1, :-1] < 0.12) & edge
    return dict(luma_mean=float(np.median(l.mean((1, 2)))), luma_std=float(np.median(l.std((1, 2)))), luma_p5=float(np.median(np.percentile(l, 5, axis=(1, 2)))),
                luma_p95=float(np.median(np.percentile(l, 95, axis=(1, 2)))), sat_mean=float(np.median(sat.mean((1, 2)))), colorfulness=float(np.median(colorful)),
                edge_density=float(np.median(edge.mean((1, 2)))), dark_ink_px=float(np.median(ink.mean((1, 2)))))

def palette(rgb, k=6, it=12):
    px = rgb.reshape(-1, 3)[:: max(1, rgb.reshape(-1, 3).shape[0] // 40000)].astype(np.float32)
    rng = np.random.default_rng(1); c = px[rng.choice(len(px), k, replace=False)]
    for _ in range(it):
        lab = np.argmin(((px[:, None] - c[None]) ** 2).sum(-1), 1)
        for j in range(k): c[j] = px[lab == j].mean(0) if np.any(lab == j) else c[j]
    cnt = np.bincount(lab, minlength=k); o = np.argsort(-cnt)
    return [{'hex': '#%02X%02X%02X' % tuple(int(v) for v in c[j]), 'share': round(float(cnt[j] / cnt.sum()), 3)} for j in o]

def loud(v):
    e = subprocess.run([FF, '-hide_banner', '-nostats', '-i', str(v), '-vn', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', e); return float(m[-1]) if m else None

_W = None
def transcript(v, vid):
    global _W
    from faster_whisper import WhisperModel
    if _W is None: _W = WhisperModel('small.en', device='cpu', compute_type='int8')
    raw = subprocess.run([FF, '-v', 'error', '-i', str(v), '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    segs, _ = _W.transcribe(np.frombuffer(raw, np.float32), word_timestamps=True, vad_filter=False)
    words = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
    text = ' '.join(w for w, _, _ in words)
    (OUT_T / f'{vid}.txt').write_text(text + '\n\n' + '\n'.join(f'{s:6.2f} {e:6.2f} {w}' for w, s, e in words))
    if not words: return dict(words=0)
    span = words[-1][2] - words[0][1]; gaps = [words[i][1] - words[i - 1][2] for i in range(1, len(words))]
    sents = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    return dict(words=len(words), wps=round(len(words) / max(span, 0.1), 2), first_word_at=round(words[0][1], 2), dead_air_s=round(sum(g for g in gaps if g > 0.25), 2),
                sentences=len(sents), median_sentence_words=float(np.median([len(s.split()) for s in sents])) if sents else 0,
                hook=sents[0] if sents else '', last_line=sents[-1] if sents else '', you_see=len(re.findall(r'\byou see\b', text, re.I)), questions=text.count('?'))

def sheets(v, vid, dur):
    cols = 10; rows = int(np.ceil(dur / cols))
    subprocess.run([FF, '-v', 'error', '-y', '-i', str(v), '-vf', f'fps=1,scale=144:-1,tile={cols}x{rows}:padding=3', '-frames:v', '1', '-q:v', '4', str(OUT_S / f'{vid}_1s.jpg')], check=True)
    subprocess.run([FF, '-v', 'error', '-y', '-t', '4', '-i', str(v), '-vf', 'scale=96:-1,tile=12x10:padding=2', '-frames:v', '1', '-q:v', '4', str(OUT_S / f'{vid}_hook30.jpg')], check=True)

rows = []
for v in sorted((CH / 'vids').glob('*.mp4')):
    vid = v.stem; info = {}
    ij = v.with_suffix('.info.json')
    if ij.exists():
        j = json.loads(ij.read_text()); info = {k: j.get(k) for k in ('title', 'view_count', 'like_count', 'upload_date', 'duration')}
    dur, fps, w, h = probe(v); g = frames(v, GW, GH, True); rgb = frames(v, CW, CHh, False)
    pan, zoom, conf = motion(g); cl, fl, _ = cuts(g, fps)
    for c in cl: i = int(c * fps); pan[max(0, i - 1):i + 2] = 0; zoom[max(0, i - 1):i + 2] = 0          # don't count cuts as motion
    still = (pan < 0.5) & (np.abs(zoom) < 0.05); moving = ~still
    m = dict(id=vid, **info, dur=round(dur, 2), fps=round(fps, 2), res=f'{w}x{h}', hard_cuts=len(cl), cut_times=[round(c, 2) for c in cl], flashes=len(fl),
             avg_shot_s=round(dur / (len(cl) + 1), 2), still_pct=round(100 * float(still.mean()), 1), push_in_pct=round(100 * float((zoom > 0.05).mean()), 1),
             pan_px_f_p50_moving=round(float(np.median(pan[moving])) if moving.any() else 0, 2), pan_px_f_p95=round(float(np.percentile(pan, 95)), 2),
             zoom_pct_f_p95=round(float(np.percentile(np.abs(zoom), 95)), 3), **look(rgb), palette=palette(rgb), lufs=loud(v))
    m.update(transcript(v, vid)); sheets(v, vid, dur)
    (OUT_M / f'{vid}.json').write_text(json.dumps(m, indent=1, ensure_ascii=False)); rows.append(m)
    print(f"{vid}  {dur:5.1f}s  cuts {len(cl):2d}  still {m['still_pct']:5.1f}%  push {m['push_in_pct']:5.1f}%  sat {m['sat_mean']:.2f}  luma {m['luma_mean']:.2f}  wps {m.get('wps', 0)}  | {m.get('hook', '')[:70]}", flush=True)

NUM = ['dur', 'hard_cuts', 'flashes', 'avg_shot_s', 'still_pct', 'push_in_pct', 'pan_px_f_p50_moving', 'pan_px_f_p95', 'zoom_pct_f_p95', 'luma_mean', 'luma_std', 'luma_p5', 'luma_p95',
       'sat_mean', 'colorfulness', 'edge_density', 'dark_ink_px', 'lufs', 'wps', 'first_word_at', 'dead_air_s', 'median_sentence_words', 'you_see', 'questions']
med = {k: round(float(np.median([r[k] for r in rows if r.get(k) is not None])), 3) for k in NUM if any(r.get(k) is not None for r in rows)}
(CH / 'summary.json').write_text(json.dumps({'channel': CH.name, 'videos': len(rows), 'median': med, 'rows': rows}, indent=1, ensure_ascii=False))
md = [f'# {CH.name}: measured ({len(rows)} shorts, private study)', '', '## Channel medians', ''] + [f'- {k}: {v}' for k, v in med.items()] + ['', '## Per video', '',
      '| id | views | dur | cuts | still% | push% | sat | luma | wps | hook |', '|---|---|---|---|---|---|---|---|---|---|']
md += [f"| {r['id']} | {(r.get('view_count') or 0) / 1e6:.1f}M | {r['dur']} | {r['hard_cuts']} | {r['still_pct']} | {r['push_in_pct']} | {r['sat_mean']:.2f} | {r['luma_mean']:.2f} | {r.get('wps', '')} | {r.get('hook', '')[:80]} |" for r in rows]
(CH / 'summary.md').write_text('\n'.join(md)); print('summary ->', CH / 'summary.md')
