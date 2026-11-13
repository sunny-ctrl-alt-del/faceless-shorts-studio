# handover.md: Faceless Shorts Studio (one faceless YouTube Shorts channel, fully automated)

> **For the human.** This repository is a complete, working studio that plans, writes, voices, animates, checks and
> posts faceless YouTube Shorts for **one channel**, on autopilot, at $0 in tools. Read §0-§2 to understand what is
> what (the **file map** at the end explains every file). To start: open an AI agent that can run commands on your
> computer (best: **Claude Code**, i.e. the Claude desktop app → *Code* tab), point it at this folder (or paste this
> file) and say: `set up this studio for my channel about <niche>`. Version: 2026-11-14.

---

## 0. What this is, in one picture

```
 PLAN (weekly)                BUILD (hourly)                         POST (every 30 min)           MEASURE (weekly)
 channels.json ─┐             family-next → pick slot                held + due + QA OK?            stats / scoreboard
 ideas pool ────┼─ plan_family.py → family_plan.json ──► script → voice → animate → QA → render ─►  hold ─► Drive → Zapier
 (Notion        │             (+ Notion calendar,     (Engine A skill or Engine B film edit)        → YouTube → oembed check
  calendar) ────┘              owner ticks A/B)       every step = a checkpoint in state/<slug>.json → done.md + tracker
```

- **Engine A** = the *Faceless Shorts* skill (`skill/faceless-shorts/`): code-only animated Shorts in 10 visual styles
  (three.js / canvas → headless Chrome frames → ffmpeg), local Kokoro voice, Whisper word-timed captions.
- **Engine B** = the film-edit engine (`tools/edit/`): 9:16 edits of public-domain / CC BY films with our own music.
- **The studio layer** (`tools/`): `pipeline.sh` is the single entry point for every shell step (so permissions can
  allow exactly one script); planners, the slot picker, QA gate, Drive hand-off, stats.
- **The brain** = an AI agent (Claude) following `RUNBOOK.md`, started by **scheduled tasks** (`tasks/*.md`) in the
  Claude desktop app. It researches, writes and checks; the tools do the deterministic work.
- **Publishing** = Google Drive for Desktop (private copy) → Zapier (Drive "Retrieve file" → YouTube "Upload video");
  the file is never made public.
- **Optional**: Notion (a calendar where the owner ticks topics, and a tracker with views/likes/comments).

Everything is designed for **N channels**; this package is configured for **one** (`channels.example.json`). To run
more channels later, add entries to `channels.json` (§11).

## 1. Instructions for the AI reading this

You are the **producer** of a faceless YouTube Shorts channel. The owner gives you a niche (or just an idea); you
decide format and style from §6, research and fact-check, write, voice, animate (or edit a film), check every frame,
render a 1080×1920 MP4 and deliver or publish it, then run the channel on a schedule.

**How you work with the owner**
- Never ask the owner to write prompts or describe styles. Decide yourself (§6.4). Ask only what a human must do or
  decide: approve an install, sign in / connect an account, choose a delivery option, approve public posting.
- Before anything that installs software, posts publicly or needs a password, say exactly what will happen and wait for
  a yes. Password-requiring commands are for the owner to type.
- Report briefly at milestones; send the finished MP4 before posting unless the owner gave a standing approval.

**Start-up (every new chat)**
1. Can you run shell commands on the owner's machine? If not: "I need access to your computer to render videos. Open
   the Claude desktop app → Code tab, start a session in your home folder and give me this file again."
2. Look around silently: OS/CPU, free disk (≥ 10 GB), RAM, which tools from §4.2 exist, whether `~/shorts-studio/`
   exists (if yes, read its `STUDIO.md` and `RUNBOOK.md` and continue from there).
3. Ask the one delivery question: **(1) create only** (MP4 + title/description, no accounts; recommended first),
   **(2) create and post now**, **(3) create and schedule**, **(4) run the channel on autopilot**.
4. Set up only what that option needs (§4), testing each piece. Then produce (§7/§8) and deliver (§9).

## 2. Non-negotiable rules

1. **Copyright.** Never download or reuse footage, clips, stills, music, logos or character designs owned by others
   (movies, TV, YouTube channels, sports, music). A voice-over doesn't make that safe: YouTube treats narrated
   re-uploads as reused content and Content ID claims them; three strikes delete a channel. Allowed: everything we
   generate, and **verified public-domain / CC BY films** (§8). Naming a show, brand or person to talk *about* it is
   fine; their visual identity is not.
2. **No piracy sources.** Public-domain sources only: Internet Archive, Library of Congress, Wikimedia Commons,
   Prelinger Archives.
3. **Facts.** Every claim needs 2+ reliable sources (web search). Can't source it → cut it. Say "about" where sources
   disagree.
4. **Originality.** Learn formats from reference channels (§6.1); never copy their stories, scripts, characters, names
   or branding.
5. **QA gate.** Nothing is ever held or posted without passing QA: `pipeline.sh qa-gate <slug>` must print
   `QA GATE OK` (the hold, Drive-copy and upload steps refuse otherwise).
6. **Privacy.** Never make cloud files public; never use temporary public file hosts; never put the owner's email,
   IDs or keys in titles, descriptions, files or URLs.
7. **Posting needs approval**: per video, or one explicit standing approval for automation (record it in `STUDIO.md`).
8. **Storage.** Work in `~/shorts-studio/`, not inside an iCloud/OneDrive-synced folder (file providers evict
   `node_modules`/models and builds hang). Delete local renders once Drive holds identical copies.
9. **Content safety.** No gore, no real atrocity footage, nothing sexualising, nothing defamatory; true stories stay
   true. Cartoon *kids* can get a Short flagged "made for kids" (comments off): use grown-up characters.
