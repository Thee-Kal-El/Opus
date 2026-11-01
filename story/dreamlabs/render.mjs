// node story/dreamlabs/render.mjs  ->  out/dreamlabs_shorts_thumbnail.png
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const here = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', (e) => { console.error(e); process.exit(1); });
await p.goto(pathToFileURL(resolve(here, 'thumb.html')).href); await p.waitForFunction(() => document.body.dataset.ready === '1');
await p.locator('#s').screenshot({ path: resolve(here, '..', '..', 'out', 'dreamlabs_shorts_thumbnail.png') }); await b.close(); console.log('wrote out/dreamlabs_shorts_thumbnail.png');
