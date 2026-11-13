#!/usr/bin/env bash
# Faceless Shorts Studio installer. Safe to re-run (also after every `git pull`).
#   bash install.sh                  check tools · install the skill · create your config · download the voice + caption models
#   bash install.sh --check          only report what's there and what's missing (changes nothing)
#   bash install.sh --install-tools  also install missing tools with your package manager (Homebrew / apt / winget)
#   bash install.sh --no-models      skip the ~0.9 GB voice + Whisper download (run install.sh again later)
set -u
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
STUDIO="$HOME/shorts-studio"
SKILL_SRC="$REPO/skill/faceless-shorts"
SKILL_DST="$HOME/.claude/skills/faceless-shorts"
CHECK=0; TOOLS=0; MODELS=1
for a in "$@"; do case "$a" in
  --check) CHECK=1 ;; --install-tools) TOOLS=1 ;; --no-models) MODELS=0 ;;
  -h|--help) sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  *) echo "unknown option: $a (try --help)"; exit 2 ;;
esac; done

export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
NODE_BIN=$( (ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null || true) | tail -1); [ -n "$NODE_BIN" ] && export PATH="$NODE_BIN:$PATH"
if [ -t 1 ]; then B=$'\e[1m'; G=$'\e[32m'; Y=$'\e[33m'; R=$'\e[31m'; D=$'\e[2m'; N=$'\e[0m'; else B=; G=; Y=; R=; D=; N=; fi
MISSING=0; STOP=0
ok()   { printf "  ${G}✓${N} %-13s %s\n" "$1" "$2"; }
miss() { printf "  ${R}✗${N} %-13s %s\n" "$1" "$2"; MISSING=$((MISSING + 1)); }
warn() { printf "  ${Y}!${N} %-13s %s\n" "$1" "$2"; }
step() { printf "\n${B}%s${N}\n" "$1"; }

case "$(uname -s)" in Darwin) OS=mac ;; Linux) OS=linux ;; MINGW*|MSYS*|CYGWIN*) OS=windows ;; *) OS=other ;; esac
hint() { # $1 = tool → the install command for this OS
  case "$OS:$1" in
    mac:node) echo "brew install node" ;; mac:ffmpeg) echo "brew install ffmpeg" ;; mac:chrome) echo "brew install --cask google-chrome" ;;
    mac:python) echo "brew install uv" ;; mac:git) echo "xcode-select --install" ;; mac:yt-dlp) echo "uv tool install yt-dlp" ;;
    linux:node) echo "nvm install 22  (github.com/nvm-sh/nvm)" ;; linux:ffmpeg) echo "sudo apt install ffmpeg" ;;
    linux:chrome) echo "google.com/chrome (or: sudo apt install chromium)" ;; linux:python) echo "sudo apt install python3-venv" ;;
    linux:git) echo "sudo apt install git" ;; linux:yt-dlp) echo "uv tool install yt-dlp" ;;
    windows:node) echo "winget install OpenJS.NodeJS.LTS" ;; windows:ffmpeg) echo "winget install Gyan.FFmpeg" ;;
    windows:chrome) echo "winget install Google.Chrome" ;; windows:python) echo "winget install astral-sh.uv" ;;
    windows:git) echo "winget install Git.Git" ;; windows:yt-dlp) echo "uv tool install yt-dlp" ;;
    *) echo "see handover.md §4.2" ;;
  esac
}

find_chrome() {
  for p in "${CHROME:-}" "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium" \
           /usr/bin/google-chrome /usr/bin/google-chrome-stable /usr/bin/chromium /usr/bin/chromium-browser /snap/bin/chromium \
           "/c/Program Files/Google/Chrome/Application/chrome.exe"; do
    [ -n "$p" ] && [ -x "$p" ] && { echo "$p"; return 0; }
  done; return 1
}

