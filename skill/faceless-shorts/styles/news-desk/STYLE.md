# News Desk: "today's news in 60 seconds" briefs, 9:16

Clear, quick, trustworthy. Newsprint paper, black ink, ONE news red. A black masthead at the top and a scrolling
ticker at the bottom stay on screen the whole time (the "desk"); in between, one story at a time on a white card: a big
red rank number, a category pill, a headline that types on, and the one key figure counting up. Made for Top 5 briefs
(F24), the story of the day (F18) and the map or number of the day (F19). Example: `example/` = **INDIAN RAILWAYS IN
5 NUMBERS** (30 s, 7 shots; evergreen facts so the example never goes stale). Style sheet: `style-sheet.png`.

## 1. The look (do not break these)
- **Background:** newsprint `#F3F1EC` with a fine graticule, abstract drifting dot fields and a soft vignette
  (`K.bg(t)`). Never photos, never real people's faces.
- **NO real maps, borders or country outlines.** Places are shown with pins (`K.pin` + `K.ping`) on the abstract dot
  fields plus a text label. Border drawings are easy to get wrong and politically sensitive; this style never draws them.
- **Ink `#141414`, slate `#5B6470` for secondary text, ONE red `#E0251B`:** the rank number, the key figure, one key
  word in the headline, the pins. Everything else is black on white or white on black.
- **The desk:** `K.masthead(label, edition)` at y 300 (label e.g. TOP 5 / STORY OF THE DAY / BY THE NUMBERS; edition
  e.g. "FRI 13 NOV · MORNING") and `K.ticker(items, t)` at y 1430-1494 on every shot. Ticker items = the day's 5
  headlines in 3-6 words, caps.
- **One story per card:** `K.rank(n)`, `K.tag(category)`, `K.card(…)`, `K.wrap(headline)` (types on word by word),
  `K.counter(value, fmt)` (the key figure counts up), `K.icon(name)` (train, bridge, people, ruler, route, chart, rupee,
  globe), `K.progress(i, 5)` dots top right. Optional `K.source('Reported by: …')` under the card.
- End on `K.question(q, chips)`: a red card with the comment question and answer chips (1-5, A/B, YES/NO).
- Cuts: a paper-white flash, slow push-in (`zoom` 0.03-0.05). Calm, no shaking, no sirens, no "BREAKING" theatre.

## 2. Format
- 1080x1920, 30 fps. Top 5: 40-60 s (hook 2-3 s, each story 7-10 s, question 3 s); single story: 30-45 s.
- **Top 5 shape:** hook headline ("India this morning: the top 5") → stories 5 → 1 (most important last) → question
  "Which one matters most to you? 1-5". **Story of the day:** what happened (card) → why it matters (figure) → what
  happens next (date/pin) → question.
- One line = one shot = one cut. Narration: `bf_emma` x1.0 (clear, neutral), or `af_sarah`.
- Music: `"bed"`, quiet; mastered to -14 LUFS by `pipeline.sh render`.

## 3. News rules (they matter more than the look)
- Every story checked in at least two reliable outlets before scripting; only facts both agree on. Numbers rounded and
  said with "about" when outlets differ. No speculation, no opinions, neutral verbs ("said", "announced", "rose").
- No graphic violence, no victims' names, no unverified claims, no photos or likenesses of real people.
- Dates in the masthead edition line must be the real publish date.

## 4. Captions
Same syntax as every style: `"caps": "THE *CHENAB BRIDGE | *359 METRES"`. Inter Black 100 px, white on a black
outline, the `*` word red, centred at y 1305 (between the card and the ticker). `"nocap": true` on the hook and the
question lines (their words are already on screen). Phone-safe: nothing important above y 300, below y 1500, or under
the right-side buttons (x > 940, y 900-1700).

## 5. Engine map (`example/`)
Same as Kinetic Diagram: `script.json`, `src/shots.js` (the per-video file), `src/core/kit.js` (components),
`src/core/lib.js` (palette `C`, math, `text()`), `timing.js` (`L Le Wd`), `captions.js`, `main.js`,
`tools/capture.mjs`, `tools/mix.py`. A new brief: copy `example/`, rewrite `script.json` and the `stories` array +
`TICK` list in `shots.js`.
