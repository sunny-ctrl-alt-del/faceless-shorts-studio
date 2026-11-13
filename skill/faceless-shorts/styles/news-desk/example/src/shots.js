// INDIAN RAILWAYS IN 5 NUMBERS: the shot list (the only file that changes per video, with script.json).
// A shot: { id, at, cam: [cx, cy], zoom, note, draw(lt, d, t) }  · lt = time in shot, d = shot length, t = film time.
// News Desk rule: masthead + ticker stay on every shot (the "desk"), one story per card, ONE red thing per shot
// (the rank number / the key figure), pins only on abstract dot fields — never real borders or country outlines.
import { ctx, C, W, H, clamp, lerp, seg, eo, eob, text } from './core/lib.js';
import { L, Le, T } from './core/timing.js';
import * as K from './core/kit.js';

const LABEL = 'TOP 5', EDITION = 'INDIA · IN NUMBERS';
const TICK = ['VIVEK EXPRESS: 4,000+ KM', 'GORAKHPUR: A 1.3 KM PLATFORM', 'CHENAB BRIDGE: 359 M HIGH', '1.2 MILLION STAFF', 'NEARLY 2 CRORE RIDERS A DAY'];

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const desk = (t, lt, first = false) => { K.masthead(LABEL, EDITION, first ? seg(lt, 0, 0.4) : 1); K.ticker(TICK, t, 'TODAY', 1430, first ? seg(lt, 0.3, 0.8) : 1); };

  // ── 1 · HOOK: masthead slides in, the title pops, three pins drop on the dot fields ──
  {
    const st = cut(0);
    add({ id: 'S01', at: st, cam: [540, 860], zoom: 0.05, note: 'masthead + INDIAN RAILWAYS IN 5 NUMBERS, pins drop',
      draw(lt, d, t) {
        K.bg(t); desk(t, lt, true);
        K.headline('INDIAN | RAILWAYS | IN *5 NUMBERS', 540, 620, 130, lt, 0.15, 0.13);
        [[250, 1150, 0.55], [560, 1080, 0.75], [830, 1190, 0.6]].forEach(([x, y, a], i) => { K.ping(x, y, t, seg(lt, a + 0.2, a + 0.6)); K.pin(x, y, 1.15, seg(lt, a, a + 0.35)); });
        K.icon('train', 540, 1300, 0.9, seg(lt, 0.9, 1.3));
      } });
    cue(st + 0.05, 'whoosh'); cue(st + 0.55, 'pop', { gain: 0.5 }); cue(st + 0.75, 'pop', { gain: 0.5 }); cue(st + 0.6, 'pop', { gain: 0.4 });
  }

  // ── 2-6 · the five stories: rank flips in, the card slides in, headline types on, the key figure counts up ──
  const stories = [
    { n: 5, tag: 'LONGEST ROUTE', head: 'The Vivek Express runs from *Dibrugarh to *Kanyakumari', val: 4000, fmt: (v) => Math.round(v).toLocaleString('en-IN') + '+ km', icon: 'route' },
    { n: 4, tag: 'LONG PLATFORM', head: 'Gorakhpur station has one of the world\'s *longest platforms', val: 1.3, fmt: (v) => v.toFixed(1) + ' km', icon: 'ruler' },
    { n: 3, tag: 'HIGHEST ARCH', head: 'The Chenab bridge towers over the river in *Jammu and Kashmir', val: 359, fmt: (v) => Math.round(v) + ' m', icon: 'bridge' },
    { n: 2, tag: 'BIG EMPLOYER', head: 'Indian Railways is one of the world\'s *largest employers', val: 1.2, fmt: (v) => v.toFixed(1) + ' million', icon: 'people' },
    { n: 1, tag: 'EVERY DAY', head: 'Passengers who ride *every single day', val: 2, fmt: (v) => '~' + v.toFixed(1) + ' crore', icon: 'train' },
  ];
  stories.forEach((s, k) => {
    const i = k + 1, st = cut(i), dur = Le(i) - L(i);
    add({ id: `S0${i + 1}`, at: st, cam: [540, 900], zoom: 0.04, note: `#${s.n} ${s.tag}: ${s.fmt(s.val)}`,
      draw(lt, d, t) {
        K.bg(t); desk(t, lt);
        K.progress(k, 5, 760, 450, 1);
        K.rank(s.n, 180, 560, 220, seg(lt, 0, 0.35));
        K.tag(s.tag, 320, 540, seg(lt, 0.15, 0.4));
        K.card(70, 700, 940, 470, seg(lt, 0.08, 0.45));
        const off = (1 - eo(seg(lt, 0.08, 0.45))) * (W - 30);
        ctx.save(); ctx.translate(off, 0);
        K.wrap(s.head, 130, 790, 820, 62, seg(lt, 0.35, Math.max(0.9, dur * 0.45)));
        K.counter(s.val, s.fmt, 130, 1070, 104, seg(lt, 0.6, Math.max(1.4, dur * 0.6)));
        K.icon(s.icon, 860, 1060, 0.75, seg(lt, 0.5, 0.9));
        ctx.restore();
      } });
    cue(st, 'whoosh'); cue(st + 0.1, 'pop', { gain: 0.6 }); cue(st + 0.6, 'slide', { dur: 0.8, gain: 0.4 });
  });

  // ── 7 · the comment question: Which one surprised you? 1-5 ──
  {
    const st = cut(6);
    add({ id: 'S07', at: st, cam: [540, 900], zoom: 0.03, note: 'question card WHICH ONE SURPRISED YOU? + chips 1-5',
      draw(lt, d, t) {
        K.bg(t); desk(t, lt);
        K.progress(4, 5, 760, 450, 1);
        K.question('Which one *surprised you?', ['1', '2', '3', '4', '5'], seg(lt, 0, 0.4), t);
      } });
    cue(st, 'pop', { gain: 0.7 });
  }
  return { shots: S, cues: CUES };
}