10. **Phone-safe layout.** Nothing important above y 300, below y 1500, or under the right-side buttons
    (x > 940, y 900-1700): that's where the phone UI sits.

## 3. The folder at runtime

```
~/shorts-studio/                      (this repository, cloned; runtime folders are created on first use)
  RUNBOOK.md        the procedure every scheduled run follows (the AI's checklist)
  STUDIO.md         decisions + lessons log (create it; owner rules and what was learned go here, newest last)
  channels.json     the channel(s): name, niche, slot times, voice, format × style combos, Zapier connection
  tools/            pipeline.sh + planners + film-edit engine + measuring tools
  tasks/            the scheduled-task prompts (paste into the Claude desktop app)
  ideas/            MATRIX.md (formats × styles), family_ideas.json (topic pool), family_plan.json (the calendar),
                    done.md (what was posted), <date>-<slug>-brief.md (owner one-offs), FAILED-<slug>.md
  references/       THUMBNAILS.md, pd-films/WHITELIST.md (+ downloaded PD films, git-ignored)
  videos/<slug>/    one project per Short: script.json, src/shots.js, data/, review/, renders/, PUBLISH.md (git-ignored)
  state/            <slug>.json checkpoints, <slug>.hold post times, moved.json, zapier_probe.json (git-ignored)
~/.claude/skills/faceless-shorts/      Engine A (copy of skill/faceless-shorts/ from this repo)
~/.faceless-shorts/venv/               Python env for voice + Whisper (created by the skill's setup)
Google Drive: My Drive/Shorts Studio/Published/<slug>/   private archive + the upload hand-off
```
A Short's **slug** is `<yyyy-mm-dd>-<channel id>-<HHMM>-<2-4 topic words>`; its checkpoints run
`picked → scripted → voiced → built → qa-passed → rendered → in-drive → posted → cleaned`.

## 4. Setup (only what's missing; test each step)

### 4.1 Files
1. Clone this repository to `~/shorts-studio/` (in your home folder, not in an iCloud/OneDrive-synced folder such as
   `~/Documents`: synced folders offload files and stall renders), then run **`bash install.sh`**. It checks the tools
   (§4.2; `--install-tools` installs missing ones with Homebrew / apt / winget), copies the skill to
   `~/.claude/skills/faceless-shorts/`, creates `channels.json` + `STUDIO.md` from the examples, builds the private
   Python env and downloads the voice + Whisper models (~0.9 GB; `--no-models` skips), then runs `pipeline.sh preflight`.
   `bash install.sh --check` only reports. Re-run it after every `git pull` (it refreshes the installed skill).
2. Prove it: `bash skill/faceless-shorts/scripts/selftest.sh` → **SELFTEST PASSED** (a 4-second clip in every style).
3. Fill in `channels.json` (§4.3). Give `STUDIO.md` a first line: the channel, its niche and the owner's standing rules.
4. Fonts for film edits: copy `Arial Black.ttf`, `Georgia.ttf`, `Georgia Bold.ttf`, `Georgia Italic.ttf` from the system
   fonts into `tools/edit/fonts/` (or use any bold sans + serif and change the names in `edit.py`).

### 4.2 Tools (free, official builds; ask before installing)
| tool | why | macOS | Windows (Git Bash) | Linux |
|---|---|---|---|---|
| ffmpeg + ffprobe | encode, mix, measure | static notarized build → `~/.local/bin` | gyan.dev build on PATH | `apt install ffmpeg` |
| Node.js 22+ | animation renderer | `nvm install 22` | nodejs.org | nvm |
| Google Chrome | GPU frame capture (≈5× faster than headless shell) | google.com/chrome | same | google-chrome-stable |
| Python 3.10+ | voice, Whisper, music | `uv` → `uv venv` | python.org or uv | python3-venv / uv |
| yt-dlp (optional) | views/likes/comments, vote counting | `uv tool install yt-dlp` | same | same |

Check: `bash ~/shorts-studio/tools/pipeline.sh preflight` → `PREFLIGHT OK`. On first use `pipeline.sh` adds
`~/.local/bin` and the newest nvm Node to PATH and finds Google Drive under `~/Library/CloudStorage/` (macOS); elsewhere
set `SHORTS_DRIVE` to the Drive folder for published files.

### 4.3 The channel (`channels.json`)
One entry per channel: `id` (short, lowercase: used in slugs), `name` (exactly as on YouTube: the post check compares
it), `niche`, `audience`, `slots` (posting times, e.g. `["10:00", "20:00"]`), `voice` (a Kokoro voice id),
`combos` (3-8 format × style pairs from §6, e.g. `F3xV8`), optional `combos_am` (a fixed first-slot combo),
`thumbnails` (true once the channel is phone-verified), `zapier_connection` (filled in §4.4). Pick the niche's combos
with §6.4; 2-4 combos make a channel look consistent, 6-8 give room to learn what works.

### 4.4 Publishing: Google Drive + Zapier (no public links)
1. **Google Drive for Desktop**, signed in (Stream mode is fine).
2. **Zapier connector** in Claude (claude.ai → Settings → Connectors → Zapier). In Zapier's MCP settings enable
   **YouTube → Upload Video** (+ **Update Video Thumbnail**) and **Google Drive → Retrieve File or Folder by ID**. When
   Zapier asks to connect YouTube, the owner picks the channel on Google's chooser (for a brand channel: the account,
   then "Choose an account or brand account" → the channel).
3. Put the YouTube connection's id in `channels.json` → `zapier_connection` (`list_zapier_connections` shows it). To
   verify which channel a connection really posts to, create the read-only Zapier code action **get_my_channel**
   (YouTube Data API `channels.list?part=snippet&mine=true`) and run it with that connection: it returns the channel
   title. `pipeline.sh zap-map` does this mapping automatically from probe results (exact title match only).
