#!/bin/bash
# Download a big public-domain file in N parallel byte ranges (archive.org gives ~0.5 MB/s per connection).
#   bash fetch.sh <url> <out-file> [parts=8]
set -euo pipefail
U="$1"; OUT="$2"; N="${3:-8}"; TMP="$OUT.parts"; mkdir -p "$TMP"
LEN=$(curl -sSIL "$U" | awk 'tolower($1)=="content-length:"{v=$2} END{gsub("\r","",v); print v}')
[ -n "$LEN" ] && [ "$LEN" -gt 0 ] || { echo "no content-length" >&2; exit 1; }
CH=$(( (LEN + N - 1) / N )); echo "size $LEN bytes, $N parts of ~$((CH / 1000000)) MB"
for i in $(seq 0 $((N - 1))); do
  a=$((i * CH)); z=$((a + CH - 1)); [ $z -ge $LEN ] && z=$((LEN - 1)); p="$TMP/p$i"; have=$( [ -f "$p" ] && stat -f %z "$p" || echo 0 )
  want=$((z - a + 1)); [ "$have" -ge "$want" ] && continue
  ( for try in 1 2 3 4 5; do have=$( [ -f "$p" ] && stat -f %z "$p" || echo 0 ); [ "$have" -ge "$want" ] && break
      curl -sSL --retry 3 -r $((a + have))-$z "$U" >> "$p" || sleep 3; done ) &
done
wait
cat $(for i in $(seq 0 $((N - 1))); do echo "$TMP/p$i"; done) > "$OUT"
got=$(stat -f %z "$OUT"); [ "$got" = "$LEN" ] || { echo "SIZE MISMATCH $got != $LEN (re-run to resume)" >&2; exit 1; }
rm -rf "$TMP"; echo "OK $OUT ($got bytes)"
