#!/bin/bash
# The studio's one entry point for every shell step of a daily Short (so permissions can allow exactly this script).
#   bash ~/shorts-studio/tools/pipeline.sh <command> [args]
# Commands:
#   preflight                         disk, ffmpeg, Chrome, Python env, skill present → "PREFLIGHT OK"
#   new <style> <slug>                start a project from a faceless-shorts style example
#   voice <slug>                      Kokoro narration + Whisper word timings
#   readback <slug>                   Whisper transcript of the narration (compare with the script)
#   check <slug>                      draw every 0.25 s → "CHECK OK"
#   frames <slug> <t1,t2,...>         full-size frames → review/f/
#   sheet <slug> <step> <cols> [name] contact sheet → review/<name|all>.jpg
#   cues <slug> | mix <slug>          sound cues, then the mix (narration + music + effects)
#   render <slug>                     final MP4 → renders/<slug>.mp4, share copy, loudness + ffprobe report
#   cover <slug> <t>                  cover frame → renders/cover.jpg
#   thumb <slug> <t> "<Head *line*>" [--y PX] [--crop-top PX] [--style dark|light|map|data]   designed thumbnail → renders/thumbnail.jpg
#   verify <slug>                     4 frames pulled from the MP4 → review/mp4check.jpg
#   to-drive <slug>                   copy MP4s + cover + PUBLISH.md into Drive/Shorts Studio/Published/<slug>/
#   cleanup <slug> <share_bytes> <master_bytes>   delete local renders + review ONLY if both sizes match the local files
#   state <slug> <step> [note]        checkpoint (+ heartbeat) → ~/shorts-studio/state/<slug>.json
#   kind <slug> <daily|ondemand> [am|pm]   tag a project (no tag = daily); daily Shorts carry their slot (AM 10:00 / PM 20:00)
#   kind <slug> family <channel> <HH:MM>   a family-channel Short (news|movies|science|history|skits) and its slot time
#   channel <id>                      that channel's row from channels.json (name, handle, zapier_connection, thumbnails, voice)
#   zap-map [--status] < probe.json   map Zapier YouTube connections → channels from get_my_channel probes (title match only)
#   family-moved <slug_prefix>        record a MOVE slot as given up (after its calendar row is set to Moved) so family-next drops it
#   plan-rows <from> <to>             the plan's rows for those dates as Notion "Family Calendar" properties (JSON) for create-pages
#   family-next [--hours N] [--json]  which family slots to build next (LATE / BUILDING / NEXT), from ideas/family_plan.json
#   tag <slug> key=value …            e.g. format=F3 style=V1 yt=<youtube id> (used by scoreboard)
#   scoreboard                        views per format × style combo (ideas/MATRIX.md mixing rule)
#   hold <slug> "YYYY-mm-dd HH:MM"    build now, post later: to-drive refuses (exit 3, "HOLD") until that time
#   qa-gate <slug>                    "QA GATE OK" only if the latest build passed QA (exit 6 otherwise). hold, to-drive and
#                                     pd-post refuse without it; run it before any Chrome upload too. Never post on exit 6.
#   unhold <slug>                     remove the hold (post-held-short does this after posting)
#   status [date]                     print the checkpoint(s) for a date (default today)
#   power                             show power source and battery level (information only)
# Classic Cuts (public-domain film edits, tools/edit/):
#   film-fetch <film-id> <url> [srt-url]    download a PD film (+ subtitles) → references/pd-films/<film-id>/film.mp4
#   film-sheet <film-id> <start> <step> <end>   contact sheets → references/pd-films/<film-id>/sheets/sheet_N.jpg
#   film-srt <film-id> [--grep RE] [--from S] [--to S]   search its subtitles
#   film-transcribe <film-id>         no subtitles? make film.srt with Whisper (slow: ~15 min per 2 h film)
#   edit-new <slug>                   start an edit project (videos/<slug>/plan.json from the template)
#   edit <slug>                       build the edit from plan.json → renders/<slug>.mp4 + share copy + cover + review/all.jpg
# No battery rule (owner, 2026-11-11): the Mac is kept on charge; runs go ahead at any battery level.
# Renderer lock: voice/readback/check/frames/sheet/render/cover take turns across Shorts; a command that can't get
# the lock within ~90 s exits 75 with "BUSY ..." and should simply be run again.
#   oembed <youtube_id>               confirm a video is public
#   stats <id> [id...]                views / likes / comments of posted Shorts (yt-dlp, no sign-in)
#   votes <id>                        Your Call serial: count A/B votes in a Short's comments (one per person)
#   pd-post <slug> [channel]          posting route #2: upload via the Pipedream workflow (config/pipedream.json) → prints the YouTube id
#   compare                           refresh the reference-channel table (optional; needs references/<channel>/measure data)
set -euo pipefail
NODE_BIN=$( (ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null || true) | tail -1)
export PATH="$HOME/.local/bin:${NODE_BIN:+$NODE_BIN:}/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
STUDIO="$HOME/shorts-studio"; SKILL="$HOME/.claude/skills/faceless-shorts"; PY="$HOME/.faceless-shorts/venv/bin/python"
DRIVE_ROOT="$( (ls -d "$HOME"/Library/CloudStorage/GoogleDrive-*/"My Drive" 2>/dev/null || true) | head -1)"  # Windows/Linux: set SHORTS_DRIVE
DRIVE="${SHORTS_DRIVE:-$DRIVE_ROOT/Shorts Studio/Published}"
cmd="${1:-}"; shift || true
slugok() { [[ "${1:-}" =~ ^20[0-9]{2}-[01][0-9]-[0-3][0-9]-[a-z0-9-]{2,60}$ ]] || { echo "bad slug '${1:-}' (want yyyy-mm-dd-words)" >&2; exit 2; }; }
proj() { slugok "$1"; P="$STUDIO/videos/$1"; [ -d "$P" ] || { echo "no project $P" >&2; exit 2; }; }
power() { command -v pmset >/dev/null || { echo "power: n/a (not macOS)"; return 0; }; b=$(pmset -g batt); pct=$(echo "$b" | grep -Eo '[0-9]+%' | head -1 | tr -d %)
  if echo "$b" | grep -q "AC Power"; then echo "power: mains (battery ${pct:-?}%)"; return 0; fi
  echo "power: battery ${pct:-?}%"; }
