"""Make subtitles for a public-domain film that has none (Whisper small.en, local, free).
  ~/.faceless-shorts/venv/bin/python -I transcribe.py <film.mp4> <out.srt>
Writes an SRT (one cue per Whisper segment) so `film-srt` can search the dialogue. ~1 min of compute per 8-10 min of film."""
import subprocess, sys
from pathlib import Path
import numpy as np
from faster_whisper import WhisperModel

film, out = sys.argv[1], Path(sys.argv[2])
FF = str(Path.home() / '.local/bin/ffmpeg')
raw = subprocess.run([FF, '-v', 'error', '-i', film, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(raw, dtype=np.float32)
m = WhisperModel('small.en', device='cpu', compute_type='int8')
segs, _ = m.transcribe(audio, vad_filter=True, beam_size=1, condition_on_previous_text=False)
def ts(t): h = int(t // 3600); mi = int(t % 3600 // 60); s = t % 60; return f'{h:02d}:{mi:02d}:{int(s):02d},{int((s % 1) * 1000):03d}'
lines, n = [], 0
for s in segs:
    txt = s.text.strip()
    if not txt: continue
    n += 1; lines += [str(n), f'{ts(s.start)} --> {ts(s.end)}', txt, '']
out.write_text('\n'.join(lines), encoding='utf-8'); print(f'{n} cues → {out}')
