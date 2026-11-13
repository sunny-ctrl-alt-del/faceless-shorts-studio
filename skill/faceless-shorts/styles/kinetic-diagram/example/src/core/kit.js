// Kinetic Diagram engine: the COMPONENT ZOO. Line art that DRAWS ITSELF ON (every component takes a progress p 0..1),
// one orange accent, kinetic headline words. All coordinates are 1080x1920 canvas pixels.
import { ctx, C, W, H, TAU, lerp, clamp, seg, eo, eio, eob, rnd, rr, circle, line, text } from './lib.js';

// ═════════════════════════ BACKGROUND ═════════════════════════
/** blueprint navy + a fine grid that drifts slowly + a soft vignette. Fills past the edges (the camera zooms). */
export function bg(t = 0, grid = 1) {
  ctx.fillStyle = C.bg; ctx.fillRect(-300, -300, W + 600, H + 600);
  if (grid > 0) {
    const off = (t * 6) % 60;
    ctx.save(); ctx.globalAlpha = grid; ctx.lineWidth = 2;
    for (let x = -300 - off; x < W + 300; x += 60) { ctx.strokeStyle = Math.round((x + off) / 60) % 5 === 0 ? C.gridMajor : C.grid; ctx.beginPath(); ctx.moveTo(x, -300); ctx.lineTo(x, H + 300); ctx.stroke(); }
    for (let y = -300 - off; y < H + 300; y += 60) { ctx.strokeStyle = Math.round((y + off) / 60) % 5 === 0 ? C.gridMajor : C.grid; ctx.beginPath(); ctx.moveTo(-300, y); ctx.lineTo(W + 300, y); ctx.stroke(); }
    ctx.restore();
  }
  const g = ctx.createRadialGradient(540, 860, 300, 540, 960, 1250);
  g.addColorStop(0, 'rgba(9,16,28,0)'); g.addColorStop(1, 'rgba(9,16,28,0.85)');
  ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
}

// ═════════════════════════ LINE ART (draws on) ═════════════════════════
const plen = (pts) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
/** the first p (0..1) of a polyline, drawn with round caps. Returns the tip [x, y]. */
export function trace(pts, p = 1, color = C.line, w = 7, close = false) {
  if (close) pts = [...pts, pts[0]];
  if (p <= 0 || pts.length < 2) return pts[0];
  const L = plen(pts) * clamp(p); let acc = 0, tip = pts[0];
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], d = Math.hypot(bx - ax, by - ay);
    if (acc + d >= L) { const k = (L - acc) / (d || 1); tip = [ax + (bx - ax) * k, ay + (by - ay) * k]; ctx.lineTo(tip[0], tip[1]); break; }
    ctx.lineTo(bx, by); acc += d; tip = [bx, by];
  }
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  return tip;
}
/** a rectangle outline drawing on (clockwise from top-left) */
export function box(x, y, w, h, p = 1, color = C.line, lw = 7) { return trace([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], p, color, lw, true); }
/** a circle drawing on from 12 o'clock */
export function ring(x, y, r, p = 1, color = C.line, w = 7, a0 = -Math.PI / 2) {
  if (p <= 0) return; ctx.beginPath(); ctx.arc(x, y, r, a0, a0 + TAU * clamp(p)); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
}
/** a straight arrow drawing on from (x1, y1) to (x2, y2); the head appears at the end */
export function arrow(x1, y1, x2, y2, p = 1, color = C.accent, w = 10, head = 34) {
  if (p <= 0) return;
  const tip = trace([[x1, y1], [x2, y2]], p, color, w), a = Math.atan2(y2 - y1, x2 - x1), hs = head * clamp(p * 3 - 2);
  if (hs > 1) line([[tip[0] - Math.cos(a - 0.5) * hs, tip[1] - Math.sin(a - 0.5) * hs], tip, [tip[0] - Math.cos(a + 0.5) * hs, tip[1] - Math.sin(a + 0.5) * hs]], color, w);
}
/** an arc arrow around (x, y) from angle a0 to a1 (radians, clockwise if a1 > a0) */
export function arcArrow(x, y, r, a0, a1, p = 1, color = C.accent, w = 10) {
  if (p <= 0) return; const a = lerp(a0, a1, clamp(p));
  ctx.beginPath(); ctx.arc(x, y, r, a0, a, a1 < a0); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
  const dir = a1 > a0 ? 1 : -1, tx = x + Math.cos(a) * r, ty = y + Math.sin(a) * r, ta = a + dir * Math.PI / 2, hs = 30 * clamp(p * 3 - 2);
  if (hs > 1) line([[tx - Math.cos(ta - 0.5) * hs, ty - Math.sin(ta - 0.5) * hs], [tx, ty], [tx - Math.cos(ta + 0.5) * hs, ty - Math.sin(ta + 0.5) * hs]], color, w);
}
/** dashes flowing along a polyline (air, current, money): n dashes, speed in px/s */
export function flow(pts, t, n = 6, color = C.accent, speed = 260, dash = 46, w = 9, alpha = 1) {
  const L = plen(pts); ctx.save(); ctx.globalAlpha = alpha;
  for (let k = 0; k < n; k++) {
    const s0 = ((t * speed + k * L / n) % L), s1 = Math.min(L, s0 + dash);
    const at = (s) => { let acc = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc + d >= s) { const q = (s - acc) / (d || 1); return [lerp(pts[i - 1][0], pts[i][0], q), lerp(pts[i - 1][1], pts[i][1], q)]; } acc += d; } return pts[pts.length - 1]; };
    line([at(s0), at((s0 + s1) / 2), at(s1)], color, w);
  }
  ctx.restore();
}
/** a sine wave line (sound, heat shimmer, air) drawing on left to right */
export function wave(x, y, w, amp, freq, phase = 0, p = 1, color = C.line, lw = 6) {
  const pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([x + u * w, y + Math.sin(u * freq * TAU + phase) * amp]); }
  trace(pts, p, color, lw);
}

