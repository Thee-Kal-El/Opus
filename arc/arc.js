// ARC — "The economic OS for the internet." 60s, 1920x1080 @ 60fps, cut to 120 BPM. Built from FINALITY Issue 01 + Arc/Circle posts.
// 0–6 cold open: "probably" terminal → ARC DOESN'T DO PROBABLY · 6–12 mainnet is live (block-built logo, dateline) ·
// 12–18 finality: block staircase → 350ms · 18–24 economic OS feature grid + USDC gas · 24–35 THE ELEVEN validators ·
// 35–42 the numbers · 42–50 live on Arc (post cards) + integrations · 50–55 Allaire quote · 55–60 end card + FINALITY.
// Every on-screen claim carries its FINALITY source tag [n]. renderAt(t) is deterministic.
(() => {
  'use strict';
  const K = window.KIT, { TAU, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, rr, hash } = K;
  const V = !!window.VERTICAL, W = V ? 1080 : 1920, H = V ? 1920 : 1080, FPS = 60, DUR = 60;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const GR = '#22F57A', GR2 = '#0FD15F', GRD = '#0A3D22', INK = '#F2F2EE', BG = '#030504', YEL = '#FFD60A', RED = '#FF3B4E', ABLUE = '#2347B8', ANAVY = '#0B1736', USDC = '#2775CA';
  const D = (s) => `900 ${s}px "Inter Tight", sans-serif`, G = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`, M = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const ASSETS = ['week', 'agentic', 'centrifuge', 'mascot', 'cirbtc', 'binance', 'onramp', 'cover'];
  const ease = (t, a, b, f = io3) => f(prog(t, a, b)), pulse = (t, T, k = 12) => (t >= T ? Math.exp(-(t - T) * k) : 0), o3 = (p) => 1 - Math.pow(1 - p, 3), oexp = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  function tw(c, s, font, ls = 0) { c.font = font; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.letterSpacing = '0px'; return w; }
  // condensed display type (the magazine's poster face): Inter Tight Black squeezed horizontally
  const CX = 0.66;
  function ct(c, s, x, y, size, col, align = 'left', ls = -2) { c.save(); c.translate(x, y); c.scale(CX, 1); txt(c, s, 0, 0, D(size), col, align, 'middle', ls); c.restore(); }
  const ctw = (c, s, size, ls = -2) => tw(c, s, D(size), ls) * CX;
  const fit = (c, s, size, maxW, ls = -2) => Math.min(size, size * maxW / ctw(c, s, size, ls)); // largest size ≤ size that fits maxW
  function cover(c, k, x, y, w, h, r = 0) { const im = IMG[k]; if (!im) return; const s = Math.max(w / im.width, h / im.height), sw = w / s, sh = h / s; c.save(); if (r) { rr(c, x, y, w, h, r); c.clip(); } c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h); c.restore(); }
  function src(c, s, x, y, size = 22, align = 'left') { txt(c, s, x, y, G(800, size), YEL, align); }

  // ---------- brand vectors ----------
  function arcMark(c, x, y, s, col = '#fff') { // the Arc "A": a rounded arch with a swept crossbar
    c.save(); c.translate(x, y); c.scale(s / 100, s / 100); c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 15;
    c.beginPath(); c.moveTo(-34, 40); c.bezierCurveTo(-30, -10, -18, -42, 0, -42); c.bezierCurveTo(18, -42, 30, -10, 34, 40); c.stroke();
    c.lineWidth = 12; c.beginPath(); c.moveTo(-22, 18); c.quadraticCurveTo(10, 8, 40, 26); c.stroke(); c.restore();
  }
  function arcIcon(c, x, y, s) { const g = c.createLinearGradient(x, y - s / 2, x, y + s / 2); g.addColorStop(0, '#2B55D0'); g.addColorStop(1, ANAVY); rr(c, x - s / 2, y - s / 2, s, s, s * 0.2); c.fillStyle = g; c.fill(); c.save(); c.globalAlpha = 0.25; c.strokeStyle = '#9BB6FF'; c.lineWidth = 2; c.stroke(); c.restore(); arcMark(c, x, y + s * 0.03, s * 0.78); }
  function circleMark(c, x, y, r) { const g = c.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, '#3CE2C6'); g.addColorStop(1, '#8E6CF0'); c.save(); c.strokeStyle = g; c.lineWidth = r * 0.28; c.lineCap = 'round'; c.beginPath(); c.arc(x, y, r * 0.82, Math.PI * 0.85, Math.PI * 1.95); c.stroke(); c.beginPath(); c.arc(x, y, r * 0.82, -Math.PI * 0.15, Math.PI * 0.95); c.stroke(); c.lineWidth = r * 0.2; c.beginPath(); c.arc(x, y, r * 0.38, Math.PI * 0.2, Math.PI * 1.3); c.stroke(); c.beginPath(); c.moveTo(x + r * 0.5, y - r * 0.5); c.lineTo(x - r * 0.5, y + r * 0.5); c.stroke(); c.restore(); }
  function usdcCoin(c, x, y, r, spin = 0) { c.save(); c.translate(x, y); c.scale(Math.max(0.06, Math.abs(Math.cos(spin))), 1); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = USDC; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = r * 0.09; c.beginPath(); c.arc(0, 0, r * 0.72, -1.2, 1.2); c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.72, Math.PI - 1.2, Math.PI + 1.2); c.stroke(); if (Math.cos(spin) > -2) txt(c, '$', 0, r * 0.04, G(800, r * 1.05), '#fff', 'center'); c.restore(); }
  function cube(c, x, y, s, label, k = 1, hot = 0) { // isometric neon cube, front face labelled
    const d = s * 0.38; c.save(); c.globalAlpha = k; c.lineJoin = 'round';
    const face = (pts, fill) => { c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = GR; c.lineWidth = 3; c.shadowColor = GR; c.shadowBlur = 14 + hot * 30; c.stroke(); c.shadowBlur = 0; };
    face([[x, y - s], [x + d, y - s - d], [x + s + d, y - s - d], [x + s, y - s]], hot ? rgba(GR, 0.55) : '#0B2A18'); face([[x + s, y - s], [x + s + d, y - s - d], [x + s + d, y - d], [x + s, y]], hot ? rgba(GR, 0.35) : '#072012'); face([[x, y - s], [x + s, y - s], [x + s, y], [x, y]], hot ? rgba(GR, 0.8) : '#0C3A1F');
    txt(c, label, x + s / 2, y - s / 2, M(800, Math.max(12, s * 0.17)), hot ? '#04140A' : GR, 'center'); c.restore();
  }
  function lightning(c, x0, y0, x1, y1, seed, w = 2.5, col = GR) { c.save(); c.strokeStyle = col; c.lineWidth = w; c.shadowColor = col; c.shadowBlur = 16; c.beginPath(); c.moveTo(x0, y0); const n = 14; for (let i = 1; i <= n; i++) { const k = i / n, j = i === n ? 0 : (hash(i, seed) - 0.5) * 60; c.lineTo(lerp(x0, x1, k) + j * 0.3, lerp(y0, y1, k) + j); if (hash(i, seed, 3) > 0.8 && i < n) { c.moveTo(lerp(x0, x1, k), lerp(y0, y1, k) + j); c.lineTo(lerp(x0, x1, k) + (hash(i, seed, 4) - 0.5) * 120, lerp(y0, y1, k) + j + (hash(i, seed, 5) - 0.5) * 90); c.moveTo(lerp(x0, x1, k) + j * 0.3, lerp(y0, y1, k) + j); } } c.stroke(); c.restore(); }
  function bars(c, x, y, w, h, n, t, k = 1) { for (let i = 0; i < n; i++) { const v = (0.25 + 0.75 * (i / n)) * (0.75 + 0.25 * Math.sin(t * 9 + i * 1.7)) * k, bh = h * v; for (let j = 0; j < bh / 9; j++) { c.fillStyle = rgba(GR, 0.35 + 0.65 * (j * 9 / h)); c.fillRect(x + i * (w / n), y - j * 9 - 6, w / n - 4, 6); } } }

  // ---------- backdrops ----------
  let GRID = null;
  function terminalBg(c, t, glow = 0.18) {
    c.fillStyle = BG; c.fillRect(0, 0, W, H);
    if (!GRID) { GRID = document.createElement('canvas'); GRID.width = GRID.height = 60; const g = GRID.getContext('2d'); g.strokeStyle = 'rgba(34,245,122,0.07)'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, 60, 60); }
    c.save(); c.fillStyle = c.createPattern(GRID, 'repeat'); c.translate(0, (t * 20) % 60); c.fillRect(0, -60, W, H + 60); c.restore();
    const g = c.createRadialGradient(W * 0.5, H * 0.55, 0, W * 0.5, H * 0.55, W * 0.7); g.addColorStop(0, rgba(GR, glow)); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  // pixel texture blocks (the magazine's glitchy green squares)
  function pixelBlocks(c, x, y, cols, rows, s, t, seed, a = 1) { for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const v = hash(i, j, seed); if (v < 0.45) continue; const fl = 0.5 + 0.5 * Math.sin(t * 3 + v * 20); c.fillStyle = rgba(GR, a * (0.15 + 0.6 * v * fl)); c.fillRect(x + i * s, y + j * s, s - 3, s - 3); } }

  // ---------- S1 cold open (0–6) ----------
  const PROB = [['> In crypto, most things are "probably."', 0.15], ['> You\'ll probably get this many coins,', 0.9], ['> at probably this gas fee.', 1.5], ['> Probably confirms in 650ms... or 10 minutes.', 2.05], ['> Wait six blocks. Wait twelve.', 2.75], ['> Pray there\'s no reorg.', 3.3]];
  function coldOpen(c, t) {
    if (t >= 6) return; terminalBg(c, t, 0.08);
    if (t < 4.0) {
      PROB.forEach(([s, T0], i) => { if (t < T0) return; const n = Math.floor(clamp((t - T0) / 0.45) * s.length), last = i === PROB.length - 1; const shown = s.slice(0, n); const y = 300 + i * 82, jit = last && t > 3.6 ? (hash(Math.floor(t * 30), i) - 0.5) * 16 : 0;
        txt(c, shown, 160 + jit, y, M(700, 50), last && t > 3.6 ? RED : GR); if (n < s.length || (i === PROB.length - 1 && Math.floor(t * 4) % 2)) { c.fillStyle = GR; c.fillRect(160 + tw(c, shown, M(700, 50)) + 6, y - 26, 24, 52); } });
      txt(c, 'FINALITY // ISSUE 01 // EDITOR\'S LETTER', 160, 170, M(700, 24), rgba(GR, 0.6), 'left', 'middle', 4);
      if (t > 3.55) { const g = prog(t, 3.55, 4.0); for (let i = 0; i < 18; i++) { const y = hash(i, Math.floor(t * 24)) * H, h = 6 + hash(i, 2, Math.floor(t * 24)) * 40; c.drawImage(cv, 0, y, W, h, (hash(i, 3, Math.floor(t * 24)) - 0.5) * 120 * g, y, W, h); } }
      return;
    }
    // the answer
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H); pixelBlocks(c, W - 520, 80, 8, 14, 64, t, 4, 0.5);
    const k1 = crit(prog(t, 4.0, 4.25)), k2 = crit(prog(t, 4.5, 4.75)), out = ease(t, 5.6, 6.0, (p) => p * p);
    c.save(); c.translate(0, -out * 120); c.globalAlpha = 1 - out;
    c.save(); c.translate(140, 400); c.scale(lerp(1.6, 1, k1), lerp(1.6, 1, k1)); c.globalAlpha = clamp(k1 * 2) * (1 - out); ct(c, "ARC DOESN'T DO", 0, 0, 250, INK); c.restore();
    if (k2 > 0) { c.save(); c.translate(140, 680); c.scale(lerp(1.8, 1, k2), lerp(1.8, 1, k2)); ct(c, 'PROBABLY.', 0, 0, 300, GR); c.restore();
      const sk = io5(prog(t, 4.9, 5.2)); if (sk > 0) { c.save(); c.strokeStyle = RED; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(130, 700); c.lineTo(130 + (ctw(c, 'PROBABLY.', 300) + 20) * sk, 660); c.stroke(); c.restore(); } }
    const fk = A(t, 5.15, 0.3); c.save(); c.globalAlpha = fk; txt(c, 'When a supermajority of validators commits a block, it\'s final.', 146, 900, G(600, 40), INK); src(c, '[3]', 146 + tw(c, 'When a supermajority of validators commits a block, it\'s final.', G(600, 40)) + 14, 900, 30); c.restore();
    c.restore();
  }

  // ---------- S2 mainnet live (6–12) ----------
  function mainnet(c, t) {
    if (t < 6 || t >= 12) return; terminalBg(c, t, 0.14);
    const lx = W / 2, ly = 330, s = 230;
    // blocks fly in and lock into the icon
    for (let i = 0; i < 49; i++) { const gx = i % 7, gy = Math.floor(i / 7), T0 = 6.0 + hash(i, 6) * 0.6, k = crit(prog(t, T0, T0 + 0.5)), a = hash(i, 7) * TAU, d = 900 + hash(i, 8) * 700;
      const tx = lx - s / 2 + gx * s / 7, ty = ly - s / 2 + gy * s / 7; if (t > 7.05) break; c.save(); c.globalAlpha = clamp(k * 3); c.translate(lerp(tx + Math.cos(a) * d, tx, k), lerp(ty + Math.sin(a) * d, ty, k)); c.rotate((1 - k) * (hash(i, 9) - 0.5) * 8); c.fillStyle = hash(i, 10) > 0.5 ? GR : ABLUE; c.fillRect(0, 0, s / 7 - 3, s / 7 - 3); c.restore(); }
    if (t >= 7.0) { const k = pop(prog(t, 7.0, 7.35)); c.save(); c.translate(lx, ly); c.scale(k, k); c.shadowColor = '#5B8CFF'; c.shadowBlur = 80 * pulse(t, 7.0, 3) + 30; arcIcon(c, 0, 0, s); c.restore();
      const rg = prog(t, 7.0, 7.6); if (rg < 1) { c.save(); c.strokeStyle = rgba(GR, 1 - rg); c.lineWidth = 12 * (1 - rg); c.beginPath(); c.arc(lx, ly, s * 0.7 + 900 * o3(rg), 0, TAU); c.stroke(); c.restore(); } }
    // ARC MAINNET IS LIVE.
    const words = [['ARC', 7.5], ['MAINNET', 7.75], ['IS', 8.0], ['LIVE.', 8.25]], size = 230; let tot = words.reduce((a, [w]) => a + ctw(c, w, size) + 40, -40), x = W / 2 - tot / 2;
    words.forEach(([w, T0]) => { const k = crit(prog(t, T0, T0 + 0.22)), ww = ctw(c, w, size); if (k > 0) { c.save(); c.translate(x + ww / 2, 650); c.scale(lerp(2, 1, k), lerp(2, 1, k)); c.globalAlpha = clamp(k * 2); ct(c, w, 0, 0, size, w === 'LIVE.' ? GR : INK, 'center'); c.restore(); } x += ww + 40; });
    if (t > 8.4) for (let i = 0; i < 4; i++) { const seed = Math.floor(t * 14) + i * 7; if (hash(seed, 1) > 0.55) lightning(c, W / 2 - tot / 2 - 60 + hash(seed, 2) * 200, 540 + hash(seed, 3) * 220, W / 2 + tot / 2 + 60 - hash(seed, 4) * 200, 540 + hash(seed, 5) * 220, seed, 2.2); }
    // dateline box
    const bk = io5(prog(t, 9.0, 9.4)); if (bk > 0) { const bw = 1240, bx = W / 2 - bw / 2, by = 790; c.save(); c.globalAlpha = bk; c.strokeStyle = GR; c.lineWidth = 3; c.shadowColor = GR; c.shadowBlur = 20; c.strokeRect(bx, by, bw * bk, 200); c.shadowBlur = 0;
      txt(c, 'MAINNET LAUNCH · DATELINE', bx + 40, by + 38, M(700, 24), GR, 'left', 'middle', 3); src(c, '[1]', bx + 60 + tw(c, 'MAINNET LAUNCH · DATELINE', M(700, 24), 3), by + 38);
      const date = '2026-09-16', fin = clamp((t - 9.3) / 0.8); let dx = bx + 40; [...date].forEach((ch, i) => { const lock = fin * date.length > i, d = lock ? ch : (/\d/.test(ch) ? String(Math.floor(hash(i, Math.floor(t * 30)) * 10)) : ch); txt(c, d, dx, by + 120, M(800, 92), lock ? GR : rgba(GR, 0.5)); dx += tw(c, '0', M(800, 92)); });
      txt(c, '· NEW YORK', dx + 30, by + 120, M(800, 92), A(t, 10.1, 0.3) > 0 ? GR : 'rgba(0,0,0,0)'); txt(c, 'STATE: FINAL', bx + bw - 40, by + 38, M(700, 24), GR, 'right', 'middle', 3);
      txt(c, 'SOURCE: CIRCLE PRESS RELEASE', bx + 40, by + 176, M(600, 20), rgba(GR, 0.7), 'left', 'middle', 2); c.restore(); }
  }

  // ---------- S3 finality (12–18) ----------
  function finality(c, t) {
    if (t < 12 || t >= 18) return; terminalBg(c, t, 0.12);
    const zoom = ease(t, 14.4, 14.9, io5);
    if (zoom < 1) { c.save(); c.globalAlpha = 1 - zoom; c.translate(W / 2, H / 2); c.scale(1 + zoom * 2.5, 1 + zoom * 2.5); c.translate(-W / 2, -H / 2);
      txt(c, 'BLOCK HEIGHT  //  ARC MAINNET', 140, 120, M(700, 26), rgba(GR, 0.7), 'left', 'middle', 3); c.strokeStyle = rgba(GR, 0.4); c.lineWidth = 2; c.beginPath(); c.moveTo(130, 140); c.lineTo(130, 960); c.lineTo(W - 120, 960); c.stroke();
      const B = [['#0001', 12.0], ['#0002', 12.4], ['#0003', 12.8], ['#0004', 13.2], ['#0005', 13.6], ['FINAL', 14.0]];
      B.forEach(([l, T0], i) => { const k = pop(prog(t, T0, T0 + 0.35)); if (k <= 0) return; const s = 110 + i * 26, x = 220 + i * 270, y = 900 - i * 120; c.save(); c.translate(x + s / 2, y - s / 2); c.scale(k, k); c.translate(-x - s / 2, -y + s / 2); cube(c, x, y, s, l, 1, l === 'FINAL' ? 1 : 0); c.restore();
        c.save(); c.setLineDash([8, 8]); c.strokeStyle = rgba(GR, 0.5); c.beginPath(); c.moveTo(x + s / 2, y + 6); c.lineTo(x + s / 2, 958); c.stroke(); c.restore(); if (i) { c.strokeStyle = GR; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 160, y + 60); c.lineTo(x, y - s / 2 + 20); c.stroke(); } });
      txt(c, 'GENESIS 2026-09-16  ·  EVERY BLOCK FINAL →', 140, 1000, M(700, 22), rgba(GR, 0.7), 'left', 'middle', 3); c.restore(); }
    if (zoom > 0) {
      const ms = Math.round(350 * clamp((t - 15.0) / 0.35)); c.save(); c.globalAlpha = zoom; const big = 520; const s = String(ms); ct(c, s, 120, 470, big, GR, 'left', -6); ct(c, 'ms', 120 + ctw(c, '350', big, -6) + 30, 590, 240, GR, 'left');
        if (t > 15.35) { const fl = pulse(t, 15.35, 6); c.fillStyle = rgba(GR, 0.25 * fl); c.fillRect(0, 0, W, H); }
        txt(c, 'FINALITY TEST  ~350ms', 130, 160, M(800, 30), INK, 'left', 'middle', 3); src(c, '[3]', 150 + tw(c, 'FINALITY TEST  ~350ms', M(800, 30), 3), 160, 26); bars(c, 1360, 300, 440, 220, 14, t, A(t, 15.0, 0.4));
        const L = [['SUB-SECOND. DETERMINISTIC.', 15.6, INK], ['NO REORG. NO ROLLBACK. NO SECOND CONFIRMATION.', 16.2, GR]]; L.forEach(([s2, T0, col], i) => { const k = A(t, T0, 0.3); c.save(); c.globalAlpha = k * zoom; txt(c, s2, 130 + (1 - k) * 60, 860 + i * 70, i ? M(800, 40) : G(800, 54), col); c.restore(); });
        src(c, '[1][3][4]', 130, 990, 24); txt(c, 'Consensus: Malachite BFT · Proof of Authority', 300, 990, M(600, 24), rgba(GR, 0.75)); c.restore(); }
  }

  // ---------- S4 economic OS (18–24) ----------
  const FEAT = [['GAS IN DOLLARS', 'Fees paid in USDC, not a volatile token.', '[1][4]', 'coin'], ['FINAL IN UNDER A SECOND', 'Deterministic finality on Malachite BFT.', '[3][4]', 'bolt'], ['BUILT FOR AI AGENTS', 'Policy-controlled wallets, sub-cent USDC.', '[1][2]', 'chip'], ['24/7 STABLECOIN FX', 'StableFX across 20+ stablecoins.', '[1][2]', 'fx'], ['OPT-IN PRIVACY', 'Confidential Solidity, with view keys.', '[1][4]', 'lock'], ['INSTITUTION-GRADE', 'EVM-compatible, post-quantum signatures.', '[1][4]', 'bank']];
  function icon(c, kind, x, y, s, t) {
    c.save(); c.translate(x, y); c.strokeStyle = GR; c.fillStyle = GR; c.lineWidth = 4; c.lineJoin = 'round';
    if (kind === 'coin') { c.beginPath(); c.arc(0, 0, s * 0.45, 0, TAU); c.stroke(); txt(c, '$', 0, 2, G(800, s * 0.6), GR, 'center'); }
    else if (kind === 'bolt') { c.beginPath(); c.moveTo(s * 0.1, -s * 0.5); c.lineTo(-s * 0.25, s * 0.08); c.lineTo(0, s * 0.08); c.lineTo(-s * 0.1, s * 0.5); c.lineTo(s * 0.28, -s * 0.1); c.lineTo(s * 0.02, -s * 0.1); c.closePath(); c.fill(); }
    else if (kind === 'chip') { c.strokeRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.6); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * s * 0.11, -s * 0.3); c.lineTo(i * s * 0.11, -s * 0.45); c.moveTo(i * s * 0.11, s * 0.3); c.lineTo(i * s * 0.11, s * 0.45); c.moveTo(-s * 0.3, i * s * 0.11); c.lineTo(-s * 0.45, i * s * 0.11); c.moveTo(s * 0.3, i * s * 0.11); c.lineTo(s * 0.45, i * s * 0.11); c.stroke(); } txt(c, 'AI', 0, 2, M(800, s * 0.24), GR, 'center'); }
    else if (kind === 'fx') { txt(c, '$', -s * 0.22, -s * 0.08, G(800, s * 0.45), GR, 'center'); txt(c, '€', s * 0.22, s * 0.12, G(800, s * 0.45), GR, 'center'); c.beginPath(); c.arc(0, 0, s * 0.48, -2.6 + t, -1.0 + t); c.stroke(); c.beginPath(); c.arc(0, 0, s * 0.48, 0.5 + t, 2.1 + t); c.stroke(); }
    else if (kind === 'lock') { c.strokeRect(-s * 0.3, -s * 0.02, s * 0.6, s * 0.45); c.beginPath(); c.arc(0, -s * 0.02, s * 0.2, Math.PI, 0); c.stroke(); c.fillRect(-4, s * 0.12, 8, s * 0.14); }
    else if (kind === 'bank') { c.beginPath(); c.moveTo(-s * 0.45, -s * 0.15); c.lineTo(0, -s * 0.45); c.lineTo(s * 0.45, -s * 0.15); c.closePath(); c.stroke(); for (let i = -2; i <= 2; i++) c.fillRect(i * s * 0.17 - 4, -s * 0.08, 8, s * 0.42); c.fillRect(-s * 0.48, s * 0.38, s * 0.96, 6); }
    c.restore();
  }
  function econOS(c, t) {
    if (t < 18 || t >= 24) return; terminalBg(c, t, 0.1);
    const hk = crit(prog(t, 18.0, 18.3)); c.save(); c.beginPath(); c.rect(0, 60, W, 200); c.clip(); txt(c, 'WHAT ARC IS BUILDING', 120, 100 + (1 - hk) * 80, M(800, 26), GR, 'left', 'middle', 4); const hs = Math.min(128, 128 * (W - 360) / ctw(c, 'AN ECONOMIC OPERATING SYSTEM FOR THE INTERNET.', 128)); ct(c, 'AN ECONOMIC OPERATING SYSTEM FOR THE INTERNET.', 116, 190 + (1 - hk) * 160, hs, INK); c.restore(); src(c, '[1][2]', 116 + ctw(c, 'AN ECONOMIC OPERATING SYSTEM FOR THE INTERNET.', hs) + 18, 200, 28);
    const coinT = 22.1, gridOut = ease(t, coinT - 0.1, coinT + 0.25);
    FEAT.forEach(([title, line, s, ic], i) => { const T0 = 18.9 + i * 0.4, k = crit(prog(t, T0, T0 + 0.35)); if (k <= 0) return; const col = i % 3, row = Math.floor(i / 3), cw = 540, chh = 300, x = 120 + col * (cw + 30), y = 330 + row * (chh + 30);
      c.save(); c.globalAlpha = clamp(k * 2) * (1 - gridOut); c.translate(x + cw / 2, y + chh / 2 + (1 - k) * 120); c.rotate((1 - k) * (col - 1) * 0.15); c.translate(-cw / 2, -chh / 2);
      c.fillStyle = rgba('#000000', 0.7); c.fillRect(0, 0, cw, chh); c.strokeStyle = GR; c.lineWidth = 3; c.shadowColor = GR; c.shadowBlur = 16 * (1 + pulse(t, T0, 6)); c.strokeRect(0, 0, cw, chh); c.shadowBlur = 0; c.fillStyle = GR; c.fillRect(0, 0, 70, 7);
      icon(c, ic, 70, 100, 80, t); const tf = G(800, Math.min(36, 36 * (cw - 160) / tw(c, title, G(800, 36)))); txt(c, title, 130, 100, tf, GR); src(c, s, cw - 24, 36, 20, 'right'); const words = line.split(' '); let l1 = '', l2 = ''; for (const w of words) { if (!l2 && tw(c, l1 + w, G(500, 32)) < cw - 70) l1 += w + ' '; else l2 += w + ' '; } txt(c, l1, 40, 190, G(500, 32), INK); txt(c, l2, 40, 236, G(500, 32), INK); c.restore(); });
    if (t > coinT) { const k = pop(prog(t, coinT, coinT + 0.4)); c.save(); c.translate(W / 2 - 360, 640); c.scale(k, k); c.shadowColor = USDC; c.shadowBlur = 60; usdcCoin(c, 0, 0, 200, (t - coinT) * 5); c.restore();
      const lk = A(t, coinT + 0.25, 0.3); c.save(); c.globalAlpha = lk; ct(c, 'USDC IS THE GAS.', W / 2 - 80 + (1 - lk) * 80, 560, 150, INK); txt(c, 'Payments, lending, FX, treasury: fees in dollars,', W / 2 - 74, 690, G(600, 38), GR); txt(c, 'final in under a second.', W / 2 - 74, 740, G(600, 38), GR); src(c, '[1][4]', W / 2 - 74 + tw(c, 'final in under a second.', G(600, 38)) + 16, 740, 26); txt(c, 'EURC and USYC supported natively.', W / 2 - 74, 810, M(600, 26), rgba(INK, 0.7)); c.restore(); }
  }

  // ---------- S5 the eleven (24–35) ----------
  const ELEVEN = [['BlackRock', 'TOKENIZED FUNDS', '$15.3T', 'assets under management', '[19]'], ['ICE', 'MARKET INFRASTRUCTURE', 'NYSE', 'owned by ICE since 2013', '[30]'], ['Standard Chartered', 'SETTLEMENT & CUSTODY', '170', 'years in banking', '[8]'], ['SBI Group', 'GOVERNANCE + USDC', '1st', 'in Japan to distribute USDC', '[1]'], ['DTCC', 'ASSET TOKENIZATION', '$4.7Q', 'securities transactions processed in 2025', '[9]'], ['Galaxy', 'DEFI LIQUIDITY', 'GLXY', 'Nasdaq-listed since May 2025', '[31]'], ['MoneyGram', 'STABLECOIN PAYMENTS', '200+', 'countries and territories', '[10]'], ['Visa', 'ONCHAIN PAYMENTS', '$14.2T', 'FY2025 payments volume', '[11]'], ['Mastercard', 'PAYMENTS INTEROP', '$10.6T', 'gross dollar volume in 2025', '[12]'], ['Sumitomo Corporation', 'NETWORK SECURITY', '1919', 'year founded · 62 countries', '[13]'], ['Global Payments', 'MERCHANT PAYMENTS', '$3.7T', 'annual payment volume (Worldpay)', '[14]']];
  const EL0 = 25.0, ELD = 0.5;
  function eleven(c, t) {
    if (t < 24 || t >= 35) return; terminalBg(c, t, 0.1);
    if (t < EL0) { const k = crit(prog(t, 24.0, 24.3)), k2 = A(t, 24.4, 0.3); c.save(); c.translate(W / 2, 430); c.scale(lerp(1.8, 1, k), lerp(1.8, 1, k)); c.globalAlpha = clamp(k * 2); ct(c, 'THE “ELEVEN”', 0, 0, 360, INK, 'center', -6); c.restore(); c.save(); c.globalAlpha = k2; txt(c, 'Founding Cohort', W / 2, 700, M(800, 70), GR, 'center'); txt(c, 'Block production sits within the institutions that already run global money.', W / 2, 800, M(600, 30), rgba(GR, 0.8), 'center'); src(c, '[1][5]', W / 2, 860, 26, 'center'); c.restore(); return; }
    const gridT = EL0 + ELEVEN.length * ELD; // 30.5
    if (t < gridT) { const i = Math.floor((t - EL0) / ELD), lt = t - EL0 - i * ELD, [name, role, stat, cap, s] = ELEVEN[i], k = crit(prog(lt, 0, 0.16));
      pixelBlocks(c, W - 600, 120, 9, 13, 64, t, 10 + i, 0.35);
      txt(c, `VALIDATOR ${String(i + 1).padStart(2, '0')} / 11`, 120, 150, M(800, 34), GR, 'left', 'middle', 4); txt(c, 'ROLE: VALIDATOR  ·  ' + role, 120, 205, M(700, 28), rgba(GR, 0.85), 'left', 'middle', 3);
      const size = name.length > 12 ? 230 : 300; c.save(); c.translate(120, 440); c.scale(lerp(1.25, 1, k), lerp(1.25, 1, k)); c.globalAlpha = clamp(k * 3); ct(c, name, 0, 0, size, INK, 'left', -4); c.restore();
      const sk = crit(prog(lt, 0.06, 0.24)); c.save(); c.globalAlpha = clamp(sk * 2); ct(c, stat, 120, 760, 260, GR, 'left', -4); txt(c, cap, 132 + ctw(c, stat, 260, -4) + 30, 800, G(600, 40), INK); src(c, s, 132 + ctw(c, stat, 260, -4) + 30, 740, 28); c.restore();
      c.fillStyle = rgba(GR, 0.2); c.fillRect(120, 1000, W - 240, 8); c.fillStyle = GR; c.fillRect(120, 1000, (W - 240) * (i + lt / ELD) / 11, 8); return; }
    // the grid of 12 (snake order like the magazine page), then the editorial pull quote
    const order = [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11], names = [...ELEVEN.map((e) => e[0]), 'Circle'], gw = 400, gh = 170, gx = W / 2 - (gw * 4 + 30 * 3) / 2, gy = 250;
    const qT = 32.9, qk = ease(t, qT, qT + 0.3);
    names.forEach((n, i) => { const slot = order.indexOf(i), col = slot % 4, row = Math.floor(slot / 4), x = gx + col * (gw + 30), y = gy + row * (gh + 30), T0 = gridT + i * 0.1, k = pop(prog(t, T0, T0 + 0.3)); if (k <= 0) return;
      c.save(); c.translate(x + gw / 2, y + gh / 2 - qk * 60); c.scale(k * (1 - qk * 0.15), k * (1 - qk * 0.15)); c.globalAlpha = 1 - qk * 0.75; c.translate(-gw / 2, -gh / 2); const op = i === 11; c.fillStyle = op ? rgba(GR, 0.12) : '#020604'; c.fillRect(0, 0, gw, gh); c.strokeStyle = GR; c.lineWidth = op ? 4 : 2; c.shadowColor = GR; c.shadowBlur = op ? 30 : 10; c.strokeRect(0, 0, gw, gh); c.shadowBlur = 0;
      txt(c, op ? 'NETWORK OPERATOR' : `VALIDATOR ${String(i + 1).padStart(2, '0')}`, 24, 32, M(700, 20), GR, 'left', 'middle', 2); ct(c, n, 24, 105, fit(c, n, 88, gw - 48), INK); c.restore(); });
    // a pulse travels the snake
    const trav = prog(t, gridT + 1.2, gridT + 2.3); if (trav > 0 && trav < 1 && qk < 1) { const p = trav * 11, a = Math.floor(p), f = p - a, s0 = order.indexOf(a), s1 = order.indexOf(Math.min(11, a + 1)); const pt = (sl) => [gx + (sl % 4) * (gw + 30) + gw / 2, gy + Math.floor(sl / 4) * (gh + 30) + gh / 2]; const [x0, y0] = pt(s0), [x1, y1] = pt(s1); c.save(); c.fillStyle = '#fff'; c.shadowColor = GR; c.shadowBlur = 40; c.beginPath(); c.arc(lerp(x0, x1, f), lerp(y0, y1, f), 16, 0, TAU); c.fill(); c.restore(); }
    if (qk > 0) { c.save(); c.globalAlpha = qk; c.fillStyle = 'rgba(0,0,0,0.75)'; c.fillRect(0, 0, W, H); const L = ['“Wall Street didn\'t come to crypto.', 'Crypto built Wall Street a chain.”']; L.forEach((s, i) => { const k = A(t, qT + 0.15 + i * 0.45, 0.35); c.save(); c.globalAlpha = k; txt(c, s, W / 2, 440 + i * 120 + (1 - k) * 30, M(800, 74), i ? GR : INK, 'center'); c.restore(); }); txt(c, '— FINALITY', W / 2, 720, M(800, 40), GR, 'center'); c.restore(); }
  }

  // ---------- S6 numbers (35–42) ----------
  const NUMS = [[35.0, '10B', 10, 'B', 'ARC minted at genesis. No public launch.', '[1][15]', '“No ARC token has been launched. Any discussion is exploratory only.” — Team Arc [2]'], [36.75, '700M+', 700, 'M+', 'testnet transactions in under a year.', '[1]', 'Fully EVM-compatible from day one.'], [38.5, '100+', 100, '+', 'apps live on day one.', '[1][15]', 'incl. Aave V4 · Morpho · Uniswap'], [40.25, '$6.8B', 6.8, 'B', 'USDC transferred in Arc\'s first week.', '@arc', '$624M USDC in circulation · since day 1 on Arc Mainnet']];
  function numbers(c, t) {
    if (t < 35 || t >= 42) return; terminalBg(c, t, 0.12);
    const i = NUMS.findLastIndex(([T0]) => t >= T0), [T0, , val, suf, cap, s, sub] = NUMS[i], lt = t - T0, k = crit(prog(lt, 0, 0.3));
    txt(c, ['MINT LEDGER · STATUS: FINAL', 'TESTNET · PRE-LAUNCH', 'ECOSYSTEM · DAY ONE', 'ONE WEEK ON ARC MAINNET'][i], 120, 150, M(800, 30), GR, 'left', 'middle', 4);
    const v = val * oexp(prog(lt, 0.05, 0.9)), shown = (i === 3 ? '$' : '') + (val < 10 ? v.toFixed(1) : Math.round(v)) + suf; c.save(); c.translate(120, 480); c.scale(lerp(1.3, 1, k), lerp(1.3, 1, k)); c.globalAlpha = clamp(k * 2); ct(c, shown, 0, 0, 520, GR, 'left', -8); c.restore();
    const ck = A(t, T0 + 0.35, 0.3); c.save(); c.globalAlpha = ck; txt(c, cap, 130, 790, G(700, 58), INK); src(c, s, 130 + tw(c, cap, G(700, 58)) + 18, 790, 32); txt(c, sub, 130, 880, M(600, 30), rgba(GR, 0.85)); c.restore();
    if (i === 0) { const lk = A(t, T0 + 0.3, 0.3); c.save(); c.globalAlpha = lk; const L = [['ASSET:', 'ARC'], ['AMOUNT:', '10,000,000,000'], ['ACTION:', 'genesis mint'], ['INITIATOR:', 'Circle (U.S.)'], ['STATUS:', 'no public launch']]; L.forEach(([a, b], j) => { txt(c, a, 1300, 320 + j * 70, M(800, 30), GR); txt(c, b, 1520, 320 + j * 70, G(700, 32), INK); }); c.restore(); }
    if (i === 1) bars(c, 1250, 720, 560, 420, 18, t, A(t, T0 + 0.2, 0.5));
    if (i === 2) ['Aave V4', 'Morpho', 'Uniswap'].forEach((n, j) => { const kk = pop(prog(t, T0 + 0.4 + j * 0.15, T0 + 0.75 + j * 0.15)); if (kk <= 0) return; c.save(); c.translate(1520, 360 + j * 150); c.scale(kk, kk); rr(c, -230, -55, 460, 110, 55); c.fillStyle = '#04140A'; c.fill(); c.strokeStyle = GR; c.lineWidth = 3; c.stroke(); txt(c, n, 0, 3, G(800, 48), INK, 'center'); c.restore(); });
    if (i === 3) { const kk = A(t, T0 + 0.3, 0.4); c.save(); c.globalAlpha = kk; c.translate(1240 + (1 - kk) * 100, 250); c.rotate(0.04); rr(c, -12, -12, 610, 345, 22); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fill(); cover(c, 'week', 0, 0, 586, 321, 16); c.restore(); }
    const ex = prog(t, (NUMS[i + 1] ? NUMS[i + 1][0] : 42) - 0.12, (NUMS[i + 1] ? NUMS[i + 1][0] : 42)); if (ex > 0) { c.fillStyle = rgba(GR, ex * 0.6); c.fillRect(0, 0, W, H); }
  }

  // ---------- S7 live on Arc (42–50) ----------
  const CARDS = [['agentic', 'AGENTIC PAYMENTS', 'x402 builders accept USDC · settle on Arc, Base & Polygon', '18 SEP'], ['centrifuge', 'CENTRIFUGE', 'Janus Henderson & NY Life RWAs: JAAA · JTRSY · HYB', 'LIVE ON ARC'], ['onramp', 'ONRAMP KIT', 'Apple Pay · Google Pay · debit cards · bank transfers', 'NOW ON MAINNET'], ['cirbtc', 'cirBTC', 'just surpassed 5,000 issued', '25 SEP'], ['binance', 'CIRCLE × BINANCE', '5-year USDC deal · $100M strategic investment', '22 SEP'], ['mascot', 'CIRCLE AGENT STACK', 'give your agent USDC — the $ agents use for 99% of txns', '01 OCT']];
  const CA0 = 42.0, CAD = 1.1;
  const INTEG = ['Arc Studio', 'App Kits', 'Arc Portal', 'Circle Agent Stack', 'CCTP', 'Gateway', 'CPN', 'StableFX'];
  function liveOnArc(c, t) {
    if (t < 42 || t >= 50) return; const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#05081A'); bg.addColorStop(1, '#030504'); c.fillStyle = bg; c.fillRect(0, 0, W, H); terminalBg(c, t, 0.0); c.globalAlpha = 1;
    const endC = CA0 + CARDS.length * CAD; // 48.6
    txt(c, '{ LIVE ON ARC }', 120, 110, M(800, 34), GR, 'left', 'middle', 6);
    if (t < endC) { const i = Math.floor((t - CA0) / CAD), lt = t - CA0 - i * CAD, [k, title, line, tag] = CARDS[i];
      // the previous two cards recede into a stack behind
      for (let j = Math.max(0, i - 2); j <= i; j++) { const age = i - j + (j === i ? 0 : lt / CAD) * 0, a = j === i ? crit(prog(lt, 0, 0.45)) : 1, depth = i - j + (j < i ? clamp(lt / 0.45) : 0) - (j === i ? 0 : 1) + (j < i ? 1 : 0) - 1, isMascot = CARDS[j][0] === 'mascot';
        const cw = isMascot ? 640 : 900, im = IMG[CARDS[j][0]], ch = im ? cw * im.height / im.width : 470, sc = j === i ? lerp(0.6, 1, a) : Math.max(0.5, 1 - 0.14 * (i - j) - 0.14 * clamp(lt / 0.45)), x = 1330 + (j === i ? (1 - a) * 900 : -(i - j) * 120), y = 560 - (j === i ? 0 : (i - j) * 50);
        c.save(); c.translate(x, y); c.rotate(j === i ? (1 - a) * 0.4 - 0.04 : -0.08 * (i - j)); c.scale(sc, sc); c.globalAlpha = j === i ? clamp(a * 2) : 0.45 / (i - j); c.shadowColor = j === i ? rgba(GR, 0.6) : 'rgba(0,0,0,0.6)'; c.shadowBlur = 60; rr(c, -cw / 2 - 8, -ch / 2 - 8, cw + 16, ch + 16, 26); c.fillStyle = j === i ? GR : '#111'; c.fill(); c.shadowBlur = 0; cover(c, CARDS[j][0], -cw / 2, -ch / 2, cw, ch, 20); c.restore(); void age; void depth; }
      const tk = crit(prog(lt, 0.1, 0.4)); c.save(); c.beginPath(); c.rect(100, 240, 860, 600); c.clip(); txt(c, tag, 120, 330 - (1 - tk) * 40, M(800, 28), YEL, 'left', 'middle', 4); ct(c, title, 116, 450 + (1 - tk) * 200, fit(c, title, 160, 700), INK);
      const wds = line.split(' '); let l1 = '', l2 = ''; for (const w of wds) { if (!l2 && tw(c, l1 + w, G(600, 40)) < 760) l1 += w + ' '; else l2 += w + ' '; } c.globalAlpha = A(lt, 0.3, 0.3); txt(c, l1, 120, 600, G(600, 40), GR); txt(c, l2, 120, 654, G(600, 40), GR); c.restore();
      c.fillStyle = rgba(GR, 0.2); c.fillRect(120, 1000, 760, 8); c.fillStyle = GR; c.fillRect(120, 1000, 760 * (i + lt / CAD) / CARDS.length, 8); return; }
    // integrations rain into a full-stack wall
    const k0 = crit(prog(t, endC, endC + 0.3)); c.save(); c.globalAlpha = k0; ct(c, 'A FULL-STACK FINANCIAL PLATFORM. LIVE FROM DAY ONE.', W / 2, 260, fit(c, 'A FULL-STACK FINANCIAL PLATFORM. LIVE FROM DAY ONE.', 110, W - 240), INK, 'center'); c.restore();
    INTEG.forEach((n, i) => { const T0 = endC + 0.2 + i * 0.08, k = crit(prog(t, T0, T0 + 0.35)); if (k <= 0) return; const col = i % 4, row = Math.floor(i / 4), w = 400, x = W / 2 - (w * 4 + 30 * 3) / 2 + col * (w + 30), y = 460 + row * 170; c.save(); c.translate(x + w / 2, y + 60 + (1 - k) * 600); rr(c, -w / 2, -60, w, 120, 60); c.fillStyle = '#04140A'; c.fill(); c.strokeStyle = GR; c.lineWidth = 3; c.shadowColor = GR; c.shadowBlur = 20 * pulse(t, T0 + 0.35, 5) + 6; c.stroke(); c.shadowBlur = 0; txt(c, n, 0, 3, G(800, Math.min(40, 40 * (w - 50) / tw(c, n, G(800, 40)))), INK, 'center'); c.restore(); });
    const sk = A(t, endC + 0.9, 0.3); c.save(); c.globalAlpha = sk; txt(c, 'USDC as native gas · deterministic sub-second finality · EVM compatibility · institutional validators', W / 2, 860, M(600, 26), rgba(GR, 0.85), 'center'); src(c, '— @arc, Sept 16, 2026', W / 2, 910, 26, 'center'); c.restore();
  }

  // ---------- S8 quote (50–55) ----------
  const FIB = []; for (let i = 0; i < 420; i++) { const y = 1 - (i / 419) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963; FIB.push([Math.cos(th) * r, y, Math.sin(th) * r]); }
  function globe(c, x, y, R, t, a = 1) { const ry = t * 0.35; for (const [px, py, pz] of FIB) { const cx = px * Math.cos(ry) + pz * Math.sin(ry), cz = -px * Math.sin(ry) + pz * Math.cos(ry), cy2 = py * Math.cos(0.35) - cz * Math.sin(0.35), zz = py * Math.sin(0.35) + cz * Math.cos(0.35); const d = (zz + 1.4) / 2.4; c.fillStyle = rgba(GR, a * (0.15 + 0.85 * d) * (zz > -0.2 ? 1 : 0.4)); c.fillRect(x + cx * R - 2, y + cy2 * R - 2, 3 + d * 3, 3 + d * 3); } }
  function quote(c, t) {
    if (t < 50 || t >= 55) return; terminalBg(c, t, 0.08); globe(c, W - 420, H / 2, 380, t, 0.8);
    const L = [['MONEY', 50.2], ['SHOULD WORK', 50.6], ['THE WAY THE', 51.0], ['INTERNET', 51.4], ['WORKS.', 51.8]];
    L.forEach(([s, T0], i) => { const k = crit(prog(t, T0, T0 + 0.3)); if (k <= 0) return; c.save(); c.beginPath(); c.rect(100, 90 + i * 150, 1300, 160); c.clip(); ct(c, s, 120, 170 + i * 150 + (1 - k) * 160, 190, i >= 3 ? GR : INK); c.restore(); });
    const ak = A(t, 52.5, 0.4); c.save(); c.globalAlpha = ak; txt(c, '— Jeremy Allaire, Co-founder, Chairman & CEO, Circle', 124, 960, G(700, 36), INK); src(c, '[1][2]', 124 + tw(c, '— Jeremy Allaire, Co-founder, Chairman & CEO, Circle', G(700, 36)) + 16, 960, 28); txt(c, '“Arc is the single most significant launch in Circle\'s history since USDC itself.”', 124, 1015, M(600, 22), rgba(GR, 0.8)); c.restore();
  }

  // ---------- S9 end card (55–60) ----------
  function endCard(c, t) {
    if (t < 55) return; terminalBg(c, t, 0.16);
    const ik = pop(prog(t, 55.0, 55.4)), mv = io5(prog(t, 57.2, 57.7)); c.save(); c.translate(lerp(W / 2, 560, mv), lerp(330, 300, mv)); c.scale(ik * lerp(1, 0.7, mv), ik * lerp(1, 0.7, mv)); c.shadowColor = '#5B8CFF'; c.shadowBlur = 70; arcIcon(c, 0, 0, 260); c.restore();
    const wk = crit(prog(t, 55.3, 55.6)); c.save(); c.globalAlpha = clamp(wk * 2) * (1 - mv); ct(c, 'ARC', W / 2, 640 + (1 - wk) * 100, 300, INK, 'center', -4);
    txt(c, 'THE ECONOMIC OS FOR THE INTERNET.', W / 2, 820, M(800, 48), GR, 'center', 'middle', 4); txt(c, 'arc.io', W / 2, 910, M(800, 44), INK, 'center', 'middle', 6); c.restore();
    if (mv > 0) { c.save(); c.globalAlpha = mv; ct(c, 'ARC', 560, 610, 200, INK, 'center', -4); txt(c, 'arc.io', 560, 760, M(800, 44), GR, 'center', 'middle', 6);
      const ck = io5(prog(t, 57.4, 58.0)); c.save(); c.translate(1380 + (1 - ck) * 700, 470); c.rotate(0.06 - (1 - ck) * 0.3); c.shadowColor = GR; c.shadowBlur = 50; const cw = 470, chh = cw * 2000 / 1545; c.fillStyle = GR; c.fillRect(-cw / 2 - 6, -chh / 2 - 6, cw + 12, chh + 12); c.shadowBlur = 0; cover(c, 'cover', -cw / 2, -chh / 2, cw, chh); c.restore();
      const tk = A(t, 57.9, 0.3); c.globalAlpha = tk * mv; txt(c, 'Covered every week by', 960, 860, M(700, 26), rgba(GR, 0.8), 'right'); txt(c, 'FINALITY · @FINALITYmag', 960, 905, G(900, 38), INK, 'right'); c.restore(); }
    const fk = crit(prog(t, 58.2, 58.5)); if (fk > 0) { c.save(); c.globalAlpha = clamp(fk * 2); ct(c, 'FINAL. IRREVERSIBLE. WEEKLY.', W / 2, 1010, 120, GR, 'center'); c.restore(); }
  }

  // ---------- HUD + transitions ----------
  const ACTS = [[0, 'COLD OPEN'], [6, 'MAINNET'], [12, 'FINALITY'], [18, 'ECONOMIC OS'], [24, 'THE ELEVEN'], [35, 'BY THE NUMBERS'], [42, 'LIVE ON ARC'], [50, 'ON THE RECORD'], [55, 'FINAL']];
  function hud(c, t) {
    if (t < 4) return; c.save(); c.globalAlpha = 0.85 * (1 - prog(t, 59.2, 59.8)); const m = 40;
    c.strokeStyle = rgba(GR, 0.7); c.lineWidth = 2; for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { c.beginPath(); c.moveTo(x, y + sy * 30); c.lineTo(x, y); c.lineTo(x + sx * 30, y); c.stroke(); }
    const blk = 1 + Math.floor(t / 0.35); txt(c, `ARC // MAINNET   BLOCK #${String(blk).padStart(6, '0')}   STATE: FINAL`, W - m - 20, m + 18, M(700, 18), rgba(GR, 0.8), 'right', 'middle', 2);
    const act = ACTS.filter(([a]) => t >= a).pop(); txt(c, `FINALITY × ARC  ·  ${act[1]}`, m + 20, m + 18, M(700, 18), rgba(GR, 0.8), 'left', 'middle', 2);
    c.restore();
  }
  function blockWipe(c, t, T0, d = 0.36) { const p = prog(t, T0 - d / 2, T0 + d / 2); if (p <= 0 || p >= 1) return; const n = 16, s = W / n, rows = Math.ceil(H / s); for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) { const h0 = hash(i, j, Math.floor(T0 * 10)) * 0.5 + (i / n) * 0.5, a = clamp(1 - Math.abs(p * 1.6 - 0.3 - h0) * 3.2); if (a <= 0) continue; c.fillStyle = a > 0.6 ? GR : rgba(GR, a); c.fillRect(i * s, j * s, s - 2, s - 2); } }
  const WIPES = [12, 18, 24, 35, 42, 50, 55];
  const HITS = [4.0, 4.5, 4.9, 7.0, 7.5, 8.25, 12.0, 14.0, 15.35, 18.0, 22.1, 24.0, ...ELEVEN.map((_, i) => EL0 + i * ELD), 30.5, 32.9, 35.0, 36.75, 38.5, 40.25, 42.0, 43.1, 44.2, 45.3, 46.4, 47.5, 48.6, 50.0, 51.8, 55.0, 57.2, 58.2];
  let BUF = null, GRAIN = null, SCAN = null;
  function finish(c, t) {
    let h = 0; for (const T0 of HITS) h = Math.max(h, pulse(t, T0, 14));
    if (h > 0.05) { if (!BUF) { BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; } const b = BUF.getContext('2d'); b.clearRect(0, 0, W, H); b.drawImage(cv, 0, 0); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16 * h; c.drawImage(BUF, -14 * h, 0); c.drawImage(BUF, 14 * h, 0); c.restore(); }
    if (!SCAN) { SCAN = document.createElement('canvas'); SCAN.width = 4; SCAN.height = 4; const g = SCAN.getContext('2d'); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 0, 4, 1); }
    c.save(); c.fillStyle = c.createPattern(SCAN, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 14; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const vg = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    const fi = 1 - prog(t, 0, 0.25), fo = prog(t, 59.4, 60); if (fi > 0 || fo > 0) { c.fillStyle = `rgba(0,0,0,${Math.max(fi, fo)})`; c.fillRect(0, 0, W, H); }
  }
  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.filter = 'none'; c.imageSmoothingQuality = 'high';
    let sh = 0; for (const T0 of HITS) sh = Math.max(sh, pulse(t, T0, 18) * 9); c.save(); c.translate((hash(Math.round(t * FPS), 3) - 0.5) * 2 * sh, (hash(Math.round(t * FPS), 4) - 0.5) * 2 * sh);
    coldOpen(c, t); mainnet(c, t); finality(c, t); econOS(c, t); eleven(c, t); numbers(c, t); liveOnArc(c, t); quote(c, t); endCard(c, t); c.restore();
    c.globalAlpha = 1; hud(c, t); for (const T0 of WIPES) blockWipe(c, t, T0); finish(c, t);
  }
  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(D(100)), document.fonts.load(G(700, 30)), document.fonts.load(G(500, 30)), document.fonts.load(G(600, 30)), document.fonts.load(G(800, 30)), document.fonts.load(G(900, 30)), document.fonts.load(M(700, 20)), document.fonts.load(M(800, 20)), document.fonts.load(M(600, 20)), ...ASSETS.map((k) => load(k, `../assets/arc/${k}.png`))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
