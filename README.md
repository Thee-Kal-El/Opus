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

A 20s, 60fps landscape reel that introduces Thee_Kal_El, with a score composed and synthesized entirely in code.

**Output:** `out/the_blockchain_rush_1080p60.mp4` (H.264 + 320 kbps AAC). The score alone is `out/the_blockchain_rush_score.wav`.

The reel runs at 96 BPM, so 20s is exactly 32 beats (8 bars), 2.5s per scene. Every scene cut is on a bar line, and every word swap is on a beat or an 8th note.

| Bar | Time | Scene |
|---|---|---|
| 1 | 0.00s | Hook, one rush per beat: **1849** gold, **1995** internet, **NOW** blockchain, then *DON'T BE late.* |
| 2 | 2.50s | *Every rush has an early crowd.* An adoption S-curve with a "YOU ARE HERE" marker on the beat |
| 3 | 5.00s | **Meet Thee_Kal_El**: text top-left, portrait centred beside "never late.", glass block on the right, and a tag chip on each beat |
| 4 | 7.50s | What he teaches: 8 topics on 8th notes, with full-bleed colour panels |
| 5 | 10.00s | *Built for everyone*: the crowd streams through the onboarding block into organized lanes |
| 6 | 12.50s | *Learn it in minutes. Not years.*: a tilted episode wall that steps on every beat |
| 7 | 15.00s | THE RUSH IS ON: a block chain streaming away from the viewer (holographic up close, solid in the distance) while light streaks rush in with a 3·2·1 countdown on beats 2–4 |
| 8 | 17.50s | The drop: FOLLOW NOW, @Thee_Kal_El, a JOIN NOW button pulsing on each beat, and a platform ticker |

```sh
node reel/synth.mjs     # score -> out/the_blockchain_rush_score.wav
node reel/render.mjs    # video + score -> out/the_blockchain_rush_1080p60.mp4
```
The score is built from oscillators, noise and filters only: kick, clap, snare roll, toms, hats, supersaw stabs, sub and saw bass, plucks, pads, risers, impacts, a delay and a reverb. It uses no samples, audio files or virtual instruments.

---

# Blockchain Records Presents — 18s Spotify-style product film

An 18-second film at 1920×1080 and true 60 fps, with an original score and subtle sound design. Every frame is rendered from code.

**Output:** `out/blockchain_records_presents_18s_1080p60.mp4`. The score alone is `out/blockchain_records_presents_score.wav`.

- **Track:** BLOCKCHAIN RECORDS PRESENTS
- **Artist:** Thee_Kal_El
- **Album:** THE INTRO
- **Hero artwork:** `assets/socials_card.jpg`

The supporting covers are generated in `spot/art.js`: a procedural pearlescent "liquid silk" cover plus the designed sleeves (Late Nights, Good Energy, Deep Focus, Daily Mix 1–3, Chill Waves, Throwback, Run Mode).

## Source
- `spot/film.js`: the film. `await window.seek(t)` renders the frame at absolute time `t`. Every transform, opacity, mask and UI state is a pure function of `t`, so frames can be sought in any order. Each output frame averages 4 temporal subframes over a 180° shutter. Stationary text and artwork stay pixel-sharp, and only moving elements blur, most visibly in the fast zoom.
- `spot/art.js`: procedural artwork and sleeves.
- `spot/synth.mjs`: the score at 120 BPM in D major (Dmaj7–Bm7–Gmaj7–A6), built from oscillators, noise and filters. It uses no samples or audio files. Accents sit on the film's shot times.
- `spot/render.mjs`: headless Chromium to ffmpeg, constant 60 fps, H.264 + AAC.

```sh
node spot/synth.mjs                  # score
node spot/render.mjs                 # final MP4
node spot/render.mjs --sheet         # contact sheet, every 0.25s -> out/spot_sheet.png
node spot/render.mjs --stills 8.8,15 # individual frames
open spot/index.html                 # live preview
```

