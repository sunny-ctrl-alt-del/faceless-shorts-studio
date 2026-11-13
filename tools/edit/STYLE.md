# Classic Cuts: public-domain film edits (style + procedure)

The "edit" format (studied in `references/kakarotox7/STYLE_BIBLE.md`) built only from parts we may use:
public-domain films (`references/pd-films/WHITELIST.md`) + our own synthesized music (`music.py`) + our own text.

## Shape of every edit (35-45 s)
1. **Banner** (white strip, black caps, 3-6 words): a claim or quote that frames the film, e.g. THEY CALLED IT GLORY.
   It floats at **y 300-428 px**, not at the top edge: on iPhones the top ~280 px sit under the status bar, the
   Dynamic Island and YouTube's search/camera icons (owner saw the first edit's banner hidden, 2026-11-12). Choose
   shots whose faces sit below the strip (eyes below ~y 480, i.e. the lower three quarters of the frame).
2. **Cold open (8-15 s)**: 1-3 real dialogue lines from the film, from frame 1. Pick an emotional turn or contrast
   (promise → reality, threat → reply). The LAST line is the strongest: the drop lands right after it.
   Captions: the film's own words, 1-3 at a time, glowing red/yellow/cyan.
3. **Drop (6 bars ≈ 18-22 s)**: our track hits; banner may switch to a second label (WHAT THEY FOUND:). Montage of
   14-20 shots cut on the beat (sum of `beats` must equal 24): open on a big image with `flash` + slow motion, then
   alternate 1-beat action (`shake`, `punch`) with 2-beat slow faces (`push`, speed 0.5-0.6). End on a shot that
   foreshadows the ending.
4. **Ending (≈ 7 s)**: one slow shot (speed 0.6-0.75) under a dictionary card: the banner's key word, IPA, part of
   speech and OUR OWN one-line definition that lands the point (never a dictionary's wording), then the **comment
   question** (`card.ask`, owner 2026-11-11), e.g. "Would you have enlisted? Tell me below." It's also the description's
   first line.

## Picking shots
- `pipeline.sh film-sheet <film-id> <start> <step> <end>` (step 30 for the whole film, then 3-4 s on chosen scenes),
  `pipeline.sh film-srt <film-id> --grep '<word>'` or `--from S --to S` for dialogue. Check the subtitle timing against
  the audio once per film (Whisper on a 5 s clip).
- The vertical window is 41% of a 4:3 frame: `x` = (subject centre − 0.204) / 0.592 (0 = left edge, 1 = right edge).
- A shot uses `beats × beat × speed` seconds of film (≈ 0.4-1.5 s): start it ≥ 0.3 s after a cut and check it doesn't
  run into the next scene.
- Avoid: gore close-ups, real atrocity footage, anything that sexualises, title cards/logos of distributors.

## Phone-safe layout (all Shorts)
Nothing that matters above y 300 (status bar, Dynamic Island, YouTube's top icons), below y 1500 (title, channel name,
music line) or in the right 140 px between y 900 and 1700 (like/comment/share buttons). The watermark at y≈1620 is
deliberate (owner: keep it).

## Review (max 3 rounds)
`review/all.jpg` (2 frames/s): faces/action inside the frame, no stray cut, captions are the right words at the right
time, card readable, watermark visible but quiet. Fix the plan, `pipeline.sh edit <slug>` again.

## Publishing
- CC BY films (WHITELIST.md): the description MUST carry the credit line (film, year, © holder, licence, link).
- Title: `"<banner, sentence case>" | <Character> "<Film>" (<year>) Edit`, ≤ 70 characters.
- Description (no sources, owner 2026-11-12): line 1 = the card's comment question; then one line naming the film,
  year and director (it's SEO: people search for the film); "Original music and edit: <channel>.";
  `#shorts #edit #classicfilm` + one topic tag. Category Film & Animation (1). Tags: film, year, actor, "movie edit",
  series name. CC BY films only: add their credit line (a licence condition, not a source list).
- If YouTube's Content ID claims the footage: it's public domain; dispute with the film's year and US/India status.