check_tools() {
  MISSING=0; NEED=()
  local nv; nv=$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)
  if [ -n "$nv" ] && [ "$nv" -ge 22 ]; then ok node "$(node -v)"; else miss node "Node.js 22+ needed → $(hint node)"; NEED+=(node); fi
  if command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null; then ok ffmpeg "$(ffmpeg -version | head -1 | cut -d' ' -f3)"; else miss ffmpeg "→ $(hint ffmpeg)"; NEED+=(ffmpeg); fi
  if find_chrome >/dev/null; then ok chrome "found"; else miss chrome "Google Chrome (renders the frames) → $(hint chrome)"; NEED+=(chrome); fi
  local py=""; for p in python3.12 python3.11 python3.10 python3 python; do
    $p -c 'import sys; assert sys.version_info >= (3, 10)' >/dev/null 2>&1 && { py=$p; break; }; done
  if command -v uv >/dev/null; then ok python "uv $(uv --version 2>/dev/null | cut -d' ' -f2)"
  elif [ -n "$py" ]; then ok python "$($py --version 2>&1)"
  else miss python "Python 3.10+ or uv → $(hint python)"; NEED+=(python); fi
  if command -v git >/dev/null; then ok git "$(git --version | cut -d' ' -f3)"; else miss git "→ $(hint git)"; NEED+=(git); fi
  if command -v yt-dlp >/dev/null; then ok yt-dlp "optional, found"; else warn yt-dlp "optional (view counts, comment votes) → $(hint yt-dlp)"; fi
  local free; free=$(df -Pk "$HOME" | awk 'NR==2{print int($4/1048576)}')
  if [ "${free:-0}" -ge 10 ]; then ok disk "${free} GB free"; else warn disk "${free} GB free (10+ GB recommended)"; fi
}

install_tools() {
  [ ${#NEED[@]} -eq 0 ] && return 0
  step "Installing: ${NEED[*]}"
  case "$OS" in
    mac)
      command -v brew >/dev/null || { warn brew "Homebrew is needed first (it asks for your password): see https://brew.sh, then re-run"; return 1; }
      for t in "${NEED[@]}"; do case "$t" in
        node) brew install node ;; ffmpeg) brew install ffmpeg ;; chrome) brew install --cask google-chrome ;; python) brew install uv ;;
        git) xcode-select --install ;; esac; done ;;
    linux)
      command -v apt-get >/dev/null || { warn apt "no apt: install the ✗ items with your package manager"; return 1; }
      for t in "${NEED[@]}"; do case "$t" in
        ffmpeg) sudo apt-get install -y ffmpeg ;; python) sudo apt-get install -y python3-venv ;; git) sudo apt-get install -y git ;;
        node) warn node "install with nvm: https://github.com/nvm-sh/nvm, then: nvm install 22" ;;
        chrome) warn chrome "download from google.com/chrome (or: sudo apt-get install -y chromium)" ;; esac; done ;;
    windows)
      command -v winget >/dev/null || { warn winget "no winget: install the ✗ items by hand"; return 1; }
      for t in "${NEED[@]}"; do case "$t" in
        node) winget install -e --id OpenJS.NodeJS.LTS ;; ffmpeg) winget install -e --id Gyan.FFmpeg ;; chrome) winget install -e --id Google.Chrome ;;
        python) winget install -e --id astral-sh.uv ;; git) winget install -e --id Git.Git ;; esac; done
      warn path "open a new Git Bash window so the new tools are on PATH, then re-run install.sh" ;;
    *) warn os "unknown system: install the ✗ items by hand" ;;
  esac
}

printf "\n${B}Faceless Shorts Studio · installer${N}  ${D}(%s, %s)${N}\n" "$OS" "$REPO"

step "1. Tools"
check_tools
if [ $MISSING -gt 0 ] && [ $TOOLS = 1 ] && [ $CHECK = 0 ]; then install_tools; step "   re-check"; check_tools; fi
if [ $MISSING -gt 0 ]; then
  [ $TOOLS = 0 ] && printf "  ${D}→ install them yourself, or run: bash install.sh --install-tools${N}\n"
  STOP=1
fi

