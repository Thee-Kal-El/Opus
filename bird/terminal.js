// BIRDEYE TERMINAL — 26s, 1920x1080 @ 60fps, cut to 120 BPM.
// A single dot on black becomes the Birdeye terminal: Trending Tokens → Profitable Traders → Bubble Map → Find Gems → Large Trades. The camera dives
// in and out across scales, pulls back until the desktop is a point in space, flies to a second point that
// becomes a landscape phone (bubble map | trending tokens), then resolves on the Birdeye logo.
// Everything is vector-drawn under one camera transform (crisp at any zoom); renderAt(t) is deterministic.
(() => {
  'use strict';
  const K = window.KIT, { C, F, M, TAU, clamp, lerp, prog, io3, io5, o3, crit, pop, A, hash, rng, rgba, rr, text } = K;
  const W = 1920, H = 1080, FPS = 60, DUR = 26;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');

  // ---------- world layout: the real Birdeye home terminal (after the 2nd dashboard screenshot) ----------
  const WIN = {
    trend: { x: 8, y: 112, w: 466, h: 540, t: 0.9, title: 'TRENDING TOKENS', tabs: ['SMART MONEY'], right: 'View more' },
    traders: { x: 482, y: 112, w: 468, h: 540, t: 2.0, title: 'PROFITABLE TRADERS', right: 'View more' },
    bub: { x: 958, y: 112, w: 954, h: 540, t: 2.5, title: '' },
    gems: { x: 8, y: 660, w: 942, h: 412, t: 3.0, title: 'FIND GEMS' },
    large: { x: 958, y: 660, w: 954, h: 412, t: 3.5, title: 'LARGE TRADES' },
  };
  const DOT = [240, 380];
  const PHONE = { x: 52000, y: -18500, w: 2340, h: 1080 };
  const TREND = [['HIGGS', '$0.003166', 129], ['QQQB', '$757.79', 0.49], ['PUMP', '$0.006349', -2.13], ['NVDAx', '$240.89', 2.1], ['CARDS', '$0.2828', 15.06], ['PLAGUE', '$0.002049', 449], ['CRAWL', '$0.004517', 166], ['BNCB', '$6.0904', -0.83]];
  const TRADERS = [['Gbj9i5dKt5', '+$8.58M', '$1B', 'sol'], ['2w3nD9VdSh', '+$3.63M', '$11.9M', 'sol'], ['0x424d9f20', '+$1.94M', '$16M', 'bnb'], ['0x2Ff0f110', '+$1.87M', '$15.38M', 'bnb'], ['0x3F59A126', '+$1.35M', '$1.66M', 'bnb'], ['0x2441FF7C', '+$1.34M', '$1.64M', 'bnb'], ['0x6bcB959C', '+$892.01K', '$897.45K', 'bnb'], ['0x89f244Ac', '+$886.26K', '$1.15M', 'bnb']];
  const GEMS = [['USDC', 'USDC', '$1.0000', 0, '$8.42B', -99.98, '#2775CA'], ['SOL', 'SOL', '$120.94', -0.37, '$3.36B', 1.17, '#1E1E1E'], ['USDT', 'Binance Bridged USDT (BNB Smart Chain)', '$1.0000', 0, '$1.96B', 34.8, '#26A17B']];
  const LARGE = [['bnb', '$29.89K', '-29.89K', 'USDT', '+150.81K', '币安皇帝', '0xBa128Ef2', 34], ['bnb', '$10.07K', '-51.91K', '币安皇帝', '+10.07K', 'USDT', '0x0064f894', 37], ['sol', '$12K', '-12K', 'USDC', '+11.99K', 'ETH-USDT', '8RvqEo9pqT', 39]];
  // bubble map (screenshot pixel centre, radius, name, %) — mapped into the bubble window
  const BUB = [['AAVE', 1.97, 1053, 270, 20], ['WBNB', -1.25, 1113, 225, 18], ['LINK', -2.33, 1200, 240, 35], ['ADA', 2.79, 1315, 240, 38], ['BTCB', -0.93, 1400, 225, 20], ['UNI', -1.33, 1463, 240, 22], ['ENA', 3.19, 1550, 240, 42], ['WETH', -0.66, 1620, 220, 16], ['PUMP', -2.29, 1711, 238, 35], ['SHIB', -0.98, 1876, 240, 18],
    ['JUP', 4.05, 1140, 315, 48], ['TAO', 1.66, 1254, 295, 28], ['TON', 4.2, 1390, 315, 48], ['ATOM', 2.84, 1492, 325, 38], ['ASTER', 3.14, 1638, 295, 40], ['ICP', 5.64, 1797, 300, 55], ['SUI', -1.31, 1570, 335, 22], ['WLFI', -0.96, 1876, 345, 18],
    ['SKY', -8.31, 1083, 428, 66], ['AERO', -2.69, 1270, 383, 36], ['RENDER', 3.82, 1363, 415, 45], ['NEXO', -3.12, 1500, 415, 42], ['NIGHT', 13.18, 1700, 425, 85], ['M', -2.74, 1837, 410, 38], ['ONDO', 0.59, 1184, 385, 15], ['DOGE', -0.88, 1292, 452, 17],
    ['BTW', -4.31, 1209, 465, 48], ['RAIN', 0.96, 995, 468, 20], ['PEPE', -0.59, 1438, 377, 15], ['WLD', -0.91, 1580, 418, 17], ['MORPHO', 0.65, 1470, 486, 15], ['CRO', 0.56, 1882, 455, 15],
    ['ZRO', 5.44, 1027, 560, 53], ['QNT', 4.58, 1147, 565, 50], ['VVV', -4.35, 1268, 560, 48], ['NEAR', 7.42, 1394, 545, 62], ['OKB', 10.45, 1566, 535, 75], ['MNT', -2.06, 1683, 570, 33], ['LIT', 9.23, 1825, 545, 70]];
  const bubXY = (b, win = WIN.bub) => [win.x + (b[2] - 958) / 957 * win.w, win.y + 52 + (b[3] - 195) / 425 * (win.h - 60), b[4] * Math.min(win.w / 957, (win.h - 60) / 425) * 1.02];

  // ---------- camera keyframes: [t, cx, cy, log(zoom)] — zoom is interpolated in log space ----------
  const L = Math.log;
  const NIGHT = (() => { const b = BUB.find((q) => q[0] === 'NIGHT'); return bubXY(b); })();
  const rowYT = (i) => WIN.trend.y + 90 + i * ((WIN.trend.h - 96) / 8) + (WIN.trend.h - 96) / 16;
  // fast whips (0.35s) between holds; every move starts on a beat (120 BPM)
  const KEYS = [
    [0.0, DOT[0], DOT[1], L(3.2)], [0.9, DOT[0], DOT[1], L(3.2)], [1.6, 241, 382, L(1.7)], [2.0, 260, 382, L(1.6)],
    [2.6, 960, 540, L(1.0)], [5.65, 960, 540, L(1.05)],
    [6.0, 240, rowYT(5), L(2.7)], [7.65, 250, rowYT(5), L(3.0)],            // TRENDING  · PLAGUE +449%
    [8.0, 716, 260, L(2.4)], [9.65, 716, 280, L(2.6)],                        // SMART MONEY · +$8.58M
    [10.0, 1435, 380, L(1.75)], [11.65, 1435, 380, L(1.9)],                   // BUBBLE MAP
    [12.0, 480, 860, L(2.0)], [13.65, 480, 870, L(2.15)],                     // FIND GEMS
    [14.0, 1435, 860, L(2.0)], [15.65, 1435, 870, L(2.15)],                   // WHALE TRADES
    [16.0, 960, 540, L(1.0)], [22.0, 960, 540, L(1.08)], [26.0, 960, 540, L(1.12)],
  ];


  function camera(t) {
    let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], seg = b[0] - a[0], k = seg < 0.8 ? io5(prog(t, a[0], b[0])) : io3(prog(t, a[0], b[0]));
    // big moves (log-zoom change > 2) pan in proportion to zoom so the target stays put while scaling
    const dz = Math.abs(b[3] - a[3]);
    if (dz > 2) {
      const lz = lerp(a[3], b[3], k), za = Math.exp(a[3]), zb = Math.exp(b[3]), z = Math.exp(lz);
      const w = (1 / z - 1 / za) / ((1 / zb - 1 / za) || 1);
      return { x: lerp(a[1], b[1], clamp(w)), y: lerp(a[2], b[2], clamp(w)), z, lz };
    }
    const lz = lerp(a[3], b[3], k); return { x: lerp(a[1], b[1], k), y: lerp(a[2], b[2], k), z: Math.exp(lz), lz };
  }
  let CAM;
  const toScreen = (x, y) => [(x - CAM.x) * CAM.z + W / 2, (y - CAM.y) * CAM.z + H / 2];

  // ---------- space ----------
  const STARS = (() => { const r = rng(9), s = []; for (let i = 0; i < 900; i++) s.push({ a: r() * TAU, u: r(), b: 0.3 + r() * 0.7, h: r() < 0.15 ? 28 : r() < 0.3 ? 210 : 0 }); return s; })();
  function space(c, t, vis) {
    if (vis <= 0.001) return;
    c.save(); c.globalAlpha = vis;
    const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 1300); g.addColorStop(0, '#0B0A14'); g.addColorStop(1, '#000000'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // nebula wisps
    c.globalCompositeOperation = 'lighter';
    for (const [x, y, r, col] of [[400, 300, 700, '#2A1240'], [1500, 800, 800, '#0F2440'], [1100, 200, 500, '#3A1A08']]) { const ng = c.createRadialGradient(x, y, 0, x, y, r); ng.addColorStop(0, rgba(col, 0.55)); ng.addColorStop(1, rgba(col, 0)); c.fillStyle = ng; c.fillRect(0, 0, W, H); }
    // infinite-zoom starfield driven by log-zoom: stars stream outward as we zoom in, inward as we zoom out
    for (const s of STARS) {
      const u = (((s.u + CAM.lz * 0.16) % 1) + 1) % 1, rad = Math.exp(u * 7.2) - 1, x = W / 2 + Math.cos(s.a) * rad, y = H / 2 + Math.sin(s.a) * rad;
      if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
      const fade = Math.min(1, u * 5) * Math.min(1, (1 - u) * 6), sz = 0.6 + u * 2.4 * s.b;
      c.fillStyle = s.h ? `hsla(${s.h},90%,75%,${fade * s.b})` : `rgba(255,255,255,${fade * s.b})`;
      c.beginPath(); c.arc(x, y, sz, 0, TAU); c.fill();
    }
    c.restore();
  }
  // a world rect seen from far away: glowing point
  function beacon(c, x, y, w, h, col, a = 1) {
    const [sx, sy] = toScreen(x + w / 2, y + h / 2), size = Math.max(w, h) * CAM.z;
    if (size > 60) return;
    const r = Math.max(2.5, size * 0.6), al = a * clamp((60 - size) / 40);
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(sx, sy, 0, sx, sy, r * 14); g.addColorStop(0, rgba(col, 0.9 * al)); g.addColorStop(0.15, rgba(col, 0.35 * al)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.fillRect(sx - r * 14, sy - r * 14, r * 28, r * 28);
    c.fillStyle = `rgba(255,255,255,${al})`; c.beginPath(); c.arc(sx, sy, r * 0.8, 0, TAU); c.fill();
    c.strokeStyle = rgba(col, 0.4 * al); c.lineWidth = 1; c.beginPath(); c.moveTo(sx - r * 18, sy); c.lineTo(sx + r * 18, sy); c.moveTo(sx, sy - r * 10); c.lineTo(sx, sy + r * 10); c.stroke();
    c.restore();
  }

  // ---------- table widgets (match the site) ----------
  const hdr = (c, x, y, w, cols) => { c.fillStyle = '#141414'; c.fillRect(x, y, w, 40); cols.forEach(([s2, cx, al]) => text(c, s2, cx, y + 20, F(500, 15), C.mute, al)); };
  const sep = (c, x, y, w) => { c.strokeStyle = C.line; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke(); };
  const tick = (t, i, amp = 1) => (K.hash(Math.floor(t * 3), i, 5) - 0.5) * amp;
  function chainDot(c, x, y, r, kind) {
    if (kind === 'sol') { c.save(); c.translate(x, y); const g = c.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, '#9945FF'); g.addColorStop(1, '#14F195'); c.fillStyle = g; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(-r * 0.8 + (k === 0 ? 0.2 * r : 0), k * r * 0.55 - r * 0.15); c.lineTo(r * 0.9, k * r * 0.55 - r * 0.15); c.lineTo(r * 0.7, k * r * 0.55 + r * 0.15); c.lineTo(-r, k * r * 0.55 + r * 0.15); c.fill(); } c.restore(); }
    else { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = C.yellow; c.fill(); c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.strokeStyle = '#FFF6D0'; c.lineWidth = r * 0.18; c.strokeRect(-r * 0.32, -r * 0.32, r * 0.64, r * 0.64); c.restore(); }
  }
  function tokenIcon(c, x, y, r, name, i) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = `hsl(${(K.hash(i, 11) * 360) | 0},55%,42%)`; c.fill(); text(c, name[0], x, y + 1, F(800, r * 0.9), '#fff', 'center'); }
  function trendTbl(c, w0, t, rowsShown = 8) {
    const { x, y, w, h } = w0, top = y + 46; hdr(c, x, top, w, [['Token', x + 14, 'left'], ['Price', x + w * 0.7, 'right'], ['24h Chg', x + w - 14, 'right']]);
    const rh = (h - 96) / 8;
    TREND.slice(0, rowsShown).forEach(([n, p, ch], i) => {
      const ry = top + 40 + i * rh + rh / 2, k = A(t, w0.t + 0.45 + i * 0.04, 0.3); if (k <= 0) return;
      c.save(); c.globalAlpha *= k; c.translate((1 - k) * 30, 0);
      tokenIcon(c, x + 26, ry, 14, n, i); text(c, n, x + 52, ry, F(700, 16), C.ink); text(c, p, x + w * 0.7, ry, F(500, 16), C.ink, 'right');
      const v = ch;
      text(c, `${v >= 0 ? '+' : ''}${Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, '')}%`, x + w - 14, ry, F(500, 16), v >= 0 ? C.green : C.red, 'right');
      sep(c, x, ry + rh / 2, w); c.restore();
    });
  }
  function tradersTbl(c, w0, t) {
    const { x, y, w, h } = w0, top = y + 46; hdr(c, x, top, w, [['Trader', x + 14, 'left'], ['7D R PnL', x + w * 0.68, 'right'], ['7d Vol', x + w - 14, 'right']]);
    const rh = (h - 96) / 8;
    TRADERS.forEach(([a, pnl, vol, ch], i) => {
      const ry = top + 40 + i * rh + rh / 2, k = A(t, w0.t + 0.45 + i * 0.04, 0.3); if (k <= 0) return;
      c.save(); c.globalAlpha *= k; c.translate((1 - k) * 30, 0);
      chainDot(c, x + 26, ry, 11, ch); text(c, a, x + 46, ry, M(500, 15), C.blue);
      c.strokeStyle = C.mute; c.lineWidth = 1.3; c.strokeRect(x + 52 + c.measureText(a).width + 10, ry - 7, 10, 12);
      text(c, pnl, x + w * 0.68, ry, F(500, 16), C.green, 'right'); text(c, vol, x + w - 14, ry, F(500, 16), C.ink, 'right');
      sep(c, x, ry + rh / 2, w); c.restore();
    });
  }
  function radio(c, x, y, label, on) { c.beginPath(); c.arc(x, y, 8, 0, TAU); c.strokeStyle = on ? C.orange : C.mute; c.lineWidth = 1.5; c.stroke(); if (on) { c.beginPath(); c.arc(x, y, 4.5, 0, TAU); c.fillStyle = C.orange; c.fill(); } text(c, label, x + 16, y, F(500, 15), C.ink); }
  function gemsTbl(c, w0, t) {
    const { x, y, w, h } = w0;
    radio(c, x + w - 330, y + 23, 'Top Volume', true); radio(c, x + w - 210, y + 23, 'Top Gainers', false); text(c, 'Find more', x + w - 14, y + 23, F(500, 15), C.blue, 'right');
    const top = y + 46; hdr(c, x, top, w, [['Token', x + 14, 'left'], ['Price', x + w * 0.48, 'right'], ['24h Chg', x + w * 0.65, 'right'], ['24h Vol', x + w * 0.82, 'right'], ['24h Chg', x + w - 14, 'right']]);
    const rh = (h - 92) / 3.6;
    GEMS.forEach(([n, sub, p, ch, vol, ch2, col], i) => {
      const ry = top + 40 + i * rh, k = A(t, w0.t + 0.45 + i * 0.06, 0.35); if (k <= 0) return;
      c.save(); c.globalAlpha *= k; c.translate((1 - k) * 30, 0);
      c.beginPath(); c.arc(x + 30, ry + rh / 2, 17, 0, TAU); c.fillStyle = col; c.fill(); text(c, n[0] === 'S' ? '≡' : '$', x + 30, ry + rh / 2 + 1, F(800, 16), '#fff', 'center');
      text(c, n, x + 60, ry + rh * 0.36, F(700, 16), C.ink); text(c, sub, x + 60, ry + rh * 0.66, F(400, 13), C.mute);
      text(c, p, x + w * 0.48, ry + rh * 0.36, F(500, 16), C.ink, 'right');
      text(c, `${ch > 0 ? '+' : ''}${ch}%`, x + w * 0.65, ry + rh * 0.36, F(500, 16), ch === 0 ? C.mute : ch > 0 ? C.green : C.red, 'right');
      text(c, vol, x + w * 0.82, ry + rh * 0.36, F(500, 16), C.ink, 'right');
      text(c, `${ch2 > 0 ? '+' : ''}${ch2}%`, x + w - 14, ry + rh * 0.36, F(500, 16), ch2 >= 0 ? C.green : C.red, 'right');
      sep(c, x, ry + rh, w); c.restore();
    });
  }
  function largeTbl(c, w0, t) {
    const { x, y, w, h } = w0;
    [['> $10K', true], ['> $50K', false], ['> $100K', false], ['> $1M', false]].forEach(([s2, on], i) => radio(c, x + w - 450 + i * 100, y + 23, s2, on));
    text(c, 'Find more', x + w - 14, y + 23, F(500, 15), C.blue, 'right');
    const top = y + 46; hdr(c, x, top, w, [['Value', x + w * 0.17, 'left'], ['Amount', x + w * 0.38, 'left'], ['Traders', x + w * 0.59, 'left'], ['Time', x + w * 0.79, 'left']]);
    const rh = (h - 92) / 3.6, el = Math.max(0, Math.floor(t - w0.t));
    LARGE.forEach(([ch, val, a1, s1, a2, s2, tr, sec], i) => {
      const ry = top + 40 + i * rh, k = A(t, w0.t + 0.45 + i * 0.06, 0.35); if (k <= 0) return;
      c.save(); c.globalAlpha *= k; c.translate((1 - k) * 30, 0);
      chainDot(c, x + w * 0.09, ry + rh * 0.3, 11, ch);
      text(c, val, x + w * 0.17, ry + rh * 0.3, F(500, 16), C.ink);
      c.font = F(500, 15); text(c, a1, x + w * 0.38, ry + rh * 0.3, F(500, 15), C.ink); text(c, s1, x + w * 0.38 + c.measureText(a1).width + 8, ry + rh * 0.3, F(500, 15), C.blue);
      c.font = F(500, 15); text(c, a2, x + w * 0.38, ry + rh * 0.68, F(500, 15), C.ink); text(c, s2, x + w * 0.38 + c.measureText(a2).width + 8, ry + rh * 0.68, F(500, 15), C.blue);
      text(c, tr, x + w * 0.59, ry + rh * 0.3, M(500, 15), C.blue);
      text(c, `${sec + el}s  ago`, x + w * 0.79, ry + rh * 0.3, M(500, 15), C.ink);
      c.strokeStyle = C.mute; c.lineWidth = 1.4; c.strokeRect(x + w - 34, ry + rh * 0.3 - 8, 14, 14);
      sep(c, x, ry + rh, w); c.restore();
    });
  }
  function bubblePanel(c, w0, t, opts = {}) {
    const { x, y, w, h } = w0;
    // header: BUBBLE MAP dropdown + time tabs, as on the site
    rr(c, x + 16, y + 12, 240, 32, 6); c.strokeStyle = C.line2; c.lineWidth = 1.2; c.stroke(); text(c, '⦿  BUBBLE MAP', x + 30, y + 28, F(800, 13), C.ink);
    rr(c, x + w - 230, y + 12, 214, 32, 6); c.fillStyle = '#161616'; c.fill();
    ['24h', '7D', '30D', '1Y'].forEach((s2, i) => { if (i === 0) { rr(c, x + w - 226, y + 15, 50, 26, 4); c.fillStyle = '#2A2A2A'; c.fill(); } text(c, s2, x + w - 201 + i * 53, y + 28, F(700, 12), i === 0 ? C.orange : C.mute, 'center'); });
    const lt = t - w0.t;
    BUB.forEach((b, i) => {
      const t0 = w0.t + 0.7 + (i % 13) * 0.05 + Math.floor(i / 13) * 0.18, k = K.pop(prog(t, t0, t0 + 0.55)); if (k <= 0) return;
      const [bx, by, br] = bubXY(b, w0);
      K.bubble(c, bx + Math.sin(lt * 0.8 + i) * 2.5, by + Math.cos(lt * 0.7 + i * 1.3) * 2.5, br * k, b[0], b[1]);
    });
  }

  // ---------- the desktop ----------
  function openK(w, t) { return A(t, w.t, 0.9, crit); }
  function windowFrame(c, w, t, draw, active) {
    const k = openK(w, t); if (k <= 0) return;
    const ox = DOT[0], oy = DOT[1], x = lerp(ox, w.x, k), y = lerp(oy, w.y, k), ww = w.w * k, hh = w.h * k;
    if (k < 1) { c.save(); c.strokeStyle = C.orange; c.lineWidth = 2.4 / Math.max(0.5, CAM.z); c.shadowColor = C.orange; c.shadowBlur = 20; c.strokeRect(x, y, ww, hh); c.restore(); }
    const ca = clamp((k - 0.55) / 0.45); if (ca <= 0) return;
    c.save(); c.globalAlpha *= ca;
    K.panel(c, x, y, ww, hh, w.title, { tabs: w.tabs, right: w.right, active });
    if (k >= 0.999) { c.beginPath(); c.rect(w.x, w.y + (w.title ? 45 : 0), w.w, w.h - (w.title ? 45 : 0)); c.clip(); draw(c, t); }
    c.restore();
  }
  function desktop(c, t) {
    c.fillStyle = C.bg; c.fillRect(0, 0, 1920, 1080);
    const navK = A(t, 3.5, 0.5);
    if (navK > 0) { c.save(); c.globalAlpha = navK; c.translate(0, (1 - navK) * -30); K.topNav(c, 0, 0, 1920, 56); K.chainBar(c, 0, 56, 1920, 48, 0); c.restore(); }
    windowFrame(c, WIN.trend, t, (c2, tt) => trendTbl(c2, WIN.trend, tt), t > 5.9 && t < 8.0);
    windowFrame(c, WIN.traders, t, (c2, tt) => tradersTbl(c2, WIN.traders, tt), t > 7.9 && t < 10.0);
    windowFrame(c, WIN.bub, t, (c2, tt) => bubblePanel(c2, WIN.bub, tt), t > 9.9 && t < 12.0);
    windowFrame(c, WIN.gems, t, (c2, tt) => gemsTbl(c2, WIN.gems, tt), t > 11.9 && t < 14.0);
    windowFrame(c, WIN.large, t, (c2, tt) => largeTbl(c2, WIN.large, tt), t > 13.9 && t < 16.0);
    // focus highlights
    const hl = (x, y, w, h, t0, t1) => { const k = A(t, t0, 0.35) * (1 - A(t, t1, 0.3)); if (k <= 0) return; c.save(); c.globalAlpha = k; c.strokeStyle = C.orange; c.lineWidth = 2; c.shadowColor = C.orange; c.shadowBlur = 14; c.strokeRect(x, y, w, h); c.restore(); };
    const rhT = (WIN.trend.h - 96) / 8;
    hl(WIN.trend.x + 4, rowYT(5) - rhT / 2 + 2, WIN.trend.w - 8, rhT - 4, 6.0, 7.6);
    hl(WIN.traders.x + 4, WIN.traders.y + 86 + 2, WIN.traders.w - 8, rhT - 4, 8.0, 9.6);
    const rhL = (WIN.large.h - 92) / 3.6;
    hl(WIN.large.x + 4, WIN.large.y + 86 + 2, WIN.large.w - 8, rhL - 4, 14.0, 15.6);
  }

  // ---------- the phone (landscape): bubble map | trending tokens ----------
  function phone(c, t) {
    const { x, y, w, h } = PHONE;
    c.save();
    c.shadowColor = 'rgba(255,122,26,0.25)'; c.shadowBlur = 120;
    rr(c, x - 40, y - 40, w + 80, h + 80, 150); const g = c.createLinearGradient(x, y - 40, x, y + h + 40); g.addColorStop(0, '#3A3A3E'); g.addColorStop(0.5, '#1A1A1C'); g.addColorStop(1, '#2C2C30'); c.fillStyle = g; c.fill();
    c.shadowBlur = 0; rr(c, x - 28, y - 28, w + 56, h + 56, 140); c.fillStyle = '#050505'; c.fill();
    rr(c, x, y, w, h, 110); c.save(); c.clip();
    c.fillStyle = C.bg; c.fillRect(x, y, w, h);
    c.fillStyle = '#0B0B0B'; c.fillRect(x, y, w, 110); K.wordmark(c, x + 150, y + 56, 54); text(c, '9:41', x + w - 160, y + 56, F(700, 38), C.ink, 'right');
    // left: bubble map (re-laid into the phone)
    c.save(); c.translate(x + 120, y + 120); c.scale(1.45, 1.45);
    bubblePanel(c, { x: 0, y: 0, w: (w / 2 - 140) / 1.45, h: (h - 140) / 1.45, t: 36.0 }, t); c.restore();
    c.fillStyle = C.line; c.fillRect(x + w / 2, y + 130, 3, h - 160);
    // right: trending tokens
    c.save(); c.translate(x + w / 2 + 30, y + 120); c.scale(1.75, 1.75);
    const tw = { x: 0, y: -46, w: (w / 2 - 100) / 1.75, h: (h - 100) / 1.75 + 46, t: 36.0 };
    text(c, 'TRENDING TOKENS', 14, 4, F(800, 15), C.ink); trendTbl(c, tw, t);
    c.restore();
    const rg = c.createLinearGradient(x, y, x + w, y + h); rg.addColorStop(0, 'rgba(255,255,255,0.06)'); rg.addColorStop(0.4, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(255,255,255,0.03)'); c.fillStyle = rg; c.fillRect(x, y, w, h);
    c.restore();
    c.fillStyle = '#000'; c.beginPath(); c.arc(x + 70, y + h / 2, 18, 0, TAU); c.fill();
    c.fillStyle = '#2A2A2E'; c.fillRect(x + w * 0.3, y - 48, 220, 10); c.fillRect(x + w * 0.42, y - 48, 120, 10);
    c.restore();
  }

  // ---------- final: Birdeye logo end card ----------
  function noselling(c, t) {
    const k = A(t, 22.0, 0.35, io3); if (k <= 0) return;
    c.save(); c.globalAlpha = k;
    c.fillStyle = 'rgba(5,5,5,0.88)'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 800); g.addColorStop(0, rgba(C.orange, 0.22)); g.addColorStop(1, rgba(C.orange, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
    const lk = A(t, 22.0, 0.6, crit);
    c.translate(W / 2, H / 2 - 20); c.scale(lerp(1.4, 1, lk), lerp(1.4, 1, lk)); c.globalAlpha = k * clamp(lk * 2);
    K.wordmark(c, -285, 0, 130);
    c.globalAlpha = k * A(t, 22.5, 0.4);
    text(c, 'birdeye.so', 0, 140, F(600, 40), C.mute, 'center');
    c.restore();
  }

  // ---------- punchy captions (screen space), one per section, landing on the beat ----------
  const CAPS = [[4.0, 5.65, 'EVERYTHING ON-CHAIN.', 'ONE TERMINAL.'], [6.0, 7.65, 'TRENDING', 'PLAGUE +449%'], [8.0, 9.65, 'SMART MONEY', '+$8.58M · 7D'], [10.0, 11.65, 'BUBBLE MAP', 'THE WHOLE MARKET AT A GLANCE'],
    [12.0, 13.65, 'FIND GEMS', 'TOP VOLUME · TOP GAINERS'], [14.0, 15.65, 'WHALE TRADES', 'LIVE · > $10K'], [16.0, 21.8, 'EVERY CHAIN.', 'REAL TIME.']];
  function captions(c, t) {
    for (const [t0, t1, a, b] of CAPS) {
      if (t < t0 || t > t1) continue;
      const k = io5(prog(t, t0, t0 + 0.22)), out = io3(prog(t, t1 - 0.2, t1)), x = 96, y = 900;
      c.save(); c.globalAlpha = 1 - out;
      const g = c.createLinearGradient(0, 760, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0.9)'); c.fillStyle = g; c.fillRect(0, 760, W, H - 760);
      c.translate(x, y); c.scale(lerp(1.35, 1, k), lerp(1.35, 1, k));
      c.font = F(900, 104); c.textBaseline = 'alphabetic'; c.letterSpacing = '-3px';
      c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,60,60,0.6)'; c.fillText(a, -6 * (1 - k) - 2, 0); c.fillStyle = 'rgba(60,200,255,0.6)'; c.fillText(a, 6 * (1 - k) + 2, 0); c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#FFFFFF'; c.fillText(a, 0, 0); const aw = c.measureText(a).width;
      c.fillStyle = C.orange; c.fillRect(0, 22, aw * io3(prog(t, t0 + 0.1, t0 + 0.4)), 7);
      c.letterSpacing = '4px'; c.font = F(800, 34); c.globalAlpha = (1 - out) * prog(t, t0 + 0.15, t0 + 0.35); c.fillStyle = b.includes('+') ? C.green : C.orange; c.fillText(b, 4, 78);
      c.restore();
    }
    // chain sweep during EVERY CHAIN: orange highlight steps across the chain bar on 8th notes (world → screen)
    if (t > 16.0 && t < 21.8) {
      const i = Math.floor((t - 16.0) / 0.25) % 10, [x0, y0] = toScreen(i * 192, 56), [x1, y1] = toScreen((i + 1) * 192, 104);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(C.orange, 0.3); c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore();
    }
  }

  // ---------- the opening dot ----------
  function openingDot(c, t) {
    if (t > 1.6) return;
    const [sx, sy] = toScreen(DOT[0], DOT[1]);
    const appear = A(t, 0.05, 0.4, crit), breathe = 1 + 0.25 * Math.sin(t * 8), stretch = A(t, 0.5, 0.4, io5), fade = 1 - A(t, 0.9, 0.4);
    if (appear <= 0) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade;
    const r = 7 * appear * breathe;
    const g = c.createRadialGradient(sx, sy, 0, sx, sy, r * 16); g.addColorStop(0, rgba(C.orange, 0.8)); g.addColorStop(0.2, rgba(C.orange, 0.25)); g.addColorStop(1, rgba(C.orange, 0)); c.fillStyle = g; c.fillRect(sx - r * 16, sy - r * 16, r * 32, r * 32);
    c.fillStyle = '#FFFFFF';
    const lw = 1 + stretch * 900; c.beginPath(); c.roundRect(sx - r - lw / 2, sy - r, r * 2 + lw, r * 2, r); c.fill();
    c.restore();
  }

  function renderAt(t) {
    t = clamp(t, 0, DUR - 1e-6); CAM = camera(t);
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const spaceVis = clamp((Math.log(0.6) - CAM.lz) / 1.6);          // stars appear as we pull far out
    space(c, t, spaceVis);
    // world
    c.save(); c.translate(W / 2, H / 2); c.scale(CAM.z, CAM.z); c.translate(-CAM.x, -CAM.y);
    if (t < 0.9) { /* only the dot */ } else if (1920 * CAM.z > 8) desktop(c, t);
    
    c.restore();
    captions(c, t);
    openingDot(c, t);
    noselling(c, t);
    // vignette
    const v = c.createRadialGradient(W / 2, H / 2, 520, W / 2, H / 2, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
  }

  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(F(700, 40)), document.fonts.load(M(600, 20))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
