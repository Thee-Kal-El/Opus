// Renders a side-by-side comparison of every block style: out/block_options.mp4 + .png
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
page.on('pageerror', (e) => { console.error(e); process.exit(1); });
await page.goto(pathToFileURL(resolve(root, 'index.html')).href + '?render');
await page.evaluate(() => window.SHOWREEL.ready);
await page.evaluate(() => {
  const c = document.createElement('canvas'); c.id = 'opt'; c.width = 1080; c.height = 1080; document.body.append(c);
  const names = [['solid', 'Current — solid'], ['glass', 'Neon Glass'], ['holo', 'Holographic'],
    ['hyper', 'Hypercube'], ['crystal', 'Crystal Core'], ['circuit', 'Circuit Block']];
  window.drawOptions = (t) => {
    const x = c.getContext('2d');
    x.fillStyle = '#050608'; x.fillRect(0, 0, 1080, 1080);
    names.forEach(([s, label], i) => {
      const cx = 180 + (i % 3) * 360, cy = 180 + Math.floor(i / 3) * 360 * 1.5 - 30;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, 260); g.addColorStop(0, 'rgba(42,76,176,0.22)'); g.addColorStop(1, 'rgba(42,76,176,0)');
      x.fillStyle = g; x.fillRect(cx - 180, cy - 240, 360, 540);
      const ry = Math.PI * 2 * (t / 15) * 2 + 0.62, rx = 0.5;
      window.SHOWREEL.drawBlock(x, cx, cy - 10, 60, rx, ry, 1, 1, s, t);
      // a small dimmer side block, as used in the chain
      window.SHOWREEL.drawBlock(x, cx + 100, cy + 150, 26, rx, ry + 1, 0, 0.9, s, t);
      window.SHOWREEL.drawBlock(x, cx - 100, cy + 150, 26, rx, ry - 1, 0, 0.9, s, t);
      x.font = '700 30px "Inter Tight"'; x.fillStyle = '#F5F5F7'; x.textAlign = 'center';
      x.fillText(`${String.fromCharCode(65 + i)}  ·  ${label}`, cx, cy + 250);
    });
    return c.toDataURL('image/png').split(',')[1];
  };
});
const shot = (t) => page.evaluate((t) => window.drawOptions(t), t);
writeFileSync(resolve(root, 'out/block_options.png'), Buffer.from(await shot(0.3), 'base64'));
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', resolve(root, 'out/block_options.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < 180; f++) {
  const b = Buffer.from(await shot(f / 30), 'base64');
  if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r));
}
ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await browser.close();
console.log('done');
