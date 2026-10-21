// Records motionbg/index.html.  node motionbg/render.mjs <out.mp4|out.png> [query]  e.g. "bg=moire&pal=kick&w=1080&h=1920"
//   .png → single still at t=2.0;  .mp4 → one seamless 8 s loop at 30 fps
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const here = dirname(fileURLToPath(import.meta.url)), [out, q = ''] = process.argv.slice(2), Q = new URLSearchParams(q);
const W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080);
const b = await chromium.launch({ args: ['--force-color-profile=srgb', '--allow-file-access-from-files'] }); const p = await b.newPage({ viewport: { width: W, height: H } });
await p.goto(pathToFileURL(resolve(here, 'index.html')).href + '?render&' + q); await p.evaluate(() => window.FILM.ready);
const grab = (t, f) => p.evaluate(([t, f]) => { window.FILM.renderAt(t); return document.getElementById('c').toDataURL(f, 0.95).split(',')[1]; }, [t, f]);
if (out.endsWith('.png')) { writeFileSync(out, Buffer.from(await grab(2.0, 'image/png'), 'base64')); await b.close(); process.exit(0); }
const { FPS, DUR } = await p.evaluate(() => ({ FPS: window.FILM.FPS, DUR: window.FILM.DUR }));
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < DUR * FPS; f++) { const buf = Buffer.from(await grab(f / FPS, 'image/jpeg'), 'base64'); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r)); }
ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close();
