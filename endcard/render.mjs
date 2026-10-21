// Renders the transparent end-card overlay and composites it onto the end of a clip (holding the last frame for HOLD seconds),
// mixing the card's SFX (endcard/sfx.mjs) in under the clip audio.
//   node endcard/render.mjs <clip.mp4> <start-seconds> <out.mp4>  [--hold 2.0] [--stills 0.5,1.5]
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const here = dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2);
const [clip, start, out] = args, HOLD = args.includes('--hold') ? parseFloat(args[args.indexOf('--hold') + 1]) : 2.0, stills = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;
const dur = parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', clip]).stdout.toString());
const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => { console.error(e); process.exit(1); });
await page.goto(pathToFileURL(resolve(here, 'card.html')).href); await page.evaluate(() => window.CARD.ready);
const grab = (t) => page.evaluate((t) => { window.CARD.renderAt(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t);
const frames = resolve(here, '..', 'out', 'endcard_frames'); rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });
const len = dur - start + HOLD, N = Math.ceil(len * 30);
const ts = stills ? stills.split(',').map(Number) : [...Array(N).keys()].map((i) => i / 30);
for (let i = 0; i < ts.length; i++) writeFileSync(resolve(frames, `${String(i).padStart(5, '0')}.png`), Buffer.from(await grab(ts[i]), 'base64'));
await browser.close();
if (stills) { console.log('stills in', frames); process.exit(0); }
// clip (extended by HOLD s of its last frame, audio padded) + overlay starting at `start`
const sfx = resolve(frames, 'sfx.wav'); spawnSync('node', [resolve(here, 'sfx.mjs'), sfx], { stdio: 'inherit' });
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', clip, '-framerate', '30', '-i', resolve(frames, '%05d.png'), '-i', sfx,
  '-filter_complex', `[0:v]fps=30,tpad=stop_mode=clone:stop_duration=${HOLD}[base];[1:v]setpts=PTS+${start}/TB[ov];[base][ov]overlay=0:0:eof_action=pass[v];[0:a]apad=pad_dur=${HOLD}[ca];[2:a]adelay=${Math.round(start * 1000)}:all=1,volume=0.8[sf];[ca][sf]amix=inputs=2:duration=first:normalize=0[a]`,
  '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', String(dur + HOLD), out], { stdio: 'inherit' });
process.exit(r.status);
