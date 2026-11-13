// Doodle Cartoon: the COMPONENT ZOO. A recurring cast of thick-outline cartoon kids (and their parents), flat pastel
// sets, speech bubbles, reaction marks. Origin of every person = between the FEET. All sizes in 1080x1920 px.
import { ctx, C, W, H, TAU, lerp, clamp, seg, eo, eob, rnd, LW, ink, rr, circle, ell, line, bigText } from './lib.js';
import { lineWords } from './timing.js';

// ═════════════════════════ THE CAST (original characters) ═════════════════════════
// milo: orange hoodie, spiky brown hair, freckles · zara: purple top, two black hair puffs · noor: teal top, long
// blond hair · mom: teal cardigan, long brown hair · dad: blue shirt, grey hair, moustache. Kids ~760 px tall at s 1.
// Skits use GROWN-UP versions by default (owner, 2026-11-12: adults keep skits clear of "made for kids"): pass
// grown: true for milo / zara / noor. 'you' + 'danny' are the "Your Call" serial leads (the viewer and his brother).
export const CAST = {
  milo: { skin: C.skin1, skinD: C.skin1d, top: C.hoodie, topD: C.hoodieD, legs: C.jeans, hair: C.hairBrown, kind: 'kid', hairStyle: 'spiky', freckles: true },
  zara: { skin: C.skin3, skinD: C.skin3d, top: C.purple, topD: C.purpleD, legs: C.jeans, hair: C.hairBlack, kind: 'kid', hairStyle: 'puffs' },
  noor: { skin: C.skin2, skinD: C.skin2d, top: C.teal, topD: C.tealD, legs: '#5B4A8B', hair: C.hairBlond, kind: 'kid', hairStyle: 'long' },
  mom: { skin: C.skin1, skinD: C.skin1d, top: C.teal, topD: C.tealD, legs: '#5B4A8B', hair: C.hairBrown, kind: 'adult', hairStyle: 'long', cardigan: true },
  dad: { skin: C.skin2, skinD: C.skin2d, top: C.blue, topD: '#2C73C7', legs: '#4A4A58', hair: C.hairGrey, kind: 'adult', hairStyle: 'short', moustache: true, buttons: true },
  you: { skin: C.skin2, skinD: C.skin2d, top: '#3E7CB1', topD: '#2F6596', legs: '#3B3B48', hair: C.hairBlack, kind: 'adult', hairStyle: 'short', hoodie: true },
  danny: { skin: C.skin2, skinD: C.skin2d, top: '#C8553D', topD: '#A9432E', legs: C.jeans, hair: C.hairBlack, kind: 'adult', hairStyle: 'spiky', stubble: true, buttons: true },
};

// arm poses: [elbow, hand] relative to the shoulder (x outward, y down), for the FRONT (R) and BACK (L) arm
const POSE = {
  down: { L: [[-25, 95], [-30, 180]], R: [[25, 95], [30, 180]] },
  hips: { L: [[-70, 70], [-5, 135]], R: [[70, 70], [5, 135]] },
  wave: { L: [[-25, 95], [-30, 180]], R: [[70, -70], [95, -185]] },
  phone: { L: [[-25, 95], [-30, 180]], R: [[60, 30], [55, -150]] },
  point: { L: [[-25, 95], [-30, 180]], R: [[85, 20], [185, -20]] },
  up: { L: [[-60, -90], [-90, -210]], R: [[60, -90], [90, -210]] },
  shrug: { L: [[-75, 50], [-125, -35]], R: [[75, 50], [125, -35]] },
  facepalm: { L: [[-25, 95], [-30, 180]], R: [[40, 30], [-60, -170]] },
  cross: { L: [[-20, 75], [170, 65]], R: [[20, 80], [-170, 70]] },
  run: { L: [[-60, 60], [-20, 140]], R: [[70, 40], [130, -30]] },
};
const lerpPose = (a, b, k) => ({ L: a.L.map((p, i) => [lerp(p[0], b.L[i][0], k), lerp(p[1], b.L[i][1], k)]), R: a.R.map((p, i) => [lerp(p[0], b.R[i][0], k), lerp(p[1], b.R[i][1], k)]) });
export const pose = (a, b = null, k = 0) => (b ? lerpPose(POSE[a], POSE[b], clamp(k)) : POSE[a]);

