# Sim HUD 3D: "the next 60 seconds" simulations with a live heads-up display, 9:16

Tense, precise, hypnotic. Clean realistic 3D (glass, city lights, dusk haze) seen like a simulation camera, under a
HUD: a running **T+ clock**, readout panels whose numbers change every frame, an altitude/depth ruler, progress bars,
targeting brackets and amber alerts. Every number comes from ONE model, so the readouts always agree. Made for
next-60-seconds timelines (F14), what-if rules (F4) and look-alike showdowns (F15); learned from the Sized Understood
look (sim footage + readouts + a T+ clock), built entirely from our own parts. Example: `example/` = **THE 60-SECOND
ELEVATOR RIDE UP THE WORLD'S TALLEST BUILDING** (35 s, 9 shots). Style sheet: `style-sheet.png`.

## 1. The look (do not break these)
- **3D:** the Deep Dive engine (three.js, ACES, bloom, soft shadows) with big-scale sets in `world.js` (1 unit = 10 m),
  no depth of field (`aperture: 0`: simulations are sharp), mild bloom for lights, haze/fog for scale.
- **HUD palette:** white text, ONE accent **teal `#5EEAD4`** (the live value that matters), **amber `#FFC24B`** for
  warnings and reference marks (EIFFEL 330 M), red `#FF5A5A` only for real danger. Panels are dark glass with a thin
  teal edge. Inter Black numbers, wide letter-spacing on small labels.
- **The clock never stops**: `HUDK.clock(simAt(t))` from the second line to the end. Map narration time to sim time
  with keyframes (`KEY` in shots.js), so the clock can compress dull stretches ("40 seconds in…").
- **One model drives every readout** (the example's `alt(s)`, `speed(s)`, `PRESS(m)`); never type a number into a
  panel that the model doesn't produce. Say in `script.json` "sources" that it's a simple model, and keep it honest.
- Camera always moves (orbits, rides along, slow push). Mood: calm narrator, rising tension, a satisfying final number.

## 2. Format
- 1080x1920, 30 fps, 30-50 s. Lead 0.4 s, outro 0.9 s. Music `"tension"`.
- **Story shape:** the setting (brackets lock onto the subject) → "here are the next 60 seconds" (clock appears) →
  3-5 beats, each a readout changing (speed, altitude, pressure, temperature, distance) → a reference comparison
  (an amber ring/mark: "higher than the Eiffel Tower") → the body/feeling beat (alert: EARS POP) → the result (big
  number title) → **the comment question** (brackets on the scary view).
- One line = one shot, 2.5-5 s. Narration `am_michael` x1.0 (or `bm_george`).

## 3. Captions
Same syntax as every style; Inter Black 116 px, white with a dark outline, the `*` word teal, at y 1420.
`"nocap": true` hides a line's captions when the HUD title already says it. **Phone-safe HUD:** everything between
y 320 and 1300 (the frame's corner marks show the box), readouts on the right at x 560-1000 above y 900, the ruler
on the LEFT edge; nothing at x > 930 between y 900 and 1700 (YouTube's buttons).

## 4. Engine map (`example/`)
Deep Dive's engine (`engine.js`, `sdf.js`, `human.js`, `sets.js` for people/rooms if a sim needs a person) plus:
| file | gives you |
|---|---|
| `src/core/world.js` | `simCamera(fov)` (far plane 4 km) · `skyDome()` · `city(E)` → `{ scene, tower, cab, setCab(m), ring(m, colour) }` |
| `src/core/hud.js` | the HUD components below (`import * as HUDK`, palette `HUDK.HUD`) |
| `src/shots.js` | the per-video file: the model, `KEY` (film → sim time), the shots |
A shot renders 3D (`E.render(scene, cam, LOOK)`), calls `blit()`, then draws the HUD. `screen(V3, cam)` projects a 3D
point to the canvas for markers and brackets.

## 5. HUD components (`hud.js`)
`frame(t)` (corner marks + scanlines + ● SIM) · `clock(secs, x, y, size, a)` ("T+00:42.6") ·
`readout(label, value, unit, x, y, w, p, colour, size)` (dark glass panel, small label, big number) ·
`bar(label, frac, x, y, w, p, colour)` · `ruler(value, max, x, yTop, yBot, step, unit, a, [{ v, label }])` (left
edge) · `brackets(cx, cy, w, h, p, colour, label)` · `marker(text, tx, ty, lx, ly, p, colour)` (leader to a 3D
point) · `alert(text, x, y, t, p, colour)` (flashing ▲ tag) · `title(text, x, y, size, p, colour)` (big centred).
New topics = new worlds in `world.js` in the same realism: ocean column (depth ruler, pressure), runway + plane
(speed, altitude), skydive (terminal velocity), car crash test (ms clock), space capsule (heat, g-force).

## 6. QA pitfalls
- A readout that disagrees with another (altitude vs time vs speed) → compute everything from the model.
- The camera inside a building or the subject → keep a clear radius around the subject (`city` keeps 150 m clear).
- HUD over the subject's key moment → move panels to the other side; the 3D action owns the middle.
- Clock jumping backwards between shots → `simAt` must be monotonic across cuts (keyframes in order).
- Heavy scene = slow render: instance repeated objects (`InstancedMesh`), as `city()` does.
