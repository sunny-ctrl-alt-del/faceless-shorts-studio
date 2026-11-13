// News Desk: the COMPONENT ZOO. A clean newsroom look on newsprint paper: a black masthead with a red label, ranked
// story cards that slide in, big red numbers, map pins (never real borders or country outlines), a scrolling ticker,
// story-progress dots and a question card. All sizes in 1080x1920 px. Every component takes a progress p (0..1).
// Phone-safe: masthead at y 300, ticker at y 1430-1494, nothing important below 1500 or under the right buttons.
import { ctx, C, W, H, TAU, lerp, clamp, seg, eo, eio, eob, rnd, rr, circle, line, text } from './lib.js';

const FONT = (s, w = 900) => `${w} ${s}px Inter`;

/** newsprint paper: a fine graticule, abstract dot fields that drift slowly, a soft vignette */
export function bg(t = 0) {
  ctx.fillStyle = C.bg; ctx.fillRect(-300, -300, W + 600, H + 600);
  ctx.strokeStyle = C.grid; ctx.lineWidth = 2;
  for (let x = -120; x <= W + 120; x += 120) { ctx.beginPath(); ctx.moveTo(x, -300); ctx.lineTo(x, H + 300); ctx.stroke(); }
  for (let y = -120; y <= H + 120; y += 120) { ctx.beginPath(); ctx.moveTo(-300, y); ctx.lineTo(W + 300, y); ctx.stroke(); }
  ctx.fillStyle = C.dots; const dx = (t * 5) % 26;
  for (let i = 0; i < 5; i++) {
    const cx = rnd(i + 1) * W, cy = 420 + rnd(i + 11) * 1000, rx = 140 + rnd(i + 21) * 170, ry = 90 + rnd(i + 31) * 130;
    for (let y = cy - ry; y < cy + ry; y += 26) for (let x = cx - rx; x < cx + rx; x += 26) {
      const k = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + 0.22 * Math.sin(x * 0.021 + i) * Math.cos(y * 0.027 + i);
      if (k < 1) { ctx.beginPath(); ctx.arc(x + dx, y, 4.5, 0, TAU); ctx.fill(); }
    }
  }
  const g = ctx.createRadialGradient(540, 960, 500, 540, 960, 1250); g.addColorStop(0, 'rgba(60,45,25,0)'); g.addColorStop(1, 'rgba(60,45,25,0.13)');
  ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
}

/** black masthead bar with a red label block (left) and a date/edition line (right); slides down from above */
export function masthead(label, right, p = 1, y = 300) {
  if (p <= 0) return; const k = eo(clamp(p)); ctx.save(); ctx.translate(0, -(1 - k) * 110);
  ctx.fillStyle = C.ink; ctx.fillRect(0, y, W, 78);
  ctx.font = FONT(40); ctx.letterSpacing = '5px'; const lw = ctx.measureText(label).width + 56; ctx.letterSpacing = '0px';
  ctx.fillStyle = C.accent; ctx.fillRect(40, y, lw, 78); text(label, 40 + lw / 2 + 2, y + 41, 40, C.white, 'center', 5);
  text(right, W - 44, y + 41, 30, C.white, 'right', 3);
  ctx.restore();
}

/** story-progress dots: n dots, the first `done` filled red, the current one bigger */
export function progress(cur, n, x, y, p = 1) {
  if (p <= 0) return; ctx.save(); ctx.globalAlpha = clamp(p * 2);
  for (let i = 0; i < n; i++) {
    const cx = x + i * 38, on = i <= cur, r = i === cur ? 13 : 9;
    ctx.beginPath(); ctx.arc(cx, y, r, 0, TAU);
    if (on) { ctx.fillStyle = C.accent; ctx.fill(); } else { ctx.lineWidth = 4; ctx.strokeStyle = C.dim; ctx.stroke(); }
  }
  ctx.restore();
}

