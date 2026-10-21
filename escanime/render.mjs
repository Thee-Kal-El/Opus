// Composites the ESCAPE VELOCITY anime reel (9:16) frame-by-frame in headless Chromium and muxes its score.
//   node escanime/synth.mjs && node escanime/render.mjs   -> out/escape_velocity_anime_reel_9x16.mp4
//   node escanime/render.mjs --stills 1,5   -> out/anime_stills/anime_t_<sec>.png
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const here = dirname(fileURLToPath(import.meta.url)), out = resolve(here, '..', 'out'); mkdirSync(out, { recursive: true });
const args = process.argv.slice(2), film = 'index', lane = args.includes('--lane') ? args[args.indexOf('--lane') + 1] : 'right', stills = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;
const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--allow-file-access-from-files', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => { console.error('[pageerror]', e); process.exit(1); });
await page.goto(pathToFileURL(resolve(here, `${film}.html`)).href + '?render');
await page.evaluate(() => window.FILM.ready);
// stills are PNG; video frames go through high-quality JPEG (PNG encode was ~70% of frame time; invisible after H.264)
const grab = (t, fmt = 'png') => page.evaluate(async ([t, fmt]) => { await window.FILM.renderAt(t); return document.getElementById('c').toDataURL(fmt === 'png' ? 'image/png' : 'image/jpeg', 0.95).split(',')[1]; }, [t, fmt]);
if (stills) {
  mkdirSync(resolve(out, 'anime_stills'), { recursive: true });
  for (const s of stills.split(',').map(Number)) writeFileSync(resolve(out, 'anime_stills', `anime_t_${s.toFixed(2).padStart(5, '0')}.png`), Buffer.from(await grab(s), 'base64'));
  await browser.close(); process.exit(0);
}
const { DUR, FPS } = await page.evaluate(() => ({ DUR: window.FILM.DUR, FPS: window.FILM.FPS }));
const wav = resolve(out, 'escape_velocity_anime_score.wav'), mp4 = resolve(out, 'escape_velocity_anime_reel_9x16.mp4');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  ...(existsSync(wav) ? ['-i', wav, '-c:a', 'aac', '-b:a', '320k', '-ar', '48000'] : []),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), '-movflags', '+faststart', '-t', String(DUR), mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let f = 0; f < DUR * FPS; f++) { const b = Buffer.from(await grab(f / FPS, 'jpg'), 'base64'); if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r)); if (f % 300 === 0) console.log(`frame ${f}/${DUR * FPS} ${((Date.now() - t0) / 1000) | 0}s`); }
ff.stdin.end(); await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r()))); await browser.close(); console.log('wrote', mp4);