qaok() { # QA gate (owner, 2026-11-13): a Short may be held, copied to Drive or posted ONLY if its latest build passed QA
  "$PY" -I -c "
import json, sys
try: s = json.load(open(sys.argv[1]))
except Exception: print('QA GATE: no state file'); sys.exit(6)
h = [e[1] for e in s.get('history', [])]
last_build = max([i for i, x in enumerate(h) if x in ('scripted', 'voiced', 'built')], default=-1)
last_qa = max([i for i, x in enumerate(h) if x == 'qa-passed'], default=-1)
if last_qa < 0: print('QA GATE: never passed QA, do not hold or post'); sys.exit(6)
if last_qa < last_build: print('QA GATE: rebuilt after its last QA pass, run QA again before holding or posting'); sys.exit(6)
if s.get('step') == 'failed': print('QA GATE: last checkpoint is failed, resume it first'); sys.exit(6)
" "$STUDIO/state/$1.json"; }
heavy() { L="$STUDIO/state/.renderer.lock"; mkdir -p "$STUDIO/state"
  for i in $(seq 1 18); do
    if mkdir "$L" 2>/dev/null; then echo "$1 pid $$ since $(date +%T)" > "$L/owner"; trap 'rm -rf "$L"' EXIT; return 0; fi
    age=$(( $(date +%s) - $(stat -f %m "$L" 2>/dev/null || date +%s) )); [ "$age" -gt 3600 ] && { rm -rf "$L"; continue; }
    [ "$i" = 1 ] && echo "renderer in use by: $(cat "$L/owner" 2>/dev/null); waiting up to 90 s" >&2; sleep 5; done
  echo "BUSY: the renderer is in use by another Short ($(cat "$L/owner" 2>/dev/null)). Run the same command again." >&2; exit 75; }
case "$cmd" in voice|readback|check|frames|sheet|render|cover|edit|film-sheet|film-transcribe) heavy "${1:-?} $cmd" ;; esac
PDF="$STUDIO/references/pd-films"; filmok() { [[ "${1:-}" =~ ^[a-z0-9-]{2,60}$ ]] || { echo "bad film id '${1:-}'" >&2; exit 2; }; }

