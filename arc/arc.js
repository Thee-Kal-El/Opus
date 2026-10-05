// VISIT ARCTOWN — a poster that breaks out of its own frame. 1920x1080 @ 60fps, 10s.
// The poster hangs on a neon skyscraper wall, but it's really a window into a 3D ArcTown street.
// Everything behind the wall plane (z > 0) is only visible through the frame; anything that crosses
// in front of the plane (z < 0) is drawn unclipped. That's the breakout: the city literally comes through.
// Deterministic: renderAt(t) draws the frame at absolute time t (open index.html to preview live).
(() => {
  'use strict';
  const W = 1920, H = 1080, FPS = 60, DUR = 10, TAU = Math.PI * 2, FL = 1300, NEAR = 0.35;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  const COL = { cyan: '#2EF2FF', pink: '#FF3FD8', purple: '#9B6BFF', yellow: '#FFE45C', warm: '#FFC86B', sky0: '#140A33', sky1: '#4B2385', sky2: '#B4609F' };
  const FONT = { neon: (s) => `400 ${s}px "Tilt Neon", sans-serif`, sans: (w, s) => `${w} ${s}px Geist, sans-serif` };

  // ---------- math ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const io3 = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const o3 = (p) => 1 - Math.pow(1 - p, 3);
  const crit = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const k = 7 * p; return (1 - (1 + k) * Math.exp(-k)) / (1 - 8 * Math.exp(-7)); };
  const A = (t, t0, d, f = crit) => f(prog(t, t0, t0 + d));
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = (a, b) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };

  // ---------- textures ----------
  const NEONS = [COL.cyan, COL.pink, COL.purple, COL.yellow];
  function brickTex(seed) { // 4 x 8 world units -> 256 x 512
    const c = mk(256, 512), g = c.getContext('2d'), r = rng(seed);
    g.fillStyle = ['#4A3328', '#3F2C2A', '#4B3530'][seed % 3]; g.fillRect(0, 0, 256, 512);
    g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < 512; y += 10) g.fillRect(0, y, 256, 1.5);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 2; col++) {
      const x = 28 + col * 128, y = 22 + row * 128, lit = r() < 0.8;
      g.fillStyle = '#1A1210'; g.fillRect(x - 4, y - 4, 80, 96);
      const gr = g.createLinearGradient(0, y, 0, y + 88); gr.addColorStop(0, lit ? '#FFE3A1' : '#2B2230'); gr.addColorStop(1, lit ? '#F2A84C' : '#1C1622');
      g.fillStyle = gr; g.fillRect(x, y, 72, 88);
      g.fillStyle = '#1A1210'; g.fillRect(x + 34, y, 4, 88); g.fillRect(x, y + 42, 72, 4);
    }
    return c;
  }
  function towerTex(seed) { // 4 x 16 world units -> 256 x 1024, dense multicolour lit windows
    const c = mk(256, 1024), g = c.getContext('2d'), r = rng(seed * 7 + 1);
    g.fillStyle = ['#17112B', '#1B1430', '#141026'][seed % 3]; g.fillRect(0, 0, 256, 1024);
    const pal = ['#FFE8B0', '#FFD36B', '#FFB2E6', '#9FF3FF', '#FFFFFF', '#FF9E6B'];
    for (let y = 6; y < 1024; y += 13) for (let x = 6; x < 256; x += 11) {
      if (r() < 0.62) { g.fillStyle = pal[(r() * pal.length) | 0]; g.globalAlpha = 0.55 + r() * 0.45; g.fillRect(x, y, 6, 8); }
    }
    g.globalAlpha = 1; return c;
  }
  function wallTex() { // the facade the poster hangs on: big lit windows in a dark skin, 512px = 6 world units
    const c = mk(512, 512), g = c.getContext('2d'), r = rng(99);
    g.fillStyle = '#120C24'; g.fillRect(0, 0, 512, 512);
    const pal = ['#FFE8B0', '#FFD36B', '#FFB2E6', '#9FF3FF', '#FFFFFF'];
    for (let y = 8; y < 512; y += 32) for (let x = 8; x < 512; x += 24) {
      if (r() < 0.55) { g.fillStyle = pal[(r() * pal.length) | 0]; g.globalAlpha = 0.25 + r() * 0.55; g.fillRect(x, y, 13, 20); }
      else { g.fillStyle = '#1C1533'; g.globalAlpha = 1; g.fillRect(x, y, 13, 20); }
    }
    g.globalAlpha = 1; return c;
  }
  function signTex(lines, w, h, o = {}) {
    const c = mk(w, h), g = c.getContext('2d');
    if (o.panel) {
      g.fillStyle = 'rgba(14,8,30,0.92)'; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 18); g.fill();
      g.shadowColor = o.edge || COL.pink; g.shadowBlur = 24; g.strokeStyle = o.edge || COL.pink; g.lineWidth = 6; g.stroke(); g.shadowBlur = 0;
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.stroke();
    }
    for (const L of lines) {
      g.font = L.font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = (L.ls || 0) + 'px';
      for (const [blur, col, a] of [[40, L.glow, 1], [16, L.glow, 1], [0, L.core || '#FFFFFF', 1]]) {
        g.shadowColor = col; g.shadowBlur = blur; g.globalAlpha = a; g.fillStyle = blur ? L.glow : (L.core || '#FFFFFF'); g.fillText(L.text, L.x ?? w / 2, L.y);
      }
      g.shadowBlur = 0; g.globalAlpha = 1;
    }
    return c;
  }

  // ---------- world (built once, deterministic) ----------
  const R = rng(2026);
  const TEX = {};
  const BOXES = [], LAMPS = [], CUBES = [], BANNERS = [];
  function buildWorld() {
    TEX.brick = [0, 1, 2].map(brickTex); TEX.tower = [0, 1, 2].map(towerTex); TEX.wall = wallTex();
    // near street buildings, both sides, hugging the road so they cross the frame plane as the city pushes out
    for (const side of [-1, 1]) {
      let z = 1 + R() * 1.5;
      while (z < 92) {
        const len = 3.2 + R() * 3.5, dep = 2.6 + R() * 2.4, near = z < 26, h = near ? 3.0 + R() * 2.6 : 4.2 + R() * 4.6, tall = !near && R() < 0.3;
        const xin = side * (2.7 + R() * 0.3), xout = xin + side * dep;
        BOXES.push({ x0: Math.min(xin, xout), x1: Math.max(xin, xout), z0: z, z1: z + len, h: tall ? h * 1.8 : h, side, kind: tall ? 'tower' : 'brick', tex: (R() * 3) | 0, neon: NEONS[(R() * 4) | 0] });
        z += len + 0.8 + R() * 1.6;
      }
    }
    // skyline: tall dot-window towers behind the street
    for (let i = 0; i < 70; i++) {
      const side = i % 2 ? 1 : -1, z = 14 + R() * 140, x = side * (7 + R() * 26), w = 3 + R() * 6, d = 3 + R() * 6, h = 16 + R() * 46;
      BOXES.push({ x0: x - w / 2, x1: x + w / 2, z0: z, z1: z + d, h, side, kind: 'tower', tex: (R() * 3) | 0, neon: NEONS[(R() * 4) | 0], sky: true });
    }
    // ARC tower + town hall at the end of the avenue
    BOXES.push({ x0: -2.6, x1: 2.6, z0: 101, z1: 106, h: 30, side: 0, kind: 'arc', neon: COL.cyan });
    BOXES.push({ x0: -5, x1: 5, z0: 97, z1: 101, h: 4.6, side: 0, kind: 'hall', neon: COL.cyan });
    for (let z = 3; z < 92; z += 7.5) for (const side of [-1, 1]) LAMPS.push({ x: side * 2.35, z });
    [[-1.3, 6.4, 9, COL.pink], [1.5, 7.2, 13, COL.cyan], [-0.6, 8.1, 19, COL.purple], [1.0, 5.6, 6, COL.pink], [-1.8, 7.6, 25, COL.cyan], [0.4, 9.0, 31, COL.yellow]].forEach(([x, y, z, col], i) => CUBES.push({ x, y, z, col, i, s: 0.42 + (i % 3) * 0.1 }));
    TEX.title = signTex([
      { text: 'Visit', font: FONT.neon(170), glow: COL.pink, y: 150 },
      { text: 'ArcTown', font: FONT.neon(290), glow: COL.cyan, y: 380 },
    ], 1300, 560);
    [['EXPLORE PROJECTS', COL.cyan, 18], ['OWN A BUILDING', COL.pink, 31], ['HANG OUT IN ARCTOWN', COL.yellow, 44]].forEach(([s, col, z]) => {
      BANNERS.push({ z, tex: signTex([{ text: s, font: FONT.neon(96), glow: col, y: 128, ls: 4 }], 1200, 256, { panel: true, edge: col }) });
    });
    TEX.arcSign = signTex([{ text: 'ARC', font: FONT.neon(200), glow: COL.cyan, y: 150 }], 520, 300, { panel: true, edge: COL.cyan });
  }

  // ---------- choreography ----------
  // 0–2   the poster: a window into ArcTown, parallax drift
  // 2–3.6 breakout: the city pushes through the wall plane (road spills out, buildings burst past the frame)
  // 2.6–3.8 the "Visit ArcTown" sign lifts off the poster; neon cubes fly out at the viewer
  // 4–6.6 the camera flies through the frame and down the avenue
  // 8–10  end card
  const SHIFT = (t) => 5.5 * A(t, 2.0, 1.6, io3);          // how far the city has pushed toward the viewer
  function camera(t) {
    const d = A(t, 4.0, 2.6, io3);
    const sway = 1 - A(t, 3.6, 0.8, io3);
    let z = lerp(-16, 34, d) + Math.max(0, t - 6.6) * 3.2;
    const x = 0.75 * Math.sin(t * 0.85 + 0.4) * sway, y = lerp(3.9 + 0.25 * Math.sin(t * 0.6) * sway, 2.5, d);
    return { x, y, z };
  }
  let C = { x: 0, y: 3.9, z: -16 };
  const P = (x, y, z) => { const d = z - C.z; return [W / 2 + (x - C.x) * FL / d, H / 2 - (y - C.y) * FL / d, d]; };
  const WIN = { x0: -3, x1: 3, y0: -0.4, y1: 8.2 };        // poster window on the wall plane z = 0
  const FR = 0.34;                                        // frame thickness

  // ---------- drawing the city for a z-range (a pass) ----------
  function drawBox(c, b, za, zb, sh) {
    const z0 = b.z0 - sh, z1 = b.z1 - sh;
    const A0 = Math.max(z0, za), B0 = Math.min(z1, zb);
    if (A0 >= B0) return;
    const nearCut = A0 > z0 + 1e-6 && Math.abs(A0) > 1e-6; // cut by the near plane (not by the wall)
    if (b.kind === 'arc' || b.kind === 'hall') return drawLandmark(c, b, A0, B0, sh, nearCut);
    const tex = b.kind === 'brick' ? TEX.brick[b.tex] : TEX.tower[b.tex];
    const tw = 4, th = b.kind === 'brick' ? 8 : 16;
    // inner side face (facing the street), perspective strips
    const xin = b.side < 0 ? b.x1 : b.x0, sideVis = b.side < 0 ? C.x > xin : C.x < xin;
    if (sideVis) {
      const n = Math.min(60, Math.max(3, Math.ceil((B0 - A0) * 3)));
      for (let i = 0; i < n; i++) {
        const za_ = A0 + (B0 - A0) * i / n, zb_ = A0 + (B0 - A0) * (i + 1) / n;
        if (za_ - C.z < NEAR) continue;
        const [xa] = P(xin, 0, za_), [xb] = P(xin, 0, zb_), zm = (za_ + zb_) / 2;
        const u = (((zm - z0) % tw) + tw) % tw / tw;
        for (let y = 0; y < b.h; y += th) {
          const y2 = Math.min(b.h, y + th), [, yt] = P(xin, y2, zm), [, yb] = P(xin, y, zm);
          const sh2 = (y2 - y) / th * tex.height;
          c.drawImage(tex, u * tex.width, tex.height - sh2, Math.max(1, (zb_ - za_) / tw * tex.width), sh2, Math.min(xa, xb), yt, Math.abs(xb - xa) + 0.7, yb - yt);
        }
      }
      // darken the side a touch
      const pa = P(xin, 0, Math.max(A0, C.z + NEAR)), pb = P(xin, 0, B0), pc = P(xin, b.h, B0), pd = P(xin, b.h, Math.max(A0, C.z + NEAR));
      c.beginPath(); c.moveTo(pa[0], pa[1]); c.lineTo(pb[0], pb[1]); c.lineTo(pc[0], pc[1]); c.lineTo(pd[0], pd[1]); c.closePath();
      c.fillStyle = 'rgba(10,4,30,0.28)'; c.fill();
    }
    // front face
    if (!nearCut && A0 - C.z > NEAR) {
      const [fx0, fy0] = P(b.x0, b.h, A0), [fx1, fy1] = P(b.x1, 0, A0), s = FL / (A0 - C.z);
      for (let x = b.x0; x < b.x1; x += tw) for (let y = 0; y < b.h; y += th) {
        const x2 = Math.min(b.x1, x + tw), y2 = Math.min(b.h, y + th);
        const [px, py] = P(x, y2, A0);
        const sw = (x2 - x) / tw * tex.width, shh = (y2 - y) / th * tex.height;
        c.drawImage(tex, 0, tex.height - shh, sw, shh, px, py, (x2 - x) * s + 0.6, (y2 - y) * s + 0.6);
      }
      // neon outline of the front face + roofline
      c.beginPath(); c.rect(fx0, fy0, fx1 - fx0, fy1 - fy0);
      neon(c, b.neon, Math.max(1, s * 0.05), b.sky ? 0.7 : 1);
    }
    // street-side roofline running back
    if (sideVis) {
      const a = P(xin, b.h, Math.max(A0, C.z + NEAR)), bb = P(xin, b.h, B0), g0 = P(xin, 0, B0), g1 = P(xin, b.h, B0);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(bb[0], bb[1]); c.moveTo(g0[0], g0[1]); c.lineTo(g1[0], g1[1]);
      neon(c, b.neon, Math.max(1, FL / (A0 - C.z) * 0.04), b.sky ? 0.6 : 0.9);
    }
  }
  function drawLandmark(c, b, A0, B0, sh, nearCut) {
    if (nearCut || A0 - C.z < NEAR) return;
    const s = FL / (A0 - C.z), [x0, y0] = P(b.x0, b.h, A0), [x1, y1] = P(b.x1, 0, A0);
    if (b.kind === 'arc') {
      const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#0B2A3A'); g.addColorStop(1, '#071621');
      c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      for (let k = 1; k < 6; k++) { const yy = lerp(y0, y1, k / 6); c.beginPath(); c.moveTo(x0, yy); c.lineTo(x1, yy); neon(c, COL.cyan, s * 0.04, 0.8); }
      c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); neon(c, COL.cyan, s * 0.07, 1);
      const sw = (x1 - x0) * 0.8, shh = sw * 300 / 520; c.drawImage(TEX.arcSign, (x0 + x1) / 2 - sw / 2, lerp(y0, y1, 0.12), sw, shh);
    } else {
      c.fillStyle = '#1A1730'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      c.fillStyle = '#E9E6F5'; for (let k = 0; k < 7; k++) { const cx = lerp(x0, x1, 0.12 + k * 0.127); c.fillRect(cx - s * 0.18, lerp(y0, y1, 0.22), s * 0.36, (y1 - y0) * 0.72); }
      c.fillStyle = '#D9D6EA'; c.fillRect(x0, y0, x1 - x0, (y1 - y0) * 0.18);
      c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); neon(c, COL.cyan, s * 0.06, 1);
      // dome
      const dx = (x0 + x1) / 2, dr = s * 1.6, g = c.createRadialGradient(dx - dr * 0.3, y0 - dr * 0.6, 0, dx, y0, dr * 1.1);
      g.addColorStop(0, '#E8FBFF'); g.addColorStop(0.3, '#4FC7FF'); g.addColorStop(1, '#1060C0');
      c.beginPath(); c.ellipse(dx, y0, dr, dr * 0.9, 0, Math.PI, 0); c.fillStyle = g; c.fill();
    }
  }
  function neon(c, col, w, a = 1) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = rgba(col, 0.16 * a); c.lineWidth = w * 6; c.stroke();
    c.strokeStyle = rgba(col, 0.5 * a); c.lineWidth = w * 2.2; c.stroke();
    c.strokeStyle = rgba(col, 0.95 * a); c.lineWidth = w; c.stroke();
    c.restore();
  }
  function quad(c, pts, fill) { c.beginPath(); pts.forEach(([x, y, z], i) => { const p = P(x, y, z); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } }
  function drawRoad(c, za, zb, sh) {
    const a = Math.max(za, 0.25 - sh, C.z + NEAR), b = Math.min(zb, 96 - sh);
    if (a >= b) return;
    quad(c, [[-2.65, 0, a], [2.65, 0, a], [2.65, 0, b], [-2.65, 0, b]], '#2E2847');          // sidewalks
    quad(c, [[-1.8, 0, a], [1.8, 0, a], [1.8, 0, b], [-1.8, 0, b]], '#1C1830');             // asphalt
    c.save(); c.strokeStyle = 'rgba(160,140,255,0.08)'; c.lineWidth = 1;
    for (let z = Math.ceil(a / 1.5) * 1.5; z < b; z += 1.5) { const p0 = P(-2.65, 0, z), p1 = P(2.65, 0, z); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); }
    c.restore();
    for (const [x, col, w] of [[0, COL.cyan, 0.14], [-1.8, COL.pink, 0.09], [1.8, COL.pink, 0.09]]) {
      for (const [ww, al] of [[w * 6, 0.12], [w * 2.5, 0.3], [w, 1]]) quad(c, [[x - ww / 2, 0.01, a], [x + ww / 2, 0.01, a], [x + ww / 2, 0.01, b], [x - ww / 2, 0.01, b]], rgba(col, al));
    }
  }
  function drawLamp(c, l, sh) {
    const z = l.z - sh; if (z - C.z < NEAR) return;
    const p0 = P(l.x, 0, z), p1 = P(l.x, 3.1, z), s = FL / (z - C.z);
    c.strokeStyle = '#2A2440'; c.lineWidth = Math.max(1, s * 0.07); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(p1[0], p1[1], 0, p1[0], p1[1], s * 0.9); g.addColorStop(0, 'rgba(255,120,240,0.9)'); g.addColorStop(0.25, 'rgba(255,63,216,0.45)'); g.addColorStop(1, 'rgba(255,63,216,0)');
    c.fillStyle = g; c.fillRect(p1[0] - s, p1[1] - s, s * 2, s * 2); c.restore();
    c.fillStyle = '#FFC4F4'; c.beginPath(); c.arc(p1[0], p1[1], Math.max(1.5, s * 0.2), 0, TAU); c.fill();
  }
  function cubePos(cb, t, sh) {
    const fly = A(t, 2.25 + cb.i * 0.12, 1.5 + cb.i * 0.08, io3);
    return { x: cb.x * (1 + fly * 1.6), y: cb.y + Math.sin(t * 1.6 + cb.i) * 0.15 + fly * (cb.i % 2 ? 1.2 : -0.6), z: cb.z - sh - fly * (cb.z + 15) };
  }
  function drawCube(c, cb, t, sh) {
    const p = cubePos(cb, t, sh); if (p.z - C.z < 1.2) return;
    const s = cb.s, ry = t * 1.1 + cb.i, rx = 0.5 + cb.i * 0.2, cr = Math.cos(ry), sr = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([a, b, d]) => {
      const x1 = a * cr + d * sr, z1 = -a * sr + d * cr, y1 = b * cx - z1 * sx, z2 = b * sx + z1 * cx;
      return P(p.x + x1 * s, p.y + y1 * s, p.z + z2 * s);
    });
    const faces = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]];
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const f of faces) { c.beginPath(); f.forEach((i, k) => (k ? c.lineTo(V[i][0], V[i][1]) : c.moveTo(V[i][0], V[i][1]))); c.closePath(); c.fillStyle = rgba(cb.col, 0.10); c.fill(); }
    c.restore();
    c.beginPath(); for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) { c.moveTo(V[a][0], V[a][1]); c.lineTo(V[b][0], V[b][1]); }
    neon(c, cb.col, Math.max(1, FL / (p.z - C.z) * s * 0.07), 1);
  }
  function drawBanner(c, bn, sh) {
    const z = bn.z - sh; if (z - C.z < NEAR + 0.6) return;
    const s = FL / (z - C.z), w = 3.7 * s, h = w * 256 / 1200, [x, y] = P(0, 5.6, z);
    c.strokeStyle = 'rgba(200,190,255,0.5)'; c.lineWidth = Math.max(1, s * 0.02);
    for (const sx of [-1.75, 1.75]) { const a = P(sx, 5.6, z), b = P(sx * 1.55, 8.5, z); c.beginPath(); c.moveTo(a[0], a[1] - h / 2); c.lineTo(b[0], b[1]); c.stroke(); }
    c.drawImage(bn.tex, x - w / 2, y - h / 2, w, h);
  }

  // A pass draws everything whose depth falls in [za, zb], far to near.
  function drawCity(c, t, za, zb) {
    const sh = SHIFT(t);
    drawRoad(c, za, zb, sh);
    const items = [];
    for (const b of BOXES) { const z0 = b.z0 - sh, z1 = b.z1 - sh; if (z1 <= za || z0 >= zb) continue; items.push([Math.max(z0, za), () => drawBox(c, b, za, zb, sh)]); }
    for (const l of LAMPS) { const z = l.z - sh; if (z > za && z <= zb) items.push([z, () => drawLamp(c, l, sh)]); }
    for (const cb of CUBES) { const z = cubePos(cb, t, sh).z; if (z > za && z <= zb) items.push([z, () => drawCube(c, cb, t, sh)]); }
    for (const bn of BANNERS) { const z = bn.z - sh; if (z > za && z <= zb) items.push([z - 0.01, () => drawBanner(c, bn, sh)]); }
    items.sort((a, b) => b[0] - a[0]);
    for (const [, f] of items) f();
  }
  function skyAndGround(c) {
    const hy = H / 2 + C.y * 0; // pitch 0 → horizon at screen centre
    const g = c.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, COL.sky0); g.addColorStop(0.6, COL.sky1); g.addColorStop(1, COL.sky2);
    c.fillStyle = g; c.fillRect(0, 0, W, hy);
    const gr = c.createLinearGradient(0, hy, 0, H); gr.addColorStop(0, '#3A2A5C'); gr.addColorStop(0.15, '#262040'); gr.addColorStop(1, '#16122A');
    c.fillStyle = gr; c.fillRect(0, hy, W, H - hy);
    c.save(); c.globalCompositeOperation = 'lighter';
    const hz = c.createRadialGradient(W / 2, hy, 0, W / 2, hy, 900); hz.addColorStop(0, 'rgba(255,120,220,0.35)'); hz.addColorStop(1, 'rgba(255,120,220,0)');
    c.fillStyle = hz; c.fillRect(0, hy - 900, W, 1800); c.restore();
  }

  // ---------- the wall, the frame, the poster typography ----------
  function windowPath(c, grow = 0) {
    const a = P(WIN.x0 - grow, WIN.y1 + grow, 0), b = P(WIN.x1 + grow, WIN.y0 - grow, 0);
    c.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    return [a, b];
  }
  function drawWall(c, t) {
    const s = FL / (0 - C.z);
    c.save();
    c.beginPath(); c.rect(0, 0, W, H); windowPath(c, FR); c.clip('evenodd');
    const pat = c.createPattern(TEX.wall, 'repeat'), o = P(0, 0, 0);
    const k = s * 6 / 512;
    pat.setTransform(new DOMMatrix([k, 0, 0, k, o[0], o[1]]));
    c.fillStyle = pat; c.fillRect(0, 0, W, H);
    // purple night ambience + glow spill from the poster
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(60,20,110,0.45)'); g.addColorStop(1, 'rgba(10,5,25,0.55)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const pc = P(0, 4, 0);
    c.globalCompositeOperation = 'lighter';
    const sp = c.createRadialGradient(pc[0], pc[1], s * 2, pc[0], pc[1], s * 9); sp.addColorStop(0, 'rgba(46,242,255,0.22)'); sp.addColorStop(0.5, 'rgba(255,63,216,0.12)'); sp.addColorStop(1, 'rgba(255,63,216,0)');
    c.fillStyle = sp; c.fillRect(0, 0, W, H);
    // skyscraper corner neon on the facade
    for (const x of [-11.5, 11.5]) { const a = P(x, -30, 0), b = P(x, 40, 0); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); neon(c, x < 0 ? COL.pink : COL.cyan, s * 0.06, 0.8); }
    c.restore();
  }
  function drawFrame(c, t) {
    const s = FL / (0 - C.z);
    // flicker as the breakout starts
    const fl = t > 1.95 && t < 2.35 ? (hash(Math.floor(t * 30), 3) < 0.35 ? 0.35 : 1) : 1;
    c.save();
    c.beginPath(); windowPath(c, FR); windowPath(c, 0); c.fillStyle = '#100A22'; c.fill('evenodd');
    c.beginPath(); windowPath(c, 0); neon(c, COL.cyan, s * 0.05, fl);
    c.beginPath(); windowPath(c, FR); neon(c, COL.pink, s * 0.06, fl);
    c.restore();
  }
  function drawPosterType(c, t) {
    // title: sits on the poster, then lifts off toward the viewer
    const lift = A(t, 2.6, 1.2, io3);
    const z = lerp(-0.02, -5.0, lift), y = lerp(6.75, 6.55, lift);
    if (z - C.z > NEAR + 0.5) {
      const s = FL / (z - C.z), w = 5.4 * s, h = w * 560 / 1300, [x, py] = P(0, y, z);
      c.save(); c.translate(x, py); c.rotate(Math.sin(lift * Math.PI) * -0.06);
      if (lift > 0) { c.globalAlpha = 0.5 * Math.sin(lift * Math.PI); c.filter = 'blur(12px)'; c.drawImage(TEX.title, -w / 2 + 20, -h / 2 + 30, w, h); c.filter = 'none'; c.globalAlpha = 1; } // shadow on the poster
      c.drawImage(TEX.title, -w / 2, -h / 2, w, h); c.restore();
    }
    // small strap line at the foot of the poster, fades as the city pushes out
    const sa = 1 - A(t, 1.9, 0.3, io3);
    if (sa > 0.01) {
      const s = FL / (0 - C.z), [x, y] = P(0, 0.35, 0);
      c.save(); c.globalAlpha = sa; c.font = FONT.sans(700, Math.round(s * 0.26)); c.letterSpacing = `${s * 0.06}px`; c.textAlign = 'center';
      c.shadowColor = COL.cyan; c.shadowBlur = 14; c.fillStyle = '#E8FCFF'; c.fillText('EXPLORE · BUILD · HANG OUT', x, y); c.restore();
    }
  }

  // ---------- end card ----------
  function endCard(c, t) {
    const k = A(t, 8.0, 0.6);
    if (k <= 0) return;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(8,4,22,0.25)'); g.addColorStop(0.5, 'rgba(8,4,22,0.55)'); g.addColorStop(1, 'rgba(8,4,22,0.85)');
    c.globalAlpha = k; c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    // neon ignition: flickers on, then holds
    const ign = (t0) => { if (t < t0) return 0; const d = t - t0; if (d > 0.35) return 1; return hash(Math.floor(d * 40), Math.floor(t0 * 10)) < 0.5 ? 0.25 : 1; };
    const w = 1300 * 0.95, h = 560 * 0.95;
    c.save(); c.globalAlpha = ign(8.0); c.drawImage(TEX.title, W / 2 - w / 2, 250 - 40, w, h); c.restore();
    const sl = A(t, 8.6, 0.5);
    c.save(); c.globalAlpha = sl; c.translate(0, (1 - sl) * 16);
    c.font = FONT.sans(500, 36); c.textAlign = 'center'; c.fillStyle = '#E9E3FF'; c.letterSpacing = '1px';
    c.fillText('Explore projects  ·  Own a building  ·  Hang out with Arc members', W / 2, 800); c.restore();
    const bk = A(t, 9.0, 0.45);
    if (bk > 0) {
      const pw = 460, ph = 84, x = W / 2, y = 900, pulse = 1 + 0.03 * Math.sin((t - 9) * TAU);
      c.save(); c.globalAlpha = bk; c.translate(x, y); c.scale(lerp(0.9, 1, bk) * pulse, lerp(0.9, 1, bk) * pulse);
      c.beginPath(); c.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2);
      const gg = c.createLinearGradient(-pw / 2, 0, pw / 2, 0); gg.addColorStop(0, COL.cyan); gg.addColorStop(1, COL.pink);
      c.shadowColor = COL.pink; c.shadowBlur = 40; c.fillStyle = gg; c.fill(); c.shadowBlur = 0;
      c.font = FONT.sans(800, 32); c.fillStyle = '#12061F'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '2px';
      c.fillText('ENTER THE CITY  →', 0, 2); c.restore();
    }
  }

  // ---------- frame ----------
  function renderAt(t) {
    t = clamp(t, 0, DUR);
    C = camera(t);
    const c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
    if (C.z < -0.02) {
      // 1) the city behind the wall, seen only through the poster window
      c.save(); c.beginPath(); windowPath(c, 0); c.clip();
      skyAndGround(c); drawCity(c, t, 0, 1e4);
      c.restore();
      // 2) the wall + frame
      drawWall(c, t); drawFrame(c, t);
      // 3) everything that has broken through, unclipped
      drawCity(c, t, C.z + NEAR, 0);
      drawPosterType(c, t);
    } else {
      skyAndGround(c); drawCity(c, t, C.z + NEAR, 1e4);
      drawPosterType(c, t);
    }
    // vignette
    const v = c.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = v; c.fillRect(0, 0, W, H);
    endCard(c, t);
  }

  window.ARC = { W, H, FPS, DUR, renderAt };
  window.ARC.ready = Promise.all([document.fonts.load(FONT.neon(100)), document.fonts.load(FONT.sans(700, 40))]).then(() => document.fonts.ready).then(buildWorld);
  if (!/[?&]render\b/.test(location.search)) {
    window.ARC.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
  }
})();