4. The posting route (RUNBOOK steps 7-9): `pipeline.sh to-drive` → wait until Drive shows the same byte sizes → Zapier
   Drive retrieve on the share MP4 → its private `file` reference → YouTube Upload Video with `connection_id` = the
   channel's connection → `pipeline.sh oembed <id>` must return the title AND the channel's name as author.
5. **Budget**: every successful Zapier action = 2 tasks. A Short = 4 tasks (8 with a custom thumbnail). Zapier Free =
   100 tasks a month ≈ 25 Shorts a month; check the plan before promising a posting rate. Free fallback with more room:
   a **Pipedream** HTTP workflow (`tools/pipedream/upload_step.mjs`, `pipeline.sh pd-post`). Your own Google Cloud
   project can only upload **private** videos until Google audits it, so it's no shortcut.

### 4.5 Notion (optional, recommended)
- **Calendar** database, one row per slot: Slot (title, "Sat 14 · 10:00 · <channel>"), Channel, Date, Time, Format,
  Style, Combo, Kind (planned / news / serial), Option A, Question A, Pick A, Option B, Question B, Pick B, My idea,
  Status (Proposed / Building / Posted / Moved / Failed). The owner ticks Pick A or B or writes My idea; no tick =
  Option A. `pipeline.sh plan-rows <from> <to>` prints the plan's rows ready for `notion-create-pages`.
- **Tracker** database "Shorts": Title, Status, Date, Slot, Channel, Format, Style, YouTube, Views, Likes, Comments,
  Stats updated, Hook, Slug. Refresh numbers with `pipeline.sh stats <ids>`.
- On a free Notion plan, cross-database SQL is refused: query with the rows/view modes.

### 4.6 Autopilot (option 4)
- Needs the **Claude desktop app** open and the computer awake (plugged in, lid open; add Claude to login items).
- Create the scheduled tasks from `tasks/` (§10). **Create them from a chat that is in Auto permission mode**: a task
  keeps the permission mode of the session that created it, and a task that isn't in Auto mode stops at the first
  permission prompt while nobody is watching. Add an allow-list to `~/.claude/settings.json` too:
  `Bash(bash ~/shorts-studio/tools/pipeline.sh *)`, `Read/Edit(~/shorts-studio/**)`, WebSearch, push notifications, the
  Zapier execute/inspect tools, Drive `search_files`, the Notion tools.
- Ask once, explicitly: "May the scheduled runs post publicly without asking each time, after they pass QA?" Record the
  answer in `STUDIO.md`.

## 5. One slot, start to finish (what the scheduled runs do)
1. **Which slot**: `pipeline.sh family-next` lists slots from `ideas/family_plan.json`: LATE (slot passed, not built),
   BUILDING <step> (resume it), NEXT (due within 14 h), MOVE (6 h late: give up, record with `family-moved`), WAIT
   (channel not connected), PROBE (re-check Zapier connections). First line wins; one Short per run.
2. **Pick**: the calendar row (Notion, or the plan file): My idea → ticked Pick B → Option A. Slug + `pipeline.sh kind
   <slug> family <channel> <HH:MM>` + `tag <slug> channel=<id> format=Fx style=Vy`.
3. **Build** (§7 or §8), QA, render. Every step = `pipeline.sh state <slug> <step> "<note>"`; heartbeat every ~20 min.
4. **Hold**: `pipeline.sh hold <slug> "<date> <time>"` (refuses without QA) for the slot time; if it already passed,
   "now" inside the posting window (06:00-23:00) or the next 06:00.
5. **Post** (separate task, every 30 min in the window): `pipeline.sh held` → each `due=yes qa=ok` Short → qa-gate →
   Drive → Zapier upload with the channel's own connection → oembed author check (wrong channel = write
   `state/STOP-FAMILY-POSTING` and stop everything) → `done.md`, tracker, calendar → `cleanup` → `unhold`.
6. **Measure** (weekly): `pipeline.sh stats`, `scoreboard`, retention from Zapier YouTube "Get Report" when available;
   then extend the plan (`plan_family.py --append`).
If a run is cut off (usage limit, crash), its checkpoints stay; the next hourly run resumes from the step after the last
one. A half-built Short is never held or posted.

## 6. Formats, styles and how to choose

### 6.1 Reference channels studied (measured 2026-11; medians of each channel's most-viewed recent Shorts)
| channel | median views | length | words/s | hard cuts | still % | loudness | in one line |
|---|---|---|---|---|---|---|---|
| Ricks Clips | 13.8M | 60 s | 3.67 | 1 | 23 | -14.1 | clever true stories as tiny dramas, flat 2D people in lit 3D worlds |
| Zack D. Films | 11.3M | 36 s | 2.88 | 0.5 | 21 | -10.6 | realistic game-engine 3D "what happens if" science and how-tos |
| GeoGlobeTales | 11.6M | 97 s | 3.06 | 4.5 | 41 | -14.4 | why a place is weird → history → today, on maps with googly-eyed countries |
| AlexDiarys | 0.2M | 62 s | 4.08 | 0 | 17 | -6.6 | "you" invent a structure step by step; problem → fix → new problem |
| wobblybusiness | 0.2M | 60 s | 3.51 | 24 | 29 | -14.1 | how a business really makes money, with a recurring kid character |
| WhatIfMakes | 3K | 87 s | 2.62 | 10 | 26 | -14.5 | superpower what-ifs with "rules" and doubling escalation |
| afterhourtheories | 0.2M | 113 s | 2.91 | 12 | 50 | -12.1 | "you're a tech CEO / simulation theory", neon holographic 3D |
| KAKAROTOx7 (edits) | 3-10M | 36 s | 2.49 | 19 | 56 | -10.8 | fan "edits": quote banner, real dialogue, beat-cut montage, definition card |
| HidbenMechanics | 6K (2.6M top) | 60 s | 2.85 | 0 | 68 | -19.5 | everyday "hidden mechanics" on dark navy kinetic diagrams |
| ItsTimeForTACOS | 0.1M (1.3M top) | 77 s | 3.17 | 25.5 | 69 | -14.1 | a strange rule/custom explained through one character |
| Sized Understood | 0.4M (6.7M top) | 89 s | 3.06 | 1 | 65 | -15.2 | "the next 60 seconds" timelines and look-alike showdowns, 3D + HUD |
| AfrimaxEnglish | 2.1M | 109 s | 2.65 | 14 | 18 | -17.9 | moral parables with photoreal AI characters |
| itscoltrain | 5K | 31 s | 2.42 | 6.5 | 100 | -14.8 | recurring-cast comedy skits, thick-outline doodle cartoon |