function limb(pts, fill, w) { line(pts, C.ink, w + LW * 2); line(pts, fill, w); }

/**
 * person({ x, y, s, who, dir, arms: 'down'|'hips'|'wave'|'phone'|'point'|'up'|'shrug'|'facepalm'|'cross'|'run' or pose(a, b, k),
 *   eyes: 'n'|'wide'|'half'|'closed'|'side'|'happy', look: [-1..1, -1..1], brow: 'n'|'up'|'angry'|'worried', mouth:
 *   'smile'|'grin'|'frown'|'flat'|'o'|'yawn'|'smirk', talk: 0..1 (mouth flap, use talk(t, line)), blush, bob (px), lean (rad),
 *   walk (phase, rad), hold: (x, y) => prop at the front hand, legsHidden })
 */
export function person(o) {
  const ch = CAST[o.who || 'milo'], adult = ch.kind === 'adult' || o.grown, s = (o.s || 1) * (adult ? 1.18 : 1), d = o.dir || 1;
  ctx.save(); ctx.translate(o.x, o.y - (o.bob || 0)); ctx.scale(s * d, s); ctx.rotate((o.lean || 0) * d);
  const arms = typeof o.arms === 'string' || !o.arms ? POSE[o.arms || 'down'] : o.arms;
  const wk = o.walk, sw = wk != null ? Math.sin(wk) : 0;
  const tall = adult ? 1.12 : 1, hip = -170 * tall, shY = -370 * tall + (adult ? 25 : 0);
  // legs (back, front)
  if (!o.legsHidden) {
    for (const [k, sx] of [[-1, -48], [1, 48]]) {
      const swing = sw * k * 40;
      limb([[sx * 0.7, hip + 10], [sx + swing * 0.5, hip * 0.45], [sx + swing, -18]], ch.legs, 62);
      ctx.beginPath(); ctx.ellipse(sx + swing + 18, -12, 52, 26, 0, 0, TAU); ink('#F4F4F4');
    }
  }
  // back arm
  const shL = [-100, shY + 30], shR = [100, shY + 30];
  const arm = (sh, pp, side) => { const e = [sh[0] + pp[0][0], sh[1] + pp[0][1]], h = [sh[0] + pp[1][0], sh[1] + pp[1][1]]; limb([sh, e, h], ch.top, 46); ctx.beginPath(); ctx.arc(h[0], h[1], 28, 0, TAU); ink(ch.skin); return h; };
  arm(shL, arms.L, -1);
  // torso
  rr(-118, shY - 10, 236, hip - shY + 40, 60); ink(ch.top);
  rr(-118, hip - 40, 236, 70, 30); ink(ch.legs);                                     // belt line / hips
  if (o.who === 'milo' || ch.hoodie) { ctx.beginPath(); ctx.moveTo(-40, shY + 40); ctx.quadraticCurveTo(0, shY + 90, 40, shY + 40); ink(null, 8); rr(-55, hip - 120, 110, 60, 16); ink(ch.topD, 8); }
  if (ch.cardigan) { line([[0, shY + 10], [0, hip - 30]], ch.topD, 14); }
  if (ch.buttons) { line([[0, shY + 10], [0, hip - 30]], ch.topD, 8); for (let i = 0; i < 3; i++) circle(0, shY + 60 + i * 55, 7, C.ink); }
  // head (grown-ups get a slightly smaller head for the body)
  ctx.save(); ctx.translate(0, shY - 175); if (adult) { ctx.translate(0, 18); ctx.scale(0.9, 0.9); } head(0, 0, ch, o); ctx.restore();
  // front arm (over the body)
  const hand = arm(shR, arms.R, 1);
  if (o.hold) { ctx.save(); ctx.translate(hand[0], hand[1]); ctx.scale(1 / s / d, 1 / s); o.hold(0, 0); ctx.restore(); }
  ctx.restore();
}

