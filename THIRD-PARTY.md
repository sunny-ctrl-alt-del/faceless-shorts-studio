# Third-party components

The studio's own code, stories, drawings, music and sound are original (MIT, see `LICENSE`). Bundled or downloaded
components keep their own licenses:

| component | where | license |
|---|---|---|
| three.js | `skill/faceless-shorts/styles/*/example/vendor/` (3D styles) | MIT (`LICENSE-three.txt` next to it) |
| Inter (Black, ExtraBold) | `styles/*/example/fonts/` | SIL Open Font License 1.1 |
| Caladea Bold | `styles/*/example/fonts/` | Apache License 2.0 |
| GNU FreeMono Bold | `styles/*/example/fonts/` | GPL-3.0 with the font exception (fonts embedded in videos are fine) |
| Kokoro-82M voice (downloaded by `setup.sh`) | `~/.faceless-shorts/kokoro/` | Apache License 2.0 |
| kokoro-onnx, faster-whisper, Whisper small.en (downloaded) | `~/.faceless-shorts/venv/` | MIT |
| numpy, scipy (downloaded) | `~/.faceless-shorts/venv/` | BSD-3-Clause |

Film edits (Engine B) use only public-domain films or Creative Commons Attribution open movies, downloaded at run time
and never committed (see `references/pd-films/WHITELIST.md`).
