"""Build the cross-channel comparison table from references/<channel>/measure/*.json (works on partial data).
   python3 compare.py  > prints a markdown table (medians per channel) + per-channel counts."""
import json, statistics as st
from pathlib import Path

R = Path('~/shorts-studio/references').expanduser()
CH = [('ricksclips', 'Ricks Clips'), ('zackdfilms', 'Zack D. Films'), ('geoglobetales', 'GeoGlobeTales'), ('alexdiarys', 'AlexDiarys'),
      ('wobblybusiness', 'wobblybusiness'), ('whatifmakes', 'WhatIfMakes'), ('afterhourtheories', 'afterhourtheories'),
      ('kakarotox7', 'KAKAROTOx7'), ('hidbenmechanics', 'HidbenMechanics'), ('itstimefortacos', 'ItsTimeForTACOS'), ('sizedunderstood', 'Sized Understood'),
      ('afrimaxenglish', 'AfrimaxEnglish'), ('itscoltrain', 'itscoltrain'), ('dindininparis', 'dindin.inparis (cat)')]
COLS = [('n', 'n'), ('views', 'median views'), ('dur', 'length s'), ('wps', 'words/s'), ('hard_cuts', 'hard cuts'), ('still_pct', 'still %'),
        ('push_in_pct', 'push-in %'), ('luma_mean', 'brightness'), ('sat_mean', 'saturation'), ('edge_density', 'outline density'), ('lufs', 'LUFS')]

def med(xs):
    xs = [x for x in xs if isinstance(x, (int, float))]
    return st.median(xs) if xs else None

rows = []
for key, name in CH:
    ms = [json.loads(p.read_text()) for p in sorted((R / key / 'measure').glob('*.json'))]
    if not ms: continue
    r = {'name': name, 'n': len(ms), 'views': med([m.get('view_count') for m in ms])}
    for k, _ in COLS[2:]: r[k] = med([m.get(k) for m in ms])
    rows.append(r)
fmt = {'views': lambda v: f'{v / 1e6:.1f}M' if v >= 1e5 else f'{v / 1e3:.0f}K', 'dur': lambda v: f'{v:.0f}', 'wps': lambda v: f'{v:.2f}', 'hard_cuts': lambda v: f'{v:g}',
       'still_pct': lambda v: f'{v:.0f}', 'push_in_pct': lambda v: f'{v:.0f}', 'luma_mean': lambda v: f'{v:.2f}', 'sat_mean': lambda v: f'{v:.2f}',
       'edge_density': lambda v: f'{v:.3f}', 'lufs': lambda v: f'{v:.1f}', 'n': lambda v: f'{v}'}
print('| channel | ' + ' | '.join(h for _, h in COLS) + ' |')
print('|---|' + '---|' * len(COLS))
for r in rows: print(f"| {r['name']} | " + ' | '.join(fmt[k](r[k]) if r.get(k) is not None else '–' for k, _ in COLS) + ' |')