function head(x, y, ch, o) {
  const r = 172, hs = ch.hairStyle;
  // hair behind the head
  if (hs === 'puffs') { ctx.beginPath(); ctx.arc(x - 165, y - 120, 82, 0, TAU); ink(ch.hair); ctx.beginPath(); ctx.arc(x + 165, y - 120, 82, 0, TAU); ink(ch.hair); }
  if (hs === 'long') { rr(x - r - 22, y - 60, r * 2 + 44, 300, 70); ink(ch.hair); }
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ink(ch.skin);                                       // face
  ell(x - r + 6, y + 10, 26, 40, ch.skin); ctx.beginPath(); ctx.ellipse(x - r + 4, y + 10, 26, 40, 0, Math.PI * 0.6, Math.PI * 1.4); ink(null, 9);   // ear (back)
  // hair on top
  ctx.beginPath();
  if (hs === 'spiky') { ctx.moveTo(x - r - 6, y - 10); for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI, rr2 = i % 2 ? r + 70 : r + 8; ctx.lineTo(x + Math.cos(a) * rr2, y - 30 + Math.sin(a) * rr2 * 0.95); } ctx.lineTo(x + r + 6, y - 10); ctx.quadraticCurveTo(x, y - 110, x - r - 6, y - 10); }
  else if (hs === 'puffs') { ctx.arc(x, y - 18, r + 6, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(x, y - 95, x - r * 0.98, y - 70); }
  else if (hs === 'short') { ctx.arc(x, y - 10, r + 6, Math.PI * 1.1, Math.PI * 1.9); ctx.quadraticCurveTo(x, y - 120, x - r * 0.95, y - 60); }
  else { ctx.arc(x, y - 10, r + 8, Math.PI * 1.0, Math.PI * 2.0); ctx.quadraticCurveTo(x + 40, y - 70, x - 30, y - 120); ctx.quadraticCurveTo(x - 90, y - 60, x - r - 8, y - 10); }
  ink(ch.hair);
  face(x + 18, y + 10, ch, o);
}

