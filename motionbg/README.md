# Motion Backgrounds · Lines

Eight animated backgrounds, built from scratch in code, that can go behind Thee_Kal_El's videos, reels, end cards, stream scenes and thumbnails.
Each one is drawn fresh every frame, so it works at any size (16:9, 9:16, square), loops seamlessly every 8 seconds, and takes any color palette.
The styles were inspired by a "40 Motion Backgrounds — Lines" reference sheet. These are original implementations, not copies of that pack's files.

Preview: `out/motionbg/lines_sheet.mp4` (animated) · `out/motionbg/lines_sheet.png` · `out/motionbg/lines_sheet_kicktwitch.png`

| # | Name | Key | What it looks like | Good for |
|---|------|-----|--------------------|----------|
| 09 | Speed Lines | `speedLines` | Horizontal streaks racing across a dark field, a few hot white ones | Hype intros, kill montages, behind gameplay text |
| 10 | Sine Stack | `sineStack` | Stacked flowing wave lines on a solid color, one highlighted wave | Bold title cards, end screens |
| 11 | Line Burst | `lineBurst` | Rays bursting from a center dot on off-white paper, breathing in and out | "Reveal" moments, logo stings, giveaways |
| 12 | Flow Lines | `flowLines` | A ribbon of thin lines twisting through dark space | Calm, techy talking-head backgrounds (blockchain explainers) |
| 13 | Stripe Twist | `stripeTwist` | Vertical ribbons pinching and twisting | Energetic transitions, Shorts backgrounds |
| 14 | Moiré | `moire` | Two sets of rings drifting over each other, making hypnotic interference | Trippy transitions, "mind blown" beats |
| 15 | Scan Bars | `scanBars` | Bold horizontal bars pulsing, with a scan cursor sweeping through | Glitch / loading screens, "starting soon" |
| 16 | Contours | `contours` | Topographic map lines slowly morphing | Calm explainer backgrounds, data or charts overlays |

## Palettes
`ember` (orange/black, like the reference) · `kick` (Kick green) · `twitch` (Twitch purple) · `kicktwitch` (green + purple) · `mono` (white + orange accent).
New palettes are just five colors: `{ bg, fg, accent, dim, paper }` in `backgrounds.js`.

## How to use
- **Preview all 8, animated:** open `motionbg/index.html` in a browser.
- **One background, any size and palette:** `motionbg/index.html?bg=moire&pal=kick&w=1080&h=1920`
- **Export an 8-second loop video:** `node motionbg/render.mjs out/moire_kick_9x16.mp4 "bg=moire&pal=kick&w=1080&h=1920"`
- **Export a still:** same command with a `.png` output.
- **In other projects (reels, end cards, thumbnails):** load `motionbg/backgrounds.js`, then call `MOTIONBG.BG.flowLines(ctx, t, W, H, MOTIONBG.PALETTES.kick)` each frame.
- **Behind a cut-out of Kal:** remove the background from the facecam video (rembg, as with the reaction stickers), then lay it over any of these loops.
