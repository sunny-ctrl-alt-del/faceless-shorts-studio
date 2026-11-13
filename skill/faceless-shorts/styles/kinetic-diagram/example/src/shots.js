// WHY TALL BUILDINGS USE REVOLVING DOORS: the shot list (the only file that changes per video, with script.json).
// A shot: { id, at, cam: [cx, cy], zoom, note, draw(lt, d, t) }  · lt = time in shot, d = shot length, t = film time.
// Kinetic Diagram rule: every shot DRAWS ITSELF ON (progress p from seg(lt, a, b)), white line art, ONE orange thing.
import { ctx, C, W, H, clamp, lerp, seg, eo, eio, eob, rnd, text } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';

export function buildShots() {
  const S = [], CUES = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── 1 · HOOK: the headline writes itself, a tower draws on, its door spins ──
  {
    const st = cut(0), rev = Wd('revolving', 0) - st;
    add({ id: 'S01', at: st, cam: [540, 820], zoom: 0.08, note: 'headline WHY REVOLVING DOORS?, tower draws on',
      draw(lt, d, t) {
        K.bg(t);
        K.headline('WHY *REVOLVING | *DOORS?', 540, 430, 124, lt, 0.05, Math.max(0.08, (rev - 0.05) / 2));
        K.building(540, 1240, 380, 560, 9, seg(lt, 0.2, 1.6));
        if (lt > rev) { K.glow(540, 1190, 170, seg(lt, rev, rev + 0.3)); K.revolvingDoor(540, 1190, 62, lt * 2.4, eo(seg(lt, rev, rev + 0.5)), 0); }
      } });
    cue(st + 0.05, 'pop', { gain: 0.5 }); cue(st + rev, 'pop', { gain: 0.6 });
  }

  // ── 2 · not style, it's the air ─────────────────────────────────────────
  {
    const st = cut(1), sty = Wd('style', 1) - st, air = Wd('air', 1) - st;
    add({ id: 'S02', at: st, cam: [540, 760], note: 'STYLE struck through, AIR pops with wind lines',
      draw(lt, d, t) {
        K.bg(t);
        ctx.save(); ctx.globalAlpha = clamp(lt * 5); K.strike('STYLE', 540, 560, 150, seg(lt, sty + 0.1, sty + 0.4)); ctx.restore();
        if (lt > air - 0.05) {
          const p = seg(lt, air - 0.05, air + 0.3);
          ctx.save(); ctx.translate(540, 900); ctx.scale(lerp(0.6, 1, eob(p)), lerp(0.6, 1, eob(p))); ctx.globalAlpha = clamp(p * 2); text('AIR', 0, 0, 260, C.accent); ctx.restore();
          for (let i = 0; i < 3; i++) K.wave(160, 1100 + i * 50, 760, 14, 2.5, t * 4 + i, seg(lt, air + i * 0.08, air + 0.6 + i * 0.08), i === 1 ? C.accent : C.dim, 6);
        }
      } });
    cue(st, 'whoosh'); cue(st + sty + 0.15, 'zip', { gain: 0.5 }); cue(st + air, 'pop');
  }

  // ── 3 · warm air rises inside (stack effect) ────────────────────────────
  {
    const st = cut(2), rises = Wd('rises', 2) - st, chim = Wd('chimney', 2) - st;
    add({ id: 'S03', at: st, cam: [540, 820], zoom: 0.1, note: 'building section, orange warm air rising, 22°C vs -5°C',
      draw(lt, d, t) {
        K.bg(t);
        K.building(500, 1250, 520, 820, 12, seg(lt, 0, 0.7));
        const a = seg(lt, rises - 0.3, rises + 0.3);
        for (let i = 0; i < 3; i++) K.flow([[380 + i * 120, 1210], [380 + i * 120, 470]], t + i * 0.3, 4, C.accent, 300, 60, 10, a);
        K.label('22°C', 200, 1090, 300, 1170, seg(lt, 0.4, 1.0), true, 56);
        K.label('-5°C', 900, 520, 900, 640, seg(lt, 0.6, 1.2), false, 56);
        if (lt > chim) K.chimney(900, 1250, 0.8, t, seg(lt, chim, chim + 0.5));
      } });
    cue(st, 'whoosh'); cue(st + rises - 0.2, 'slide', { dur: 1.2, gain: 0.6 }); cue(st + chim, 'pop', { gain: 0.5 });
  }

  // ── 4 · cold air pulled in at the bottom ────────────────────────────────
  {
    const st = cut(3), cold = Wd('cold', 3) - st, hard = Wd('hard', 3) - st;
    add({ id: 'S04', at: st, cam: [600, 900], zoom: 0.12, note: 'ground floor close-up, cold air streams pulled in, SUCTION tag',
      draw(lt, d, t) {
        K.bg(t);
        K.trace([[120, 360], [120, 1100], [420, 1100]], seg(lt, 0, 0.5), C.line, 9);            // building wall + floor
        K.trace([[560, 1100], [1100, 1100]], seg(lt, 0.2, 0.6), C.dim, 5);                       // pavement outside
        K.trace([[420, 1100], [420, 860]], seg(lt, 0.3, 0.6), C.line, 9);                        // door frame
        const a = seg(lt, cold - 0.2, cold + 0.3), sp = lt > hard ? 520 : 300;
        for (let i = 0; i < 4; i++) K.flow([[1100, 920 + i * 45], [560, 980 + i * 25], [200, 1040 - i * 140]], t + i * 0.2, 3, C.line, sp, 70, 11, a * 0.9);
        if (a > 0) K.arrow(1000, 760, 640, 900, seg(lt, cold, cold + 0.4), C.line, 12, 40);
        K.tag('SUCTION', 640, 620, 56, lt > hard ? eob(seg(lt, hard, hard + 0.3)) : 0, true);
      } });
    cue(st, 'whoosh'); cue(st + cold, 'slide', { dur: 1.4 }); cue(st + hard, 'thud');
  }

  // ── 5 · a normal door slams or sticks ───────────────────────────────────
  {
    const st = cut(4), slam = Wd('slam', 4) - st, shut = Wd('shut', 4) - st;
    add({ id: 'S05', at: st, cam: [540, 820], note: 'plan view swing door: blown open, SLAM on "slam"',
      draw(lt, d, t) {
        K.bg(t);
        const open = lt < slam ? lerp(0.15, 1.35, eio(seg(lt, 0.2, slam - 0.1))) : lerp(1.35, 0, eo(seg(lt, slam, slam + 0.18)));
        const shake = lt > slam ? Math.sin(lt * 90) * 14 * Math.max(0, 1 - (lt - slam) * 4) : 0;
        ctx.save(); ctx.translate(shake, 0); K.swingDoor(400, 820, 280, open, seg(lt, 0, 0.4), lt > slam); ctx.restore();
        for (let i = 0; i < 3; i++) K.arrow(780 - i * 30, 380 + i * 70, 560 - i * 30, 640 + i * 70, seg(lt, 0.3 + i * 0.1, 0.8 + i * 0.1), C.dim, 8, 24);
        if (lt > slam) { ctx.save(); const p = seg(lt, slam, slam + 0.2); ctx.translate(820, 1040); ctx.rotate(-0.12); ctx.scale(lerp(1.6, 1, eo(p)), lerp(1.6, 1, eo(p))); text('SLAM!', 0, 0, 120, C.accent); ctx.restore(); }
        if (lt > shut) K.tag('STUCK', 300, 1080, 48, eob(seg(lt, shut, shut + 0.3)));
      } });
    cue(st, 'whoosh'); cue(st + slam, 'slam'); cue(st + shut, 'pop', { gain: 0.5 });
  }

  // ── 6 · a revolving door is never open straight through ─────────────────
  {
    const st = cut(5), never = Wd('never', 5) - st, thru = Wd('through', 5) - st;
    add({ id: 'S06', at: st, cam: [540, 820], zoom: 0.08, note: 'plan view revolving door turns, tips glow, straight path blocked',
      draw(lt, d, t) {
        K.bg(t);
        const seal = lt > never ? seg(lt, never, never + 0.3) : 0;
        K.glow(540, 820, 330, seal * 0.8);
        K.revolvingDoor(540, 820, 230, 0.4 + lt * 1.2, seg(lt, 0, 0.6), seal);
        if (lt > thru - 0.2) { const p = seg(lt, thru - 0.2, thru + 0.3);
          ctx.save(); ctx.setLineDash([18, 16]); K.trace([[540, 420], [540, 560]], p, C.dim, 7); ctx.restore();
          if (p > 0.8) { const q = seg(lt, thru + 0.2, thru + 0.4); K.trace([[505, 555], [575, 625]], q, C.accent, 14); K.trace([[575, 555], [505, 625]], q, C.accent, 14); } }
        K.tag('NEVER OPEN', 540, 1200, 54, lt > never ? eob(seg(lt, never, never + 0.3)) : 0);
      } });
    cue(st, 'whoosh'); cue(st + never, 'pop'); cue(st + thru + 0.25, 'thud', { gain: 0.6 });
  }

  // ── 7 · far less air (and heat) escapes ─────────────────────────────────
  {
    const st = cut(6), heat = Wd('heat', 6) - st;
    add({ id: 'S07', at: st, cam: [540, 840], note: 'bars: air let in, swing door vs revolving',
      draw(lt, d, t) {
        K.bg(t);
        text('AIR LET IN', 540, 430, 64, C.dim, 'center', 6);
        K.bars(220, 1150, 640, 560, [{ label: 'SWING', v: 1 }, { label: 'REVOLVING', v: 0.22, accent: true }], 1, seg(lt, 0.1, 1.4));
        if (lt > heat) K.arrow(760, 760, 760, 1000, seg(lt, heat, heat + 0.4), C.accent, 12, 36);
      } });
    cue(st, 'whoosh'); cue(st + 0.4, 'slide', { dur: 0.8, gain: 0.5 }); cue(st + heat, 'pop');
  }

  // ── 8 · the name: STACK EFFECT ──────────────────────────────────────────
  {
    const st = cut(7), stack = Wd('stack', 7) - st;
    add({ id: 'S08', at: st, cam: [540, 760], zoom: 0.12, note: 'headline STACK EFFECT over a chimney-tower',
      draw(lt, d, t) {
        K.bg(t);
        K.headline('THE STACK | *EFFECT', 540, 470, 150, lt, Math.max(0, stack - 0.35), 0.12);
        K.building(540, 1250, 300, 520, 8, seg(lt, 0, 0.8));
        for (let i = 0; i < 2; i++) K.flow([[490 + i * 100, 1220], [490 + i * 100, 760]], t + i * 0.4, 3, C.accent, 280, 50, 9, seg(lt, 0.3, 0.8));
      } });
    cue(st, 'whoosh'); cue(st + stack, 'pop');
  }

  // ── 9 · you're holding back a chimney ───────────────────────────────────
  {
    const st = cut(8), push = Wd('push', 8) - st, chim = Wd('chimney', 8) - st;
    add({ id: 'S09', at: st, cam: [540, 860], note: 'line-art person pushes the door, chimney smoke rises',
      draw(lt, d, t) {
        K.bg(t);
        K.trace([[100, 1180], [980, 1180]], seg(lt, 0, 0.4), C.dim, 5);
        K.person(330, 1180, 1.1, lt > push ? 'push' : 'stand', seg(lt, 0, 0.8));
        K.revolvingDoor(640, 900, 120, lt > push ? (lt - push) * 2 : 0, seg(lt, 0.2, 0.7), 0);
        if (lt > chim - 0.2) { K.glow(860, 820, 220, seg(lt, chim - 0.2, chim + 0.2)); K.chimney(860, 1180, 1.2, t, seg(lt, chim - 0.2, chim + 0.3)); }
      } });
    cue(st, 'whoosh'); cue(st + push, 'thud', { gain: 0.5 }); cue(st + chim, 'pop');
  }

  // ── 10 · the comment question ───────────────────────────────────────────
  {
    const st = cut(9);
    add({ id: 'S10', at: st, cam: [540, 760], note: 'orange question mark draws on (comment beat)',
      draw(lt, d, t) {
        K.bg(t);
        K.glow(540, 700, 380, seg(lt, 0, 0.5));
        K.questionMark(540, 720, 2.4, seg(lt, 0.05, 0.9));
      } });
    cue(st, 'whoosh'); cue(st + 0.8, 'pop', { gain: 0.6 });
  }

  return { shots: S, cues: CUES };
}