// ═════════════════════════ TEXT ═════════════════════════
/** KINETIC HEADLINE: "WHY *REVOLVING | *DOORS?" ("|" = new line, "*" = orange word). Words pop in one after another
 *  from t0 (stagger s apart), sliding up 40 px. lt = time in the shot. Returns the bottom y of the block. */
export function headline(str, x, y, size, lt, t0 = 0, stagger = 0.09, align = 'center') {
  const rows = str.split('|').map((r) => r.trim().split(/\s+/).filter(Boolean));
  ctx.save(); ctx.font = `900 ${size}px Inter`; ctx.letterSpacing = '-1px'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const sp = size * 0.28, lh = size * 1.08; let k = 0;
  rows.forEach((ws, r) => {
    const items = ws.map((w) => ({ t: w.replace(/^\*/, ''), hi: w.startsWith('*') }));
    items.forEach((it) => (it.w = ctx.measureText(it.t).width));
    const tw0 = items.reduce((a, it) => a + it.w, 0) + sp * (items.length - 1), fit = Math.min(1, 940 / tw0), tw = tw0 * fit;
    let cx = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
    const cy = y + r * lh;
    for (const it of items) {
      const p = seg(lt, t0 + k * stagger, t0 + k * stagger + 0.28); k++;
      if (p > 0) {
        const sc = lerp(0.85, 1, eob(p)) * fit;
        ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate(cx + it.w * fit / 2, cy + (1 - eo(p)) * 40); ctx.scale(sc, sc);
        ctx.fillStyle = it.hi ? C.accent : C.line; ctx.fillText(it.t, -it.w / 2, 0); ctx.restore();
      }
      cx += (it.w + sp) * fit;
    }
  });
  ctx.restore();
  return y + (rows.length - 1) * lh + size / 2;
}
/** a struck-through word: the text in dim, then an orange line slashes through it at p */
export function strike(str, x, y, size, p, color = C.dim) {
  text(str, x, y, size, color); ctx.save(); ctx.font = `900 ${size}px Inter`; const w = ctx.measureText(str).width; ctx.restore();
  trace([[x - w / 2 - 20, y + size * 0.1], [x + w / 2 + 20, y - size * 0.1]], p, C.accent, size * 0.12);
}
/** a label with a leader line: dot on the target (tx, ty), elbow line to (x, y), text after it. p draws it on. */
export function label(str, x, y, tx, ty, p = 1, accent = false, size = 44) {
  if (p <= 0) return; const col = accent ? C.accent : C.line;
  circle(tx, ty, 10 * eob(seg(p, 0, 0.3)), col);
  const right = x >= tx, ex = x + (right ? -16 : 16);
  trace([[tx, ty], [ex, y]], seg(p, 0.1, 0.6), col, 4);
  if (p > 0.55) { ctx.save(); ctx.globalAlpha = seg(p, 0.55, 0.9); text(str, x, y, size, col, right ? 'left' : 'right', 2); ctx.restore(); }
}
/** a number counting up to v at p (ease out), with a unit after it: counter(540, 600, 22, '°C', ...) */
export function counter(x, y, v, unit, size, p = 1, accent = true, decimals = 0) {
  const n = (v * eo(clamp(p))).toFixed(decimals);
  text(n + unit, x, y, size, accent ? C.accent : C.line);
}
/** a pill tag (orange outline, text inside) that pops in at s 0..1 */
export function tag(str, x, y, size, s = 1, filled = false) {
  if (s <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.font = `900 ${size}px Inter`; ctx.letterSpacing = '3px';
  const w = ctx.measureText(str).width + size * 1.2, h = size * 1.7;
  rr(-w / 2, -h / 2, w, h, h / 2); if (filled) { ctx.fillStyle = C.accent; ctx.fill(); } ctx.strokeStyle = C.accent; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = filled ? C.ink : C.accent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, 0, 2); ctx.restore();
}

