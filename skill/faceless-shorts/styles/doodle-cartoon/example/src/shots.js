// WHEN YOUR FRIEND SAYS "FIVE MINUTES AWAY": the shot list (the only file that changes per video, with script.json).
// Doodle Cartoon = a dialogue skit: each DIALOGUE line is one shot of its speaker, mouth flapping with K.talk(t, line),
// words in a speech bubble (the line has "nocap": true). Narrator lines get normal captions.
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, bigText } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const say = (i) => window.OP.script.lines[i].text;          // the spoken words go in the bubble (read at draw time)
  const G = K.GROUND;

  // ── 1 · TITLE: the two friends, title card ──────────────────────────────
  {
    const st = cut(0), five = Wd('five', 0) - st;
    add({ id: 'S01', at: st, cam: [540, 900], zoom: 0.05, note: 'yellow card, Zara arms crossed, Milo on phone grinning',
      draw(lt, d, t) {
        K.card(t, C.yellow);
        bigText('"5 MINUTES', 540, 430, 120, C.white, -0.04, eob(seg(lt, five - 0.1, five + 0.2)));
        bigText('AWAY"', 540, 560, 120, C.red, -0.04, eob(seg(lt, five + 0.25, five + 0.55)));
        K.person({ x: 300, y: G, s: 0.82, who: 'zara', grown: true, arms: 'cross', brow: 'angry', mouth: 'flat', look: [0.8, 0], bob: Math.abs(Math.sin(lt * 3)) * 6 });
        K.person({ x: 790, y: G, s: 0.82, who: 'milo', grown: true, dir: -1, arms: 'phone', mouth: 'grin', eyes: 'happy', hold: (x, y) => K.phone(x, y, 1.1, 0.2), bob: Math.abs(Math.sin(lt * 3 + 1)) * 6 });
      } });
    cue(st + five, 'pop'); cue(st + five + 0.3, 'pop', { gain: 0.6 });
  }

  // ── 2 · Zara at the cinema: "Where are you?" ────────────────────────────
  {
    const st = cut(1), li = 1;
    add({ id: 'S02', at: st, cam: [420, 900], zoom: 0.06, note: 'cinema, Zara on the phone, annoyed, bubble',
      draw(lt, d, t) {
        K.cinema(t);
        K.person({ x: 380, y: G, s: 1.0, who: 'zara', grown: true, arms: 'phone', brow: 'angry', mouth: 'flat', talk: K.talk(t, li), look: [0.6, -0.2], hold: (x, y) => K.phone(x, y, 1.2, 0.25) });
        K.popcorn(700, G - 40, 1.0);
        K.bubble(say(li), 560, 760, 470, 1000, seg(lt, 0.05, 0.3), 58, 700);
      } });
    cue(st, 'whoosh'); cue(st + 0.1, 'pop', { gain: 0.6 });
  }

  // ── 3 · Milo, relaxed: "Relax, I'm literally five minutes away." ────────
  {
    const st = cut(2), li = 2;
    add({ id: 'S03', at: st, cam: [540, 1000], zoom: 0.08, note: 'Milo close-up on the phone, smug, butter card',
      draw(lt, d, t) {
        K.card(t, C.butter);
        K.person({ x: 560, y: 1880, s: 1.35, who: 'milo', grown: true, arms: 'phone', eyes: 'half', mouth: 'smirk', talk: K.talk(t, li), look: [-0.3, 0], hold: (x, y) => K.phone(x, y, 1.4, 0.25) });
        K.bubble(say(li), 540, 420, 520, 640, seg(lt, 0.05, 0.3), 60, 720);
      } });
    cue(st, 'whoosh'); cue(st + 0.1, 'pop', { gain: 0.6 });
  }

  // ── 4 · Meanwhile… he's still in bed ────────────────────────────────────
  {
    const st = cut(3), away = Wd('away', 3) - st;
    add({ id: 'S04', at: st, cam: [460, 1100], zoom: 0.12, note: 'night bedroom, Milo asleep in bed, Zzz',
      draw(lt, d, t) {
        K.bedroom(t, true);
        K.person({ x: 740, y: 1370, s: 0.8, who: 'milo', grown: true, eyes: 'closed', mouth: 'o', arms: 'down', legsHidden: true, lean: -1.42, bob: Math.sin(t * 2) * 4 });
        K.bed(560, G);
        K.zzz(330, 960, t);
        if (lt > away) K.phone(820, 1290, 1.1, 0.6, '#FFE27A');
      } });
    cue(st, 'whoosh'); cue(st + away, 'boing', { gain: 0.5 });
  }

  // ── 5 · "Okay, okay. I'm putting my shoes on." (one sock) ───────────────
  {
    const st = cut(4), li = 4;
    add({ id: 'S05', at: st, cam: [460, 1000], zoom: 0.07, note: 'Milo sits up in bed, half awake, holding one sock',
      draw(lt, d, t) {
        K.bedroom(t, true);
        K.person({ x: 380, y: 1430, s: 0.95, who: 'milo', grown: true, eyes: 'half', mouth: 'smile', talk: K.talk(t, li), arms: K.pose('down', 'point', eo(seg(lt, 0.3, 0.7))), legsHidden: true, hold: (x, y) => K.sock(x, y + 20, 1.1, -0.3) });
        K.bed(560, G);
        K.bubble(say(li), 600, 520, 450, 760, seg(lt, 0.05, 0.3), 58, 700);
      } });
    cue(st, 'whoosh'); cue(st + 0.1, 'pop', { gain: 0.6 });
  }

  // ── 6 · Zara: "You said that twenty minutes ago!" (clock spins) ─────────
  {
    const st = cut(5), li = 5, tw = Wd('twenty', 5) - st;
    add({ id: 'S06', at: st, cam: [420, 900], zoom: 0.1, note: 'cinema, clock races 20 min, Zara furious',
      draw(lt, d, t) {
        K.cinema(t);
        const mins = 40 + 20 * eio(seg(lt, 0, d * 0.8));
        K.clock(860, 760, 110, 7 + Math.floor(mins / 60), mins % 60, lt < d * 0.8 ? 1 : 0);
        const shake = Math.sin(lt * 50) * 5;
        K.person({ x: 360 + shake, y: G, s: 1.0, who: 'zara', grown: true, arms: 'phone', brow: 'angry', mouth: 'frown', talk: K.talk(t, li), look: [0.4, -0.3], hold: (x, y) => K.phone(x, y, 1.2, 0.25) });
        K.angry(520, 860, 1.1, seg(lt, tw - 0.2, tw + 0.1));
        K.bubble(say(li), 470, 1020 - 330, 400, 980, seg(lt, 0.05, 0.3), 58, 660);
      } });
    cue(st, 'whoosh'); cue(st + 0.2, 'tock'); cue(st + 0.6, 'tock'); cue(st + tw, 'slam', { gain: 0.5 });
  }

  // ── 7 · Milo runs in: "I'm here! Did I miss anything?" ──────────────────
  {
    const st = cut(6), li = 6;
    add({ id: 'S07', at: st, cam: [600, 900], zoom: 0.06, note: 'Milo runs in from the right, out of breath, sweat',
      draw(lt, d, t) {
        K.cinema(t);
        const arrive = eo(seg(lt, 0, 0.6)), x = lerp(1300, 700, arrive);
        if (arrive < 1) K.motion(x, G, -1, 1 - arrive);
        K.person({ x, y: G, s: 1.0, who: 'milo', grown: true, dir: -1, arms: arrive < 1 ? 'run' : 'up', walk: arrive < 1 ? lt * 22 : null, eyes: 'wide', mouth: 'grin', talk: K.talk(t, li), bob: arrive < 1 ? Math.abs(Math.sin(lt * 22)) * 14 : 0 });
        K.sweat(860, 1000, 1, arrive >= 1 ? 1 : 0); K.sweat(560, 960, 0.8, arrive >= 1 ? 1 : 0);
        K.bubble(say(li), 560, 640, 660, 900, seg(lt, 0.55, 0.8), 60, 680);
      } });
    cue(st, 'whoosh'); cue(st + 0.05, 'zip'); cue(st + 0.6, 'thud', { gain: 0.6 });
  }

  // ── 8 · Zara: "Just the whole movie." (THE END on the marquee) ──────────
  {
    const st = cut(7), li = 7, mov = Wd('movie', 7) - st;
    add({ id: 'S08', at: st, cam: [540, 1000], zoom: 0.05, note: 'marquee THE END, Zara deadpan with empty popcorn, Milo shocked',
      draw(lt, d, t) {
        K.cinema(t, true);
        K.person({ x: 300, y: G, s: 0.95, who: 'zara', grown: true, arms: 'cross', eyes: 'half', mouth: 'flat', talk: K.talk(t, li), look: [0.8, 0] });
        K.popcorn(520, G - 30, 0.9, true);
        K.person({ x: 820, y: G, s: 0.95, who: 'milo', grown: true, dir: -1, arms: lt > mov ? 'facepalm' : 'down', eyes: 'wide', mouth: 'o', look: [-0.8, 0] });
        K.bubble(say(li), 360, 690, 330, 960, seg(lt, 0.05, 0.3), 60, 600);
      } });
    cue(st, 'whoosh'); cue(st + 0.1, 'pop', { gain: 0.6 }); cue(st + mov + 0.1, 'boing', { gain: 0.6 });
  }

  // ── 9 · the comment question ────────────────────────────────────────────
  {
    const st = cut(8), milo = Wd('milo', 8) - st;
    add({ id: 'S09', at: st, cam: [540, 900], note: 'mint card, both kids, which one are you?',
      draw(lt, d, t) {
        K.card(t, C.mint);
        bigText('ZARA', 300, 520, 100, C.purple, -0.05, eob(seg(lt, 0.1, 0.4)));
        bigText('OR', 540, 520, 70, C.white, 0, eob(seg(lt, 0.3, 0.5)));
        bigText('MILO?', 790, 520, 100, C.hoodie, 0.05, eob(seg(lt, milo - 0.1, milo + 0.2)));
        K.person({ x: 300, y: G, s: 0.82, who: 'zara', grown: true, arms: 'hips', mouth: 'smirk', brow: 'up', look: [0.3, 0] });
        K.person({ x: 790, y: G, s: 0.82, who: 'milo', grown: true, dir: -1, arms: 'shrug', mouth: 'grin', eyes: 'happy' });
      } });
    cue(st, 'whoosh'); cue(st + 0.1, 'pop'); cue(st + milo, 'pop');
  }

  return { shots: S, cues: CUES };
}
