"""Classic Cuts editor: turns a public-domain film + an edit plan into a vertical "edit" Short.

  ~/.faceless-shorts/venv/bin/python -I edit.py <project_dir>            (reads <project_dir>/plan.json)

Format (learned from edit channels, built from our own parts): top white banner with a quote → cold-open dialogue from
the film with glowing word captions → the drop of our own synthesized track (music.py) → beat-cut montage with grade,
slow motion, flashes, shake and punch-ins → a dictionary-card ending → loop. Writes renders/<slug>.mp4,
renders/cover.jpg, review/all.jpg (2 frames/s) and edit.json (timings).

plan.json:
{
 "film": "~/shorts-studio/references/pd-films/<film>/film.mp4", "film_title": "All Quiet on the Western Front (1930)",
 "banner": "THEY CALLED IT GLORY", "banner2": "WHAT PAUL SAW:",              (banner2 optional, shown from the drop)
 "dialogue": [{"in": 399.6, "out": 404.8, "x": 0.5, "text": "line from the subtitles", "fx": "flash", "mute": false}],   (mute: silent films)
 "montage":  [{"in": 2950.0, "beats": 1, "x": 0.5, "speed": 0.5, "fx": "flash|shake|punch|push|rgb"}],   beats sum = drop_bars*4
 "ending":   {"in": 7840.0, "x": 0.5, "speed": 0.6, "card": {"word": "glory", "say": "/ˈɡlɔː.ri/", "pos": "noun",
              "def": "our own definition, never a dictionary's text"}},
 "music": {"key": "D", "mood": "dark", "seed": 7, "drop_bars": 6, "outro_bars": 2},
 "grade": "war|noir|warm", "watermark": "<OPTIONAL CHANNEL NAME>", "crop": "auto"
}
x = horizontal position of the 9:16 window inside the film frame (0 left, 0.5 centre, 1 right).
"""
import json, os, re, subprocess, sys, tempfile
from pathlib import Path

HOME = Path.home(); ED = Path(__file__).resolve().parent
FF = str(HOME / '.local/bin/ffmpeg'); FP = str(HOME / '.local/bin/ffprobe'); PY = sys.executable
W, H, FPS = 1080, 1920, 30
# Phone safe zone (owner, 2026-11-12): on iPhones the top ~280 px sit under the status bar, the Dynamic Island and
# YouTube's search/camera icons, so the banner strip floats at y 300-428 instead of touching the top edge.
BANNER_Y = 300
COLORS = ['2D2DFF', '00D4FF', 'FFE12D', '7A5CFF']            # ASS BGR: red, yellow, cyan, pink-red
GRADES = {
    'war':  'eq=contrast=1.30:brightness=-0.02:saturation=0,colorbalance=rs=-0.07:bs=0.11:rm=-0.02:bm=0.05:rh=0.10:gh=0.04:bh=-0.07',
    'noir': 'eq=contrast=1.38:brightness=-0.04:saturation=0,colorbalance=rs=-0.03:bs=0.05:rh=0.03:bh=-0.02',
    'warm': 'eq=contrast=1.22:brightness=-0.01:saturation=0.9,colorbalance=rs=0.05:bs=-0.06:rh=0.08:bh=-0.08',
}

def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode: sys.exit(f'command failed: {" ".join(map(str, cmd))[:300]}\n{r.stderr[-1500:]}')
    return r.stdout

def probe(p):
    j = json.loads(run([FP, '-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', str(p)]))
    v = [s for s in j['streams'] if s['codec_type'] == 'video'][0]; return float(j['format']['duration']), v['width'], v['height']

