"""Which family slot to build next (owner, 2026-11-12 night: 5 new channels, 2 Shorts a day each, from 13 Nov 00:30 IST).

  python3 -I family_next.py [--hours 14] [--json]      (also: pipeline.sh family-next)

Reads ideas/family_plan.json (one row per slot) and state/*.json. A slot's project slug starts with
"<YYYY-MM-DD>-<channel>-<HHMM>-" (e.g. 2026-11-13-news-0730-top5). Prints, earliest first:
  LATE   slots whose time has passed but have no posted project (late is fine up to 6 h; after that: MOVE)
  NEXT   slots due within --hours that have no project yet
News slots are listed only from 3 h before their time (the topic must come from that morning's headlines).
A slot with a project that isn't posted shows as BUILDING <step> (resume it rather than starting a new one); a held,
rendered one is skipped (family-post posts it).
Owner, 13 Nov: a channel with no Zapier connection yet (channels.json zapier_connection null) is NOT built: its slots
show as WAIT (never build those; news would be stale anyway). When any channel is unconnected and the last connection
probe (state/zapier_probe.json) is 6+ h old, the first line is PROBE: run the probe (RUNBOOK "Family channels" 5) and
run family-next again.
A MOVE slot is listed until it's recorded with `pipeline.sh family-moved <slug_prefix>` (state/moved.json), after the
calendar row is set to Moved; then it never shows again.
"""
import argparse, datetime as dt, json
from pathlib import Path

S = Path.home() / 'shorts-studio'
DONE = {'posted', 'cleaned'}

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--hours', type=float, default=14); ap.add_argument('--json', action='store_true')
    ap.add_argument('--now', help='YYYY-mm-dd HH:MM (testing)'); a = ap.parse_args()
    now = dt.datetime.strptime(a.now, '%Y-%m-%d %H:%M') if a.now else dt.datetime.now()
    rows = json.loads((S / 'ideas/family_plan.json').read_text())
    states = {}
    for f in (S / 'state').glob('*.json'):
        try: states[f.stem] = json.loads(f.read_text())
        except Exception: pass
    chans = json.loads((S / 'channels.json').read_text())['channels']
    connected = {c['id'] for c in chans if c.get('zapier_connection')}
    probe = S / 'state' / 'zapier_probe.json'
    last = json.loads(probe.read_text()).get('at') if probe.exists() else None
    unconnected = sorted({r['channel'] for r in rows} - connected)
    stale = not last or (now - dt.datetime.fromisoformat(last)).total_seconds() > 6 * 3600
    moved_f = S / 'state' / 'moved.json'
    moved = set(json.loads(moved_f.read_text())) if moved_f.exists() else set()
    out, waiting = [], {}
    for r in rows:
        when = dt.datetime.strptime(f"{r['date']} {r['time']}", '%Y-%m-%d %H:%M')
        prefix = f"{r['date']}-{r['channel']}-{r['time'].replace(':', '')}-"
        proj = [(k, v) for k, v in states.items() if k.startswith(prefix)]
        step = proj[0][1].get('step') if proj else None
        if step in DONE: continue
        if prefix in moved: continue  # already given up and recorded
        if step == 'rendered' and (S / 'state' / f"{proj[0][0]}.hold").exists(): continue  # held: family-post's job
        mins = (when - now).total_seconds() / 60
        if mins < -360: tag = 'MOVE'                      # 6 h late: give up the slot (Notion row → Moved)
        elif proj: tag = f'BUILDING {step}'
        elif mins < 0: tag = 'LATE'
        elif mins <= a.hours * 60 and (r['channel'] != 'news' or mins <= 180): tag = 'NEXT'
        else: continue
        if r['channel'] not in connected and not (proj and step != 'rendered'):
            waiting[r['channel']] = waiting.get(r['channel'], 0) + 1; continue  # no channel to post to: don't build
        out.append({'tag': tag, 'when': f"{r['date']} {r['time']}", 'channel': r['channel'], 'name': r['name'], 'combo': r['combo'],
                    'format': r['format'], 'style': r['style'], 'kind': r['kind'], 'slug_prefix': prefix,
                    'project': proj[0][0] if proj else None, 'options': r['options'], 'minutes_to_slot': round(mins)})
    order = {'MOVE': 0, 'LATE': 1}
    out.sort(key=lambda x: (order.get(x['tag'], 2 if x['tag'].startswith('BUILDING') else 3), x['when']))
    if a.json: print(json.dumps({'probe_due': bool(unconnected and stale), 'unconnected': unconnected, 'waiting': waiting, 'slots': out}, indent=1, ensure_ascii=False)); return
    if unconnected and stale:
        print(f"PROBE  channels not connected: {', '.join(unconnected)}; last probe {last or 'never'} → run the probe, then family-next again")
    if waiting:
        print('WAIT (no channel connected, never build): ' + ', '.join(f'{k} {v} slot(s)' for k, v in sorted(waiting.items())))
    if not out: print('nothing to build in the next', a.hours, 'h'); return
    for x in out:
        print(f"{x['tag']:<18} {x['when']}  {x['channel']:<8} {x['combo']:<8} {x['slug_prefix']}…  A: {x['options'][0][0]}  |  B: {x['options'][1][0]}"
              + (f"  [project {x['project']}]" if x['project'] else ''))

if __name__ == '__main__':
    main()
