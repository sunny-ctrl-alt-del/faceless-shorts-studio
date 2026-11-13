"""Original "slowed edit" music, synthesized from scratch (no samples, no licence needed).

  python -I music.py <out.wav> --intro <seconds> --drop-bars 6 --outro-bars 2 [--bpm 72] [--key D] [--seed 7] [--mood dark]

The intro (pad + bell arpeggio + riser) is stretched so its bars end exactly at --intro seconds: put the dialogue cold
open there and the drop lands right after it. Writes <out.wav> (44.1 kHz stereo, peak -1 dBFS) and <out>.json with
bpm, bar/beat times, drop time and total length, so the editor can cut on the beat.
"""
import argparse, json, math, wave
from pathlib import Path
import numpy as np
from scipy import signal

SR = 44100
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

def env(n, a, r, sustain=1.0):
    e = np.ones(n) * sustain; na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, sustain, na)[:n]; e[-nr:] *= np.linspace(1, 0, min(nr, n)); return e

def saw(f, n, rng, detune=0.0):
    ph = rng.random(); t = np.arange(n) / SR; return 2 * ((t * f * 2 ** (detune / 1200) + ph) % 1.0) - 1

def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc / (SR / 2), 0.99), 'low'); return signal.lfilter(b, a, x)
def hp(x, fc, order=2):
    b, a = signal.butter(order, min(fc / (SR / 2), 0.99), 'high'); return signal.lfilter(b, a, x)
def bp(x, lo, hi):
    b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return signal.lfilter(b, a, x)

def reverb(x, seconds=2.6, rng=None):
    n = int(seconds * SR); t = np.arange(n) / SR
    ir = (rng.standard_normal(n)) * np.exp(-t * 6.9 / seconds); ir = lp(ir, 6000); ir[:int(0.012 * SR)] = 0
    y = signal.fftconvolve(x, ir)[:len(x)]; return y / (np.max(np.abs(y)) + 1e-9) * np.max(np.abs(x) + 1e-9)

def kick(rng):
    n = int(0.55 * SR); t = np.arange(n) / SR; f = 45 + 110 * np.exp(-t * 28)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5); x[:200] += rng.standard_normal(200) * 0.3 * np.linspace(1, 0, 200)
    return np.tanh(x * 1.8)
def snare(rng):
    n = int(0.32 * SR); t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 900, 7000) * np.exp(-t * 14); tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30)
    return np.tanh((noise * 0.9 + tone * 0.6) * 1.4)
def hat(rng, open_=False):
    n = int((0.18 if open_ else 0.05) * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t * (18 if open_ else 70)) * 0.5
def bass808(f, dur, glide_from=None):
    n = int(dur * SR); t = np.arange(n) / SR
    ff = np.full(n, f) if glide_from is None else f + (glide_from - f) * np.exp(-t * 18)
    x = np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t * 1.6); return np.tanh(x * 2.2) * 0.9
def bell(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR; idx = 2.2 * np.exp(-t * 5)
    return np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t * 2.8)
def boom(rng):
    n = int(2.4 * SR); t = np.arange(n) / SR
    return np.tanh(np.sin(2 * np.pi * (38 + 40 * np.exp(-t * 6)) * t) * np.exp(-t * 1.6) * 1.5) + lp(rng.standard_normal(n), 900) * np.exp(-t * 3) * 0.35

