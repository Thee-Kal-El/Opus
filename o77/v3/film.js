// OPEN//77 — 30 s trailer v3, 1920×1080 @ 60 fps. Built from the real open2077.net: its art (AI-upscaled plates cut from a screen
// recording of the site), its copy, its type (wide heavy italic → Archivo Wide), its yellow / cyan / hot-pink palette, its slanted
// parallelogram cards and striped CTAs, plus live footage of the site itself. Cinematic layer: eased camera moves with motion blur,
// slanted brand-colour wipes, light leaks, anamorphic streaks, grain, letterbox.
//  0 logo cold open · 2 PLAY CYBERPUNK TOGETHER · 4 community servers · 6 the three worlds · 10 CREATE YOUR OWN SERVER · 13 features ·
//  16 SCRIPT YOUR NIGHT CITY · 19 Lua code · 22 server browser · 26 end card. renderAt(t) is async (plates + footage frames) and pure in t.
(() => {
  'use strict';
  const W = 1920, H = 1080, FPS = 60, DUR = 40, SPEED = 0.75, TAU = Math.PI * 2;   // 40 s of film = the 30 s story at 75% speed
  const cv = document.getElementById('c'), c = cv.getContext('2d');
  const BG = '#070A12', YL = '#FCEE09', CY = '#22D8F0', PK = '#FF1F5A', TX = '#EEF1F6', TX2 = '#9AA3B2';
  const WIDE = (s, w = 900) => `italic ${w} ${s}px "Archivo Wide"`, MONO = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`, SANS = (w, s) => `${w} ${s}px "Inter Tight", sans-serif`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), prog = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
  const io = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2), o4 = (p) => 1 - Math.pow(1 - p, 4), o2 = (p) => 1 - (1 - p) * (1 - p);
  const hash = (a, b = 0, d = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(d | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const SK = -0.21;                                   // the site's parallelogram slant

  // ---------- assets ----------
  const IMG = {}, NAMES = ['jackie', 'v', 'panam', 'robot', 'rack', 'johnny', 'code', 'card1', 'card2', 'card3'];
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  const frameCache = new Map();
  async function seqFrame(seg, i) { const k = seg + i; if (!frameCache.has(k)) { if (frameCache.size > 40) frameCache.delete(frameCache.keys().next().value); frameCache.set(k, load(`../site/seq_${seg}/${String(i).padStart(3, '0')}.jpg`)); } return frameCache.get(k); }

  // draw source rect of an image to cover a destination box with a camera: zoom z, pan (px,py in -1..1 of available slack)
  function plate(img, sx, sy, sw, sh, dx, dy, dw, dh, z = 1, px = 0, py = 0) {
    const s = Math.max(dw / sw, dh / sh) * z, vw = dw / s, vh = dh / s;
    const cx = sx + (sw - vw) / 2 + px * (sw - vw) / 2, cy = sy + (sh - vh) / 2 + py * (sh - vh) / 2;
    c.drawImage(img, cx, cy, vw, vh, dx, dy, dw, dh);
  }
  // camera move with motion blur: draws N sub-samples of fn(tt) over the shutter
  function blurred(t, fn, shutter = 1 / 60, n = 4) { if (n <= 1) { fn(t); return; } c.save(); for (let i = 0; i < n; i++) { c.globalAlpha = i === 0 ? 1 : 1 / (i + 1); fn(t - shutter * i / n); } c.restore(); }
  function grade(warm = 0) {
    c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = warm ? 'rgba(255,60,90,0.18)' : 'rgba(20,90,140,0.22)'; c.fillRect(0, 0, W, H); c.restore();
  }
  function leak(t, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'screen'; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }
  function streak(x, y, len, col, a) { c.save(); c.globalCompositeOperation = 'screen'; const g = c.createLinearGradient(x - len, 0, x + len, 0); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.5, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - len, y - 2, len * 2, 4); c.fillStyle = rgba('#FFFFFF', a * 0.8); c.fillRect(x - len * 0.25, y - 0.75, len * 0.5, 1.5); c.restore(); }
  function shade(dir = 'left', a = 0.85) { const g = dir === 'left' ? c.createLinearGradient(0, 0, W * 0.75, 0) : c.createLinearGradient(W, 0, W * 0.25, 0); g.addColorStop(0, rgba(BG, a)); g.addColorStop(0.55, rgba(BG, a * 0.45)); g.addColorStop(1, rgba(BG, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); }

  // ---------- type ----------
  function wide(s, x, y, size, col, align = 'left', a = 1, ls = -1) {
    c.save(); c.globalAlpha *= a; c.font = WIDE(size); c.fontStretch = 'ultra-expanded'; c.textAlign = align; c.textBaseline = 'alphabetic'; c.letterSpacing = ls + 'px'; c.fillStyle = col; c.fillText(s, x, y); c.restore();
  }
  function wideW(s, size) { c.save(); c.font = WIDE(size); c.fontStretch = 'ultra-expanded'; c.letterSpacing = '-1px'; const w = c.measureText(s).width; c.restore(); return w; }
  // headline lines that slide up out of a mask, staggered, with a colour flash on landing
  function headline(lines, x, y, size, col, t, t0, align = 'left', lh = 0.86, stag = 0.12) {
    lines.forEach((ln, i) => {
      const p = o4(prog(t, t0 + i * stag, t0 + i * stag + 0.45)); if (p <= 0) return; const ly = y + i * size * lh;
      c.save(); c.beginPath(); c.rect(0, ly - size * 0.95, W, size * 1.08); c.clip();
      c.translate((1 - p) * -size * 0.6 * (align === 'right' ? -1 : 1), (1 - p) * size * 0.9);
      wide(ln, x, ly, size, col, align); const fl = 1 - prog(t, t0 + i * stag + 0.3, t0 + i * stag + 0.55);
      if (fl > 0 && p > 0.6) wide(ln, x, ly, size, '#FFFFFF', align, fl * 0.7);
      c.restore();
    });
  }
  function label(s, x, y, col, a = 1, align = 'left', size = 22) { c.save(); c.globalAlpha *= a; c.font = `500 ${size}px "Archivo Wide"`; c.fontStretch = 'ultra-expanded'; c.textAlign = align; c.textBaseline = 'middle'; c.letterSpacing = '6px'; c.fillStyle = col; c.fillText(s, x, y); c.restore(); }
  function body(s, x, y, a = 1, align = 'left', size = 30, col = TX) { c.save(); c.globalAlpha *= a; c.font = SANS(500, size); c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s, x, y); c.restore(); }
  // the site's CTA: slanted bar with "///" hatch
  function cta(s, x, y, w, col, txtCol, a = 1, hatchLeft = true) {
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.transform(1, 0, SK, 1, 0, 0);
    c.fillStyle = col; c.fillRect(0, 0, w, 58);
    for (let i = 0; i < 4; i++) c.fillRect(hatchLeft ? -16 - i * 14 : w + 8 + i * 14, 0, 7, 58);
    c.setTransform(1, 0, 0, 1, 0, 0); c.restore();
    c.save(); c.globalAlpha *= a; c.font = `italic 900 22px "Archivo Wide"`; c.fontStretch = 'ultra-expanded'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = txtCol; c.fillText(s, x + w / 2 - 6, y + 31); c.restore();
  }
  // slanted panel clip
  function skewRect(x, y, w, h) { c.beginPath(); const o = -SK * h; c.moveTo(x + o, y); c.lineTo(x + w + o, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); }
  // brand wipe: slanted colour bars sweeping across a cut
  function wipe(t, t0, cols = [YL, PK, CY], dur = 0.42) {
    const p = prog(t, t0 - dur / 2, t0 + dur / 2); if (p <= 0 || p >= 1) return;
    cols.forEach((col, i) => { const q = io(clamp(p * 1.35 - i * 0.12)); const x = lerp(-W * 0.7, W * 1.5, q); c.save(); c.fillStyle = col; skewRect(x - 260 + i * 70, -20, 360 - i * 90, H + 40); c.fill(); c.restore(); });
  }

  // ---------- shots ----------
  async function sLogo(t) { // 0–2
    c.fillStyle = BG; c.fillRect(0, 0, W, H);
    const p = o4(prog(t, 0.35, 1.25)), s = 0.92 + 0.08 * p;
    // slashes cut in first, then the word builds out of them
    c.save(); c.translate(W / 2, H / 2); c.scale(s, s);
    const sz = 170, wO = wideW('OPEN', sz), wS = wideW('//', sz), w7 = wideW('77', sz), x0 = -(wO + wS + w7) / 2;
    const sp = o4(prog(t, 0.15, 0.6)); c.save(); c.globalAlpha = sp; wide('//', x0 + wO, sz * 0.36, sz, YL); c.restore();
    c.save(); c.beginPath(); c.rect(x0 + wO - wO * p, -sz, wO * p + 4, sz * 2); c.clip(); wide('OPEN', x0, sz * 0.36, sz, TX); c.restore();
    c.save(); c.beginPath(); c.rect(x0 + wO + wS, -sz, w7 * p, sz * 2); c.clip(); wide('77', x0 + wO + wS, sz * 0.36, sz, TX); c.restore();
    c.restore();
    label('CYBERPUNK 2077 MULTIPLAYER', W / 2, H / 2 + 120, TX2, prog(t, 1.0, 1.4), 'center', 22);
    streak(W / 2, H / 2 - 6, 900 * o2(prog(t, 0.3, 1.0)), YL, 0.5 * (1 - prog(t, 1.2, 1.9)));
    leak(t, W / 2 + (t - 1) * 120, H / 2, 700, YL, 0.12 * prog(t, 0.3, 1));
  }
  async function sPlay(t) { // 2–4  Jackie + PLAY CYBERPUNK TOGETHER
    const lt = t - 2, im = IMG.jackie;
    blurred(t, (tt) => { const k = io(prog(tt - 2, 0, 2)); c.fillStyle = BG; c.fillRect(0, 0, W, H); plate(im, 560, 80, 1560, 1640, 0, 0, W, H, 1.08 + 0.1 * k, 0.3 - 0.25 * k, -0.2); }, 1 / 60, 3);
    grade(1); shade('left', 0.9);
    headline(['PLAY', 'CYBERPUNK', 'TOGETHER'], 120, 420, 132, YL, t, 2.05, 'left', 0.88, 0.32);
    body('Community servers turn Night City into multiplayer worlds.', 124, 760, prog(lt, 1.1, 1.5), 'left', 32);
    leak(t, 1500, 200, 900, PK, 0.18); streak(1350, 330, 520, YL, 0.35 * prog(lt, 0.2, 0.6));
  }
  async function sWorlds(t) { // 4–6  V and Panam cut out, sliding in from both sides over a blurred Night City
    const lt = t - 4; c.fillStyle = BG; c.fillRect(0, 0, W, H);
    c.save(); c.filter = 'blur(14px) brightness(0.55) saturate(1.2)'; plate(IMG.card2, 760, 40, 800, 660, -60, -60, W + 120, H + 120, 1.05 + 0.05 * io(prog(lt, 0, 2)), 0, 0); c.restore();
    grade(0); leak(t, W / 2, H * 0.4, 700, PK, 0.18);
    const a = o4(prog(lt, 0, 0.6)), b = o4(prog(lt, 0.12, 0.72)), dr = io(prog(lt, 0, 2)) * 30;
    const v = IMG.v_cut, pn = IMG.panam_cut, vh = H * 1.02, vw = vh * v.width / v.height, ph = H * 1.02, pw = ph * pn.width / pn.height;
    c.save(); c.globalAlpha = a; c.drawImage(v, -120 - (1 - a) * 500 + dr, H - vh + 30, vw, vh); c.restore();
    c.save(); c.globalAlpha = b; c.drawImage(pn, W - pw + 120 + (1 - b) * 500 - dr, H - ph + 30, pw, ph); c.restore();
    const g = c.createLinearGradient(0, H * 0.55, 0, H); g.addColorStop(0, rgba(BG, 0)); g.addColorStop(1, rgba(BG, 0.95)); c.fillStyle = g; c.fillRect(0, H * 0.55, W, H * 0.45);
    headline(['EACH WITH ITS OWN RULES.'], W / 2, 880, 64, TX, t, 4.35, 'center');
    headline(['ITS OWN EXPERIENCE.'], W / 2, 958, 64, CY, t, 4.6, 'center');
  }
  const CARDS = [['card1', 'ROLEPLAY', 'Strict roleplay cities — their own economies, factions, jobs and staff.'], ['card2', 'CUSTOM WORLDS', 'PVP, Survival, Freeroam, or a game mode nobody has seen yet.'], ['card3', 'RACING', 'Racing leagues, late-night meets and a city full of open roads.']];
  async function sCards(t) { // 6–9.75  the three worlds, one big slanted card each
    const lt = t - 6, i = Math.min(2, Math.floor(lt / 1.25)), ct = lt - i * 1.25, [key, tag, line] = CARDS[i], im = IMG[key];
    c.fillStyle = BG; c.fillRect(0, 0, W, H);
    // faint previous card ghost for depth
    const k = o4(prog(ct, 0, 0.45)), dr = io(prog(ct, 0, 1.25));
    const cw = 1500, ch = 712, cx = (W - cw) / 2 + (1 - k) * 900 - 60 * dr, cy = (H - ch) / 2 + 20;
    c.save(); c.translate(cx + cw / 2, cy + ch / 2); const sc = 0.94 + 0.06 * k + 0.03 * dr; c.scale(sc, sc); c.translate(-cw / 2, -ch / 2);
    c.save(); skewRect(0, 0, cw, ch); c.clip(); c.drawImage(im, 0, 0, im.width, im.height, -40, -10, cw + 80, ch + 20); grade(0); c.restore();
    c.strokeStyle = YL; c.lineWidth = 3; skewRect(-14, -14, cw + 28, ch + 28); c.stroke();
    c.restore();
    label(`0${i + 1} / 03`, W - 140, 90, TX2, k, 'right', 20); label(tag, 140, 90, YL, k, 'left', 22);
    leak(t, cx + cw, cy, 700, YL, 0.1);
  }
  async function sServer(t) { // 10–13  DROP: robot + CREATE YOUR OWN SERVER
    const lt = t - 10;
    blurred(t, (tt) => { const k = io(prog(tt - 10, 0, 3)); c.fillStyle = BG; c.fillRect(0, 0, W, H); { const z = 1.18 - 0.1 * o4(prog(tt - 10, 0, 0.6)) - 0.04 * k, sc = H * z / 1642, x0 = 560 + 40 * k - 1300 * sc, y0 = 300 - 240 * sc, ex = x0 + 1720 * sc;
      c.drawImage(IMG.robot, 0, 90, 1720, 1642, x0, y0, 1720 * sc, 1642 * sc);   /* source skips the site nav (top) and its 'YO' text (right) */
      const eg = c.createLinearGradient(ex - 320, 0, ex, 0); eg.addColorStop(0, rgba(BG, 0)); eg.addColorStop(1, BG); c.fillStyle = eg; c.fillRect(ex - 320, 0, 320, H); c.fillStyle = BG; c.fillRect(ex, 0, W, H); }   /* keep his face (plate 1300,330) at screen ~(560,300) */ }, 1 / 45, lt < 0.6 ? 5 : 2);
    grade(0); shade('right', 0.92);
    headline(['CREATE', 'YOUR OWN', 'SERVER'], W - 120, 400, 138, CY, t, 10.08, 'right', 0.88, 0.1);
    body('A dedicated server that stays online for your community —', W - 124, 760, prog(lt, 0.7, 1.1), 'right', 30);
    body('your rules, your mods, your gameplay.', W - 124, 802, prog(lt, 0.8, 1.2), 'right', 30);
    cta('DOWNLOAD SERVER', W - 520, 860, 380, CY, BG, prog(lt, 1.2, 1.5));
    leak(t, 300, 300, 800, PK, 0.22); streak(W - 600, 300, 700, CY, 0.4 * (1 - prog(lt, 0, 0.8)));
    if (lt < 0.12) { c.fillStyle = `rgba(255,255,255,${0.8 * (1 - lt / 0.12)})`; c.fillRect(0, 0, W, H); }
  }
  const FEATS = [['YOUR OWN', 'DEDICATED SERVER', 'A persistent world you operate, on your hardware or a rented machine.'], ['YOUR RULES,', 'YOUR COMMUNITY', 'Whitelists, moderation, staff, identity.'], ['CUSTOM', 'GAMEPLAY', 'From a strict roleplay city to a racing league.']];
  async function sRack(t) { // 13–16
    const lt = t - 13; c.fillStyle = BG; c.fillRect(0, 0, W, H);
    blurred(t, (tt) => { const k = io(prog(tt - 13, 0, 3)); c.save(); c.globalAlpha = 1; { const rh = 1000 * (1 + 0.03 * k), rw = rh * 1680 / 1580, rx = W - rw - 10 - 20 * k; c.drawImage(IMG.rack, rx, (H - rh) / 2, rw, rh); const fg = c.createLinearGradient(rx, 0, rx + 220, 0); fg.addColorStop(0, BG); fg.addColorStop(1, rgba(BG, 0)); c.fillStyle = fg; c.fillRect(rx - 2, 0, 222, H); }   /* whole rack, uncropped */ c.restore(); }, 1 / 60, 2);
    /* no fade over the rack */
    leak(t, 1500, 640, 600, CY, 0.12);
    FEATS.forEach(([a, b, d], i) => { const t0 = 13.15 + i * 0.75, y = 250 + i * 250; headline([a, b], 110, y, 48, CY, t, t0, 'left', 0.95, 0.07); body(d, 114, y + 76, prog(t, t0 + 0.3, t0 + 0.6), 'left', 22, TX2); });
  }
  async function sScript(t) { // 16–19  Johnny + SCRIPT YOUR NIGHT CITY
    const lt = t - 16;
    blurred(t, (tt) => { const k = io(prog(tt - 16, 0, 3)); c.fillStyle = BG; c.fillRect(0, 0, W, H); plate(IMG.johnny, 120, 120, 1720, 1610, 760, 0, 1160, H, 1.18 - 0.1 * k, 0.2, -0.4 + 0.3 * k); }, 1 / 60, 3);
    grade(1); shade('left', 0.95);
    headline(['SCRIPT', 'YOUR', 'NIGHT CITY'], 120, 380, 138, PK, t, 16.05, 'left', 0.88, 0.14);
    body('Gameplay on an OPEN//77 server is not configured. It is scripted.', 124, 760, prog(lt, 0.8, 1.2), 'left', 30);
    body('Lua 5.4 resources that hot-reload and stream to every player.', 124, 804, prog(lt, 0.95, 1.35), 'left', 30, TX2);
    leak(t, 1400, 250, 800, PK, 0.25); streak(900, 300, 600, PK, 0.4 * prog(lt, 0.1, 0.4) * (1 - prog(lt, 1.5, 2.5)));
  }
  const CODEH = [['ONE LANGUAGE, TWO RUNTIMES', 'Client scripts in the game, server scripts own the world.'], ['DRIVE THE ACTUAL ENGINE', 'Vehicles, blips, NPCs, weather, loot, notifications.'], ['UI WITH THE WEB STACK', 'HUDs, menus and apps in HTML, CSS and JavaScript.']];
  async function sCode(t) { // 19–22
    const lt = t - 19; c.fillStyle = BG; c.fillRect(0, 0, W, H);
    // the real code block on a slanted, slowly scrolling panel
    c.save(); const pw = 980, ph = 940, px = 860, py = 70; skewRect(px, py, pw, ph); c.clip(); const sy = 120 + io(prog(lt, 0, 3)) * 520;
    c.drawImage(IMG.code, 60, sy, 1600, 1600 * ph / pw, px - 60, py, pw + 140, ph + 80); c.restore();
    c.strokeStyle = PK; c.lineWidth = 2; skewRect(860, 70, 980, 940); c.stroke();
    const g = c.createLinearGradient(860, 0, 1100, 0); g.addColorStop(0, BG); g.addColorStop(1, rgba(BG, 0)); c.fillStyle = g; c.fillRect(840, 0, 260, H);
    CODEH.forEach(([a, d], i) => { const t0 = 19.1 + i * 0.8, y = 300 + i * 220; headline([a], 140, y, 44, PK, t, t0); body(d, 144, y + 52, prog(t, t0 + 0.25, t0 + 0.55), 'left', 26, TX2); });
    label('LUA 5.4', 140, 170, TX2, prog(lt, 0, 0.3), 'left', 20);
    leak(t, 1500, 200, 700, PK, 0.14);
  }
  async function sSite(t) { // 22–25.5  the real server browser on a square screen, camera drifting down the list
    const lt = t - 22, im = IMG.browser; c.fillStyle = BG; c.fillRect(0, 0, W, H);
    c.save(); c.filter = 'blur(20px) brightness(0.35)'; c.drawImage(im, -100, -100, W + 200, H + 200); c.restore();
    const k = o4(prog(lt, 0, 0.6)), dr = io(prog(lt, 0, 3.5));
    const sw = 1640, sh = sw * im.height / im.width, x = (W - sw) / 2 + (1 - k) * 300, y = 110 + (1 - k) * 80;
    c.save(); c.translate(W / 2, H / 2); const sc = 0.96 + 0.1 * dr; c.scale(sc, sc); c.translate(-W / 2, -H / 2 - dr * 60);
    c.globalAlpha = k; c.beginPath(); c.rect(x, y, sw, sh); c.save(); c.clip(); c.drawImage(im, x, y, sw, sh); c.restore();
    c.strokeStyle = YL; c.lineWidth = 3; c.strokeRect(x - 10, y - 10, sw + 20, sh + 20);
    // highlight sweeping down the server rows (rows start ~27% down, ~8% apart)
    const row = Math.min(8, Math.floor(prog(lt, 0.8, 3.2) * 9)), ry = y + sh * (0.27 + row * 0.0805);
    c.fillStyle = rgba(YL, 0.10 * prog(lt, 0.8, 1.0)); c.fillRect(x + sw * 0.17, ry, sw * 0.8, sh * 0.08);
    c.restore();
    const g = c.createLinearGradient(0, H * 0.7, 0, H); g.addColorStop(0, rgba(BG, 0)); g.addColorStop(1, rgba(BG, 0.95)); c.fillStyle = g; c.fillRect(0, H * 0.7, W, H * 0.3);
    headline(['FIND A WORLD TO PLAY IN.'], W / 2, 990, 54, YL, t, 22.4, 'center');
    leak(t, W * 0.8, 200, 800, YL, 0.1);
  }
  async function sEnd(t) { // 26–30
    const lt = t - 26; c.fillStyle = BG; c.fillRect(0, 0, W, H);
    // the site's nav logo, big: wipes on left→right behind a light sweep, then settles with a cyan glow
    const L = IMG.logo_nav, p = o4(prog(lt, 0, 0.9)), lw = 1300 * (0.97 + 0.03 * io(prog(lt, 0, 4))), lh = lw * L.height / L.width, lx = (W - lw) / 2, ly = 455 - lh / 2 + (1 - p) * 30;
    c.save(); c.shadowColor = rgba(YL, 0.45); c.shadowBlur = 50 * p; c.beginPath(); c.rect(lx - 40, ly - 40, (lw + 80) * o2(prog(lt, 0, 0.7)), lh + 80); c.clip(); c.drawImage(L, lx, ly, lw, lh); c.restore();
    const sx = lx + (lw + 80) * o2(prog(lt, 0, 0.7)); if (lt < 0.8) { c.save(); c.globalCompositeOperation = 'screen'; const g = c.createLinearGradient(sx - 120, 0, sx + 20, 0); g.addColorStop(0, rgba('#FFFFFF', 0)); g.addColorStop(1, rgba('#FFFFFF', 0.35)); c.fillStyle = g; c.fillRect(sx - 120, ly + 10, 140, lh - 20); c.restore(); }
    const ly2 = ly, lh2 = lh;
    headline(['CYBERPUNK 2077 MULTIPLAYER.'], W / 2, 690, 50, TX, t, 26.6, 'center');
    headline(['FIND A WORLD TO PLAY IN, OR BUILD YOUR OWN.'], W / 2, 750, 34, TX2, t, 26.8, 'center');
    cta('DOWNLOAD LAUNCHER', W / 2 - 470, 820, 400, YL, BG, prog(lt, 1.1, 1.4), true);
    cta('BUILD YOUR SERVER', W / 2 + 90, 820, 400, PK, '#fff', prog(lt, 1.25, 1.55), false);
    label('OPEN2077.NET', W / 2, 970, TX, prog(lt, 1.6, 2.0), 'center', 28);
    c.save(); c.globalAlpha = prog(lt, 2.0, 2.4) * 0.7; c.font = SANS(400, 16); c.textAlign = 'center'; c.fillStyle = TX2; c.fillText('Unofficial, independent community project. Not affiliated with, endorsed by, or sponsored by CD PROJEKT S.A. Requires a legal copy of Cyberpunk 2077.', W / 2, 1012); c.restore();
    streak(W / 2, ly2 + lh2 * 0.55, 1100 * o2(prog(lt, 0, 0.8)), YL, 0.35 * (1 - prog(lt, 0.8, 2)));
    leak(t, W * 0.2, ly2, 800, YL, 0.1); leak(t, W * 0.85, ly2, 800, PK, 0.1);
    const fo = prog(t, 29.4, 30); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  }

  let GRAIN = null;
  async function renderAt(tReal) {
    const t = tReal * SPEED;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.letterSpacing = '0px';
    if (t < 2) await sLogo(t); else if (t < 4) await sPlay(t); else if (t < 6) await sWorlds(t); else if (t < 9.75) await sCards(t);
    else if (t < 10) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }
    else if (t < 13) await sServer(t); else if (t < 16) await sRack(t); else if (t < 19) await sScript(t); else if (t < 22) await sCode(t); else if (t < 25.5) await sSite(t);
    else if (t < 26) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); } else await sEnd(t);
    // brand wipes on the cuts
    [[2, [YL, PK, CY]], [4, [CY, YL]], [6, [YL]], [7.25, [YL]], [8.5, [YL]], [13, [CY]], [16, [PK, YL]], [19, [PK]], [22, [YL, CY, PK]]].forEach(([t0, cols]) => wipe(t, t0, cols));
    // grain + vignette + letterbox
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 5) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 13; } g.putImageData(d, 0, 0); }
    const fr = Math.floor(t * FPS); c.save(); c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    c.fillStyle = '#000'; c.fillRect(0, 0, W, 40); c.fillRect(0, H - 40, W, 40);
  }
  const ready = (async () => {
    await document.fonts.ready; await Promise.all([document.fonts.load(WIDE(100)), document.fonts.load('500 20px "Archivo Wide"'), document.fonts.load(SANS(500, 20))]);
    await Promise.all(NAMES.map(async (n) => { IMG[n] = await load(`../site/plates/${n}.jpg`); })); IMG.logo = await load('../site/plates/logo.png'); IMG.v_cut = await load('../site/plates/v_hi_cut.png'); IMG.panam_cut = await load('../site/plates/panam_hi_cut.png'); IMG.browser = await load('../site/plates/browser.jpg'); IMG.logo_nav = await load('../site/plates/logo_nav.png');
  })();
  window.FILM = { W, H, FPS, DUR, renderAt, ready };
  if (!/[?&]render\b/.test(location.search)) ready.then(() => { const t0 = performance.now(); const loop = async () => { await renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