function face(x, y, ch, o) {
  const eyes = o.eyes || 'n', [lx, ly] = o.look || [0.2, 0], br = o.brow || 'n';
  const E = [[x - 62, y - 25], [x + 62, y - 25]];
  E.forEach(([ex, ey], i) => {
    if (eyes === 'closed' || eyes === 'happy') { ctx.beginPath(); if (eyes === 'happy') ctx.arc(ex, ey + 10, 28, Math.PI * 1.15, Math.PI * 1.85); else ctx.arc(ex, ey - 6, 28, Math.PI * 0.15, Math.PI * 0.85); ink(null, 10); return; }
    const big = eyes === 'wide' ? 1.25 : 1;
    ctx.beginPath(); ctx.ellipse(ex, ey, 36 * big, 44 * big, 0, 0, TAU); ink(C.white, 9);
    const px = (eyes === 'side' ? 0.9 : lx) * 14, py = ly * 14; circle(ex + px, ey + py + 4, eyes === 'wide' ? 13 : 18, C.ink); circle(ex + px + 6, ey + py - 3, 5, C.white);
    if (eyes === 'half') { ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, 40, 48, 0, 0, TAU); ctx.clip(); ctx.fillStyle = ch.skinD; ctx.fillRect(ex - 50, ey - 60, 100, 58); ctx.restore(); line([[ex - 36, ey - 2], [ex + 36, ey - 2]], C.ink, 9); }
  });
  // brows
  const B = { n: [0, 0], up: [-22, 0], angry: [6, 0.35], worried: [-8, -0.35] }[br] || [0, 0];
  E.forEach(([ex, ey], i) => { const sgn = i ? 1 : -1, tilt = B[1] * sgn; line([[ex - 32, ey - 70 + B[0] - tilt * 40], [ex + 32, ey - 70 + B[0] + tilt * 40]], C.ink, 13); });
  // cheeks + freckles
  if (o.blush !== false) { ctx.save(); ctx.globalAlpha = 0.45; circle(x - 108, y + 40, 26, C.cheek); circle(x + 108, y + 40, 26, C.cheek); ctx.restore(); }
  if (ch.freckles) for (const [fx, fy] of [[-112, 30], [-96, 48], [-122, 52], [104, 30], [118, 50], [94, 50]]) circle(x + fx, y + fy, 4.5, '#B5743F');
  if (ch.moustache) { ctx.beginPath(); ctx.ellipse(x, y + 62, 70, 22, 0, Math.PI, TAU); ink(ch.hair, 9); }
  if (ch.stubble) { ctx.save(); ctx.globalAlpha = 0.35; for (let i = 0; i < 26; i++) { const a = Math.PI * (0.15 + 0.7 * rnd(i)), rr2 = 120 + rnd(i + 40) * 40; circle(x + Math.cos(a) * rr2 * 0.95, y + 20 + Math.sin(a) * rr2 * 0.75, 3.5, C.ink); } ctx.restore(); }
  // mouth (talk flaps it open)
  const my = y + 85, tk = clamp(o.talk || 0), m = o.mouth || 'smile';
  if (tk > 0.05 || m === 'o' || m === 'yawn') {
    const h = m === 'yawn' ? 70 : m === 'o' ? 26 : 10 + tk * 34, w2 = m === 'o' ? 24 : m === 'yawn' ? 48 : 38;
    ctx.beginPath(); ctx.ellipse(x, my + h * 0.4, w2, h, 0, 0, TAU); ink(C.mouth, 9);
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, my + h * 0.4, w2, h, 0, 0, TAU); ctx.clip(); ell(x, my + h * 1.1, w2 * 0.8, h * 0.5, C.tongue); ctx.restore();
  } else if (m === 'grin') { ctx.beginPath(); ctx.moveTo(x - 60, my - 8); ctx.quadraticCurveTo(x, my + 70, x + 60, my - 8); ctx.closePath(); ink(C.white, 9); }
  else if (m === 'frown') { ctx.beginPath(); ctx.arc(x, my + 40, 40, Math.PI * 1.2, Math.PI * 1.8); ink(null, 10); }
  else if (m === 'flat') line([[x - 34, my + 6], [x + 34, my + 6]], C.ink, 10);
  else if (m === 'smirk') { ctx.beginPath(); ctx.moveTo(x - 36, my + 10); ctx.quadraticCurveTo(x + 10, my + 24, x + 44, my - 10); ink(null, 10); }
  else { ctx.beginPath(); ctx.arc(x, my - 14, 40, Math.PI * 0.2, Math.PI * 0.8); ink(null, 10); }
}

/** mouth flap for the speaker of script line `li`: 0 when silent, pulses while a word is spoken */
export function talk(t, li) {
  const w = lineWords(li).find((w) => t >= w.s - 0.02 && t <= w.e + 0.02); if (!w) return 0;
  return 0.35 + 0.65 * Math.abs(Math.sin((t - w.s) * 19));
}

