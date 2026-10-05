# Thee_Kal_El — Showreel

15-second, 1080×1080, 60fps looping motion-graphics showreel. Everything is generated from code.

**Output:** `out/thee_kal_el_showreel_glass.mp4` (main, Neon Glass blocks) and `out/thee_kal_el_showreel_holo.mp4` (alternate, Holographic blocks). H.264 + AAC, ~7 MB each.

| Time | Beat |
|---|---|
| 0–1s | Hook: *The future is on-chain.* |
| 1–3.5s | Identity: the name and tagline sit top-left, the portrait slides in from the left beneath them, and the hero block grows into a large glass block on the right |
| 3.5–6.5s | Projects: *Every project, decoded.* (DeFi, L2, ZK, RWA, DePIN, AI × Crypto, Restaking) |
| 6.5–9.5s | Method: *Less noise. More signal.* (scattered dots settle into one rising line) |
| 9.5–12.5s | Future: a flight down a 3D block chain. *Leading you into the future.* |
| 12.5–15s | End card: the socials card slides in from the left, then the CTA. The scene settles back to the hero block, so the loop is seamless |

## Files
- `index.html` + `src/showreel.js`: deterministic canvas renderer (`renderAt(t)`). Open `index.html` to preview it live.
- `audio/synth.mjs`: synthesizes the 120 BPM soundtrack. Tails wrap around, so the audio loops too.
- `render/render.mjs`: steps every frame in headless Chromium and pipes it to ffmpeg.
- `assets/`: `portrait.png` (crop of `portrait_src.webp`: `ffmpeg -i assets/portrait_src.webp -vf "crop=730:1090:190:690,format=rgba" assets/portrait.png`) and `socials_card.jpg`.
- `fonts/`: Inter Tight, Instrument Serif, JetBrains Mono (OFL, from Google Fonts).

## Rebuild
```sh
node audio/synth.mjs        # -> out/soundtrack.wav
node render/render.mjs --block glass   # -> out/thee_kal_el_showreel_glass.mp4 (or --block holo)
node render/options.mjs                # -> out/block_options.mp4 (all block styles side by side)
node render/render.mjs --stills 0,5,10   # spot-check frames
```
Requires Node, Playwright (Chromium), and ffmpeg.

---

# The Blockchain Rush — 1920×1080 showreel

A 15s, 60fps landscape reel that introduces Thee_Kal_El, with a score composed and synthesized entirely in code.

**Output:** `out/the_blockchain_rush_1080p60.mp4` (H.264 + 320 kbps AAC). The score alone is `out/the_blockchain_rush_score.wav`.

The reel runs at 128 BPM, so 15s is exactly 32 beats (8 bars). Every scene cut is on a bar line, and every word swap is on a beat or an 8th note.

| Bar | Time | Scene |
|---|---|---|
| 1 | 0.00s | Hook, one rush per beat: **1849** gold, **1995** internet, **NOW** blockchain, then *DON'T BE late.* |
| 2 | 1.88s | *Every rush has an early crowd.* An adoption S-curve with a "YOU ARE HERE" marker on the beat |
| 3 | 3.75s | **Meet Thee_Kal_El**: text top-left, portrait centred beside "never late.", glass block on the right, and a tag chip on each beat |
| 4 | 5.63s | What he teaches: 8 topics on 8th notes, with full-bleed colour panels |
| 5 | 7.50s | *Built for everyone*: the crowd streams through the onboarding block into organized lanes |
| 6 | 9.38s | *Learn it in minutes. Not years.*: a tilted episode wall that steps on every beat |
| 7 | 11.25s | THE RUSH IS ON: a block-chain fly-through with a 3·2·1 countdown on beats 2–4 |
| 8 | 13.13s | The drop: FOLLOW NOW, @Thee_Kal_El, a JOIN NOW button pulsing on each beat, and a platform ticker |

```sh
node reel/synth.mjs     # score -> out/the_blockchain_rush_score.wav
node reel/render.mjs    # video + score -> out/the_blockchain_rush_1080p60.mp4
```
The score is built from oscillators, noise and filters only: kick, clap, snare roll, toms, hats, supersaw stabs, sub and saw bass, plucks, pads, risers, impacts, a delay and a reverb. It uses no samples, audio files or virtual instruments.
