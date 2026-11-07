// node story/kfd/render.mjs  ->  out/kfd_140w_review_thumbnail.png (1280×720)
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const here = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on('pageerror', (e) => { console.error(e); process.exit(1); });
await p.goto(pathToFileURL(resolve(here, 'thumb.html')).href); await p.waitForFunction(() => document.body.dataset.ready === '1');
await p.locator('#s').screenshot({ path: resolve(here, '..', '..', 'out', 'kfd_140w_review_thumbnail.png') }); await b.close(); console.log('wrote out/kfd_140w_review_thumbnail.png');
