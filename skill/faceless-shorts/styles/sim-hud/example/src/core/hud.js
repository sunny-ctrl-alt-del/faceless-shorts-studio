// Sim HUD: the 2D heads-up display drawn OVER the 3D frame. Clean, technical, readable at phone size:
// white text, ONE teal accent (#5EEAD4), amber for warnings, red only for danger. Panels are dark glass with a thin edge.
// Everything stays in the phone-safe area: x 40-1040 (right side buttons: keep x < 930 between y 900 and 1700),
// y 320-1300 (captions sit at 1360-1480).
import { ctx, clamp, lerp, seg, eo, eob } from './lib.js';

export const HUD = { teal: '#5EEAD4', amber: '#FFC24B', red: '#FF5A5A', white: '#FFFFFF', dim: 'rgba(255,255,255,0.62)', glass: 'rgba(6,12,22,0.58)', edge: 'rgba(94,234,212,0.55)' };
const font = (px, w = 900) => `${w} ${px}px Inter`;

/** the simulation frame: thin corner marks, a faint scanline texture and the "SIM" tag. a = alpha */
export function frame(t, a = 1) {
  ctx.save(); ctx.globalAlpha = a * 0.9; ctx.strokeStyle = HUD.white; ctx.lineWidth = 5; ctx.lineCap = 'square';
  const m = 40, L = 70, y0 = 320, y1 = 1300;
  for (const [x, y, dx, dy] of [[m, y0, 1, 1], [1080 - m, y0, -1, 1], [m, y1, 1, -1], [1080 - m, y1, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y); ctx.lineTo(x + dx * L, y); ctx.stroke(); }
  ctx.globalAlpha = a * 0.05; ctx.fillStyle = '#FFFFFF'; for (let y = 0; y < 1920; y += 6) ctx.fillRect(0, y, 1080, 1);
  ctx.globalAlpha = a; ctx.font = font(30, 800); ctx.fillStyle = HUD.teal; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '4px';
  ctx.fillText('● SIM', 1080 - m - 4, y0 + 36 + (Math.sin(t * 4) > 0 ? 0 : 0)); ctx.restore();
}
/** the mission clock: "T+00:42.6". secs = simulated time. x, y = top-left */
export function clock(secs, x = 64, y = 360, size = 92, a = 1) {
  if (a <= 0) return; const s = Math.max(0, secs), mm = Math.floor(s / 60), ss = s - mm * 60;
  const str = `T+${String(mm).padStart(2, '0')}:${ss.toFixed(1).padStart(4, '0')}`;
  ctx.save(); ctx.globalAlpha = a; ctx.font = font(size); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.letterSpacing = '2px';
  ctx.lineWidth = size * 0.16; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); ctx.fillStyle = HUD.white; ctx.fillText(str, x, y); ctx.restore();
}
/** a readout panel: small label on top, big number + unit. w = panel width. p 0..1 slides it in. */
export function readout(label, value, unit, x, y, w = 420, p = 1, col = HUD.white, size = 84) {
  if (p <= 0) return; ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate(lerp(-60, 0, eo(p)), 0);
  const h = size * 1.75; ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.fillStyle = HUD.glass; ctx.fill(); ctx.strokeStyle = HUD.edge; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = HUD.teal; ctx.fillRect(x, y + 18, 6, h - 36);
  ctx.font = font(30, 800); ctx.letterSpacing = '4px'; ctx.fillStyle = HUD.dim; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(label, x + 30, y + 18);
  ctx.font = font(size); ctx.letterSpacing = '0px'; ctx.fillStyle = col; ctx.textBaseline = 'alphabetic'; const vw = ctx.measureText(value).width; ctx.fillText(value, x + 30, y + h - 22);
  ctx.font = font(size * 0.42, 800); ctx.fillStyle = HUD.dim; ctx.fillText(unit, x + 40 + vw, y + h - 26);
  ctx.restore();
}
/** a horizontal progress bar with a label and a % on the right */
export function bar(label, frac, x, y, w = 600, p = 1, col = HUD.teal) {
  if (p <= 0) return; ctx.save(); ctx.globalAlpha = clamp(p * 2);
  ctx.font = font(30, 800); ctx.letterSpacing = '4px'; ctx.fillStyle = HUD.dim; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(label, x, y - 12);
  ctx.textAlign = 'right'; ctx.fillStyle = HUD.white; ctx.fillText(Math.round(clamp(frac) * 100) + '%', x + w, y - 12);
  ctx.beginPath(); ctx.roundRect(x, y, w, 22, 11); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
  ctx.beginPath(); ctx.roundRect(x, y, Math.max(22, w * clamp(frac) * eo(p)), 22, 11); ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
/** vertical altitude ruler on the LEFT edge: ticks every `step`, a marker at `value` (with its number) */
export function ruler(value, max, x = 70, yTop = 470, yBot = 1240, step = 50, unit = 'M', a = 1, marks = []) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, yBot); ctx.stroke();
  const Y = (v) => lerp(yBot, yTop, v / max);
  ctx.font = font(24, 800); ctx.fillStyle = HUD.dim; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (let v = 0; v <= max; v += step) { const big = v % (step * 2) === 0; ctx.beginPath(); ctx.moveTo(x, Y(v)); ctx.lineTo(x + (big ? 26 : 14), Y(v)); ctx.stroke(); if (big) ctx.fillText(String(v), x + 32, Y(v)); }
  for (const mk of marks) { ctx.fillStyle = mk.col || HUD.amber; ctx.fillRect(x - 10, Y(mk.v) - 2, 50, 4); ctx.font = font(24, 800); ctx.fillText(mk.label, x + 46, Y(mk.v) - 18); }
  const yv = Y(clamp(value, 0, max)); ctx.fillStyle = HUD.teal; ctx.beginPath(); ctx.moveTo(x - 4, yv); ctx.lineTo(x + 30, yv - 18); ctx.lineTo(x + 30, yv + 18); ctx.closePath(); ctx.fill();
  ctx.font = font(34); ctx.fillStyle = HUD.white; ctx.fillText(Math.round(value) + ' ' + unit, x + 40, yv); ctx.restore();
}
/** targeting brackets around a screen rectangle (x, y = centre). p 0..1 closes them in. */
export function brackets(x, y, w, h, p = 1, col = HUD.teal, label = '') {
  if (p <= 0) return; const k = lerp(1.5, 1, eo(p)); w *= k; h *= k;
  ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.strokeStyle = col; ctx.lineWidth = 6; const L = Math.min(w, h) * 0.22;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const cx = x + sx * w / 2, cy = y + sy * h / 2; ctx.beginPath(); ctx.moveTo(cx, cy - sy * L); ctx.lineTo(cx, cy); ctx.lineTo(cx - sx * L, cy); ctx.stroke(); }
  if (label) { ctx.font = font(34, 800); ctx.letterSpacing = '3px'; ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(label, x - w / 2, y - h / 2 - 14); }
  ctx.restore();
}
/** a point marker with a leader to a label (for things in the 3D frame: project with screen()) */
export function marker(text, tx, ty, lx, ly, p = 1, col = HUD.amber) {
  if (p <= 0) return; ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(tx, ty, 12 * eob(clamp(p * 1.5)), 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(lerp(tx, lx, eo(p)), lerp(ty, ly, eo(p))); ctx.stroke();
  if (p > 0.5) { ctx.font = font(40); ctx.letterSpacing = '2px'; ctx.textAlign = lx > tx ? 'left' : 'right'; ctx.textBaseline = 'middle'; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(text, lx + (lx > tx ? 12 : -12), ly); ctx.fillText(text, lx + (lx > tx ? 12 : -12), ly); }
  ctx.restore();
}
/** a flashing alert tag (amber by default): "EARS POP" */
export function alert(text, x, y, t, p = 1, col = HUD.amber) {
  if (p <= 0) return; ctx.save(); ctx.translate(x, y); const s = eob(clamp(p)); ctx.scale(s, s); ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 10);
  ctx.font = font(52); ctx.letterSpacing = '4px'; const w = ctx.measureText('▲ ' + text).width + 60;
  ctx.beginPath(); ctx.roundRect(-w / 2, -48, w, 96, 14); ctx.fillStyle = 'rgba(20,12,0,0.6)'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▲ ' + text, 0, 3); ctx.restore();
}
/** a big centred title in HUD type (the hook / the result) */
export function title(text, x, y, size, p = 1, col = HUD.white) {
  if (p <= 0) return; ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate(x, y + (1 - eo(p)) * 30); ctx.font = font(size); ctx.letterSpacing = '2px';
  const w = ctx.measureText(text).width, k = Math.min(1, 940 / w); ctx.scale(k, k); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = size * 0.16; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.strokeText(text, 0, 0); ctx.fillStyle = col; ctx.fillText(text, 0, 0); ctx.restore();
}
