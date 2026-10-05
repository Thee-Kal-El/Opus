// Exports the film: seeks every frame in headless Chromium (frames in order, but each seek is independent of
// history), pipes PNGs to ffmpeg at a constant 60 fps and muxes the synthesized score.
//   node spot/synth.mjs && node spot/render.mjs           -> out/blockchain_records_presents_18s_1080p60.mp4
//   node spot/render.mjs --stills 0.3,2.7,8.8             -> out/spot_stills/t_<sec>.png
//   node spot/render.mjs --sheet                          -> out/spot_sheet.png (contact sheet, every 0.25s)
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const here = dirname(fileURLToPath(import.meta.url)), out = resolve(here, '..', 'out');
mkdirSync(out, { recursive: true });
const args = process.argv.slice(2), arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);

const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('[pageerror]', e); process.exit(1); });
await page.goto(pathToFileURL(resolve(here, 'index.html')).href + '?render');
await page.evaluate(() => window.FILM.ready);
const grab = (t, fmt = 'image/png') => page.evaluate(async ([t, fmt]) => { await window.seek(t); return document.getElementById('c').toDataURL(fmt, 0.92).split(',')[1]; }, [t, fmt]);

if (arg('--stills')) {
  mkdirSync(resolve(out, 'spot_stills'), { recursive: true });
  for (const s of arg('--stills').split(',').map(Number)) writeFileSync(resolve(out, 'spot_stills', `t_${s.toFixed(2)}.png`), Buffer.from(await grab(s), 'base64'));
  await browser.close(); process.exit(0);
}
if (args.includes('--sheet')) {
  const d = await page.evaluate(async () => {
    const cols = 8, tw = 320, th = 180, times = []; for (let t = 0; t < 18; t += 0.25) times.push(t);
    const sh = document.createElement('canvas'); sh.width = cols * tw; sh.height = Math.ceil(times.length / cols) * (th + 22);
    const g = sh.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, sh.width, sh.height); g.font = '14px monospace'; g.fillStyle = '#ddd';
    for (let i = 0; i < times.length; i++) { await window.seek(times[i]); const x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 22); g.drawImage(document.getElementById('c'), x, y, tw - 2, th); g.fillText(times[i].toFixed(2) + 's', x + 4, y + th + 16); }
    return sh.toDataURL('image/png').split(',')[1];
  });
  writeFileSync(resolve(out, 'spot_sheet.png'), Buffer.from(d, 'base64')); await browser.close(); process.exit(0);
}

const { DUR, FPS } = await page.evaluate(() => ({ DUR: window.FILM.DUR, FPS: window.FILM.FPS }));
const wav = resolve(out, 'blockchain_records_presents_score.wav');
const mp4 = resolve(out, 'blockchain_records_presents_18s_1080p60.mp4');
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  ...(existsSync(wav) ? ['-i', wav, '-c:a', 'aac', '-b:a', '320k', '-ar', '48000'] : []),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), '-vsync', 'cfr',
  '-movflags', '+faststart', '-t', String(DUR), mp4,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now(), N = DUR * FPS;
for (let f = 0; f < N; f++) {
  const buf = Buffer.from(await grab(f / FPS), 'base64');
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 120 === 0) console.log(`frame ${f}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r())));
await browser.close();
console.log('wrote', mp4);
