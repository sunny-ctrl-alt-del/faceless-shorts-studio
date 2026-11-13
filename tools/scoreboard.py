"""Which format × style combos work? Reads state/*.json (tags: format, style, yt) + live YouTube stats via yt-dlp.

  python3 -I scoreboard.py            → tables by combo, format and style (views, views/day, likes %, comments)
Score = median of (views ÷ channel median views); videos < 3 days old use views per hour vs the channel's per-hour median.
Tag a project with:  pipeline.sh tag <slug> format=F3 style=V1 yt=<youtube id>
"""
import json, statistics as st, subprocess, time
from pathlib import Path

S = Path.home() / 'shorts-studio'; YT = str(Path.home() / '.local/bin/yt-dlp')
rows = []
for f in sorted((S / 'state').glob('*.json')):
    s = json.loads(f.read_text())
    if not s.get('yt'): continue
    out = subprocess.run([YT, '-q', '--no-warnings', '--skip-download', '--print',
                          '%(view_count)s|%(like_count)s|%(comment_count)s|%(timestamp)s', f"https://www.youtube.com/shorts/{s['yt']}"],
                         capture_output=True, text=True).stdout.strip()
    try:
        v, l, c, ts = out.split('|'); v = int(v); l = int(l) if l not in ('NA', 'None') else 0
        c = int(c) if c not in ('NA', 'None') else 0; ts = float(ts) if ts not in ('NA', 'None') else time.time() - 86400
    except Exception:
        print('no stats for', s['slug']); continue
    age_h = max(1.0, (time.time() - ts) / 3600)
    rows.append(dict(slug=s['slug'], f=s.get('format', '?'), v_=s.get('style', '?'), views=v, likes=l, comments=c, age_h=age_h))
if not rows: raise SystemExit('no tagged posts yet (pipeline.sh tag <slug> format=.. style=.. yt=..)')
med_v = st.median(r['views'] for r in rows) or 1; med_ph = st.median(r['views'] / r['age_h'] for r in rows) or 1
for r in rows:
    r['score'] = r['views'] / med_v if r['age_h'] >= 72 else (r['views'] / r['age_h']) / med_ph
def table(key, title):
    groups = {}
    for r in rows: groups.setdefault(key(r), []).append(r)
    print(f'\n## {title}\n| {title.split()[-1]} | n | median score | median views | views/day | likes % | comments |\n|---|---|---|---|---|---|---|')
    for k, g in sorted(groups.items(), key=lambda kv: -st.median(x['score'] for x in kv[1])):
        vd = st.median(x['views'] / (x['age_h'] / 24) for x in g); lk = 100 * sum(x['likes'] for x in g) / max(1, sum(x['views'] for x in g))
        print(f"| {k} | {len(g)} | {st.median(x['score'] for x in g):.2f} | {int(st.median(x['views'] for x in g))} | {vd:.0f} | {lk:.1f} | {sum(x['comments'] for x in g)} |")
print(f'{len(rows)} posts · channel median views {int(med_v)}')
table(lambda r: f"{r['f']}×{r['v_']}", 'By combo'); table(lambda r: r['f'], 'By format'); table(lambda r: r['v_'], 'By style')
print('\n## Posts\n| slug | combo | views | age (h) | score |\n|---|---|---|---|---|')
for r in sorted(rows, key=lambda r: -r['score']):
    print(f"| {r['slug']} | {r['f']}×{r['v_']} | {r['views']} | {r['age_h']:.0f} | {r['score']:.2f} |")
