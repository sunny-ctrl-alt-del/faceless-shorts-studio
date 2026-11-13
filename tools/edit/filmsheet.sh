#!/bin/bash
# Contact sheet of a film, read from a local file or an https URL (only the needed bytes are fetched).
#   bash filmsheet.sh <film-or-url> <outdir> <start_s> <step_s> <end_s> [width=240] [cols=12] [rows=10]
# → <outdir>/f_<sec>.jpg frames (timestamp burned in) + <outdir>/sheet_<n>.jpg tiles
set -uo pipefail
export PATH="$HOME/.local/bin:$PATH"
SRC="$1"; OUT="$2"; A="$3"; STEP="$4"; Z="$5"; W="${6:-240}"; COLS="${7:-12}"; ROWS="${8:-10}"
FONT="/System/Library/Fonts/Supplemental/Arial Bold.ttf"; mkdir -p "$OUT"
grab() { local t=$1 f tls=(); f="$OUT/f_$(printf %05d "$t").jpg"; [ -s "$f" ] && return 0
  [[ "$SRC" == https://* ]] && tls=(-ca_file /etc/ssl/cert.pem)
  ffmpeg -v error -y "${tls[@]}" -ss "$t" -i "$SRC" -frames:v 1 \
    -vf "scale=$W:-2,drawtext=fontfile='$FONT':text='$t':x=4:y=4:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6" "$f" 2>/dev/null; }
export -f grab; export SRC OUT W FONT
seq "$A" "$STEP" "$Z" | xargs -P 6 -I{} bash -c 'grab {}'
cd "$OUT" && rm -f sheet_*.jpg && n=$(ls f_*.jpg | wc -l) && per=$((COLS * ROWS)) && pages=$(( (n + per - 1) / per ))
ffmpeg -v error -y -pattern_type glob -i 'f_*.jpg' -vf "tile=${COLS}x${ROWS}:padding=2" -frames:v "$pages" sheet_%d.jpg
echo "$n frames → $pages sheet(s) in $OUT"
