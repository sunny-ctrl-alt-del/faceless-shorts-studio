"""Read a project's PUBLISH.md and print the upload metadata as JSON (for posting routes #2 Pipedream and #3 Chrome).

  python3 -I publish_meta.py <project_dir> [channel]   →  {"channel", "title", "description", "tags", "categoryId"}

PUBLISH.md format (RUNBOOK §6): "**Title (N chars):** <title>", a "**Description:**" block (until the next "**Tags"
line), "**Tags:** a, b, c", "**Category:** <name> (<id>)".
"""
import json, re, sys
from pathlib import Path

def main():
    P = Path(sys.argv[1]).expanduser(); ch = sys.argv[2] if len(sys.argv) > 2 else 'main'
    t = (P / 'PUBLISH.md').read_text()
    title = re.search(r'\*\*Title[^*]*:\*\*\s*(.+)', t)
    desc = re.search(r'\*\*Description:\*\*\s*\n(.*?)\n\s*\*\*Tags', t, re.S)
    tags = re.search(r'\*\*Tags:\*\*\s*(.+)', t)
    cat = re.search(r'\*\*Category:\*\*[^(\n]*\((\d+)\)', t)
    if not (title and desc): sys.exit('PUBLISH.md: title or description not found')
    out = {'channel': ch, 'title': title.group(1).strip()[:100], 'description': desc.group(1).strip()[:4900],
           'tags': [x.strip() for x in tags.group(1).split(',')][:30] if tags else [], 'categoryId': cat.group(1) if cat else '27'}
    print(json.dumps(out, ensure_ascii=False))

if __name__ == '__main__':
    main()
