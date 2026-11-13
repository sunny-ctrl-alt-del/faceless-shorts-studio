// Doodle Cartoon engine: canvas, palette, math and drawing primitives.
// Every drawing function in the kit uses the shared `ctx` exported here (set once by main.js).
export const W = 1080, H = 1920, FPS = 30;
export let ctx = null;
export function setCtx(c) { ctx = c; }

// Flat pastel sets, saturated characters, ONE thick ink outline on everything (the doodle look).
export const C = {
  ink: '#1E1B22', white: '#FFFFFF', yellow: '#FFD23F', red: '#EF5B5B', blue: '#3B8EEA', green: '#57C27A',
  // sets
  mint: '#BDE8D5', mintDark: '#A3D9C2', butter: '#FCE6A4', butterDark: '#F2D27D', lilac: '#D8CCF2', lilacDark: '#C3B3E8',
  peach: '#FFD3BA', sky: '#AEDCF7', floor: '#E9C9A0', floorDark: '#D9B385', wood: '#B57A4C', woodDark: '#965F37',
  night: '#3A3963', nightDark: '#2C2B4F', street: '#9AA3B5', streetDark: '#858EA2', marquee: '#E64C5A',
  // people
  skin1: '#F6C9A4', skin1d: '#E3AE86', skin2: '#C68B5E', skin2d: '#A9714A', skin3: '#8D5A3B', skin3d: '#744631',
  hairBrown: '#6B3F22', hairBlack: '#231C1F', hairBlond: '#F1C45B', hairGrey: '#A9A6AE',
  hoodie: '#FF8B3D', hoodieD: '#E06F22', purple: '#8E6BE0', purpleD: '#7354C5', teal: '#2FB3A8', tealD: '#21948A',
  jeans: '#3E5C9A', jeansD: '#30497E', mouth: '#7A2E35', tongue: '#F07C82', cheek: '#FF9CA0',
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

// ---------- primitives (fill + the ink outline) ----------
export const LW = 11;                                  // the one outline width (scaled with the drawing)
export function ink(fill, lw = LW) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
export function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
export function circle(x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
export function ell(x, y, rx, ry, fill, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
export function line(pts, color, w) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
export function fillAll(color) { ctx.fillStyle = color; ctx.fillRect(-300, -300, W + 600, H + 600); }
/** outlined bold text (the cartoon look), centred at x, y */
export function bigText(text, x, y, size, fill = C.white, rot = 0, sc = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.font = `900 ${size}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.2; ctx.strokeStyle = C.ink; ctx.strokeText(text, 0, 0); ctx.fillStyle = fill; ctx.fillText(text, 0, 0);
  ctx.restore();
}
