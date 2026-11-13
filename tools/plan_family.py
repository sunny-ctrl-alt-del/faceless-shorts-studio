"""Plan the 6-channel family (owner, 2026-11-12, v2): 2 Shorts a day PER CHANNEL, each slot with 2 topic options.

  python3 -I plan_family.py [--start 2026-11-16] [--days 14] [--seed 3] [--append]
  --append (weekly planner): keep the existing plan before --start, add the new days after it, and never reuse an idea
  that is already in the plan or in ideas/done.md (so topics don't repeat across weeks).
  → ideas/family_plan.json  [{date, day, time, channel, name, combo, format, style, kind, options: [[title, question], [..]]}]
  → ideas/family_calendar.md (readable, one table per day)

Channels, slot times and combos: channels.json (v2). Each channel rotates through its own combos: every combo once
per cycle (reshuffled each cycle), never the same combo or the same style in both slots of one day when it can be
avoided. Topic options come from ideas/family_ideas.json ({channel: {combo: [[title, question], ...]}}), used in order,
2 per slot, never twice. The news channel's options are angles picked on the day (news can't be planned ahead).
<channel>'s PM slot on serial dates is "Your Call" (ideas/YOUR_CALL.md): the episode follows the last vote.
"""
import argparse, datetime as dt, json, random
from pathlib import Path

S = Path.home() / 'shorts-studio'
FORMAT = {'F1': 'Backfire', 'F2': 'Invention chain', 'F3': 'Money machine', 'F4': 'What-if rules', 'F5': 'Place history',
          'F6': 'Mystery file', 'F7': 'Survival steps', 'F8': 'Body science', 'F9': 'Classic Cuts (film edit)', 'F10': 'Your Call',
          'F12': 'Hidden mechanics', 'F13': 'Culture quirk', 'F14': 'Next 60 seconds', 'F15': 'Look-alike showdown',
          'F16': 'Moral parable', 'F17': 'Character skit', 'F18': 'Story of the day', 'F19': 'Map / number of the day',
          'F20': 'Movie science', 'F21': 'Verdict roundup', 'F22': 'Behind the scene', 'F23': 'Box office breakdown',
          'F24': 'Top 5 today'}
STYLE = {'V1': 'Tall Tale 3D', 'V2': 'Deep Dive 3D', 'V3': 'Night File 3D', 'V4': 'Inside Out', 'V5': 'Stick Story',
         'V6': 'Paper Atlas', 'V7': 'Classic Cuts edit', 'V8': 'Kinetic Diagram', 'V9': 'Sim HUD 3D', 'V10': 'Doodle Cartoon',
         'V11': 'News Desk'}
SERIAL_DATES = {'2026-11-14': 1, '2026-11-17': 2, '2026-11-20': 3, '2026-11-23': 4, '2026-11-26': 5, '2026-11-29': 6, '2026-12-02': 7, '2026-12-05': 8}
f_ = lambda c: c.split('x')[0]; v_ = lambda c: c.split('x')[1]

def rotation(combos, rnd):
    last = None
    while True:
        cyc = combos[:]; rnd.shuffle(cyc)
        if last and cyc[0] == last and len(cyc) > 1: cyc[0], cyc[1] = cyc[1], cyc[0]
        yield from cyc; last = cyc[-1]

def pick_pair(gen_buf, gen, avoid_style=None):
    """take the next combo; if it clashes with the day's other slot, take the one after (keep the rest queued)"""
    while len(gen_buf) < 3: gen_buf.append(next(gen))
    for i, c in enumerate(gen_buf):
        if avoid_style is None or (v_(c) != v_(avoid_style) and c != avoid_style): return gen_buf.pop(i)
    return gen_buf.pop(0)