**What the numbers teach (defaults):** ≤ 3 hard cuts in a 45-58 s Short (move by camera travel or a 6-10-frame blur
cross-fade) · voice 3.5-3.8 words/s from frame 1, no intro/outro · line 1 is the whole hook, the last line the punchline
· one number on screen per beat · one consistent world + recurring cast builds identity · master at -14 LUFS.
(Studied for formats only: never copy their stories, characters, names or branding.)

### 6.2 Story formats
| id | format | hook template | spine | ending |
|---|---|---|---|---|
| F1 | Backfire (a rule, reward or plan made things worse) | "<Who> did <X>, and got the opposite." | setup → plan → how it was gamed → numbers explode | deadpan verdict |
| F2 | Invention chain | "If you <naive thing>, congratulations, you've invented <X>. Until <problem>." | problem → fix → new problem (3-4 rounds, real dates) | "You didn't invent <A>. You invented <B>." |
| F3 | Money machine (how a business really earns) | "If you <do business thing>, congratulations, you're in the <real> business." | step one/two/three → the hidden profit, sourced numbers | satirical sting |
| F4 | What-if rules | "What if you <absurd premise>? First, the rules." | rules 1-3, escalating, real physics/biology | absurd final escalation |
| F5 | Place/history explainer | "This is <place>. But did you know <weird fact>?" | dated beats → today | punchline from the place |
| F6 | Mystery file | "In <year>, <person> <vanished/did X>, and nobody knows <Y>." | facts → theories → what's proven | open question |
| F7 | Survival steps | "What would you do if <situation>?" | steps 1-4, right moves + common mistakes | the one rule to remember |
| F8 | Body/science what-happens-if | "What happens if you <action>?" | seconds/minutes/hours inside the body | surprising final fact |
| F9 | Film edit (public-domain / CC BY film) | a 3-6-word quote banner | cold-open dialogue → drop → beat montage | dictionary card, our own definition |
| F10 | Interactive serial ("you" are the hero; comments vote A/B) | recap with the vote result | 3-5 beats | cliffhanger + A/B vote card |
| F12 | Hidden mechanics | "<everyday annoyance>. It's not bad luck. It's <mechanism>." | the mechanism step by step | "so next time…" |
| F13 | Culture quirk | "Why <person> has to <strange custom> in <country>" | one character lives it → why | the twist reason |
| F14 | Next 60 seconds | "<Event> just happened. Here are the next 60 seconds." | T+ clock beats | what decides the outcome |
| F15 | Look-alike showdown | "These two <things> look identical. One <difference>." | outside → inside → numbers | which one to pick |
| F16 | Moral parable | "A <person> <did X> every day. Then <twist>." | setup → choice → twist | the lesson |
| F17 | Character skit | "When <relatable moment>…" | recurring cast, dialogue beats | punchline + reaction |
| F18 | Story of the day (news) | "<headline>. Here's what it means." | what happened → why it matters → what's next | the open question |
| F19 | Map / number of the day (news) | "This number explains today's news." | the figure → context → what it means | guess the next number |
| F20 | Movie science | "Could <movie moment> really happen?" | the scene in words (no footage) → real science | possible / nope |
| F21 | Verdict roundup | "<Film>: critics vs audiences." | published scores only | whose side are you on? |
| F22 | Behind the scene | "<Famous shot> wasn't CGI." | how it was made, from interviews | practical or CGI? |
| F23 | Box office breakdown | "<Film> cost <x>." | budget → marketing → earnings split | guess the break-even |
| F24 | Top 5 today (news) | "<Country> this morning: the top 5." | 5 → 1, ~10 s each, 2+ outlets each | "Which matters most to you? 1-5" |

### 6.3 Visual styles (Engine A unless noted; each style folder has STYLE.md + a working example)
| id | style (skill folder) | look | best for |
|---|---|---|---|
| V1 | Tall Tale 3D (`tall-tale`) | flat 2D cartoon people in a sunny lit 3D world; one-word captions | F1, F2, F3, F4, F13, F16 |
| V2 | Deep Dive 3D (`deep-dive`) | realistic 3D, inside-body cutaways, readouts | F8, F2, F4, F14 |
| V3 | Night File 3D (`night-file`) | dark rooms, evidence boards, cold light | F6, F14 |
| V4 | Inside Out (`inside-out`) | flat 2D x-ray explainers | F8, F12, F15 |
| V5 | Stick Story (`stick-story`) | stick figures, step cards | F7, F4 |
| V6 | Paper Atlas (`paper-atlas`) | cut-paper history with maps | F5, F1 (history) |
| V7 | Classic Cuts edit (Engine B, `tools/edit/`) | PD/CC BY film, 9:16, grade, slow-mo, glow captions, banner, definition card, our music | F9 |
| V8 | Kinetic Diagram (`kinetic-diagram`) | dark navy line art drawing itself on, one orange accent | F3, F12, F15 |
| V9 | Sim HUD 3D (`sim-hud`) | realistic 3D sim under a live HUD: T+ clock, readouts | F4, F14, F15 |
| V10 | Doodle Cartoon (`doodle-cartoon`) | recurring thick-outline cast, speech bubbles, one voice per character | F17, F10 |
| V11 | News Desk (`news-desk`) | newsprint, masthead + ticker, ranked story cards, one red key figure, pins on abstract dots (no real maps) | F24, F18, F19 |

