# Doodle Cartoon: relatable character skits with dialogue, 9:16

Warm, quick, a little cheeky. A recurring cast of thick-outline cartoon kids (and their parents) acting out a
relatable moment in flat pastel sets, each character with their own AI voice, their words in a speech bubble, mouths
flapping in sync. Made for character skits (F17) and the interactive "Your Call" serial (F10); learned from the
itscoltrain skit format (short dialogue scenes, mostly static framing, the punchline on the last line), built entirely
from our own characters. Example: `example/` = **WHEN YOUR FRIEND SAYS "FIVE MINUTES AWAY"** (21 s, 9 shots).
Style sheet: `style-sheet.png`.

## 1. The look (do not break these)
- **One thick ink outline (11 px) on everything**, flat fills, no gradients, no textures. Shading = at most one darker
  tone of the same colour.
- **Sets are flat pastel** (lilac bedroom, night cinema, butter/mint/yellow cards); characters are saturated (orange,
  purple, teal). The set never competes with the faces.
- **The cast** (original, keep them consistent across episodes): **Milo** (orange hoodie, spiky brown hair, freckles,
  laid-back, always late), **Zara** (purple top, two hair puffs, organised, deadpan), **Noor** (teal top, long blond
  hair, the dreamer), **Mom** (teal cardigan, long brown hair), **Dad** (blue shirt, grey hair, moustache).
- Faces act: big white eyes with pupils that look at whoever is speaking, brows (`up`, `angry`, `worried`), mouth
  shapes, plus reaction marks (anger vein, sweat drop, Zzz, motion lines, sparkles).
- Framing is mostly static (like the reference skits), with a slow push (`zoom` 0.05-0.1) and the odd close-up.
- Nothing mean-spirited: no insults about looks, no real people, kid-friendly humour.

## 2. Format
- 1080x1920, 30 fps, **15-35 s** (skits are short). Lead 0.4 s, outro 0.9 s, `gap` 0.3-0.45 (comic timing).
- **Story shape:** title card ("When your friend says…", narrator) → set-up line → the reveal ("Meanwhile…") →
  escalation (1-2 lines) → punchline (the last dialogue line) → **comment question** card ("Are you the Zara or the
  Milo? Tell me below.").
- **One line = one shot**, usually of the speaker. Dialogue lines carry `"voice"` (per-line Kokoro voice) and
  `"nocap": true`; the shot shows `K.bubble(say(i), …)` with the spoken words and `talk: K.talk(t, i)` on the speaker.
- Voices (also in `script.json` "cast"): narrator `af_heart`, Zara `af_bella`, Milo `am_puck`, Noor `af_nicole`,
  Mom `af_heart` (x0.95), Dad `am_fenrir`. Keep a character's voice the same in every episode.

## 3. Captions
Narrator lines only, same syntax as every style (`"caps": "WHEN YOUR FRIEND SAYS | *FIVE MINUTES | *AWAY"`), Inter
Black 120 px white with a thick ink outline, the `*` word yellow, at y 1420. Speech bubbles: Inter Black 56-60 px, white
bubble with the ink outline, tail to the speaker's mouth, max ~3 lines. Phone-safe: bubbles and faces between y 330
and 1300; nothing important under the right-side buttons (x > 940, y 900-1700).

## 4. Engine map (`example/`)
Same as Inside Out: `script.json` (+ per-line `"voice"`, `"speed"`, `"nocap"`), `src/shots.js`, `src/core/kit.js`,
`lib.js` (palette `C`, `ink()` = fill + outline, `bigText`), `timing.js`, `captions.js`, `main.js`, `tools/capture.mjs`,
`tools/mix.py`. `scripts/voice.py` voices each line with its own `"voice"` (a voice change also splits the sentence
group, so each line is its own take).

## 5. The component zoo (`kit.js`, `import * as K`)
**People** `K.person({ x, y (feet), s, who: 'milo'|'zara'|'noor'|'mom'|'dad', dir: 1|-1, arms, eyes, look: [x, y],
brow, mouth, talk, bob, lean (rad), walk (phase), hold: (x, y) => prop, legsHidden })`. Kids ≈ 760 px tall at s 1,
adults 18 % bigger. `arms`: `'down' 'hips' 'wave' 'phone' 'point' 'up' 'shrug' 'facepalm' 'cross' 'run'` or
`K.pose('down', 'point', k)` to blend. `eyes`: `'n' 'wide' 'half' 'closed' 'side' 'happy'` · `brow`: `'n' 'up' 'angry'
'worried'` · `mouth`: `'smile' 'grin' 'frown' 'flat' 'o' 'yawn' 'smirk'` · `talk: K.talk(t, lineIndex)` flaps the mouth
while that line's words are spoken.
**Speech + reactions** `K.bubble(text, x, y, tailX, tailY, scale, size, maxW, think)` · `K.angry(x, y, s, a)` ·
`K.sweat(x, y, s, a)` · `K.zzz(x, y, t)` · `K.motion(x, yFeet, dir, a)` · `K.sparkle(x, y, s, a)` ·
`K.shout('WHAT?!', x, y, size, a)`.
**Props** `K.phone(x, y, s, rot, screen)` · `K.clock(x, y, r, h, m, wobble)` · `K.popcorn(x, y, s, empty)` · `K.sock(…)`.
**Sets** `K.cinema(t, end)` · `K.bedroom(t, night)` + `K.bed(x, floorY)` (draw the person first, the bed covers the legs)
· `K.card(t, colour)` (title / question cards). `K.GROUND` = 1560 (feet line).
New episode = new sets/props in the same look (classroom, kitchen, car, bus stop): flat fills + `ink()` outline,
pastel walls, a floor band at y 1380.

## 6. A dialogue shot
```js
const st = cut(5), li = 5, tw = Wd('twenty', 5) - st;
add({ id: 'S06', at: st, cam: [420, 900], zoom: 0.1, note: 'Zara furious, clock races',
  draw(lt, d, t) {
    K.cinema(t);
    K.person({ x: 360, y: K.GROUND, who: 'zara', arms: 'phone', brow: 'angry', talk: K.talk(t, li),
      hold: (x, y) => K.phone(x, y, 1.2, 0.25) });
    K.angry(520, 860, 1.1, seg(lt, tw - 0.2, tw + 0.1));
    K.bubble(say(li), 470, 690, 400, 980, seg(lt, 0.05, 0.3));
  } });
cue(st, 'whoosh'); cue(st + tw, 'slam', { gain: 0.5 });
```

## 7. QA pitfalls
- A bubble covering the speaker's face → keep bubbles above the head (y 400-800), tail down to the mouth.
- The wrong mouth moving → `talk` only on the speaker; listeners get a fixed `mouth` and `look` toward the speaker.
- Lines read too fast for a punchline → raise that line's `gap` (0.5-0.7) before the punchline.
- A character drifting off-model between episodes → only use the CAST entries; never invent a new look for Milo/Zara.