The Spotify name and icon belong to Spotify AB. This film is a spec/portfolio piece and is not affiliated with or endorsed by Spotify.

---

# Visit ArcTown — poster breakout

A 10s, 1920×1080, 60fps motion piece with an original synthwave score. A "Visit ArcTown" poster hangs on a neon skyscraper wall, and ArcTown breaks out of the frame.

**Output:** `out/visit_arctown_breakout_1080p60.mp4`. The score alone is `out/visit_arctown_score.wav`.

The poster is a real 3D window. Anything behind the wall plane is visible only through the frame, and anything that crosses in front of the plane is drawn unclipped. On the beat at 2.0s the city pushes through: the road spills out, neon shops burst past the frame edges, cubes fly at the viewer, and the sign lifts off the poster. The camera then flies through the frame and down the avenue to the ARC tower, ending on a "Visit ArcTown" end card.

```sh
node arc/synth.mjs && node arc/render.mjs     # score, then video
node arc/render.mjs --stills 0.5,3,6          # spot-check frames
open arc/index.html                           # live preview
```

---

# Thee_Kal_El — YouTube creator poster breakout

A 10s, 1920×1080, 60fps breakout piece in the channel's style, with an original hip-hop/electronic score.

There are two versions, each with its own dark phonk score (`thk/phonk.mjs`):
- `out/thee_kal_el_breakout_shorts_1080p60.mp4`: adds four of the channel's Shorts as vertical cards, flying out on the beat from 4.0s. Score: C# phrygian with a 16th-note cowbell riff.
- `out/thee_kal_el_breakout_classic_1080p60.mp4`: no Shorts. Score: F minor with a triplet cowbell riff and heavier 808 slides.

A neon poster with the purple hexagon glow and pink laser grid from the channel art hangs over a synthwave grid. On the drop at 2.0s the glass shatters and Kal steps out of the frame. The chunky thumbnail title swoops down in front of him, and six real video thumbnails fly out and orbit the poster. SOLANA, POLYGON, AVALANCHE and ETHEREUM chips pop in on the beat. A Subscribe button appears and a cursor clicks it (bell, "+1"), and the piece ends on youtube.com/@Thee_Kal_El.

Thumbnails, banner and avatar are cropped from the channel screenshots into `assets/yt/`.

```sh
node thk/phonk.mjs shorts  && node thk/render.mjs --variant shorts
node thk/phonk.mjs classic && node thk/render.mjs --variant classic
node thk/render.mjs --stills 2.5,7.1          # spot-check frames
open thk/index.html                           # live preview
```

---

# ArcTown.app: origami / doodle story

A 17s, 1920×1080, 60fps paper pop-up story with no dialogue, plus an original score with paper sound effects.

**Output:** `out/arctown_paper_story_1080p60.mp4`. The score alone is `out/arctown_paper_score.wav`.

**Story:** a lonely red paper avatar wonders where to go, and a paper-plane invite lands in its hand. The avatar rides the plane to the city (the map scene is cut out of the final MP4), then a page turn opens the book. The city pops up in three chapters:
- **EXPLORE:** the avatar walks the neon avenue.
- **OWN LAND:** an UP FOR SALE sign flips to YOURS!, and the avatar's building folds up.
- **HANG OUT:** friends pop up, with chat bubbles and a dance.

The camera then tilts up to the sky as a paper crane crosses the "ArcTown.app" end card.

```sh
node paper/synth.mjs && node paper/render.mjs
open paper/index.html   # live preview
```

---

# Birdeye films

- `out/birdeye_terminal_26s_1080p60.mp4` (26s): a single dot on black becomes the Birdeye terminal (Trending Tokens, Profitable Traders, Bubble Map, Find Gems, Large Trades). Beat-cut whip zooms with punch captions land on each panel, then EVERY CHAIN sweeps the chain bar before a Birdeye logo slam. The score is sci-fi beats at 120 BPM.
- `out/birdeye_promo_1080p60.mp4` (30s, 128 BPM): a flashy cut through the real dashboard and token page screenshots plus a vector bubble map, a Buy-frenzy beat, then the $NOSELLING finale with a BUY NOW call to action.

