"""Count the A/B votes in a Short's comments (the "Your Call" serial: the most comments decide the next episode).

  python3 -I votes.py <youtube_id> [--json]

Fetches the public comments with yt-dlp (no sign-in). A vote = a comment (or reply) whose text starts with A or B
("A", "a!", "B)", "option B", "team a", "I pick B", "B 100%"); one vote per person (their latest one counts); the
channel's own comments don't count. Prints the tally, the winner and an honest line the next episode can say.
"""
import json, re, subprocess, sys
from pathlib import Path

YTDLP = str(Path.home() / '.local/bin/yt-dlp')
VOTE = re.compile(r"^\W*(?:option|team|choice|vote|i(?:'d)?\s+(?:pick|choose|vote|say)|definitely|def)?\W*([ab])(?![a-z])", re.I)

def tally(vid):
    out = subprocess.run([YTDLP, '-q', '--no-warnings', '--skip-download', '--get-comments', '-J', f'https://www.youtube.com/shorts/{vid}'],
                         capture_output=True, text=True, timeout=600)
    if out.returncode != 0: raise SystemExit(f'yt-dlp failed: {out.stderr.strip()[:300]}')
    info = json.loads(out.stdout); comments = info.get('comments') or []
    latest = {}
    for c in sorted(comments, key=lambda c: c.get('timestamp') or 0):
        if c.get('author_is_uploader'): continue
        txt = (c.get('text') or '').strip()
        if re.search(r'\b(a\s*(or|/)\s*b|b\s*(or|/)\s*a)\b', txt, re.I): continue   # "A or B?" is a question, not a vote
        m = VOTE.match(txt)
        if m: latest[c.get('author_id') or c.get('author')] = m.group(1).upper()
    a = sum(1 for v in latest.values() if v == 'A'); b = sum(1 for v in latest.values() if v == 'B'); n = a + b
    winner = 'A' if a > b else 'B' if b > a else None
    if n == 0: say = 'Nobody voted, so the story picks for you.'
    elif winner is None: say = f'It was a tie, {a} to {b}.'
    elif n >= 10: say = f'{round(100 * max(a, b) / n)}% of you chose {winner}.'
    else: say = f'Most of you chose {winner}.'
    return {'id': vid, 'comments': len(comments), 'votes': n, 'A': a, 'B': b, 'winner': winner, 'say': say,
            'views': info.get('view_count')}

if __name__ == '__main__':
    if len(sys.argv) < 2 or not re.fullmatch(r'[A-Za-z0-9_-]{11}', sys.argv[1]): raise SystemExit(__doc__)
    r = tally(sys.argv[1])
    print(json.dumps(r) if '--json' in sys.argv else f"{r['id']}: A {r['A']} · B {r['B']} ({r['votes']} votes from {r['comments']} comments) → {r['winner'] or 'no winner'} · \"{r['say']}\"")
