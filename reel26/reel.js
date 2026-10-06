// THEE_KAL_EL — SHOWREEL ’26. 15s, 1920x1080 @ 60fps, cut to 120 BPM. A motion-design résumé reel: every segment
// shows off a different discipline, all built from the channel. 0–1 film-leader slate · 1–3 01 KINETIC TYPE ·
// 3–5 02 SHAPE MORPH · 5–7 03 3D · 7–9 04 PARTICLES · 9–11 05 UI ANIMATION · 11–12.5 06 TRANSITIONS · 12.5–15 end card.
// A reel HUD (crop marks, timecode, chapter bar) frames everything. renderAt(t) is deterministic.
(() => {
  'use strict';
  const K = window.KIT, { TAU, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, rr, hash } = K;
  const W = 1920, H = 1080, FPS = 60, DUR = 15, BT = 0.5;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const BG = '#0B0B0F', VIO = '#7B5CFF', ACID = '#E8FF3A', RED = '#FF3355', INK = '#F4F4F6', MUTE = '#8A8A99';
  const C = { red: RED };
  const D = (s) => `900 ${s}px "Inter Tight", sans-serif`, G = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`, M = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`, SERIF = (s) => `italic 400 ${s}px "Instrument Serif", serif`;
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const THUMBS = ['snakepot', 'cypher', 'limewire_back', 'protonmail', 'damnbruh', 'limewire_merch'];
  const SHORTS = ['short_dapps', 'short_netflix', 'short_vibes', 'short_tcg', 'short_onepiece', 'short_eminem', 'short_bumper', 'short_playabull', 'short_nitro', 'short_summer'];
  const ASSETS = ['avatar_hd', 'banner_hd', 'socials', ...THUMBS, ...SHORTS];
  const ease = (t, a, b, f = io3) => f(prog(t, a, b)), pulse = (t, T, k = 12) => (t >= T ? Math.exp(-(t - T) * k) : 0), oexp = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  function cover(c, k, x, y, w, h, r = 0) { const im = IMG[k]; if (!im) return; const s = Math.max(w / im.width, h / im.height), sw = w / s, sh = h / s; c.save(); if (r) { rr(c, x, y, w, h, r); c.clip(); } c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h); c.restore(); }
  function cursor(c, x, y, press = 0) { c.save(); c.translate(x, y); c.scale(1.8 - press * 0.25, 1.8 - press * 0.25); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.lineTo(6, 16.5); c.lineTo(10, 25); c.lineTo(13.5, 23.5); c.lineTo(9.5, 15); c.lineTo(17, 15); c.closePath(); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1.5; c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 8; c.fill(); c.stroke(); c.restore(); }

  function ytButton(c, x, y, w, h, r, triK = 1, fill = C.red) {
    rr(c, x - w / 2, y - h / 2, w, h, r); c.fillStyle = fill; c.fill();
    if (triK > 0.01) { const s = h * 0.24 * triK; c.beginPath(); c.moveTo(x - s * 0.8, y - s); c.lineTo(x + s * 1.1, y); c.lineTo(x - s * 0.8, y + s); c.closePath(); c.fillStyle = '#fff'; c.fill(); }
  }
  function iconYT(c, x, y, s) { ytButton(c, x, y, s * 1.4, s, s * 0.26); }
  function iconTikTok(c, x, y, s) {
    rr(c, x - s / 2, y - s / 2, s, s, s * 0.24); c.fillStyle = '#000'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.stroke();
    const note = (dx, dy, col) => { c.save(); c.translate(x + dx, y + dy); c.strokeStyle = col; c.lineWidth = s * 0.085; c.lineCap = 'round';
      c.beginPath(); c.arc(-s * 0.08, s * 0.16, s * 0.12, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(s * 0.04, s * 0.16); c.lineTo(s * 0.04, -s * 0.27); c.quadraticCurveTo(s * 0.1, -s * 0.12, s * 0.24, -s * 0.11); c.stroke(); c.restore(); };
    note(-s * 0.025, -s * 0.02, '#25F4EE'); note(s * 0.025, s * 0.02, '#FE2C55'); note(0, 0, '#fff');
  }
  function iconInsta(c, x, y, s) {
    const g = c.createLinearGradient(x - s / 2, y + s / 2, x + s / 2, y - s / 2); g.addColorStop(0, '#FEDA75'); g.addColorStop(0.3, '#FA7E1E'); g.addColorStop(0.55, '#D62976'); g.addColorStop(0.8, '#962FBF'); g.addColorStop(1, '#4F5BD5');
    rr(c, x - s / 2, y - s / 2, s, s, s * 0.26); c.fillStyle = g; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = s * 0.075; rr(c, x - s * 0.3, y - s * 0.3, s * 0.6, s * 0.6, s * 0.17); c.stroke(); c.beginPath(); c.arc(x, y, s * 0.14, 0, TAU); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x + s * 0.18, y - s * 0.18, s * 0.04, 0, TAU); c.fill();
  }
  function iconTwitch(c, x, y, s) {
    rr(c, x - s / 2, y - s / 2, s, s, s * 0.24); c.fillStyle = '#9146FF'; c.fill();
    const u = s / 10; c.save(); c.translate(x - 3.2 * u, y - 3.4 * u); c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(0.9 * u, 0); c.lineTo(6.6 * u, 0); c.lineTo(6.6 * u, 4.1 * u); c.lineTo(4.7 * u, 6 * u); c.lineTo(3.2 * u, 6 * u); c.lineTo(2 * u, 7.2 * u); c.lineTo(2 * u, 6 * u); c.lineTo(0, 6 * u); c.lineTo(0, 0.9 * u); c.closePath(); c.fill();
    c.fillStyle = '#9146FF'; c.fillRect(2.6 * u, 1.4 * u, 0.8 * u, 2.2 * u); c.fillRect(4.6 * u, 1.4 * u, 0.8 * u, 2.2 * u); c.restore();
  }
  function iconKick(c, x, y, s) {
    rr(c, x - s / 2, y - s / 2, s, s, s * 0.2); c.fillStyle = '#53FC18'; c.fill();
    const u = s / 10; c.fillStyle = '#000'; c.save(); c.translate(x - 3.2 * u, y - 3.5 * u);
    c.fillRect(0, 0, 2.2 * u, 7 * u); c.fillRect(2.2 * u, 2.3 * u, 1.4 * u, 2.4 * u); c.fillRect(3.6 * u, 1.1 * u, 1.4 * u, 1.3 * u); c.fillRect(3.6 * u, 4.6 * u, 1.4 * u, 1.3 * u);
    c.fillRect(5, 0, 0, 0); c.fillRect(5 * u, 0, 1.6 * u, 1.3 * u); c.fillRect(5 * u, 5.7 * u, 1.6 * u, 1.3 * u); c.restore();
  }
  const ICONS = [iconYT, iconTikTok, iconInsta, iconTwitch, iconKick];

  function chainSol(c, x, y, s) {
    const g = c.createLinearGradient(x - s / 2, y + s / 2, x + s / 2, y - s / 2); g.addColorStop(0, '#9945FF'); g.addColorStop(1, '#14F195'); c.fillStyle = g;
    for (const [dy, dir] of [[-0.32, 1], [0, -1], [0.32, 1]]) { const yy = y + dy * s, h = s * 0.17, w = s * 0.86, sk = s * 0.18 * dir; c.beginPath(); c.moveTo(x - w / 2 + Math.max(0, sk), yy - h / 2); c.lineTo(x + w / 2 + Math.min(0, sk), yy - h / 2); c.lineTo(x + w / 2 - Math.max(0, sk), yy + h / 2); c.lineTo(x - w / 2 - Math.min(0, sk), yy + h / 2); c.closePath(); c.fill(); }
  }
  function chainEth(c, x, y, s) {
    const t = y - s * 0.55, m = y + s * 0.08, b = y + s * 0.55, w = s * 0.36;
    const f = (pts, col) => { c.beginPath(); pts.forEach(([a, bb], i) => (i ? c.lineTo(a, bb) : c.moveTo(a, bb))); c.closePath(); c.fillStyle = col; c.fill(); };
    f([[x, t], [x - w, m], [x, m + s * 0.1]], '#C9C9F2'); f([[x, t], [x + w, m], [x, m + s * 0.1]], '#8C8CDB');
    f([[x, b], [x - w, m + s * 0.14], [x, m + s * 0.24]], '#C9C9F2'); f([[x, b], [x + w, m + s * 0.14], [x, m + s * 0.24]], '#8C8CDB');
  }
  function chainAvax(c, x, y, s) {
    c.fillStyle = '#E84142'; c.beginPath(); c.arc(x, y, s / 2, 0, TAU); c.fill(); c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(x - s * 0.03, y - s * 0.28); c.lineTo(x + s * 0.11, y - s * 0.04); c.lineTo(x - s * 0.06, y + s * 0.24); c.lineTo(x - s * 0.3, y + s * 0.24); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x + s * 0.17, y + s * 0.05); c.lineTo(x + s * 0.3, y + s * 0.24); c.lineTo(x + s * 0.05, y + s * 0.24); c.closePath(); c.fill();
  }
  function chainPoly(c, x, y, s) {
    rr(c, x - s / 2, y - s / 2, s, s, s * 0.24); c.fillStyle = '#8247E5'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = s * 0.075; c.lineJoin = 'round';
    const hex = (cx, cy, r) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * TAU / 6; c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); c.stroke(); };
    hex(x - s * 0.1, y + s * 0.05, s * 0.17); hex(x + s * 0.1, y - s * 0.05, s * 0.17);
  }
  function chainBtc(c, x, y, s) {
    c.fillStyle = '#F7931A'; c.beginPath(); c.arc(x, y, s / 2, 0, TAU); c.fill();
    c.save(); c.translate(x, y); c.rotate(0.24); txt(c, 'B', 2, 4, D(s * 0.62), '#fff', 'center'); c.fillStyle = '#fff'; for (const dx of [-0.06, 0.07]) { c.fillRect(dx * s - s * 0.025, -s * 0.33, s * 0.05, s * 0.1); c.fillRect(dx * s - s * 0.025, s * 0.23, s * 0.05, s * 0.1); } c.restore();
  }
  const CHAINS = [[chainSol, 'SOLANA'], [chainEth, 'ETHEREUM'], [chainBtc, 'BITCOIN'], [chainAvax, 'AVALANCHE'], [chainPoly, 'POLYGON']];

  // ---------- S0 film-leader slate (0–1) ----------
  function slate(c, t) {
    if (t >= 1.0) return; c.fillStyle = '#121216'; c.fillRect(0, 0, W, H);
    const n = 3 - Math.min(2, Math.floor(t / 0.25)), lt = (t % 0.25) / 0.25, cx = W / 2, cy = H / 2;
    if (t < 0.75) {
      c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, cy); c.lineTo(W, cy); c.moveTo(cx, 0); c.lineTo(cx, H); c.stroke();
      for (const r of [300, 360]) { c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); }
      c.save(); c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, 1200, -Math.PI / 2, -Math.PI / 2 + lt * TAU); c.closePath(); c.fillStyle = 'rgba(255,255,255,0.10)'; c.fill(); c.restore();
      txt(c, String(n), cx, cy + 20, D(420), '#fff', 'center');
    } else {
      const k = crit(prog(t, 0.75, 0.9)); c.fillStyle = BG; c.fillRect(0, 0, W, H);
      c.save(); c.translate(cx, cy); c.scale(lerp(1.3, 1, k), lerp(1.3, 1, k)); txt(c, 'SHOWREEL ’26', 0, -40, D(170), '#fff', 'center', 'middle', -4);
      txt(c, 'MOTION DESIGN  ·  BLOCKCHAIN TECHNOLOGY  ·  THEE_KAL_EL', 0, 90, M(700, 28), ACID, 'center', 'middle', 6); c.restore();
    }
  }

  // ---------- S1 01 KINETIC TYPE (1–3) ----------
  function kinetic(c, t) {
    if (t < 1.0 || t >= 3.0) return;
    if (t < 1.5) { // BLOCKCHAIN: letters drop with overshoot
      c.fillStyle = VIO; c.fillRect(0, 0, W, H); const s = 'BLOCKCHAIN'; c.font = D(300); c.letterSpacing = '-8px'; const ws = [...s].map((ch) => c.measureText(ch).width - 8), tot = ws.reduce((a, b) => a + b, 0); let x = W / 2 - tot / 2; c.letterSpacing = '0px';
      [...s].forEach((ch, i) => { const k = pop(prog(t, 1.0 + i * 0.03, 1.32 + i * 0.03)); c.save(); c.translate(x + ws[i] / 2, H / 2 + 100 - (1 - k) * 700); c.rotate((1 - k) * (i % 2 ? 0.6 : -0.6)); txt(c, ch, 0, 0, D(300), '#fff', 'center', 'alphabetic'); c.restore(); x += ws[i]; });
      return; }
    if (t < 2.0) { // EXPLAINED. — masked line reveal + underline
      c.fillStyle = ACID; c.fillRect(0, 0, W, H); const lines = ['TECHNOLOGY,', 'EXPLAINED.'];
      lines.forEach((s, i) => { const k = io5(prog(t, 1.5 + i * 0.08, 1.8 + i * 0.08)), y = 430 + i * 250; c.save(); c.beginPath(); c.rect(0, y - 220, W, 250); c.clip(); txt(c, s, 140, y + (1 - k) * 260, D(250), '#0B0B0F', 'left', 'alphabetic', -6); c.restore(); });
      const u = io5(prog(t, 1.72, 1.95)); c.fillStyle = RED; c.fillRect(140, 720, 1400 * u, 26); return; }
    if (t < 2.5) { // WEB3 rows scrolling
      c.fillStyle = BG; c.fillRect(0, 0, W, H); const words = ['WEB3', 'SOLANA', 'DEFI', 'CRYPTO', 'GAMING'];
      for (let r = 0; r < 6; r++) { const y = 130 + r * 175, dir = r % 2 ? 1 : -1, off = ((t - 2.0) * 1400 * dir) % 900; c.save(); c.font = D(170); c.textBaseline = 'middle'; c.letterSpacing = '-4px';
        for (let k = -2; k < 4; k++) { const w = words[(r + k + 10) % 5], x = off + k * 900 - 300; if (r === 3 && k === 1) { c.fillStyle = ACID; c.fillText(w, x, y); } else { c.strokeStyle = rgba('#ffffff', 0.35); c.lineWidth = 2.5; c.strokeText(w, x, y); } } c.restore(); }
      return; }
    // ONE VIDEO AT A TIME — word-by-word punches, then zoom through the O
    c.fillStyle = RED; c.fillRect(0, 0, W, H); const ws = ['ONE', 'PROJECT', 'AT A', 'TIME.']; const i = Math.min(3, Math.floor((t - 2.5) / 0.1)), z = t > 2.85 ? Math.pow(prog(t, 2.85, 3.0), 3) * 40 + 1 : 1;
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); const k = crit(prog(t, 2.5 + i * 0.1, 2.58 + i * 0.1)); c.scale(lerp(1.4, 1, k), lerp(1.4, 1, k)); txt(c, ws[i], 0, 30, D(360), '#fff', 'center', 'middle', -10); c.restore();
  }

  // ---------- S2 02 SHAPE MORPH (3–5) ----------
  const N = 180;
  const shapes = {
    rrect: (a) => { const n = 5, A2 = 300, B2 = 210; return Math.pow(Math.pow(Math.abs(Math.cos(a) / A2), n) + Math.pow(Math.abs(Math.sin(a) / B2), n), -1 / n); },
    circle: () => 260,
    hex: (a) => 270 * Math.cos(Math.PI / 6) / Math.cos((((a % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3)) - Math.PI / 6),
  };
  function shapePath(c, cx, cy, fa, fb, k, rot = 0, sc = 1) { c.beginPath(); for (let i = 0; i <= N; i++) { const a = i / N * TAU, r = lerp(fa(a), fb(a), k) * sc; const x = cx + Math.cos(a + rot) * r, y = cy + Math.sin(a + rot) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); }
  function morph(c, t) {
    if (t < 3.0 || t >= 5.0) return; c.fillStyle = BG; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = 40; x < W; x += 60) for (let y = 40; y < H; y += 60) c.fillRect(x - 1.5, y - 1.5, 3, 3);
    const cx = W / 2, cy = H / 2;
    if (t < 4.5) {
      let fa, fb, k, rot = 0;
      if (t < 3.5) { fa = shapes.rrect; fb = shapes.rrect; k = 0; } else if (t < 4.0) { fa = shapes.rrect; fb = shapes.circle; k = io5(prog(t, 3.5, 3.75)); } else { fa = shapes.circle; fb = shapes.hex; k = io5(prog(t, 4.0, 4.25)); rot = -Math.PI / 2 * io5(prog(t, 4.0, 4.4)); }
      const enter = pop(prog(t, 3.0, 3.35)), sc = t < 3.5 ? enter : 1 + 0.04 * pulse(t, Math.floor(t * 2) / 2, 8);
      // trim-path outline drawing on, offset ghost outlines
      for (let g = 3; g >= 1; g--) { shapePath(c, cx, cy, fa, fb, k, rot - g * 0.05 * (1 - k), sc * (1 + g * 0.08)); c.strokeStyle = rgba(VIO, 0.18 / g); c.lineWidth = 3; c.stroke(); }
      shapePath(c, cx, cy, fa, fb, k, rot, sc); c.save(); c.clip();
      if (t < 3.6) { c.fillStyle = RED; c.fillRect(0, 0, W, H); }
      if (t >= 3.5 && t < 4.1) { c.globalAlpha = io3(prog(t, 3.5, 3.7)); cover(c, 'avatar_hd', cx - 300, cy - 300, 600, 600); c.globalAlpha = 1; }
      if (t >= 4.0) { c.globalAlpha = io3(prog(t, 4.0, 4.2)); cover(c, 'snakepot', cx - 330, cy - 300, 660, 600); c.globalAlpha = 1; }
      c.restore();
      if (t < 3.6) { const tk = 1 - io3(prog(t, 3.45, 3.6)); c.save(); c.translate(cx, cy); c.scale(tk * sc, tk * sc); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-60, -80); c.lineTo(100, 0); c.lineTo(-60, 80); c.closePath(); c.fill(); c.restore(); }
      const tr = io5(prog(t, 3.0, 3.45)); shapePath(c, cx, cy, fa, fb, k, rot, sc * 1.04); c.setLineDash([3000]); c.lineDashOffset = 3000 * (1 - tr); c.strokeStyle = ACID; c.lineWidth = 6; c.stroke(); c.setLineDash([]);
      // vertex handles, as in a shape-layer editor
      c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + rot, r = lerp(fa(a), fb(a), k) * sc * 1.04; c.fillRect(cx + Math.cos(a) * r - 6, cy + Math.sin(a) * r - 6, 12, 12); }
      txt(c, ['PLAY', 'CREATOR', 'BLOCK'][t < 3.5 ? 0 : t < 4 ? 1 : 2], cx, cy + 380, M(700, 30), INK, 'center', 'middle', 10);
    } else { // the block splits into a chain
      const sp = io5(prog(t, 4.5, 4.8)); for (let i = 0; i < 5; i++) { const x = lerp(cx, 260 + i * 350, sp), r = lerp(270, 140, sp);
        if (i < 4) { const x2 = lerp(cx, 260 + (i + 1) * 350, sp), lk = io5(prog(t, 4.7 + i * 0.04, 4.85 + i * 0.04)); c.strokeStyle = ACID; c.lineWidth = 6; c.beginPath(); c.moveTo(x + r * 0.87, cy); c.lineTo(x + r * 0.87 + (x2 - x - r * 1.74) * lk, cy); c.stroke(); }
        shapePath(c, x, cy, shapes.hex, shapes.hex, 0, -Math.PI / 2, r / 270); c.save(); c.clip(); cover(c, THUMBS[i], x - r * 1.2, cy - r, r * 2.4, r * 2); c.restore(); shapePath(c, x, cy, shapes.hex, shapes.hex, 0, -Math.PI / 2, r / 270 * 1.04); c.strokeStyle = ACID; c.lineWidth = 5; c.stroke();
        if (sp > 0.6) txt(c, `#${String(i + 1).padStart(4, '0')}`, x, cy + r + 50, M(700, 26), INK, 'center', 'middle', 4); }
    }
  }

  // ---------- S3 03 3D (5–7): a cube of videos ----------
  function quadImg(c, k, P0, P1, P3, n = 6) { // P0 top-left, P1 top-right, P3 bottom-left (screen), affine per cell
    const im = IMG[k]; if (!im) return; const iw = im.width, ih = im.height, s = Math.min(iw, ih * 1.0), sx0 = (iw - s) / 2, sy0 = (ih - s) / 2;
    c.save(); c.setTransform((P1[0] - P0[0]) / s, (P1[1] - P0[1]) / s, (P3[0] - P0[0]) / s, (P3[1] - P0[1]) / s, P0[0], P0[1]); c.drawImage(im, sx0, sy0, s, s, 0, 0, s, s); c.restore(); void n;
  }
  function cube3d(c, t) {
    if (t < 5.0 || t >= 7.0) return; c.fillStyle = '#101018'; c.fillRect(0, 0, W, H);
    // extruded type behind
    const ek = io5(prog(t, 5.0, 5.4)); c.save(); c.globalAlpha = ek; for (let d = 18; d >= 0; d--) txt(c, '121 VIDEOS', W / 2 + d * 2, H / 2 + d * 2 + 20, D(270), d ? `rgba(123,92,255,${0.06 + (18 - d) * 0.01})` : '#1D1D2A', 'center', 'middle', -8); c.restore();
    c.save(); c.globalAlpha = ek; c.strokeStyle = rgba(VIO, 0.6); c.lineWidth = 2; c.font = D(270); c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '-8px'; c.strokeText('121 VIDEOS', W / 2, H / 2 + 20); c.restore();
    const steps = [5.5, 6.0, 6.5]; let ry = -0.6 + (t - 5.0) * 0.25, rx = 0.45; steps.forEach((T0, i) => { ry += crit(prog(t, T0, T0 + 0.3)) * (Math.PI / 2); if (i === 1) rx -= crit(prog(t, T0, T0 + 0.3)) * 0.2; });
    const sc = pop(prog(t, 5.0, 5.45)) * 290, f = 1500, cz = 1700;
    const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([x, y, z]) => { let X = x * Math.cos(ry) + z * Math.sin(ry), Z = -x * Math.sin(ry) + z * Math.cos(ry), Y = y * Math.cos(rx) - Z * Math.sin(rx); Z = y * Math.sin(rx) + Z * Math.cos(rx); return [X * sc, Y * sc, Z * sc]; });
    const P = ([x, y, z]) => [W / 2 + x * f / (z + cz), H / 2 + y * f / (z + cz), z];
    const faces = [[0, 1, 3, THUMBS[0]], [5, 4, 6, THUMBS[1]], [4, 0, 7, THUMBS[2]], [1, 5, 2, THUMBS[3]], [4, 5, 0, THUMBS[4]], [3, 2, 7, THUMBS[5]]].map(([a, b, d, k]) => { const pa = V[a], pb = V[b], pd = V[d], ux = pb.map((v, i) => v - pa[i]), vx = pd.map((v, i) => v - pa[i]), nrm = [ux[1] * vx[2] - ux[2] * vx[1], ux[2] * vx[0] - ux[0] * vx[2], ux[0] * vx[1] - ux[1] * vx[0]]; const cz2 = (pa[2] + pb[2] + pd[2]) / 3; return { a: P(pa), b: P(pb), d: P(pd), k, nz: nrm[2], cz: cz2, nrm }; });
    faces.filter((fc) => fc.nz > 0).sort((p, q) => q.cz - p.cz).forEach((fc) => { quadImg(c, fc.k, fc.a, fc.b, fc.d); const l = Math.hypot(...fc.nrm), lit = clamp(fc.nz / l); const p4 = [fc.b[0] + fc.d[0] - fc.a[0], fc.b[1] + fc.d[1] - fc.a[1]];
      c.beginPath(); c.moveTo(fc.a[0], fc.a[1]); c.lineTo(fc.b[0], fc.b[1]); c.lineTo(p4[0], p4[1]); c.lineTo(fc.d[0], fc.d[1]); c.closePath(); c.fillStyle = `rgba(0,0,0,${0.55 * (1 - lit)})`; c.fill(); c.strokeStyle = ACID; c.lineWidth = 4; c.stroke(); });
    // floor shadow
    c.save(); c.globalAlpha = 0.5 * ek; const g = c.createRadialGradient(W / 2, H / 2 + 420, 0, W / 2, H / 2 + 420, 420); g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, H / 2 + 300, W, 300); c.restore();
  }

  // ---------- S4 04 PARTICLES (7–9): the photo assembles from a vortex, ripples, re-forms as the handle ----------
  let PTS = null;
  function buildParticles() {
    const im = IMG.socials, gx = 64, gy = 98, sx = 362, sy = 10, sw = 340, sh = 520, cnv = document.createElement('canvas'); cnv.width = gx; cnv.height = gy; const g = cnv.getContext('2d'); g.drawImage(im, sx, sy, sw, sh, 0, 0, gx, gy); const d = g.getImageData(0, 0, gx, gy).data;
    const tc = document.createElement('canvas'); tc.width = 1700; tc.height = 240; const tg = tc.getContext('2d'); tg.fillStyle = '#fff'; tg.font = D(200); tg.textAlign = 'center'; tg.textBaseline = 'middle'; tg.letterSpacing = '-4px'; tg.fillText('@THEE_KAL_EL', 850, 130);
    const td = tg.getImageData(0, 0, 1700, 240).data, targ = []; for (let y = 0; y < 240; y += 6) for (let x = 0; x < 1700; x += 6) if (td[(y * 1700 + x) * 4 + 3] > 128) targ.push([110 + x, H / 2 - 120 + y]);
    const cell = 9.6, ox = W / 2 - gx * cell / 2, oy = H / 2 - gy * cell / 2 + 10; PTS = [];
    for (let y = 0; y < gy; y++) for (let x = 0; x < gx; x++) { const i = (y * gx + x) * 4, j = PTS.length; PTS.push({ hx: ox + x * cell, hy: oy + y * cell, col: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`, cell, a0: hash(j, 1) * TAU, r0: 500 + hash(j, 2) * 900, dl: hash(j, 3), tz: targ[(j * 7919) % targ.length] }); }
  }
  function particles(c, t) {
    if (t < 7.0 || t >= 9.0) return; c.fillStyle = BG; c.fillRect(0, 0, W, H); if (!PTS) buildParticles();
    const rg = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 800); rg.addColorStop(0, rgba(VIO, 0.3)); rg.addColorStop(1, rgba(VIO, 0)); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    for (const p of PTS) {
      const ak = io5(clamp((t - 7.0 - p.dl * 0.45) / 0.6)), ang = p.a0 + (1 - ak) * 5, rad = p.r0 * (1 - ak);
      let x = lerp(W / 2 + Math.cos(ang) * rad, p.hx, ak), y = lerp(H / 2 + Math.sin(ang) * rad * 0.6, p.hy, ak);
      const dd = Math.hypot(p.hx - W / 2, p.hy - H / 2), wv = Math.max(0, t - 8.0), ripple = Math.sin(dd * 0.03 - wv * 18) * Math.exp(-wv * 3) * (wv > 0 ? 1 : 0) * 14; x += ripple * (p.hx - W / 2) / (dd + 1); y += ripple * (p.hy - H / 2) / (dd + 1);
      let sz = p.cell * (0.92 + 0.3 * ripple / 14), col = p.col;
      if (t > 8.45) { const k = io5(clamp((t - 8.45 - p.dl * 0.2) / 0.4)), ex = Math.sin(k * Math.PI) * 280; x = lerp(x, p.tz[0], k) + Math.cos(p.a0) * ex; y = lerp(y, p.tz[1], k) + Math.sin(p.a0) * ex; sz = lerp(sz, 5, k); col = k > 0.6 ? (p.dl < 0.12 ? VIO : '#fff') : col; }
      c.fillStyle = col; c.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
  }

  // ---------- S5 05 UI ANIMATION (9–11) ----------
  function ui(c, t) {
    if (t < 9.0 || t >= 11.0) return; c.fillStyle = '#F2F2F5'; c.fillRect(0, 0, W, H);
    const x0 = 120, y0 = 140, cw = 1000, ch = 780, ck = io5(prog(t, 9.0, 9.3));
    c.save(); c.translate(0, (1 - ck) * 200); c.globalAlpha = ck; c.shadowColor = 'rgba(0,0,0,0.18)'; c.shadowBlur = 60; c.shadowOffsetY = 20; rr(c, x0, y0, cw, ch, 36); c.fillStyle = '#111114'; c.fill(); c.restore();
    if (ck < 0.05) return;
    const bk = io5(prog(t, 9.15, 9.45)); c.save(); rr(c, x0 + 24, y0 + 24, cw - 48, 260, 22); c.clip(); c.beginPath(); c.rect(x0 + 24, y0 + 24, (cw - 48) * bk, 260); c.clip(); cover(c, 'banner_hd', x0 + 24, y0 + 24, cw - 48, 260); c.restore();
    const ak = pop(prog(t, 9.3, 9.65)); c.save(); c.translate(x0 + 140, y0 + 380); c.scale(ak, ak); c.beginPath(); c.arc(0, 0, 96, 0, TAU); c.fillStyle = '#111114'; c.fill(); c.beginPath(); c.arc(0, 0, 88, 0, TAU); c.clip(); cover(c, 'avatar_hd', -88, -88, 176, 176); c.restore();
    const nm = 'Kal El', n = Math.floor(clamp(prog(t, 9.4, 9.6)) * nm.length); txt(c, nm.slice(0, n), x0 + 270, y0 + 350, G(800, 64), '#fff');
    const subs = Math.round(lerp(0, 230, ease(t, 9.45, 9.9))) + (t > 10.15 ? 1 : 0); c.save(); c.globalAlpha = A(t, 9.45, 0.2); txt(c, `@Thee_Kal_El  ·  ${subs} subscribers  ·  121 videos`, x0 + 272, y0 + 412, G(500, 28), '#A9A9B8'); c.restore();
    const dk = A(t, 9.6, 0.3); c.save(); c.globalAlpha = dk; txt(c, 'Just showing you the way to play-to-earn games and crypto!', x0 + 50, y0 + 520, G(400, 30), '#E5E5EC'); c.restore();
    const sb = t >= 10.15, pr = t > 10.05 && t < 10.18 ? 1 : 0, bx = x0 + cw / 2, by = y0 + 640; c.save(); c.translate(bx, by); c.scale(1 - pr * 0.06 + (sb ? 0.05 * pulse(t, 10.15, 8) : 0), 1 - pr * 0.06 + (sb ? 0.05 * pulse(t, 10.15, 8) : 0)); rr(c, -440, -44, 880, 88, 44); c.fillStyle = sb ? '#2A2A33' : '#fff'; c.fill();
    if (sb) { const wg = Math.sin((t - 10.15) * 40) * 0.5 * Math.exp(-(t - 10.15) * 4); c.save(); c.translate(-90, -2); c.rotate(wg); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-16, 12); c.quadraticCurveTo(-13, 5, -13, -4); c.quadraticCurveTo(-13, -18, 0, -18); c.quadraticCurveTo(13, -18, 13, -4); c.quadraticCurveTo(13, 5, 16, 12); c.closePath(); c.fill(); c.beginPath(); c.arc(0, 16, 4, 0, TAU); c.fill(); c.restore(); txt(c, 'Subscribed', 10, 2, G(700, 34), '#fff', 'center'); }
    else txt(c, 'Subscribe', 0, 2, G(700, 34), '#111114', 'center'); c.restore();
    if (t > 9.75 && t < 10.6) { const k = io5(prog(t, 9.75, 10.05)); cursor(c, lerp(bx + 300, bx + 60, k), lerp(by + 300, by + 14, k), pr); }
    if (t > 10.15) { const d = t - 10.15; for (let i = 0; i < 40; i++) { const a = hash(i, 7) * TAU, v = 300 + hash(i, 8) * 600; c.save(); c.translate(bx + Math.cos(a) * v * d, by + Math.sin(a) * v * d * 0.8 + 500 * d * d); c.rotate(d * 8 + i); c.globalAlpha = Math.max(0, 1 - d / 0.85); c.fillStyle = [VIO, ACID, RED, '#111114'][i % 4]; c.fillRect(-7, -3, 14, 6); c.restore(); } }
    // Shorts cascade into a masonry grid
    SHORTS.slice(0, 6).forEach((k, i) => { const col = i % 3, row = Math.floor(i / 3), w = 200, h = 356, x = 1220 + col * 220, y = 140 + row * 400 + (col === 1 ? 40 : 0), sk = io5(prog(t, 9.5 + i * 0.07, 9.85 + i * 0.07));
      if (sk <= 0) return; c.save(); c.translate(x + w / 2, y + h / 2 + (1 - sk) * 600); c.rotate((1 - sk) * (i % 2 ? 0.3 : -0.3)); c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = 30; c.shadowOffsetY = 12; rr(c, -w / 2, -h / 2, w, h, 18); c.fillStyle = '#000'; c.fill(); c.shadowBlur = 0; cover(c, k, -w / 2, -h / 2, w, h, 18); c.restore(); });
  }

  // ---------- S6 06 TRANSITIONS (11–12.5) ----------
  const TR = ['WIPE', 'IRIS', 'SLICE', 'PUSH', 'PIXELATE', 'SPLIT'];
  let PIX = null;
  function transitions(c, t) {
    if (t < 11.0 || t >= 12.5) return; const i = Math.min(5, Math.floor((t - 11.0) / 0.25)), lt = t - 11.0 - i * 0.25, k = io5(clamp(lt / 0.16)), prev = i ? THUMBS[(i + 5) % 6] : 'short_netflix', next = THUMBS[i];
    const full = (key) => cover(c, key, 0, 0, W, H);
    if (TR[i] === 'PUSH') { c.save(); c.translate(-W * k, 0); full(prev); c.translate(W, 0); full(next); c.restore(); }
    else if (TR[i] === 'PIXELATE') { if (!PIX) { PIX = document.createElement('canvas'); } const res = Math.max(8, Math.round(lerp(12, 320, k * k))); PIX.width = res; PIX.height = Math.round(res * 9 / 16); const pg = PIX.getContext('2d'); const im = IMG[next]; if (im) pg.drawImage(im, 0, 0, PIX.width, PIX.height); c.save(); c.imageSmoothingEnabled = k > 0.98; c.drawImage(k > 0.98 ? IMG[next] : PIX, 0, 0, W, H); c.restore(); }
    else {
      full(prev); c.save(); c.beginPath();
      if (TR[i] === 'WIPE') { c.moveTo(0, 0); c.lineTo((W + 400) * k, 0); c.lineTo((W + 400) * k - 400, H); c.lineTo(0, H); }
      if (TR[i] === 'IRIS') c.arc(W / 2, H / 2, 1200 * k, 0, TAU);
      if (TR[i] === 'SLICE') for (let s = 0; s < 8; s++) { const y = s * H / 8, off = (1 - io5(clamp((lt - s * 0.012) / 0.14))) * W * (s % 2 ? 1 : -1); c.rect(off, y, W, H / 8 + 1); }
      if (TR[i] === 'SPLIT') { c.rect(W / 2 - W / 2 * k, 0, W * k, H); }
      c.clip(); full(next); c.restore();
      if (TR[i] === 'WIPE' && k < 1) { c.save(); c.strokeStyle = ACID; c.lineWidth = 10; c.beginPath(); c.moveTo((W + 400) * k, 0); c.lineTo((W + 400) * k - 400, H); c.stroke(); c.restore(); }
      if (TR[i] === 'IRIS' && k < 1) { c.save(); c.strokeStyle = ACID; c.lineWidth = 10; c.beginPath(); c.arc(W / 2, H / 2, 1200 * k, 0, TAU); c.stroke(); c.restore(); }
    }
    c.fillStyle = 'rgba(11,11,15,0.25)'; c.fillRect(0, 0, W, H);
    const lk = pop(prog(lt, 0, 0.14)); c.save(); c.translate(W / 2, H - 190); c.scale(lk, lk); c.font = M(800, 46); c.letterSpacing = '10px'; const lw = c.measureText(TR[i]).width + 150; c.letterSpacing = '0px'; rr(c, -lw / 2, -46, lw, 92, 46); c.fillStyle = 'rgba(11,11,15,0.88)'; c.fill(); c.strokeStyle = ACID; c.lineWidth = 3; c.stroke(); c.fillStyle = ACID; c.beginPath(); c.arc(-lw / 2 + 44, 0, 9, 0, TAU); c.fill(); txt(c, TR[i], 18, 2, M(800, 46), '#fff', 'center', 'middle', 10); c.restore();
  }

  // ---------- S7 end card (12.5–15) ----------
  function endCard(c, t) {
    if (t < 12.5) return; c.fillStyle = BG; c.fillRect(0, 0, W, H);
    const rg = c.createRadialGradient(W / 2, 330, 0, W / 2, 330, 900); rg.addColorStop(0, rgba(VIO, 0.35)); rg.addColorStop(1, rgba(VIO, 0)); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    const ak = pop(prog(t, 12.5, 12.9)); c.save(); c.translate(W / 2, 300); c.scale(ak, ak); c.save(); c.shadowColor = VIO; c.shadowBlur = 60; c.beginPath(); c.arc(0, 0, 150, 0, TAU); c.fillStyle = VIO; c.fill(); c.restore(); c.beginPath(); c.arc(0, 0, 140, 0, TAU); c.clip(); cover(c, 'avatar_hd', -140, -140, 280, 280); c.restore();
    c.save(); c.strokeStyle = ACID; c.lineWidth = 6; c.lineCap = 'round'; const sw = io5(prog(t, 12.6, 13.2)); c.beginPath(); c.arc(W / 2, 300, 175, -Math.PI / 2, -Math.PI / 2 + TAU * sw); c.stroke(); c.restore();
    const s = 'THEE_KAL_EL'; c.font = D(150); c.letterSpacing = '-4px'; const ws = [...s].map((ch) => c.measureText(ch).width - 4), tot = ws.reduce((a, b) => a + b, 0); let x = W / 2 - tot / 2; c.letterSpacing = '0px';
    [...s].forEach((ch, i) => { const k = crit(prog(t, 12.7 + i * 0.03, 12.95 + i * 0.03)); if (k <= 0) { x += ws[i]; return; } c.save(); c.translate(x + ws[i] / 2, 620); c.scale(1, k); c.globalAlpha = clamp(k * 2); txt(c, ch, 0, 0, D(150), '#fff', 'center', 'middle'); c.restore(); x += ws[i]; });
    const sk = A(t, 13.05, 0.35); c.save(); c.globalAlpha = sk; txt(c, 'Blockchain technology, explained.', W / 2, 730, SERIF(66), ACID, 'center'); c.restore();
    ICONS.forEach((fn, i) => { const kk = pop(prog(t, 13.3 + i * 0.07, 13.75 + i * 0.07)); if (kk <= 0) return; c.save(); c.translate(W / 2 + (i - 2) * 130, 860); c.scale(kk * 0.8, kk * 0.8); fn(c, 0, 0, 84); c.restore(); });
    const uk = A(t, 13.7, 0.3); c.save(); c.globalAlpha = uk; txt(c, 'youtube.com/@Thee_Kal_El', W / 2, 965, M(700, 30), INK, 'center', 'middle', 3); c.restore();
  }

  // ---------- reel HUD ----------
  const SEG = [[1.0, 3.0, '01', 'KINETIC TYPE'], [3.0, 5.0, '02', 'SHAPE MORPH'], [5.0, 7.0, '03', '3D'], [7.0, 9.0, '04', 'PARTICLES'], [9.0, 11.0, '05', 'UI ANIMATION'], [11.0, 12.5, '06', 'TRANSITIONS']];
  function hud(c, t) {
    if (t < 0.75) return; const light = t >= 1.5 && t < 2.0 || t >= 9.0 && t < 11.0, col = light ? '#0B0B0F' : '#FFFFFF', a = light ? 0.7 : 0.8;
    c.save(); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 3; const m = 36, L = 46; for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { c.beginPath(); c.moveTo(x, y + sy * L); c.lineTo(x, y); c.lineTo(x + sx * L, y); c.stroke(); }
    txt(c, 'THEE_KAL_EL — SHOWREEL ’26', m + 20, m + 30, M(700, 20), col, 'left', 'middle', 3);
    const fr = Math.floor(t * 24) % 24, sec = Math.floor(t); txt(c, `● REC  TC 00:00:${String(sec).padStart(2, '0')}:${String(fr).padStart(2, '0')}`, W - m - 20, m + 30, M(700, 20), col, 'right', 'middle', 2);
    const sg = SEG.find(([s0, s1]) => t >= s0 && t < s1); if (sg) { const k = io5(prog(t, sg[0], sg[0] + 0.25)); c.save(); c.beginPath(); c.rect(m + 10, H - m - 70, 700, 60); c.clip(); c.translate(0, (1 - k) * 60); rr(c, m + 20, H - m - 64, 70, 44, 8); c.fillStyle = ACID; c.fill(); txt(c, sg[2], m + 55, H - m - 41, M(800, 22), '#0B0B0F', 'center'); txt(c, sg[3], m + 106, H - m - 41, M(800, 24), col, 'left', 'middle', 6); c.restore(); }
    // chapter bar
    const bx = W - m - 20 - 6 * 70, by = H - m - 42; SEG.forEach(([s0, s1, n], i) => { const fill = clamp((t - s0) / (s1 - s0)); c.fillStyle = light ? 'rgba(11,11,15,0.2)' : 'rgba(255,255,255,0.2)'; c.fillRect(bx + i * 70, by, 60, 6); c.fillStyle = t >= s0 && t < s1 ? ACID : col; c.fillRect(bx + i * 70, by, 60 * fill, 6); void n; });
    c.restore();
  }

  // ---------- finishing ----------
  const HITS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 8.0, 8.45, 9.0, 10.15, 11.0, 11.25, 11.5, 11.75, 12.0, 12.25, 12.5];
  let BUF = null, GRAIN = null;
  function finish(c, t) {
    let h = 0; for (const T0 of HITS) h = Math.max(h, pulse(t, T0, 15));
    if (h > 0.05) { if (!BUF) { BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; } const b = BUF.getContext('2d'); b.clearRect(0, 0, W, H); b.drawImage(cv, 0, 0); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 * h; c.drawImage(BUF, -14 * h, 0); c.drawImage(BUF, 14 * h, 0); c.restore(); c.fillStyle = `rgba(255,255,255,${0.14 * h})`; c.fillRect(0, 0, W, H); }
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 16; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const fo = prog(t, 14.6, 15); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  }
  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.filter = 'none'; c.imageSmoothingQuality = 'high';
    let sh = 0; for (const T0 of HITS) sh = Math.max(sh, pulse(t, T0, 18) * 10); c.save(); c.translate((hash(Math.round(t * FPS), 3) - 0.5) * 2 * sh, (hash(Math.round(t * FPS), 4) - 0.5) * 2 * sh);
    slate(c, t); kinetic(c, t); morph(c, t); cube3d(c, t); particles(c, t); ui(c, t); transitions(c, t); endCard(c, t); c.restore(); hud(c, t); finish(c, t);
  }
  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(D(100)), document.fonts.load(G(700, 30)), document.fonts.load(G(500, 30)), document.fonts.load(M(700, 20)), document.fonts.load(M(800, 20)), document.fonts.load(SERIF(60)), ...ASSETS.map((k) => load(k, `../assets/reel26/${k}.png`))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
