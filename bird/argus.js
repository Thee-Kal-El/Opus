// ARGUS (argus.world) — 28s terminal film, 1920x1080 @ 60fps, cut to 120 BPM.
// A dot becomes the Argus home terminal: King of the Hill → Contenders → Top by Market Cap → New. Beat-cut whip
// zooms with captions, then a search: type "NOSELLING", click the contract, land on the $NOSELLING page and
// zoom the Chart, the Buy/Sell panel and Trades, ending on the Argus logo.
// World coordinates = the reference screenshots' pixel coordinates (home at y=0, token page at y=2000),
// all vector-drawn under one camera so text stays crisp at any zoom. renderAt(t) is deterministic.
(() => {
  'use strict';
  const K = window.KIT, { F, M, TAU, clamp, lerp, prog, io3, io5, crit, A, rgba, rr, text } = K;
  const W = 1920, H = 1080, FPS = 60, DUR = 28, TP = 2000; // TP: y offset of the token page in the world
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const C = { bg: '#07060B', panel: '#0D0B13', panel2: '#14111C', line: '#221E2E', line2: '#2E2840', ink: '#EEEAF7', mute: '#8E89A0', dim: '#5E5A6E',
    purple: '#8B5CF6', violet: '#A98BFF', yellow: '#F5C542', green: '#16A34A', green2: '#22C55E', red: '#EF4444', blue: '#2F7BFF' };
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const ASSETS = ['card_argus', 'card_as', 'card_dividend', 'card_cat', 'new1', 'new2', 'new3', 'new4', 'new5', 'frlt', 'c1', 'c2', 'c3', 'c4', 'c5', 'coin'];

  // ---------- camera ----------
  // wide, readable framing: full shots show the whole page, zooms show a whole panel with room around it
  const L = Math.log, FULL = L(1.06), HOME = [955, 470], TOK = [950, TP + 570], TFULL = L(0.93);
  const KEYS = [
    [0.0, 748, 245, L(3.2)], [0.9, 748, 245, L(3.2)], [1.6, 748, 245, L(1.75)], [2.0, 748, 260, L(1.7)],
    [2.6, ...HOME, FULL], [5.65, ...HOME, L(1.09)],
    [6.0, 748, 250, L(1.75)], [7.65, 748, 250, L(1.8)],                 // KING OF THE HILL
    [8.0, 1358, 250, L(2.05)], [9.65, 1358, 250, L(2.12)],              // CONTENDERS
    [10.0, 955, 545, L(1.38)], [11.65, 955, 545, L(1.42)],              // TOP BY MARKET CAP
    [12.0, 955, 790, L(1.4)], [13.65, 955, 790, L(1.44)],               // NEW
    [14.0, ...HOME, FULL], [14.4, 955, 400, L(1.4)], [16.75, 955, 400, L(1.46)],   // search + typing + click
    [16.99, 955, 400, L(1.47)], [17.0, ...TOK, L(1.0)], [18.15, ...TOK, TFULL],    // cut to the token page
    [18.5, 775, TP + 495, L(1.62)], [20.15, 775, TP + 495, L(1.68)],    // CHART
    [20.5, 1391, TP + 392, L(1.55)], [22.15, 1391, TP + 392, L(1.6)],   // BUY / SELL
    [22.5, 775, TP + 960, L(1.6)], [24.15, 775, TP + 960, L(1.66)],     // TRADES
    [24.5, ...TOK, TFULL], [28.0, ...TOK, L(0.97)],
  ];

  let CAM;
  function camera(t) {
    let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], seg = b[0] - a[0], k = seg < 0.8 ? io5(prog(t, a[0], b[0])) : io3(prog(t, a[0], b[0]));
    const lz = lerp(a[3], b[3], k); return { x: lerp(a[1], b[1], k), y: lerp(a[2], b[2], k), z: Math.exp(lz) };
  }
  const toScreen = (x, y) => [(x - CAM.x) * CAM.z + W / 2, (y - CAM.y) * CAM.z + H / 2];

  // ---------- small vector bits ----------
  function argusLogo(c, x, y, r) {
    c.save(); c.translate(x, y);
    c.strokeStyle = '#FFFFFF'; c.lineWidth = r * 0.12; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15); c.lineTo(Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35); c.lineWidth = r * 0.07; c.stroke(); }
    c.beginPath(); c.moveTo(-r * 0.72, 0); c.quadraticCurveTo(0, -r * 0.62, r * 0.72, 0); c.quadraticCurveTo(0, r * 0.62, -r * 0.72, 0); c.fillStyle = '#FFFFFF'; c.fill();
    c.beginPath(); c.arc(0, 0, r * 0.3, 0, TAU); c.fillStyle = C.purple; c.fill(); c.beginPath(); c.arc(0, 0, r * 0.13, 0, TAU); c.fillStyle = '#0B0814'; c.fill();
    c.restore();
  }
  function img(c, k, x, y, w, h, r = 0) { const im = IMG[k]; if (!im) return; c.save(); if (r) { rr(c, x, y, w, h, r); c.clip(); } c.drawImage(im, x, y, w, h); c.restore(); }
  function roundIcon(c, k, x, y, r) { const im = IMG[k]; if (!im) return; c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); c.drawImage(im, x - r, y - r, r * 2, r * 2); c.restore(); }
  function subPrice(c, pre, sub, post, x, y, size, col, align = 'left') { // $0.0₄257 style
    c.font = F(600, size); const w1 = c.measureText(pre).width, w3 = c.measureText(post).width; c.font = F(600, size * 0.62); const w2 = c.measureText(sub).width;
    let px = align === 'right' ? x - (w1 + w2 + w3) : x;
    text(c, pre, px, y, F(600, size), col); px += w1; text(c, sub, px, y + size * 0.28, F(600, size * 0.62), col); px += w2; text(c, post, px, y, F(600, size), col);
  }
  const pop = (t, t0) => K.pop(prog(t, t0, t0 + 0.45));
  function panelBox(c, x, y, w, h, k, active) {
    c.save(); c.globalAlpha *= clamp(k * 2); rr(c, x, y, w, h, 12); c.fillStyle = C.panel; c.fill();
    c.strokeStyle = active ? rgba(C.purple, 0.9) : C.line2; c.lineWidth = active ? 2 : 1.2; c.stroke(); c.restore();
  }
  // a window grows out of the opening dot (purple outline first)
  function grow(c, x, y, w, h, t0, t, drawFn, active) {
    const k = A(t, t0, 0.8, crit); if (k <= 0) return;
    const ox = 748, oy = 245, gx = lerp(ox, x, k), gy = lerp(oy, y, k), gw = w * k, gh = h * k;
    if (k < 1) { c.save(); c.strokeStyle = C.purple; c.lineWidth = 2.4 / CAM.z; c.shadowColor = C.purple; c.shadowBlur = 20; c.strokeRect(gx, gy, gw, gh); c.restore(); }
    const ca = clamp((k - 0.5) / 0.5); if (ca <= 0) return;
    c.save(); c.globalAlpha *= ca; drawFn(c, k >= 0.999, active); c.restore();
  }

  function glowFrame(c, x, y, w, h, t, t0, t1) {
    const k = A(t, t0, 0.3) * (1 - A(t, t1 - 0.2, 0.2)); if (k <= 0) return;
    c.save(); c.globalAlpha *= k; rr(c, x, y, w, h, 14);
    c.shadowColor = C.purple; c.shadowBlur = 24; c.strokeStyle = rgba(C.purple, 0.9); c.lineWidth = 2; c.stroke();
    c.shadowBlur = 0; c.strokeStyle = rgba(C.violet, 0.5); c.lineWidth = 1; c.stroke(); c.restore();
  }
  // ---------- HOME ----------
  function nav(c, y0, t, k) {
    if (k <= 0) return;
    c.save(); c.globalAlpha *= k;
    c.fillStyle = C.bg; c.fillRect(0, y0, 1918, 65); c.fillStyle = C.line; c.fillRect(0, y0 + 65, 1918, 1);
    argusLogo(c, 376, y0 + 33, 12); text(c, 'Argus', 402, y0 + 33, F(600, 24), C.ink);
    rr(c, 597, y0 + 16, 446, 34, 9); c.fillStyle = '#0F0D15'; c.fill(); c.strokeStyle = C.line2; c.lineWidth = 1.2; c.stroke();
    c.strokeStyle = C.mute; c.lineWidth = 1.6; c.beginPath(); c.arc(616, y0 + 32, 6, 0, TAU); c.moveTo(620, y0 + 37); c.lineTo(625, y0 + 42); c.stroke();
    text(c, 'Search tokens', 637, y0 + 33, F(400, 15), C.mute); rr(c, 985, y0 + 24, 46, 18, 4); c.strokeStyle = C.line2; c.stroke(); text(c, 'Ctrl K', 1008, y0 + 33, F(500, 11), C.mute, 'center');
    c.fillStyle = C.yellow; c.beginPath(); c.arc(1182, y0 + 33, 2.5, 0, TAU); c.fill(); text(c, '$ARGUS', 1190, y0 + 33, F(700, 13), C.yellow);
    rr(c, 1269, y0 + 17, 85, 32, 8); c.fillStyle = C.purple; c.fill(); text(c, '+  Create', 1311, y0 + 33, F(700, 15), '#FFFFFF', 'center');
    rr(c, 1364, y0 + 17, 142, 32, 8); c.strokeStyle = C.line2; c.lineWidth = 1.2; c.stroke(); text(c, '▭  Connect wallet', 1435, y0 + 33, F(700, 14), C.ink, 'center');
    text(c, '⚙', 1535, y0 + 33, F(500, 16), C.mute, 'center');
    c.restore();
  }
  const KOTH = { x: 356, y: 91, w: 785, h: 308 };
  function koth(c, full, active, t) {
    const { x, y, w, h } = KOTH; panelBox(c, x, y, w, h, 1, active);
    if (!full) return;
    text(c, '♔  King of the Hill', 376, 122, F(600, 14), C.yellow); text(c, 'Most recent to $30K', 1121, 121, F(400, 12), C.mute, 'right');
    roundIcon(c, 'frlt', 400, 173, 24); text(c, '$FRLT', 436, 162, F(800, 32), C.ink); text(c, 'Farelight Research', 436, 193, F(400, 12), C.mute);
    text(c, '$26K', 1121, 162, F(800, 34), C.ink, 'right'); text(c, '-2.9% 24h', 1121, 192, F(500, 12), C.violet, 'right'); text(c, 'Peak $28K', 1121, 213, F(400, 12), C.mute, 'right');
    // line chart (as on the site), draws on
    const pts = [[376, 240], [460, 242], [530, 246], [650, 248], [720, 258], [800, 270], [845, 297], [930, 299], [1121, 302]], dk = A(t, 1.3, 0.8, io3);
    c.save(); c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.lineTo(1121, 305); c.lineTo(376, 305); c.closePath();
    const g = c.createLinearGradient(0, 240, 0, 305); g.addColorStop(0, rgba(C.purple, 0.22)); g.addColorStop(1, rgba(C.purple, 0)); c.fillStyle = g; c.beginPath(); c.rect(376, 230, 745 * dk, 80); c.clip();
    c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.lineTo(1121, 305); c.lineTo(376, 305); c.closePath(); c.fill();
    c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.strokeStyle = C.violet; c.lineWidth = 1.8; c.stroke(); c.restore();
    c.fillStyle = C.line; c.fillRect(376, 252, 745, 1); c.fillRect(376, 290, 745, 1); c.fillRect(376, 320, 745, 1);
    [['Price', 376], ['24h volume', 628], ['Holders', 880]].forEach(([s, sx]) => text(c, s, sx, 344, F(400, 13), C.mute));
    subPrice(c, '$0.0', '4', '257', 376, 369, 15, C.ink); text(c, '$418', 628, 369, F(600, 15), C.ink); text(c, '1.03K', 880, 369, F(600, 15), C.ink);
  }
  const CONT = [['ZEUS', '$9.85K', '-21%'], ['TERRA', '$9.2K', '+6.5%'], ['MOMUS', '$8.09K', '0%'], ['ARCDD', '$7.98K', '+10%'], ['ASTRA6', '$7.06K', '+4.8%']];
  function contenders(c, full, active, t) {
    const x = 1154, y = 91, w = 409, h = 308; panelBox(c, x, y, w, h, 1, active);
    if (!full) return;
    text(c, 'Contenders', 1166, 109, F(700, 14), C.ink); text(c, 'Closest to $30K', 1551, 109, F(400, 12), C.mute, 'right');
    CONT.forEach(([n, mc, ch], i) => {
      const ry = 153 + i * 55, k = A(t, 2.3 + i * 0.06, 0.3); if (k <= 0) return;
      c.save(); c.globalAlpha *= k; c.translate((1 - k) * 20, 0);
      text(c, String(i + 1), 1170, ry, F(500, 12), C.mute, 'center'); roundIcon(c, `c${i + 1}`, 1202, ry, 14);
      text(c, n, 1226, ry, F(700, 14), C.ink); text(c, mc, 1492, ry - 8, F(700, 14), C.ink, 'right'); text(c, 'mcap', 1527, ry - 7, F(400, 12), C.mute, 'right');
      text(c, `${ch} 24h`, 1527, ry + 10, F(500, 12), C.violet, 'right'); text(c, '↗', 1545, ry, F(500, 13), C.mute, 'center');
      if (i < 4) { c.fillStyle = C.line; c.fillRect(1166, ry + 27, 385, 1); }
      c.restore();
    });
  }
  const CARDS = [['card_argus', '$ARGUS', 'Argus', '$14M', '+0.6%', '$593K liq'], ['card_as', '$ASTOCK', 'ArcStocks', '$940K', '+19%', '$96K liq'], ['card_dividend', '$DIVIDEND', 'Bitcoin Dividend', '$847K', '>-0.1%', '$92K liq'], ['card_cat', '$USDC', 'UpSideDownCat', '$629K', '-15%', '$82K liq']];
  function topCards(c, t, active) {
    if (t < 2.5) return;
    text(c, 'TOP BY MARKET CAP', 355, 421, F(600, 12), C.mute); c.letterSpacing = '0px';
    CARDS.forEach(([im, tk, nm, mc, ch, liq], i) => {
      const x = 356 + i * 303, y = 440, k = pop(t, 2.5 + i * 0.08); if (k <= 0) return;
      c.save(); c.translate(x + 145, y + 104); c.scale(k, k); c.translate(-(x + 145), -(y + 104));
      rr(c, x, y, 290, 207, 10); c.fillStyle = C.panel; c.fill(); c.strokeStyle = active ? rgba(C.purple, 0.8) : '#4A3D33'; c.lineWidth = 1.4; c.stroke();
      c.save(); rr(c, x, y, 290, 207, 10); c.clip(); img(c, im, x, y, 290, 111); c.restore();
      c.font = F(800, 15); text(c, tk, x + 12, y + 134, F(800, 15), C.ink); text(c, nm, x + 18 + c.measureText(tk).width, y + 134, F(400, 12), C.mute);
      text(c, mc, x + 12, y + 161, F(800, 22), C.ink); text(c, ch, x + 12, y + 187, F(500, 12), C.violet); text(c, liq, x + 278, y + 187, F(400, 12), C.mute, 'right');
      c.restore();
    });
  }
  function newSection(c, t, active) {
    if (t < 3.0) return;
    const k = A(t, 3.0, 0.4); c.save(); c.globalAlpha *= k;
    c.fillStyle = C.line; c.fillRect(355, 672, 1200, 1);
    text(c, 'ϟ  Trending', 372, 719, F(500, 15), C.mute); text(c, '❦  New', 481, 719, F(700, 15), C.ink); text(c, '♙  Graduated', 562, 719, F(500, 15), C.mute);
    c.fillStyle = active ? C.violet : C.ink; c.fillRect(468, 733, 75, 2); c.fillStyle = C.line; c.fillRect(355, 753, 1200, 1);
    rr(c, 1292, 702, 190, 34, 8); c.strokeStyle = C.line2; c.lineWidth = 1.2; c.stroke(); text(c, 'Last trade', 1302, 719, F(500, 15), C.ink); text(c, '⌄', 1466, 715, F(500, 15), C.ink, 'center');
    rr(c, 1491, 702, 64, 34, 8); c.stroke(); text(c, '▦  ☰', 1523, 719, F(500, 14), C.ink, 'center');
    text(c, 'Paired with', 355, 784, F(400, 15), C.mute);
    [['All pairs', 445, 80, true], ['Circle assets', 533, 111], ['FX', 652, 45], ['Crypto', 705, 71], ['Stocks  Soon', 784, 138]].forEach(([s, x, w, on]) => { rr(c, x, 767, w, 34, 8); c.fillStyle = on ? rgba(C.purple, 0.22) : 'transparent'; c.fill(); c.strokeStyle = on ? rgba(C.purple, 0.6) : C.line2; c.stroke(); text(c, s, x + w / 2, 784, F(on ? 700 : 500, 15), C.ink, 'center'); });
    c.restore();
    for (let i = 0; i < 5; i++) {
      const x = 356 + i * 243.3, y = 830, kk = pop(t, 3.15 + i * 0.07); if (kk <= 0) continue;
      c.save(); c.translate(x + 113, y + 80); c.scale(kk, kk); c.translate(-(x + 113), -(y + 80));
      c.save(); rr(c, x, y, 226, 200, 10); c.clip(); img(c, `new${i + 1}`, x, y, 226, 122);
      const g = c.createLinearGradient(0, y + 90, 0, y + 200); g.addColorStop(0, 'rgba(7,6,11,0)'); g.addColorStop(1, 'rgba(7,6,11,1)'); c.fillStyle = g; c.fillRect(x, y + 90, 226, 110); c.restore();
      rr(c, x, y, 226, 200, 10); c.strokeStyle = active ? rgba(C.purple, 0.7) : '#4A3D33'; c.lineWidth = 1.2; c.stroke();
      c.restore();
    }
  }
  // search modal (after the screenshot): typing NOSELLING, 1 match, the contract gets clicked
  const QUERY = 'NOSELLING', TYPE0 = 14.5, STEP = 0.125;
  function searchModal(c, t) {
    const k = A(t, 14.15, 0.3, crit); if (k <= 0) return;
    c.save(); c.globalAlpha *= clamp(k * 2);
    c.fillStyle = 'rgba(4,3,8,0.72)'; c.fillRect(-3000, -3000, 8000, 8000);
    const x = 637, y = 100, w = 638, h = 607;
    c.translate(x + w / 2, y + 40); c.scale(lerp(0.96, 1, k), lerp(0.96, 1, k)); c.translate(-(x + w / 2), -(y + 40));
    rr(c, x, y, w, h, 14); c.fillStyle = '#0E0C16'; c.fill(); c.strokeStyle = C.line2; c.lineWidth = 1.2; c.stroke();
    c.strokeStyle = C.ink; c.lineWidth = 1.8; c.beginPath(); c.arc(666, 136, 7, 0, TAU); c.moveTo(671, 141); c.lineTo(677, 147); c.stroke();
    const n = clamp(Math.floor((t - TYPE0) / STEP) + 1, 0, QUERY.length), typed = t >= TYPE0 ? QUERY.slice(0, n) : '';
    if (typed) text(c, typed, 689, 137, F(700, 17), C.ink); else text(c, 'Search tokens', 689, 137, F(400, 17), C.mute);
    if (Math.floor(t * 4) % 2 === 0 && t < 16.0) { c.font = F(700, 17); c.fillStyle = C.violet; c.fillRect(691 + c.measureText(typed).width, 126, 2, 22); }
    text(c, 'Clear', 1178, 136, F(500, 13), C.ink, 'center'); text(c, '✕', 1235, 136, F(500, 14), C.ink, 'center');
    c.fillStyle = C.line; c.fillRect(637, 173, 638, 1);
    rr(c, 654, 187, 80, 30, 7); c.fillStyle = '#231E33'; c.fill();
    [['All tokens', 694, true], ['Live', 764], ['Graduating', 837], ['♙ Graduated', 935]].forEach(([s, sx, on]) => text(c, s, sx, 202, F(on ? 700 : 500, 13), on ? C.ink : C.mute, 'center'));
    const done = t >= TYPE0 + STEP * QUERY.length + 0.05;
    if (done) {
      const rk = A(t, TYPE0 + STEP * QUERY.length + 0.05, 0.35);
      c.save(); c.globalAlpha *= rk; c.translate(0, (1 - rk) * 14);
      text(c, '1 match', 657, 241, F(500, 12), C.mute);
      const hover = t > 16.1, press = t > 16.5 && t < 16.7;
      rr(c, 650, 260, 612, 64, 9); c.fillStyle = hover ? '#2A2242' : '#1D1830'; c.fill(); if (hover) { c.strokeStyle = rgba(C.purple, 0.7); c.lineWidth = 1.5; c.stroke(); }
      roundIcon(c, 'coin', 680, 292, 19);
      text(c, 'DO NOT SELL!!!', 713, 282, F(700, 14), C.ink); text(c, '$NOSELLING', 826, 283, F(500, 12), C.mute);
      text(c, 'Contract 0x30bf...b8C3', 713, 304, F(400, 12), press ? C.violet : C.mute);
      if (t > 16.1) { c.fillStyle = C.violet; c.fillRect(770, 312, 78 * A(t, 16.1, 0.3), 1.3); }
      text(c, '$2.52K MC', 1250, 281, F(600, 12), C.ink, 'right'); text(c, 'Live', 1250, 302, F(500, 12), C.ink, 'right');
      c.restore();
    }
    c.fillStyle = C.line; c.fillRect(637, 643, 638, 1);
    text(c, '↑ ↓ Navigate    ↵ Open    Esc to close', 654, 675, F(500, 12), C.mute); text(c, 'View all matches  →', 1246, 676, F(700, 14), C.ink, 'right');
    c.restore();
  }
  function home(c, t) {
    c.fillStyle = C.bg; c.fillRect(-3000, -1000, 8000, 3200);
    nav(c, 0, t, A(t, 3.5, 0.5));
    grow(c, KOTH.x, KOTH.y, KOTH.w, KOTH.h, 0.9, t, (c2, full, act) => koth(c2, full, act, t), t > 5.9 && t < 7.8);
    grow(c, 1154, 91, 409, 308, 2.0, t, (c2, full, act) => contenders(c2, full, act, t), t > 7.9 && t < 9.8);
    topCards(c, t, t > 9.9 && t < 11.8);
    newSection(c, t, t > 11.9 && t < 13.8);
    glowFrame(c, 343, 404, 1225, 256, t, 10.0, 11.75);      // TOP BY MARKET CAP
    glowFrame(c, 343, 692, 1225, 345, t, 12.0, 13.75);      // NEW
    searchModal(c, t);
  }

  // ---------- TOKEN PAGE ($NOSELLING) ----------
  const TRADES = [['9d ago', 'Buy', '0.17', '65K', '254', '@vividseal534b'], ['12d ago', 'Sell', '2.54', '1.02M', '249', '@quickberyl5d8e'], ['12d ago', 'Sell', '0.08', '34K', '25', '@quickberyl5d8e'], ['12d ago', 'Buy', '2.67', '1.05M', '255', '@quickberyl5d8e'], ['14d ago', 'Sell', '0.56', '226K', '249', '@primeelk11ff'], ['15d ago', 'Buy', '19', '7.53M', '252', '@goldmotha75e']];
  function chartPanel(c, t, act) {
    const y0 = TP;
    rr(c, 351, y0 + 250, 848, 495, 10); c.fillStyle = '#0B0A10'; c.fill(); c.strokeStyle = act ? rgba(C.purple, 0.8) : C.line; c.lineWidth = act ? 2 : 1; c.stroke();
    let tx = 359; ['1s', '1m', '5m', '15m', '1h', '4h', 'D'].forEach((s) => { text(c, s, tx, y0 + 269, F(500, 14), s === '5m' ? C.violet : C.mute); c.font = F(500, 14); tx += c.measureText(s).width + 14; });
    text(c, 'Price / ', 739, y0 + 269, F(500, 14), C.mute); text(c, 'MCAP', 785, y0 + 269, F(700, 14), C.violet); text(c, 'USD / USDC', 855, y0 + 269, F(500, 14), C.violet); text(c, '👤 Dev Buys', 967, y0 + 269, F(500, 14), C.violet);
    c.fillStyle = C.line; c.fillRect(351, y0 + 288, 848, 1);
    text(c, 'NOSELLING/USD (Market Cap) · 5 · Argus | GeckoTerminal.com', 416, y0 + 308, F(500, 16), C.ink); c.fillStyle = '#1FAA7A'; c.beginPath(); c.arc(897, y0 + 308, 5, 0, TAU); c.fill();
    text(c, 'O2,497.12  H2,542.71  L2,497.12  C2,542.71  45.58 (+1.83%)', 416, y0 + 329, F(500, 12), '#2BBE8C'); text(c, 'Volume SMA  0', 416, y0 + 351, F(500, 13), C.ink);
    // grid + y axis 2,490 … 2,550
    for (let k = 0; k <= 6; k++) { const yy = y0 + 300 + k * 53.3; c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(407, yy, 726, 1); text(c, (2550 - k * 10).toLocaleString(), 1143, yy, F(500, 12), C.mute); }
    // the candles at the right edge: a red drop, then the green spike that prints live
    const sk = A(t, 17.6, 0.9, io3);
    c.fillStyle = C.red; c.fillRect(1057, y0 + 437, 5, 170); c.fillRect(1052, y0 + 550, 4, 85);
    c.fillStyle = '#16C79A'; c.fillRect(1067, y0 + 340 + 240 * (1 - sk), 6, 240 * sk); c.fillRect(1064, y0 + 607, 4, 30);
    c.setLineDash([3, 3]); c.strokeStyle = 'rgba(22,199,154,0.7)'; c.beginPath(); c.moveTo(407, y0 + 340); c.lineTo(1135, y0 + 340); c.stroke(); c.setLineDash([]);
    rr(c, 1135, y0 + 332, 60, 16, 2); c.fillStyle = '#16C79A'; c.fill(); text(c, '2,542.71', 1165, y0 + 340, F(700, 11), '#04130D', 'center');
    text(c, '20', 1054, y0 + 650, F(500, 12), C.mute, 'center');
    let rx = 421; ['5y', '1y', '6m', '3m', '1m', '5d', '1d'].forEach((s) => { text(c, s, rx, y0 + 685, F(500, 14), C.violet); c.font = F(500, 14); rx += c.measureText(s).width + 14; });
    text(c, '18:25:02 (UTC-7)', 1082, y0 + 685, F(500, 13), C.mute, 'right'); text(c, '%   log   auto', 1103, y0 + 685, F(500, 13), C.violet);
    text(c, 'Powered by GeckoTerminal ↗', 775, y0 + 725, M(500, 14), C.ink, 'center');
    // drawing tool rail
    for (let k = 0; k < 10; k++) { c.strokeStyle = C.mute; c.lineWidth = 1.4; c.strokeRect(370, y0 + 310 + k * 36, 14, 14); }
  }
  function tradePanel(c, t, act) {
    const y0 = TP, x = 1232, w = 318;
    rr(c, x, y0 + 97, w, 589, 12); c.fillStyle = C.panel; c.fill(); c.strokeStyle = act ? rgba(C.purple, 0.8) : C.line2; c.lineWidth = act ? 2 : 1.2; c.stroke();
    const press = 1 - 0.05 * Math.exp(-Math.max(0, ((t - 20.5) % 0.5)) * 14) * (t > 20.5 && t < 22.2 ? 1 : 0);
    c.save(); c.translate(1313, y0 + 123); c.scale(press, press); rr(c, -76, -22, 153, 44, 6); c.fillStyle = C.green; c.fill(); c.strokeStyle = '#2FD06A'; c.stroke(); text(c, '↗  Buy', 0, 0, F(700, 16), '#FFFFFF', 'center'); c.restore();
    text(c, '↘  Sell', 1470, y0 + 123, F(600, 16), C.ink, 'center');
    text(c, 'Amount', 1248, y0 + 180, F(700, 14), C.ink);
    [['25%', 1396], ['50%', 1453], ['Max', 1509]].forEach(([s, sx]) => { rr(c, sx - 25, y0 + 167, 50, 26, 6); c.strokeStyle = C.line2; c.stroke(); text(c, s, sx, y0 + 180, F(600, 13), C.mute, 'center'); });
    rr(c, 1248, y0 + 201, 285, 56, 8); c.strokeStyle = C.line2; c.stroke();
    // the amount types itself in while we look at the panel
    const amt = t > 20.8 ? ['1', '10', '100'][Math.min(2, Math.floor((t - 20.8) / 0.25))] : '0';
    text(c, amt, 1262, y0 + 230, F(500, 30), amt === '0' ? C.mute : C.ink); c.fillStyle = C.blue; c.beginPath(); c.arc(1470, y0 + 229, 8, 0, TAU); c.fill(); text(c, 'USDC', 1488, y0 + 229, F(500, 13), C.mute);
    text(c, 'You receive', 1248, y0 + 277, F(400, 12), C.mute); text(c, amt === '0' ? 'No quote' : '~39.3M NOSELLING', 1534, y0 + 277, F(600, 12), C.ink, 'right');
    text(c, 'Price impact', 1248, y0 + 299, F(400, 12), C.mute); text(c, amt === '0' ? 'No quote' : '—', 1534, y0 + 299, F(600, 12), C.ink, 'right');
    rr(c, 1248, y0 + 320, 285, 34, 7); c.fillStyle = '#100E17'; c.fill(); c.strokeStyle = C.line2; c.stroke(); text(c, '▭  Connect wallet', 1391, y0 + 337, F(700, 14), C.ink, 'center');
    text(c, 'Connect wallet to trade.', 1391, y0 + 371, F(400, 12), C.mute, 'center');
    text(c, 'Milestone  ⓘ', 1248, y0 + 406, F(500, 14), C.mute); text(c, '0.1%', 1248, y0 + 436, F(700, 12), C.ink); text(c, 'Target Mcap. $45K', 1534, y0 + 436, F(400, 12), C.mute, 'right');
    rr(c, 1248, y0 + 451, 285, 5, 3); c.fillStyle = '#1D1A27'; c.fill(); c.fillStyle = C.purple; c.fillRect(1248, y0 + 451, 3, 5);
    text(c, 'Where the tax goes', 1248, y0 + 478, F(500, 14), C.mute);
    rr(c, 1248, y0 + 496, 285, 7, 3); c.fillStyle = C.yellow; c.fill(); c.save(); rr(c, 1248, y0 + 496, 142, 7, 3); c.fillStyle = C.purple; c.fill(); c.restore();
    [['Creator funds', C.purple, 523], ['Dividends', C.yellow, 545]].forEach(([s, col, yy]) => { c.fillStyle = col; c.beginPath(); c.arc(1252, y0 + yy, 3.5, 0, TAU); c.fill(); text(c, s, 1264, y0 + yy, F(400, 12), C.mute); text(c, '50%', 1534, y0 + yy, F(700, 12), C.ink, 'right'); });
    text(c, 'Creator fees  ⓘ', 1248, y0 + 583, F(700, 14), C.ink); text(c, '$0', 1506, y0 + 583, F(800, 20), C.ink, 'right'); c.fillStyle = C.blue; c.beginPath(); c.arc(1524, y0 + 583, 8, 0, TAU); c.fill();
    roundIcon(c, 'coin', 1256, y0 + 617, 7); text(c, '@NOSELLINGARC', 1270, y0 + 617, F(500, 12), C.mute);
    rr(c, 1248, y0 + 639, 285, 30, 7); c.strokeStyle = C.line2; c.stroke(); text(c, '▭  Connect a wallet to claim', 1391, y0 + 654, F(600, 14), C.mute, 'center');
  }
  function tradesTable(c, t, act) {
    const y0 = TP + 772;
    [['Trades', 367, true], ['Holders', 443], ['Buybacks', 525], ['About', 621], ['Account', 691]].forEach(([s, sx, on]) => text(c, s, sx, y0 + 40, F(on ? 700 : 500, 15), on ? C.ink : C.mute));
    c.fillStyle = C.ink; c.fillRect(355, y0 + 53, 70, 2); c.fillStyle = C.line; c.fillRect(351, y0 + 56, 848, 1);
    rr(c, 351, y0 + 77, 848, 290, 10); c.fillStyle = '#0B0A10'; c.fill(); c.strokeStyle = act ? rgba(C.purple, 0.8) : C.line; c.lineWidth = act ? 2 : 1; c.stroke();
    const hy = y0 + 97; [['TIME', 368, 'left'], ['TYPE', 480, 'left'], ['NOSELLING', 778, 'right'], ['PRICE', 913, 'right'], ['TRADER', 1185, 'right']].forEach(([s, sx, al]) => text(c, s, sx, hy, F(700, 11), C.ink, al));
    c.fillStyle = C.blue; c.beginPath(); c.arc(619, hy, 6, 0, TAU); c.fill(); c.fillStyle = C.line; c.fillRect(351, hy + 20, 848, 1);
    TRADES.forEach(([tm, ty, usd, amt, pr, tr], i) => {
      const ry = hy + 38 + i * 37, k = A(t, 22.5 + i * 0.08, 0.3); c.save(); if (t > 22.5 && k < 1) { c.fillStyle = rgba(C.purple, 0.18 * (1 - k)); c.fillRect(352, ry - 18, 846, 36); }
      const buy = ty === 'Buy'; text(c, tm, 368, ry, F(400, 13), C.mute); text(c, ty, 480, ry, F(600, 13), buy ? '#22C55E' : C.red);
      c.fillStyle = rgba(buy ? '#22C55E' : C.red, 0.12); c.fillRect(355, ry - 17, Math.min(270, parseFloat(usd) * 14 + 6), 34);
      text(c, usd, 626, ry, F(600, 14), C.ink, 'right'); text(c, amt, 778, ry, F(600, 14), C.ink, 'right');
      subPrice(c, '$0.0', '5', pr, 913, ry, 14, C.ink, 'right');
      c.fillStyle = `hsl(${(i * 67) % 360},60%,55%)`; c.beginPath(); c.arc(1060 - tr.length * 2, ry, 6, 0, TAU); c.fill();
      text(c, tr + '  ↗', 1185, ry, F(400, 13), C.ink, 'right');
      c.fillStyle = C.line; c.fillRect(351, ry + 18, 848, 1); c.restore();
    });
    text(c, 'Showing 1–6 of 6', 372, hy + 38 + 6 * 37 + 2, F(400, 12), C.mute);
  }
  function tokenPage(c, t) {
    c.fillStyle = C.bg; c.fillRect(-3000, TP - 1000, 8000, 3200);
    nav(c, TP, t, 1);
    roundIcon(c, 'coin', 370, TP + 113, 20);
    text(c, '$NOSELLING', 403, TP + 112, F(800, 32), C.ink); text(c, 'DO NOT SELL!!!   𝕏', 403, TP + 150, F(400, 14), C.ink);
    text(c, '$2.52K', 1157, TP + 112, F(800, 32), C.ink, 'right'); text(c, 'mcap', 1199, TP + 118, F(400, 14), C.mute, 'right');
    text(c, '+0% 24h', 1125, TP + 149, F(500, 14), C.violet, 'right'); c.fillStyle = C.blue; c.beginPath(); c.arc(1145, TP + 149, 7, 0, TAU); c.fill(); text(c, 'USDC', 1199, TP + 149, F(500, 14), C.ink, 'right');
    c.fillStyle = C.line; c.fillRect(351, TP + 180, 848, 1); c.fillRect(351, TP + 236, 848, 1);
    const info = [['Contract', '0x30bf...b8C3', 351], ['Creator', '@swiftgrovecf28', 577], ['Launched', '15 days ago', 832], ['Buy tax', '3%', 987], ['Pool fee', '1%', 1081]];
    info.forEach(([a, b, x]) => { text(c, a, x, TP + 204, F(400, 12), C.mute); c.font = F(400, 12); text(c, b, x + c.measureText(a).width + 8, TP + 204, F(600, 12), C.ink); });
    chartPanel(c, t, t > 18.4 && t < 20.3); tradePanel(c, t, t > 20.4 && t < 22.3); tradesTable(c, t, t > 22.4 && t < 24.3);
  }

  // ---------- captions, cursor, intro dot, end card ----------
  const CAPS = [[4.0, 5.65, 'EVERY LAUNCH.', 'ONE TERMINAL.'], [6.0, 7.65, 'KING OF THE HILL', '$FRLT · $26K'], [8.0, 9.65, 'CONTENDERS', 'CLOSEST TO $30K'], [10.0, 11.65, 'TOP BY MARKET CAP', '$ARGUS · $14M'],
    [12.0, 13.65, 'NEW', 'FRESH LAUNCHES'], [17.0, 18.35, '$NOSELLING', 'DO NOT SELL!!!'], [18.5, 20.15, 'CHART', 'LIVE · GECKOTERMINAL'], [20.5, 22.15, 'BUY / SELL', 'ONE TAP'], [22.5, 24.15, 'TRADES', 'EVERY BUY. EVERY SELL.']];
  function captions(c, t) {
    for (const [t0, t1, a, b] of CAPS) {
      if (t < t0 || t > t1) continue;
      const k = io5(prog(t, t0, t0 + 0.22)), out = io3(prog(t, t1 - 0.2, t1));
      c.save(); c.globalAlpha = 1 - out;
      const g = c.createLinearGradient(0, 930, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.6, 'rgba(0,0,0,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0.92)'); c.fillStyle = g; c.fillRect(0, 930, W, H - 930);
      c.translate(70, 1010); c.scale(lerp(1.3, 1, k), lerp(1.3, 1, k));
      c.font = F(900, 58); c.textBaseline = 'alphabetic'; c.letterSpacing = '-1.5px';
      c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,60,200,0.55)'; c.fillText(a, -6 * (1 - k) - 2, 0); c.fillStyle = 'rgba(80,160,255,0.55)'; c.fillText(a, 6 * (1 - k) + 2, 0); c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#FFFFFF'; c.fillText(a, 0, 0); const aw = c.measureText(a).width;
      c.fillStyle = C.purple; c.fillRect(0, 14, aw * io3(prog(t, t0 + 0.1, t0 + 0.4)), 5);
      c.letterSpacing = '3px'; c.font = F(800, 24); c.globalAlpha = (1 - out) * prog(t, t0 + 0.15, t0 + 0.35); c.fillStyle = C.violet; c.fillText(b, aw + 30, -4);
      c.restore();
    }
  }
  function cursor(c, t) {
    // 13.7–14.15: click the search bar; 15.75–16.5: glide to the contract line and click
    let wx, wy, show = false, click = null;
    if (t > 13.7 && t < 14.3) { const k = io3(prog(t, 13.7, 14.05)); wx = lerp(1200, 760, k); wy = lerp(500, 35, k); show = true; if (t > 14.05) click = prog(t, 14.05, 14.3); }
    else if (t > 15.7 && t < 17.0) { const k = io3(prog(t, 15.75, 16.4)); wx = lerp(1100, 800, k); wy = lerp(560, 305, k); show = true; if (t > 16.45) click = prog(t, 16.45, 16.8); }
    if (!show) return;
    const [x, y] = toScreen(wx, wy), press = click != null && click < 0.3 ? 0.88 : 1;
    if (click != null) { c.save(); c.strokeStyle = `rgba(169,139,255,${1 - click})`; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 12 + click * 50, 0, TAU); c.stroke(); c.restore(); }
    c.save(); c.translate(x, y); c.scale(1.5 * press, 1.5 * press);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 34); c.lineTo(9, 26); c.lineTo(15, 40); c.lineTo(21, 37); c.lineTo(15, 24); c.lineTo(26, 24); c.closePath();
    c.fillStyle = '#FFF'; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke(); c.restore();
  }
  function dot(c, t) {
    if (t > 1.6) return;
    const [sx, sy] = toScreen(748, 245), appear = A(t, 0.05, 0.4, crit), stretch = A(t, 0.5, 0.4, io5), fade = 1 - A(t, 0.9, 0.4);
    if (appear <= 0) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade; const r = 7 * appear * (1 + 0.25 * Math.sin(t * 8));
    const g = c.createRadialGradient(sx, sy, 0, sx, sy, r * 16); g.addColorStop(0, rgba(C.purple, 0.85)); g.addColorStop(0.2, rgba(C.purple, 0.3)); g.addColorStop(1, rgba(C.purple, 0)); c.fillStyle = g; c.fillRect(sx - r * 16, sy - r * 16, r * 32, r * 32);
    c.fillStyle = '#FFFFFF'; const lw = 1 + stretch * 900; c.beginPath(); c.roundRect(sx - r - lw / 2, sy - r, r * 2 + lw, r * 2, r); c.fill(); c.restore();
  }
  function endCard(c, t) {
    const k = A(t, 26.0, 0.35, io3); if (k <= 0) return;
    c.save(); c.globalAlpha = k; c.fillStyle = 'rgba(5,4,9,0.9)'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 800); g.addColorStop(0, rgba(C.purple, 0.3)); g.addColorStop(1, rgba(C.purple, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
    const lk = A(t, 26.0, 0.6, crit); c.translate(W / 2, H / 2 - 30); c.scale(lerp(1.4, 1, lk), lerp(1.4, 1, lk)); c.globalAlpha = k * clamp(lk * 2);
    argusLogo(c, -170, 0, 56); text(c, 'Argus', -90, 0, F(600, 120), '#FFFFFF');
    c.globalAlpha = k * A(t, 26.5, 0.4); text(c, 'argus.world', 60, 130, F(600, 40), C.mute, 'center');
    c.restore();
  }
  // white flash on the hard cuts (dot→window, click→token page, logo)
  function flashes(c, t) { let f = 0; for (const T of [17.0, 26.0]) if (t >= T) f = Math.max(f, 0.6 * Math.exp(-(t - T) * 14)); if (f > 0.01) { c.fillStyle = `rgba(255,255,255,${f})`; c.fillRect(0, 0, W, H); } }

  function renderAt(t) {
    t = clamp(t, 0, DUR - 1e-6); CAM = camera(t);
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.letterSpacing = '0px';
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(W / 2, H / 2); c.scale(CAM.z, CAM.z); c.translate(-CAM.x, -CAM.y);
    if (t < 17.0) { if (t >= 0.9) home(c, t); } else tokenPage(c, t);
    c.restore();
    dot(c, t); captions(c, t); cursor(c, t); flashes(c, t); endCard(c, t);
    const v = c.createRadialGradient(W / 2, H / 2, 520, W / 2, H / 2, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
  }

  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(F(800, 40)), document.fonts.load(M(500, 14)), ...ASSETS.map((k) => load(k, `../assets/argus/${k}.png`))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
