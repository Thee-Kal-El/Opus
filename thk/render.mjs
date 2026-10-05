// Renders thk/index.html frame-by-frame in headless Chromium, pipes PNGs into ffmpeg, muxes the score.
//   node thk/synth.mjs && node thk/render.mjs        -> out/thee_kal_el_breakout_1080p60.mp4
//   node thk/render.mjs --stills 0,2.5,7              -> out/thk_stills/t_<sec>.png
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '..', 'out');
mkdirSync(out, { recursive: true });
const args = process.argv.slice(2);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;
const variant = args.includes('--variant') ? args[args.indexOf('--variant') + 1] : 'classic'; // classic | shorts

const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('[pageerror]', e); process.exit(1); });
await page.goto(pathToFileURL(resolve(here, 'index.html')).href + '?render' + (variant === 'shorts' ? '&shorts=1' : ''));
await page.evaluate(() => window.THK.ready);
const grab = (t) => page.evaluate((t) => { window.THK.renderAt(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t);

if (stillsArg) {
  mkdirSync(resolve(out, 'thk_stills'), { recursive: true });
  for (const s of stillsArg.split(',').map(Number)) writeFileSync(resolve(out, 'thk_stills', `${variant}_t_${s.toFixed(3)}.png`), Buffer.from(await grab(s), 'base64'));
  await browser.close(); process.exit(0);
}

const { DUR, FPS } = await page.evaluate(() => ({ DUR: window.THK.DUR, FPS: window.THK.FPS }));
const wav = resolve(out, `thee_kal_el_breakout_${variant}_score.wav`);
const mp4 = resolve(out, `thee_kal_el_breakout_${variant}_1080p60.mp4`);
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  ...(existsSync(wav) ? ['-i', wav, '-c:a', 'aac', '-b:a', '320k', '-ar', '48000'] : []),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS),
  '-movflags', '+faststart', '-t', String(DUR), mp4,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let f = 0; f < DUR * FPS; f++) {
  const buf = Buffer.from(await grab(f / FPS), 'base64');
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 120 === 0) console.log(`frame ${f}/${DUR * FPS}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r())));
await browser.close();
console.log('wrote', mp4);