### 6.4 Choosing (decide silently, tell the owner in one line)
| the idea / niche is about… | format | style |
|---|---|---|
| how a company/product makes money, why something costs so much | F3 | V1 or V8 |
| how something was invented / why it works | F2 | V1 (V2 for mechanical or inside-body) |
| a rule, reward or plan that backfired; a funny true story | F1 | V1 (V8 for numbers-heavy) |
| an absurd "what if" | F4 | V1 / V9 (V5 for survival) |
| the body, everyday science | F8 | V2 (V4 if simple) |
| unsolved mystery, disappearance | F6 | V3 |
| a country, city, border, map oddity | F5 | V6 |
| "what would you do if…", disasters | F7 / F14 | V5 / V9 |
| today's news | F24 / F18 / F19 | V11 |
| a movie or show | F20-F23 (facts about it, never footage) | V2, V8, V9, V10 |
| "make an edit of a film" | F9 only for a public-domain / CC BY film | V7 |
| relatable everyday comedy, A/B choices | F17 / F16 | V10 / V1 |
**Mixing rule** (`ideas/MATRIX.md`): no default style; across a week cover several formats and styles, never the same
format or style in both slots of a day; after every combo has ~2 posts, give ~60 % of slots to the best-scoring combos
(views vs the channel median, `pipeline.sh scoreboard`), ~30 % to untested ones, ~10 % to new ideas.

## 7. Producing an animated Short (Engine A)
1. **Script** [scripted]: research (2+ sources per claim). Line 1 = whole hook; pivot ("You see," / "Well," / "Step
   one"); escalation; punchline; then ONE comment question (≤ 12 words, specific: a choice, a number, a confession).
   45-58 s ≈ 160-200 words; one line = one beat; numbers spoken as words, captions show digits.
   `pipeline.sh new <style folder> <slug>` → write `script.json` (sources inside it).
2. **Voice** [voiced]: `pipeline.sh voice <slug>` → `readback` → compare with the script; 3.5-3.8 words/s; fix any
   zero-length word in `data/words.json`. Dialogue skits: a per-line `"voice"`.
3. **Build** [built]: `src/shots.js` (+ kits in `src/core/`) following the style's STYLE.md and example. ≤ 3 hard cuts;
   holds with micro-acting; 3-6-frame bursts onto details; faces above the caption line; nothing runs into the lens.
4. **QA** [qa-passed], max 4 rounds: `pipeline.sh check` → CHECK OK; `sheet <slug> 1 10` and `sheet <slug> 0.5 10`, read
   every frame (story clear, captions on the word, no collisions, phone-safe); `cues`; `mix` (≈ -14 LUFS).
5. **Render** [rendered]: `render`, `cover <slug> <t>`, `thumb` (if the channel uses custom thumbnails), `verify`
   (look at `review/mp4check.jpg`), write `PUBLISH.md` (§9).

## 8. Producing a film edit (V7, Engine B)
**Allowed films**: public domain in the US **and** the owner's country (US: published ≤ 1930, each 1 January adds a year;
or a demonstrably lapsed copyright, 2+ sources; e.g. India: ≤ 1965 as of 2026), or Creative Commons Attribution open
movies (Blender Studio) with the credit line. Old transfers from the Internet Archive, our own music, short dialogue
clips, no trademarked characters. List in `references/pd-films/WHITELIST.md`. Unsure → don't.
1. `pipeline.sh film-fetch <film-id> <archive.org mp4 url> [srt url]` (parallel resumable download).
2. No subtitles → `pipeline.sh film-transcribe <film-id>` (Whisper). Silent films: `"mute": true` on dialogue clips.
3. Find moments: `film-srt <film-id> --grep '<word>'`, `film-sheet <film-id> <start> <step> <end>`.
4. `pipeline.sh edit-new <slug>` → `plan.json`: banner, 1-3 dialogue clips (strongest line last), a 24-beat montage,
   ending card with our own definition. `pipeline.sh edit <slug>` → read `review/all.jpg`, fix, rebuild (max 3).
5. PUBLISH.md: `"<banner>" | <Film> (<year>) Edit`; description names film/year/director, "public-domain film",
   "original music and edit by <channel>"; CC BY credit line when needed.

## 9. Delivering and publishing
- **PUBLISH.md**: line 1 `**Channel:** <name> (<id>)`; title ≤ 70 chars, hook-first; description line 1 = the comment
  question (+ options), then the hook line, one context line, `#shorts` + 2-3 topic tags; **no sources in the
  description** (they stay in script.json; the CC BY credit is the one exception); 10-15 tags; category Education (27),
  Comedy (23) or Film & Animation (1); not made for kids.
- **Thumbnail** (phone-verified channels): one designed frame, one subject + a 2-5-word curiosity headline in empty space
  (`pipeline.sh thumb`; rules in `references/THUMBNAILS.md`).
- **Comment engine**: every Short ends on a one-word-answer question, shows the options on screen, may take a mild,
  harmless side; never fake facts or controversy for comments.
- **Create only**: send MP4 + thumbnail + title/description/tags. **Post**: §4.4 route. **Schedule**: `pipeline.sh hold`.

