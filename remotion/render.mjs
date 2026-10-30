// node render.mjs [CompositionId ...]  ->  ../out/remotion_<id>.mp4   (uses the preinstalled Chromium headless shell)
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['LogoSting', 'KickTwitchCard', 'KitShowcase'];
const shell = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const extra = existsSync(shell) ? [`--browser-executable=${shell}`] : [];
for (const id of ids) {
  const out = `../out/remotion_${id}.mp4`;
  const r = spawnSync('npx', ['remotion', 'render', 'src/index.ts', id, out, '--codec=h264', '--crf=16', ...extra], {stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
}
