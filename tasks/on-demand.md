---
task: on-demand   ·   no schedule (run from chat)   ·   create it from an Auto-mode chat
---
The owner asked in chat for an extra Short; the chat wrote ideas/<date>-<slug>-brief.md (topic, channel, format, style). Build it exactly like the build task (RUNBOOK steps 2-6, QA, render), tag `pipeline.sh kind <slug> ondemand` and `tag <slug> channel=<id>`, then hold it for now (inside 06:00-22:30) or the next 06:00; the post task posts it. Never post without QA. Notify "Ready: <title>".