step "2. Studio folder"
here=$(cd "$STUDIO" 2>/dev/null && pwd -P || true)
case "$REPO" in "$HOME/Documents"/*|"$HOME/Desktop"/*|*"/Library/Mobile Documents"/*|*OneDrive*)
  warn sync "this folder may be synced by iCloud/OneDrive, which offloads files and stalls renders: clone to ~/shorts-studio instead" ;; esac
if [ "$here" = "$REPO" ]; then ok studio "~/shorts-studio"
elif [ ! -e "$STUDIO" ]; then
  if [ $CHECK = 1 ]; then warn studio "~/shorts-studio will link to this folder"; else ln -s "$REPO" "$STUDIO" && ok studio "~/shorts-studio → $REPO (link)"; fi
else miss studio "~/shorts-studio is a different folder. The tools expect the studio there: move or rename it, then re-run"; STOP=1; fi

step "3. Skill (the animation engine)"
if [ -L "$SKILL_DST" ] && [ "$(cd "$SKILL_DST" && pwd -P)" = "$(cd "$SKILL_SRC" && pwd -P)" ]; then ok skill "linked to this repo"
elif [ $CHECK = 1 ]; then
  if [ -d "$SKILL_DST" ] && diff -rq "$SKILL_SRC" "$SKILL_DST" -x node_modules -x renders -x review >/dev/null 2>&1; then ok skill "installed, up to date"
  else warn skill "will be installed/updated at ~/.claude/skills/faceless-shorts"; fi
else
  if [ -d "$SKILL_DST" ] && ! diff -rq "$SKILL_SRC" "$SKILL_DST" -x node_modules -x renders -x review >/dev/null 2>&1; then
    bk="$HOME/.faceless-shorts/backups/skill-$(date +%Y%m%d-%H%M%S)"; mkdir -p "$(dirname "$bk")"; mv "$SKILL_DST" "$bk"
    warn skill "your previous copy was moved to $bk"
  fi
  if [ ! -d "$SKILL_DST" ]; then mkdir -p "$(dirname "$SKILL_DST")" && cp -R "$SKILL_SRC" "$SKILL_DST"; fi
  chmod +x "$SKILL_DST"/scripts/*.sh "$SKILL_DST"/scripts/py 2>/dev/null
  ok skill "~/.claude/skills/faceless-shorts"
fi

step "4. Your config"
for pair in "channels.example.json:channels.json" "STUDIO.example.md:STUDIO.md"; do
  src=${pair%%:*}; dst=${pair##*:}
  if [ -f "$REPO/$dst" ]; then ok "$dst" "exists (kept)"
  elif [ $CHECK = 1 ]; then warn "$dst" "will be created from $src"
  else cp "$REPO/$src" "$REPO/$dst" && ok "$dst" "created from $src: fill it in (or let the AI do it)"; fi
done
if [ $CHECK = 0 ]; then
  mkdir -p "$REPO"/{videos,state,config}
  chmod +x "$REPO"/tools/*.sh "$REPO"/tools/edit/*.sh "$REPO"/skill/faceless-shorts/scripts/*.sh "$REPO"/skill/faceless-shorts/scripts/py 2>/dev/null
fi

step "5. Voice + caption models"
if [ $CHECK = 1 ]; then
  if [ -x "$HOME/.faceless-shorts/venv/bin/python" ] || [ -x "$HOME/.faceless-shorts/venv/Scripts/python.exe" ]; then ok models "Python env present (setup.sh verifies the models)"
  else warn models "not set up yet (~0.9 GB download)"; fi
elif [ $STOP = 1 ]; then warn models "skipped until the ✗ items above are fixed"
elif [ $MODELS = 0 ]; then warn models "skipped (--no-models)"
else
  echo "  building the private Python env and downloading Kokoro + Whisper (a few minutes the first time)…"
  bash "$SKILL_DST/scripts/setup.sh" 2>&1 | sed 's/^/    /'; rc=${PIPESTATUS[0]}
  if [ "$rc" = 0 ]; then ok models "ready"; else miss models "setup.sh failed: re-run install.sh (downloads resume)"; STOP=1; fi
fi

step "6. Preflight"
if [ $CHECK = 1 ] || [ $STOP = 1 ] || [ $MODELS = 0 ]; then warn preflight "skipped"
else
  out=$(bash "$REPO/tools/pipeline.sh" preflight 2>&1); echo "$out" | sed 's/^/    /'
  if echo "$out" | grep -q 'PREFLIGHT OK'; then ok preflight "PREFLIGHT OK"; else miss preflight "fix the line above, then re-run"; STOP=1; fi
fi

echo
if [ $CHECK = 1 ]; then printf "${B}Check only: nothing was changed.${N} Run ${B}bash install.sh${N} to set everything up.\n\n"; exit 0; fi
if [ $STOP = 1 ]; then printf "${R}${B}Not finished:${N} fix the ✗ items above, then run ${B}bash install.sh${N} again.\n\n"; exit 1; fi
if [ $MODELS = 0 ]; then printf "${Y}${B}Almost ready:${N} run ${B}bash install.sh${N} (without --no-models) to download the voice + caption models.\n\n"; exit 0; fi
cat <<EOF
${G}${B}Your studio is ready.${N}

  ${B}1.${N} Prove it (optional, ~3 min):   bash skill/faceless-shorts/scripts/selftest.sh
  ${B}2.${N} Open Claude Code in ~/shorts-studio  (Claude desktop app → Code tab → this folder, or run: claude)
  ${B}3.${N} Say:  ${B}Set up this studio for my channel about <your niche>${N}

  Full guide: handover.md · every file explained: handover.md → "File map"

EOF