def add(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf): return
    m = min(len(x), len(buf) - i); buf[i:i + m] += x[:m] * gain

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('--intro', type=float, required=True)
    ap.add_argument('--drop-bars', type=int, default=6); ap.add_argument('--outro-bars', type=int, default=2)
    ap.add_argument('--bpm', type=float, default=72); ap.add_argument('--key', default='D'); ap.add_argument('--seed', type=int, default=7)
    ap.add_argument('--mood', default='dark', choices=['dark', 'hopeful'])
    a = ap.parse_args(); rng = np.random.default_rng(a.seed)
    # stretch the tempo (within 64-84 bpm) so a whole number of bars ends exactly at --intro
    bar0 = 240 / a.bpm; nb = max(1, round(a.intro / bar0)); bpm = 240 * nb / a.intro
    while bpm < 64 and nb > 1: nb -= 1; bpm = 240 * nb / a.intro
    while bpm > 84: nb += 1; bpm = 240 * nb / a.intro
    beat = 60 / bpm; bar = 4 * beat; drop = nb * bar; total_bars = nb + a.drop_bars + a.outro_bars
    total = total_bars * bar + 2.5; n = int(total * SR)
    root = 48 + NOTE[a.key.upper()]            # C3-octave root
    prog = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]] if a.mood == 'dark' else [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]]
    pad, bells, drums, bass, fx = (np.zeros(n) for _ in range(5))
    for b in range(total_bars):
        t0 = b * bar; ch = prog[b % 4]; nseg = int(bar * SR)
        in_drop = nb <= b < nb + a.drop_bars; outro = b >= nb + a.drop_bars
        # pad: detuned saws, low-passed, one chord per bar
        x = sum(saw(hz(root + 12 + iv), nseg, rng, d) for iv in ch for d in (-9, 0, 8)) / 9
        x = lp(x, 1400 if in_drop else 900) * env(nseg, 0.35, 0.4)
        add(pad, x, t0, 0.55 if b < nb else 0.42)
        # bell arpeggio in 8ths
        arp = [ch[0] + 24, ch[1] + 24, ch[2] + 24, ch[1] + 24, ch[0] + 36, ch[2] + 24, ch[1] + 24, ch[2] + 24]
        for k, iv in enumerate(arp):
            if b < nb or k % 2 == 0 or outro: add(bells, bell(hz(root + iv), 1.2), t0 + k * beat / 2, 0.16 if b < nb else 0.12)
        if in_drop:
            for k in range(4):     # half-time: kick on 1 (+ syncopation), snare on 3
                add(drums, kick(rng), t0 + k * beat, 0.95 if k in (0,) else 0)
            add(drums, kick(rng), t0 + 2.5 * beat, 0.7)
            add(drums, snare(rng), t0 + 2 * beat, 0.8)
            roll = (b - nb) % 2 == 1
            for k in range(16 if roll else 8):
                step = beat / 4 if roll else beat / 2
                if roll and k >= 12: step = beat / 8; add(drums, hat(rng), t0 + 12 * beat / 4 + (k - 12) * step, 0.5)
                else: add(drums, hat(rng, open_=(k == 7 and not roll)), t0 + k * step, 0.45)
            add(bass, bass808(hz(root - 12 + ch[0]), bar * 0.95, glide_from=hz(root - 12 + ch[0] + 7) if b % 2 else None), t0, 0.85)
    # riser into the drop + impact on it
    rl = min(2 * bar, drop); m = int(rl * SR); t = np.arange(m) / SR
    riser = np.zeros(m)
    for i in range(0, m, 2048):
        seg = rng.standard_normal(min(2048, m - i)); riser[i:i + len(seg)] = bp(seg, 300 + 4000 * (i / m), 900 + 9000 * (i / m))
    add(fx, riser * (t / rl) ** 2.2 * 0.45, drop - rl)
    add(fx, boom(rng), drop, 0.9); add(fx, boom(rng), (nb + a.drop_bars) * bar, 0.5)
    # sidechain: duck pad/bells under each drop kick
    duck = np.ones(n)
    for b in range(nb, nb + a.drop_bars):
        for k in (0, 2.5):
            i = int((b * bar + k * beat) * SR); w = min(int(0.35 * SR), n - i)
            if w > 0: duck[i:i + w] = np.minimum(duck[i:i + w], 0.45 + 0.55 * np.linspace(0, 1, w) ** 0.6)
    wet = reverb(pad * 0.6 + bells + drums * 0.15, 2.8, rng)
    L = (pad + bells * 0.9) * duck + drums + bass + fx + wet * 0.35
    R = (pad * 0.95 + bells) * duck + drums + bass + fx + np.roll(wet, int(0.017 * SR)) * 0.35
    end = (total_bars) * bar; tail = np.ones(n); ie = int(end * SR); tail[ie:] = np.linspace(1, 0, n - ie)
    io = int((nb + a.drop_bars) * bar * SR); tail[io:ie] *= np.linspace(1, 0.55, ie - io)
    st = np.stack([L, R], 1) * tail[:, None]
    st = np.tanh(st / (np.max(np.abs(st)) + 1e-9) * 1.6); st *= 10 ** (-1 / 20) / np.max(np.abs(st))
    out = Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes())
    beats = [round(i * beat, 4) for i in range(int(total_bars * 4) + 1)]
    meta = {'bpm': round(bpm, 3), 'beat': round(beat, 4), 'bar': round(bar, 4), 'intro_bars': nb, 'drop': round(drop, 4),
            'drop_end': round((nb + a.drop_bars) * bar, 4), 'end': round(end, 4), 'length': round(total, 3), 'beats': beats,
            'key': a.key, 'mood': a.mood, 'seed': a.seed}
    Path(str(out) + '.json').write_text(json.dumps(meta, indent=1))
    print(json.dumps({k: v for k, v in meta.items() if k != 'beats'}))

if __name__ == '__main__':
    main()
