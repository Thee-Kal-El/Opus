// FINALITY — Issue 01 trailer. 15s, 1920x1080 @ 60fps, cut to 120 BPM. Green-on-black terminal brutalism.
// 0–1 boot onto Arc mainnet · 1.0 DROP: "FINALITY" slams letter by letter and match-cuts into the real cover
// 1.6–4 cover: GENESIS → 350ms · 4–6.5 p01: "OUR OATH TO YOU", "probably" struck → FINAL · 6.5–9 p02: lightning
// headline, blocks light up to FINAL, the dateline · 9–11.5 p03: ARC NET + the six purpose cards + 700M+ · 11.5–13
// p04: 10B minted, humans/machines · 13–15 every page fans out in 3D and stacks into the cover. Deterministic.
(() => {
  'use strict';
  const K = window.KIT, { TAU, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, rr, hash } = K;
  const W = 1920, H = 1080, FPS = 60, DUR = 20, BT = 0.5, PW = 1545, PH = 2000;
  const SLOW = 15 / 20; // the cut was designed at 15s; it now plays 4/3 slower (20s, music at 90 BPM)
  let REAL = 0;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const G = '#22F27A', G2 = '#0FBF5A', BG = '#020403', Y = '#FFD23F';
  const D = (s) => `800 ${s}px "Inter Tight", sans-serif`, M = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const PAGES = ['cover', 'p01', 'p02', 'p03', 'p04'];
  const ease = (t, a, b, f = io3) => f(prog(t, a, b)), pulse = (t, T, k = 12) => (t >= T ? Math.exp(-(t - T) * k) : 0);
  function txt(c, s, x, y, font, col, align = 'center', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  // condensed display type (the cover's compressed grotesk, approximated by squeezing Inter Tight)
  function cond(c, s, x, y, size, col, sq = 0.62, align = 'center', stroke = 0) {
    c.save(); c.translate(x, y); c.scale(sq, 1); c.font = D(size); c.textAlign = align; c.textBaseline = 'alphabetic'; c.letterSpacing = `${-size * 0.02}px`;
    if (stroke) { c.lineWidth = stroke; c.strokeStyle = '#000'; c.lineJoin = 'round'; c.strokeText(s, 0, 0); } c.fillStyle = col; c.fillText(s, 0, 0); c.restore();
  }

  // ---------- 3D page renderer ----------
  let CAM = { x: 0, y: 0, z: -2000, yaw: 0, pitch: 0, roll: 0, f: 1100 };
  function setCam(c) { CAM = c; CAM.cy = Math.cos(c.yaw); CAM.sy = Math.sin(c.yaw); CAM.cp = Math.cos(c.pitch); CAM.sp = Math.sin(c.pitch); CAM.cr = Math.cos(c.roll); CAM.sr = Math.sin(c.roll); }
  function P(x, y, z) {
    const dx = x - CAM.x, dy = y - CAM.y, dz = z - CAM.z, x1 = dx * CAM.cy - dz * CAM.sy, z1 = dx * CAM.sy + dz * CAM.cy, y2 = dy * CAM.cp - z1 * CAM.sp, z2 = dy * CAM.sp + z1 * CAM.cp;
    const x3 = x1 * CAM.cr - y2 * CAM.sr, y3 = x1 * CAM.sr + y2 * CAM.cr; if (z2 < 5) return null; return [W / 2 + x3 * CAM.f / z2, H / 2 - y3 * CAM.f / z2, z2];
  }
  // a page pose: centre (x,y,z) + own yaw/pitch/roll; page pixel (u,v) → world
  function pagePt(pose, u, v) {
    let x = (u - PW / 2) * (pose.s || 1), y = -(v - PH / 2) * (pose.s || 1), z = 0;
    const cr = Math.cos(pose.roll || 0), sr = Math.sin(pose.roll || 0); [x, y] = [x * cr - y * sr, x * sr + y * cr];
    const cp = Math.cos(pose.pitch || 0), sp = Math.sin(pose.pitch || 0); [y, z] = [y * cp - z * sp, y * sp + z * cp];
    const cy = Math.cos(pose.yaw || 0), sy = Math.sin(pose.yaw || 0); [x, z] = [x * cy + z * sy, -x * sy + z * cy];
    return [pose.x + x, pose.y + y, pose.z + z];
  }
  function drawPage(c, key, pose, nx = 10, ny = 13, alpha = 1) {
    const im = IMG[key]; if (!im) return; c.save(); c.globalAlpha *= alpha;
    const cw = PW / nx, ch = PH / ny;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = P(...pagePt(pose, i * cw, j * ch)), b = P(...pagePt(pose, (i + 1) * cw, j * ch)), d = P(...pagePt(pose, i * cw, (j + 1) * ch)); if (!a || !b || !d) continue;
      const minx = Math.min(a[0], b[0], d[0], b[0] + d[0] - a[0]), maxx = Math.max(a[0], b[0], d[0], b[0] + d[0] - a[0]), miny = Math.min(a[1], b[1], d[1], b[1] + d[1] - a[1]), maxy = Math.max(a[1], b[1], d[1], b[1] + d[1] - a[1]);
      if (maxx < -10 || minx > W + 10 || maxy < -10 || miny > H + 10) continue;
      c.setTransform((b[0] - a[0]) / cw, (b[1] - a[1]) / cw, (d[0] - a[0]) / ch, (d[1] - a[1]) / ch, a[0], a[1]); c.drawImage(im, i * cw, j * ch, cw + 0.9, ch + 0.9, 0, 0, cw + 0.9, ch + 0.9);
    }
    c.setTransform(1, 0, 0, 1, 0, 0); c.restore();
  }
  function pageEdge(c, pose, col = G, a = 1) { const pts = [[0, 0], [PW, 0], [PW, PH], [0, PH]].map(([u, v]) => P(...pagePt(pose, u, v))); if (pts.some((p) => !p)) return; c.save(); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(col, 0.25 * a); c.lineWidth = 10; c.stroke(); c.strokeStyle = rgba(col, 0.9 * a); c.lineWidth = 2; c.stroke(); c.restore(); }
  // camera that frames a page region [u0,v0,u1,v1] (page px) from straight on, with an orbit offset
  const ORIGIN = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0 };
  function frameCam(reg, o = {}) {
    const [u0, v0, u1, v1] = reg, cu = (u0 + u1) / 2, cvv = (v0 + v1) / 2, rw = Math.max(u1 - u0, (v1 - v0) * W / H), f = 1100, d = f * rw / (W * (o.fill ?? 0.9));
    const [tx, ty, tz] = pagePt(ORIGIN, cu, cvv), yw = o.yaw || 0, pt = o.pitch || 0;
    return { x: tx - Math.sin(yw) * d * Math.cos(pt), y: ty - Math.sin(pt) * d, z: tz - Math.cos(yw) * d * Math.cos(pt), yaw: yw, pitch: pt, roll: o.roll || 0, f };
  }
  const mixCam = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k), yaw: lerp(a.yaw, b.yaw, k), pitch: lerp(a.pitch, b.pitch, k), roll: lerp(a.roll, b.roll, k), f: lerp(a.f, b.f, k) });
  function camPath(keys, t) { let i = 0; while (i < keys.length - 2 && t >= keys[i + 1][0]) i++; const [ta, ca] = keys[i], [tb, cb, fe] = keys[i + 1]; const k = (fe || ((tb - ta) < 0.45 ? io5 : io3))(prog(t, ta, tb)); return mixCam(ca, cb, k); }

  // ---------- shots ----------
  const R = { // regions in page px
    title: [55, 75, 1485, 665], genesis: [55, 840, 860, 1340], ms: [50, 1390, 1210, 1770], cover: [0, 0, PW, PH], coverTop: [40, 60, 1505, 1360],
    oath: [50, 360, 1300, 940], letter1: [520, 1000, 1310, 1290], letter2: [520, 1320, 1310, 1490],
    head2: [25, 220, 1520, 710], chart: [630, 720, 1520, 1455], dateline: [640, 1460, 1510, 1845],
    arcnet: [60, 190, 1080, 640], cards: [[76, 718, 760, 922], [788, 718, 1472, 922], [76, 942, 760, 1146], [788, 942, 1472, 1146], [76, 1166, 760, 1370], [788, 1166, 1472, 1370]], m700: [70, 1390, 1480, 1620],
    tenB: [40, 680, 745, 1450], humans: [800, 240, 1500, 620], minted: [40, 180, 760, 650],
  };
  const SHOTS = [
    ['cover', 1.5, 4.0, [[1.5, frameCam(R.title, { fill: 0.89 })], [1.62, frameCam(R.title, { fill: 0.89 })], [2.05, frameCam(R.genesis, { fill: 0.95, yaw: -0.12 })], [2.75, frameCam(R.genesis, { fill: 0.9, yaw: -0.06 })], [3.0, frameCam(R.ms, { fill: 0.92, yaw: 0.1, roll: -0.02 })], [3.6, frameCam(R.ms, { fill: 0.86, yaw: 0.04 })], [4.0, frameCam(R.cover, { fill: 1.6, yaw: 0.45, pitch: 0.05 })]]],
    ['p01', 4.0, 6.5, [[4.0, frameCam(R.oath, { fill: 1.3, yaw: -0.35, roll: 0.05 })], [4.4, frameCam(R.oath, { fill: 0.95, yaw: -0.06 })], [4.95, frameCam(R.oath, { fill: 0.9, yaw: 0.0 })], [5.3, frameCam(R.letter1, { fill: 0.95, yaw: 0.08 })], [6.0, frameCam(R.letter2, { fill: 0.95, yaw: 0.04 })], [6.5, frameCam(R.letter2, { fill: 0.6, yaw: 0.5 })]]],
    ['p02', 6.5, 9.0, [[6.5, frameCam(R.head2, { fill: 1.4, pitch: 0.25 })], [6.9, frameCam(R.head2, { fill: 0.97 })], [7.4, frameCam(R.head2, { fill: 0.93, roll: 0.01 })], [7.6, frameCam(R.chart, { fill: 0.9, yaw: 0.14 })], [8.3, frameCam(R.chart, { fill: 0.86, yaw: 0.06 })], [8.5, frameCam(R.dateline, { fill: 0.92, yaw: -0.08 })], [9.0, frameCam(R.dateline, { fill: 0.6, yaw: -0.5 })]]],
    ['p03', 9.0, 11.5, (() => { const k = [[9.0, frameCam(R.arcnet, { fill: 1.4, yaw: 0.35 })], [9.35, frameCam(R.arcnet, { fill: 0.95 })], [9.7, frameCam(R.arcnet, { fill: 0.9, yaw: -0.04 })]];
      R.cards.forEach((r, i) => { const t0 = 9.85 + i * 0.2; k.push([t0, frameCam(r, { fill: 0.92, yaw: (i % 2 ? 0.08 : -0.08) })], [t0 + 0.14, frameCam(r, { fill: 0.9, yaw: (i % 2 ? 0.06 : -0.06) })]); });
      k.push([11.15, frameCam(R.m700, { fill: 0.95 })], [11.5, frameCam(R.m700, { fill: 0.6, yaw: 0.5 })]); return k; })()],
    ['p04', 11.5, 13.0, [[11.5, frameCam(R.tenB, { fill: 1.6, yaw: -0.3, pitch: -0.1 })], [11.85, frameCam(R.tenB, { fill: 0.95 })], [12.15, frameCam(R.tenB, { fill: 0.9, yaw: 0.04 })], [12.4, frameCam(R.humans, { fill: 0.92, yaw: -0.08 })], [13.0, frameCam(R.humans, { fill: 0.6, roll: 0.06 })]]],
  ];
  function pageShots(c, t) {
    const sh = SHOTS.find(([, a, b]) => t >= a && t < b); if (!sh) return; const [key, , , keys] = sh;
    c.fillStyle = BG; c.fillRect(0, 0, W, H); gridFloor(c, t, 0.35); setCam(camPath(keys, t)); drawPage(c, key, ORIGIN); pageEdge(c, ORIGIN, G, 0.7);
    overlays(c, t, key);
  }
  function gridFloor(c, t, a = 0.3) { c.save(); c.strokeStyle = rgba(G, 0.08 * a / 0.3); c.lineWidth = 1; for (let x = ((t * 40) % 60); x < W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } c.restore(); }

  // per-page overlay animation, in page coordinates so it rides the 3D camera
  function regionQuad(reg) { return [[reg[0], reg[1]], [reg[2], reg[1]], [reg[2], reg[3]], [reg[0], reg[3]]].map(([u, v]) => P(...pagePt(ORIGIN, u, v))); }
  function glowRect(c, reg, a = 1, col = G) { const q = regionQuad(reg); if (q.some((p) => !p)) return; c.save(); c.beginPath(); q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(col, 0.08 * a); c.fill(); c.strokeStyle = rgba(col, 0.35 * a); c.lineWidth = 12; c.stroke(); c.strokeStyle = rgba(col, a); c.lineWidth = 3; c.stroke(); c.restore(); }
  function scanBar(c, reg, k) { const u = lerp(reg[0], reg[2], k), q = [[u - 30, reg[1]], [u + 30, reg[1]], [u + 30, reg[3]], [u - 30, reg[3]]].map(([x, y]) => P(...pagePt(ORIGIN, x, y))); if (q.some((p) => !p)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = rgba(G, 0.45); c.fill(); c.restore(); }
  const BLOCKS = [[730, 1335], [846, 1255], [968, 1175], [1100, 1085], [1236, 990], [1380, 895]];
  function overlays(c, t, key) {
    if (key === 'cover') {
      if (t > 2.05 && t < 2.9) glowRect(c, [60, 860, 740, 1205], pulse(t, 2.05, 3) * 0.8 + 0.2);
      if (t > 3.0 && t < 3.7) { scanBar(c, [70, 1400, 1200, 1760], io3(prog(t, 3.0, 3.55))); const n = Math.round(lerp(0, 350, ease(t, 3.0, 3.45, io5))); c.save(); c.globalAlpha = 1 - ease(t, 3.45, 3.6); txt(c, `${n}ms`, W - 120, 120, M(800, 64), G, 'right', 'middle', 2); txt(c, 'TIME TO FINALITY', W - 120, 180, M(700, 22), '#fff', 'right', 'middle', 5); c.restore(); }
    }
    if (key === 'p02') {
      if (t < 7.5) lightning(c, t, [30, 230, 1515, 700]);
      if (t > 7.6 && t < 8.55) BLOCKS.forEach(([u, v], i) => { const tt = 7.65 + i * 0.11, k = pulse(t, tt, 5); if (t < tt) return; const p = P(...pagePt(ORIGIN, u, v)); if (!p) return; const r = (i === 5 ? 160 : 90) * CAM.f / p[2] * (1 + (1 - k) * 0.2);
        c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, rgba(G, 0.75 * (0.3 + 0.7 * k))); g.addColorStop(1, rgba(G, 0)); c.fillStyle = g; c.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); c.restore(); });
      if (t > 8.25 && t < 8.55) { const k = crit(prog(t, 8.25, 8.4)); c.save(); c.globalAlpha = 1 - prog(t, 8.45, 8.55); stamp(c, W / 2 + 420, H / 2 - 220, 'FINAL', k, 0.9); c.restore(); }
    }
    if (key === 'p03') { R.cards.forEach((r, i) => { const t0 = 9.85 + i * 0.2; if (t >= t0 && t < t0 + 0.32) glowRect(c, r, 1 - prog(t, t0 + 0.18, t0 + 0.32)); }); if (t > 11.15) glowRect(c, [76, 1400, 472, 1595], 0.9); }
    if (key === 'p04' && t > 11.85 && t < 12.4) { const n = Math.floor(lerp(0, 10e9, ease(t, 11.85, 12.25, io5))); c.save(); c.globalAlpha = 1 - ease(t, 12.3, 12.4); txt(c, n.toLocaleString('en-US'), W - 110, H - 120, M(800, 58), G, 'right', 'middle', 2); txt(c, 'ARC MINTED · GENESIS', W - 110, H - 64, M(700, 22), '#fff', 'right', 'middle', 5); c.restore(); }
  }
  function lightning(c, t, reg) {
    const seed = Math.floor(t * 12); c.save(); c.globalCompositeOperation = 'lighter';
    for (let b = 0; b < 3; b++) { if (hash(seed, b, 1) < 0.35) continue; let u = reg[0], v = lerp(reg[1], reg[3], hash(seed, b, 2)); c.beginPath(); let p = P(...pagePt(ORIGIN, u, v)); if (!p) continue; c.moveTo(p[0], p[1]);
      while (u < reg[2]) { u += 40 + hash(seed, b, u | 0) * 70; v += (hash(seed, b, (u | 0) + 7) - 0.5) * 90; v = clamp(v, reg[1], reg[3]); p = P(...pagePt(ORIGIN, u, v)); if (p) c.lineTo(p[0], p[1]); }
      c.strokeStyle = rgba(G, 0.25); c.lineWidth = 10; c.stroke(); c.strokeStyle = 'rgba(220,255,230,0.95)'; c.lineWidth = 2.5; c.stroke(); }
    c.restore();
  }
  function stamp(c, x, y, s, k, a = 1) { c.save(); c.translate(x, y); c.rotate(-0.12); c.scale(lerp(2.2, 1, k), lerp(2.2, 1, k)); c.globalAlpha *= a; c.font = M(800, 84); const w = c.measureText(s).width + 70; c.strokeStyle = G; c.lineWidth = 8; rr(c, -w / 2, -64, w, 128, 14); c.stroke(); c.lineWidth = 3; rr(c, -w / 2 + 12, -52, w - 24, 104, 8); c.stroke(); txt(c, s, 0, 6, M(800, 84), G, 'center', 'middle', 10); c.restore(); }

  // ---------- S0 boot (0–1) ----------
  const BOOT = [[0.05, '> connecting to arc mainnet'], [0.25, '> validators: 11 + circle'], [0.42, '> consensus: malachite bft'], [0.6, '> block #0000001 ........ committed'], [0.78, '> status: FINAL']];
  function boot(c, t) {
    if (t >= 1.0) return; c.fillStyle = BG; c.fillRect(0, 0, W, H); gridFloor(c, t, 0.4);
    BOOT.forEach(([t0, s], i) => { if (t < t0) return; const n = Math.floor(clamp((t - t0) / 0.14) * s.length); txt(c, s.slice(0, n), 260, 380 + i * 64, M(700, 40), i === 4 ? G : '#CFEFD9', 'left', 'middle', 1); });
    if (Math.floor(t * 6) % 2) { c.fillStyle = G; c.fillRect(260, 380 + Math.min(4, BOOT.filter(([t0]) => t >= t0).length - 1) * 64 + 28, 24, 6); }
    txt(c, 'FINALITY // ISSUE 01', 260, 260, M(800, 26), G, 'left', 'middle', 8);
  }
  // ---------- S1 title slam (1.0–1.62) → match-cut into the cover ----------
  function titleSlam(c, t) {
    if (t < 1.0 || t >= 1.62) return; c.fillStyle = BG; c.fillRect(0, 0, W, H);
    // frame matches the cover's white title box at the first cover camera
    setCam(frameCam(R.title, { fill: 0.89 })); const q = regionQuad([58, 78, 1482, 662]); const x0 = q[0][0], y0 = q[0][1], x1 = q[2][0], y1 = q[2][1];
    const fk = io5(prog(t, 1.0, 1.18)); c.save(); c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.rect(lerp(W / 2, x0, fk), lerp(H / 2, y0, fk), lerp(0, x1 - x0, fk), lerp(0, y1 - y0, fk)); c.stroke(); c.restore();
    const letters = 'FINALITY'.split(''), bx = regionQuad([118, 140, 1460, 575]), lx0 = bx[0][0], lx1 = bx[1][0], ly1 = bx[2][1], lh = bx[2][1] - bx[0][1];
    const xs = [118, 288, 400, 545, 727, 848, 1012, 1170, 1460].map((u) => lerp(lx0, lx1, (u - 118) / (1460 - 118)));
    letters.forEach((ch, i) => { const k = crit(prog(t, 1.02 + i * 0.055, 1.12 + i * 0.055)); if (k <= 0) return; const cx = (xs[i] + xs[i + 1]) / 2, w = xs[i + 1] - xs[i];
      c.save(); c.translate(cx, ly1); c.scale(lerp(1.8, 1, k), lerp(1.8, 1, k)); c.globalAlpha = clamp(k * 2); c.font = D(lh * 1.33); const mw = c.measureText(ch).width; c.scale(Math.min(1.2, w * 0.98 / mw), 1); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(ch, 0, 0); c.restore(); });
    if (t > 1.5) { const k = prog(t, 1.5, 1.62); c.save(); c.globalAlpha = k; drawPage(c, 'cover', ORIGIN); c.restore(); }
  }
  // ---------- kinetic type over p01: "probably." → FINAL ----------
  function oathType(c, t) {
    if (t < 5.3 || t >= 6.5) return;
    if (t < 5.95) { const k = crit(prog(t, 5.3, 5.5)); c.save(); c.fillStyle = 'rgba(2,4,3,0.55)'; c.fillRect(0, H / 2 - 150, W, 300); c.restore(); cond(c, '"PROBABLY."', W / 2, H / 2 + 90, 260 * lerp(1.3, 1, k), '#fff', 0.62);
      const sk = ease(t, 5.6, 5.8, io5); if (sk > 0) { c.save(); c.strokeStyle = G; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(W / 2 - 520, H / 2); c.lineTo(W / 2 - 520 + 1040 * sk, H / 2 - 20 * sk); c.stroke(); c.restore(); } }
    else { const k = crit(prog(t, 6.0, 6.15)); c.save(); c.fillStyle = 'rgba(2,4,3,0.75)'; c.fillRect(0, 0, W, H); c.restore(); cond(c, 'FINAL.', W / 2, H / 2 + 170, 480 * lerp(1.6, 1, k), G, 0.62); txt(c, 'NO REORG · NO ROLLBACK · NO SECOND CONFIRMATION', W / 2, H / 2 + 250, M(700, 30), '#fff', 'center', 'middle', 6); }
  }
  // ---------- S7 finale: pages fan out in 3D and stack into the cover (13–15) ----------
  function finale(c, t) {
    if (t < 13.0) return; c.fillStyle = BG; c.fillRect(0, 0, W, H); gridFloor(c, t, 0.5);
    const fan = ease(t, 13.0, 13.7, io5), stack = ease(t, 14.0, 14.45, io5);
    setCam({ x: lerp(0, 0, fan), y: lerp(0, 120, fan), z: lerp(-3000, -3900, fan) + stack * 1500, yaw: Math.sin(t * 0.8) * 0.05 * (1 - stack), pitch: -0.02 * fan, roll: 0, f: 1100 });
    const poses = PAGES.map((k, i) => { const off = i - 2, a = off * 0.42 * fan * (1 - stack); return { k, pose: { x: Math.sin(a) * 2900 * (1 - stack), y: -Math.abs(off) * 60 * fan * (1 - stack), z: (1 - Math.cos(a)) * 2600 * (1 - stack) + i * 6 * stack + (i === 0 ? -20 * stack : 0), yaw: -a * 0.9, pitch: 0, roll: off * 0.03 * fan * (1 - stack) } }; });
    poses.sort((a, b) => b.pose.z - a.pose.z).forEach(({ k, pose }) => { drawPage(c, k, pose, 6, 8); pageEdge(c, pose, G, 0.6); });
    const tk = A(t, 13.4, 0.4); if (tk > 0) { c.save(); c.globalAlpha = tk * (1 - ease(t, 13.95, 14.1)); c.fillStyle = 'rgba(2,4,3,0.7)'; c.fillRect(0, H - 220, W, 220); txt(c, "ONCE IT'S WRITTEN, IT'S FINAL.", W / 2, H - 130, M(800, 54), '#fff', 'center', 'middle', 4); txt(c, 'FINALITY  ·  THE MAGAZINE OF ARC  ·  ISSUE 01', W / 2, H - 66, M(700, 26), G, 'center', 'middle', 6); c.restore(); }
    if (t >= 14.45) { const k = crit(prog(t, 14.45, 14.6)); c.save(); c.fillStyle = 'rgba(2,4,3,0.55)'; c.fillRect(0, 0, W, H); c.restore(); stamp(c, W / 2, H / 2, 'STATUS: FINAL', k); txt(c, 'ISSUE 01  ·  WEEK OF SEPT 16–23, 2026', W / 2, H / 2 + 160, M(700, 28), '#fff', 'center', 'middle', 6); }
  }

  // ---------- finishing ----------
  const HITS = [1.0, 1.5, 2.05, 3.0, 4.0, 5.3, 6.0, 6.5, 7.6, 8.3, 8.5, 9.0, 11.15, 11.5, 12.4, 13.0, 14.45];
  const WHIPS = [4.0, 6.5, 9.0, 11.5, 13.0];
  let BUF = null, GRAIN = null;
  function finish(c, t) {
    let h = 0; for (const T0 of HITS) h = Math.max(h, pulse(t, T0, 14));
    if (!BUF) { BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; }
    const wk = Math.max(...WHIPS.map((T0) => Math.max(0, 1 - Math.abs(t - T0) / 0.12)));
    if (h > 0.05 || wk > 0.05) { const b = BUF.getContext('2d'); b.clearRect(0, 0, W, H); b.drawImage(cv, 0, 0); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22 * Math.max(h, wk);
      for (const dx of [-1, 1]) c.drawImage(BUF, dx * (16 * h + 90 * wk), 0); c.restore(); c.fillStyle = `rgba(200,255,220,${0.18 * h + 0.25 * wk})`; c.fillRect(0, 0, W, H); }
    const gk = Math.max(wk, pulse(t, 6.0, 8), pulse(t, 14.45, 8), ease(t, 14.75, 14.95)); if (gk > 0.15) for (let i = 0; i < 7; i++) { const y = hash(i, Math.floor(t * 60), 4) * H, hh = 8 + hash(i, 5, Math.floor(t * 60)) * 60, dx = (hash(i, 6, Math.floor(t * 60)) - 0.5) * 180 * gk; c.drawImage(cv, 0, y, W, hh, dx, y, W, hh); }
    c.fillStyle = 'rgba(0,0,0,0.14)'; for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.65)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    // HUD
    c.save(); c.globalAlpha = 0.85; txt(c, `FINALITY // ISSUE 01`, 46, 40, M(700, 18), G, 'left', 'middle', 4); txt(c, `BLOCK #${String(Math.floor(t * 2.857) + 1).padStart(7, '0')}  ·  FINAL`, W - 46, 40, M(700, 18), G, 'right', 'middle', 3);
    txt(c, `${String(Math.floor(REAL)).padStart(2, '0')}:${String(Math.floor((REAL % 1) * 60)).padStart(2, '0')}`, 46, H - 40, M(700, 18), '#7FA88E', 'left', 'middle', 3); c.restore();
    if (t > 14.85) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }
  }
  function renderAt(tReal) {
    REAL = tReal; const t = tReal * SLOW;
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.filter = 'none'; c.imageSmoothingQuality = 'high';
    let sh = 0; for (const T0 of HITS) sh = Math.max(sh, pulse(t, T0, 16) * 16); const sx = (hash(Math.round(t * FPS), 3) - 0.5) * 2 * sh, sy = (hash(Math.round(t * FPS), 4) - 0.5) * 2 * sh;
    c.save(); c.translate(sx, sy);
    boot(c, t); titleSlam(c, t); pageShots(c, t); oathType(c, t); finale(c, t);
    c.restore(); c.setTransform(1, 0, 0, 1, 0, 0); finish(c, t);
  }
  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(D(100)), document.fonts.load(M(700, 20)), document.fonts.load(M(800, 20)), ...PAGES.map((k) => load(k, `../assets/finality/${k}.jpg`))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