// ═════════════════════════ SPEECH + REACTIONS ═════════════════════════
/** speech bubble with the spoken words, tail pointing to (tx, ty). sc 0..1 pops it in. size = font px */
export function bubble(text, x, y, tx, ty, sc = 1, size = 56, maxW = 760, think = false) {
  if (sc <= 0) return;
  ctx.save(); ctx.font = `900 ${size}px Inter`;
  const words = text.split(/\s+/), lines = []; let cur = '';
  for (const w of words) { const t2 = cur ? cur + ' ' + w : w; if (ctx.measureText(t2).width > maxW - 80 && cur) { lines.push(cur); cur = w; } else cur = t2; }
  if (cur) lines.push(cur);
  const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 90, bh = lines.length * size * 1.15 + 70;
  ctx.translate(x, y); ctx.scale(eob(sc), eob(sc));
  if (think) { for (const [k, r] of [[0.35, 18], [0.6, 26]]) { ctx.beginPath(); ctx.arc((tx - x) * (1 - k), (ty - y) * (1 - k) + bh / 2 * k, r, 0, TAU); ink(C.white, 9); } }
  else { ctx.beginPath(); const ax = clamp(tx - x, -bw / 2 + 60, bw / 2 - 60); ctx.moveTo(ax - 34, bh / 2 - 6); ctx.lineTo(tx - x, ty - y); ctx.lineTo(ax + 34, bh / 2 - 6); ink(C.white, 10); }
  rr(-bw / 2, -bh / 2, bw, bh, think ? bh / 2 : 46); ink(C.white, 10);
  if (!think) { ctx.beginPath(); const ax = clamp(tx - x, -bw / 2 + 60, bw / 2 - 60); ctx.moveTo(ax - 28, bh / 2 - 12); ctx.lineTo(ax + 28, bh / 2 - 12); ctx.strokeStyle = C.white; ctx.lineWidth = 14; ctx.stroke(); }
  ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * size * 1.15 + 3));
  ctx.restore();
}
/** anger mark (the four-curve vein) */
export function angry(x, y, s = 1, a = 1) {
  if (a <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s * eob(clamp(a)), s * eob(clamp(a)));
  for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2); ctx.beginPath(); ctx.moveTo(10, -40); ctx.quadraticCurveTo(14, -14, 40, -10); ctx.strokeStyle = C.red; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
/** a sweat drop */
export function sweat(x, y, s = 1, a = 1) { if (a <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = clamp(a); ctx.beginPath(); ctx.moveTo(0, -40); ctx.quadraticCurveTo(28, 0, 0, 22); ctx.quadraticCurveTo(-28, 0, 0, -40); ink('#9ED8FF', 8); ctx.restore(); }
/** Z z z floating up */
export function zzz(x, y, t) { for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI); bigText('Z', x + i * 40 + Math.sin(ph * 6) * 10, y - ph * 160, 60 + i * 14, C.white, -0.2); ctx.restore(); } }
/** speed/motion lines behind a running character (dir = facing) */
export function motion(x, y, dir = 1, a = 1) { ctx.save(); ctx.globalAlpha = a; for (let i = 0; i < 4; i++) line([[x - dir * (60 + i * 8), y - 260 + i * 110], [x - dir * (220 + i * 30), y - 260 + i * 110]], C.ink, 10); ctx.restore(); }
/** sparkle stars */
export function sparkle(x, y, s = 1, a = 1) { if (a <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s * a, s * a); ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 14 : 46, an = i / 8 * TAU; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ink(C.yellow, 7); ctx.restore(); }
/** an impact word ("WHAT?!") */
export function shout(text, x, y, size, a = 1, rot = -0.08, fill = C.yellow) { if (a <= 0) return; bigText(text, x, y, size, fill, rot, eob(clamp(a))); }