/** a huge ranked number ("5"), flips in on its horizontal axis; small "NO." above it */
export function rank(n, x, y, size = 230, p = 1) {
  if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(1, Math.max(0.01, eob(clamp(p)))); ctx.globalAlpha = clamp(p * 3);
  text('NO.', 0, -size * 0.62, size * 0.17, C.dim, 'center', 4);
  text(String(n), 0, 0, size, C.accent, 'center', -6);
  ctx.restore();
}

/** a white story card with a red left stripe and a soft shadow; slides in from the right */
export function card(x, y, w, h, p = 1, stripe = C.accent) {
  if (p <= 0) return; const off = (1 - eo(clamp(p))) * (W - x + 40);
  ctx.save(); ctx.translate(off, 0);
  ctx.shadowColor = 'rgba(40,30,15,0.22)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  rr(x, y, w, h, 18); ctx.fillStyle = C.paper; ctx.fill(); ctx.shadowColor = 'transparent';
  rr(x, y, 16, h, 8); ctx.fillStyle = stripe; ctx.fill();
  ctx.restore();
}

/** a small category pill (black, white letters); pops in */
export function tag(str, x, y, p = 1, fill = C.ink) {
  if (p <= 0) return; ctx.save(); ctx.font = FONT(30); ctx.letterSpacing = '4px'; const w = ctx.measureText(str).width + 44; ctx.letterSpacing = '0px';
  ctx.translate(x + w / 2, y); ctx.scale(eob(clamp(p)), eob(clamp(p)));
  rr(-w / 2, -26, w, 52, 26); ctx.fillStyle = fill; ctx.fill(); text(str, 2, 2, 30, C.white, 'center', 4);
  ctx.restore();
}

/** wrapped headline text, revealed word by word (reveal 0..1). "*word" = red. Returns the number of lines. */
export function wrap(str, x, y, maxW, size, reveal = 1, lh = 1.18, color = C.ink, align = 'left') {
  ctx.save(); ctx.font = FONT(size); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const words = str.split(/\s+/).filter(Boolean).map((w) => ({ t: w.replace(/^\*/, ''), hi: w.startsWith('*') }));
  const sp = ctx.measureText(' ').width, lines = []; let cur = [], cw = 0;
  for (const w of words) { w.w = ctx.measureText(w.t).width; if (cur.length && cw + sp + w.w > maxW) { lines.push(cur); cur = []; cw = 0; } cw += (cur.length ? sp : 0) + w.w; cur.push(w); }
  if (cur.length) lines.push(cur);
  const shown = Math.ceil(words.length * clamp(reveal)); let k = 0;
  lines.forEach((ln, li) => {
    const lw = ln.reduce((a, w) => a + w.w, 0) + sp * (ln.length - 1); let xx = align === 'center' ? x - lw / 2 : x;
    for (const w of ln) { if (k++ < shown) { ctx.fillStyle = w.hi ? C.accent : color; ctx.fillText(w.t, xx, y + li * size * lh); } xx += w.w + sp; }
  });
  ctx.restore(); return lines.length;
}

/** a big number that counts up (fmt turns the current value into text), red by default */
export function counter(value, fmt, x, y, size, p = 1, color = C.accent, align = 'left') {
  if (p <= 0) return; text(fmt(value * eo(clamp(p))), x, y, size, color, align, -2);
}

