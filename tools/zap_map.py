"""Map Zapier YouTube connections to family channels from a probe of each connection (owner, 2026-11-13).

The probe = the Zapier code action `code_action_youtubev4cliapi__get_my_channel` (read-only: YouTube channels.list
mine=true) run once per connection. Feed the results in as JSON on stdin:
  [{"connection": "<zapier connection id>", "channels": [{"id": "UC…", "title": "…", "customUrl": "@…"}]}, …]
  pipeline.sh zap-map < probe.json        (or: echo '<json>' | pipeline.sh zap-map)

A channel gets a connection ONLY when the connection's YouTube channel title matches the channel's name or one of its
name_options (case, spaces, underscores and punctuation ignored). Nothing is ever guessed: no match → it stays null.
Writes channels.json (zapier_connection + yt block), state/zapier_probe.json (time + raw results) and prints a table.
`pipeline.sh zap-map --status` prints the current mapping and when the last probe ran (no Zapier calls).
`pipeline.sh zap-map science=<connection id> < probe.json` = the OWNER named that connection for that channel (used when the
channel isn't renamed yet); it's recorded with owner_assigned and kept as long as the channel id stays the same.
"""
import datetime as dt
import json
import re
import sys
from pathlib import Path

S = Path.home() / 'shorts-studio'
CH = S / 'channels.json'
PROBE = S / 'state' / 'zapier_probe.json'


def norm(s):
    s = re.sub(r'\(.*?\)', '', s or '')  # drop "(@Handle)" / notes
    return re.sub(r'[^a-z0-9]', '', s.lower())


def status(d):
    last = json.loads(PROBE.read_text()) if PROBE.exists() else {}
    print(f"last probe: {last.get('at', 'never')}")
    for c in d['channels']:
        yt = c.get('yt') or {}
        print(f"{c['id']:8} {c['name']:18} connection={c.get('zapier_connection') or 'NONE':38} youtube={yt.get('title', '-')} {yt.get('handle', '')}")
    for r in last.get('results', []):
        print(f"  probe {r['connection']}: " + (', '.join(f"{x.get('title')} {x.get('customUrl', '')}" for x in r.get('channels', [])) or 'NO CHANNEL on this login'))


def main():
    d = json.loads(CH.read_text())
    if '--status' in sys.argv:
        status(d); return
    assign = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a and not a.startswith('--'))  # owner-confirmed: channel=connection
    res = json.loads(sys.stdin.read())
    by_conn = {r['connection']: r.get('channels', []) for r in res}
    now = dt.datetime.now().isoformat(timespec='seconds')
    for c in d['channels']:
        names = {norm(c['name'])} | {norm(n) for n in c.get('name_options', [])}
        names.discard('')
        if c.get('zapier_connection') in by_conn:  # re-verify an existing mapping
            chs = by_conn[c['zapier_connection']]
            same_id = chs and chs[0]['id'] == (c.get('yt') or {}).get('channel_id')  # renamed but the same channel
            if chs and (same_id or norm(chs[0]['title']) in names):
                c['yt'] = {'channel_id': chs[0]['id'], 'title': chs[0]['title'], 'handle': chs[0].get('customUrl', ''), 'verified': now}
            else:
                print(f"WARNING {c['id']}: its connection now shows {chs and chs[0]['title']!r}, not this channel: unmapped")
                c['zapier_connection'] = None; c.pop('yt', None)
            continue
        if c.get('zapier_connection'):
            continue
        if c['id'] in assign and by_conn.get(assign[c['id']]):  # the owner named this connection for this channel
            ch = by_conn[assign[c['id']]][0]
            c['zapier_connection'] = assign[c['id']]
            c['yt'] = {'channel_id': ch['id'], 'title': ch['title'], 'handle': ch.get('customUrl', ''), 'verified': now, 'owner_assigned': True}
            print(f"ASSIGNED (owner) {c['id']} → {assign[c['id']]} ({ch['title']} {ch.get('customUrl', '')})"); continue
        hits = [(conn, ch) for conn, chs in by_conn.items() for ch in chs if norm(ch['title']) in names]
        if len({h[1]['id'] for h in hits}) == 1:
            conn, ch = hits[0]
            c['zapier_connection'] = conn
            c['yt'] = {'channel_id': ch['id'], 'title': ch['title'], 'handle': ch.get('customUrl', ''), 'verified': now}
            print(f"MAPPED {c['id']} → {conn} ({ch['title']} {ch.get('customUrl', '')})")
        elif hits:
            print(f"AMBIGUOUS {c['id']}: several channels match, left unmapped")
    PROBE.parent.mkdir(exist_ok=True)
    PROBE.write_text(json.dumps({'at': now, 'results': res}, indent=1))
    CH.write_text(json.dumps(d, indent=1, ensure_ascii=False))
    status(d)


if __name__ == '__main__':
    main()