Source is in `bird/`: `kit.js` (Birdeye UI kit, NOSELLING coin, banner), `terminal.js`, `promo.js`, `synth_terminal.mjs`, `synth_promo.mjs` and `render.mjs`. The screenshots live in `assets/bird/`.
```sh
node bird/synth_terminal.mjs && node bird/render.mjs terminal
node bird/synth_promo.mjs && node bird/render.mjs promo
```

---

# Argus terminal film (argus.world)

- `out/argus_terminal_28s_1080p60.mp4` (28s, 120 BPM): a dot becomes the Argus home terminal: King of the Hill, Contenders, Top by Market Cap, then New, with beat-cut whip zooms and captions. Next comes a search: "NOSELLING" is typed and the contract is clicked, cutting to the $NOSELLING page, which zooms through Chart, Buy/Sell and Trades. It ends on the Argus logo and argus.world.
- Source is `bird/argus.js`, the score is `bird/synth_argus.mjs`, and the screenshots and art crops are in `assets/argus/`.
```sh
node bird/synth_argus.mjs && node bird/render.mjs argus
```

## Thee_Kal_El — "The Future, Explained." (`yt/`)
30s 1920×1080 @ 60fps YouTube channel film over a synthwave floor, cut to a code-synthesized synthwave-trap score (120 BPM, F minor).
0–4 a YouTube play button morphs into the pixel avatar · 4–8 kinetic word slams (BLOCKCHAIN / WEB3 / CRYPTO / PLAY-TO-EARN) and chain logos ·
8–12 the channel page builds and gets subscribed · 12–20 a tilted wall of real thumbnails with whip-zooms on five videos · 20–24 Shorts carousel ·
24–26 socials card · 26–30 end card with Subscribe + platform icons. Thumbnails and shorts are cropped from the channel screenshots into `assets/yt/`.
```
node yt/synth.mjs && node yt/render.mjs   # -> out/thee_kal_el_channel_30s_1080p60.mp4
```

## ArcTown — showcase + Halloween party invite (`town/`)
Two 30s 1920×1080 @ 60fps films built on one shared 3D ArcTown engine (`town/engine.js`): a full camera (yaw/pitch/roll),
near-plane clipping, painter's sort, neon edges, lit windows, signs mapped onto faces, lamps, benches, trees, floating cubes and avatars.
- **Showcase** (`town/showcase.js`, synthwave score): the city powers on → crane over the "ArcTown" title → EXPLORE whip-pans between shop
  signs → real in-game cutaways with callouts → BUY LAND (an Up For Sale plot transforms into your HQ) → HANG OUT (avatars, proximity voice, chat) → end card.
- **Halloween** (`town/halloween.js`, spooky trap score): the same city re-themed — moon, lightning, fog, bats, pumpkins, ghosts, renamed signs
  ($BOO HQ, Grimmer Market, Haunted Hall, Up For Scare), a costume party, a blackout + jumpscare, and the invite end card.
  The date line on the end card is the `WHEN` constant at the top of `town/halloween.js`.
```
node town/synth_showcase.mjs  && node town/render.mjs showcase    # -> out/arctown_showcase_30s_1080p60.mp4
node town/synth_halloween.mjs && node town/render.mjs halloween   # -> out/arctown_halloween_30s_1080p60.mp4
```
- **Vertical 9:16** (`town/vertical.js`, deep-house score, 1080×1920 @ 60fps): drone dive under the neon title → EXPLORE (third-person
  follow cam, people walking and entering buildings, live minimap) → THE SHIFT (the city sinks into a glowing plot grid) → BUY LAND
  (apply flow, rapid claims, buildings rising, the city rebuilds) → HANG OUT (plaza crowd, chat panel, voice, friend request) → end card.
  Built with JavaScript (canvas + synthesized audio), Playwright and FFmpeg only.
