// ARCTOWN.APP — an origami / doodle pop-up story. 1920x1080 @ 60fps, 20s, no dialogue.
// A lonely paper avatar gets a paper-plane invite, unfolds it into the ArcTown map, flies there,
// the book page turns, and the neon paper city pops up: EXPLORE → OWN LAND → HANG OUT → ArcTown.app.
// Deterministic: renderAt(t) draws absolute time t. Doodle lines "boil" at 12 fps like hand-drawn animation.
(() => {
  'use strict';
  const W = 1920, H = 1080, FPS = 60, DUR = 20, TAU = Math.PI * 2, BT = 0.5;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const MARK = (s) => `400 ${s}px "Permanent Marker", cursive`, NEON = (s) => `400 ${s}px "Tilt Neon", sans-serif`, SANS = (w, s) => `${w} ${s}px Geist, sans-serif`;
  const COL = { cyan: '#38F3FF', pink: '#FF4FD8', yellow: '#FFE36B', purple: '#9C6BFF', green: '#6EE07A', red: '#FF5A5F', paper: '#F6F1FF' };

  // ---------- math ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const io3 = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const o3 = (p) => 1 - Math.pow(1 - p, 3);
  const crit = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const k = 7 * p; return (1 - (1 + k) * Math.exp(-k)) / (1 - 8 * Math.exp(-7)); };
  const pop = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const z = 0.5, w = 12, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * p) * (Math.cos(wd * p) + z / Math.sqrt(1 - z * z) * Math.sin(wd * p)); };
  const A = (t, t0, d, f = crit) => f(prog(t, t0, t0 + d));
  const hash = (a, b, c2 = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c2 | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
  function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const shade = (h, k) => { const n = parseInt(h.slice(1), 16); const f = (v) => Math.round(clamp(v * k, 0, 255)); return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  const BOIL = (t) => Math.floor(t * 12);   // doodle redraw rate
  const pulse = (t) => Math.exp(-((t % BT) + BT) % BT * 9);

  // ---------- paper + doodle toolkit ----------
  let GRAIN;
  function buildGrain() {
    GRAIN = mk(512, 512); const g = GRAIN.getContext('2d'), im = g.createImageData(512, 512), r = rng(5);
    for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 70; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0);
    g.globalAlpha = 0.15; g.strokeStyle = '#000'; for (let k = 0; k < 220; k++) { g.lineWidth = 0.6; g.beginPath(); const x = r() * 512, y = r() * 512; g.moveTo(x, y); g.bezierCurveTo(x + r() * 30, y + r() * 10, x + r() * 50, y - r() * 10, x + 20 + r() * 50, y + r() * 20); g.stroke(); }
  }
  function poly(c, pts) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }
  // A paper piece: drop shadow, soft top-light gradient, optional crease line.
  function paper(c, pts, color, o = {}) {
    c.save();
    if (o.shadow !== false) { c.shadowColor = `rgba(10,0,30,${o.shadowA ?? 0.4})`; c.shadowBlur = o.blur ?? 14; c.shadowOffsetX = o.sx ?? 5; c.shadowOffsetY = o.sy ?? 8; }
    poly(c, pts);
    const ys = pts.map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, shade(color, o.top ?? 1.08)); g.addColorStop(1, shade(color, o.bot ?? 0.9));
    c.fillStyle = g; c.fill(); c.restore();
  }
  // Hand-drawn stroke: resampled, wobbled per point, re-randomised 12x a second; optional draw-on progress.
  function doodle(c, pts, t, o = {}) {
    const j = o.jitter ?? 2.0, seed = o.seed ?? 1, b = BOIL(t), closed = !!o.closed;
    const src = closed ? [...pts, pts[0]] : pts, q = [];
    for (let i = 0; i < src.length - 1; i++) {
      const [x0, y0] = src[i], [x1, y1] = src[i + 1], len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(len / (o.step ?? 22)));
      for (let k = 0; k < n; k++) { const u = k / n, id = q.length; q.push([lerp(x0, x1, u) + (hash(b, id, seed) - 0.5) * 2 * j, lerp(y0, y1, u) + (hash(b, id + 999, seed) - 0.5) * 2 * j]); }
    }
    q.push([src[src.length - 1][0] + (hash(b, 7777, seed) - 0.5) * j, src[src.length - 1][1] + (hash(b, 8888, seed) - 0.5) * j]);
    let total = 0; for (let i = 1; i < q.length; i++) total += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
    const limit = total * clamp(o.prog ?? 1);
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(q[0][0], q[0][1]); let acc = 0;
    for (let i = 1; i < q.length; i++) {
      const d = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
      if (acc + d > limit) { const u = (limit - acc) / d; c.lineTo(lerp(q[i - 1][0], q[i][0], u), lerp(q[i - 1][1], q[i][1], u)); break; }
      c.lineTo(q[i][0], q[i][1]); acc += d;
    }
    if (o.dash) c.setLineDash(o.dash);
    if (o.glow) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(o.color, 0.18); c.lineWidth = (o.width ?? 3) * 5; c.stroke(); c.strokeStyle = rgba(o.color, 0.45); c.lineWidth = (o.width ?? 3) * 2.2; c.stroke(); c.globalCompositeOperation = 'source-over'; c.strokeStyle = o.core ?? '#FFFFFF'; c.lineWidth = (o.width ?? 3) * 0.6; c.stroke(); c.strokeStyle = rgba(o.color, 0.9); c.lineWidth = o.width ?? 3; c.globalCompositeOperation = 'lighter'; c.stroke(); }
    else { c.strokeStyle = o.color ?? '#FFFFFF'; c.lineWidth = o.width ?? 3; c.stroke(); }
    c.restore();
  }
  const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  // marker lettering that wiggles slightly on the boil, popping in with a stamp
  function marker(c, s, x, y, size, color, t, t0, o = {}) {
    const k = pop(prog(t, t0, t0 + 0.45)), out = o.out != null ? A(t, o.out, 0.25, io3) : 0;
    if (k <= 0 || out >= 1) return;
    const b = BOIL(t);
    c.save(); c.translate(x, y); c.rotate((o.rot ?? -0.04) + (hash(b, 3, size) - 0.5) * 0.012);
    const sc = k * (1 - out * 0.4); c.scale(sc, sc); c.globalAlpha = clamp(k * 3) * (1 - out);
    c.font = MARK(size); c.textAlign = o.align ?? 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = 'rgba(15,0,35,0.55)'; c.fillText(s, 5, 7);
    c.fillStyle = color; c.fillText(s, 0, 0);
    if (o.underline) { const w = c.measureText(s).width, x0 = o.align === 'center' ? -w / 2 : 0; doodle(c, [[x0, size * 0.22], [x0 + w * 0.5, size * 0.3], [x0 + w, size * 0.18]], t, { color: o.underline, width: size * 0.08, jitter: 3, seed: size, prog: A(t, t0 + 0.2, 0.35) }); }
    c.restore();
  }
  function sparkle(c, x, y, r, t, col, seed) {
    const tw = 0.6 + 0.4 * Math.sin(t * 4 + seed);
    doodle(c, [[x - r * tw, y], [x + r * tw, y]], t, { color: col, width: 2.5, jitter: 1, seed });
    doodle(c, [[x, y - r * tw], [x, y + r * tw]], t, { color: col, width: 2.5, jitter: 1, seed: seed + 1 });
  }

  // ---------- origami characters ----------
  const FOLK = { red: ['#FF6B6B', '#C9303D'], cyan: ['#5CF0FF', '#1C9FC4'], yellow: ['#FFE26B', '#D9A520'], purple: ['#B48CFF', '#6B3FD1'], green: ['#79E08A', '#2E9E4F'] };
  function folk(c, x, y, s, col, t, o = {}) {
    const [lt, dk] = FOLK[col], walk = o.walk ?? 0, bob = (o.bob ?? 0);
    const sw = Math.sin(walk * TAU) * 16, lift = Math.abs(Math.sin(walk * TAU)) * 5;
    c.save(); c.translate(x, y - lift * s - bob * s); c.scale(s * (o.flip ? -1 : 1), s);
    // legs + arms: doodle lines
    doodle(c, [[-9, -30], [-9 + sw, 0]], t, { color: '#1A0B33', width: 5, jitter: 1, seed: 11 });
    doodle(c, [[9, -30], [9 - sw, 0]], t, { color: '#1A0B33', width: 5, jitter: 1, seed: 12 });
    const wave = o.wave ? Math.sin(t * 12) * 0.5 : 0;
    const armL = o.arms === 'up' ? [[-16, -84], [-34, -118]] : [[-16, -84], [-30 - sw * 0.4, -52]];
    const armR = o.arms === 'up' || o.wave ? [[16, -84], [36 + wave * 10, -124 + Math.abs(wave) * 8]] : o.arms === 'point' ? [[16, -84], [56, -92]] : [[16, -84], [30 + sw * 0.4, -52]];
    doodle(c, armL, t, { color: '#1A0B33', width: 5, jitter: 1, seed: 13 }); doodle(c, armR, t, { color: '#1A0B33', width: 5, jitter: 1, seed: 14 });
    // body: two folded facets
    paper(c, [[-17, -94], [0, -94], [0, -26], [-33, -26]], lt, { blur: 8, sx: 3, sy: 5 });
    paper(c, [[0, -94], [17, -94], [33, -26], [0, -26]], dk, { shadow: false });
    // head: folded hexagon
    const hx = 0, hy = -122, r = 25;
    paper(c, [[hx, hy - r], [hx - r * 0.87, hy - r / 2], [hx - r * 0.87, hy + r / 2], [hx, hy + r]], lt, { blur: 8, sx: 3, sy: 5 });
    paper(c, [[hx, hy - r], [hx + r * 0.87, hy - r / 2], [hx + r * 0.87, hy + r / 2], [hx, hy + r]], dk, { shadow: false });
    // face doodle
    const blink = hash(Math.floor(t * 3), 5, col.length) < 0.08;
    c.fillStyle = '#1A0B33';
    if (blink) { c.fillRect(2, hy - 4, 7, 2.5); c.fillRect(13, hy - 4, 7, 2.5); } else { c.beginPath(); c.arc(6, hy - 3, 3, 0, TAU); c.arc(17, hy - 3, 3, 0, TAU); c.fill(); }
    if (o.happy) doodle(c, [[4, hy + 8], [11, hy + 12], [19, hy + 7]], t, { color: '#1A0B33', width: 3, jitter: 0.6, seed: 15 });
    else doodle(c, [[6, hy + 10], [17, hy + 10]], t, { color: '#1A0B33', width: 3, jitter: 0.6, seed: 15 });
    c.restore();
  }
  function plane(c, x, y, s, rot, t) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    paper(c, [[64, 0], [-52, -26], [-30, 0]], COL.paper, { blur: 10 });
    paper(c, [[64, 0], [-30, 0], [-46, 18]], '#C8BEEB', { shadow: false });
    paper(c, [[64, 0], [-30, 0], [-40, 8]], '#E2DBFA', { shadow: false });
    doodle(c, [[64, 0], [-30, 0]], t, { color: '#7D6BB8', width: 2, jitter: 0.6, seed: 40 });
    c.restore();
  }
  function crane(c, x, y, s, t) {
    const flap = Math.sin(t * 8) * 0.6;
    c.save(); c.translate(x, y); c.scale(s, s);
    paper(c, [[-70, 0], [0, -14], [60, -40], [20, 6]], '#F6F1FF', { blur: 12 });            // body + neck
    paper(c, [[60, -40], [78, -46], [66, -34]], '#FFD6F5', { shadow: false });
    paper(c, [[-10, -6], [10, -8], [-20, -90 * (0.6 + flap)]], '#E7DEFF', { shadow: false });   // back wing
    paper(c, [[-6, -4], [16, -6], [8, -110 * (0.4 + flap)]], COL.paper, { shadow: false });     // front wing
    paper(c, [[-70, 0], [-90, -36], [-44, -6]], '#D7CCF5', { shadow: false });              // tail
    c.restore();
  }

  // ---------- scene 1: the lonely avatar (0–3) ----------
  function sky(c, t, k = 1) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1C0F3F'); g.addColorStop(0.55, '#4A2378'); g.addColorStop(1, '#A04F96');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { const x = hash(i, 1) * W, y = hash(i, 2) * H * 0.55; sparkle(c, x, y, 5 + hash(i, 3) * 6, t, i % 3 ? '#FFF2C2' : COL.cyan, i); }
  }
  function moon(c, x, y, r, t) {
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, 'rgba(255,230,190,0.35)'); g.addColorStop(1, 'rgba(255,230,190,0)'); c.fillStyle = g; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); c.restore();
    const pts = []; for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + (i / 24) * TAU; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    paper(c, pts, '#FFE9B8', { blur: 18 });
    paper(c, pts.map(([px, py]) => [px + r * 0.42, py - r * 0.18]), '#2B1556', { shadow: false });
  }
  function scene1(c, t) {
    sky(c, t); moon(c, 1730, 150, 62, t);
    // paper hills
    paper(c, [[0, 860], [500, 800], [1100, 840], [1920, 790], [1920, 1080], [0, 1080]], '#3A2768', { blur: 20 });
    paper(c, [[0, 940], [700, 900], [1400, 950], [1920, 910], [1920, 1080], [0, 1080]], '#2A1B52', { blur: 20 });
    const catchK = A(t, 2.35, 0.3);
    folk(c, 860, 960, 2.2, 'red', t, { bob: Math.sin(t * 2) * 2, arms: t > 2.35 ? 'up' : null, happy: t > 2.4 });
    // thought bubble "?"
    const qk = pop(prog(t, 0.5, 0.9)) * (1 - A(t, 2.2, 0.2, io3));
    if (qk > 0) { c.save(); c.translate(1050, 560); c.scale(qk, qk); paper(c, [[-60, -50], [60, -55], [70, 40], [-55, 45]], COL.paper, { blur: 12 }); doodle(c, [[-60, -50], [60, -55], [70, 40], [-55, 45]], t, { closed: true, color: '#2A1B52', width: 3, seed: 2 }); c.font = MARK(80); c.textAlign = 'center'; c.fillStyle = '#2A1B52'; c.fillText('?', 4, 28); c.restore(); paper(c, [[990, 640], [1012, 640], [1000, 658]], COL.paper); }
    marker(c, 'Looking for somewhere new?', W / 2, 230, 84, '#FFFFFF', t, 0.55, { align: 'center', out: 2.3, underline: COL.pink });
    // the invite: a paper plane glides in on a looping path and lands in his hand
    if (t > 1.4 && t < 2.75) {
      const k = io3(prog(t, 1.4, 2.4)), x = lerp(-120, 930, k) + Math.sin(k * Math.PI) * 120, y = lerp(260, 640, k) - Math.sin(k * TAU) * 120;
      const trail = []; for (let i = 0; i <= 20; i++) { const kk = k * i / 20, tx = lerp(-120, 930, kk) + Math.sin(kk * Math.PI) * 120, ty = lerp(260, 640, kk) - Math.sin(kk * TAU) * 120; trail.push([tx, ty]); }
      if (trail.length > 2) doodle(c, trail, t, { color: 'rgba(255,255,255,0.65)', width: 3, dash: [10, 14], jitter: 1.5, seed: 9 });
      plane(c, x, y, 1.1, Math.sin(k * TAU) * 0.4 + 0.15, t);
    }
    // it unfolds into the map, which grows to fill the page
    if (t >= 2.6) {
      const k = A(t, 2.6, 0.5, io3), w = lerp(120, 1300, k), h = lerp(80, 760, k), x = lerp(905, W / 2, k), y = lerp(690, H / 2, k);
      mapPaper(c, x, y, w, h, t, Math.min(1, k * 1.2), 0);
    }
  }

  // ---------- scene 2: the invite map (3–5.5) ----------
  function mapPaper(c, cx, cy, w, h, t, unfold, inner) {
    // folded into quarters: right half swings open, then the bottom half
    const ux = clamp(unfold * 2), uy = clamp(unfold * 2 - 1);
    const ww = w * (0.5 + 0.5 * ux), hh = h * (0.5 + 0.5 * uy), x0 = cx - w / 2, y0 = cy - h / 2;
    paper(c, rectPts(x0, y0, ww, hh), '#5FA845', { blur: 30, sy: 14, sx: 8 });
    c.save(); c.beginPath(); c.rect(x0, y0, ww, hh); c.clip();
    // grid + content
    c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 2;
    for (let gx = x0; gx < x0 + w; gx += w / 12) { c.beginPath(); c.moveTo(gx, y0); c.lineTo(gx, y0 + h); c.stroke(); }
    for (let gy = y0; gy < y0 + h; gy += h / 8) { c.beginPath(); c.moveTo(x0, gy); c.lineTo(x0 + w, gy); c.stroke(); }
    if (inner > 0) mapContent(c, x0, y0, w, h, t, inner);
    // crease shading
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x0 + w / 2 - 3, y0, 6, h); c.fillRect(x0, y0 + h / 2 - 3, w, 6);
    const fold = (1 - ux) * 0.35; if (fold > 0) { c.fillStyle = `rgba(0,0,0,${fold})`; c.fillRect(x0 + w / 2, y0, ww - w / 2, hh); }
    c.restore();
  }
  const MAP_ROUTE = [[0.14, 0.86], [0.3, 0.72], [0.42, 0.78], [0.5, 0.6], [0.5, 0.36], [0.56, 0.2]];
  function mapContent(c, x0, y0, w, h, t, k) {
    const P = ([u, v]) => [x0 + u * w, y0 + v * h];
    // the avenue + plots + labels, after the in-game minimap
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(x0 + w * 0.47, y0 + h * 0.12, w * 0.06, h * 0.8);
    paper(c, rectPts(x0 + w * 0.42, y0 + h * 0.06, w * 0.16, h * 0.22), '#E9E4D6', { blur: 8 });
    c.font = MARK(34); c.fillStyle = '#3A2768'; c.textAlign = 'center';
    c.fillText('Arc Tower', x0 + w * 0.5, y0 + h * 0.13); c.fillText('Town Hall', x0 + w * 0.5, y0 + h * 0.24);
    [[0.36, 0.42], [0.62, 0.42], [0.36, 0.58], [0.62, 0.58], [0.36, 0.74], [0.62, 0.74]].forEach(([u, v], i) => {
      const [px, py] = P([u, v]); doodle(c, rectPts(px - 26, py - 22, 52, 44), t, { closed: true, color: '#FFFFFF', width: 3, dash: [8, 8], seed: 50 + i });
      if (i % 2 === 0) { c.fillStyle = COL.pink; c.beginPath(); c.arc(px + (u < 0.5 ? 60 : -60), py, 9, 0, TAU); c.fill(); c.font = MARK(26); c.fillStyle = '#FFFFFF'; c.fillText('Up For Sale', px + (u < 0.5 ? 70 : -70), py + 36); }
    });
    // YOU marker + route + destination star
    const you = P([0.14, 0.86]); c.fillStyle = COL.red; c.beginPath(); c.arc(you[0], you[1], 14, 0, TAU); c.fill();
    c.font = MARK(40); c.fillStyle = '#FFFFFF'; c.fillText('YOU', you[0], you[1] + 56);
    doodle(c, MAP_ROUTE.map(P), t, { color: COL.red, width: 7, dash: [16, 14], jitter: 2.5, seed: 61, prog: A(t, 3.8, 0.7, io3) });
    const dk = pop(prog(t, 4.45, 4.85));
    if (dk > 0) { const [sx, sy] = P([0.56, 0.2]); c.save(); c.translate(sx + 330, sy - 20); c.scale(dk, dk); c.rotate(-0.12);
      paper(c, rectPts(-150, -48, 300, 96), '#FF4FA8', { blur: 10 }); c.strokeStyle = '#FFFFFF'; c.lineWidth = 4; c.strokeRect(-140, -38, 280, 76);
      c.font = MARK(46); c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ArcTown.app', 0, 4); c.restore(); }
  }
  function scene2(c, t) {
    sky(c, t);
    const fold = A(t, 5.15, 0.35, io3);          // refolds into a plane at the end
    const w = 1300 * (1 - fold * 0.9), h = 760 * (1 - fold * 0.9);
    mapPaper(c, W / 2 - fold * 300, H / 2 + fold * 120, w, h, t, 1, 1 - fold);
    if (fold > 0.6) plane(c, W / 2 - 300, H / 2 + 120, 1.2 * prog(fold, 0.6, 1), 0, t);
  }

  // ---------- scene 3: the flight (5.5–7) ----------
  function cloud(c, x, y, s, t, seed) {
    const pts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI + (i / 14) * Math.PI; pts.push([x + Math.cos(a) * 120 * s, y + Math.sin(a) * (40 + 26 * Math.abs(Math.sin(i * 1.7))) * s]); }
    paper(c, pts, '#7B4FB0', { blur: 16 });
  }
  function scene3(c, t) {
    sky(c, t); moon(c, 1600, 180, 60, t);
    const lt = t - 5.5;
    for (let i = 0; i < 6; i++) cloud(c, ((i * 420 - lt * 520) % 2400 + 2400) % 2400 - 240, 300 + (i % 3) * 170, 0.8 + (i % 2) * 0.4, t, i);
    // the city on the horizon, approaching
    const near = A(t, 5.5, 1.5, io3);
    c.save(); c.translate(1500, 900); c.scale(0.5 + near * 0.9, 0.5 + near * 0.9);
    for (let i = 0; i < 9; i++) { const bx = -300 + i * 70, bh = 140 + hash(i, 4) * 240; paper(c, rectPts(bx, -bh, 60, bh), '#2B1A55', { blur: 6 }); doodle(c, [[bx, -bh], [bx + 60, -bh]], t, { color: [COL.cyan, COL.pink, COL.yellow][i % 3], width: 4, glow: true, seed: 70 + i }); }
    paper(c, rectPts(-40, -440, 80, 440), '#0F3346', { blur: 6 }); c.font = NEON(44); c.textAlign = 'center'; c.fillStyle = COL.cyan; c.shadowColor = COL.cyan; c.shadowBlur = 20; c.fillText('ARC', 0, -380); c.shadowBlur = 0;
    c.restore();
    paper(c, [[0, 1000], [1920, 960], [1920, 1080], [0, 1080]], '#24164A', { blur: 20 });
    // our hero rides the plane
    const x = lerp(260, 900, A(t, 5.5, 1.0)), y = 560 + Math.sin(t * 5) * 18;
    for (let k = 0; k < 4; k++) doodle(c, [[x - 140 - k * 30, y - 30 + k * 22], [x - 230 - k * 40, y - 30 + k * 22]], t, { color: 'rgba(255,255,255,0.7)', width: 3, seed: 80 + k });
    plane(c, x, y, 1.8, -0.05 + Math.sin(t * 5) * 0.04, t);
    folk(c, x - 10, y - 4, 0.75, 'red', t, { arms: 'up', happy: true });
  }

  // ---------- scenes 4–6: the pop-up city ----------
  // camera: world x at the left edge of the screen
  function camX(t) {
    if (t < 7) return 0;
    return 1100 * A(t, 7.2, 3.3, io3) + 400 * A(t, 10.2, 0.8, io3) + 800 * A(t, 13.2, 1.0, io3) + 40 * Math.max(0, t - 14.2);
  }
  const R = rng(77), SHOPS = [], TOWERS = [], LAMPS = [], CUBES = [];
  const SIGNS = ['$BLIP HQ', 'Glimmer Market', 'Tidepool Swap', null, null, null];
  function buildCity() {
    // front-row shops (parallax 1.0) along the avenue, leaving a plot free for OWN LAND and the plaza at the end
    let x = 120, i = 0;
    while (x < 3000) {
      if (x > 2280 && x < 2620) { x = 2620; continue; }                  // the empty plot
      const w = 230 + R() * 120, h = 230 + R() * 170;
      SHOPS.push({ x, w, h, col: ['#7A4A35', '#6A3E3A', '#80503A', '#5E3B47'][i % 4], neon: [COL.cyan, COL.pink, COL.yellow, COL.purple][(i * 3) % 4], sign: SIGNS[i % 6], awn: [COL.pink, COL.cyan, COL.yellow][i % 3], i });
      x += w + 40 + R() * 70; i++;
      if (x > 2950) break;
    }
    // back skyline (parallax 0.45)
    for (let k = 0; k < 26; k++) TOWERS.push({ x: k * 150 + R() * 60, w: 110 + R() * 70, h: 360 + R() * 330, neon: [COL.cyan, COL.pink, COL.yellow, COL.purple][k % 4], seed: k });
    for (let lx = 60; lx < 3600; lx += 420) LAMPS.push(lx);
    for (let k = 0; k < 7; k++) CUBES.push({ x: 300 + k * 470, y: 260 + (k % 3) * 70, col: [COL.pink, COL.cyan, COL.purple][k % 3], s: 34 + (k % 2) * 12 });
    // pop-up timing: each card folds up as it enters the frame, snapped to the 8th-note grid
    for (const s of SHOPS) {
      let tt = 7.15; while (tt < 20 && s.x - camX(tt) > 1800) tt += 1 / 60;
      s.popT = Math.max(7.15 + s.i * 0.06, Math.ceil(tt / 0.25) * 0.25);
    }
  }
  const GROUND = 860;
  // pop-up card: folds up from flat (lying toward the viewer) to upright
  function popCard(c, x, y, w, h, k, draw) {
    if (k <= 0) return;
    const a = Math.sin(k * Math.PI / 2), hh = h * a;
    if (k < 1) { paper(c, [[x, y], [x + w, y], [x + w + 14, y + (1 - a) * 40], [x - 14, y + (1 - a) * 40]], '#24163F', { shadow: false }); }
    c.save(); c.translate(x, y); c.scale(1, a); c.translate(-x, -y);
    draw(c);
    c.restore();
    if (k < 1) { c.fillStyle = `rgba(10,0,30,${(1 - a) * 0.5})`; c.fillRect(x, y - hh, w, hh); }
  }
  function shopCard(c, s, sx, t, k) {
    const y = GROUND, x = sx;
    popCard(c, x, y, s.w, s.h, k, (c2) => {
      paper(c2, rectPts(x, y - s.h, s.w, s.h), s.col, { blur: 16 });
      // brick doodle lines
      c2.strokeStyle = 'rgba(0,0,0,0.12)'; c2.lineWidth = 2; for (let yy = y - s.h + 14; yy < y; yy += 18) { c2.beginPath(); c2.moveTo(x, yy); c2.lineTo(x + s.w, yy); c2.stroke(); }
      // cut-out windows glowing warm
      const cols = Math.max(2, Math.floor(s.w / 80)), rows = Math.max(2, Math.floor((s.h - 110) / 80));
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const wx = x + 22 + q * ((s.w - 44) / cols), wy = y - s.h + 26 + r * 74, ww = (s.w - 44) / cols - 16;
        const g = c2.createLinearGradient(0, wy, 0, wy + 52); g.addColorStop(0, '#FFE6A6'); g.addColorStop(1, '#F7A94A');
        c2.fillStyle = hash(s.i, r * 9 + q) < 0.85 ? g : '#2B1F3A'; c2.fillRect(wx, wy, ww, 52);
        c2.fillStyle = 'rgba(40,20,10,0.6)'; c2.fillRect(wx + ww / 2 - 2, wy, 4, 52);
      }
      // awning + door
      paper(c2, [[x + s.w * 0.25, y - 96], [x + s.w * 0.75, y - 96], [x + s.w * 0.8, y - 74], [x + s.w * 0.2, y - 74]], s.awn, { blur: 4 });
      paper(c2, rectPts(x + s.w * 0.4, y - 72, s.w * 0.2, 72), '#1E1430', { shadow: false });
      if (s.sign) { c2.save(); c2.font = NEON(30); const tw = c2.measureText(s.sign).width; paper(c2, rectPts(x + s.w / 2 - tw / 2 - 16, y - s.h - 30, tw + 32, 50), '#1A0F2E', { blur: 6 }); c2.fillStyle = s.neon; c2.shadowColor = s.neon; c2.shadowBlur = 18; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(s.sign, x + s.w / 2, y - s.h - 4); c2.restore(); }
    });
    if (k >= 1) doodle(c, rectPts(x, y - s.h, s.w, s.h), t, { closed: true, color: s.neon, width: 4, glow: true, seed: 100 + s.i, prog: A(t, s.popT + 0.2, 0.5) });
  }
  function towerCard(c, tw, sx, t) {
    const x = sx, y = GROUND - 30;
    paper(c, rectPts(x, y - tw.h, tw.w, tw.h), '#24174A', { blur: 10 });
    const r = rng(tw.seed + 3);
    for (let yy = y - tw.h + 14; yy < y - 10; yy += 16) for (let xx = x + 10; xx < x + tw.w - 10; xx += 14) if (r() < 0.55) { c.fillStyle = ['#FFE8B0', '#FFD36B', '#FFB2E6', '#9FF3FF'][(r() * 4) | 0]; c.globalAlpha = 0.5 + r() * 0.5; c.fillRect(xx, yy, 7, 9); }
    c.globalAlpha = 1;
    doodle(c, [[x, y - tw.h], [x + tw.w, y - tw.h]], t, { color: tw.neon, width: 4, glow: true, seed: 200 + tw.seed });
  }
  function arcTower(c, sx, t) {
    const x = sx, y = GROUND - 30, w = 190, h = 640;
    paper(c, rectPts(x - w / 2, y - h, w, h), '#0E2C3E', { blur: 14 });
    for (let k = 1; k < 7; k++) doodle(c, [[x - w / 2, y - h + k * 90], [x + w / 2, y - h + k * 90]], t, { color: COL.cyan, width: 3, glow: true, seed: 300 + k });
    paper(c, rectPts(x - 70, y - h + 30, 140, 70), '#08141E', { blur: 4 });
    c.save(); c.font = NEON(56); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = COL.cyan; c.shadowColor = COL.cyan; c.shadowBlur = 24; c.fillText('ARC', x, y - h + 66); c.restore();
    doodle(c, rectPts(x - w / 2, y - h, w, h), t, { closed: true, color: COL.cyan, width: 4, glow: true, seed: 310 });
  }
  function townHall(c, sx, t, k) {
    const x = sx, y = GROUND, w = 520, h = 250;
    popCard(c, x - w / 2, y, w, h + 40, k, (c2) => {
      paper(c2, rectPts(x - w / 2, y - h, w, h), '#1C1838', { blur: 16 });
      paper(c2, rectPts(x - w / 2 - 10, y - h - 40, w + 20, 46), '#EDE8FA', { blur: 6 });
      c2.font = SANS(800, 22); c2.fillStyle = '#2A1B52'; c2.textAlign = 'center'; c2.fillText('TOWN HALL', x, y - h - 10);
      for (let q = 0; q < 6; q++) paper(c2, rectPts(x - w / 2 + 30 + q * 88, y - h + 6, 26, h - 6), '#F3F0FF', { blur: 4 });
      paper(c2, rectPts(x - 50, y - 120, 100, 120), '#3A2B26', { shadow: false });
      // paper dome
      const pts = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + (i / 16) * Math.PI; pts.push([x + Math.cos(a) * 110, y - h - 40 + Math.sin(a) * 100]); }
      paper(c2, pts, '#3FB8FF', { blur: 10 }); paper(c2, pts.slice(8).concat([[x, y - h - 40]]), '#2387E0', { shadow: false });
    });
    if (k >= 1) doodle(c, rectPts(x - w / 2, y - h, w, h), t, { closed: true, color: COL.cyan, width: 4, glow: true, seed: 320 });
  }
  function ground(c, t, cx) {
    paper(c, rectPts(0, GROUND - 6, W, 50), '#4B3C78', { blur: 10, sy: -4 });          // sidewalk
    paper(c, rectPts(0, GROUND + 40, W, H - GROUND - 40), '#2A2346', { shadow: false });   // road
    c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 2; for (let x = -((cx * 1.0) % 80); x < W; x += 80) { c.beginPath(); c.moveTo(x, GROUND - 6); c.lineTo(x - 10, GROUND + 40); c.stroke(); }
    doodle(c, [[-20, GROUND + 46], [W + 20, GROUND + 46]], t, { color: COL.pink, width: 5, glow: true, seed: 401, step: 60 });
    doodle(c, [[-20, GROUND + 150], [W + 20, GROUND + 150]], t, { color: COL.cyan, width: 7, glow: true, seed: 402, step: 60 });
    doodle(c, [[-20, H - 14], [W + 20, H - 14]], t, { color: COL.pink, width: 5, glow: true, seed: 403, step: 60 });
  }
  function lamp(c, x, t) {
    doodle(c, [[x, GROUND + 8], [x, GROUND - 210]], t, { color: '#2B2149', width: 9, jitter: 1, seed: 500 + Math.round(x) });
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, GROUND - 226, 0, x, GROUND - 226, 90); g.addColorStop(0, 'rgba(255,90,220,0.7)'); g.addColorStop(1, 'rgba(255,90,220,0)'); c.fillStyle = g; c.fillRect(x - 90, GROUND - 316, 180, 180); c.restore();
    paper(c, (() => { const p = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; p.push([x + Math.cos(a) * 22, GROUND - 226 + Math.sin(a) * 22]); } return p; })(), '#FF8BE6', { blur: 8 });
  }
  function paperCube(c, x, y, s, col, t, seed) {
    const bob = Math.sin(t * 2 + seed) * 10;
    c.save(); c.translate(x, y + bob); c.rotate(Math.sin(t + seed) * 0.15);
    paper(c, [[0, -s], [s * 0.87, -s / 2], [0, 0], [-s * 0.87, -s / 2]], col, { blur: 12 });
    paper(c, [[-s * 0.87, -s / 2], [0, 0], [0, s], [-s * 0.87, s / 2]], shade(col, 0.75), { shadow: false });
    paper(c, [[s * 0.87, -s / 2], [0, 0], [0, s], [s * 0.87, s / 2]], shade(col, 0.55), { shadow: false });
    c.restore();
  }
  // OWN LAND: plot with an UP FOR SALE sign that flips to YOURS, then the avatar's building folds up
  const PLOT = 2300;
  function plotScene(c, cx, t) {
    const sx = PLOT - cx;
    if (sx < -500 || sx > W + 200) return;
    doodle(c, rectPts(sx, GROUND - 4, 300, 20), t, { closed: true, color: '#FFFFFF', width: 3, dash: [10, 10], seed: 600 });
    const flip = A(t, 11.25, 0.35, io3), bk = A(t, 11.75, 0.7, crit), signOut = A(t, 11.75, 0.2, io3);
    // the avatar's building
    popCard(c, sx + 10, GROUND, 280, 380, bk, (c2) => {
      paper(c2, rectPts(sx + 10, GROUND - 380, 280, 380), '#8A3B4A', { blur: 16 });
      for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) { c2.fillStyle = '#FFE08A'; c2.fillRect(sx + 34 + q * 86, GROUND - 350 + r * 86, 60, 58); }
      paper(c2, rectPts(sx + 115, GROUND - 90, 70, 90), '#1E1430', { shadow: false });
      doodle(c2, [[sx + 150, GROUND - 380], [sx + 150, GROUND - 480]], t, { color: '#2B2149', width: 5, seed: 610 });
      paper(c2, [[sx + 150, GROUND - 480], [sx + 230, GROUND - 462], [sx + 150, GROUND - 444]], COL.red, { blur: 6 });
    });
    if (bk >= 1) doodle(c, rectPts(sx + 10, GROUND - 380, 280, 380), t, { closed: true, color: COL.red, width: 4, glow: true, seed: 620, prog: A(t, 12.4, 0.5) });
    // sign (flips on its post)
    if (signOut < 1) {
      const pk = pop(prog(t, 10.55, 10.95));
      c.save(); c.translate(sx + 150, GROUND - 130); c.scale(Math.cos(flip * Math.PI) * pk * (1 - signOut), pk * (1 - signOut));
      doodle(c, [[0, 0], [0, 130]], t, { color: '#2B2149', width: 8, seed: 630 });
      const yours = flip > 0.5;
      paper(c, rectPts(-130, -70, 260, 100), yours ? '#1E3A2B' : '#2A0F2E', { blur: 10 });
      c.save(); if (yours) c.scale(-1, 1); c.font = NEON(yours ? 54 : 40); c.textAlign = 'center'; c.textBaseline = 'middle'; const col = yours ? COL.green : COL.pink; c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 20; c.fillText(yours ? 'YOURS!' : 'UP FOR SALE', 0, -18); c.restore();
      doodle(c, rectPts(-130, -70, 260, 100), t, { closed: true, color: yours ? COL.green : COL.pink, width: 3, glow: true, seed: 640 });
      c.restore();
    }
    // confetti
    const ck = prog(t, 12.0, 13.4);
    if (ck > 0 && ck < 1) for (let i = 0; i < 46; i++) {
      const a = hash(i, 1) * Math.PI - Math.PI, sp = 300 + hash(i, 2) * 500, lt = ck * 1.4;
      const x = sx + 150 + Math.cos(a) * sp * lt, y = GROUND - 420 + Math.sin(a) * sp * lt + 520 * lt * lt;
      c.save(); c.translate(x, y); c.rotate(lt * 8 * (hash(i, 3) - 0.5)); c.globalAlpha = 1 - ck;
      paper(c, rectPts(-8, -5, 16, 10), [COL.pink, COL.cyan, COL.yellow, COL.green, COL.purple][i % 5], { shadow: false }); c.restore();
    }
  }
  // HANG OUT: friends pop up, doodle chat bubbles, everybody bops
  const FRIENDS = [['cyan', 3020, 14.0], ['yellow', 3200, 14.25], ['purple', 3460, 14.5], ['green', 3640, 14.75]];
  function bubble(c, x, y, k, t, icon, seed) {
    if (k <= 0) return;
    c.save(); c.translate(x, y); c.scale(k, k);
    paper(c, [[-56, -44], [56, -46], [60, 30], [10, 32], [-6, 56], [-4, 32], [-58, 30]], COL.paper, { blur: 10 });
    doodle(c, [[-56, -44], [56, -46], [60, 30], [10, 32], [-6, 56], [-4, 32], [-58, 30]], t, { closed: true, color: '#2A1B52', width: 3, seed });
    if (icon === 'heart') { c.fillStyle = COL.pink; c.beginPath(); c.moveTo(0, 20); c.bezierCurveTo(-46, -8, -18, -40, 0, -16); c.bezierCurveTo(18, -40, 46, -8, 0, 20); c.fill(); }
    else if (icon === 'note') { doodle(c, [[-10, 14], [-10, -26], [16, -32], [16, 8]], t, { color: '#2A1B52', width: 5, seed: seed + 1 }); c.fillStyle = '#2A1B52'; c.beginPath(); c.ellipse(-17, 15, 10, 7, -0.4, 0, TAU); c.ellipse(9, 9, 10, 7, -0.4, 0, TAU); c.fill(); }
    else if (icon === 'smile') { c.strokeStyle = '#2A1B52'; c.lineWidth = 4; c.beginPath(); c.arc(0, -6, 26, 0, TAU); c.stroke(); c.fillStyle = '#2A1B52'; c.fillRect(-11, -16, 6, 8); c.fillRect(5, -16, 6, 8); doodle(c, [[-12, 2], [0, 10], [12, 2]], t, { color: '#2A1B52', width: 4, seed: seed + 2 }); }
    else { c.font = MARK(40); c.fillStyle = '#2A1B52'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(icon, 0, -6); }
    c.restore();
  }
  function hangout(c, cx, t) {
    const bop = t > 15.0 ? Math.abs(Math.sin((t - 15.0) * Math.PI * 2)) * 12 : 0;
    FRIENDS.forEach(([col, wx, t0], i) => {
      const sx = wx - cx, k = A(t, t0, 0.5, pop);
      if (k <= 0) return;
      c.save(); c.translate(sx, GROUND + 40); c.scale(1, k); folk(c, 0, 20, 1.7, col, t, { flip: wx > 3300, happy: true, bob: bop * (i % 2 ? 1 : 0.7), wave: i === 1 && t < 15.5, arms: i === 3 && t > 15.0 ? 'up' : null }); c.restore();
    });
    const icons = [['heart', 3020, 14.5], ['gm', 3200, 14.75], ['note', 3460, 15.0], ['smile', 3640, 15.25]];
    icons.forEach(([ic, wx, t0], i) => bubble(c, wx - cx + 20, GROUND - 330 + Math.sin(t * 3 + i) * 6, 1.3 * pop(prog(t, t0, t0 + 0.4)) * (1 - A(t, 16.6, 0.3, io3)), t, ic, 700 + i * 10));
    // voice: mic + sound waves on one friend
    const mk2 = A(t, 15.25, 0.3);
    if (mk2 > 0) { const sx = 3460 - cx - 70, sy = GROUND - 150; for (let r = 1; r <= 3; r++) doodle(c, [[sx - 12 * r, sy - 18 * r], [sx - 22 * r, sy], [sx - 12 * r, sy + 18 * r]], t, { color: COL.cyan, width: 3, glow: true, seed: 750 + r, prog: mk2 }); }
  }
  function city(c, t) {
    const cx = camX(t);
    sky(c, t); moon(c, 1650 - cx * 0.05, 170, 56, t);
    for (const tw of TOWERS) { const sx = tw.x - cx * 0.45; if (sx > -200 && sx < W + 50) towerCard(c, tw, sx, t); }
    arcTower(c, 2000 - cx * 0.45, t);
    for (const cb of CUBES) { const sx = cb.x - cx * 0.7; if (sx > -80 && sx < W + 80) paperCube(c, sx, cb.y, cb.s, cb.col, t, cb.x); }
    ground(c, t, cx);
    townHall(c, 3330 - cx, t, A(t, 13.75, 0.6));
    for (const s of SHOPS) { const sx = s.x - cx; if (sx > -s.w - 40 && sx < W + 40) shopCard(c, s, sx, t, A(t, s.popT, 0.55, crit)); }
    plotScene(c, cx, t);
    for (const lx of LAMPS) { const sx = lx - cx; if (sx > -60 && sx < W + 60) lamp(c, sx, t); }
    // the hero
    const walking = (t > 7.0 && t < 10.9) || (t > 13.15 && t < 14.15);
    const heroX = t < 7.6 ? lerp(220, 760, A(t, 7.0, 0.6, o3)) : 760;
    const pointing = t > 11.0 && t < 11.8;
    folk(c, heroX, GROUND + 90, 1.85, 'red', t, { walk: walking ? t * 1.9 : 0, happy: t > 11.4, arms: pointing ? 'point' : t > 12.0 && t < 13.0 ? 'up' : null, bob: t > 15.0 ? Math.abs(Math.sin((t - 15.0) * Math.PI * 2)) * 12 : 0 });
    hangout(c, cx, t);
    // chapter titles
    marker(c, 'EXPLORE', 110, 190, 110, '#FFFFFF', t, 7.5, { out: 10.25, underline: COL.cyan });
    marker(c, 'OWN LAND', 110, 190, 110, '#FFFFFF', t, 10.75, { out: 13.15, underline: COL.pink });
    marker(c, 'HANG OUT', 110, 190, 110, '#FFFFFF', t, 14.0, { out: 16.45, underline: COL.yellow });
  }

  // ---------- scene 7: end card (16.5–20) ----------
  function ending(c, t) {
    const up = A(t, 16.5, 0.9, io3);
    c.save(); c.translate(0, up * 520); city(c, t); c.restore();
    // sky above the town
    c.save(); c.beginPath(); c.rect(0, 0, W, up * 520); c.clip(); sky(c, t + 30); c.restore();
    const ck = prog(t, 16.7, 19.6);
    if (ck > 0 && ck < 1) crane(c, lerp(-200, W + 200, ck), 520 - Math.sin(ck * Math.PI) * 300, 1.3, t);
    const k = pop(prog(t, 17.2, 17.8));
    if (k > 0) {
      c.save(); c.translate(W / 2, 420); c.scale(k, k); c.rotate(-0.03);
      paper(c, [[-520, -150], [520, -160], [530, 150], [-510, 160]], '#1B0E36', { blur: 30, sy: 18 });
      paper(c, [[470, -158], [530, -159], [526, -100]], '#3A2768', { shadow: false });            // folded corner
      doodle(c, [[-520, -150], [520, -160], [530, 150], [-510, 160]], t, { closed: true, color: COL.pink, width: 5, glow: true, seed: 900 });
      c.font = NEON(190); c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const [b, col] of [[40, COL.pink], [16, COL.cyan]]) { c.shadowColor = col; c.shadowBlur = b; c.fillStyle = col; c.fillText('ArcTown.app', 0, 6); }
      c.shadowBlur = 0; c.fillStyle = '#FFFFFF'; c.fillText('ArcTown.app', 0, 6);
      c.restore();
    }
    marker(c, 'explore  ·  own land  ·  hang out', W / 2, 700, 64, COL.yellow, t, 17.75, { align: 'center', rot: -0.02 });
    const ak = A(t, 18.4, 0.5);
    if (ak > 0) { doodle(c, [[1300, 820], [1420, 780], [1500, 700]], t, { color: '#FFFFFF', width: 5, seed: 950, prog: ak }); doodle(c, [[1470, 712], [1500, 700], [1508, 732]], t, { color: '#FFFFFF', width: 5, seed: 951, prog: prog(ak, 0.7, 1) }); marker(c, 'come hang out!', 1260, 880, 48, '#FFFFFF', t, 18.6, { align: 'center' }); }
  }

  // ---------- page turn (6.6–7.1): S3 curls away to reveal the city ----------
  const bufA = mk(W, H), bufB = mk(W, H);
  function pageTurn(c, t) {
    const k = io3(prog(t, 6.6, 7.1));
    scene3(bufA.getContext('2d'), t); city(bufB.getContext('2d'), 7.0 + (t - 6.6) * 0.2);
    const xf = W * (1 - k * 1.05), flap = Math.min(W - xf, xf);
    c.drawImage(bufB, 0, 0);
    // old page left of the fold
    c.save(); c.beginPath(); c.rect(0, 0, Math.max(0, xf), H); c.clip(); c.drawImage(bufA, 0, 0); c.restore();
    // shadow cast on the new page
    const sg = c.createLinearGradient(xf, 0, xf + 140, 0); sg.addColorStop(0, 'rgba(10,0,30,0.55)'); sg.addColorStop(1, 'rgba(10,0,30,0)'); c.fillStyle = sg; c.fillRect(xf, 0, 140, H);
    // the back of the turning page
    if (flap > 1) {
      const fg = c.createLinearGradient(xf - flap, 0, xf, 0); fg.addColorStop(0, '#CFC4EE'); fg.addColorStop(0.85, '#F6F1FF'); fg.addColorStop(1, '#FFFFFF');
      c.save(); c.shadowColor = 'rgba(10,0,30,0.5)'; c.shadowBlur = 30; c.shadowOffsetX = -10; c.fillStyle = fg; c.fillRect(xf - flap, 0, flap, H); c.restore();
      c.save(); c.globalAlpha = 0.25; c.drawImage(GRAIN, xf - flap, 0, flap, H); c.restore();
    }
  }

  // ---------- frame ----------
  function renderAt(t) {
    t = clamp(t, 0, DUR - 1e-6);
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.filter = 'none';
    if (t < 3.0) scene1(c, t);
    else if (t < 5.5) scene2(c, t);
    else if (t < 6.6) scene3(c, t);
    else if (t < 7.1) pageTurn(c, t);
    else if (t < 16.5) city(c, t);
    else ending(c, t);
    // paper grain over everything + soft vignette
    c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.22; const pat = c.createPattern(GRAIN, 'repeat'); c.fillStyle = pat; c.fillRect(0, 0, W, H); c.restore();
    const v = c.createRadialGradient(W / 2, H / 2, 560, W / 2, H / 2, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,0,25,0.5)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
  }

  window.PAPER = { W, H, FPS, DUR, renderAt };
  window.PAPER.ready = Promise.all([document.fonts.load(MARK(60)), document.fonts.load(NEON(60)), document.fonts.load(SANS(800, 20))]).then(() => document.fonts.ready).then(() => { buildGrain(); buildCity(); });
  if (!/[?&]render\b/.test(location.search)) {
    window.PAPER.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
  }
})();
