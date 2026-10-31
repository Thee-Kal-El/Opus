# Remotion motion kit

Spring-physics motion for Thee_Kal_El's videos, built on [Remotion](https://www.remotion.dev) (videos written in React).
Springs instead of fixed easing, so things land with weight and settle naturally.

## Building blocks (`src/kit/motion.tsx`)
| Piece | What it does | Good for |
|---|---|---|
| `SlamIn` | drops in from big with a hard spring | "KILLED", titles, logos |
| `StaggerText` | letters rise in one by one, masked | names, headlines |
| `Pop` | scales up with overshoot (+ optional spin) | badges, icons, tiles |
| `SlideIn` | springs in from an offset | lower thirds, captions |
| `Wipe` | moving-edge reveal (any direction) | text and image reveals |
| `SkewBar` | brand skewed bar shoots out | underlines, transitions |
| `TypeOn` | typewriter with a block cursor | handles, HUD text |
| `CountUp` | spring number roll | followers, kills, prices |
| `Shake` | decaying camera shake on hits | impacts, drops |
| `Flash` | quick light flash on hits | impacts, cuts |
| `Sparks` | spark burst with gravity | hits, reveals |
| `Float` | idle bob | anything held on screen |
| `Outro` | fade + shrink out | scene endings |

Spring presets: `snappy`, `bouncy`, `smooth`, `heavy`, `slam`.

## Scenes (`src/scenes/`)
- `LogoSting`: 4 s THEE_KAL_EL bumper (1920×1080)
- `KickTwitchCard`: 6 s vertical "WATCH LIVE ON KICK & TWITCH!" end card (1080×1920)
- `KitShowcase`: every building block looping on one sheet
- `ExplainerReel`: 33.7 s vertical (Part 1 0–18.7 s, Part 2 "how to join" 18.7–33.7 s; props in `src/scenes/Part2Props.tsx`) character explainer — Kal's cartoon host (`src/character/KalAvatar.tsx`: talking mouth, blinks, brows, pointing arm, head tilt), word-by-word captions with italic-serif accents, animated props

## Use
```bash
cd remotion && npm install
node render.mjs                 # renders all scenes to ../out/remotion_<id>.mp4
node render.mjs LogoSting       # just one
npx remotion studio src/index.ts   # live preview/editor in the browser
```

Remotion is free for individuals and companies of up to 3 people; bigger teams need a company license (remotion.pro).
