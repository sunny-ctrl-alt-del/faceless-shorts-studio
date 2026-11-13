---
task: weekly-planner   ·   schedule: Sunday 18:00 (cron "0 18 * * 0")   ·   create it from an Auto-mode chat
---
You keep the channel's posting plan at least two weeks ahead. Nobody is watching: never ask questions.

1. Read ~/shorts-studio/RUNBOOK.md, ideas/MATRIX.md, the last sections of STUDIO.md.
2. Results: `pipeline.sh scoreboard` and `pipeline.sh stats <ids>` for last week's Shorts (ids from ideas/done.md). Append "Week of <date>" to STUDIO.md: top 3 / bottom 3 and what to do more or less of.
3. If ideas/family_plan.json ends < 14 days from today, extend it to today + 21 days: dry run `python3 -I tools/plan_family.py --start <day after the plan ends> --days <n> --append --out state/plan_dry.json --md state/plan_dry.md` → it prints "ideas needed" → add that many NEW, real, checkable ideas per combo to ideas/family_ideas.json (never a title already planned or in done.md; lean toward last week's best combos) → delete the dry-run files → real run with `--append` → (Notion) `pipeline.sh plan-rows <start> <end>` → create the rows.
4. Check: `pipeline.sh zap-map --status`, `pipeline.sh family-next`, ideas/FAILED-*.md, the posting budget.
5. Notify: "Plan ready to <date>: pick topics (no tick = Option A). Best last week: <title>." + any problem.