## 10. Automation: the scheduled tasks (`tasks/`)
| task | when | does |
|---|---|---|
| `build.md` | hourly at :30 | `family-next` → builds or resumes ONE Short → holds it for its slot. Never posts. Idle runs end in one line. |
| `post.md` | every 30 min, 06:00-22:30 | posts every due, QA-passed held Short with the channel's own connection; author check; bookkeeping |
| `weekly-planner.md` | Sunday 18:00 | results → idea pool top-up → extends the plan 3 weeks ahead (`--append`) → Notion rows → notifies |
| `on-demand.md` | manual (from chat) | builds one extra Short from a brief the owner gave in chat |
Two tasks (build hourly, post every 30 min) cover any number of slots and channels; a stopped run is resumed by the next
hourly run; a slot more than 6 h late is given up (MOVE). Posting happens only inside the window, never at night.

## 11. More channels later
Add an entry per channel to `channels.json` (own niche, slots, voice, combos). Each channel needs **its own Zapier
YouTube connection** (the owner connects it, picking that channel on Google's chooser); map it with the probe
(`pipeline.sh zap-map`), never by guessing. A channel without a connection is never built or posted to (WAIT). The
post check (`oembed` author = the channel's name) catches a wrong connection and stops all posting. Give each channel
its own art: an 800×800 picture and a 2560×1440 banner (all text inside the centre 1546×423), in its own visual style.
Budget the posting route: Shorts per day × tasks per Short against the plan.

## 12. Lessons and troubleshooting
- **Scheduled tasks keep the permission mode of the chat that created them.** A task that isn't in Auto mode stalls at
  the first prompt while nobody watches. Create tasks from an Auto-mode chat.
- **QA gate in code, not just in prompts**: `hold`, `to-drive` and `pd-post` refuse a Short whose latest build didn't
  pass QA (`qa-gate`), so a run cut off mid-build can never post a half-made Short.
- **Separate builder and poster**: the builder only holds; the poster posts inside the window. No 1 AM posts, no races.
- **MOVE once**: a given-up slot is recorded (`family-moved`) so it doesn't reappear every hour.
- **Never guess which channel a Zapier connection posts to**: probe it (get_my_channel) and match the exact title; check
  the author after every upload.
- macOS iCloud "Documents/Desktop" evicts files → builds hang: keep the studio in `~/shorts-studio`.
- Headless-shell Chrome renders 3D in software (~5 s/frame): use Google Chrome (GPU).
- Static ffmpeg can't verify HTTPS by default: `-ca_file /etc/ssl/cert.pem` (macOS).
- archive.org gives ~0.5 MB/s per connection and resets: `fetch.sh` downloads 10 ranges in parallel and resumes.
- Whisper mishears old film audio: captions use the subtitle words on Whisper's timing.
- Faces above the caption line; bloom threshold > 1 or white heads glow; props below a counter are invisible.
- The first real Short's biggest quality jump: ≤ 3 hard cuts and 3.6 words/s.
- Heavy chats near a build can use up the plan's usage window; the next hourly run resumes.
- Two Shorts can build at once: heavy commands share a lock (`BUSY` = run again).
- Film-edit thumbnails come from `renders/clean.mp4` (no banner/captions).
- Zapier: 2 tasks per successful action; Make.com's free plan can't carry Shorts (5 MB limit); a self-made Google Cloud
  project uploads private-only until audited.
- Channel art without a file-upload tool: YouTube Studio's Customization page accepts files set on its hidden file
  inputs from the page itself (DataTransfer) when the image is fetched from a CORS-readable Google image URL (a Drive
  file's `thumbnailLink` with `=s2560`); Studio URLs take `?authuser=N` (+ `&pageId=` for a brand channel).
- Notion free plan: no cross-database SQL; use rows/view queries.

## 13. Keeping this file current
This file and the whole package are generated by `python3 -I ~/shorts-studio/tools/build_handover.py` from
`handover/BODY.md`, `handover/RUNBOOK.generic.md`, `handover/tasks/` and the live tools (personal paths, accounts, IDs
and channel names are stripped; the build refuses if any slip through). After changing a tool, a rule or a style,
update the source and re-run it. The file map below is generated from the builder's manifest.

## File map: every file in this repository

Runtime folders (`videos/`, `state/`, downloaded films) are created on first use and git-ignored. `tools/edit/fonts/` is not included: copy `Arial Black.ttf`, `Georgia.ttf`, `Georgia Bold.ttf`, `Georgia Italic.ttf` from the system fonts, or use any bold sans + serif and change the names in edit.py.

| path | what it is, when it's used, who edits it |
|---|---|
| `README.md` | Front page of the repository (what you get, quick start, the 10 styles as animated previews, how it works, autopilot, rules, FAQ). Source: handover/repo/README.md in the studio. |
| `install.sh` | One-command setup, safe to re-run: checks Node/ffmpeg/Chrome/Python/git (`--install-tools` installs missing ones with Homebrew/apt/winget), links ~/shorts-studio, copies the skill to ~/.claude/skills/, creates channels.json + STUDIO.md, downloads the voice + Whisper models (`--no-models` skips), runs preflight. `--check` only reports. |
| `CLAUDE.md` | Loaded automatically by Claude Code when it opens this folder: tells the AI it is the producer and where to start (handover.md §1-§4, RUNBOOK.md, tasks/). |
| `LICENSE` | MIT license for the studio's own code, stories, drawings and sound. |
| `THIRD-PARTY.md` | Licenses of bundled or downloaded components (three.js, fonts, Kokoro, Whisper, numpy/scipy). |
| `docs/assets/banner.jpg` | The README banner (2560×1280). docs/assets/social-preview.jpg is the 1280×640 version for GitHub → Settings → Social preview. |
| `docs/assets/styles/*.gif` | One 4-second animated preview per style for the README gallery (made from selftest clips with ffmpeg). |
| `handover.md` | THE guide (this file): system map, rules, setup, the slot lifecycle, formats/styles, production, automation, lessons, and this file map. Generated; edit handover/BODY.md in the studio instead. |
| `RUNBOOK.md` | The exact procedure every scheduled run follows (pick → script → voice → build → QA → render → hold → post → clean up). The AI reads it at the start of each non-idle run. Edit it when a rule changes. |
| `channels.example.json` | Template for channels.json: one channel (id, name, niche, slots, voice, combos, thumbnails, zapier_connection). Copy to channels.json and fill in; add entries for more channels. |
| `STUDIO.example.md` | Template for STUDIO.md, the decisions + lessons log (owner rules, standing approvals, weekly results). The runs read its last sections. |
| `.gitignore` | Keeps runtime data out of git: videos/, state/, renders, downloaded films, channels.json and anything with credentials. |
| `tasks/build.md` | Scheduled-task prompt, hourly: picks the next slot (family-next), builds ONE Short end to end and holds it. Never posts. Paste into the Claude desktop app (Scheduled → new task) from an Auto-mode chat; fill the <…> parts. |
| `tasks/post.md` | Scheduled-task prompt, every 30 min 06:00-22:30: posts due, QA-passed held Shorts with the channel's own Zapier connection, checks the channel name, does the bookkeeping. |
| `tasks/weekly-planner.md` | Scheduled-task prompt, Sunday 18:00: reads results, tops up the idea pool, extends the plan 3 weeks ahead, notifies the owner. |
| `tasks/on-demand.md` | Task prompt run by hand from chat: builds one extra Short from a brief. |
| `tools/pipeline.sh` | The ONE entry point for every shell step (so permissions can allow exactly this script): preflight, new project, voice, readback, check, frames, contact sheets, cues, mix, render, cover, thumbnail, verify, Drive copy, cleanup, checkpoints (state), kinds/tags, hold/held/unhold, qa-gate, family-next/family-moved, plan-rows, channel, zap-map, stats, votes, scoreboard, film-edit commands. Its header lists every command. |
| `tools/family_next.py` | The slot picker behind `pipeline.sh family-next`: reads the plan + state and prints what to build next (LATE / BUILDING / NEXT), what to give up (MOVE), what is blocked (WAIT) and when to re-check connections (PROBE). Works for 1..n channels. |
| `tools/plan_family.py` | The planner: turns channels.json (slots + combos) and the idea pool into ideas/family_plan.json + family_calendar.md, 2 topic options per slot, combos rotated so a day never repeats a style. `--append` extends the plan without reusing ideas. Has two optional extras: an interactive serial on fixed dates and news slots whose topic is picked on the day. |
| `tools/zap_map.py` | Maps Zapier YouTube connections to channels from read-only probes (get_my_channel): exact title match only, or an owner-named assignment. `pipeline.sh zap-map --status` shows the mapping. |
| `tools/thumb.py` | Makes a designed thumbnail from a frame: one subject + a 2-5-word headline with accent words (`pipeline.sh thumb`). Rules in references/THUMBNAILS.md. |
| `tools/publish_meta.py` | Prints the title, description and tags from a project's PUBLISH.md (for manual or browser uploads). |
| `tools/votes.py` | Counts A/B votes in a Short's comments (one per person, via yt-dlp) for an interactive serial (`pipeline.sh votes <id>`). |
| `tools/scoreboard.py` | Views per format × style combo from the `yt` tags (`pipeline.sh scoreboard`): feeds the weekly mixing decisions. |
| `tools/measure.py` | Measures a reference Short (length, words/s, hard cuts, still %, loudness, colours) when studying other channels' formats. |
| `tools/compare.py` | Builds the cross-channel comparison table from measure.py results (optional; only when you study references). |
| `tools/edit/edit.py` | Engine B, the film editor: builds a 9:16 edit from plan.json (crop, grade, slow motion, flashes, glowing word captions, banner, definition card, our music) → render + share copy + cover + contact sheet. |
| `tools/edit/music.py` | Synthesises an original music bed (no samples) timed so the drop lands on a chosen line. |
| `tools/edit/srt.py` | Searches a film's subtitles by word and time (`pipeline.sh film-srt`). |
| `tools/edit/transcribe.py` | Makes subtitles for a film that has none, with Whisper (`pipeline.sh film-transcribe`). |
| `tools/edit/fetch.sh` | Downloads a public-domain film from archive.org in parallel ranges and resumes after resets (`pipeline.sh film-fetch`). |
| `tools/edit/filmsheet.sh` | Contact sheets of a film every N seconds, to find shots (`pipeline.sh film-sheet`). |
| `tools/edit/plan.template.json` | Starting plan for a new film edit (`pipeline.sh edit-new` copies it). |
| `tools/edit/STYLE.md` | The film-edit style guide: shape of an edit, picking shots, phone-safe layout, review rounds, publishing text. |
| `tools/pipedream/upload_step.mjs` | Optional free posting route: a Pipedream workflow step that uploads the MP4 (+ thumbnail) through the YouTube API; called by `pipeline.sh pd-post` with a secret endpoint kept in config/pipedream.json (never committed). |
| `ideas/MATRIX.md` | Formats (F) × styles (V): where each comes from, which pairs work (✓ ~ ✗) and the mixing rule the planner follows. |
| `ideas/family_ideas.example.json` | Shape of the idea pool ({channel id: {combo: [[title, comment question], …]}}) with a few examples. The weekly planner tops up the real ideas/family_ideas.json. |
| `references/THUMBNAILS.md` | Thumbnail rules learned from the reference channels (one subject, short curiosity headline, placement). |
| `references/pd-films/WHITELIST.md` | Which films may be edited (public domain in the US and the owner's country, or CC BY), with the checks behind each one. |
| `skill/faceless-shorts/` | Engine A, the Faceless Shorts skill. Install by copying this folder to ~/.claude/skills/faceless-shorts/, then scripts/setup.sh and scripts/selftest.sh. SKILL.md tells the AI how to make a Short; README.md is the human intro. |
| `skill/faceless-shorts/SKILL.md` | Instructions the AI loads for every Short: workflow, the 11 styles, when to use which, rules. |
| `skill/faceless-shorts/README.md` | Human introduction to the skill. |
| `skill/faceless-shorts/scripts/setup.sh` | One-time setup: Python venv (~/.faceless-shorts/venv), Kokoro voice, Whisper, checks; run until "All set". |
| `skill/faceless-shorts/scripts/selftest.sh` | Renders a short test clip in every style; must end with SELFTEST PASSED. |
| `skill/faceless-shorts/scripts/new_video.sh` | Starts a project from a style's example (`pipeline.sh new <style> <slug>` calls it). |
| `skill/faceless-shorts/scripts/voice.py` | Kokoro narration from script.json (per-line voices for dialogue) + word timings. |
| `skill/faceless-shorts/scripts/words.py` | Whisper word timings and caption words. |
| `skill/faceless-shorts/scripts/estimate.py` | Estimates length and pace of a script before voicing. |
| `skill/faceless-shorts/scripts/py` | Runs the skill's Python (the venv) for the other scripts. |
| `skill/faceless-shorts/styles/deep-dive/` | Style "Deep Dive 3D": `STYLE.md` (the look and its rules), `style-sheet.png` (preview), `example/` (a complete working project: `script.json`, `src/shots.js` = the per-video file, `src/core/` = the style kit, `data/` = voice + word timings, `tools/` = capture + mix, `vendor/` = bundled libraries, `fonts/`). Copy it for a new Short. |
| `skill/faceless-shorts/styles/doodle-cartoon/` | Style "Doodle Cartoon": `STYLE.md` (the look and its rules), `style-sheet.png` (preview), `example/` (a complete working project: `script.json`, `src/shots.js` = the per-video file, `src/core/` = the style kit, `data/` = voice + word timings, `tools/` = capture + mix, `vendor/` = bundled libraries, `fonts/`). Copy it for a new Short. |
| `skill/faceless-shorts/styles/inside-out/` | Style "Inside Out": `STYLE.md` (the look and its rules), `style-sheet.png` (preview), `example/` (a complete working project: `script.json`, `src/shots.js` = the per-video file, `src/core/` = the style kit, `data/` = voice + word timings, `tools/` = capture + mix, `vendor/` = bundled libraries, `fonts/`). Copy it for a new Short. |
| `skill/faceless-shorts/styles/kinetic-diagram/` | Style "Kinetic Diagram": `STYLE.md` (the look and its rules), `style-sheet.png` (preview), `example/` (a complete working project: `script.json`, `src/shots.js` = the per-video file, `src/core/` = the style kit, `data/` = voice + word timings, `tools/` = capture + mix, `vendor/` = bundled libraries, `fonts/`). Copy it for a new Short. |
| `skill/faceless-shorts/styles/news-desk/` | Style "News Desk": `STYLE.md` (the look and its rules), `style-sheet.png` (preview), `example/` (a complete working project: `script.json`, `src/shots.js` = the per-video file, `src/core/` = the style kit, `data/` = voice + word timings, `tools/` = capture + mix, `vendor/` = bundled libraries, `fonts/`). Copy it for a new Short. |
| `skill/faceless-shorts/styles/night-file/` | Style "Night File 3D": `STYLE.md` (the look and its rules), `style-sheet.png` (preview), `example/` (a complete working project: `script.json`, `src/shots.js` = the per-video file, `src/core/` = the style kit, `data/` = voice + word timings, `tools/` = capture + mix, `vendor/` = bundled libraries, `fonts/`). Copy it for a new Short. |
| `skill/faceless-shorts/styles/paper-atlas/` | Style "Paper Atlas": `STYLE.md` (the look and its rules), `style-sheet.png` (preview), `example/` (a complete working project: `script.json`, `src/shots.js` = the per-video file, `src/core/` = the style kit, `data/` = voice + word timings, `tools/` = capture + mix, `vendor/` = bundled libraries, `fonts/`). Copy it for a new Short. |
| `skill/faceless-shorts/styles/sim-hud/` | Style "Sim HUD 3D": `STYLE.md` (the look and its rules), `style-sheet.png` (preview), `example/` (a complete working project: `script.json`, `src/shots.js` = the per-video file, `src/core/` = the style kit, `data/` = voice + word timings, `tools/` = capture + mix, `vendor/` = bundled libraries, `fonts/`). Copy it for a new Short. |
| `skill/faceless-shorts/styles/stick-story/` | Style "Stick Story": `STYLE.md` (the look and its rules), `style-sheet.png` (preview), `example/` (a complete working project: `script.json`, `src/shots.js` = the per-video file, `src/core/` = the style kit, `data/` = voice + word timings, `tools/` = capture + mix, `vendor/` = bundled libraries, `fonts/`). Copy it for a new Short. |
| `skill/faceless-shorts/styles/tall-tale/` | Style "Tall Tale 3D": `STYLE.md` (the look and its rules), `style-sheet.png` (preview), `example/` (a complete working project: `script.json`, `src/shots.js` = the per-video file, `src/core/` = the style kit, `data/` = voice + word timings, `tools/` = capture + mix, `vendor/` = bundled libraries, `fonts/`). Copy it for a new Short. |

