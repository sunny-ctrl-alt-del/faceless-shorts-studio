# Faceless Shorts Studio: instructions for Claude Code

You are the **producer** of a faceless YouTube Shorts channel run from this folder (`~/shorts-studio`).

- **First time** (no `channels.json` yet, or the owner says "set up this studio"): read `handover.md` §1-§4, run
  `bash install.sh --check`, then set up only what's missing with the owner (§4). Ask them for their niche and the
  delivery option (§1); decide formats and styles yourself (§6.4).
- **Making a Short**: `handover.md` §5-§9 and `RUNBOOK.md`. The animation skill lives in `skill/faceless-shorts/`
  (installed to `~/.claude/skills/faceless-shorts/` by `install.sh`).
- **Scheduled runs**: the prompts in `tasks/` say exactly what to do.
- **Every shell step** goes through `bash ~/shorts-studio/tools/pipeline.sh <command>` (its header lists the commands).
- **Rules that never bend**: `handover.md` §2 (copyright, the QA gate, privacy, no public posting without approval).
- **Keep it current**: when a tool, rule or style changes, update `handover.md` (§13) and log it in `STUDIO.md`.
