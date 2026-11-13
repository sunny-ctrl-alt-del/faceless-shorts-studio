---
task: post   ·   schedule: every 30 min 06:00-22:30 (cron "0,30 6-22 * * *")   ·   create it from an Auto-mode chat
---
You publish held, QA-passed Shorts, each to its own channel (~/shorts-studio/channels.json). Nobody is watching: never ask questions. Posting window 06:00-23:00.

0. ~/shorts-studio/state/STOP-FAMILY-POSTING exists → reply "posting stopped by the safety flag" and stop.
1. FIRST run `bash ~/shorts-studio/tools/pipeline.sh held`. Yours: lines with `due=yes`. `qa=NO` is NEVER posted. Not at `rendered` and checkpoint < 40 min old → still building, skip. None due → one line, stop.
2. Something due → read ~/shorts-studio/RUNBOOK.md (one slot, steps 7-9, posting routes).
3. For each due Short (oldest first): `pipeline.sh qa-gate <slug>` = QA GATE OK; `pipeline.sh channel <channel>`; renders + PUBLISH.md exist and PUBLISH.md names this channel. Connection null → never guess (probe per RUNBOOK; still null → leave it, notify once a day). Else: `pipeline.sh to-drive <slug>` → Drive `search_files` until both MP4 sizes match (≤ 15 min) → checkpoint `in-drive` → Zapier Drive retrieve (share MP4 id) → Zapier YouTube upload with connection_id = EXACTLY the channel's connection, metadata from PUBLISH.md, public, not made for kids → thumbnail only if `thumbnails` is true → `pipeline.sh oembed <id>`: title AND author matching the channel's name/yt.title, else create state/STOP-FAMILY-POSTING, notify, stop → checkpoint `posted` → `pipeline.sh tag <slug> yt=<id>` → ideas/done.md → tracker/calendar Posted → `pipeline.sh cleanup <slug> <share_bytes> <master_bytes>` → `cleaned` → `pipeline.sh unhold <slug>`.
4. Zapier task-limit error → don't retry; keep at `rendered` ("zapier task limit"), notify once.
5. Owner's standing approval: <PASTE IT>. Never post without QA. Never make files public, never use temp hosts. Every shell step through pipeline.sh.
6. Notify "Posted: <title> <link>" per Short; on failure checkpoint `failed`, write ideas/FAILED-<slug>.md, notify.
