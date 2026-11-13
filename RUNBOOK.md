# Runbook (the scheduled runs follow this exactly)

No human input. Never post anything that hasn't passed QA. Every step ends with a checkpoint, so any run can be resumed.
All shell work goes through `bash ~/shorts-studio/tools/pipeline.sh <command>` (see its header). Files you write/edit
live only inside `~/shorts-studio/`. Read `STUDIO.md` (owner rules + lessons, last sections first), `ideas/MATRIX.md`
and the chosen style's `STYLE.md` before building.

## The channel and the plan
Channel facts (name, niche, slots, voice, combos, Zapier connection, thumbnails flag): `pipeline.sh channel <id>` (from
`channels.json`). The plan: `ideas/family_plan.json` (one row per slot: date, time, channel, combo, 2 topic options),
optionally mirrored in a Notion calendar where the owner ticks Pick A/B or writes My idea. Tasks: `build` (hourly at :30,
builds ONE Short and holds it), `post` (every 30 min 06:00-22:30, posts due held Shorts), `weekly-planner` (Sunday),
`on-demand` (manual). Posting window: 06:00-23:00 local time; nothing is posted at night.

## One slot, start to finish
1. **Which slot:** `pipeline.sh family-next` → first line wins. `PROBE` → re-check Zapier connections (below), then
   family-next again. MOVE (6 h late) → calendar row Status Moved + `pipeline.sh family-moved <slug_prefix>` → next line.
   LATE / BUILDING <step> → resume that project from the step after its last checkpoint (checkpoint < 40 min old =
   another run has it: take the next line). NEXT → start it. `WAIT` = channel without a connection: never build.
   Held projects aren't listed. Nothing listed → one line and stop.
2. **Pick:** My idea → ticked Pick B → Option A. Row Status → Building. Slug = `<slug_prefix><2-4 topic words>`, then
   `pipeline.sh kind <slug> family <channel> <HH:MM>` and `pipeline.sh tag <slug> channel=<id> format=Fx style=Vy`.
   A brief in `ideas/<date>-*-brief.md` for the slot wins. Never repeat a topic in `ideas/done.md`.
3. **Build** steps 2-6 below with the row's style and the channel's voice. Channels with `thumbnails: true` also get
   `renders/thumbnail.jpg`. PUBLISH.md line 1: "**Channel:** <name> (<id>): upload only to this channel".
4. **Hold:** `pipeline.sh hold <slug> "<date> <HH:MM>"` (refuses without a QA pass) for the slot time; if it passed, the
   current time inside the window, else the next 06:00. Checkpoint `rendered` "held for <time>".
5. **Post (post task only):** `pipeline.sh qa-gate <slug>` = QA GATE OK → steps 7-9 with `connection_id` = exactly the
   channel's `zapier_connection` → `pipeline.sh oembed <id>`: `author_name` must match the channel's `name` or
   `yt.title`. Anything else = wrong channel: create `state/STOP-FAMILY-POSTING`, notify the owner, post nothing more.
6. **Bookkeeping:** `ideas/done.md` line, `pipeline.sh tag <slug> yt=<id>`, tracker/calendar Posted, cleanup, unhold.

## Connections
`channels.json` → `zapier_connection` per channel; null = never built or posted. Probe: for each id in
`zapier_candidates` that no channel uses, run the read-only Zapier code action `get_my_channel` and pipe
`[{"connection": id, "channels": data}]` into `pipeline.sh zap-map` (exact title match; `zap-map <channel>=<id>` when
the owner names it). Never guess.

## QA gate and interrupted runs
`pipeline.sh qa-gate <slug>` passes only if the latest build passed QA (a `qa-passed` checkpoint after the last
scripted/voiced/built one, last step not `failed`). `hold`, `to-drive` and `pd-post` refuse without it; `held` shows
`qa=ok|NO`. A run cut off by the usage limit leaves its checkpoints; the next hourly run resumes it.

## Checkpoints
`picked → scripted → voiced → built → qa-passed → rendered → in-drive → posted → cleaned`, each recorded with
`pipeline.sh state <slug> <step> "<note>"`; heartbeat (re-record the last step) every ~20 min during long steps.
`pipeline.sh status [date]` lists the day's projects. Heavy commands share a lock: `BUSY` (exit 75) → run again.

## 0. Preflight
`pipeline.sh preflight` must print `PREFLIGHT OK`; Zapier must list YouTube and Google Drive.

