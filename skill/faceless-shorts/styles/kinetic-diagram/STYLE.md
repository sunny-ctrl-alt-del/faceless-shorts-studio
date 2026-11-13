# Kinetic Diagram: "how it really works" line-art explainers, 9:16

Calm, clever, satisfying. A dark blueprint-navy screen, thin white line drawings that **draw themselves on** while the
narrator explains, ONE orange accent for the thing that matters, and big kinetic headline words that pop in one by one.
Made for hidden mechanics (F12) and money machines (F3); learned from the HidbenMechanics look (dark slide, white line
art, orange key words), built entirely from our own parts. Example: `example/` = **WHY TALL BUILDINGS USE REVOLVING
DOORS** (35 s, 10 shots). Style sheet: `style-sheet.png`.

## 1. The look (do not break these)
- **Background:** navy `#0E1726` with a fine drifting grid and a soft vignette (`K.bg(t)`). Never another background.
- **Line art only:** white `#F2F5F9` strokes 6-12 px with round caps; secondary lines dim `#7F90AB`, construction
  lines faint `#3A4D6D`. No fills except the orange accent, bars and the cut flash.
- **ONE accent: orange `#FF8A1F`.** It marks the key thing of the shot (the warm air, the slam, the winner bar, the
  headline's key word, the caption's key word). If two things are orange, one of them is wrong.
- **Everything draws on.** Every component takes a progress `p` (0..1); drive it with `seg(lt, a, b)` so lines trace
  in on the beat the narrator says them. Nothing just appears except text pops.
- **Kinetic headline** (`K.headline`) on the hook, the key term and the twist: Inter Black 110-170 px, words pop in
  one after another, key word orange. A line that has a headline on screen gets `"nocap": true` (no double text).
- Glow (`K.glow`) only behind the one accent thing, soft. No other effects, no 3D, no photos.
- Mood: quiet confidence. Accurate mechanisms, explained simply.

## 2. Format
- 1080x1920, 30 fps, 25-45 s. Lead 0.4 s, outro 0.9 s.
- **Story shape:** the everyday question (headline) → "it's not X, it's Y" → the mechanism in 2-4 diagram shots →
  the consequence (what goes wrong without it) → the clever fix → the name of the effect (headline) → a twist/callback
  line → **the comment question** (orange question mark).
- One line = one shot = one cut, 2.5-5 s (diagrams need a little longer than cartoons). Cut flash is a soft blue-grey
  (not white), camera pushes in slowly (`zoom` 0.06-0.12).
- Narration: `am_michael` x1.0 (calm), or `bm_george` for a documentary feel. Conversational, flowing sentences.
- Music: `"bed"` (quiet); the mix is mastered to -14 LUFS by `pipeline.sh render` (the reference channel is too quiet).

## 3. Captions
Same syntax as every style: `"caps": "WARM AIR *RISES | LIKE A *CHIMNEY"`. Inter Black 124 px, white on a navy
outline, the `*` word orange, centred at y 1420. `"nocap": true` on a line hides its captions (use it when the line's
words are the on-screen headline). Phone-safe: nothing important above y 300, below y 1500, or under the right-side
buttons (x > 940, y 900-1700).

## 4. Engine map (`example/`)
Same as Inside Out: `script.json`, `src/shots.js` (the per-video file), `src/core/kit.js` (components),
`src/core/lib.js` (palette `C`, math, `text()`), `timing.js` (`L Le Wd`), `captions.js`, `main.js`, `tools/capture.mjs`,
`tools/mix.py` (cue types: whoosh slide pop plop gulp boing bubbles sizzle sparkle thud slam tock zip alarm).

## 5. The component zoo (`kit.js`, `import * as K`)
**Background** `K.bg(t, grid=1)`.
**Line art (draws on)** `K.trace(pts, p, color, w, close)` → returns the pen tip · `K.box(x, y, w, h, p)` ·
`K.ring(x, y, r, p)` · `K.arrow(x1, y1, x2, y2, p, color, w, head)` · `K.arcArrow(x, y, r, a0, a1, p)` ·
`K.flow(pts, t, n, color, speed, dash, w, alpha)` (dashes streaming along a path: air, current, money, traffic) ·
`K.wave(x, y, w, amp, freq, phase, p)`.
**Text** `K.headline('WHY *REVOLVING | *DOORS?', x, y, size, lt, t0, stagger)` (auto-fits 940 px) ·
`K.strike('STYLE', x, y, size, p)` (dim word, orange slash) · `K.label(text, x, y, tx, ty, p, accent, size)` (dot on the
target + leader line; text goes on the side of x) · `K.counter(x, y, v, unit, size, p)` (counts up) ·
`K.tag(text, x, y, size, scale, filled)` (orange pill) · `text(str, x, y, size, color, align)` (lib).
**Diagram parts** `K.building(x, yBase, w, h, floors, p)` · `K.swingDoor(hx, hy, len, angle, p, accent)` (plan view) ·
`K.revolvingDoor(x, y, r, rot, p, seal)` (plan view) · `K.thermometer(x, y, s, level, p, hot)` ·
`K.bars(x, yBase, w, h, [{label, v, accent}], max, p)` · `K.gear(x, y, r, teeth, rot, p)` ·
`K.person(x, yFeet, s, 'stand'|'push'|'shrug', p)` (line-art person, ~420 px tall at s 1) · `K.chimney(x, y, s, t, p)` ·
`K.questionMark(x, y, s, p)` · `K.glow(x, y, r, a)`.
New topic = new diagram parts in the same grammar: line art with a `p` argument, white + one orange, round caps.
Phones, batteries, queues, money flows, ice crystals: draw them as outlines that trace in.

## 6. A shot
```js
const st = cut(3), hard = Wd('hard', 3) - st;
add({ id: 'S04', at: st, cam: [600, 900], zoom: 0.12, note: 'cold air pulled in, SUCTION on "hard"',
  draw(lt, d, t) {
    K.bg(t);
    K.trace([[120, 360], [120, 1100], [420, 1100]], seg(lt, 0, 0.5));            // the wall draws on
    K.flow([[1100, 920], [560, 980], [200, 1040]], t, 3, C.line, lt > hard ? 520 : 300);
    K.tag('SUCTION', 640, 620, 56, lt > hard ? eob(seg(lt, hard, hard + 0.3)) : 0, true);
  } });
cue(st, 'whoosh'); cue(st + hard, 'thud');
```
Keep diagrams between y 330 and 1250 (captions sit at 1330-1510).

## 7. QA pitfalls
- A headline wider than the screen → `K.headline` fits rows to 940 px; keep rows to ~12 characters anyway.
- Labels running off the right edge → put the text on the side with room (`x` < `tx` puts it on the left).
- Two orange things in one shot → make one of them dim.
- Everything drawn at once → stagger the `seg()` windows so the drawing follows the narration.
- Long static holds → a `flow`, a rotating part or a slow `zoom` keeps every shot alive.
