// Shared Birdeye UI kit for both films: palette, data (taken from the reference screenshots), vector widgets
// drawn in world units so they stay razor sharp at any camera zoom, the NOSELLING coin, and helpers.
window.KIT = (() => {
  'use strict';
  const TAU = Math.PI * 2;
  const C = {
    bg: '#0A0A0A', panel: '#111111', panel2: '#161616', line: '#232323', line2: '#2C2C2C',
    ink: '#EDEDED', mute: '#8B8B8B', dim: '#5A5A5A', green: '#1FD17A', red: '#F6465D', orange: '#FF7A1A', blue: '#3B8BFF', yellow: '#F3BA2F',
  };
  const F = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`;
  const BANNER = (s) => `900 ${s}px "Inter Tight", Geist, sans-serif`;
  const M = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;

  // ---------- math ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const io3 = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const io5 = (p) => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2);
  const o3 = (p) => 1 - Math.pow(1 - p, 3);
  const crit = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const k = 7 * p; return (1 - (1 + k) * Math.exp(-k)) / (1 - 8 * Math.exp(-7)); };
  const pop = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const z = 0.55, w = 12, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * p) * (Math.cos(wd * p) + z / Math.sqrt(1 - z * z) * Math.sin(wd * p)); };
  const A = (t, t0, d, f = crit) => f(prog(t, t0, t0 + d));
  const hash = (a, b = 0, c = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
  function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------- data (from the screenshots) ----------
  const TRENDING = [['LGNS', '$1.0009', 0.25], ['PUMP', '$0.006414', -0.86], ['HIGGS', '$0.002999', 106], ['PLAGUE', '$0.002048', 395], ['QQQB', '$757.23', 0.7], ['NVDAx', '$240.44', 1.97], ['CARDS', '$0.2856', 17.46], ['CRAWL', '$0.004044', 94.5]];
  const BUBBLES = [ // name, pct, relative size, x, y (0..1 in the bubble panel, from the screenshot)
    ['SKY', -7.95, 0.62, 0.07, 0.19], ['TON', 4.18, 0.45, 0.20, 0.11], ['NEAR', 9.14, 0.66, 0.33, 0.17], ['QNT', 4.24, 0.45, 0.50, 0.15], ['AAVE', 4.73, 0.38, 0.63, 0.13],
    ['NIGHT', 14.88, 0.86, 0.78, 0.20], ['LINK', -2.25, 0.28, 0.93, 0.13], ['ASTER', 3.37, 0.40, 0.22, 0.37], ['PEPE', -1.24, 0.18, 0.43, 0.32], ['VVV', -4.58, 0.48, 0.64, 0.39],
    ['ADA', 4.56, 0.46, 0.10, 0.54], ['M', -2.59, 0.33, 0.34, 0.45], ['NEXO', -3.12, 0.39, 0.44, 0.52], ['ICP', 5.98, 0.54, 0.54, 0.61], ['LIT', 8.36, 0.64, 0.90, 0.58],
    ['ARB', 1.59, 0.26, 0.25, 0.56], ['ENA', 3.99, 0.44, 0.33, 0.69], ['AERO', -2.25, 0.33, 0.77, 0.61], ['RENDER', 4.31, 0.45, 0.05, 0.80], ['ZRO', 9.88, 0.70, 0.19, 0.83],
    ['OKB', 7.59, 0.60, 0.44, 0.84], ['ATOM', 3.38, 0.42, 0.72, 0.79], ['JUP', 4.64, 0.48, 0.90, 0.84], ['TAO', 1.46, 0.24, 0.59, 0.84], ['MNT', -1.36, 0.27, 0.65, 0.88],
    ['RAIN', 1.18, 0.24, 0.80, 0.90], ['MORPHO', -0.99, 0.22, 0.54, 0.93], ['SUI', 0.94, 0.20, 0.34, 0.92], ['DOGE', -0.48, 0.16, 0.12, 0.33], ['WBNB', -0.9, 0.18, 0.51, 0.34],
  ];
  const TRADERS = [['Gbj9i5dKt5', '+$8.58M', '$1B'], ['2w3nD9VdSh', '+$3.62M', '$11.85M'], ['0x424d9f20', '+$1.94M', '$16M'], ['0x2Ff0f110', '+$1.87M', '$15.38M'], ['0x3F59A126', '+$1.35M', '$1.66M']];
  const NAV = ['Trending', 'Trenches', 'Trackers', 'Supercharts', 'Perps', 'Peak', 'API', 'More'];
  const CHAINS = ['ALL CHAINS', 'SOLANA', 'ROBINHOOD', 'BNB CHAIN', 'BASE', 'ETHEREUM', 'MANTLE', 'ARC', 'MEGAETH', 'MONAD'];

  // deterministic OHLC series (random walk with a trend) → candles
  function series(seed, n, start, vol, drift = 0) {
    const r = rng(seed), out = []; let p = start;
    for (let i = 0; i < n; i++) {
      const o = p, ch = (r() - 0.5 + drift) * vol * p, c = Math.max(p * 0.2, o + ch);
      const h = Math.max(o, c) + r() * vol * p * 0.5, l = Math.min(o, c) - r() * vol * p * 0.5;
      out.push({ o, h, l, c, v: 0.3 + r() * 0.7 + (Math.abs(ch) / (vol * p)) }); p = c;
    }
    return out;
  }

  // ---------- primitives ----------
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
  function text(c, s, x, y, font, col, align = 'left', base = 'middle') { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.fillText(s, x, y); }
  const pct = (v) => `${v >= 0 ? '+' : ''}${Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)}%`;

  // birdeye mark: white "6"-like swoosh with an orange core (vector, after the logo)
  function birdMark(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s / 40, s / 40);
    c.fillStyle = '#FFFFFF';
    c.beginPath(); c.moveTo(-4, -20); c.quadraticCurveTo(10, -18, 8, -6); c.quadraticCurveTo(-6, -10, -12, 4);
    c.arc(0, 6, 13, Math.PI, Math.PI * 3); c.closePath(); c.fill();
    c.fillStyle = C.orange; c.beginPath(); c.arc(0, 6, 6.5, 0, TAU); c.fill();
    c.restore();
  }
  function wordmark(c, x, y, s, col = '#FFFFFF') { birdMark(c, x + s * 0.45, y, s); text(c, 'birdeye', x + s * 1.05, y + s * 0.08, F(700, s * 0.82), col, 'left', 'middle'); }

  // NOSELLING coin, after the reference photos: brushed/scratched silver, raised rim, two inner arcs
  // above and below, bold embossed NOSELLING. spin (radians) shows the coin edge as it turns.
  let SCRATCH = null;
  function scratchTex() {
    if (SCRATCH) return SCRATCH;
    SCRATCH = mk(512, 512); const g = SCRATCH.getContext('2d'), r = rng(31);
    const im = g.createImageData(512, 512); for (let i = 0; i < im.data.length; i += 4) { const v = 150 + (r() - 0.5) * 60; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0);
    g.filter = 'blur(1.2px)'; g.drawImage(SCRATCH, 0, 0); g.filter = 'none';
    for (let k = 0; k < 420; k++) { const x = r() * 512, y = r() * 512, a = r() * TAU, l = 6 + r() * 60; g.strokeStyle = r() < 0.5 ? `rgba(255,255,255,${0.15 + r() * 0.3})` : `rgba(40,40,40,${0.1 + r() * 0.25})`; g.lineWidth = 0.6 + r() * 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    return SCRATCH;
  }
  function coin(c, x, y, r, t = 0, o = {}) {
    const spin = o.spin ?? 0, sx = Math.cos(spin), thick = r * 0.09 * Math.sin(spin);
    c.save(); c.translate(x, y);
    if (o.glow) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 2); g.addColorStop(0, rgba(o.glow, 0.32)); g.addColorStop(1, rgba(o.glow, 0)); c.fillStyle = g; c.fillRect(-r * 2, -r * 2, r * 4, r * 4); c.restore(); }
    // edge (visible while spinning)
    if (Math.abs(thick) > 0.5) { c.save(); c.scale(Math.max(0.03, Math.abs(sx)), 1); c.translate(thick / Math.max(0.03, Math.abs(sx)), 0); const eg = c.createLinearGradient(-r, 0, r, 0); eg.addColorStop(0, '#5A5A5E'); eg.addColorStop(0.5, '#B8B8BC'); eg.addColorStop(1, '#4A4A4E'); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = eg; c.fill(); c.restore(); }
    c.scale(Math.max(0.03, Math.abs(sx)), 1);
    if (o.shadow !== false) { c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = r * 0.25; c.shadowOffsetY = r * 0.08; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = '#777'; c.fill(); c.restore(); }
    // rim
    const rg = c.createLinearGradient(-r, -r, r, r); rg.addColorStop(0, '#F2F2F4'); rg.addColorStop(0.45, '#8C8C90'); rg.addColorStop(0.7, '#D6D6DA'); rg.addColorStop(1, '#5E5E62');
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = rg; c.fill();
    // face
    c.save(); c.beginPath(); c.arc(0, 0, r * 0.92, 0, TAU); c.clip();
    const fg = c.createLinearGradient(-r, -r, r, r); fg.addColorStop(0, '#E2E2E4'); fg.addColorStop(0.5, '#B4B4B8'); fg.addColorStop(1, '#8A8A8E'); c.fillStyle = fg; c.fillRect(-r, -r, r * 2, r * 2);
    c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.9; c.drawImage(scratchTex(), -r, -r, r * 2, r * 2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // inner shadow under the rim
    const ig = c.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 0.93); ig.addColorStop(0, 'rgba(0,0,0,0)'); ig.addColorStop(1, 'rgba(0,0,0,0.35)'); c.fillStyle = ig; c.fillRect(-r, -r, r * 2, r * 2);
    // the two engraved arcs
    for (const [a0, a1] of [[Math.PI * 1.08, Math.PI * 1.92], [Math.PI * 0.08, Math.PI * 0.92]]) {
      c.beginPath(); c.arc(0, 0, r * 0.8, a0, a1); c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = r * 0.022; c.stroke();
      c.beginPath(); c.arc(r * 0.008, r * 0.008, r * 0.8, a0, a1); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = r * 0.012; c.stroke();
    }
    // embossed name
    c.font = F(800, r * 0.27); c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = `${r * 0.004}px`;
    c.fillStyle = 'rgba(40,40,44,0.75)'; c.fillText('NOSELLING', r * 0.018, r * 0.022);
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillText('NOSELLING', -r * 0.012, -r * 0.012);
    const tg = c.createLinearGradient(0, -r * 0.14, 0, r * 0.14); tg.addColorStop(0, '#D8D8DC'); tg.addColorStop(1, '#9A9A9E'); c.fillStyle = tg; c.fillText('NOSELLING', 0, 0);
    c.lineWidth = r * 0.006; c.strokeStyle = 'rgba(30,30,34,0.6)'; c.strokeText('NOSELLING', 0, 0); c.letterSpacing = '0px';
    // moving specular sweep
    const sxp = Math.sin(t * 1.1) * r * 1.3, sg = c.createLinearGradient(sxp - r * 0.45, -r, sxp + r * 0.45, r); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.4)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sg; c.fillRect(-r, -r, r * 2, r * 2);
    c.restore();
    c.beginPath(); c.arc(0, 0, r * 0.92, 0, TAU); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = r * 0.012; c.stroke();
    c.restore();
  }

  // "YOU BETTER NOT [coin] SELL!" banner, after the reference: grainy red stencil letters, glow, wet reflective floor.
  let REDTEX = null;
  function redTex() {
    if (REDTEX) return REDTEX;
    REDTEX = mk(400, 400); const g = REDTEX.getContext('2d'), r = rng(66);
    g.fillStyle = '#B00C18'; g.fillRect(0, 0, 400, 400);
    for (let k = 0; k < 2600; k++) { const x = r() * 400, y = r() * 400, a = r() * TAU, l = 2 + r() * 9; g.strokeStyle = `hsl(${355 + r() * 10},${85 + r() * 15}%,${38 + r() * 34}%)`; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    return REDTEX;
  }
  function stencil(c, s, x, y, size, ls) {
    c.save(); c.font = BANNER(size); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.letterSpacing = `${ls}px`;
    c.shadowColor = 'rgba(255,30,40,0.7)'; c.shadowBlur = size * 0.07; c.fillStyle = '#D0101E'; c.fillText(s, x, y); c.shadowBlur = 0;
    c.globalCompositeOperation = 'source-atop'; const p = c.createPattern(redTex(), 'repeat'); c.fillStyle = p; c.fillText(s, x, y);
    c.globalCompositeOperation = 'source-over';
    // stencil bridges
    c.restore();
  }
  function betterNotSell(c, W, H, t, k = 1, o = {}) {
    c.save(); c.globalAlpha *= k;
    c.fillStyle = '#030303'; c.fillRect(0, 0, W, H);
    const lay = mk(W, H), g = lay.getContext('2d');
    const size = H * 0.27, ls = size * 0.05;
    const reveal = (i) => clamp((o.letters ?? 99) - i);
    g.globalAlpha = 1;
    const row1 = 'YOU BETTER', row2a = 'NOT', row2b = 'SELL!';
    g.font = BANNER(size); g.letterSpacing = `${ls}px`;
    const w1 = g.measureText(row1).width, wa = g.measureText(row2a).width, wb = g.measureText(row2b).width, gap = size * 1.45, w2 = wa + gap + wb;
    const y1 = H * 0.34, y2 = H * 0.66;
    [...row1].forEach((ch, i) => { g.globalAlpha = reveal(i); });
    stencil(g, row1, W / 2 - w1 / 2, y1, size, ls);
    stencil(g, row2a, W / 2 - w2 / 2, y2, size, ls);
    stencil(g, row2b, W / 2 - w2 / 2 + wa + gap, y2, size, ls);
    c.drawImage(lay, 0, 0);
    // wet floor reflection
    const fy = y2 + size * 0.06;
    c.save(); c.beginPath(); c.rect(0, fy, W, H - fy); c.clip();
    c.translate(0, fy * 2); c.scale(1, -1); c.globalAlpha *= 0.32; c.filter = 'blur(3px)'; c.drawImage(lay, 0, 0); c.filter = 'none'; c.restore();
    const flr = () => { const fl = c.createLinearGradient(0, fy, 0, H); fl.addColorStop(0, 'rgba(3,3,3,0.15)'); fl.addColorStop(0.6, 'rgba(3,3,3,0.85)'); fl.addColorStop(1, 'rgba(3,3,3,1)'); c.fillStyle = fl; c.fillRect(0, fy, W, H - fy); };
    // the coin stands in the gap between NOT and SELL!
    const cx = W / 2 - w2 / 2 + wa + gap / 2, cr = size * 0.66, cy = fy - cr;
    if (o.coin !== false) {
      c.save(); c.beginPath(); c.rect(0, fy, W, H - fy); c.clip(); c.translate(0, fy * 2); c.scale(1, -1); c.globalAlpha *= 0.22; coin(c, cx, cy + (o.coinDy ?? 0), cr, t, { spin: o.spin ?? 0, shadow: false }); c.restore();
      flr(); coin(c, cx, cy + (o.coinDy ?? 0), cr, t, { spin: o.spin ?? 0 });
    } else flr();
    c.restore();
    return { cx, cy, cr };
  }

  // window chrome in Birdeye style
  function panel(c, x, y, w, h, title, o = {}) {
    c.save();
    if (o.shadow !== false) { c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40; c.shadowOffsetY = 16; }
    rr(c, x, y, w, h, 10); c.fillStyle = C.panel; c.fill(); c.shadowBlur = 0; c.shadowOffsetY = 0;
    c.strokeStyle = o.active ? rgba(C.orange, 0.8) : C.line2; c.lineWidth = o.active ? 2 : 1.2; c.stroke();
    c.beginPath(); c.moveTo(x, y + 44); c.lineTo(x + w, y + 44); c.strokeStyle = C.line; c.lineWidth = 1; c.stroke();
    text(c, title, x + 18, y + 23, F(700, 15), C.ink);
    if (o.tabs) { let tx = x + 18 + c.measureText(title).width + 22; c.font = F(600, 14); for (const tb of o.tabs) { text(c, tb, tx, y + 23, F(600, 14), C.mute); tx += c.measureText(tb).width + 20; } }
    if (o.right) text(c, o.right, x + w - 18, y + 23, F(500, 14), C.blue, 'right');
    c.restore();
  }

  // candlestick chart (TradingView-like, as on Birdeye) with optional live last candle + crosshair
  function candleChart(c, x, y, w, h, data, o = {}) {
    const n = Math.min(data.length, Math.max(2, Math.floor(o.count ?? data.length)));
    const vis = data.slice(0, n), lo = Math.min(...vis.map((d) => d.l)), hi = Math.max(...vis.map((d) => d.h)), pad = (hi - lo) * 0.12;
    const L = lo - pad, Hh = hi + pad, axisW = o.axis === false ? 0 : 92, cw = (w - axisW) / data.length, volH = h * 0.18;
    const Y = (v) => y + (h - volH) * (1 - (v - L) / (Hh - L));
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.045)'; c.lineWidth = 1;
    for (let k = 1; k < 6; k++) { const yy = y + (h - volH) * k / 6; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w - axisW, yy); c.stroke(); }
    for (let k = 1; k < 8; k++) { const xx = x + (w - axisW) * k / 8; c.beginPath(); c.moveTo(xx, y); c.lineTo(xx, y + h); c.stroke(); }
    const fmt = o.fmt || ((v) => v.toFixed(2));
    vis.forEach((d, i) => {
      const up = d.c >= d.o, col = up ? C.green : C.red, cx = x + i * cw + cw / 2;
      let cc = d.c, hh = d.h, ll = d.l;
      if (i === n - 1 && o.live != null) { cc = d.o + (d.c - d.o) * o.live; hh = Math.max(d.o, cc, d.o + (d.h - d.o) * o.live); ll = Math.min(d.o, cc, d.o - (d.o - d.l) * o.live); }
      c.strokeStyle = col; c.lineWidth = Math.max(1, cw * 0.12); c.beginPath(); c.moveTo(cx, Y(hh)); c.lineTo(cx, Y(ll)); c.stroke();
      const top = Y(Math.max(d.o, cc)), bot = Y(Math.min(d.o, cc)); c.fillStyle = col; c.fillRect(cx - cw * 0.34, top, cw * 0.68, Math.max(1.2, bot - top));
      c.fillStyle = rgba(col, 0.35); const vh = volH * 0.9 * d.v / 1.8; c.fillRect(cx - cw * 0.34, y + h - vh, cw * 0.68, vh);
    });
    // moving averages
    for (const [per, col] of [[7, C.yellow], [21, C.blue]]) {
      c.beginPath(); let started = false;
      vis.forEach((d, i) => { if (i < per) return; const avg = vis.slice(i - per, i).reduce((s, q) => s + q.c, 0) / per; const px = x + i * cw + cw / 2, py = Y(avg); started ? c.lineTo(px, py) : c.moveTo(px, py); started = true; });
      c.strokeStyle = rgba(col, 0.75); c.lineWidth = 1.6; c.stroke();
    }
    // last price line + tag
    const last = vis[n - 1], lp = o.live != null ? last.o + (last.c - last.o) * o.live : last.c, ly = Y(lp), up = lp >= last.o;
    c.setLineDash([4, 4]); c.strokeStyle = rgba(up ? C.green : C.red, 0.8); c.beginPath(); c.moveTo(x, ly); c.lineTo(x + w - axisW, ly); c.stroke(); c.setLineDash([]);
    if (axisW) {
      c.fillStyle = C.panel; c.fillRect(x + w - axisW, y, axisW, h);
      for (let k = 0; k <= 6; k++) { const v = L + (Hh - L) * (1 - k / 6); text(c, fmt(v), x + w - axisW + 10, y + (h - volH) * k / 6, M(500, 13), C.mute); }
      rr(c, x + w - axisW + 2, ly - 12, axisW - 4, 24, 3); c.fillStyle = up ? C.green : C.red; c.fill(); text(c, fmt(lp), x + w - axisW + 10, ly, M(700, 13), '#000');
    }
    if (o.cross) { const [cx, cy] = o.cross; c.setLineDash([5, 5]); c.strokeStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.moveTo(cx, y); c.lineTo(cx, y + h); c.moveTo(x, cy); c.lineTo(x + w - axisW, cy); c.stroke(); c.setLineDash([]); }
    c.restore();
    return { Y, cw, lp };
  }

  // option chain (calls | strike | puts) with ITM shading and a moving highlight
  function optionChain(c, x, y, w, h, t, o = {}) {
    const spot = o.spot ?? 182.4, strikes = o.strikes ?? [160, 165, 170, 175, 180, 185, 190, 195, 200, 205], rowH = (h - 70) / strikes.length;
    const cols = ['Bid', 'Ask', 'IV', 'Δ'], half = (w - 110) / 2;
    text(c, 'CALLS', x + half / 2, y + 18, F(800, 15), C.green, 'center'); text(c, 'PUTS', x + half + 110 + half / 2, y + 18, F(800, 15), C.red, 'center');
    text(c, 'STRIKE', x + half + 55, y + 18, F(800, 13), C.mute, 'center');
    cols.forEach((s, i) => { text(c, s, x + (i + 0.5) * half / 4, y + 48, F(600, 13), C.dim, 'center'); text(c, s, x + half + 110 + (i + 0.5) * half / 4, y + 48, F(600, 13), C.dim, 'center'); });
    strikes.forEach((k, i) => {
      const ry = y + 64 + i * rowH, itmC = k < spot, itmP = k > spot;
      if (itmC) { c.fillStyle = rgba(C.green, 0.07); c.fillRect(x, ry, half, rowH); }
      if (itmP) { c.fillStyle = rgba(C.red, 0.07); c.fillRect(x + half + 110, ry, half, rowH); }
      c.fillStyle = C.panel2; c.fillRect(x + half, ry, 110, rowH);
      const hl = o.hl != null && Math.abs(o.hl - i) < 0.5;
      if (hl) { c.strokeStyle = C.orange; c.lineWidth = 2; c.strokeRect(x + 1, ry + 1, w - 2, rowH - 2); }
      const tick = (j) => (hash(Math.floor(t * 4), i, j) - 0.5) * 0.06;
      const intrC = Math.max(0, spot - k), intrP = Math.max(0, k - spot), tv = 3.2 * Math.exp(-Math.abs(spot - k) / 18);
      const cb = intrC + tv + tick(1), pb = intrP + tv + tick(2), iv = 54 + Math.abs(spot - k) * 0.35, dC = clamp(0.5 + (spot - k) / 40, 0.03, 0.97);
      const cv = [cb.toFixed(2), (cb + 0.05).toFixed(2), iv.toFixed(1) + '%', dC.toFixed(2)], pv = [pb.toFixed(2), (pb + 0.05).toFixed(2), (iv + 1.2).toFixed(1) + '%', (dC - 1).toFixed(2)];
      cv.forEach((s, j) => text(c, s, x + (j + 0.5) * half / 4, ry + rowH / 2, M(600, 14), j < 2 ? C.ink : C.mute, 'center'));
      pv.forEach((s, j) => text(c, s, x + half + 110 + (j + 0.5) * half / 4, ry + rowH / 2, M(600, 14), j < 2 ? C.ink : C.mute, 'center'));
      text(c, k.toFixed(0), x + half + 55, ry + rowH / 2, M(800, 15), Math.abs(k - spot) < 3 ? C.orange : C.ink, 'center');
      c.strokeStyle = C.line; c.lineWidth = 1; c.beginPath(); c.moveTo(x, ry + rowH); c.lineTo(x + w, ry + rowH); c.stroke();
    });
    // spot line between strikes
    const si = strikes.findIndex((k) => k > spot), sy = y + 64 + si * rowH;
    c.strokeStyle = C.orange; c.lineWidth = 2; c.beginPath(); c.moveTo(x, sy); c.lineTo(x + w, sy); c.stroke();
    rr(c, x + half + 8, sy - 12, 94, 24, 12); c.fillStyle = C.orange; c.fill(); text(c, `SOL ${spot.toFixed(1)}`, x + half + 55, sy, M(800, 12), '#000', 'center');
  }

  function positions(c, x, y, w, h, t, o = {}) {
    const rows = o.rows ?? [['SOL', 'LONG', '10x', 2400, 171.20, 1], ['SOL 190C', 'CALL', '—', 12, 4.10, 2], ['JUP', 'LONG', '5x', 900, 0.82, 3], ['ETH', 'SHORT', '3x', 1500, 3120, 4], ['SOL 175P', 'PUT', '—', 8, 3.40, 5]];
    const heads = ['Market', 'Side', 'Lev', 'Size', 'Entry', 'Mark', 'PnL'], cx = [0, 0.2, 0.32, 0.43, 0.56, 0.7, 0.86].map((u) => x + 18 + u * (w - 36));
    heads.forEach((s, i) => text(c, s, cx[i], y + 18, F(600, 13), C.dim));
    const rowH = (h - 40) / rows.length;
    rows.forEach(([m, side, lev, size, entry, seed], i) => {
      const ry = y + 40 + i * rowH + rowH / 2, drift = Math.sin(t * 0.9 + seed) * 0.02 + 0.03 * (seed % 2 ? 1 : -0.4), mark = entry * (1 + drift);
      const longish = side === 'LONG' || side === 'CALL', pnl = (mark - entry) / entry * (longish ? 1 : -1) * size * (lev === '—' ? 6 : parseInt(lev));
      text(c, m, cx[0], ry, F(700, 15), C.ink);
      rr(c, cx[1] - 4, ry - 12, 58, 24, 5); c.fillStyle = rgba(longish ? C.green : C.red, 0.15); c.fill(); text(c, side, cx[1] + 25, ry, F(800, 12), longish ? C.green : C.red, 'center');
      text(c, lev, cx[2], ry, M(500, 14), C.mute); text(c, size.toLocaleString(), cx[3], ry, M(500, 14), C.ink);
      text(c, entry.toFixed(2), cx[4], ry, M(500, 14), C.mute); text(c, mark.toFixed(2), cx[5], ry, M(600, 14), C.ink);
      text(c, `${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toFixed(0)}`, cx[6], ry, M(800, 15), pnl >= 0 ? C.green : C.red);
      c.strokeStyle = C.line; c.beginPath(); c.moveTo(x, ry + rowH / 2); c.lineTo(x + w, ry + rowH / 2); c.stroke();
    });
  }

  function watchlist(c, x, y, w, h, t, o = {}) {
    const rows = o.rows ?? TRENDING, rowH = (h - 40) / rows.length;
    text(c, 'Token', x + 18, y + 18, F(600, 13), C.dim); text(c, 'Price', x + w * 0.62, y + 18, F(600, 13), C.dim, 'right'); text(c, '24h', x + w - 18, y + 18, F(600, 13), C.dim, 'right');
    rows.forEach(([n, p, ch], i) => {
      const ry = y + 40 + i * rowH + rowH / 2, col = ch >= 0 ? C.green : C.red;
      c.beginPath(); c.arc(x + 32, ry, 13, 0, TAU); c.fillStyle = `hsl(${(hash(i, 7) * 360) | 0},55%,45%)`; c.fill(); text(c, n[0], x + 32, ry + 1, F(800, 12), '#fff', 'center');
      text(c, n, x + 56, ry, F(700, 15), C.ink); text(c, p, x + w * 0.62, ry, M(500, 14), C.ink, 'right');
      // sparkline
      const sx = x + w * 0.66, sw = w * 0.14; c.beginPath();
      for (let k = 0; k <= 16; k++) { const v = Math.sin(k * 0.7 + i * 2 + t * 0.6) * 0.35 + (ch >= 0 ? k / 16 : -k / 16) * 0.6; const px = sx + sw * k / 16, py = ry - v * rowH * 0.3; k ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.strokeStyle = col; c.lineWidth = 1.6; c.stroke();
      text(c, pct(ch), x + w - 18, ry, M(700, 14), col, 'right');
      c.strokeStyle = C.line; c.beginPath(); c.moveTo(x, ry + rowH / 2); c.lineTo(x + w, ry + rowH / 2); c.stroke();
    });
  }

  // a bubble in Birdeye bubble-map style: dark core, coloured inner glow + rim
  function bubble(c, x, y, r, name, pctv, alpha = 1) {
    if (r < 2) return;
    const col = pctv >= 0 ? C.green : C.red;
    c.save(); c.globalAlpha *= alpha;
    const g = c.createRadialGradient(x, y, r * 0.35, x, y, r); g.addColorStop(0, rgba(pctv >= 0 ? '#0B2A16' : '#2A0B10', 1)); g.addColorStop(0.75, rgba(pctv >= 0 ? '#0E4A22' : '#4A0E18', 1)); g.addColorStop(1, rgba(col, 0.95));
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = g; c.fill();
    c.strokeStyle = rgba(col, 0.9); c.lineWidth = Math.max(1, r * 0.035); c.stroke();
    if (r > 26) { text(c, name, x, y - r * 0.08, F(800, Math.min(52, r * 0.36)), '#FFFFFF', 'center'); text(c, pct(pctv), x, y + r * 0.3, F(800, Math.min(34, r * 0.22)), '#FFFFFF', 'center'); }
    else if (r > 10) text(c, name, x, y, F(800, r * 0.42), '#FFFFFF', 'center');
    c.restore();
  }

  // top navigation bar exactly as on the site
  function topNav(c, x, y, w, h) {
    c.fillStyle = '#0B0B0B'; c.fillRect(x, y, w, h);
    c.strokeStyle = C.line; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w, y + h); c.stroke();
    wordmark(c, x + 18, y + h / 2, h * 0.5);
    let nx = x + h * 3.6;
    for (const n of NAV) {
      text(c, n, nx, y + h / 2, F(500, h * 0.26), C.ink); c.font = F(500, h * 0.26); const nw = c.measureText(n).width;
      if (n === 'Trackers' || n === 'Peak') { rr(c, nx + nw + 4, y + h / 2 - h * 0.2, h * 0.38, h * 0.18, 2); c.fillStyle = C.red; c.fill(); text(c, n === 'Peak' ? 'BETA' : 'NEW', nx + nw + 4 + h * 0.19, y + h / 2 - h * 0.11, F(800, h * 0.1), '#fff', 'center'); }
      nx += nw + h * 0.62 + (n === 'Trackers' || n === 'Peak' ? h * 0.4 : 0);
    }
    rr(c, x + w - h * 9.8, y + h * 0.2, h * 4.7, h * 0.6, 6); c.strokeStyle = C.orange; c.lineWidth = 1.5; c.stroke();
    text(c, 'Search tokens, traders...', x + w - h * 9.2, y + h / 2, F(400, h * 0.24), C.mute);
    rr(c, x + w - h * 3.6, y + h * 0.2, h * 3.4, h * 0.6, 6); c.fillStyle = C.panel2; c.fill(); text(c, '0xAd...A75e', x + w - h * 1.9, y + h / 2, F(600, h * 0.24), C.ink, 'center');
  }
  function chainBar(c, x, y, w, h, active = 0) {
    c.fillStyle = '#0D0D0D'; c.fillRect(x, y, w, h);
    const cw = w / CHAINS.length;
    CHAINS.forEach((n, i) => {
      if (i === active) { c.fillStyle = 'rgba(255,122,26,0.12)'; c.fillRect(x + i * cw, y, cw, h); }
      c.beginPath(); c.arc(x + i * cw + cw * 0.22, y + h / 2, h * 0.2, 0, TAU); c.fillStyle = ['#FF7A1A', '#14F195', '#C6F432', '#F3BA2F', '#2F6BFF', '#627EEA', '#1FD1A6', '#4A90E2', '#BDBDBD', '#836EF9'][i]; c.fill();
      text(c, n, x + i * cw + cw * 0.3, y + h / 2, F(700, h * 0.28), i === active ? C.orange : C.ink);
    });
  }

  return { betterNotSell, C, F, M, TAU, clamp, lerp, prog, io3, io5, o3, crit, pop, A, hash, rng, rgba, mk, rr, text, pct, series, birdMark, wordmark, coin, panel, candleChart, optionChain, positions, watchlist, bubble, topNav, chainBar, TRENDING, BUBBLES, TRADERS };
})();