// ═════════════════════════ PROPS ═════════════════════════
export function phone(x, y, s = 1, rot = 0, screen = '#7FC8F8') { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); rr(-34, -62, 68, 124, 14); ink('#2B2B33', 8); rr(-24, -50, 48, 96, 8); ctx.fillStyle = screen; ctx.fill(); ctx.restore(); }
/** wall clock showing h:m (hands), tick 0..1 makes it wobble */
export function clock(x, y, r, h, m, wob = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(wob * 30) * 0.08 * wob); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ink(C.white, 10);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line([[Math.sin(a) * r * 0.78, -Math.cos(a) * r * 0.78], [Math.sin(a) * r * 0.88, -Math.cos(a) * r * 0.88]], C.ink, 6); }
  const ha = (h % 12 + m / 60) / 12 * TAU, ma = m / 60 * TAU;
  line([[0, 0], [Math.sin(ha) * r * 0.5, -Math.cos(ha) * r * 0.5]], C.ink, 12); line([[0, 0], [Math.sin(ma) * r * 0.75, -Math.cos(ma) * r * 0.75]], C.red, 8); circle(0, 0, 10, C.ink); ctx.restore();
}
export function popcorn(x, y, s = 1, empty = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (!empty) for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(-52 + (i % 5) * 26, -122 - Math.floor(i / 5) * 26 + (i % 2) * 6, 22, 0, TAU); ink('#FFF6DB', 7); }
  ctx.beginPath(); ctx.moveTo(-70, -110); ctx.lineTo(70, -110); ctx.lineTo(52, 40); ctx.lineTo(-52, 40); ctx.closePath(); ink(C.white, 9);
  for (const sx of [-34, 0, 34]) { ctx.beginPath(); ctx.moveTo(sx - 10, -110); ctx.lineTo(sx + 10, -110); ctx.lineTo(sx * 0.75 + 8, 40); ctx.lineTo(sx * 0.75 - 8, 40); ctx.closePath(); ctx.fillStyle = C.red; ctx.fill(); }
  ctx.restore();
}
export function sock(x, y, s = 1, rot = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(-20, -80); ctx.lineTo(20, -80); ctx.lineTo(20, 0); ctx.quadraticCurveTo(70, 0, 70, 30); ctx.lineTo(-20, 30); ctx.closePath(); ink('#F1F1F1', 8); line([[-20, -60], [20, -60]], C.red, 10); ctx.restore(); }

// ═════════════════════════ SETS (backgrounds) ═════════════════════════
export const GROUND = 1560;     // where people stand in every set
function floorBand(col, colD) { ctx.fillStyle = col; ctx.fillRect(-300, 1380, W + 600, 900); ctx.fillStyle = colD; ctx.fillRect(-300, 1380, W + 600, 18); }
/** cinema front at night: marquee, posters, doors, pavement */
export function cinema(t = 0, end = false) {
  ctx.fillStyle = C.night; ctx.fillRect(-300, -300, W + 600, H + 600);
  for (let i = 0; i < 14; i++) { const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)); ctx.save(); ctx.globalAlpha = a; circle(rnd(i) * 1080, 60 + rnd(i + 9) * 220, 4, C.white); ctx.restore(); }
  rr(-40, 330, 1160, 1080, 0); ink('#7C4E8C', 0);
  rr(90, 360, 900, 190, 26); ink(C.marquee);
  for (let i = 0; i < 18; i++) circle(120 + i * 49, 380, 9, Math.sin(t * 8 + i) > 0 ? C.yellow : '#FFF3C4');
  ctx.font = '900 92px Inter'; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(end ? 'THE END' : 'NOW SHOWING', 540, 470);
  for (const px of [150, 790]) { rr(px, 640, 140, 220, 12); ink(C.butter); rr(px + 20, 660, 100, 120, 8); ctx.fillStyle = px < 500 ? C.blue : C.red; ctx.fill(); }
  rr(380, 640, 320, 760, 12); ink('#5A3570'); line([[540, 650], [540, 1395]], C.ink, 10);
  floorBand(C.street, C.streetDark);
}
/** a kid's bedroom (night or day): window, poster, bed with a blanket you can tuck someone into */
export function bedroom(t = 0, night = true) {
  ctx.fillStyle = night ? C.lilacDark : C.lilac; ctx.fillRect(-300, -300, W + 600, H + 600);
  rr(620, 420, 300, 300, 18); ink(night ? C.nightDark : C.sky); line([[770, 420], [770, 720]], C.ink, 10); line([[620, 570], [920, 570]], C.ink, 10);
  if (night) { ctx.beginPath(); ctx.arc(700, 500, 34, 0, TAU); ctx.fillStyle = '#FFF2B3'; ctx.fill(); }
  rr(140, 440, 220, 290, 10); ink(C.butter); ctx.save(); ctx.translate(250, 585); ctx.rotate(-0.1); bigText('★', 0, 0, 120, C.red); ctx.restore();
  floorBand(C.floor, C.floorDark);
}
/** bed (draw AFTER the person sitting in it, so the blanket covers their legs). x = centre, y = floor */
export function bed(x, y, cover = '#5EC2E6') {
  rr(x - 420, y - 520, 60, 540, 20); ink(C.wood);                                       // headboard
  rr(x - 400, y - 250, 820, 170, 30); ink(cover);                                       // blanket
  for (let i = 0; i < 4; i++) line([[x - 330 + i * 200, y - 240], [x - 300 + i * 200, y - 90]], '#4AA9CC', 9);
  rr(x - 420, y - 90, 860, 90, 16); ink(C.wood); rr(x + 380, y - 300, 50, 320, 16); ink(C.wood);
}
/** a plain bright backdrop for the title / comment cards (with soft confetti dots) */
export function card(t, col = C.yellow) {
  ctx.fillStyle = col; ctx.fillRect(-300, -300, W + 600, H + 600);
  for (let i = 0; i < 26; i++) { const y = (rnd(i) * 2200 + t * 60 * (0.5 + rnd(i + 3))) % 2200 - 200; ctx.save(); ctx.globalAlpha = 0.5; circle(rnd(i + 7) * 1080, y, 10 + rnd(i + 5) * 14, [C.white, C.red, C.blue, C.green][i % 4]); ctx.restore(); }
}

