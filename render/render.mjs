// Renders index.html frame-by-frame in headless Chromium and pipes PNGs into ffmpeg.
//   node render/render.mjs                    -> out/thee_kal_el_showreel.mp4 (+ audio if out/soundtrack.wav exists)
//   node render/render.mjs --stills 0,0.5,2   -> out/stills/t_<sec>.png
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'out');
mkdirSync(out, { recursive: true });
const args = process.argv.slice(2);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;
const block = args.includes('--block') ? args[args.indexOf('--block') + 1] : null; // e.g. glass | holo

const browser = await chromium.launch({
  args: ['--force-color-profile=srgb', '--disable-gpu-vsync'],
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => { console.error('[pageerror]', e); process.exit(1); });
await page.goto(pathToFileURL(resolve(root, 'index.html')).href + '?render' + (block ? `&block=${block}` : ''));
await page.evaluate(() => window.SHOWREEL.ready);

const grab = (t) => page.evaluate((t) => {
  window.SHOWREEL.renderAt(t);
  return document.getElementById('c').toDataURL('image/png').split(',')[1];
}, t);

if (stillsArg) {
  mkdirSync(resolve(out, 'stills'), { recursive: true });
  for (const s of stillsArg.split(',').map(Number)) {
    writeFileSync(resolve(out, 'stills', `${block ? block + '_' : ''}t_${s.toFixed(2)}.png`), Buffer.from(await grab(s), 'base64'));
  }
  await browser.close();
  process.exit(0);
}

const { DUR, FPS } = await page.evaluate(() => ({ DUR: window.SHOWREEL.DUR, FPS: window.SHOWREEL.FPS }));
const frames = DUR * FPS;
const wav = resolve(out, 'soundtrack.wav');
const mp4 = resolve(out, block ? `thee_kal_el_showreel_${block}.mp4` : 'thee_kal_el_showreel.mp4');
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  ...(existsSync(wav) ? ['-i', wav, '-c:a', 'aac', '-b:a', '256k', '-ar', '48000'] : []),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
  '-tune', 'animation', '-x264-params', 'keyint=60:min-keyint=60',
  '-movflags', '+faststart', '-t', String(DUR), mp4,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let f = 0; f < frames; f++) {
  const buf = Buffer.from(await grab(f / FPS), 'base64');
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 60 === 0) process.stdout.write(`frame ${f}/${frames}  ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
}
ff.stdin.end();
await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg exit ' + c)) : r())));
await browser.close();
console.log('wrote', mp4);
