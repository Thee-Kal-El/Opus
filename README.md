# Thee_Kal_El — Showreel

15-second, 1080×1080, 60fps looping motion-graphics showreel. Everything is generated from code.

**Output:** `out/thee_kal_el_showreel.mp4` (H.264 + AAC, ~6 MB)

| Time | Beat |
|---|---|
| 0–1s | Hook: *The future is on-chain.* |
| 1–3.5s | Identity: the block chain forms around the hero block, and the name resolves |
| 3.5–6.5s | Projects: *Every project, decoded.* (DeFi, L2, ZK, RWA, DePIN, AI × Crypto, Restaking) |
| 6.5–9.5s | Method: *Less noise. More signal.* (scattered dots settle into one rising line) |
| 9.5–12.5s | Future: a flight down a 3D block chain. *Leading you into the future.* |
| 12.5–15s | End card + CTA. The scene settles back to the hero block, so the loop is seamless |

## Files
- `index.html` + `src/showreel.js`: deterministic canvas renderer (`renderAt(t)`). Open `index.html` to preview it live.
- `audio/synth.mjs`: synthesizes the 120 BPM soundtrack. Tails wrap around, so the audio loops too.
- `render/render.mjs`: steps every frame in headless Chromium and pipes it to ffmpeg.
- `fonts/`: Inter Tight, Instrument Serif, JetBrains Mono (OFL, from Google Fonts).

## Rebuild
```sh
node audio/synth.mjs        # -> out/soundtrack.wav
node render/render.mjs      # -> out/thee_kal_el_showreel.mp4
node render/render.mjs --stills 0,5,10   # spot-check frames
```
Requires Node, Playwright (Chromium), and ffmpeg.
