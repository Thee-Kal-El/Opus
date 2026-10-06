// BIRDEYE TERMINAL — 46s, 1920x1080 @ 60fps.
// A single dot on black becomes the terminal: Chart → Watchlist → Positions → Option Chain. The camera dives
// in and out across scales, pulls back until the desktop is a point in space, flies to a second point that
// becomes a landscape phone (chart | option chain), then resolves on the $NOSELLING screen.
// Everything is vector-drawn under one camera transform (crisp at any zoom); renderAt(t) is deterministic.
(() => {
  'use strict';
  const K = window.KIT, { C, F, M, TAU, clamp, lerp, prog, io3, io5, o3, crit, pop, A, hash, rng, rgba, rr, text } = K;
  const W = 1920, H = 1080, FPS = 60, DUR = 46;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');

  // ---------- world layout (the desktop is a 1920x1080 world rect at the origin) ----------
  const WIN = {
    chart: { x: 20, y: 116, w: 1160, h: 564, t: 3.0, title: 'SOL / USDC', tabs: ['15m', '1h', '4h', 'D'] },
    watch: { x: 1196, y: 116, w: 704, h: 564, t: 8.5, title: 'WATCHLIST', tabs: ['Trending', 'Smart Money'] },
    pos: { x: 20, y: 696, w: 920, h: 368, t: 9.5, title: 'POSITIONS', tabs: ['Open (5)', 'Orders', 'History'] },
    opt: { x: 956, y: 696, w: 944, h: 368, t: 10.5, title: 'OPTION CHAIN', tabs: ['SOL', 'Exp 24 Oct', 'Greeks'] },
  };
  const DOT = [600, 398];                          // where the first dot lives (inside the chart window)
  const PHONE = { x: 52000, y: -18500, w: 2340, h: 1080 };   // a second point far away in space
  const SOL = K.series(42, 90, 168, 0.012, 0.06), SOLm = K.series(7, 60, 176, 0.012, 0.08);

  // ---------- camera keyframes: [t, cx, cy, log(zoom)] — zoom is interpolated in log space ----------
  const L = Math.log;
  const KEYS = [
    [0.0, DOT[0], DOT[1], L(3.2)], [2.4, DOT[0], DOT[1], L(3.2)], [4.6, 600, 398, L(1.55)], [8.0, 600, 398, L(1.45)],
    [10.6, 960, 540, L(1.0)], [12.0, 960, 540, L(1.0)],
    [13.6, 1090, 300, L(3.0)], [15.6, 1060, 320, L(3.4)],                  // chart: last price + crosshair
    [17.6, 1428, 880, L(2.0)], [19.4, 1428, 880, L(2.05)],                 // option chain
    [20.8, 1428, 969, L(9.5)], [21.9, 1428, 969, L(10.5)], [23.2, 1428, 880, L(2.0)],   // deep dive: the ATM strike
    [25.0, 480, 880, L(2.0)], [26.8, 480, 880, L(2.15)],                    // positions
    [28.4, 1548, 400, L(2.1)], [29.9, 1548, 420, L(2.2)],                   // watchlist
    [31.4, 960, 540, L(1.0)], [32.0, 960, 540, L(1.0)],
    [35.4, 960, 540, L(0.00035)],                                         // the desktop becomes a point in space
    [36.6, (960 + PHONE.x) / 2, (540 + PHONE.y) / 2, L(0.00022)],
    [40.4, PHONE.x + PHONE.w / 2, PHONE.y + PHONE.h / 2, L(0.66)], [42.4, PHONE.x + PHONE.w / 2, PHONE.y + PHONE.h / 2, L(0.7)],
    [44.2, PHONE.x + PHONE.w * 0.27, PHONE.y + PHONE.h * 0.52, L(3.0)], [46.0, PHONE.x + PHONE.w * 0.27, PHONE.y + PHONE.h * 0.52, L(3.0)],
  ];
  function camera(t) {
    let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], k = io3(prog(t, a[0], b[0]));
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

  // ---------- the desktop ----------
  function openK(w, t) { return A(t, w.t, 0.9, crit); }
  function windowFrame(c, w, t, draw, active) {
    const k = openK(w, t); if (k <= 0) return;
    // grows out of the original dot: outline first, then panel + content
    const ox = DOT[0], oy = DOT[1], cx = w.x + w.w / 2, cy = w.y + w.h / 2;
    const x = lerp(ox, w.x, k), y = lerp(oy, w.y, k), ww = w.w * k, hh = w.h * k;
    if (k < 1) {
      c.save(); c.strokeStyle = C.orange; c.lineWidth = 2 / Math.max(0.5, CAM.z) * 1.4; c.shadowColor = C.orange; c.shadowBlur = 20;
      c.strokeRect(lerp(ox, x, 1), y, ww, hh); c.restore();
    }
    const ca = clamp((k - 0.55) / 0.45);
    if (ca <= 0) return;
    c.save(); c.globalAlpha *= ca;
    K.panel(c, x, y, ww, hh, w.title, { tabs: w.tabs, active });
    if (k >= 0.999) { c.beginPath(); c.rect(w.x, w.y + 45, w.w, w.h - 45); c.clip(); draw(c, t); }
    c.restore();
  }
  function crossAt(t) { const u = prog(t, 13.0, 16.0); return [lerp(700, 1080, io3(u)), 330 + Math.sin(u * 5) * 60]; }
  function desktop(c, t) {
    // background
    c.fillStyle = C.bg; c.fillRect(0, 0, 1920, 1080);
    const navK = A(t, 11.0, 0.8);
    if (navK > 0) { c.save(); c.globalAlpha = navK; c.translate(0, (1 - navK) * -30); K.topNav(c, 0, 0, 1920, 56); K.chainBar(c, 0, 56, 1920, 44, 1); c.restore(); }
    windowFrame(c, WIN.chart, t, (c2, tt) => {
      const n = 8 + 82 * A(tt, 4.4, 3.6, io3), live = (tt * 0.8) % 1;
      const cross = tt > 12.6 && tt < 16.2 ? crossAt(tt) : null;
      const r = K.candleChart(c2, WIN.chart.x + 8, WIN.chart.y + 94, WIN.chart.w - 16, WIN.chart.h - 104, SOL, { count: n, live, cross, fmt: (v) => v.toFixed(2) });
      text(c2, 'SOL/USDC · 15 · birdeye.so', WIN.chart.x + 18, WIN.chart.y + 66, F(600, 15), C.ink);
      const last = SOL[Math.min(SOL.length, Math.floor(n)) - 1];
      text(c2, `O${last.o.toFixed(2)}  H${last.h.toFixed(2)}  L${last.l.toFixed(2)}  C${r.lp.toFixed(2)}`, WIN.chart.x + 250, WIN.chart.y + 66, M(500, 13), C.green);
      if (cross) { const [x, y] = cross; rr(c2, x - 70, WIN.chart.y + WIN.chart.h - 34, 140, 24, 4); c2.fillStyle = '#2A2A2A'; c2.fill(); text(c2, '17:30  21 Oct', x, WIN.chart.y + WIN.chart.h - 22, M(600, 12), C.ink, 'center'); }
    }, t > 12.6 && t < 16.2);
    windowFrame(c, WIN.watch, t, (c2, tt) => K.watchlist(c2, WIN.watch.x, WIN.watch.y + 48, WIN.watch.w, WIN.watch.h - 52, tt), t > 27.6 && t < 30.4);
    windowFrame(c, WIN.pos, t, (c2, tt) => K.positions(c2, WIN.pos.x, WIN.pos.y + 50, WIN.pos.w, WIN.pos.h - 54, tt), t > 24.2 && t < 27.4);
    windowFrame(c, WIN.opt, t, (c2, tt) => {
      const hl = tt > 16.6 ? 2 + ((tt - 16.6) * 2.2) % 7 : null;
      K.optionChain(c2, WIN.opt.x, WIN.opt.y + 48, WIN.opt.w, WIN.opt.h - 50, tt, { spot: 182.4 + Math.sin(tt * 0.7) * 0.6, hl: tt > 19.6 && tt < 23.4 ? 5 : hl });
    }, t > 16.6 && t < 23.6);
    // watchlist highlight on PLAGUE +395%
    if (t > 28.0 && t < 30.6) { const k = A(t, 28.2, 0.4); const ry = WIN.watch.y + 48 + 40 + 3 * ((WIN.watch.h - 92) / 8); c.save(); c.globalAlpha = k * (1 - A(t, 30.2, 0.3)); c.strokeStyle = C.orange; c.lineWidth = 2; c.strokeRect(WIN.watch.x + 6, ry + 2, WIN.watch.w - 12, (WIN.watch.h - 92) / 8 - 4); c.restore(); }
  }

  // ---------- the phone (landscape): chart | option chain ----------
  function phone(c, t) {
    const { x, y, w, h } = PHONE;
    c.save();
    c.shadowColor = 'rgba(255,122,26,0.25)'; c.shadowBlur = 120;
    rr(c, x - 40, y - 40, w + 80, h + 80, 150); const g = c.createLinearGradient(x, y - 40, x, y + h + 40); g.addColorStop(0, '#3A3A3E'); g.addColorStop(0.5, '#1A1A1C'); g.addColorStop(1, '#2C2C30'); c.fillStyle = g; c.fill();
    c.shadowBlur = 0;
    rr(c, x - 28, y - 28, w + 56, h + 56, 140); c.fillStyle = '#050505'; c.fill();
    rr(c, x, y, w, h, 110); c.save(); c.clip();
    c.fillStyle = C.bg; c.fillRect(x, y, w, h);
    // status + mini nav
    c.fillStyle = '#0B0B0B'; c.fillRect(x, y, w, 110);
    K.wordmark(c, x + 150, y + 56, 54);
    text(c, '9:41', x + w - 160, y + 56, F(700, 38), C.ink, 'right');
    // left half: chart
    const lx = x + 40, cw = w / 2 - 60;
    text(c, 'SOL/USDC · 15m', lx + 10, y + 160, F(700, 40), C.ink);
    text(c, '+3.42%', lx + 360, y + 160, M(700, 36), C.green);
    K.candleChart(c, lx, y + 200, cw, h - 240, SOLm, { count: 60, live: (t * 0.8) % 1, fmt: (v) => v.toFixed(1) });
    // divider
    c.fillStyle = C.line; c.fillRect(x + w / 2, y + 130, 3, h - 160);
    // right half: option chain (scaled up for the phone)
    c.save(); c.translate(x + w / 2 + 30, y + 130); c.scale(1.18, 1.18);
    K.optionChain(c, 0, 0, (w / 2 - 70) / 1.18, (h - 150) / 1.18, t, { spot: 182.4 + Math.sin(t * 0.7) * 0.6, strikes: [170, 175, 180, 185, 190, 195], hl: 3 });
    c.restore();
    // glass reflection
    const rg = c.createLinearGradient(x, y, x + w, y + h); rg.addColorStop(0, 'rgba(255,255,255,0.06)'); rg.addColorStop(0.4, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(255,255,255,0.03)'); c.fillStyle = rg; c.fillRect(x, y, w, h);
    c.restore();
    // camera punch-hole + side buttons
    c.fillStyle = '#000'; c.beginPath(); c.arc(x + 70, y + h / 2, 18, 0, TAU); c.fill();
    c.fillStyle = '#2A2A2E'; c.fillRect(x + w * 0.3, y - 48, 220, 10); c.fillRect(x + w * 0.42, y - 48, 120, 10);
    c.restore();
  }

  // ---------- final: the $NOSELLING screen (YOU BETTER NOT SELL! banner with the coin) ----------
  function noselling(c, t) {
    const k = A(t, 43.3, 0.7, io3); if (k <= 0) return;
    const ck = A(t, 43.5, 1.2, crit);
    K.betterNotSell(c, W, H * 0.86, t, k, { spin: (1 - ck) * Math.PI * 4, coinDy: (1 - ck) * -500 });
    c.save(); c.globalAlpha = k * A(t, 44.6, 0.5);
    c.fillStyle = '#030303'; c.fillRect(0, H * 0.86, W, H * 0.14);
    c.font = M(700, 34); const p1 = '$NOSELLING  ', p2 = '$0.0', p3 = '5', p4 = '25430'; const w1 = c.measureText(p1).width, w2 = c.measureText(p2).width, w4 = c.measureText(p4).width; c.font = M(700, 20); const w3 = c.measureText(p3).width;
    let px = W / 2 - (w1 + w2 + w3 + w4) / 2 - 140; const py = H * 0.93;
    text(c, p1, px, py, F(900, 34), '#FFFFFF'); px += w1; text(c, p2, px, py, M(700, 34), C.green); px += w2; text(c, p3, px, py + 10, M(700, 20), C.green); px += w3; text(c, p4, px, py, M(700, 34), C.green);
    K.wordmark(c, W / 2 + 200, py, 40);
    c.restore();
  }

  // ---------- the opening dot ----------
  function openingDot(c, t) {
    if (t > 4.2) return;
    const [sx, sy] = toScreen(DOT[0], DOT[1]);
    const appear = A(t, 0.3, 0.8, crit), breathe = 1 + 0.25 * Math.sin(t * 3.2), stretch = A(t, 2.4, 0.7, io5), fade = 1 - A(t, 3.4, 0.6);
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
    if (t < 3.0) { /* only the dot */ } else if (1920 * CAM.z > 8) desktop(c, t);
    if (t > 35 && PHONE.w * CAM.z > 8) phone(c, t);
    c.restore();
    if (t > 31.5 && t < 41) { beacon(c, 0, 0, 1920, 1080, C.orange, 1); beacon(c, PHONE.x, PHONE.y, PHONE.w, PHONE.h, '#6FB8FF', A(t, 35.6, 0.8)); }
    openingDot(c, t);
    noselling(c, t);
    // vignette
    const v = c.createRadialGradient(W / 2, H / 2, 520, W / 2, H / 2, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
  }

  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(F(700, 40)), document.fonts.load(M(600, 20))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