// ═════════════════════════ DIAGRAM PARTS ═════════════════════════
/** a tall building in elevation: outline, floor lines, a door gap at the bottom centre. Origin = bottom centre. */
export function building(x, y, w, h, floors = 12, p = 1, color = C.line) {
  const L = x - w / 2, R = x + w / 2, T = y - h, dw = w * 0.22;
  trace([[x - dw / 2, y], [L, y], [L, T], [R, T], [R, y], [x + dw / 2, y]], seg(p, 0, 0.6), color, 8);
  for (let i = 1; i < floors; i++) { const fy = y - i * h / floors; trace([[L + 12, fy], [R - 12, fy]], seg(p, 0.35 + i * 0.03, 0.55 + i * 0.03), C.faint, 4); }
  trace([[L - 60, y], [R + 60, y]], seg(p, 0.5, 0.8), C.dim, 5);   // ground
}
/** plan view of a swing door in a wall: hinge at (x, y), leaf length s, angle 0 = closed (rad) */
export function swingDoor(x, y, s, ang, p = 1, accent = false) {
  trace([[x - 260, y], [x - 10, y]], p, C.line, 12); trace([[x + s + 10, y], [x + s + 260, y]], p, C.line, 12);
  if (p > 0.5) { const q = seg(p, 0.5, 1); ctx.save(); ctx.globalAlpha = q;
    ctx.setLineDash([10, 14]); ctx.beginPath(); ctx.arc(x, y, s, 0, Math.min(ang, Math.PI / 2) || 0.001); ctx.strokeStyle = C.faint; ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([]);
    line([[x, y], [x + Math.cos(ang) * s, y + Math.sin(ang) * s]], accent ? C.accent : C.line, 14); circle(x, y, 12, C.line); ctx.restore(); }
}
/** plan view of a revolving door: drum circle radius r, 4 wings rotated by rot; seal = 0..1 lights the wing tips orange */
export function revolvingDoor(x, y, r, rot, p = 1, seal = 0) {
  trace([[x - r - 250, y], [x - r - 6, y]], p, C.line, 12); trace([[x + r + 6, y], [x + r + 250, y]], p, C.line, 12);
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI + 0.35, -0.35); ctx.strokeStyle = C.line; ctx.lineWidth = 9; ctx.globalAlpha = clamp(p * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r, 0.35, Math.PI - 0.35); ctx.stroke(); ctx.globalAlpha = 1;
  const q = seg(p, 0.3, 1);
  for (let i = 0; i < 4; i++) { const a = rot + i * Math.PI / 2, ex = x + Math.cos(a) * (r - 8) * q, ey = y + Math.sin(a) * (r - 8) * q;
    line([[x, y], [ex, ey]], C.line, 12); if (seal > 0) circle(ex, ey, 14 * seal, C.accent); }
  circle(x, y, 16, C.line);
}
/** a thermometer: level 0..1 fills the column, accent for hot */
export function thermometer(x, y, s, level, p = 1, hot = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 2);
  rr(-26, -230, 52, 230, 26); ctx.strokeStyle = C.line; ctx.lineWidth = 8; ctx.stroke(); ring(0, 30, 48, 1, C.line, 8);
  const col = hot ? C.accent : C.dim; circle(0, 30, 34, col); const lv = 200 * clamp(level) * eo(p);
  rr(-12, -lv + 10, 24, lv + 10, 12); ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
