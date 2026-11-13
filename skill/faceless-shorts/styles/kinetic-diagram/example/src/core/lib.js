// Kinetic Diagram engine: canvas, palette, math and drawing primitives.
// Every drawing function in the kit uses the shared `ctx` exported here (set once by main.js).
export const W = 1080, H = 1920, FPS = 30;
export let ctx = null;
export function setCtx(c) { ctx = c; }

// The style sheet palette: a dark blueprint navy, white line art, ONE orange accent. Nothing else on screen.
export const C = {
  bg: '#0E1726', bgDeep: '#09101C', grid: '#172540', gridMajor: '#1E3052',
  line: '#F2F5F9', dim: '#7F90AB', faint: '#3A4D6D',
  accent: '#FF8A1F', accentDark: '#C9620A', accentGlow: '#FFB46B',
  ink: '#0E1726', white: '#FFFFFF',
};

// ---------- math ----------
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / ((b - a) || 1e-6));
export const eo = (t) => 1 - Math.pow(1 - t, 3);
export const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const eob = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const TAU = Math.PI * 2;

// ---------- primitives ----------
export function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
export function circle(x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
export function line(pts, color, w) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
export function fillAll(color) { ctx.fillStyle = color; ctx.fillRect(-300, -300, W + 600, H + 600); }
/** plain bold text (no outline: this style is clean line art), centred at x, y */
export function text(str, x, y, size, fill = C.line, align = 'center', spacing = 0) {
  ctx.save(); ctx.font = `900 ${size}px Inter`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.letterSpacing = spacing + 'px'; ctx.fillStyle = fill; ctx.fillText(str, x, y); ctx.restore();
}