def seg_filter(dur, speed, x, fx, grade, sw, sh):
    # cheap work at the film's own size (crop, slow motion, grade, glow), then upscale once, then camera + grain
    cw = int(sh * 9 / 16) // 2 * 2; cx = int((sw - cw) * min(max(x, 0), 1)) // 2 * 2
    pre = [f'crop={cw}:{sh}:{cx}:0', 'setsar=1']
    if abs(speed - 1) > 0.01: pre.append(f'setpts=PTS/{speed}')
    pre.append('minterpolate=fps=30:mi_mode=blend' if speed < 0.95 else f'fps={FPS}')
    pre.append(GRADES.get(grade, GRADES['war']))
    f = [f'scale={W}:{H}:flags=lanczos']
    n = max(1, int(round(dur * FPS)))
    if fx == 'punch':
        f.append(f"zoompan=z='if(lt(on,7),1.2-0.2*on/7,1+0.03*(on-7)/{n})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS}")
    else:
        amt = 0.09 if fx == 'push' else 0.05
        f.append(f"zoompan=z='1+{amt}*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS}")
    if fx == 'shake':
        f += ["crop=1000:1778:x='40+30*sin(n*1.9)*exp(-t*4)':y='71+30*cos(n*2.7)*exp(-t*4)'", f'scale={W}:{H}']
    if fx == 'rgb': f.append('rgbashift=rh=-7:bh=7:rv=2:bv=-2')
    f += ['vignette=angle=PI/4.3', 'noise=alls=8:allf=t+u']
    if fx == 'flash': f.append('fade=t=in:st=0:d=0.22:color=white')
    f.append(f'trim=duration={dur:.4f},setpts=PTS-STARTPTS,format=yuv420p')
    return (f"[0:v]{','.join(pre)},split[a][b];[b]gblur=sigma=8[bl];[a][bl]blend=all_mode=screen:all_opacity=0.20,"
            f"{','.join(f)}[v]")

def render_seg(film, sw, sh, t_in, dur, speed, x, fx, grade, out):
    src = dur * speed + 0.4
    run([FF, '-v', 'error', '-y', '-ss', f'{t_in:.3f}', '-t', f'{src:.3f}', '-i', film, '-filter_complex',
         seg_filter(dur, speed, x, fx, grade, sw, sh), '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'veryfast',
         '-crf', '16', '-r', str(FPS), out])
    d, _, _ = probe(out)
    if abs(d - dur) > 0.06: print(f'  note: segment {Path(out).name} is {d:.3f}s, wanted {dur:.3f}s')