/** a red map pin that drops in, with a shadow */
export function pin(x, y, s = 1, p = 1, fill = C.accent) {
  if (p <= 0) return; const k = clamp(p); ctx.save(); ctx.translate(x, y - (1 - eob(k)) * 140); ctx.scale(s, s); ctx.globalAlpha = clamp(k * 3);
  ctx.beginPath(); ctx.ellipse(0, 3 + (1 - eob(k)) * 140 / s, 20, 6, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill();
  const th = Math.acos(36 / 60); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, -60, 36, Math.PI / 2 + th, Math.PI / 2 - th + TAU); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -60, 14, 0, TAU); ctx.fillStyle = C.paper; ctx.fill(); ctx.restore();
}
/** radar rings around a pin's tip (t = film time) */
export function ping(x, y, t, a = 1) {
  if (a <= 0) return; ctx.save(); ctx.lineWidth = 5;
  for (let i = 0; i < 3; i++) { const k = ((t * 0.8 + i / 3) % 1); ctx.strokeStyle = `rgba(224,37,27,${0.5 * (1 - k) * a})`; ctx.beginPath(); ctx.ellipse(x, y, 30 + k * 120, (30 + k * 120) * 0.3, 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
}

/** the ticker: a black band with a red label and headlines scrolling right to left (t = film time) */
export function ticker(items, t, label = 'TODAY', y = 1430, p = 1) {
  if (p <= 0) return; ctx.save(); ctx.translate(0, (1 - eo(clamp(p))) * 120);
  ctx.fillStyle = C.ink; ctx.fillRect(0, y, W, 64);
  const str = items.join('   •   ') + '   •   '; ctx.font = FONT(30, 800); ctx.letterSpacing = '2px'; const sw = ctx.measureText(str).width;
  ctx.save(); ctx.beginPath(); ctx.rect(200, y, W - 200, 64); ctx.clip(); ctx.fillStyle = C.white; ctx.textBaseline = 'middle';
  const off = (t * 140) % sw; for (let x = 220 - off; x < W; x += sw) ctx.fillText(str, x, y + 34);
  ctx.restore(); ctx.letterSpacing = '0px';
  ctx.fillStyle = C.accent; ctx.fillRect(0, y, 200, 64); text(label, 100, y + 34, 30, C.white, 'center', 4);
  ctx.restore();
}

/** a small grey chip under a story: "Reported by: …" (optional) */
export function source(str, x, y, p = 1) {
  if (p <= 0) return; ctx.save(); ctx.globalAlpha = clamp(p * 2); text(str, x, y, 26, C.dim, 'left', 1); ctx.restore();
}

/** big headline: lines split by "|", words pop in one by one, "*word" red, centred */
export function headline(str, x, y, size, lt, t0 = 0, step = 0.12) {
  const lines = str.split('|').map((s) => s.trim()); let k = 0;
  lines.forEach((ln, li) => {
    ctx.save(); ctx.font = FONT(size); ctx.letterSpacing = '-2px';
    const ws = ln.split(/\s+/).map((w) => ({ t: w.replace(/^\*/, ''), hi: w.startsWith('*') })), sp = size * 0.26;
    ws.forEach((w) => (w.w = ctx.measureText(w.t).width));
    let total = ws.reduce((a, w) => a + w.w, 0) + sp * (ws.length - 1); const fit = Math.min(1, 960 / total);
    let xx = x - total * fit / 2; const yy = y + li * size * 1.08;
    for (const w of ws) {
      const p = seg(lt, t0 + k * step, t0 + k * step + 0.22); k++;
      if (p > 0) { ctx.save(); ctx.translate(xx + w.w * fit / 2, yy); ctx.scale(fit * eob(p), fit * eob(p)); ctx.fillStyle = w.hi ? C.accent : C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(w.t, 0, 0); ctx.restore(); }
      xx += (w.w + sp) * fit;
    }
    ctx.restore();
  });
}

/** simple line icons (ink + one red part), drawn on with p: train, bridge, people, ruler, route, chart, rupee, globe */
export function icon(name, x, y, s = 1, p = 1) {
  if (p <= 0) return; const k = eo(clamp(p)); ctx.save(); ctx.translate(x, y); ctx.scale(s * lerp(0.6, 1, k), s * lerp(0.6, 1, k)); ctx.globalAlpha = clamp(p * 2);
  ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = C.ink;
  const st = () => ctx.stroke();
  if (name === 'train') {
    rr(-90, -70, 180, 120, 26); st(); rr(-66, -48, 56, 40, 8); st(); rr(10, -48, 56, 40, 8); st();
    for (const wx of [-50, 50]) { ctx.beginPath(); ctx.arc(wx, 66, 16, 0, TAU); ctx.fillStyle = C.accent; ctx.fill(); }
    line([[-110, 96], [110, 96]], C.ink, 8);
  } else if (name === 'bridge') {
    ctx.beginPath(); ctx.moveTo(-120, 60); ctx.quadraticCurveTo(0, -110, 120, 60); ctx.strokeStyle = C.accent; st();
    line([[-130, -10], [130, -10]], C.ink, 10); for (const bx of [-60, 0, 60]) line([[bx, -10], [bx, bx === 0 ? -25 : 10]], C.ink, 6);
    line([[-130, 80], [130, 80]], C.dim, 6);
  } else if (name === 'people') {
    [[-60, 10, C.ink], [60, 10, C.ink], [0, -10, C.accent]].forEach(([px, py, col]) => { ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(px, py - 40, 24, 0, TAU); st(); ctx.beginPath(); ctx.arc(px, py + 40, 44, Math.PI, 0); st(); });
  } else if (name === 'ruler') {
    rr(-130, -26, 260, 52, 8); st(); for (let i = 0; i <= 10; i++) line([[-110 + i * 22, -26], [-110 + i * 22, i % 5 ? -8 : 4]], i === 10 ? C.accent : C.ink, 6);
  } else if (name === 'route') {
    ctx.setLineDash([18, 14]); ctx.beginPath(); ctx.moveTo(-110, 60); ctx.bezierCurveTo(-40, -80, 40, 100, 110, -50); ctx.strokeStyle = C.accent; st(); ctx.setLineDash([]);
    circle(-110, 60, 16, C.ink); circle(110, -50, 16, C.ink);
  } else if (name === 'chart') {
    line([[-110, 80], [120, 80]], C.ink, 8); [[-80, 40], [-20, 80], [40, 120], [100, 170]].forEach(([bx, bh], i) => { rr(bx - 20, 80 - bh, 40, bh, 6); ctx.fillStyle = i === 3 ? C.accent : C.faint; ctx.fill(); });
  } else if (name === 'rupee') {
    ctx.beginPath(); ctx.arc(0, 0, 86, 0, TAU); st(); text('₹', 0, 6, 110, C.accent, 'center');
  } else if (name === 'globe') {
    ctx.beginPath(); ctx.arc(0, 0, 86, 0, TAU); st(); ctx.beginPath(); ctx.ellipse(0, 0, 40, 86, 0, 0, TAU); st(); line([[-86, 0], [86, 0]], C.ink, 6);
    ctx.beginPath(); ctx.ellipse(0, -40, 74, 14, 0, 0, TAU); ctx.strokeStyle = C.dim; ctx.lineWidth = 5; st();
  }
  ctx.restore();
}

/** the end card: a red box with the comment question and answer chips (e.g. 1-5) */
export function question(q, chips, p = 1, t = 0) {
  if (p <= 0) return; const k = eob(clamp(p)); ctx.save(); ctx.translate(540, 900); ctx.scale(k, k); ctx.globalAlpha = clamp(p * 3);
  ctx.shadowColor = 'rgba(40,30,15,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; rr(-470, -260, 940, 520, 28); ctx.fillStyle = C.accent; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.restore(); ctx.save(); ctx.translate(540, 900); ctx.scale(k, k); ctx.globalAlpha = clamp(p * 3);
  wrap(q.replace(/\*/g, ''), 0, -150, 820, 74, 1, 1.15, C.white, 'center');
  const n = chips.length, cw = 120, gap = 36, x0 = -((n * cw + (n - 1) * gap) / 2) + cw / 2;
  chips.forEach((c, i) => { const bob = Math.sin(t * 4 + i) * 6; rr(x0 + i * (cw + gap) - cw / 2, 110 + bob, cw, cw, 24); ctx.fillStyle = C.paper; ctx.fill(); text(c, x0 + i * (cw + gap), 112 + cw / 2 + bob, 72, C.ink, 'center'); });
  ctx.restore();
}