## Classic Cuts rows (public-domain film edits)
A calendar row whose series is **Classic Cuts** is built with the film editor instead of steps 2-6 below; steps 0, 1 and
7-9 are the same. Read `tools/edit/STYLE.md` (shape, shot picking, review, publishing) and
`references/pd-films/WHITELIST.md` (which films are allowed; a film that isn't listed as allowed needs the 2-source check
there first and `pipeline.sh film-fetch`, archive.org only). Steps, each with its checkpoint:
- **scripted**: pick banner, dialogue lines (`film-srt`), 24 beats of montage and the ending shot (`film-sheet`);
  `pipeline.sh edit-new <slug>`, write `plan.json`.
- **built** + **qa-passed**: `pipeline.sh edit <slug>`, read `review/all.jpg`, fix and rebuild (max 3 rounds).
- **rendered**: the share copy and cover already exist after `edit`; write PUBLISH.md (title/description per STYLE.md).
Voice and Tall Tale steps don't apply.
Silent films: `"mute": true` on dialogue clips (captions come from the clip `text`; we never keep a transfer's score).
No subtitles: `pipeline.sh film-transcribe <film-id>` (Whisper, ~15 min for a 2 h film).


## 2. Script (→ scripted)
- Fact-check every claim with 2+ reliable sources (WebSearch). Unsourceable → cut it. Follow the row's caveats.
- Formula from the row's FORMAT (`ideas/MATRIX.md`): line 1 = the whole hook;
  pivot ("You see," / "Well," / "Step one"); escalation; punchline. 45-58 s. One line = one beat. Numbers written as
  spoken, captions show digits.
- **Comment engine (owner, 2026-11-11/12: comments spread the word), every Short:**
  1. **End question** after the punchline: ONE line (≤ 12 words, 2-4 s, same voice), specific to this story and
     answerable in one or two words. Best: a **choice** ("Army or emus: who were you betting on?", "A or B?"), a
     **number** ("Rate this plan 1-10."), a **confession** ("Be honest: have you done this?") or **your place**
     ("What's the rule where you live?"). Never generic ("like and subscribe"), never asking for likes/subs.
  2. **On screen too**: the question stays as the last caption; for choices show the options (A/B card or two words).
  3. **A take to argue with**: the punchline may pick a side with a mild, harmless opinion ("Honestly, the emus earned
     it.") so people want to reply. Never on politics, religion, health advice or real people's character.
  4. **Guess moments** (reveal formats F4, F12, F14, F15): a 1.5 s on-screen "Guess before I tell you 👇" just before
     the reveal. Text only, no pause in the voice.
  5. **Description line 1 = the question** (+ the options for a choice).
  6. Never bait with deliberate mistakes, fake facts or fake controversy. Comments count on the scoreboard per combo.
  Use the calendar row's question if there is one; an interactive serial ends on its A/B vote.
- **Style = the row's style** (no default): `pipeline.sh new <engine dir> <slug>` with tall-tale | deep-dive | night-file |
  inside-out | stick-story | paper-atlas | kinetic-diagram | sim-hud | doodle-cartoon (skits: the grown-up cast, `grown: true`), then read that style's `STYLE.md` and `example/` before writing `script.json`
  (sources inside). Recurring series casts are Tall-Tale designs; in other styles use the style's own look, keep the
  series title card.

## 3. Voice (→ voiced)
`pipeline.sh voice <slug>`, then `pipeline.sh readback <slug>` and compare with the script. Pace target 3.5-3.8 words/s
(adjust `speed`, re-voice). Fix any word Whisper dropped (zero-length) in `data/words.json` by hand.

## 4. Build (→ built)
Write `src/shots.js` (+ kit additions in `src/core/`) following the chosen style's STYLE.md and example.
First Short in a style that has never posted: allow one extra QA round. Camera rules (all styles): **≤3 hard cuts**;
scene changes by camera travel or a 6-10 f blur-crossfade; holds with micro-acting; 3-6 f bursts onto details; faces
above the caption line (look target at chest height); props above counters; nothing runs into the lens.

## 5. QA (→ qa-passed), max 4 rounds, else `failed`
`pipeline.sh check` = CHECK OK → `sheet <slug> 1 10` (read it, fix) → `sheet <slug> 0.5 10` (read every frame: story
makes sense, captions on the word, no collisions, faces clear) → `cues` → `mix` (target -14 LUFS).

## 6. Render (→ rendered)
`pipeline.sh render <slug>` (MP4 + share copy + loudness), `pipeline.sh cover <slug> <t>`, **thumbnail** (below),
`pipeline.sh verify <slug>`
and look at `review/mp4check.jpg`. Write `PUBLISH.md`: title ≤ 70 chars hook-first; description = the comment
question (line 1) + the hook line + one context line + `#shorts` + 2-3 topic hashtags; 10-15 tags; category Education
(27) or Comedy (23). **No sources in the description** (owner, 2026-11-12): sources stay in `script.json` / the brief.
The one exception is a licence condition: CC BY films need their credit line (tools/edit/STYLE.md).

**Thumbnail (owner, 2026-11-11; rules in `references/THUMBNAILS.md`)**: `pipeline.sh thumb <slug> <t> "<2-5 words with
*accent*>" --y <px>` (Classic Cuts: add `--crop-top 130`). Pick t where ONE subject (an expressive face, the key object,
the map, the readout) fills the middle; put the headline in empty space (top band ~110-300 px or lower middle
~1100-1450 px), never on a face, never below 1530 px; headline = the curiosity gap, not the title repeated. Look at
`renders/thumbnail.jpg` before going on.

## 7. Drive (→ in-drive)
`pipeline.sh to-drive <slug>`. Then with the Google Drive connector `search_files` (title contains '<slug>') wait (re-check
every ~2 min, ≤ 15 min) until both MP4s show `fileSize` equal to the local sizes. Note the share MP4's file id.

## 8. Post (→ posted)
- Zapier Google Drive `google_drive_retrieve_file_or_folder_by_id` with the share MP4's id → take the result's `file`
  value (a private `zapier.com/engine/hydrate/...` reference). **Never make the file public.**
- Zapier YouTube `youtube_upload_video`: video = that `file` value; title, description, tags, category_id,
  privacy_status `public`, made_for_kids false, embeddable true, notify_subscribers true, default_language `en`.
- Thumbnail: Zapier Google Drive retrieve on `thumbnail.jpg`'s file id (same Drive folder) → Zapier YouTube
  `youtube_update_video_thumbnail` (video_id, thumbnail = the `file` value). If YouTube refuses (channel not
  phone-verified, or any error): note it in the checkpoint and carry on; the post stands.
- `pipeline.sh oembed <id>` must return the title. Log the link in `ideas/done.md` and the calendar row (`posted`).
- Tag it for the scoreboard: `pipeline.sh tag <slug> format=F<n> style=V<n> yt=<id>` (ids in `ideas/MATRIX.md`).

### Posting routes (owner, 2026-11-12): try them IN THIS ORDER
1. **Zapier** (above), with the channel's own connection. Pro trial to 24 Nov (1,000 tasks); from 25 Nov the Free plan
   (100 tasks/month). A task-limit error ("reached its task limit") → don't retry Zapier this month: go to route 2.
2. **Pipedream** (optional):
   `pipeline.sh pd-post <slug> [channel]` uploads the share MP4 + thumbnail through the owner's
   Pipedream workflow (code: `tools/pipedream/upload_step.mjs`; secret endpoint in `config/pipedream.json`) and prints
   `{"id": "<youtube id>", "thumbnail": "set|skipped|failed"}`. Exit 4 = not set up yet → route 3.
3. **Chrome uploads** (Claude in Chrome extension, the owner's signed-in Chrome): open studio.youtube.com in a new tab
   (switch to the right channel via the account menu if needed) → Create → Upload videos → `file_upload` the share MP4
   → title + description from `python3 -I tools/publish_meta.py <project>` → thumbnail `file_upload` (renders/
   thumbnail.jpg) → "No, it's not made for kids" → Next ×3 → Public → Publish → copy the link. Close the tab after.
   Never type anything into other sites; stop if YouTube asks to sign in or verify (notify the owner).
All three: `pipeline.sh oembed <id>` must return the title, then the usual step 8-9 bookkeeping (note the route used
in the checkpoint). All three down → keep the Short at `rendered`, notify "Couldn't post <title>: all routes down".

**Budget:** each successful Zapier action = 2 tasks; a Short = 4 tasks (8 with a custom thumbnail). Check the plan's monthly tasks before promising a posting rate; on a task-limit error don't retry, keep the Short at `rendered` ("zapier task limit") and notify once.

## 9. Clean up and report (→ cleaned)
`pipeline.sh cleanup <slug> <share_bytes> <master_bytes>` (sizes from Drive). Then update the Notion tracker (below).
Send a phone notification: "Posted on <channel>: <title> <link>". On any failure: checkpoint `failed` with the reason,
write `ideas/FAILED-<slug>.md`, set the tracker and calendar rows to `Failed`, notify "<channel> Short stopped: <reason>",
never post.