def ass_time(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f'{h}:{m:02d}:{s:05.2f}'

def esc(s): return s.replace('\\', '').replace('{', '(').replace('}', ')')

def words_for(wavs, texts, spans):
    """Per clip: the subtitle's words (exact text) on Whisper's timing. Words Whisper missed or misheard are aligned with
    difflib and interpolated between their neighbours; no subtitle text → Whisper's own words."""
    import difflib
    from faster_whisper import WhisperModel
    m = WhisperModel('small.en', device='cpu', compute_type='int8'); out = []
    norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
    for wav, text, (a0, z0) in zip(wavs, texts, spans):
        segs, _ = m.transcribe(str(wav), word_timestamps=True, vad_filter=False, initial_prompt=text or None)
        ws = [(w.start, w.end, w.word.strip()) for s in segs for w in (s.words or []) if w.word.strip()]
        toks = (text or '').split()
        if not toks: out += [(a0 + s, a0 + e, w) for s, e, w in ws]; continue
        tm = [None] * len(toks)
        sm = difflib.SequenceMatcher(a=[norm(t) for t in toks], b=[norm(w[2]) for w in ws], autojunk=False)
        for blk in sm.get_matching_blocks():
            for k in range(blk.size): tm[blk.a + k] = (ws[blk.b + k][0], ws[blk.b + k][1])
        dur = z0 - a0
        for i in range(len(toks)):           # fill gaps by interpolation between known neighbours
            if tm[i] is None:
                p = next((tm[j][1] for j in range(i - 1, -1, -1) if tm[j]), 0.0)
                nx = next(((j, tm[j][0]) for j in range(i + 1, len(toks)) if tm[j]), (len(toks), dur))
                gap = (nx[1] - p) / (nx[0] - i + 1); tm[i] = (p, p + gap)
        out += [(a0 + s, a0 + e, t) for (s, e), t in zip(tm, toks)]
    return out

def chunks(ws, maxw=3, maxc=16):
    out, cur = [], []
    for w in ws:
        if cur and (len(cur) >= maxw or len(' '.join(x[2] for x in cur + [w])) > maxc or w[0] - cur[-1][1] > 0.5):
            out.append(cur); cur = []
        cur.append(w)
        if re.search(r'[.!?,;]$', w[2]): out.append(cur); cur = []
    if cur: out.append(cur)
    return out

def build_ass(path, plan, words, D, drop_end, end, total):
    hdr = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
ScaledBorderAndShadow: yes
WrapStyle: 1

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Banner,Arial Black,50,&H00000000,&H00000000,&H00FFFFFF,&H00FFFFFF,0,0,0,0,100,100,1,0,1,0,0,8,40,40,{BANNER_Y + 34},1
Style: Glow,Arial Black,80,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,1,0,1,3,0,5,60,60,0,1
Style: Mark,Arial Black,30,&H90FFFFFF,&H90FFFFFF,&HC0000000,&H00000000,0,0,0,0,100,100,3,0,1,1,0,2,0,0,300,1
Style: Word,Georgia,118,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,7,90,90,0,1
Style: Small,Georgia,46,&H00D8D8D8,&H00D8D8D8,&H00000000,&H00000000,0,1,0,0,100,100,0,0,1,0,0,7,90,90,0,1
Style: Def,Georgia,54,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,90,90,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    b1_end = D if plan.get('banner2') else end
    ev.append(f"Dialogue: 5,{ass_time(0)},{ass_time(b1_end)},Banner,,0,0,0,,{esc(plan['banner'].upper())}")
    if plan.get('banner2'):
        ev.append(f"Dialogue: 5,{ass_time(D)},{ass_time(end)},Banner,,0,0,0,,{esc(plan['banner2'].upper())}")
    for i, ch in enumerate(chunks(words)):
        a = ch[0][0]; z = ch[-1][1] + 0.12
        if a >= D: break
        z = min(z, D); col = COLORS[i % len(COLORS)]; txt = esc(' '.join(w[2] for w in ch).upper())
        pos = f'\\pos({W // 2},{int(H * 0.64)})'
        ev.append(f"Dialogue: 1,{ass_time(a)},{ass_time(z)},Glow,,0,0,0,,{{{pos}\\blur14\\bord12\\3c&H{col}&\\1c&H{col}&\\1a&H70&\\3a&H40&\\fad(60,60)}}{txt}")
        ev.append(f"Dialogue: 2,{ass_time(a)},{ass_time(z)},Glow,,0,0,0,,{{{pos}\\bord3\\3c&H000000&\\1c&H{col}&\\fscx112\\fscy112\\t(0,120,\\fscx100\\fscy100)\\fad(60,60)}}{txt}")
    if plan.get('watermark'):
        ev.append(f"Dialogue: 3,{ass_time(0)},{ass_time(total)},Mark,,0,0,0,,{esc(plan['watermark'].upper())}")
    card = (plan.get('ending') or {}).get('card')
    if card:
        t0 = drop_end + 0.35; fade = '\\fad(700,0)'
        ev.append(f"Dialogue: 6,{ass_time(drop_end)},{ass_time(total)},Def,,0,0,0,,{{\\p1\\an7\\pos(0,0)\\1c&H000000&\\1a&H78&\\bord0{fade}}}m 0 0 l {W} 0 {W} {H} 0 {H}{{\\p0}}")
        y = int(H * 0.36)
        ev.append(f"Dialogue: 7,{ass_time(t0)},{ass_time(total)},Word,,0,0,0,,{{\\pos(90,{y}){fade}}}{esc(card['word'])}")
        meta = '  '.join(x for x in (card.get('say', ''), card.get('pos', '')) if x)
        ev.append(f"Dialogue: 7,{ass_time(t0 + 0.4)},{ass_time(total)},Small,,0,0,0,,{{\\pos(94,{y + 150}){fade}}}{esc(meta)}")
        ev.append(f"Dialogue: 7,{ass_time(t0 + 0.4)},{ass_time(total)},Def,,0,0,0,,{{\\pos(94,{y + 222})\\c&HB0B0B0&{fade}}}{'─' * 14}")
        # wrap the definition at ~30 characters a line
        lines, cur = [], ''
        for w in card['def'].split():
            if len(cur) + len(w) + 1 > 30 and cur: lines.append(cur); cur = w
            else: cur = (cur + ' ' + w).strip()
        if cur: lines.append(cur)
        for k, ln in enumerate(lines):
            ev.append(f"Dialogue: 7,{ass_time(t0 + 1.0 + 0.25 * k)},{ass_time(total)},Def,,0,0,0,,{{\\pos(94,{y + 300 + 70 * k}){fade}}}{esc(ln)}")
        if card.get('ask'):   # the comment question (edits have no narrator, so it's on screen)
            ay = y + 300 + 70 * len(lines) + 70; aw, acur, alines = card['ask'].split(), '', []
            for w in aw:
                if len(acur) + len(w) + 1 > 28 and acur: alines.append(acur); acur = w
                else: acur = (acur + ' ' + w).strip()
            if acur: alines.append(acur)
            for k, ln in enumerate(alines):
                ev.append(f"Dialogue: 8,{ass_time(t0 + 2.2)},{ass_time(total)},Def,,0,0,0,,{{\\pos(94,{ay + 66 * k})\\b1\\c&H00D4FF&{fade}}}{esc(ln)}")
    Path(path).write_text(hdr + '\n'.join(ev) + '\n', encoding='utf-8')

def main():
    P = Path(sys.argv[1]).expanduser().resolve(); plan = json.loads((P / 'plan.json').read_text())
    slug = P.name; film = str(Path(plan['film']).expanduser()); grade = plan.get('grade', 'war')
    fdur, sw, sh = probe(film)
    tmp = Path(tempfile.mkdtemp(prefix='edit-', dir=P)); (P / 'renders').mkdir(exist_ok=True); (P / 'review').mkdir(exist_ok=True)
    # 1) dialogue cold open: video segments + one dialogue wav
    dl = plan['dialogue']; segs = []; spans = []; t = 0.0; wavs = []
    for i, c in enumerate(dl):
        d = c['out'] - c['in']; seg = tmp / f'd{i}.mp4'
        render_seg(film, sw, sh, c['in'], d, 1.0, c.get('x', 0.5), c.get('fx', 'zoom'), grade, str(seg)); segs.append(seg)
        wv = tmp / f'd{i}.wav'
        if c.get('mute'):   # silent film: no transfer audio (its score may be new and copyrighted); captions from `text`
            run([FF, '-v', 'error', '-y', '-f', 'lavfi', '-t', f'{d:.3f}', '-i', 'anullsrc=r=44100:cl=stereo', str(wv)])
        else:
            run([FF, '-v', 'error', '-y', '-ss', f"{c['in']:.3f}", '-t', f'{d:.3f}', '-i', film, '-vn', '-ac', '2', '-ar', '44100',
                 '-af', 'highpass=f=90,lowpass=f=7500,afftdn=nf=-25', str(wv)])
        wavs.append(wv)
        spans.append((t, t + d)); t += d
    D = t
    lst = tmp / 'dl.txt'; lst.write_text(''.join(f"file '{w}'\n" for w in wavs))
    run([FF, '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(tmp / 'dialogue.wav')])
    # 2) music with the drop exactly at the end of the dialogue
    mu = plan.get('music', {}); mwav = tmp / 'music.wav'
    out = run([PY, '-I', str(ED / 'music.py'), str(mwav), '--intro', f'{D:.4f}', '--drop-bars', str(mu.get('drop_bars', 6)),
               '--outro-bars', str(mu.get('outro_bars', 2)), '--key', mu.get('key', 'D'), '--mood', mu.get('mood', 'dark'),
               '--seed', str(mu.get('seed', 7))])
    meta = json.loads((Path(str(mwav) + '.json')).read_text()); beat = meta['beat']; drop, drop_end, end = meta['drop'], meta['drop_end'], meta['end']
    # 3) montage on the beat grid + 4) the ending shot under the card (to the end of the music tail), 4 at a time
    from concurrent.futures import ThreadPoolExecutor
    mont = plan['montage']; need = round((drop_end - drop) / beat); have = sum(m.get('beats', 1) for m in mont)
    if have != need: sys.exit(f'montage beats = {have}, the drop section needs {need} (drop_bars x 4)')
    e = plan['ending']; total = end + 1.2; ed = total - drop_end
    jobs = [(m['in'], m.get('beats', 1) * beat, m.get('speed', 1.0), m.get('x', 0.5), m.get('fx', 'push'), tmp / f'm{i:02d}.mp4')
            for i, m in enumerate(mont)] + [(e['in'], ed, e.get('speed', 0.6), e.get('x', 0.5), e.get('fx', 'push'), tmp / 'end.mp4')]
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(lambda j: render_seg(film, sw, sh, j[0], j[1], j[2], j[3], j[4], grade, str(j[5])), jobs))
    segs += [j[5] for j in jobs]
    vl = tmp / 'v.txt'; vl.write_text(''.join(f"file '{s}'\n" for s in segs))
    run([FF, '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(vl), '-c', 'copy', str(tmp / 'video.mp4')])
    # 5) captions from the dialogue audio
    words = words_for(wavs, [c.get('text', '') for c in dl], spans)
    ass = tmp / 'edit.ass'; build_ass(ass, plan, words, D, drop_end, end, total)
    # 6) audio: dialogue up front, music under it (quiet), full music from the drop; master -12 LUFS
    afc = (f"[1:a]volume=1.6,apad=whole_dur={total:.3f}[dl];"
           f"[2:a]atrim=0:{total:.3f},volume='if(lt(t,{D:.3f}),0.30,1.0)':eval=frame,afade=t=out:st={total - 1.6:.3f}:d=1.5[mu];"
           f"[dl][mu]amix=inputs=2:normalize=0,loudnorm=I=-12:TP=-1.5:LRA=11,alimiter=limit=0.78:level=disabled[a]")
    vf = f"[0:v]drawbox=x=0:y={BANNER_Y}:w=iw:h=128:color=white@1:t=fill,subtitles='{ass}':fontsdir='{ED / 'fonts'}'[v]"
    final = P / 'renders' / f'{slug}.mp4'
    run([FF, '-v', 'error', '-y', '-i', str(tmp / 'video.mp4'), '-i', str(tmp / 'dialogue.wav'), '-i', str(mwav),
         '-filter_complex', vf + ';' + afc, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
         '-pix_fmt', 'yuv420p', '-r', str(FPS), '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-movflags', '+faststart',
         '-t', f'{total:.3f}', str(final)])
    # 7) cover + review sheet + timings
    run([FF, '-v', 'error', '-y', '-ss', f'{drop + 0.25:.3f}', '-i', str(final), '-frames:v', '1', '-q:v', '2', str(P / 'renders' / 'cover.jpg')])
    run([FF, '-v', 'error', '-y', '-i', str(final), '-vf', 'fps=2,scale=180:-2,tile=12x9:padding=3', '-frames:v', '1', '-q:v', '3', str(P / 'review' / 'all.jpg')])
    info = {'slug': slug, 'dialogue_s': round(D, 3), 'drop': drop, 'drop_end': drop_end, 'end': end, 'total': round(total, 3),
            'bpm': meta['bpm'], 'beat': beat, 'cuts': len(segs) - 1, 'words': [[round(a, 2), round(z, 2), w] for a, z, w in words]}
    (P / 'edit.json').write_text(json.dumps(info, indent=1))
    (tmp / 'video.mp4').replace(P / 'renders' / 'clean.mp4')   # overlay-free picture for thumb.py
    if not os.environ.get('KEEP_TMP'):
        for f in tmp.iterdir(): f.unlink()
        tmp.rmdir()
    print(json.dumps({k: v for k, v in info.items() if k != 'words'}))
    print('captions:', ' | '.join(w for _, _, w in words))

if __name__ == '__main__':
    main()
