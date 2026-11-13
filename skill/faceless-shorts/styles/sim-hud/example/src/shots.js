// THE 60-SECOND ELEVATOR RIDE UP THE WORLD'S TALLEST BUILDING: the shot list (Sim HUD 3D example).
// A shot: { id, at, note, draw(lt, d, t, blit) } : render the 3D frame (E.render), blit() it, then draw the HUD on top.
// Sim HUD rule: a SIMULATED CLOCK runs through the whole video (simAt(t) maps film time → sim seconds), and every
// number on the HUD comes from one model (alt/speed below), so the readouts always agree with each other.
import * as THREE from 'three';
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Le, Wd, T } from './core/timing.js';
import { city, simCamera } from './core/world.js';
import * as HUDK from './core/hud.js';
const { HUD } = HUDK;

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => a.clone().lerp(b, k);
function screen(p, cam) { const v = p.clone().project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }

// ── the model: doors 0-3 s, speed up to 10 m/s by 8 s, cruise, slow to a stop by 53.2 s, doors open ~56 s ──
const TOP = 452, PRESS = (m) => 101.3 * Math.exp(-m / 8434);
function speed(s) { return s < 3 ? 0 : s < 8 ? 2 * (s - 3) : s < 48.2 ? 10 : s < 53.2 ? 10 - 2 * (s - 48.2) : 0; }
function alt(s) { if (s < 3) return 0; if (s < 8) return (s - 3) ** 2; if (s < 48.2) return 25 + 10 * (s - 8); if (s < 53.2) { const u = s - 48.2; return 427 + 10 * u - u * u; } return TOP; }

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const cam = simCamera(32);
  const LOOK = { aperture: 0, bloom: 0.45, bloomThreshold: 0.7, vignette: 0.3, grain: 0.018, warm: 0 };
  const C = city(E), eiffel = C.ring(330, '#FFC24B'), deck = C.ring(452, '#5EEAD4');
  // film time → sim seconds (the clock is compressed between narration beats)
  const KEY = [[L(2), 0], [Le(2), 9], [Le(3), 20], [Le(4), 40], [Le(5), 50], [Le(6), 60]];
  const simAt = (t) => { if (t <= KEY[0][0]) return 0; for (let i = 1; i < KEY.length; i++) if (t <= KEY[i][0]) return lerp(KEY[i - 1][1], KEY[i][1], (t - KEY[i - 1][0]) / (KEY[i][0] - KEY[i - 1][0])); return 60; };
  const render = (extra = {}) => E.render(C.scene, cam, { ...LOOK, t: 0, ...extra });
  const cabY = (t) => alt(simAt(t)) / 10;
  const hud = (t, { clock = true, rule = true } = {}) => {
    const s = simAt(t), m = alt(s);
    HUDK.frame(t);
    if (clock) HUDK.clock(s, 70, 350, 88);
    if (rule) HUDK.ruler(m, 500, 70, 520, 1240, 50, 'M', 1, [{ v: 330, label: 'EIFFEL' }]);
  };

  // 1 · HOOK: the tower at dusk, brackets lock on
  { const st = cut(0);
    add({ id: 'S01', at: st, note: 'wide orbit of the tower at dusk, brackets BURJ KHALIFA 828 M', draw(lt, d, t, blit) {
      C.setCab(0); const a = 0.6 + lt * 0.04;
      cam.position.set(Math.sin(a) * 150, 18 + lt * 1.5, Math.cos(a) * 150); cam.lookAt(0, 36, 0); render(); blit();
      HUDK.frame(t); const [bx, by] = screen(V3(0, 41, 0), cam), [, ty] = screen(V3(0, 82.8, 0), cam), [, gy] = screen(V3(0, 0, 0), cam);
      HUDK.brackets(bx, by, 220, Math.abs(gy - ty) + 60, seg(lt, 0.4, 1.0), HUD.teal, 'BURJ KHALIFA · 828 M');
    } });
    cue(st + 0.5, 'pop', { gain: 0.5 }); }

  // 2 · "the next sixty seconds": at the base, looking up; the clock appears
  { const st = cut(1);
    add({ id: 'S02', at: st, note: 'low angle at the base looking up, clock T+00:00.0 appears', draw(lt, d, t, blit) {
      C.setCab(0);
      cam.position.copy(lerpV(V3(14, 1.2, 24), V3(11, 1.4, 19), eio(lt / d))); cam.lookAt(0, 34, 0); render(); blit();
      HUDK.frame(t); HUDK.clock(0, 70, 350, 88, seg(lt, 0.2, 0.5));
      HUDK.title('60 SECONDS', 540, 760, 130, seg(lt, 0.4, 0.8), HUD.teal);
    } });
    cue(st, 'whoosh'); cue(st + 0.3, 'tock'); }

  // 3 · doors close, speed builds to 10 m/s (camera rides along outside)
  { const st = cut(2), ten = Wd('ten', 2) - st;
    add({ id: 'S03', at: st, note: 'camera rides with the glowing cab, SPEED readout 0 → 10 m/s', draw(lt, d, t, blit) {
      const y = cabY(t); C.setCab(y * 10);
      cam.position.set(9, y + 3, 9.5); cam.lookAt(0, y + 1.2, 2); render(); blit();
      hud(t); const s = simAt(t);
      HUDK.readout('SPEED', speed(s).toFixed(1), 'M/S', 560, 520, 440, seg(lt, 0.2, 0.6), lt > ten ? HUD.teal : HUD.white);
      HUDK.readout('ALTITUDE', Math.round(alt(s)) + '', 'M', 560, 700, 440, seg(lt, 0.4, 0.8));
    } });
    cue(st, 'whoosh'); cue(st + 0.5, 'thud', { gain: 0.5 }); cue(st + ten, 'pop'); }

  // 4 · 36 km/h straight up (wider, the trail shows the climb)
  { const st = cut(3), up = Wd('up', 3) - st;
    add({ id: 'S04', at: st, note: 'wider follow, 36 KM/H big readout, arrow up', draw(lt, d, t, blit) {
      const y = cabY(t); C.setCab(y * 10); const a = 0.9 + lt * 0.05;
      cam.position.set(Math.sin(a) * 40, y + 2, Math.cos(a) * 40); cam.lookAt(0, y + 4, 0); render(); blit();
      hud(t);
      HUDK.readout('SPEED', '36', 'KM/H', 560, 520, 440, seg(lt, 0.1, 0.4), HUD.teal, 110);
      if (lt > up - 0.3) { const [cx, cy] = screen(V3(0, y + 1, 3.6), cam); HUDK.marker('STRAIGHT UP', cx, cy, cx + 160, cy - 260, seg(lt, up - 0.3, up + 0.3), HUD.teal); }
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'slide', { dur: 1.6, gain: 0.5 }); }

  // 5 · passing the Eiffel Tower's height (wide side view, amber ring at 330 m)
  { const st = cut(4), eif = Wd('eiffel', 4) - st;
    add({ id: 'S05', at: st, note: 'wide side view, cab climbs past the amber 330 m ring', draw(lt, d, t, blit) {
      const y = cabY(t); C.setCab(y * 10);
      cam.position.copy(lerpV(V3(60, 26, 95), V3(55, 32, 88), eio(lt / d))); cam.lookAt(0, 30, 0); render(); blit();
      hud(t); const [ex, ey] = screen(V3(3.5, 33, 0), cam);
      HUDK.marker('EIFFEL TOWER · 330 M', ex, ey, ex + 120, ey - 120, seg(lt, eif - 0.4, eif + 0.2), HUD.amber);
      if (alt(simAt(t)) >= 330) HUDK.alert('PASSED', 700, 1120, t, seg(lt, eif, eif + 0.3), HUD.teal);
    } });
    cue(st, 'whoosh'); cue(st + eif, 'pop'); }

  // 6 · pressure drops 5 %, ears pop (view from the cab over the city)
  { const st = cut(5), pop = Wd('pop', 5) - st;
    add({ id: 'S06', at: st, note: 'POV from the cab over the dusk city, PRESSURE kPa falls, EARS POP alert', draw(lt, d, t, blit) {
      const y = cabY(t); C.setCab(y * 10);
      cam.position.set(2.2, y + 0.6, 6.5); cam.lookAt(40, y - 32, 100); render(); blit();
      hud(t); const s = simAt(t), pr = PRESS(alt(s));
      HUDK.readout('AIR PRESSURE', pr.toFixed(1), 'KPA', 560, 520, 440, seg(lt, 0.1, 0.4));
      HUDK.bar('VS GROUND', pr / 101.3, 560, 790, 440, seg(lt, 0.3, 0.6), HUD.amber);
      HUDK.alert('EARS POP', 560, 1060, t, seg(lt, pop - 0.15, pop + 0.15));
    } });
    cue(st, 'whoosh'); cue(st + pop, 'pop', { gain: 0.9 }); }

  // 7 · it slows, doors open at level 124 after one minute
  { const st = cut(6), lvl = Wd('level', 6) - st;
    add({ id: 'S07', at: st, note: 'close on the cab slowing into the teal deck ring, LEVEL 124, clock 1:00', draw(lt, d, t, blit) {
      const y = cabY(t); C.setCab(y * 10);
      cam.position.copy(lerpV(V3(12, 40, 20), V3(9, 44, 16), eio(lt / d))); cam.lookAt(0, Math.min(y, 45) + 0.5, 0); render(); blit();
      hud(t); const s = simAt(t);
      HUDK.readout('LEVEL', String(Math.round(124 * alt(s) / TOP)), '', 560, 520, 440, seg(lt, 0.1, 0.4), lt > lvl ? HUD.teal : HUD.white);
      HUDK.bar('TRIP', alt(s) / TOP, 560, 790, 440, seg(lt, 0.2, 0.5));
      if (lt > lvl) HUDK.alert('DOORS OPEN', 560, 1060, t, seg(lt, lvl, lvl + 0.3), HUD.teal);
    } });
    cue(st, 'whoosh'); cue(st + lvl, 'pop'); }

  // 8 · 452 metres up: the view from the deck
  { const st = cut(7);
    add({ id: 'S08', at: st, note: 'view from the deck over the city to the horizon, 452 M title', draw(lt, d, t, blit) {
      C.setCab(TOP); const a = -0.2 + lt * 0.05;
      cam.position.set(Math.sin(a) * 4, 45.6, Math.cos(a) * 4); cam.lookAt(Math.sin(a) * 200, -12, Math.cos(a) * 200); render(); blit();
      hud(t);
      HUDK.title('452 M', 540, 760, 200, seg(lt, 0.1, 0.4), HUD.teal);
      HUDK.title('IN 60 SECONDS', 540, 900, 70, seg(lt, 0.4, 0.7));
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'slam', { gain: 0.5 }); }

  // 9 · the comment question: straight down
  { const st = cut(8);
    add({ id: 'S09', at: st, note: 'vertigo: looking straight down the tower from the deck', draw(lt, d, t, blit) {
      C.setCab(TOP);
      cam.position.set(5.2, 46, 1.5); cam.lookAt(13 + lt * 0.4, 0, 9); render(); blit();
      HUDK.frame(t); HUDK.clock(60, 70, 350, 88);
      HUDK.brackets(540, 860, 360, 360, seg(lt, 0.2, 0.6), HUD.amber, '452 M DOWN');
    } });
    cue(st, 'whoosh'); }

  return { shots: S, cues: CUES };
}
