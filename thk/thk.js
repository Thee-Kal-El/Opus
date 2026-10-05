// THEE_KAL_EL — a YouTube creator poster that breaks out of its own frame. 1920x1080 @ 60fps, 10s.
// The poster is a window: things behind the glass (z > 0) only show inside the frame; anything that crosses
// in front of it (z < 0) is drawn unclipped. Kal steps out, his video thumbnails fly out, the glass shatters,
// and a Subscribe button gets clicked. Deterministic: renderAt(t) draws absolute time t.
(() => {
  'use strict';
  const W = 1920, H = 1080, FPS = 60, DUR = 10, TAU = Math.PI * 2, FL = 1300, BT = 0.5;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const COL = { red: '#FF1F3D', yt: '#FF0033', pink: '#FF2EA6', magenta: '#D21FFF', purple: '#7B2BFF', yellow: '#FFE14D', cyan: '#3DF2FF' };
  const SANS = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`;

  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const io3 = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const o3 = (p) => 1 - Math.pow(1 - p, 3);
  const crit = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const k = 7 * p; return (1 - (1 + k) * Math.exp(-k)) / (1 - 8 * Math.exp(-7)); };
  const pop = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const z = 0.55, w = 11, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * p) * (Math.cos(wd * p) + z / Math.sqrt(1 - z * z) * Math.sin(wd * p)); }; // punchy, one overshoot
  const A = (t, t0, d, f = crit) => f(prog(t, t0, t0 + d));
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = (a, b) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };

  // ---------- camera ----------
  let C = { x: 0, y: 0, z: -14 };
  function camera(t) {
    let z = -17.2 + 0.8 * A(t, 0, 2, o3) + 0.6 * A(t, 2.0, 0.35);           // slow push, punch-in on the breakout
    z -= 1.6 * A(t, 8.0, 0.9, io3);                                        // pull back for the end card
    const shake = Math.exp(-Math.max(0, t - 2.0) * 9) * (t >= 2.0 ? 1 : 0);
    return { x: 0.25 * Math.sin(t * 0.7) + (hash(Math.round(t * 60), 1) - 0.5) * 0.12 * shake, y: 0.15 * Math.sin(t * 0.5) + (hash(Math.round(t * 60), 2) - 0.5) * 0.12 * shake, z };
  }
  const P = (x, y, z) => { const d = z - C.z; return [W / 2 + (x - C.x) * FL / d, H / 2 - (y - C.y) * FL / d, FL / d]; };
  const WIN = { x0: -3, x1: 3, y0: -4.2, y1: 4.2 }, FR = 0.3;

  // ---------- assets ----------
  const IMG = {};
  const load = (k, src) => { const im = new Image(); im.src = src; return im.decode().then(() => { IMG[k] = im; }); };
  const TEX = {};
  const CARDS = [
    { k: 'limewire_back', w: 3.9, x: -5.6, y: 2.45, z: -3.6, r: -0.06 },
    { k: 'snakepot', w: 3.3, x: 5.7, y: 2.55, z: -3.4, r: 0.05 },
    { k: 'cypher', w: 3.1, x: -6.0, y: -0.3, z: -2.8, r: 0.04 },
    { k: 'protonmail', w: 3.1, x: 6.0, y: -0.2, z: -3.0, r: -0.05 },
    { k: 'damnbruh', w: 3.1, x: -5.6, y: -3.0, z: -3.2, r: -0.03 },
    { k: 'limewire_merch', w: 3.1, x: 5.7, y: -3.0, z: -3.6, r: 0.04 },
  ];
  // ?shorts=1 adds the vertical Shorts cards (outer columns, partly cropped by the screen edge)
  const WITH_SHORTS = /[?&]shorts=1\b/.test(location.search);
  const SHORTS = WITH_SHORTS ? [
    { k: 'short_solana_dapps', w: 2.2, x: -7.5, y: 1.05, z: -4.4, r: -0.07 },
    { k: 'short_ags', w: 2.2, x: 7.5, y: 1.15, z: -4.4, r: 0.07 },
    { k: 'short_solana_house', w: 2.2, x: -7.3, y: -2.55, z: -4.6, r: 0.05 },
    { k: 'short_bumper', w: 2.2, x: 7.3, y: -2.45, z: -4.6, r: -0.05 },
  ] : [];
  const CHIPS = [['SOLANA', ['#9945FF', '#14F195'], -3.7, 4.35, -1.0], ['POLYGON', ['#7B3FE4', '#A46BFF'], 3.75, 4.05, -1.2], ['AVALANCHE', ['#E84142', '#FF7A6B'], -3.85, -4.15, -1.0], ['ETHEREUM', ['#3C3C9D', '#8A92B2'], 3.9, -3.95, -1.1]];
  function roundedCard(im, w) {
    const h = Math.round(w * im.naturalHeight / im.naturalWidth), c = mk(w + 24, h + 24), g = c.getContext('2d');
    g.save(); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 16; g.shadowOffsetY = 6; g.beginPath(); g.roundRect(12, 12, w, h, 16); g.fillStyle = '#000'; g.fill(); g.restore();
    g.save(); g.beginPath(); g.roundRect(12, 12, w, h, 16); g.clip(); g.drawImage(im, 12, 12, w, h); g.restore();
    g.beginPath(); g.roundRect(12.5, 12.5, w - 1, h - 1, 16); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.stroke();
    return c;
  }
  function build() {
    // poster art behind the glass: red → magenta → purple like the channel banner, laser grid, hexagon glow
    const pa = mk(1200, 1680), g = pa.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 1680); gr.addColorStop(0, '#2A0034'); gr.addColorStop(0.45, '#7A0E8E'); gr.addColorStop(0.7, '#B0124F'); gr.addColorStop(1, '#22001E');
    g.fillStyle = gr; g.fillRect(0, 0, 1200, 1680);
    const hx = 600, hy = 760, hr = 520;
    g.save(); g.shadowColor = COL.magenta; g.shadowBlur = 80; g.lineWidth = 26; g.strokeStyle = 'rgba(232,90,255,0.85)';
    g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * TAU / 6; i ? g.lineTo(hx + Math.cos(a) * hr, hy + Math.sin(a) * hr) : g.moveTo(hx + Math.cos(a) * hr, hy + Math.sin(a) * hr); } g.closePath(); g.stroke();
    g.fillStyle = 'rgba(80,0,120,0.55)'; g.fill(); g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [y, a] of [[620, 0.7], [700, 0.45], [980, 0.5]]) { const lg = g.createLinearGradient(0, 0, 1200, 0); lg.addColorStop(0, 'rgba(255,120,255,0)'); lg.addColorStop(0.5, `rgba(255,190,255,${a})`); lg.addColorStop(1, 'rgba(255,120,255,0)'); g.fillStyle = lg; g.save(); g.translate(600, y); g.rotate(-0.18); g.fillRect(-700, -3, 1400, 6); g.restore(); }
    g.restore();
    g.strokeStyle = 'rgba(255,60,200,0.55)'; g.lineWidth = 3;
    for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(600 + i * 30, 1250); g.lineTo(600 + i * 190, 1680); g.stroke(); }
    for (let k = 0; k < 9; k++) { const y = 1250 + Math.pow(k / 8, 2) * 430; g.beginPath(); g.moveTo(0, y); g.lineTo(1200, y); g.stroke(); }
    TEX.poster = pa;
    // title: YouTube-thumbnail type — chunky, outlined, hard drop shadow, red ribbon underneath
    const tt = mk(1500, 520), t2 = tt.getContext('2d');
    t2.translate(750, 220); t2.transform(1, 0, -0.14, 1, 0, 0);
    t2.font = SANS(900, 210); t2.textAlign = 'center'; t2.textBaseline = 'middle'; t2.letterSpacing = '-6px'; t2.lineJoin = 'round';
    t2.fillStyle = '#000'; t2.fillText('THEE_KAL_EL', 14, 16);
    t2.strokeStyle = '#000'; t2.lineWidth = 34; t2.strokeText('THEE_KAL_EL', 0, 0);
    t2.strokeStyle = COL.pink; t2.lineWidth = 12; t2.strokeText('THEE_KAL_EL', 0, 0);
    const tg = t2.createLinearGradient(0, -90, 0, 90); tg.addColorStop(0, '#FFFFFF'); tg.addColorStop(0.55, '#FFF3A3'); tg.addColorStop(1, COL.yellow);
    t2.fillStyle = tg; t2.fillText('THEE_KAL_EL', 0, 0);
    t2.setTransform(1, 0, 0, 1, 0, 0);
    t2.save(); t2.translate(750, 420); t2.transform(1, 0, -0.2, 1, 0, 0);
    t2.fillStyle = '#000'; t2.fillRect(-520 + 10, -52 + 10, 1040, 104); t2.fillStyle = COL.red; t2.fillRect(-520, -52, 1040, 104);
    t2.font = SANS(850, 62); t2.fillStyle = '#FFFFFF'; t2.textAlign = 'center'; t2.textBaseline = 'middle'; t2.letterSpacing = '3px'; t2.fillText('WEB3 · CRYPTO · PLAY-TO-EARN', 0, 4);
    t2.restore();
    TEX.title = tt;
    for (const cd of CARDS) TEX[cd.k] = roundedCard(IMG[cd.k], 600);
    for (const cd of SHORTS) TEX[cd.k] = roundedCard(IMG[cd.k], 360);
    TEX.chips = CHIPS.map(([s, [a, b]]) => {
      const c = mk(560, 130), g2 = c.getContext('2d'); g2.font = SANS(850, 54); g2.letterSpacing = '4px';
      const w = Math.min(540, g2.measureText(s).width + 90), x0 = (560 - w) / 2;
      const lg = g2.createLinearGradient(x0, 0, x0 + w, 0); lg.addColorStop(0, a); lg.addColorStop(1, b);
      g2.save(); g2.shadowColor = 'rgba(0,0,0,0.5)'; g2.shadowBlur = 14; g2.shadowOffsetY = 6; g2.beginPath(); g2.roundRect(x0, 15, w, 96, 48); g2.fillStyle = lg; g2.fill(); g2.restore();
      g2.beginPath(); g2.roundRect(x0 + 2, 17, w - 4, 92, 46); g2.strokeStyle = 'rgba(255,255,255,0.6)'; g2.lineWidth = 3; g2.stroke();
      g2.fillStyle = '#FFFFFF'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(s, 280, 65);
      return c;
    });
    // portrait with soft fade at the very bottom, plus a dark silhouette for its shadow on the poster
    const pi = IMG.portrait, pc = mk(pi.naturalWidth, pi.naturalHeight), pg = pc.getContext('2d');
    pg.drawImage(pi, 0, 0);
    TEX.portrait = pc;
    const sc = mk(pi.naturalWidth, pi.naturalHeight), sg = sc.getContext('2d'); sg.drawImage(pi, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#12001A'; sg.fillRect(0, 0, sc.width, sc.height);
    TEX.shadow = sc;
  }

  // ---------- environment (outside the poster) ----------
  const STREAKS = [[-0.16, 0.3, 0.7], [-0.12, 0.62, 0.5], [0.1, 0.78, 0.4]];
  function environment(c, t) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0B0016'); g.addColorStop(0.55, '#2B0646'); g.addColorStop(1, '#14001F');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // big hexagon glow behind the poster (from the socials card)
    const [hx, hy, s] = P(0, 0.2, 6), r = 6.4 * s;
    c.save(); c.globalCompositeOperation = 'lighter';
    const rg = c.createRadialGradient(hx, hy, 0, hx, hy, r * 1.4); rg.addColorStop(0, 'rgba(190,40,255,0.35)'); rg.addColorStop(1, 'rgba(190,40,255,0)');
    c.fillStyle = rg; c.fillRect(0, 0, W, H);
    c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * TAU / 6; i ? c.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r) : c.moveTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r); } c.closePath();
    c.strokeStyle = 'rgba(210,60,255,0.18)'; c.lineWidth = 40; c.stroke(); c.strokeStyle = 'rgba(240,120,255,0.55)'; c.lineWidth = 6; c.stroke();
    // light streaks
    for (const [rot, yy, a] of STREAKS) { const sh = 0.75 + 0.25 * Math.sin(t * 2 + yy * 9); c.save(); c.translate(W / 2, H * yy); c.rotate(rot); const lg = c.createLinearGradient(-W, 0, W, 0); lg.addColorStop(0, 'rgba(255,120,255,0)'); lg.addColorStop(0.5, `rgba(255,200,255,${a * sh})`); lg.addColorStop(1, 'rgba(255,120,255,0)'); c.fillStyle = lg; c.fillRect(-W, -2, 2 * W, 4); c.restore(); }
    c.restore();
    // laser grid floor scrolling toward the viewer
    const hz = 700;
    c.save(); c.beginPath(); c.rect(0, hz, W, H - hz); c.clip();
    const fg = c.createLinearGradient(0, hz, 0, H); fg.addColorStop(0, 'rgba(40,0,60,0)'); fg.addColorStop(1, 'rgba(20,0,30,0.6)'); c.fillStyle = fg; c.fillRect(0, hz, W, H - hz);
    c.strokeStyle = 'rgba(255,50,200,0.55)'; c.lineWidth = 2;
    for (let i = -24; i <= 24; i++) { c.beginPath(); c.moveTo(W / 2 + i * 40, hz); c.lineTo(W / 2 + i * 260, H); c.stroke(); }
    const sp = (t * 0.9) % 1;
    for (let k = 0; k < 12; k++) { const z = (k + sp) / 12, y = hz + Math.pow(z, 2.3) * (H - hz); c.globalAlpha = z; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.restore();
  }

  // ---------- the poster ----------
  function windowRect(grow = 0) { const a = P(WIN.x0 - grow, WIN.y1 + grow, 0), b = P(WIN.x1 + grow, WIN.y0 - grow, 0); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; }
  const SHATTER = 2.0;
  function portraitState(t) {
    const k = A(t, 2.0, 0.6);
    return { x: lerp(0, 0.15, k), y: lerp(-4.65, -3.15, k), z: lerp(0.8, -2.4, k), h: 7.0 * lerp(1, 1.1, k), k };
  }
  function drawPortrait(c, t, st, alpha = 1) {
    const [px, py, s] = P(st.x, st.y, st.z), h = st.h * s, w = h * TEX.portrait.width / TEX.portrait.height;
    c.save(); c.globalAlpha *= alpha; c.drawImage(TEX.portrait, px - w / 2, py - h, w, h); c.restore();
  }
  function posterInside(c, t) {
    const [x, y, w, h] = windowRect(0);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    // art plane sits deeper than the glass, so it parallaxes against the frame
    const [ax, ay, s] = P(0, 0, 3), aw = 7.4 * s, ah = aw * 1680 / 1200;
    c.drawImage(TEX.poster, ax - aw / 2, ay - ah / 2, aw, ah);
    const st = portraitState(t);
    // his shadow on the poster once he steps out
    if (st.k > 0) { const [sx, sy, ss] = P(st.x + 0.5, st.y - 0.2, 0.6), sh = st.h * ss, sw = sh * TEX.shadow.width / TEX.shadow.height; c.save(); c.globalAlpha = 0.55 * st.k; c.filter = 'blur(14px)'; c.drawImage(TEX.shadow, sx - sw / 2, sy - sh, sw, sh); c.restore(); }
    if (st.z > 0) drawPortrait(c, t, st);
    // glass sheen until it shatters
    if (t < SHATTER) { const lg = c.createLinearGradient(x, y, x + w, y + h); lg.addColorStop(0, 'rgba(255,255,255,0.10)'); lg.addColorStop(0.45, 'rgba(255,255,255,0.02)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.12)'); lg.addColorStop(0.56, 'rgba(255,255,255,0.02)'); lg.addColorStop(1, 'rgba(255,255,255,0.06)'); c.fillStyle = lg; c.fillRect(x, y, w, h); }
    // channel strap on the glass
    const sa = 1 - A(t, 1.9, 0.2, io3);
    if (sa > 0.01) { const [bx, by, bs] = P(0, -3.85, 0); c.globalAlpha = sa; c.font = SANS(800, Math.round(bs * 0.26)); c.textAlign = 'center'; c.letterSpacing = `${bs * 0.03}px`; c.fillStyle = '#FFFFFF'; c.shadowColor = '#000'; c.shadowBlur = 8; c.fillText('SHOWING YOU THE LATEST PROJECTS', bx, by); c.globalAlpha = 1; c.shadowBlur = 0; }
    c.restore();
  }
  function frame(c, t) {
    const fl = t > 1.88 && t < 2.0 ? (hash(Math.floor(t * 40), 7) < 0.5 ? 0.3 : 1) : 1;
    const [x, y, w, h] = windowRect(0), [X, Y, Wd, Hd] = windowRect(FR), s = P(0, 0, 0)[2];
    c.save();
    c.beginPath(); c.rect(X, Y, Wd, Hd); c.rect(x, y, w, h); c.fillStyle = '#0E0014'; c.fill('evenodd');
    c.globalCompositeOperation = 'lighter';
    for (const [rx, ry, rw, rh, col, lw] of [[X, Y, Wd, Hd, COL.pink, 0.07], [x, y, w, h, '#FFFFFF', 0.025]]) {
      c.beginPath(); c.rect(rx, ry, rw, rh);
      c.strokeStyle = rgba(col, 0.18 * fl); c.lineWidth = s * lw * 5; c.stroke(); c.strokeStyle = rgba(col, 0.9 * fl); c.lineWidth = s * lw; c.stroke();
    }
    c.restore();
    // red play badge on the frame corner
    const [bx, by, bs] = P(WIN.x1 - 0.1, WIN.y1 + 0.05, 0), bw = 0.95 * bs, bh = 0.66 * bs;
    c.save(); c.translate(bx, by); c.rotate(0.12); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 12;
    c.beginPath(); c.roundRect(-bw / 2, -bh / 2, bw, bh, bh * 0.28); c.fillStyle = COL.yt; c.fill(); c.shadowBlur = 0;
    c.beginPath(); c.moveTo(-bw * 0.12, -bh * 0.24); c.lineTo(bw * 0.2, 0); c.lineTo(-bw * 0.12, bh * 0.24); c.closePath(); c.fillStyle = '#FFF'; c.fill(); c.restore();
  }

  // ---------- breakout elements ----------
  const SHARDS = (() => { const r = rng(17); return Array.from({ length: 34 }, () => { const x = lerp(-2.9, 2.9, r()), y = lerp(-4.1, 4.1, r()); return { x, y, vx: x * 0.9 + (r() - 0.5) * 2, vy: y * 0.35 + 1.5 + r() * 2.5, vz: -(6 + r() * 7), s: 0.25 + r() * 0.6, rot: r() * TAU, vr: (r() - 0.5) * 10, pts: [0, 1, 2].map((i) => [Math.cos(i * TAU / 3 + r()) * (0.6 + r() * 0.5), Math.sin(i * TAU / 3 + r()) * (0.6 + r() * 0.5)]) }; }); })();
  function shards(c, t, items) {
    const lt = t - SHATTER; if (lt < 0 || lt > 1.4) return;
    for (const sh of SHARDS) {
      const x = sh.x + sh.vx * lt, y = sh.y + sh.vy * lt - 5 * lt * lt, z = sh.vz * lt;
      if (z - C.z < 1) continue;
      items.push([z, () => {
        const [px, py, s] = P(x, y, z), a = clamp(1 - lt / 1.4);
        c.save(); c.translate(px, py); c.rotate(sh.rot + sh.vr * lt); c.beginPath();
        sh.pts.forEach(([u, v], i) => (i ? c.lineTo(u * sh.s * s, v * sh.s * s) : c.moveTo(u * sh.s * s, v * sh.s * s))); c.closePath();
        c.fillStyle = `rgba(255,220,255,${0.12 * a})`; c.fill(); c.strokeStyle = `rgba(255,255,255,${0.75 * a})`; c.lineWidth = 1.5; c.stroke(); c.restore();
      }]);
    }
  }
  const cardStart = (cd, i) => (cd.short ? 4.0 + i * 0.25 : 2.5 + i * 0.25);
  function cardState(cd, i, t) {
    const t0 = cardStart(cd, i), k = A(t, t0, 0.65);
    const bob = Math.sin(t * 1.6 + i * 1.1) * 0.07 * k;
    // arc out of the poster: starts small behind Kal, swings through the glass to its spot
    const arc = Math.sin(Math.PI * k) * 0.8;
    return { x: lerp(0, cd.x, k), y: lerp(0.4, cd.y, k) + arc * (cd.y > 0 ? 0.6 : -0.6) + bob, z: lerp(1.6, cd.z, k), r: lerp(cd.r * 3, cd.r, k) + Math.sin(t * 1.2 + i) * 0.015 * k, w: cd.w * lerp(0.5, 1, k), a: clamp(prog(t, t0, t0 + 0.12)) };
  }
  function drawCard(c, cd, st) {
    const tex = TEX[cd.k], [px, py, s] = P(st.x, st.y, st.z), w = st.w * s * tex.width / (cd.short ? 360 : 600), h = w * tex.height / tex.width;
    c.save(); c.globalAlpha *= st.a; c.translate(px, py); c.rotate(st.r); c.drawImage(tex, -w / 2, -h / 2, w, h); c.restore();
  }
  // the title swoops off the top of the poster and lands in front of his shirt, thumbnail-style, face kept clear
function titleState(t) { const k = A(t, 2.2, 0.75); return { y: lerp(3.25, -1.95, k) + Math.sin(Math.PI * k) * 0.9, z: lerp(-0.01, -3.1, k), k, r: Math.sin(Math.PI * k) * -0.08 }; }
  function drawTitle(c, st) {
    const [px, py, s] = P(0, st.y, st.z), w = 5.7 * s, h = w * 520 / 1500;
    c.save(); c.translate(px, py); c.rotate(st.r); c.drawImage(TEX.title, -w / 2, -h / 2, w, h); c.restore();
  }
  function chips(c, t, items) {
    CHIPS.forEach(([, , x, y, z], i) => {
      const k = pop(prog(t, 4.5 + i * 0.25, 4.5 + i * 0.25 + 0.55)); if (k <= 0) return;
      const yy = y + Math.sin(t * 1.4 + i * 2) * 0.05;
      items.push([z, () => { const [px, py, s] = P(x, yy, z), w = 2.4 * s * k, h = w * 130 / 560; c.save(); c.globalAlpha = clamp(k * 3); c.translate(px, py); c.rotate((i % 2 ? 1 : -1) * 0.06); c.drawImage(TEX.chips[i], -w / 2, -h / 2, w, h); c.restore(); }]);
    });
  }
  // Subscribe button + cursor click
  const SUB = { x: 0, y: -3.85, z: -3.2 };
  function subscribe(c, t) {
    const k = pop(prog(t, 6.0, 6.6)); if (k <= 0) return;
    const [px, py, s] = P(SUB.x, SUB.y, SUB.z);
    const press = 1 - 0.07 * Math.sin(Math.PI * prog(t, 7.0, 7.18)), done = t >= 7.06;
    const w = 4.1 * s, h = 0.86 * s;
    c.save(); c.translate(px, py); c.scale(k * press, k * press);
    c.shadowColor = done ? 'rgba(0,0,0,0.5)' : 'rgba(255,0,51,0.7)'; c.shadowBlur = done ? 20 : 40;
    c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, h / 2); c.fillStyle = done ? '#2A2A2E' : COL.yt; c.fill(); c.shadowBlur = 0;
    c.beginPath(); c.roundRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, h / 2); c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.stroke();
    // bell (rings after the click)
    const ring = done ? Math.sin((t - 7.06) * 30) * Math.exp(-(t - 7.06) * 5) * 0.5 : 0;
    c.save(); c.translate(-w / 2 + h * 0.62, 0); c.rotate(ring); const b = h * 0.3;
    c.beginPath(); c.moveTo(-b, b * 0.55); c.quadraticCurveTo(-b * 0.85, -b * 0.95, 0, -b); c.quadraticCurveTo(b * 0.85, -b * 0.95, b, b * 0.55); c.closePath(); c.fillStyle = '#FFF'; c.fill();
    c.beginPath(); c.arc(0, b * 0.75, b * 0.2, 0, TAU); c.fill(); c.restore();
    c.font = SANS(850, Math.round(h * 0.42)); c.fillStyle = '#FFF'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = `${h * 0.03}px`;
    c.fillText(done ? 'SUBSCRIBED  ✓' : 'SUBSCRIBE', h * 0.42, 2);
    c.restore();
    // +1 burst after the click
    const pk = prog(t, 7.06, 7.7);
    if (pk > 0 && pk < 1) { c.save(); c.globalAlpha = 1 - pk; c.font = SANS(900, Math.round(h * 0.5)); c.fillStyle = COL.yellow; c.strokeStyle = '#000'; c.lineWidth = 6; c.textAlign = 'center'; const yy = py - h * (0.8 + pk * 1.4); c.strokeText('+1', px + w * 0.42, yy); c.fillText('+1', px + w * 0.42, yy); c.restore(); }
    // cursor glides in and clicks
    const mk2 = io3(prog(t, 6.35, 6.95)), out = io3(prog(t, 7.4, 7.9));
    if (t > 6.35 && out < 1) {
      const cx = lerp(W * 0.86, px + w * 0.18, mk2) + out * 260, cy = lerp(H * 1.05, py + h * 0.1, mk2) + out * 160;
      const cs = 1.4 * (1 - 0.12 * Math.sin(Math.PI * prog(t, 7.0, 7.18)));
      c.save(); c.translate(cx, cy); c.scale(cs, cs);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 34); c.lineTo(9, 26); c.lineTo(15, 40); c.lineTo(21, 37); c.lineTo(15, 24); c.lineTo(26, 24); c.closePath();
      c.fillStyle = '#FFF'; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke(); c.restore();
      if (t >= 7.0 && t < 7.35) { const rk = prog(t, 7.0, 7.35); c.save(); c.strokeStyle = `rgba(255,255,255,${1 - rk})`; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 10 + rk * 40, 0, TAU); c.stroke(); c.restore(); }
    }
  }
  // end card: channel URL pill at the top
  function endCard(c, t) {
    const k = A(t, 8.3, 0.5); if (k <= 0) return;
    const y = 74 - (1 - k) * 40;
    c.save(); c.globalAlpha = k;
    c.font = SANS(800, 34); c.letterSpacing = '1px'; const label = 'youtube.com/@Thee_Kal_El', tw = c.measureText(label).width, w = tw + 110, x = W / 2 - w / 2;
    c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 20; c.beginPath(); c.roundRect(x, y - 34, w, 68, 34); c.fillStyle = '#FFFFFF'; c.fill(); c.shadowBlur = 0;
    c.beginPath(); c.roundRect(x + 16, y - 17, 48, 34, 9); c.fillStyle = COL.yt; c.fill();
    c.beginPath(); c.moveTo(x + 34, y - 9); c.lineTo(x + 50, y); c.lineTo(x + 34, y + 9); c.closePath(); c.fillStyle = '#FFF'; c.fill();
    c.fillStyle = '#0F0F0F'; c.textBaseline = 'middle'; c.fillText(label, x + 80, y + 2);
    c.restore();
  }

  // ---------- frame ----------
  function renderAt(t) {
    t = clamp(t, 0, DUR); C = camera(t);
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.shadowBlur = 0;
    environment(c, t);
    // elements still behind the glass (inside the poster)
    const behind = [], front = [];
    CARDS.forEach((cd, i) => { if (t < cardStart(cd, i)) return; const st = cardState(cd, i, t); (st.z > 0 ? behind : front).push([st.z, () => drawCard(c, cd, st)]); });
    SHORTS.forEach((sd, i) => { const cd = { ...sd, short: true }; if (t < cardStart(cd, i)) return; const st = cardState(cd, i, t); (st.z > 0 ? behind : front).push([st.z, () => drawCard(c, cd, st)]); });
    posterInside(c, t);
    { const [x, y, w, h] = windowRect(0); c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); behind.sort((a, b) => b[0] - a[0]).forEach(([, f]) => f()); c.restore(); }
    frame(c, t);
    // in front of the glass
    const ps = portraitState(t);
    if (ps.z <= 0) {
      const [, wy] = P(0, WIN.y0, 0);
      front.push([ps.z, () => { c.save(); c.beginPath(); c.rect(0, 0, W, wy); c.clip(); drawPortrait(c, t, ps); c.restore(); }]); // his lower body stays inside the frame
    }
    const ts = titleState(t); front.push([ts.z, () => drawTitle(c, ts)]);
    shards(c, t, front); chips(c, t, front);
    front.sort((a, b) => b[0] - a[0]).forEach(([, f]) => f());
    subscribe(c, t);
    // flash on the shatter
    const fl = t >= SHATTER ? 0.55 * Math.exp(-(t - SHATTER) * 14) : 0;
    if (fl > 0.01) { c.fillStyle = `rgba(255,220,255,${fl})`; c.fillRect(0, 0, W, H); }
    const v = c.createRadialGradient(W / 2, H / 2, 520, W / 2, H / 2, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    endCard(c, t);
  }

  window.THK = { W, H, FPS, DUR, renderAt };
  window.THK.ready = Promise.all([
    document.fonts.load(SANS(900, 40)), document.fonts.load(SANS(800, 40)),
    load('portrait', '../assets/portrait.png'),
    ...CARDS.map((cd) => load(cd.k, `../assets/yt/${cd.k}.png`)),
    ...SHORTS.map((cd) => load(cd.k, `../assets/yt/${cd.k}.png`)),
  ]).then(build);
  if (!/[?&]render\b/.test(location.search)) {
    window.THK.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
  }
})();
