"""Search a film's subtitles.  python3 -I srt.py <film.srt> [--grep REGEX] [--from S] [--to S]
Prints  start-end  text  (seconds), to pick dialogue lines and montage moments for an edit plan."""
import argparse, re

def load(p):
    s = open(p, encoding='utf-8', errors='replace').read().replace('\r', '')
    out = []
    for b in s.split('\n\n'):
        L = [l for l in b.strip().split('\n') if l.strip()]
        k = [i for i, l in enumerate(L) if '-->' in l]
        if not k: continue
        a, z = L[k[0]].split('-->')
        def sec(t): h, m, r = t.strip().split()[0].split(':'); return int(h) * 3600 + int(m) * 60 + float(r.replace(',', '.'))
        out.append((sec(a), sec(z), re.sub(r'<[^>]+>', '', ' '.join(L[k[0] + 1:]))))
    return out

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('srt'); ap.add_argument('--grep'); ap.add_argument('--from', dest='a', type=float, default=0)
    ap.add_argument('--to', dest='z', type=float, default=1e9); x = ap.parse_args()
    for a, z, t in load(x.srt):
        if a < x.a or a > x.z: continue
        if x.grep and not re.search(x.grep, t, re.I): continue
        print(f'{a:8.2f}-{z:8.2f}  {t}')