def news_options(d, slot, combo):
    """news can't be planned ahead: the two options are angles; the build picks the stories from that morning's Indian
    headlines (owner, 12 Nov night: Indian audience, local/national angle, a Top 5 of the day)"""
    f, wd = f_(combo), d.weekday()
    top5pm = ["Today's top 5 in India (evening edition)", 'Which one matters most to you? 1-5']
    if f == 'F24':
        a = ['The week ahead in India: 5 dates that matter', 'Which date are you watching? 1-5'] if wd == 0 else \
            ["India this morning: the top 5 stories in 60 seconds", 'Which story matters most to you? 1-5']
        return [a, ['Top 5 this morning + the one to watch today', 'Which one surprised you? 1-5']]
    if f == 'F18':
        a = ['The week in India in 60 seconds', 'Biggest story of the week: A or B?'] if wd == 5 else \
            ["Today's top story in India: what happened, why it matters, what's next", 'Agree or disagree? (story-specific)']
        return [a, top5pm]
    if f == 'F19':
        return [['The map of the day: one place in India in the news, explained', 'Have you been there? Yes or no'], top5pm]
    return [["Today's live event on a 60-second clock (a launch, a storm, a match)", 'Would you watch it live? Yes or no'], top5pm]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--start', default='2026-11-16'); ap.add_argument('--days', type=int, default=14)
    ap.add_argument('--seed', type=int, default=3); ap.add_argument('--skip', default='', help='channel ids to leave out, comma-separated')
    ap.add_argument('--ideas', default='ideas/family_ideas.json'); ap.add_argument('--out', default='ideas/family_plan.json')
    ap.add_argument('--md', default='ideas/family_calendar.md'); ap.add_argument('--append', action='store_true'); a = ap.parse_args()
    fam = json.loads((S / 'channels.json').read_text()); skip = set(filter(None, a.skip.split(',')))
    chans = [c for c in fam['channels'] if c['id'] not in skip]
    ideas_f = S / a.ideas; ideas = json.loads(ideas_f.read_text()) if ideas_f.exists() else {}
    used = {}; rows = []; need = {}
    out_f = S / a.out; keep = []; seen = set()
    if a.append and out_f.exists():
        keep = [r for r in json.loads(out_f.read_text()) if r['date'] < a.start]
        seen = {o[0].strip().lower() for r in json.loads(out_f.read_text()) for o in r['options']}
        done_f = S / 'ideas/done.md'
        if done_f.exists(): seen |= {l.strip().lower() for l in done_f.read_text().splitlines() if l.strip()}
    fresh = lambda pool: [x for x in pool if x[0].strip().lower() not in seen and not any(x[0].strip().lower() in l for l in seen)]
    rnd = random.Random(a.seed); gens = {c['id']: rotation(c['combos'], rnd) for c in chans}; bufs = {c['id']: [] for c in chans}
    d0 = dt.date.fromisoformat(a.start)
    for k in range(a.days):
        d = d0 + dt.timedelta(days=k); ds = d.isoformat()
        for c in chans:
            other = None
            for si, t in enumerate(c['slots']):
                serial = c['id'] == 'wcm' and si == 1 and ds in SERIAL_DATES
                if serial: combo = 'F10xV10'
                elif si == 0 and c.get('combos_am'): combo = c['combos_am'][0]
                else: combo = pick_pair(bufs[c['id']], gens[c['id']], other)
                other = combo
                if serial:
                    ep = SERIAL_DATES[ds]
                    opts = [[f'Your Call Ep {ep}: the story follows the winning vote (A)', 'A or B: what do you do next?'],
                            [f'Your Call Ep {ep}: the story follows the winning vote (B)', 'A or B: what do you do next?']]
                    kind = f'serial ep {ep}'
                elif c['id'] == 'news':
                    opts = news_options(d, si, combo); kind = 'news (topic picked on the day)'
                else:
                    pool = fresh(ideas.get(c['id'], {}).get(combo, [])) if a.append else ideas.get(c['id'], {}).get(combo, []); i = used.get((c['id'], combo), 0)
                    opts = pool[i:i + 2]; used[(c['id'], combo)] = i + 2; kind = 'planned'
                    if len(opts) < 2: need[(c['id'], combo)] = need.get((c['id'], combo), 0) + 2 - len(opts); opts = opts + [['(idea needed)', '']] * (2 - len(opts))
                f, v = combo.split('x')
                rows.append({'date': ds, 'day': d.strftime('%a'), 'time': t, 'channel': c['id'], 'name': c['name'], 'combo': combo,
                             'format': f'{f} {FORMAT.get(f, "")}', 'style': f'{v} {STYLE.get(v, "")}', 'kind': kind, 'options': opts})
    new_rows = rows; rows = keep + rows
    rows.sort(key=lambda r: (r['date'], r['time']))
    (S / a.out).write_text(json.dumps(rows, indent=1, ensure_ascii=False))
    md = ['# 6-channel calendar', '',
          f'{len({r["date"] for r in rows})} days to {rows[-1]["date"]}, 2 Shorts a day per channel (12 a day), IST. Each slot: 2 topic options; pick one in Notion '
          '("Family Calendar"). News topics are chosen on the day from that morning\'s headlines. Generated by tools/plan_family.py.', '']
    for ds in sorted({r['date'] for r in rows}):
        day = [r for r in rows if r['date'] == ds]
        md += [f'## {day[0]["day"]} {ds}', '', '| time | channel | format · style | option A | option B |', '|---|---|---|---|---|']
        md += [f'| {r["time"]} | {r["name"]} | {r["format"]} · {r["style"]} | {r["options"][0][0]} | {r["options"][1][0]} |' for r in day] + ['']
    (S / a.md).write_text('\n'.join(md))
    print(f'{len(new_rows)} new slots ({a.days} days from {a.start}); plan now {len(rows)} slots to {rows[-1]["date"]}')
    for c in chans:
        n = {}; [n.__setitem__(r['combo'], n.get(r['combo'], 0) + 1) for r in new_rows if r['channel'] == c['id']]
        print(f"  {c['name']}: " + ', '.join(f'{k}×{v}' for k, v in sorted(n.items(), key=lambda x: (int(x[0].split("x")[0][1:]), x[0]))))
    if need: print('ideas needed:', ', '.join(f'{k[0]}/{k[1]} +{v}' for k, v in sorted(need.items())))

if __name__ == '__main__':
    main()
