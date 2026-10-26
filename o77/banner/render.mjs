// node o77/banner/render.mjs  ->  out/o77_banner_1200x400.png (site's recommended size), out/o77_banner_2400x800.png, out/o77_icon_256.png, out/o77_icon_512.png
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), out = resolve(here, '..', '..', 'out');
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
for (const [w, h, name] of [[1200, 400, 'o77_banner_1200x400.png'], [2400, 800, 'o77_banner_2400x800.png'], [256, 256, 'o77_icon_256.png'], [512, 512, 'o77_icon_512.png'], [128, 128, 'o77_icon_128.png'], [64, 64, 'o77_icon_64.png']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('file://' + resolve(here, 'banner.html') + `?w=${w}&h=${h}`); await p.waitForFunction(() => document.title === 'done');
  await p.locator('canvas').screenshot({ path: resolve(out, name) }); console.log('wrote out/' + name); await p.close();
}
await b.close();
