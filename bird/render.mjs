// Renders a Birdeye film frame-by-frame in headless Chromium and muxes its score.
//   node bird/render.mjs terminal              -> out/birdeye_terminal_26s_1080p60.mp4
//   node bird/render.mjs promo                 -> out/birdeye_promo_1080p60.mp4
//   node bird/render.mjs terminal --stills 1,5 -> out/bird_stills/terminal_t_<sec>.png
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const here = dirname(fileURLToPath(import.meta.url)), out = resolve(here, '..', 'out'); mkdirSync(out, { recursive: true });
const args = process.argv.slice(2), film = args[0] === 'promo' ? 'promo' : 'terminal';
const stills = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;
const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => { console.error('[pageerror]', e); process.exit(1); });
await page.goto(pathToFileURL(resolve(here, `${film}.html`)).href + '?render');
await page.evaluate(() => window.FILM.ready);
const grab = (t) => page.evaluate((t) => { window.FILM.renderAt(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t);
if (stills) {
  mkdirSync(resolve(out, 'bird_stills'), { recursive: true });
  for (const s of stills.split(',').map(Number)) writeFileSync(resolve(out, 'bird_stills', `${film}_t_${s.toFixed(2).padStart(5, '0')}.png`), Buffer.from(await grab(s), 'base64'));
  await browser.close(); process.exit(0);
}
const { DUR, FPS } = await page.evaluate(() => ({ DUR: window.FILM.DUR, FPS: window.FILM.FPS }));
const wav = resolve(out, `birdeye_${film}_score.wav`);
const mp4 = resolve(out, film === 'terminal' ? 'birdeye_terminal_26s_1080p60.mp4' : 'birdeye_promo_1080p60.mp4');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  ...(existsSync(wav) ? ['-i', wav, '-c:a', 'aac', '-b:a', '320k', '-ar', '48000'] : []),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), '-movflags', '+faststart', '-t', String(DUR), mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let f = 0; f < DUR * FPS; f++) { const b = Buffer.from(await grab(f / FPS), 'base64'); if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r)); if (f % 300 === 0) console.log(`frame ${f}/${DUR * FPS} ${((Date.now() - t0) / 1000) | 0}s`); }
ff.stdin.end(); await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r()))); await browser.close(); console.log('wrote', mp4);