// ═════════════════════════ "YOUR CALL" SERIAL: backyard set + props ═════════════════════════
/** the brother's backyard: sky, wooden fence, the back of the house (window + door) on the left, grass. night = moonlit */
export function backyard(t = 0, night = false) {
  ctx.fillStyle = night ? C.night : C.sky; ctx.fillRect(-300, -300, W + 600, H + 600);
  if (night) { ctx.beginPath(); ctx.arc(860, 470, 60, 0, TAU); ctx.fillStyle = '#FFF2B3'; ctx.fill(); for (let i = 0; i < 12; i++) { ctx.save(); ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i)); circle(rnd(i) * 1080, 340 + rnd(i + 9) * 300, 4, C.white); ctx.restore(); } }
  else { for (const [cx, cy] of [[760, 430], [300, 520]]) { for (const [dx, dy, r] of [[0, 0, 60], [55, 10, 48], [-55, 12, 44]]) { ctx.beginPath(); ctx.arc(cx + dx + Math.sin(t * 0.2) * 10, cy + dy, r, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); } } }
  for (let i = -1; i < 12; i++) { rr(i * 100 + 20, 860, 86, 560, 10); ink(night ? '#7A5A40' : '#C9925E', 9); }              // fence
  rr(-80, 640, 420, 800, 0); ink(night ? '#6E5A78' : '#F2C9A0');                                                           // house wall
  rr(60, 760, 200, 180, 12); ink(night ? '#FFE27A' : C.sky); line([[160, 760], [160, 940]], C.ink, 9);                      // window
  rr(100, 1060, 170, 330, 12); ink(night ? '#5A3F35' : C.wood); circle(240, 1230, 9, C.yellow);                             // back door
  ctx.fillStyle = night ? '#3E6B4A' : '#7CC67A'; ctx.fillRect(-300, 1380, W + 600, 900); ctx.fillStyle = night ? '#335A3E' : '#6AB36A'; ctx.fillRect(-300, 1380, W + 600, 18);
}
/** a dug hole in the lawn with a dirt mound (x = centre, y = ground line) */
export function hole(x, y, w = 260, mound = true) {
  if (mound) { ctx.beginPath(); ctx.ellipse(x + w * 0.75, y - 10, w * 0.38, 60, 0, Math.PI, TAU); ink('#8A5A3B', 9); }
  ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2, 46, 0, 0, TAU); ink('#3B2418', 9);
}
/** a shovel (held: draw at the hand with hold) */
export function shovel(x, y, s = 1, rot = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); rr(-9, -40, 18, 300, 9); ink(C.wood, 8); ctx.beginPath(); ctx.moveTo(-50, 250); ctx.lineTo(50, 250); ctx.lineTo(40, 340); ctx.quadraticCurveTo(0, 380, -40, 340); ctx.closePath(); ink('#B8C2CC', 8); rr(-40, -70, 80, 34, 14); ink(C.wood, 8); ctx.restore(); }
/** a stack of banded cash */
export function cash(x, y, s = 1, rot = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); rr(-80, -34, 160, 68, 8); ink('#8FD18B', 8); rr(-14, -34, 28, 68, 4); ink('#F2E7B5', 6); bigText('$', -48, 2, 40, '#3E8E4A'); bigText('$', 48, 2, 40, '#3E8E4A'); ctx.restore(); }
/** the metal box from the ground, lid opens with open 0..1; full of cash when open */
export function moneyBox(x, y, s = 1, open = 0, glow = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (glow > 0) { const g = ctx.createRadialGradient(0, -80, 10, 0, -80, 320); g.addColorStop(0, `rgba(255,230,120,${0.6 * glow})`); g.addColorStop(1, 'rgba(255,230,120,0)'); ctx.fillStyle = g; ctx.fillRect(-340, -400, 680, 680); }
  rr(-170, -120, 340, 160, 14); ink('#6F7C88', 10);
  if (open > 0.3) for (let i = 0; i < 6; i++) cash(-95 + (i % 3) * 95, -120 - Math.floor(i / 3) * 40, 0.55, (rnd(i) - 0.5) * 0.3);
  ctx.save(); ctx.translate(-170, -120); ctx.rotate(-open * 1.9); rr(0, -40, 340, 44, 12); ink('#8794A0', 10); ctx.restore();
  rr(-30, -96, 60, 40, 8); ink('#C9A24A', 7);
  ctx.restore();
}
/** a "YOU" name tag that floats over the viewer's character (episode openings) */
export function youTag(x, y, a = 1) { if (a <= 0) return; ctx.save(); ctx.translate(x, y); const k = eob(clamp(a)); ctx.scale(k, k); rr(-90, -46, 180, 92, 46); ink(C.yellow, 9); ctx.beginPath(); ctx.moveTo(-20, 44); ctx.lineTo(0, 76); ctx.lineTo(20, 44); ink(C.yellow, 9); ctx.font = '900 56px Inter'; ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('YOU', 0, 3); ctx.restore(); }
/** the A / B vote card (episode endings): two big options the viewer comments */
export function voteCard(a, b, x, y, p = 1) {
  if (p <= 0) return;
  [[a, C.blue, 'A', -1], [b, C.red, 'B', 1]].forEach(([txt, col, key, k], i) => {
    const q = eob(seg(p, i * 0.2, i * 0.2 + 0.5)); if (q <= 0) return;
    ctx.save(); ctx.translate(x, y + i * 250); ctx.scale(q, q);
    rr(-450, -100, 900, 200, 36); ink(C.white, 10); ctx.beginPath(); ctx.arc(-350, 0, 70, 0, TAU); ink(col, 10);
    ctx.font = '900 90px Inter'; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(key, -350, 4);
    ctx.font = '900 54px Inter'; ctx.fillStyle = C.ink; ctx.textAlign = 'left';
    const words = txt.split(' '), lines = []; let cur = ''; for (const w of words) { const t2 = cur ? cur + ' ' + w : w; if (ctx.measureText(t2).width > 600 && cur) { lines.push(cur); cur = w; } else cur = t2; } if (cur) lines.push(cur);
    lines.forEach((l, j) => ctx.fillText(l, -250, (j - (lines.length - 1) / 2) * 62 + 3));
    ctx.restore();
  });
}
