// ArcTown 3D engine, shared by the showcase film and the Halloween invite.
// A full camera (position, yaw, pitch, roll, focal length), near-plane polygon clipping, painter's sort,
// neon edges, lit windows, signs mapped onto faces, lamps, benches, trees, floating cubes and avatars.
// World: metres. x right, y up, z down the avenue toward the Town Hall (z ≈ 300) and the ARC tower behind it.
// Two themes: 'neon' (the game as it looks) and 'spooky' (Halloween: fog, orange/purple/green neon, renamed signs).
window.TOWN = (themeName) => {
  themeName = themeName || 'neon';
  const W = 1920, H = 1080, TAU = Math.PI * 2, NEAR = 0.3;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const io3 = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const io5 = (p) => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2);
  const crit = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const k = 7 * p; return (1 - (1 + k) * Math.exp(-k)) / (1 - 8 * Math.exp(-7)); };
  const pop = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const z = 0.55, w = 12, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * p) * (Math.cos(wd * p) + z / Math.sqrt(1 - z * z) * Math.sin(wd * p)); };
  const A = (t, t0, d, f = crit) => f(prog(t, t0, t0 + d));
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
  const mix = (h1, h2, k, a = 1) => { const p = hex(h1), q = hex(h2); return `rgba(${Math.round(lerp(p[0], q[0], k))},${Math.round(lerp(p[1], q[1], k))},${Math.round(lerp(p[2], q[2], k))},${a})`; };
  const shade = (h, f) => { const [r, g, b] = hex(h); return '#' + [r, g, b].map((v) => clamp(Math.round(v * f), 0, 255).toString(16).padStart(2, '0')).join(''); };
  function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = (a, b = 0, c = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const NEONF = (s) => `400 ${s}px "Tilt Neon", sans-serif`, SANS = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`;

  const COL = { cyan: '#2EF2FF', pink: '#FF3FD8', purple: '#9B6BFF', yellow: '#FFE45C', orange: '#FF7A1A', green: '#7CFF4F', blood: '#FF2A3D', white: '#FFFFFF' };
  const THEMES = {
    neon: { sky: ['#120833', '#45207E', '#B85FA0'], ground: '#221E36', side: '#2E2847', road: '#1C1830', plaza: '#2A2545', fog: '#3A2462', fogD: 900,
      neons: [COL.cyan, COL.pink, COL.purple, COL.yellow], line: COL.cyan, curb: COL.pink, lamp: COL.pink, lampCore: '#FFC4F4',
      brick: ['#4A3328', '#3F2C2A', '#4B3530'], tower: ['#17112B', '#1B1430', '#141026'], winPal: ['#FFE8B0', '#FFD36B', '#FFB2E6', '#9FF3FF', '#FFFFFF', '#FF9E6B'], winLit: 0.62, brickWin: ['#FFE3A1', '#F2A84C'],
      bench: '#2B6F78', benchNeon: COL.cyan, tree: '#3E8C83', hallBody: '#E9E6F5', hallNeon: COL.cyan, arcNeon: COL.cyan, dome: ['#E8FBFF', '#4FC7FF', '#1060C0'],
      names: { blip: ['Your Project Here', COL.pink], glimmer: ['FINALITY', COL.purple], tide: ['$NOSELLING', COL.cyan], sale: ['UP FOR SALE', COL.pink], hall: 'TOWN HALL', arc: 'ARC',
        welcome: ['ARCTOWN WELCOMES YOU!', 'Explore projects by entering buildings,', 'apply for a building yourself,', 'or hang out with other Arc Members'], biz: ['OPEN A BUSINESS', 'Apply at the Business Desk', 'inside the Town Hall'] } },
    spooky: { sky: ['#030108', '#140720', '#3E1428'], ground: '#120E18', side: '#1C1622', road: '#0F0C14', plaza: '#1A1420', fog: '#2A1E30', fogD: 240,
      neons: [COL.orange, COL.purple, COL.green, COL.orange], line: COL.orange, curb: COL.purple, lamp: COL.orange, lampCore: '#FFD9A8',
      brick: ['#2E2424', '#2A2028', '#33262A'], tower: ['#0C0912', '#100B16', '#0A0810'], towerH: 0.5, winPal: ['#FF9A3C', '#FFB45E', '#FF6A1A', '#B6FF7A', '#C08BFF', '#FFD08A'], winLit: 0.34, brickWin: ['#FFB45E', '#E0581A'],
      bench: '#2A2030', benchNeon: COL.purple, tree: '#2B2A22', hallBody: '#B9AFC4', hallNeon: COL.orange, arcNeon: COL.purple, dome: ['#FFE0B8', '#FF8A2A', '#7A2A0A'],
      names: { blip: ['$BOO HQ', COL.orange], glimmer: ['Grimmer Market', COL.purple], tide: ['Tidepool Swamp', COL.green], sale: ['UP FOR SCARE', COL.orange], hall: 'HAUNTED HALL', arc: 'ARC',
        welcome: ['ARCTOWN WELCOMES YOU...', 'if you dare to enter.', 'The Halloween party', 'is happening tonight'], biz: ['HALLOWEEN PARTY', 'Grab your friends', 'and come hang out'] } },
  };
  const TH = THEMES[themeName];

  // ---------- textures ----------
  // sign textures are built lazily (on first draw, after the web fonts have loaded)
  function signTex(lines, w, h, o = {}) { return { width: w, height: h, lines, o, cv: null }; }
  function texCanvas(tx) { if (!tx.cv) tx.cv = paintSign(tx.lines, tx.width, tx.height, tx.o); return tx.cv; }
  function paintSign(lines, w, h, o = {}) {
    const c = mk(w, h), g = c.getContext('2d');
    if (o.panel) {
      g.fillStyle = o.bg || 'rgba(14,8,30,0.94)'; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, o.r ?? 18); g.fill();
      g.shadowColor = o.edge || COL.pink; g.shadowBlur = 24; g.strokeStyle = o.edge || COL.pink; g.lineWidth = 7; g.stroke(); g.shadowBlur = 0;
      g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2; g.stroke();
    }
    for (const L of lines) {
      g.font = L.font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = (L.ls || 0) + 'px';
      const tw = g.measureText(L.text).width; if (tw > w - 90) { const m = L.font.match(/(\d+)px/); g.font = L.font.replace(m[0], Math.floor(+m[1] * (w - 90) / tw) + 'px'); }
      for (const [blur, a] of [[40, 1], [14, 1], [0, 1]]) { g.shadowColor = L.glow; g.shadowBlur = blur; g.globalAlpha = a; g.fillStyle = blur ? L.glow : (L.core || '#FFFFFF'); g.fillText(L.text, L.x ?? w / 2, L.y); }
      g.shadowBlur = 0; g.globalAlpha = 1;
    }
    return c;
  }

  // ---------- camera + projection ----------
  let CAM = { x: 0, y: 2, z: 0, yaw: 0, pitch: 0, roll: 0, f: 1100 }, cyw = 1, syw = 0, cp = 1, sp = 0;
  function setCam(cam) { CAM = { roll: 0, f: 1100, ...cam }; cyw = Math.cos(CAM.yaw); syw = Math.sin(CAM.yaw); cp = Math.cos(CAM.pitch); sp = Math.sin(CAM.pitch); }
  function toCam(x, y, z) { const dx = x - CAM.x, dy = y - CAM.y, dz = z - CAM.z; const x1 = dx * cyw - dz * syw, z1 = dx * syw + dz * cyw; return [x1, dy * cp - z1 * sp, dy * sp + z1 * cp]; }
  const scr = (p) => [W / 2 + p[0] * CAM.f / p[2], H / 2 - p[1] * CAM.f / p[2]];
  function P(x, y, z) { const p = toCam(x, y, z); if (p[2] < NEAR) return null; const s = scr(p); s.push(p[2]); return s; } // [sx, sy, depth]
  function dirP(yaw, pitch) { // project a direction at infinity (stars, moon)
    const x = Math.cos(pitch) * Math.sin(yaw), y = Math.sin(pitch), z = Math.cos(pitch) * Math.cos(yaw);
    const x1 = x * cyw - z * syw, z1 = x * syw + z * cyw, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; if (z2 < 0.05) return null; return [W / 2 + x1 * CAM.f / z2, H / 2 - y2 * CAM.f / z2];
  }
  function clip(pts) { // Sutherland–Hodgman against z >= NEAR in camera space
    const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], ai = a[2] >= NEAR, bi = b[2] >= NEAR;
      if (ai) out.push(a); if (ai !== bi) { const k = (NEAR - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k), NEAR]); } }
    return out;
  }
  function polyPath(c, world) { const cl = clip(world.map((p) => toCam(p[0], p[1], p[2]))); if (cl.length < 3) return false; c.beginPath(); cl.forEach((p, i) => { const s = scr(p); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.closePath(); return true; }
  function segPath(c, a, b) { let p = toCam(...a), q = toCam(...b); if (p[2] < NEAR && q[2] < NEAR) return false;
    if (p[2] < NEAR) { const k = (NEAR - p[2]) / (q[2] - p[2]); p = [lerp(p[0], q[0], k), lerp(p[1], q[1], k), NEAR]; } else if (q[2] < NEAR) { const k = (NEAR - q[2]) / (p[2] - q[2]); q = [lerp(q[0], p[0], k), lerp(q[1], p[1], k), NEAR]; }
    const s = scr(p), e = scr(q); c.moveTo(s[0], s[1]); c.lineTo(e[0], e[1]); return Math.min(p[2], q[2]); }
  function neon(c, col, w, a = 1) {
    if (a <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = rgba(col, 0.14 * a); c.lineWidth = w * 6; c.stroke(); c.strokeStyle = rgba(col, 0.45 * a); c.lineWidth = w * 2.2; c.stroke(); c.strokeStyle = rgba(col, 0.95 * a); c.lineWidth = w; c.stroke(); c.restore();
  }
  const fogK = (d) => 1 - Math.exp(-d / TH.fogD);

  // ---------- world (deterministic) ----------
  const R = rng(themeName === 'neon' ? 2026 : 2026); // same city in both films
  const BOXES = [], LAMPS = [], BENCHES = [], TREES = [], CUBES = [], SIGNS = [], PLOTS = [];
  const SHOPS = { L: [[34, 'blip'], [96, 'sale'], [150, 'tide'], [214, 'sale']], R: [[40, 'glimmer'], [118, 'sale'], [176, 'sale'], [236, 'blip2']] };
  function addWindows(b, hMax) {
    b.win = []; const brick = b.kind === 'brick', bh = hMax || b.h;
    const faces = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // [nx, nz]
    for (const [nx, nz] of faces) {
      const len = nx ? b.z1 - b.z0 : b.x1 - b.x0, sx = brick ? 3.6 : 2.3, sy = brick ? 4.2 : 2.9, cols = Math.max(1, Math.floor((len - (brick ? 1.4 : 0.8)) / sx)), rows = Math.floor((bh - (brick ? 1.6 : 1)) / sy), list = [];
      const off = (len - (cols - 1) * sx) / 2;
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const u = off + k * sx, y = (brick ? 2.4 : 1.4) + r * sy, hs = hash(b.id, r * 97 + k, nx * 3 + nz + 7);
        let x, z; if (nx) { x = nx < 0 ? b.x0 - 0.04 : b.x1 + 0.04; z = b.z0 + u; } else { z = nz < 0 ? b.z0 - 0.04 : b.z1 + 0.04; x = b.x0 + u; }
        list.push({ x, y, z, lit: hs < (brick ? 0.8 : TH.winLit), col: (hash(b.id, r, k) * TH.winPal.length) | 0, ph: hash(b.id, k, r) });
      }
      b.win.push({ nx, nz, list, w: brick ? 1.7 : 1.0, h: brick ? 2.4 : 1.35 });
    }
  }
  let ID = 1;
  function box(o) { const b = { id: ID++, y0: 0, ...o }; if (b.kind === 'brick' || b.kind === 'tower') addWindows(b); BOXES.push(b); return b; }
  function buildWorld() {
    for (const side of [-1, 1]) {
      const shops = SHOPS[side < 0 ? 'L' : 'R'];
      let z = 8;
      while (z < 262) {
        const shop = shops.find(([sz]) => Math.abs(sz - z) < 14 && !shops.done?.includes(sz));
        const len = shop ? 22 : 16 + R() * 12, dep = 12 + R() * 8, h = shop ? 14 + R() * 4 : 11 + R() * 12, xin = side * 14, xout = side * (14 + dep);
        const b = box({ x0: Math.min(xin, xout), x1: Math.max(xin, xout), z0: z, z1: z + len, h, side, kind: 'brick', col: TH.brick[(R() * 3) | 0], neon: TH.neons[(R() * TH.neons.length) | 0] });
        if (shop) { (shops.done ||= []).push(shop[0]); const key = shop[1] === 'blip2' ? 'tide' : shop[1]; b.shop = key; const nm = TH.names[key]; b.neon = nm[1]; b.sale = key === 'sale';
          const tex = b.sale ? signTex([{ text: nm[0], font: NEONF(150), glow: nm[1], y: 170, ls: 4 }, { text: themeName === 'neon' ? 'YOUR BUSINESS HERE' : 'IF YOU DARE', font: SANS(800, 56), glow: nm[1], y: 300, ls: 6 }, { text: themeName === 'neon' ? 'Apply at the Town Hall' : 'Boo.', font: SANS(600, 44), glow: '#ffffff', y: 380 }], 1100, 460, { panel: true, edge: nm[1] })
            : signTex([{ text: nm[0], font: NEONF(160), glow: nm[1], y: 150, ls: 2 }], 1100, 300, { panel: true, edge: nm[1] });
          const sw = b.sale ? 13 : 14, sh = sw * tex.height / tex.width, zc = (b.z0 + b.z1) / 2, x = xin - side * 0.08, y = b.sale ? 8.5 : 9;
          SIGNS.push({ tex, tl: [x, y + sh / 2, zc + side * sw / 2], tr: [x, y + sh / 2, zc - side * sw / 2], bl: [x, y - sh / 2, zc + side * sw / 2], box: b });
        }
        z += len + 3 + R() * 5;
      }
    }
    // background towers
    for (let i = 0; i < 120; i++) {
      const side = i % 2 ? 1 : -1, z = -60 + R() * 560, x = side * (36 + Math.pow(R(), 1.3) * 150), w = 14 + R() * 18, d = 14 + R() * 18, h = (45 + R() * 140) * (TH.towerH || 1);
      if (Math.abs(x) < 50 && z > 270) continue;
      box({ x0: x - w / 2, x1: x + w / 2, z0: z, z1: z + d, h, side, kind: 'tower', col: TH.tower[(R() * 3) | 0], neon: TH.neons[(R() * TH.neons.length) | 0], sky: true });
    }
    for (let i = 0; i < 26; i++) { const x = -150 + R() * 300, z = 360 + R() * 160, w = 16 + R() * 16; if (Math.abs(x) < 18) continue; box({ x0: x - w / 2, x1: x + w / 2, z0: z, z1: z + w, h: (70 + R() * 130) * (TH.towerH || 1), side: 0, kind: 'tower', col: TH.tower[(R() * 3) | 0], neon: TH.neons[(R() * TH.neons.length) | 0], sky: true }); }
    // Town Hall + ARC tower
    box({ x0: -13, x1: 13, z0: 322, z1: 346, h: 104, kind: 'arc', col: '#0B2A3A', neon: TH.arcNeon });
    box({ x0: -21, x1: 21, z0: 296, z1: 318, h: 1.2, kind: 'plinth', col: TH.hallBody, neon: TH.hallNeon });
    box({ x0: -19, x1: 19, z0: 304, z1: 318, h: 12, kind: 'hallwall', col: '#151426', neon: TH.hallNeon });
    for (let k = 0; k < 6; k++) { const x = -15 + k * 6; box({ x0: x - 0.7, x1: x + 0.7, z0: 299.3, z1: 300.7, y0: 1.2, h: 11.2, kind: 'column', col: TH.hallBody }); }
    box({ x0: -20, x1: 20, z0: 298, z1: 318, y0: 11.2, h: 3, kind: 'roof', col: TH.hallBody, neon: TH.hallNeon });
    SIGNS.push({ tex: signTex([{ text: TH.names.hall, font: SANS(800, 92), glow: TH.hallNeon, y: 75, ls: 10 }], 1000, 150, { panel: true, edge: '#151426', bg: '#0E0C1C', r: 6 }), tl: [-9, 13.4, 297.9], tr: [9, 13.4, 297.9], bl: [-9, 11.7, 297.9] });
    SIGNS.push({ tex: signTex([{ text: TH.names.arc, font: NEONF(230), glow: TH.arcNeon, y: 160 }], 560, 320, { panel: true, edge: TH.arcNeon }), tl: [-9, 92, 321.9], tr: [9, 92, 321.9], bl: [-9, 81.7, 321.9] });
    // plaza billboards
    const bb = (lines, col, x, z, yaw) => { const tex = signTex([{ text: lines[0], font: SANS(900, 66), glow: col, y: 80, ls: 1 }, ...lines.slice(1).map((s, i) => ({ text: s, font: SANS(700, 44), glow: '#ffffff', core: '#EDE8FF', y: 170 + i * 66 }))], 1200, 400, { panel: true, edge: col });
      const w = 15, h = w / 3, cx = Math.cos(yaw), sx = Math.sin(yaw), y = 6.5;
      SIGNS.push({ tex, tl: [x - cx * w / 2, y + h / 2, z + sx * w / 2], tr: [x + cx * w / 2, y + h / 2, z - sx * w / 2], bl: [x - cx * w / 2, y - h / 2, z + sx * w / 2], post: [x, z], backed: true }); };
    bb(TH.names.welcome, themeName === 'neon' ? COL.cyan : COL.orange, -24, 284, -0.45); bb(TH.names.biz, themeName === 'neon' ? COL.green : COL.purple, 24, 284, 0.45);
    for (let z = 10; z < 290; z += 22) for (const side of [-1, 1]) LAMPS.push({ x: side * 11.6, z: z + (side > 0 ? 11 : 0) });
    for (let z = 20; z < 280; z += 33) for (const side of [-1, 1]) BENCHES.push({ x: side * 10.2, z: z + (side > 0 ? 16 : 0) });
    for (let z = 4; z < 290; z += 44) for (const side of [-1, 1]) TREES.push({ x: side * 12.6, z: z + 18 + (side > 0 ? 9 : 0), s: 0.9 + hash(z, side) * 0.4 });
    [[-20, 46, 110], [24, 58, 150], [-8, 64, 190], [14, 40, 210], [-30, 52, 240], [6, 70, 260], [30, 44, 90]].forEach(([x, y, z], i) => CUBES.push({ x, y, z, i, s: 2.4 + (i % 3) * 0.6, col: TH.neons[i % TH.neons.length] }));
  }
  buildWorld();

  // ---------- drawing ----------
  function drawSky(c, t, o = {}) {
    const hy = H / 2 + CAM.f * Math.tan(CAM.pitch);
    const g = c.createLinearGradient(0, hy - 1100, 0, hy); g.addColorStop(0, TH.sky[0]); g.addColorStop(0.55, TH.sky[1]); g.addColorStop(1, TH.sky[2]);
    c.fillStyle = TH.sky[0]; c.fillRect(-200, -200, W + 400, H + 400); c.fillStyle = g; c.fillRect(-200, hy - 1100, W + 400, 1100);
    c.fillStyle = TH.ground; c.fillRect(-200, hy, W + 400, H + 400);
    for (let i = 0; i < 260; i++) { const p = dirP(hash(i, 1) * TAU, 0.06 + hash(i, 2) * 1.3); if (!p) continue; const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.5 + hash(i, 3) * 2) + i)); c.fillStyle = `rgba(255,255,255,${(o.stars ?? 0.8) * tw * hash(i, 4)})`; const s = hash(i, 5) < 0.08 ? 2.6 : 1.5; c.fillRect(p[0], p[1], s, s); }
    if (o.moon) { const p = dirP(o.moon[0], o.moon[1]); if (p) { const r = o.moon[2]; c.save(); c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(p[0], p[1], r * 0.8, p[0], p[1], r * 3.2); gl.addColorStop(0, 'rgba(255,190,120,0.35)'); gl.addColorStop(1, 'rgba(255,120,60,0)'); c.fillStyle = gl; c.fillRect(p[0] - r * 3.2, p[1] - r * 3.2, r * 6.4, r * 6.4); c.restore();
      const mg = c.createRadialGradient(p[0] - r * 0.3, p[1] - r * 0.3, r * 0.1, p[0], p[1], r); mg.addColorStop(0, '#FFF4D6'); mg.addColorStop(0.7, '#FFD08A'); mg.addColorStop(1, '#E89A4A'); c.fillStyle = mg; c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.fill();
      c.fillStyle = 'rgba(180,110,60,0.28)'; for (const [dx, dy, rr] of [[-0.3, -0.2, 0.18], [0.25, 0.15, 0.24], [-0.1, 0.4, 0.12], [0.35, -0.35, 0.1]]) { c.beginPath(); c.arc(p[0] + dx * r, p[1] + dy * r, rr * r, 0, TAU); c.fill(); } } }
    c.save(); c.globalCompositeOperation = 'lighter'; const hz = c.createLinearGradient(0, hy - 260, 0, hy + 60); hz.addColorStop(0, rgba(TH.sky[2], 0)); hz.addColorStop(0.8, rgba(TH.sky[2], 0.35)); hz.addColorStop(1, rgba(TH.sky[2], 0)); c.fillStyle = hz; c.fillRect(-200, hy - 260, W + 400, 320); c.restore();
  }
  function drawGround(c, t, o) {
    const line = (x0, x1, z0, z1, col, a) => { for (const [ww, al] of [[6, 0.1], [2.5, 0.28], [1, 0.95]]) { const w = (x1 - x0) * ww / 2, xc = (x0 + x1) / 2; if (polyPath(c, [[xc - w, 0.02, z0], [xc + w, 0.02, z0], [xc + w, 0.02, z1], [xc - w, 0.02, z1]])) { c.fillStyle = rgba(col, al * a); c.fill(); } } };
    if (polyPath(c, [[-13, 0, -400], [13, 0, -400], [13, 0, 296], [-13, 0, 296]])) { c.fillStyle = TH.side; c.fill(); }
    if (polyPath(c, [[-34, 0, 270], [34, 0, 270], [34, 0, 320], [-34, 0, 320]])) { c.fillStyle = TH.plaza; c.fill(); }
    if (polyPath(c, [[-8, 0, -400], [8, 0, -400], [8, 0, 274], [-8, 0, 274]])) { c.fillStyle = TH.road; c.fill(); }
    c.save(); c.strokeStyle = 'rgba(170,150,255,0.07)'; c.lineWidth = 1; c.beginPath(); for (let z = Math.max(-40, Math.floor((CAM.z - 10) / 3) * 3); z < Math.min(296, CAM.z + 220); z += 3) segPath(c, [-13, 0.01, z], [13, 0.01, z]); c.stroke(); c.restore();
    const L = o.lineLen ?? 1e9, zEnd = Math.min(274, -400 + L);
    line(-0.18, 0.18, -400, zEnd, TH.line, 1); line(-8.1, -7.9, -400, Math.min(296, zEnd), TH.curb, 0.9); line(7.9, 8.1, -400, Math.min(296, zEnd), TH.curb, 0.9);
  }
  function faceVis(nx, ny, nz, px, py, pz) { return (CAM.x - px) * nx + (CAM.y - py) * ny + (CAM.z - pz) * nz > 0; }
  function drawBox(c, b, t, pw, o) {
    const h = b.hFn ? b.hFn(t) : b.h; if (h <= 0.05) return;
    const { x0, x1, z0, z1, y0 } = b, y1 = y0 + h, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, dist = Math.hypot(cx - CAM.x, cz - CAM.z), fk = fogK(dist);
    const faces = [ // [nx, ny, nz, pts, shade]
      [0, 0, -1, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], 1.0], [0, 0, 1, [[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], 0.62],
      [-1, 0, 0, [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], 0.8], [1, 0, 0, [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], 0.8],
      [0, 1, 0, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], 1.25]];
    const vis = faces.map((f) => faceVis(f[0], f[1], f[2], f[3][0][0], f[3][0][1], f[3][0][2]));
    faces.forEach((f, i) => {
      if (!vis[i]) return; if (!polyPath(c, f[3])) return;
      let col = b.col; if (b.kind === 'arc') col = '#0B2A3A';
      c.fillStyle = mix(shade(col, f[4] * (b.kind === 'column' || b.kind === 'plinth' || b.kind === 'roof' ? 1 : 0.75 + 0.25 * pw)), TH.fog, fk * 0.85); c.fill();
      if (b.win && i < 4) drawWindows(c, b, b.win.find((w) => w.nx === f[0] && w.nz === f[2]), h, t, pw, fk);
    });
    // neon edges on visible faces
    const E = (a, bb) => segPath(c, a, bb), nw = Math.max(1, CAM.f / Math.max(4, dist) * (b.sky ? 0.22 : 0.14)), na = pw * (1 - fk * 0.8);
    if (!b.neon || na <= 0.01) return;
    c.beginPath();
    const top = vis[4], cap = b.kind === 'tower';
    const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], fIdx = [0, 3, 1, 2]; // face index for edge k (from corner k to k+1)
    for (let k = 0; k < 4; k++) { const [ax, az] = corners[k], [bx, bz] = corners[(k + 1) % 4], fv = vis[fIdx[k]]; if (fv || top) E([ax, y1, az], [bx, y1, bz]);
      if (!cap && (fv || vis[fIdx[(k + 3) % 4]])) E([ax, y0, az], [ax, y1, az]); }
    if (b.kind === 'arc') for (let y = 14; y < h; y += 13) for (let k = 0; k < 4; k++) { const [ax, az] = corners[k], [bx, bz] = corners[(k + 1) % 4]; if (vis[fIdx[k]]) E([ax, y, az], [bx, y, bz]); }
    if (b.kind === 'hallwall' || b.kind === 'plinth') { c.beginPath(); if (vis[0]) { E([x0, y1, z0], [x1, y1, z0]); E([x0, y0, z0], [x0, y1, z0]); E([x1, y0, z0], [x1, y1, z0]); } }
    if (b.kind === 'column') return;
    neon(c, b.flash ? '#FFFFFF' : b.neon, nw * (b.sale ? 1.4 : 1), na * (b.sale ? 1 : 0.9) * (b.flick ? b.flick(t) : 1));
  }
  function drawWindows(c, b, wf, h, t, pw, fk) {
    if (!wf) return; const brick = b.kind === 'brick';
    const fx = wf.nx, fz = wf.nz, ww = wf.w / 2, wh = wf.h / 2;
    if (brick) {
      const lit = [], dark = [];
      for (const w of wf.list) { if (w.y + wh > h - 0.6) continue; const on = w.lit && pw > w.ph * 0.9 && (b.winFn ? b.winFn(w, t) : true); (on ? lit : dark).push(w); }
      for (const [arr, col] of [[dark, '#1E1622'], [lit, mix(TH.brickWin[0], TH.fog, fk * 0.7)]]) {
        c.beginPath();
        for (const w of arr) { const pts = fx ? [[w.x, w.y - wh, w.z - ww], [w.x, w.y - wh, w.z + ww], [w.x, w.y + wh, w.z + ww], [w.x, w.y + wh, w.z - ww]] : [[w.x - ww, w.y - wh, w.z], [w.x + ww, w.y - wh, w.z], [w.x + ww, w.y + wh, w.z], [w.x - ww, w.y + wh, w.z]];
          const cl = clip(pts.map((p) => toCam(p[0], p[1], p[2]))); if (cl.length < 3) continue; cl.forEach((p, i) => { const s = scr(p); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.closePath(); }
        c.fillStyle = col; c.fill();
      }
      return;
    }
    // tower: dot windows, foreshortened by the face angle
    const vx = CAM.x - (b.x0 + b.x1) / 2, vz = CAM.z - (b.z0 + b.z1) / 2, vl = Math.hypot(vx, vz) || 1, fore = clamp(Math.abs(vx * fx + vz * fz) / vl, 0.15, 1);
    const groups = TH.winPal.map(() => []);
    for (const w of wf.list) { if (!w.lit || w.y > h - 1) continue; if (pw < 1 && w.ph > pw) continue; groups[w.col].push(w); }
    const al = (0.55 + 0.45 * (1 - fk)) * (1 - fk * 0.75);
    groups.forEach((g, k) => {
      if (!g.length) return; c.fillStyle = rgba(TH.winPal[k], al);
      for (const w of g) { const p = toCam(w.x, w.y, w.z); if (p[2] < NEAR) continue; const s = CAM.f / p[2], sx = W / 2 + p[0] * s, sy = H / 2 - p[1] * s; if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
        const dw = Math.max(0.7, ww * 2 * s * fore), dh = Math.max(0.9, wh * 2 * s); c.fillRect(sx - dw / 2, sy - dh / 2, dw, dh); }
    });
  }
  function drawSign(c, sg, t) {
    const a = P(...sg.tl), b = P(...sg.tr), d = P(...sg.bl); if (!a || !b || !d) return;
    if (sg.backed) { // free-standing: only show the front side; posts
      const nx = (sg.tr[1] - sg.tl[1]) * 0, cross = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]); void nx; if (cross < 0) return;
      c.strokeStyle = '#2A2440'; c.lineWidth = Math.max(1, CAM.f / a[2] * 0.25); c.beginPath();
      for (const f of [0.2, 0.8]) { const x = lerp(sg.tl[0], sg.tr[0], f), z = lerp(sg.tl[2], sg.tr[2], f); segPath(c, [x, 0, z], [x, sg.bl[1], z]); } c.stroke();
    }
    const tw = sg.tex.width, th = sg.tex.height, al = (sg.alpha ? sg.alpha(t) : 1) * (sg.box && sg.box.hFn ? clamp(sg.box.hFn(t) / sg.box.h * 2 - 1) : 1);
    if (al <= 0.01) return;
    c.save(); c.globalAlpha = al * (sg.flick ? sg.flick(t) : 1); c.setTransform((b[0] - a[0]) / tw, (b[1] - a[1]) / tw, (d[0] - a[0]) / th, (d[1] - a[1]) / th, a[0], a[1]); c.drawImage(texCanvas(sg.tex), 0, 0); c.restore();
  }
  function drawLamp(c, l, t, pw) {
    const p0 = P(l.x, 0, l.z), p1 = P(l.x, 5.2, l.z); if (!p0 || !p1) return; const s = CAM.f / p1[2], fk = fogK(p1[2]);
    c.strokeStyle = '#2A2440'; c.lineWidth = Math.max(1, s * 0.16); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
    if (pw <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = pw * (1 - fk * 0.6);
    const g = c.createRadialGradient(p1[0], p1[1], 0, p1[0], p1[1], s * 2.4); g.addColorStop(0, rgba(TH.lamp, 0.9)); g.addColorStop(0.25, rgba(TH.lamp, 0.4)); g.addColorStop(1, rgba(TH.lamp, 0)); c.fillStyle = g; c.fillRect(p1[0] - s * 2.4, p1[1] - s * 2.4, s * 4.8, s * 4.8); c.restore();
    c.fillStyle = TH.lampCore; c.globalAlpha = 0.3 + 0.7 * pw; c.beginPath(); c.arc(p1[0], p1[1], Math.max(1.5, s * 0.55), 0, TAU); c.fill(); c.globalAlpha = 1;
  }
  function drawBench(c, bn, t, pw) {
    const { x, z } = bn, w = 0.8, l = 2.2, h = 0.7; const pts = [[x - w, h, z - l], [x + w, h, z - l], [x + w, h, z + l], [x - w, h, z + l]];
    if (polyPath(c, pts)) { c.fillStyle = mix(TH.bench, TH.fog, fogK(Math.hypot(x - CAM.x, z - CAM.z)) * 0.8); c.fill(); neon(c, TH.benchNeon, Math.max(1, CAM.f / Math.max(3, Math.hypot(x - CAM.x, z - CAM.z)) * 0.08), pw * 0.9); }
    c.beginPath(); for (const [dx, dz] of [[-w, -l], [w, -l], [w, l], [-w, l]]) segPath(c, [x + dx, 0, z + dz], [x + dx, h, z + dz]); neon(c, TH.benchNeon, Math.max(1, CAM.f / Math.max(3, Math.hypot(x - CAM.x, z - CAM.z)) * 0.06), pw * 0.8);
  }
  function drawTree(c, tr) {
    const p0 = P(tr.x, 0, tr.z), p1 = P(tr.x, 3.2 * tr.s, tr.z); if (!p0 || !p1) return; const s = CAM.f / p1[2];
    c.strokeStyle = '#3A2A2A'; c.lineWidth = Math.max(1, s * 0.3); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
    const r = 1.9 * tr.s * s; c.fillStyle = mix(TH.tree, TH.fog, fogK(p1[2]) * 0.8); c.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU - Math.PI / 2, rr = r * (0.85 + 0.15 * hash(tr.z | 0, i)); c.lineTo(p1[0] + Math.cos(a) * rr, p1[1] - r * 0.6 + Math.sin(a) * rr); } c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.arc(p1[0] - r * 0.3, p1[1] - r * 0.9, r * 0.45, 0, TAU); c.fill();
  }
  function drawCube(c, cb, t, pw) {
    const y = cb.y + Math.sin(t * 1.3 + cb.i) * 1.2, s = cb.s, ry = t * 0.7 + cb.i, rx = 0.5 + cb.i * 0.2, cr = Math.cos(ry), sr = Math.sin(ry), cxr = Math.cos(rx), sxr = Math.sin(rx);
    const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([a, b, d]) => { const x1 = a * cr + d * sr, z1 = -a * sr + d * cr, y1 = b * cxr - z1 * sxr, z2 = b * sxr + z1 * cxr; return [cb.x + x1 * s, y + y1 * s, cb.z + z2 * s]; });
    const dist = Math.hypot(cb.x - CAM.x, y - CAM.y, cb.z - CAM.z);
    c.save(); c.globalCompositeOperation = 'lighter'; for (const f of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]]) if (polyPath(c, f.map((i) => V[i]))) { c.fillStyle = rgba(cb.col, 0.1 * pw); c.fill(); } c.restore();
    c.beginPath(); for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) segPath(c, V[a], V[b]); neon(c, cb.col, Math.max(1, CAM.f / dist * 0.25), pw);
  }
  function drawDome(c) { const p = P(0, 14.2, 309); if (!p) return; const r = CAM.f / p[2] * 7.5, g = c.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.55, 0, p[0], p[1], r * 1.1); g.addColorStop(0, TH.dome[0]); g.addColorStop(0.35, TH.dome[1]); g.addColorStop(1, TH.dome[2]);
    const sq = clamp(0.35 + Math.abs(CAM.y - 25) / Math.max(1, p[2]) * 0.0, 0.35, 1); void sq; c.beginPath(); c.ellipse(p[0], p[1], r, r * 0.92, 0, Math.PI, 0); c.closePath(); c.fillStyle = g; c.fill(); }

  // ---------- avatars ----------
  // a stylised low-poly ArcTown avatar, drawn as a billboard at its feet (x, z); o: {skin, hair, top, legs, name, costume, bob}
  function drawAvatar(c, a, t) {
    const p = P(a.x, 0, a.z); if (!p) return null; const s = CAM.f / p[2]; if (s < 0.6) return null;
    const bob = (a.bob || 0) * Math.abs(Math.sin(t * Math.PI * 2 * (a.bpm || 1) + (a.ph || 0))), sway = Math.sin(t * 2 + (a.ph || 0)) * 0.06 * (a.bob ? 1 : 0.3);
    const fk = fogK(p[2]); c.save(); c.translate(p[0], p[1] - bob * s); c.scale(s, s); c.rotate(sway * 0.3); c.globalAlpha = 1 - fk * 0.5;
    const fill = (col, f) => { c.fillStyle = col; f(); c.fill(); };
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(0, bob * s / s, 0.45, 0.12, 0, 0, TAU); c.fill();
    const legSw = Math.sin(t * 6 + (a.ph || 0)) * (a.walk ? 0.12 : 0);
    if (a.costume === 'ghost') {
      c.globalAlpha *= 0.92; c.beginPath(); c.moveTo(-0.5, -0.1); for (let i = 0; i <= 6; i++) c.lineTo(-0.5 + i / 6, -0.1 + (i % 2 ? -0.12 : 0)); c.lineTo(0.42, -1.5); c.quadraticCurveTo(0.4, -2.05, 0, -2.05); c.quadraticCurveTo(-0.4, -2.05, -0.42, -1.5); c.closePath(); c.fillStyle = '#F2EEFF'; c.fill();
      c.fillStyle = '#120A1A'; c.beginPath(); c.ellipse(-0.14, -1.55, 0.07, 0.11, 0, 0, TAU); c.ellipse(0.14, -1.55, 0.07, 0.11, 0, 0, TAU); c.fill(); c.restore(); return { x: p[0], y: p[1] - 2.2 * s - bob * s, s };
    }
    fill(a.legs || '#1C1A2A', () => { c.beginPath(); c.roundRect(-0.22 + legSw, -0.95, 0.18, 0.95, 0.06); c.roundRect(0.04 - legSw, -0.95, 0.18, 0.95, 0.06); });
    fill(a.top || '#26233A', () => { c.beginPath(); c.roundRect(-0.3, -1.6, 0.6, 0.72, 0.12); });
    const arm = a.wave ? Math.sin(t * 9) * 0.3 : 0;
    c.save(); c.translate(-0.33, -1.52); c.rotate(0.12 + (a.dance ? Math.sin(t * Math.PI * 4 + (a.ph || 0)) * 0.6 : 0)); fill(a.top || '#26233A', () => { c.beginPath(); c.roundRect(-0.08, 0, 0.15, 0.62, 0.06); }); c.restore();
    c.save(); c.translate(0.33, -1.52); c.rotate(-0.12 - (a.wave ? 2.4 + arm : 0) - (a.dance ? Math.sin(t * Math.PI * 4 + (a.ph || 0) + 1) * 0.6 : 0)); fill(a.top || '#26233A', () => { c.beginPath(); c.roundRect(-0.07, 0, 0.15, 0.62, 0.06); }); c.restore();
    if (a.costume === 'pumpkin') { const g = c.createRadialGradient(-0.08, -2.0, 0.05, 0, -1.88, 0.4); g.addColorStop(0, '#FFB15A'); g.addColorStop(1, '#D9560F'); c.fillStyle = g; c.beginPath(); c.ellipse(0, -1.88, 0.38, 0.32, 0, 0, TAU); c.fill(); c.fillStyle = '#3B6B1E'; c.fillRect(-0.03, -2.26, 0.06, 0.1);
      c.fillStyle = '#FFE27A'; c.beginPath(); c.moveTo(-0.2, -1.95); c.lineTo(-0.1, -2.03); c.lineTo(-0.06, -1.93); c.moveTo(0.2, -1.95); c.lineTo(0.1, -2.03); c.lineTo(0.06, -1.93); c.fill(); c.beginPath(); c.moveTo(-0.2, -1.8); c.lineTo(0.2, -1.8); c.lineTo(0.1, -1.72); c.lineTo(-0.1, -1.72); c.fill(); }
    else {
      fill(a.skin || '#E6B08A', () => { c.beginPath(); c.ellipse(0, -1.86, 0.24, 0.28, 0, 0, TAU); });
      fill(a.hair || '#B4472A', () => { c.beginPath(); c.ellipse(0, -2.0, 0.26, 0.17, 0, Math.PI, 0); c.rect(-0.26, -2.02, 0.07, 0.2); });
      if (a.bot) { c.fillStyle = '#2EF2FF'; c.fillRect(-0.16, -1.92, 0.32, 0.07); }
      if (a.costume === 'witch') { c.fillStyle = '#1A0F24'; c.beginPath(); c.ellipse(0, -2.08, 0.42, 0.08, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-0.22, -2.1); c.lineTo(0.12, -2.75); c.lineTo(0.22, -2.1); c.closePath(); c.fill(); c.fillStyle = '#9B3DFF'; c.fillRect(-0.21, -2.2, 0.42, 0.06); }
      if (a.costume === 'vamp') { c.fillStyle = '#5A0A16'; c.beginPath(); c.moveTo(-0.45, -1.62); c.lineTo(0, -1.4); c.lineTo(0.45, -1.62); c.lineTo(0.38, -0.5); c.lineTo(-0.38, -0.5); c.closePath(); c.fill(); }
    }
    c.restore();
    return { x: p[0], y: p[1] - 2.35 * s - bob * s, s };
  }
  function nameTag(c, x, y, s, name, col = '#2E7BFF') {
    const fs = clamp(s * 0.32, 11, 30); c.save(); c.font = SANS(600, fs); const w = c.measureText(name).width + fs * 1.1, h = fs * 1.55;
    c.fillStyle = rgba(col, 0.85); c.beginPath(); c.roundRect(x - w / 2, y - h, w, h, h * 0.3); c.fill(); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, x, y - h / 2 + 1); c.restore();
  }

  // ---------- frame ----------
  // o: { power(box,t)->0..1, lineLen, items: [[x,z,drawFn(c)]] extra world billboards, sky:{stars,moon} }
  function render(c, cam, t, o = {}) {
    setCam(cam); c.save();
    if (CAM.roll) { c.translate(W / 2, H / 2); c.rotate(CAM.roll); c.translate(-W / 2, -H / 2); }
    drawSky(c, t, o.sky || {}); drawGround(c, t, o);
    const pw = (b) => (o.power ? o.power(b, t) : 1), items = [];
    const push = (x, z, f, bias = 0) => { const d = Math.hypot(x - CAM.x, z - CAM.z) + bias; if (d < 1400) items.push([d, f]); };
    for (const b of BOXES) { const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2; const p = toCam(cx, b.h / 2, cz); if (p[2] < -Math.max(b.x1 - b.x0, b.z1 - b.z0, b.h)) continue; push(cx, cz, () => drawBox(c, b, t, pw(b), o), b.kind === 'column' ? -3 : b.kind === 'roof' ? -1 : b.kind === 'plinth' ? 4 : 0); }
    for (const s of SIGNS) { const x = (s.tl[0] + s.tr[0]) / 2, z = (s.tl[2] + s.tr[2]) / 2; push(x, z, () => drawSign(c, s, t), s.box ? -0.5 : -0.5); }
    for (const l of LAMPS) push(l.x, l.z, () => drawLamp(c, l, t, o.lampPower ? o.lampPower(l, t) : pw({ z0: l.z, kind: 'lamp' })));
    for (const bn of BENCHES) push(bn.x, bn.z, () => drawBench(c, bn, t, pw({ z0: bn.z, kind: 'bench' })));
    for (const tr of TREES) push(tr.x, tr.z, () => drawTree(c, tr));
    for (const cb of CUBES) push(cb.x, cb.z, () => drawCube(c, cb, t, o.cubePower ?? 1), -5);
    push(0, 309, () => drawDome(c), -6);
    for (const [x, z, f, bias] of o.items || []) push(x, z, () => f(c), bias || 0);
    items.sort((a, b) => b[0] - a[0]); for (const [, f] of items) f();
    c.restore();
  }

  return { W, H, TAU, COL, TH, THEMES, render, setCam, texCanvas, addWindows, P, toCam, dirP, segPath, polyPath, neon, signTex, drawAvatar, nameTag, BOXES, SIGNS, LAMPS, CUBES,
    clamp, lerp, prog, io3, io5, crit, pop, A, rgba, mix, hash, rng, mk, NEONF, SANS, fogK };
};