case "$cmd" in
  power) power ;;
  film-fetch) filmok "$1"; [[ "${2:-}" =~ ^https://(archive\.org/download/|download\.blender\.org/) ]] || { echo "only archive.org (public domain) or download.blender.org (CC BY open movies)" >&2; exit 2; }
    mkdir -p "$PDF/$1"; [ -s "$PDF/$1/film.mp4" ] || bash "$STUDIO/tools/edit/fetch.sh" "$2" "$PDF/$1/film.mp4" 10
    if [ -n "${3:-}" ]; then curl -sSL -o "$PDF/$1/film.srt" "$3"; fi
    ffprobe -v error -show_entries stream=codec_type,width,height:format=duration -of compact "$PDF/$1/film.mp4"; ls -l "$PDF/$1" ;;
  film-sheet) filmok "$1"; bash "$STUDIO/tools/edit/filmsheet.sh" "$PDF/$1/film.mp4" "$PDF/$1/sheets" "${2:?start}" "${3:?step}" "${4:?end}" 240 12 10 ;;
  film-transcribe) filmok "$1"; [ -s "$PDF/$1/film.srt" ] && { echo "film.srt exists"; exit 0; }; "$PY" -I "$STUDIO/tools/edit/transcribe.py" "$PDF/$1/film.mp4" "$PDF/$1/film.srt" ;;
  film-srt) filmok "$1"; f="$1"; shift; python3 -I "$STUDIO/tools/edit/srt.py" "$PDF/$f/film.srt" "$@" ;;
  edit-new) slugok "$1"; P="$STUDIO/videos/$1"; [ -e "$P" ] && { echo "exists: $P" >&2; exit 2; }; mkdir -p "$P"/{renders,review}
    cp "$STUDIO/tools/edit/plan.template.json" "$P/plan.json"; echo "$P/plan.json" ;;
  edit) proj "$1"; cd "$P"; "$PY" -I "$STUDIO/tools/edit/edit.py" "$P"
    ffmpeg -v error -y -i "renders/$1.mp4" -c:v libx264 -crf 21 -preset slow -c:a aac -b:a 160k -movflags +faststart "renders/$1-share.mp4"
    ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of compact "renders/$1.mp4"
    ffmpeg -hide_banner -nostats -i "renders/$1.mp4" -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tr -s ' '
    ls -l renders/ ;;
  preflight)
    power
    free=$(df -Pk "$HOME" | awk 'NR==2{print int($4/1048576)}'); echo "free disk: ${free} GB"; [ "$free" -ge 5 ] || { echo "PREFLIGHT FAIL: <5 GB free"; exit 1; }
    for b in ffmpeg ffprobe node; do command -v $b >/dev/null || { echo "PREFLIGHT FAIL: $b missing"; exit 1; }; done
    ch=0; for c in "${CHROME:-}" "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" /usr/bin/google-chrome /usr/bin/google-chrome-stable /usr/bin/chromium /usr/bin/chromium-browser "/c/Program Files/Google/Chrome/Application/chrome.exe"; do [ -n "$c" ] && [ -x "$c" ] && ch=1 && break; done
    [ $ch = 1 ] || { echo "PREFLIGHT FAIL: Google Chrome missing (or set CHROME=/path/to/chrome)"; exit 1; }
    [ -x "$PY" ] && [ -d "$SKILL/styles" ] || { echo "PREFLIGHT FAIL: python env or skill missing"; exit 1; }
    [ -d "$(dirname "$DRIVE")/.." ] || echo "warning: Google Drive mount not found (Drive for Desktop running?)"
    echo "PREFLIGHT OK" ;;
  new) style="${1:?style}"; slugok "${2:-}"; bash "$SKILL/scripts/new_video.sh" "$style" "$2" --dir "$STUDIO/videos" ;;
  voice) proj "$1"; cd "$P"; "$SKILL/scripts/py" "$SKILL/scripts/voice.py" . && "$SKILL/scripts/py" "$SKILL/scripts/words.py" . ;;
  readback) proj "$1"; "$PY" -I -c "
import subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel('small.en', device='cpu', compute_type='int8')
raw = subprocess.run(['ffmpeg','-v','error','-i','$P/data/narration.wav','-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True).stdout
segs,_ = m.transcribe(np.frombuffer(raw, dtype=np.float32), vad_filter=False)
print(' '.join(s.text.strip() for s in segs))" ;;
  check) proj "$1"; cd "$P"; node tools/capture.mjs check | tail -3 ;;
  frames) proj "$1"; cd "$P"; node tools/capture.mjs frames review/f "${2:?times}" ;;
  sheet) proj "$1"; cd "$P"; node tools/capture.mjs sheet "review/${4:-all}.jpg" "${2:-1}" "${3:-10}" ;;
  cues) proj "$1"; cd "$P"; node tools/capture.mjs cues ;;
  mix) proj "$1"; cd "$P"; "$SKILL/scripts/py" tools/mix.py . ;;
  render) proj "$1"; cd "$P"; mkdir -p renders
    node tools/capture.mjs video "renders/$1.mp4"
    ffmpeg -v error -y -i "renders/$1.mp4" -c:v libx264 -crf 21 -preset slow -c:a aac -b:a 160k -movflags +faststart "renders/$1-share.mp4"
    ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of compact "renders/$1.mp4"
    ffmpeg -hide_banner -nostats -i "renders/$1.mp4" -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tr -s ' '
    ls -l renders/ ;;
  cover) proj "$1"; cd "$P"; node tools/capture.mjs frames review/cover "${2:?time}" >/dev/null; cp "review/cover/t$(printf %.2f "$2").jpg" renders/cover.jpg; ls -l renders/cover.jpg ;;
  thumb) proj "$1"; t="${2:?time}"; h="${3:?headline}"; shift 3; python3 -I "$STUDIO/tools/thumb.py" "$P" "$t" "$h" "$@" ;;
  verify) proj "$1"; cd "$P"; d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "renders/$1.mp4"); mkdir -p review/mv
    for k in 1 2 3 4; do ffmpeg -v error -y -ss "$(python3 -c "print($d*$k/5)")" -i "renders/$1.mp4" -frames:v 1 -vf scale=270:480 "review/mv/$k.jpg"; done
    ffmpeg -v error -y -i review/mv/%d.jpg -vf tile=4x1:padding=4 -frames:v 1 review/mp4check.jpg; echo "$P/review/mp4check.jpg" ;;
  hold) slugok "$1"; t="${2:?'YYYY-mm-dd HH:MM'}"; date -j -f "%Y-%m-%d %H:%M" "$t" +%s >/dev/null || exit 2; mkdir -p "$STUDIO/state"
    qaok "$1" || { echo "HOLD REFUSED: $1 has not passed QA (see above). Finish QA first; never hold or post an unchecked Short."; exit 6; }
    echo "$t" > "$STUDIO/state/$1.hold"; echo "hold: $1 posts no earlier than $t" ;;
  qa-gate) slugok "$1"; qaok "$1" && echo "QA GATE OK: $1 passed QA on its latest build" ;;
  unhold) slugok "$1"; rm -f "$STUDIO/state/$1.hold"; echo "hold removed: $1" ;;
  held) for h in "$STUDIO"/state/*.hold; do [ -f "$h" ] || continue; sl=$(basename "$h" .hold); t=$(cat "$h")
      due=no; [ "$(date +%s)" -ge "$(date -j -f "%Y-%m-%d %H:%M" "$t" +%s)" ] && due=yes
      st=$("$PY" -I -c "import json; s = json.load(open('$STUDIO/state/$sl.json')); print(s['step'], s.get('kind', 'daily') + ('-' + s['channel'] if s.get('channel') else ''))" 2>/dev/null || echo "none daily")
      qa=ok; qaok "$sl" >/dev/null 2>&1 || qa=NO
      echo "$sl post_at=\"$t\" due=$due step=${st% *} kind=${st#* } qa=$qa"; done; true ;;
  to-drive) proj "$1"; D="$DRIVE/$1"
    qaok "$1" || { echo "POST REFUSED: $1 has not passed QA. It stays local; the next build run resumes it."; exit 6; }
    if [ -f "$STUDIO/state/$1.hold" ]; then t=$(cat "$STUDIO/state/$1.hold"); due=$(date -j -f "%Y-%m-%d %H:%M" "$t" +%s)
      if [ "$(date +%s)" -lt "$due" ]; then
        echo "HOLD (planned, not an error): $1 is held for its slot: the task 'family-post' posts it at $t IST. Drive copy and posting are locked until then. Per RUNBOOK 'Held Shorts': record the step as rendered with the note 'held for $t (owner)', set its calendar row status to 'scheduled $t', and end this run normally without a failed checkpoint."; exit 3; fi; fi
    mkdir -p "$D"
    for f in "renders/$1.mp4" "renders/$1-share.mp4" renders/cover.jpg renders/thumbnail.jpg PUBLISH.md; do [ -f "$P/$f" ] && cp "$P/$f" "$D/"; done
    ls -l "$D" | awk 'NR>1{print $5, $NF}' ;;
  cleanup) proj "$1"; s_ok=$(stat -f %z "$P/renders/$1-share.mp4"); m_ok=$(stat -f %z "$P/renders/$1.mp4")
    [ "$s_ok" = "${2:?share bytes}" ] && [ "$m_ok" = "${3:?master bytes}" ] || { echo "CLEANUP REFUSED: Drive sizes ($2/$3) != local ($s_ok/$m_ok)"; exit 1; }
    rm -f "$P/renders/$1.mp4" "$P/renders/$1-share.mp4" "$P/renders/cover.jpg" "$P/renders/thumbnail.jpg" "$P/renders/clean.mp4"; rm -rf "$P/review"
    echo "Moved to Google Drive: My Drive/Shorts Studio/Published/$1/ ($(date '+%F %T'))" > "$P/renders/IN_DRIVE.txt"; du -sh "$P" ;;
  state) slugok "$1"; mkdir -p "$STUDIO/state"; "$PY" -I -c "
import json, sys, time, pathlib
p = pathlib.Path('$STUDIO/state/$1.json'); s = json.loads(p.read_text()) if p.exists() else {'slug': '$1', 'history': []}
s['step'] = sys.argv[1]; s['note'] = sys.argv[2] if len(sys.argv) > 2 else ''; s['updated'] = time.strftime('%Y-%m-%dT%H:%M:%S'); s['ts'] = time.time()
s['history'].append([s['updated'], s['step'], s['note']]); p.write_text(json.dumps(s, indent=1)); print('state', s['step'], s['updated'])" "${2:?step}" "${3:-}" ;;
  tag) slugok "$1"; sl="$1"; shift; mkdir -p "$STUDIO/state"; "$PY" -I -c "
import json, sys, pathlib
p = pathlib.Path('$STUDIO/state/$sl.json'); s = json.loads(p.read_text()) if p.exists() else {'slug': '$sl', 'history': [], 'step': 'new', 'ts': 0, 'updated': '', 'note': ''}
for kv in sys.argv[1:]:
    k, _, v = kv.partition('='); assert k in ('format', 'style', 'yt', 'series', 'slot', 'channel'), k; s[k] = v
p.write_text(json.dumps(s, indent=1)); print({k: s.get(k) for k in ('format', 'style', 'yt')})" "$@" ;;
  scoreboard) python3 -I "$STUDIO/tools/scoreboard.py" ;;
  kind) slugok "$1"; [[ "${2:-}" =~ ^(daily|ondemand|family)$ ]] || { echo "kind must be daily, ondemand or family" >&2; exit 2; }
    if [ "$2" = family ]; then   # family <channel id from channels.json> <HH:MM slot>
      [[ "${3:-}" =~ ^(news|movies|science|history|skits)$ ]] || { echo "family channel must be news|movies|science|history|skits" >&2; exit 2; }
      [[ "${4:-}" =~ ^[0-2][0-9]:[0-5][0-9]$ ]] || { echo "family slot must be HH:MM" >&2; exit 2; }
    else case "${3:-}" in ''|am|pm) ;; *) echo "slot must be am or pm" >&2; exit 2 ;; esac; fi
    mkdir -p "$STUDIO/state"; "$PY" -I -c "
import json, sys, pathlib
p = pathlib.Path('$STUDIO/state/$1.json'); s = json.loads(p.read_text()) if p.exists() else {'slug': '$1', 'history': [], 'step': 'new', 'ts': 0, 'updated': '', 'note': ''}
s['kind'] = sys.argv[1]
if sys.argv[1] == 'family': s['channel'], s['slot'] = sys.argv[2], sys.argv[3]
elif sys.argv[2]: s['slot'] = sys.argv[2]
p.write_text(json.dumps(s, indent=1)); print('kind', s['kind'], s.get('channel', ''), s.get('slot', ''))" "$2" "${3:-}" "${4:-}" ;;
  channel) "$PY" -I -c "
import json, sys; d = json.load(open('$STUDIO/channels.json'))
c = [x for x in d['channels'] if x['id'] == sys.argv[1]]
if not c: sys.exit('unknown channel ' + sys.argv[1] + ' (wcm|news|movies|science|history|skits)')
c = c[0]; print(json.dumps({k: c.get(k) for k in ('id', 'name', 'handle', 'zapier_connection', 'thumbnails', 'voice', 'slots', 'audience')}, ensure_ascii=False))" "${1:?channel id}" ;;
  zap-map) "$PY" -I "$STUDIO/tools/zap_map.py" "$@" ;;
  family-moved) [[ "${1:-}" =~ ^20[0-9]{2}-[01][0-9]-[0-3][0-9]-[a-z]+-[0-9]{4}-$ ]] || { echo "want a slug prefix like 2026-11-13-news-0730-" >&2; exit 2; }
    "$PY" -I -c "
import json, sys; from pathlib import Path
f = Path(sys.argv[1]); m = set(json.loads(f.read_text())) if f.exists() else set(); m.add(sys.argv[2])
f.write_text(json.dumps(sorted(m), indent=0)); print('recorded as moved:', sys.argv[2])" "$STUDIO/state/moved.json" "$1" ;;
  plan-rows) "$PY" -I -c "
import json, sys, datetime as dt
rows = [r for r in json.load(open(sys.argv[1])) if sys.argv[2] <= r['date'] <= sys.argv[3]]
names = {c['id']: c['name'] for c in json.load(open(sys.argv[4]))['channels']}
out = [{'Slot': dt.date.fromisoformat(r['date']).strftime('%a %d') + ' · ' + r['time'] + ' · ' + names[r['channel']], 'Channel': names[r['channel']],
        'date:Date:start': r['date'], 'date:Date:is_datetime': 0, 'Time': r['time'], 'Format': r['format'], 'Style': r['style'], 'Combo': r['combo'],
        'Kind': 'serial' if r['kind'].startswith('serial') else r['kind'], 'Status': 'Proposed',
        'Option A': r['options'][0][0], 'Question A': r['options'][0][1], 'Option B': r['options'][1][0], 'Question B': r['options'][1][1]} for r in rows]
print(json.dumps(out, ensure_ascii=False))" "$STUDIO/ideas/family_plan.json" "${1:?from YYYY-mm-dd}" "${2:?to YYYY-mm-dd}" "$STUDIO/channels.json" ;;
  family-next) "$PY" -I "$STUDIO/tools/family_next.py" "$@" ;;
  status) day="${1:-$(date +%F)}"; { ls "$STUDIO"/state/"$day"-*.json 2>/dev/null || echo "no project for $day yet" >&2; } | while read f; do "$PY" -I -c "
import json, time, os; s = json.load(open('$f')); h = '$f'[:-5] + '.hold'
held = ('HELD until ' + open(h).read().strip() + (' (ready, not stalled: family-post posts it)' if s['step'] == 'rendered' else ' (still building: resume as usual, it stops at to-drive)')) if os.path.exists(h) else ''
kind = s.get('kind', 'daily') + ('-' + s['channel'] if s.get('channel') else '') + ('-' + s['slot'] if s.get('slot') else '')
print(s['slug'], kind, s['step'], s['updated'], 'idle_min=%d' % ((time.time() - s.get('ts', 0)) / 60), held, s.get('note', ''))"; done; true ;;
  stats) for id in "$@"; do [[ "$id" =~ ^[A-Za-z0-9_-]{11}$ ]] || { echo "bad id $id" >&2; continue; }
      "$HOME/.local/bin/yt-dlp" -q --no-warnings --skip-download --print "$id views=%(view_count)s likes=%(like_count)s comments=%(comment_count)s" "https://www.youtube.com/shorts/$id" 2>/dev/null || echo "$id unavailable"; done ;;
  pd-post) proj "$1"; qaok "$1" || { echo "POST REFUSED: $1 has not passed QA."; exit 6; }; ch="${2:-main}"; cfg="$STUDIO/config/pipedream.json"; [ -f "$cfg" ] || { echo "PIPEDREAM NOT SET UP (no config/pipedream.json)"; exit 4; }
    ep=$("$PY" -I -c "import json,sys; print(json.load(open(sys.argv[1]))['endpoint'])" "$cfg"); share="$P/renders/$1-share.mp4"; [ -f "$share" ] || { echo "no $share"; exit 2; }
    meta=$("$PY" -I "$STUDIO/tools/publish_meta.py" "$P" "$ch") || exit 2
    th=(); [ -f "$P/renders/thumbnail.jpg" ] && th=(-F "thumbnail=@$P/renders/thumbnail.jpg;type=image/jpeg")
    curl -sS --max-time 330 -F "video=@$share;type=video/mp4" "${th[@]}" -F "meta=$meta" "$ep" ;;
  votes) [[ "${1:-}" =~ ^[A-Za-z0-9_-]{11}$ ]] || { echo "bad id" >&2; exit 2; }; python3 -I "$STUDIO/tools/votes.py" "$@" ;;
  oembed) [[ "${1:-}" =~ ^[A-Za-z0-9_-]{11}$ ]] || { echo "bad id" >&2; exit 2; }; curl -sS "https://www.youtube.com/oembed?url=https://www.youtube.com/shorts/$1&format=json" | head -c 300; echo ;;
  compare) cd "$STUDIO" && python3 - <<'EOF'
import subprocess, re
p = 'references/ALL_CHANNELS.md'; s = open(p).read()
t = subprocess.run(['python3', 'tools/compare.py'], capture_output=True, text=True).stdout.strip()
s = re.sub(r'<!-- table:start -->.*?<!-- table:end -->', '<!-- table:start -->\n' + t + '\n<!-- table:end -->', s, flags=re.S)
open(p, 'w').write(s); print(t)
EOF
    ;;
  *) sed -n '2,25p' "$0"; exit 1 ;;
esac