/** vertical bars comparing values: items [{ label, v, accent }], max = the scale, p grows them */
export function bars(x, y, w, h, items, max, p = 1) {
  const n = items.length, bw = w / n * 0.5;
  trace([[x, y], [x + w, y]], seg(p, 0, 0.3), C.dim, 5);
  items.forEach((it, i) => {
    const cx = x + (i + 0.5) * w / n, bh = h * it.v / max * eo(seg(p, 0.2 + i * 0.15, 0.8 + i * 0.15));
    rr(cx - bw / 2, y - bh, bw, bh, 10); ctx.fillStyle = it.accent ? C.accent : C.faint; ctx.fill();
    if (!it.accent) { ctx.strokeStyle = C.line; ctx.lineWidth = 5; ctx.stroke(); }
    if (p > 0.3) text(it.label, cx, y + 56, 40, it.accent ? C.accent : C.line, 'center', 2);
  });
}
/** a line-art gear (teeth, hub) rotated by rot */
export function gear(x, y, r, teeth, rot, p = 1, color = C.line) {
  const pts = []; for (let i = 0; i < teeth * 4; i++) { const a = rot + i / (teeth * 4) * TAU, rr2 = (i % 4 < 2) ? r : r * 0.82; pts.push([x + Math.cos(a) * rr2, y + Math.sin(a) * rr2]); }
  trace(pts, p, color, 7, true); ring(x, y, r * 0.3, p, color, 7);
}
/** a minimal line-art person (side view). pose: 'stand' | 'push' (arms forward) | 'shrug'. Origin = feet. s 1 ≈ 420 px tall */
export function person(x, y, s, pose = 'stand', p = 1, color = C.line) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const q = (a, b) => seg(p, a, b);
  ring(0, -360, 44, q(0, 0.3), color, 9);
  trace([[0, -312], [0, -150]], q(0.2, 0.45), color, 10);
  trace([[0, -150], [-40, 0]], q(0.4, 0.6), color, 10); trace([[0, -150], [40, 0]], q(0.45, 0.65), color, 10);
  const arms = pose === 'push' ? [[[0, -270], [70, -230], [130, -250]], [[0, -270], [60, -215], [125, -225]]]
    : pose === 'shrug' ? [[[0, -270], [-70, -240], [-95, -300]], [[0, -270], [70, -240], [95, -300]]]
    : [[[0, -270], [-30, -190], [-36, -120]], [[0, -270], [30, -190], [36, -120]]];
  trace(arms[0], q(0.55, 0.8), color, 10); trace(arms[1], q(0.6, 0.85), color, 10);
  ctx.restore();
}
/** a chimney with smoke arrows rising (the stack effect icon) */
export function chimney(x, y, s, t, p = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  trace([[-60, 0], [-60, -220], [60, -220], [60, 0]], p, C.line, 9);
  for (let i = 0; i < 3; i++) { const ph = (t * 0.8 + i / 3) % 1; ctx.save(); ctx.globalAlpha = (1 - ph) * clamp(p * 2);
    arrow((i - 1) * 30, -240 - ph * 160, (i - 1) * 30 + Math.sin(ph * 6 + i) * 10, -300 - ph * 160, 1, C.accent, 8, 18); ctx.restore(); }
  ctx.restore();
}
/** a big question mark drawing on (the comment beat) */
export function questionMark(x, y, s, p = 1, color = C.accent) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const pts = []; for (let i = 0; i <= 24; i++) { const a = -Math.PI + i / 24 * 1.4 * Math.PI; pts.push([Math.cos(a) * 80, -60 + Math.sin(a) * 80]); }
  pts.push([0, 40], [0, 70]); trace(pts, seg(p, 0, 0.8), color, 26); if (p > 0.85) circle(0, 140, 18 * eob(seg(p, 0.85, 1)), color);
  ctx.restore();
}
/** a soft orange glow behind something important (the only "effect" this style allows) */
export function glow(x, y, r, a = 1) {
  if (a <= 0) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,138,31,${0.28 * a})`); g.addColorStop(1, 'rgba(255,138,31,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
