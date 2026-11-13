"""Thumbnail for a Short (vertical 1080×1920 JPEG < 2 MB), built from the video's strongest frame + a short headline.

  python3 -I thumb.py <project_dir> <time_s> "<HEADLINE with *accent* words>" [--style dark|light|map|data] [--src file.mp4]

Learned from the 14 reference channels (references/_thumbs/, THUMBNAILS.md): Shorts thumbnails are frames, not posters.
What wins: ONE big subject (a face mid-reaction, a striking object, a map, a readout) filling the middle 60 %, high
contrast, little clutter, and at most 2-5 words of text in the top third with 1-2 accent words in colour. Nothing
important in the bottom 20 % (YouTube's buttons and title sit there). Writes renders/thumbnail.jpg.
"""
import argparse, re, subprocess, sys, tempfile
from pathlib import Path

ED = Path(__file__).resolve().parent / 'edit'; FF = str(Path.home() / '.local/bin/ffmpeg')
ACCENT = {'dark': '&H0035A0FF&', 'light': '&H0000D7FF&', 'map': '&H0000D7FF&', 'data': '&H0035A0FF&'}   # BGR: orange / gold

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('project'); ap.add_argument('t', type=float); ap.add_argument('headline')
    ap.add_argument('--style', default='dark', choices=list(ACCENT)); ap.add_argument('--src')
    ap.add_argument('--crop-top', type=int, default=0, help='cut this many px off the top first (rarely needed: Classic Cuts thumbnails come from renders/clean.mp4)')
    ap.add_argument('--y', type=int, default=150, help='top of the headline in px (keep it off the face)')
    a = ap.parse_args(); P = Path(a.project).expanduser()
    clean = P / 'renders' / 'clean.mp4'   # Classic Cuts keep an overlay-free copy (no banner, captions or card)
    src = Path(a.src) if a.src else clean if clean.exists() else next(iter(sorted(
        (x for x in (P / 'renders').glob('*.mp4') if x.name != 'clean.mp4'), key=lambda p: '-share' in p.name)), None)
    if not src or not src.exists(): sys.exit('no render to take the frame from (run before cleanup)')
    words = a.headline.strip()
    if len(re.sub(r'[*]', '', words).split()) > 6: sys.exit('headline too long: 2-6 words')
    # split into ≤ 2 lines of ≤ 16 characters
    toks = words.split(); lines, cur = [], ''
    for w in toks:
        if len(re.sub(r'[*]', '', cur + ' ' + w).strip()) > 16 and cur: lines.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
    if cur: lines.append(cur)
    acc = ACCENT[a.style]
    def ass_line(s):
        return re.sub(r'\*([^*]+)\*', lambda m: '{\\c' + acc + '}' + m.group(1).upper() + '{\\c&H00FFFFFF&}', s.upper())
    tmp = Path(tempfile.mkdtemp())
    ass = tmp / 't.ass'
    ev = []
    y0 = a.y
    for i, ln in enumerate(lines):
        y = y0 + i * 140
        ev.append(f'Dialogue: 1,0:00:00.00,0:00:05.00,H,,0,0,0,,{{\\an8\\pos(540,{y})\\blur10\\bord14\\3c&H000000&\\1a&HFF&\\3a&H40&}}{ass_line(ln)}')
        ev.append(f'Dialogue: 2,0:00:00.00,0:00:05.00,H,,0,0,0,,{{\\an8\\pos(540,{y})}}{ass_line(ln)}')
    ass.write_text(f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: H,Arial Black,118,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,7,4,8,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + '\n'.join(ev) + '\n')
    out = P / 'renders' / 'thumbnail.jpg'
    ct = max(0, a.crop_top)
    vf = (f"crop=iw:ih-{ct}:0:{ct},scale=-2:2074,crop=1080:1920,eq=contrast=1.06:saturation=1.2:gamma=1.18,unsharp=5:5:0.6,"
          f"vignette=angle=PI/6,subtitles='{ass}':fontsdir='{ED / 'fonts'}'")
    subprocess.run([FF, '-v', 'error', '-y', '-ss', f'{a.t:.3f}', '-i', str(src), '-frames:v', '1', '-vf', vf, '-q:v', '3', str(out)], check=True)
    q = 3
    while out.stat().st_size > 1_900_000 and q < 10:
        q += 2; subprocess.run([FF, '-v', 'error', '-y', '-ss', f'{a.t:.3f}', '-i', str(src), '-frames:v', '1', '-vf', vf, '-q:v', str(q), str(out)], check=True)
    print(f'{out} ({out.stat().st_size // 1024} KB)')

if __name__ == '__main__':
    main()