```
node town/synth_vertical.mjs && node town/render.mjs vertical   # -> out/arctown_vertical_9x16_30s_60fps.mp4
```
- **Halloween 9:16** (`town/halloween_vertical.html`, same `halloween.js` with `window.VERTICAL = true`): the Halloween invite reframed for
  TikTok/Reels/Shorts — wider lens, stacked captions, two-line titles, portrait end card.
```
node town/synth_halloween.mjs && node town/render.mjs halloween_vertical   # -> out/arctown_halloween_9x16_30s_60fps.mp4
```

## Thee_Kal_El — "Blockchain, explained." SaaS-style promo (`kal/`)
20s 1920×1080 @ 60fps product-launch-style promo (light, bento, blur-in type) with a code-synthesized score (120 BPM, F major).
Hook ("Blockchain is ~~confusing~~ the future.") → meet Kal El (channel card) → 12 blockchain use cases on a bento board
(payments, gaming, earn-to-test, media, privacy, DePIN, collectibles, social, DeFi, real-world assets, DAOs, multichain),
each with a live mini-UI and the real video that covers it → wall of real videos → Subscribe end card.
```
node kal/synth.mjs && node kal/render.mjs   # -> out/thee_kal_el_promo_20s_1080p60.mp4
```

## Thee_Kal_El — "All out" 15s (`kal/badass.js`)
15s 1920×1080 @ 60fps cyberpunk piece with a hard-hitting synthesized trap score (120 BPM, E phrygian): boot glitch →
YouTube play button slam → 3D dive through a tunnel walled with his real videos & Shorts (word slams on every beat) →
3D blockchain of video blocks → pixel avatar assembles from particles, explodes, reforms as @THEE_KAL_EL → stutter
montage → chrome logo lockup with Subscribe.
```
node kal/synth_allout.mjs && node kal/render.mjs badass   # -> out/thee_kal_el_allout_15s_1080p60.mp4
```
- **Vertical 9:16** (`kal/badass_vertical.html`, same `badass.js` with `window.VERTICAL = true`): auto-fit titles, two-line
  @THEE_KAL_EL particle morph, portrait lockup. `node kal/render.mjs badass_vertical` → `out/thee_kal_el_allout_9x16_15s_60fps.mp4`

## FINALITY — Issue 01 trailer (`fin/`)
20s 1920×1080 @ 60fps trailer for the FINALITY magazine (Issue 01) with a synthesized techno score (90 BPM, F# phrygian; the original 15s/120 BPM cut stretched ×4/3 — `SLOW` in fin.js, `TS` in synth.mjs).
The real page scans (`assets/finality/`) are rendered as 3D planes under a moving camera that zooms into regions:
boot onto Arc mainnet → "FINALITY" slams and match-cuts into the cover → GENESIS / 350ms → "probably" struck → FINAL →
lightning headline, blocks light up to FINAL, dateline → ARC NET's six purpose cards + 700M+ → 10B minted → every page fans
out in 3D and stacks into the cover → STATUS: FINAL.
```
node fin/synth.mjs && node fin/render.mjs   # -> out/finality_issue01_20s_1080p60.mp4
```

## Teleparty — 15s promo (`tp/`)
15s 1920×1080 @ 60fps promo built from the teleparty.com screenshots, with a synthesized future-bass score (120 BPM, D major):
four friends' screens out of sync → SNAP, synced → wordmark ("A new way to watch TV together") → the watch party (synced playback,
group chat with the real profile icons, one pause pauses everyone, HD on desktop + mobile) → MAKE IT YOURS (the site's customize flow
animated: nickname, icon grid, pick, "Only I have control", Start the party → icon blast) → WATCH / CHAT / IN HD / TOGETHER with the
supported services → "Get Teleparty for free!" end card. The movie on screen is procedural (no third-party footage).
```
node tp/synth.mjs && node tp/render.mjs   # -> out/teleparty_15s_1080p60.mp4
```
