// ARCTOWN — 30s showcase film, 1920x1080 @ 60fps, cut to 120 BPM.
// 0–3 the city powers on street by street as the camera rushes down the avenue · 3–7 crane up over the skyline under
// the neon title · 7–11.5 EXPLORE: whip-pans between the shop signs · 11.5–14.5 real gameplay cutaways · 14.5–19.5
// BUY LAND: orbit an Up For Sale plot that transforms into your HQ · 19.5–25 HANG OUT: avatars, proximity voice, chat
// · 25–30 rise up the ARC tower to the end card. renderAt(t) is deterministic.
(() => {
  'use strict';
  const T = window.TOWN('neon'), { W, H, TAU, COL, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, hash, NEONF, SANS } = T;
  const FPS = 60, DUR = 30, BT = 0.5;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };

  // ---------- camera tracks (cubic Hermite through keys; keys: [t, x, y, z, yaw, pitch]) ----------
  function track(keys, t) {
    if (t <= keys[0][0]) return keys[0].slice(1); if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1].slice(1);
    let i = 0; while (t > keys[i + 1][0]) i++;
    const k0 = keys[i], k1 = keys[i + 1], dt = k1[0] - k0[0], s = (t - k0[0]) / dt, s2 = s * s, s3 = s2 * s;
    const tan = (j, c) => (j <= 0 || j >= keys.length - 1 || keys[j].hold ? 0 : (keys[j + 1][c] - keys[j - 1][c]) / (keys[j + 1][0] - keys[j - 1][0]));
    return [1, 2, 3, 4, 5].map((c) => (2 * s3 - 3 * s2 + 1) * k0[c] + (s3 - 2 * s2 + s) * dt * tan(i, c) + (-2 * s3 + 3 * s2) * k1[c] + (s3 - s2) * dt * tan(i + 1, c));
  }
  const look = (x, y, z, tx, ty, tz) => [Math.atan2(tx - x, tz - z), Math.atan2(ty - y, Math.hypot(tx - x, tz - z))];
  const signOf = (key, side) => T.SIGNS.find((s) => s.box && s.box.shop === key && s.box.side === side);
  function signShot(t0, t1, sg, side) { // a slow drifting hold framing a shop sign from across the road
    const zc = (sg.tl[2] + sg.tr[2]) / 2, sx = sg.tl[0], cx = -side * 5.5, out = [];
    for (const [tt, dz, dy] of [[t0, -16, 4.2], [t1, -11, 5.0]]) { const x = cx, y = dy, z = zc + dz, [yaw, pitch] = look(x, y, z, sx, 8.6, zc); out.push([tt, x, y, z, yaw, pitch]); }
    return out;
  }
  const S_BLIP = signOf('blip', -1), S_GLIM = signOf('glimmer', 1), S_TIDE = signOf('tide', -1);
  const SALE = T.BOXES.filter((b) => b.sale && b.side === 1).sort((a, b) => a.z0 - b.z0)[0], SALESIGN = T.SIGNS.find((s) => s.box === SALE);
  const SX = (SALE.x0 + SALE.x1) / 2, SZ = (SALE.z0 + SALE.z1) / 2, SH0 = SALE.h;
  // the plot transforms into your HQ at 16.5: it grows, its windows light floor by floor and its sign swaps
  T.addWindows(SALE, SH0 * 1.85);
  SALE.hFn = (t) => SH0 * (1 + 0.85 * A(t, 16.5, 0.7));
  SALE.winFn = (w, t) => t < 16.5 || w.y < lerp(0, SH0 * 1.85, prog(t, 16.6, 17.4));
  SALE.flick = (t) => (t > 16.4 && t < 16.6 ? (Math.floor(t * 40) % 2) : 1);
  const HQTEX = T.signTex([{ text: 'YOUR HQ', font: NEONF(170), glow: COL.cyan, y: 180, ls: 6 }, { text: 'BUILT IN ARCTOWN', font: SANS(800, 56), glow: COL.cyan, y: 310, ls: 8 }], 1100, 460, { panel: true, edge: COL.cyan });
  const SALETEX = SALESIGN.tex; SALESIGN.box = null;
  const ORBIT = []; for (let k = 0; k <= 10; k++) { const q = io3(k / 10), tt = 14.5 + k * 0.5, x = lerp(-7, -4, q), z = SZ + lerp(-40, -20, q), y = lerp(4, 7, q), ty = lerp(9, 19, prog(tt, 16.0, 18.5)); const [yaw, pitch] = look(x, y, z, 14, ty, SZ); ORBIT.push([tt, x, y, z, yaw, pitch]); }

  const SHOTS = [
    [0, 3.0, [[0, 0, 2.2, -36, 0, 0.03], [3.0, 0, 3.4, 36, 0, 0.07]]],
    [3.0, 7.0, [[3.0, 0, 3.4, 36, 0, 0.07], [4.4, 0, 26, 60, 0.04, -0.06], [7.0, 4, 96, 84, 0.12, -0.42]]],
    [7.0, 11.5, (() => { const k = [...signShot(7.0, 8.4, S_BLIP, -1), ...signShot(8.5, 9.9, S_GLIM, 1), ...signShot(10.0, 11.0, S_TIDE, -1)]; k.push([11.5, 0, 4, (S_TIDE.tl[2] + 30), 0, 0.02]); k.forEach((q, i) => { if (i % 2 === 1) q.hold = true; }); return k; })()],
    [14.5, 19.5, ORBIT],
    [19.5, 22.0, [[19.5, -6, 2.6, 268, 0.1, 0.05], [22.0, -1, 2.8, 275, 0.03, 0.07]]],
    [23.5, 25.0, [[23.5, 6, 4, 268, -0.12, 0.08], [25.0, 2, 9, 276, -0.04, 0.2]]],
    [25.0, 30.0, [[25.0, 0, 8, 230, 0, 0.12], [27.0, 0, 34, 250, 0, 0.32], [30.0, 0, 52, 262, 0, 0.36]]],
  ];
  function camAt(t) { const sh = SHOTS.find(([a, b]) => t >= a && t < b) || SHOTS[SHOTS.length - 1]; const [x, y, z, yaw, pitch] = track(sh[2], t); return { x, y, z, yaw, pitch, f: 1050, roll: 0 }; }

  // ---------- power-on (0–3): every street lights up from near to far ----------
  function power(b, t) {
    if (t > 3.2) return 1; const z = b.z0 ?? 0, on = 0.3 + clamp((z + 30) / 330) * 2.2 + hash(b.id || z, 5) * 0.25 + (b.sky ? 0.25 : 0);
    if (t < on) return 0; const k = prog(t, on, on + 0.18); return k < 1 ? (Math.floor(t * 30 + (b.id || 0)) % 3 ? k : 0.15) : 1;
  }

  // ---------- avatars in the plaza ----------
  const AV = [
    { name: 'Octavius', bot: true, top: '#C9302C', legs: '#A82622', hair: '#C9302C', skin: '#D93A33', x: 1.5, z: 292, tag: '#E0782A' },
    { name: 'Guest-5730', top: '#26233A', hair: '#B4472A', x: -4, z: 286, walk: true, ph: 1 },
    { name: 'Guest-1664', top: '#2D3B6E', hair: '#2A1A14', x: 6, z: 283, walk: true, ph: 2.2 },
    { name: 'Guest-3683', top: '#1F1D2A', hair: '#C2582B', x: -9, z: 290, ph: 3.1, wave: true },
    { name: 'Guest-2041', top: '#6B2C8F', hair: '#F1D06B', x: 10, z: 289, ph: 4.4 },
    { name: 'Guest-8812', top: '#1E6B5F', hair: '#3A2A20', x: 2, z: 285, walk: true, ph: 5.3 },
    { name: 'Guest-0420', top: '#8F2C4E', hair: '#151515', x: 13, z: 295, ph: 0.6, wave: true },
  ];
  const CHAT = [[20.0, 1, 'gm ArcTown!'], [20.5, 3, 'who wants to build next to me?'], [21.0, 4, 'just bought my plot'], [21.4, 2, 'voice is so clean'], [24.0, 6, 'see you at the Town Hall']];
  function avatarItems(t, heads) {
    const items = [];
    AV.forEach((a, i) => {
      const wx = a.walk ? a.x + Math.sin(t * 0.5 + a.ph) * 2.5 : a.x, wz = a.walk ? a.z + Math.cos(t * 0.4 + a.ph) * 1.5 : a.z;
      const av = { ...a, x: wx, z: wz };
      items.push([wx, wz, (c) => { const h = T.drawAvatar(c, av, t); if (h) heads[i] = h; }]);
      if (i === 1 || i === 3 || i === 4) items.push([wx, wz + 0.01, (c) => voiceRing(c, wx, wz, t, i), 0.2]);
    });
    return items;
  }
  function voiceRing(c, x, z, t, i) {
    for (let k = 0; k < 3; k++) { const ph = ((t * 0.9 + k / 3 + i * 0.13) % 1), r = 0.6 + ph * 4.5, pts = []; for (let j = 0; j < 28; j++) { const a = j / 28 * TAU; pts.push([x + Math.cos(a) * r, 0.05, z + Math.sin(a) * r]); }
      if (T.polyPath(c, pts)) T.neon(c, COL.cyan, 1.5, (1 - ph) * 0.8); }
  }

  // ---------- overlays ----------
  function neonText(c, s, x, y, size, glow, k = 1, align = 'center', font = NEONF) {
    c.save(); c.font = font(size); c.textAlign = align; c.textBaseline = 'middle';
    for (const [blur, a] of [[size * 0.5, 0.9], [size * 0.18, 1], [0, 1]]) { c.shadowColor = glow; c.shadowBlur = blur; c.globalAlpha = a * k; c.fillStyle = blur ? glow : '#FFFFFF'; c.fillText(s, x, y); }
    c.restore();
  }
  function flickerK(t, t0, seed) { if (t < t0) return 0; const d = t - t0; if (d > 0.45) return 1; return hash(Math.floor(t * 30), seed) < 0.25 + d * 1.6 ? 1 : 0.1; }
  function title(c, t) {
    if (t < 2.95 || t > 7.05) return; const out = 1 - prog(t, 6.6, 7.0);
    const word = 'ArcTown', sz = 300; c.save(); c.font = NEONF(sz); const tw = c.measureText(word).width; let x = W / 2 - tw / 2;
    const sc = lerp(1.25, 1, A(t, 3.0, 0.5)) * (1 + (t - 3) * 0.012); c.translate(W / 2, 420); c.scale(sc, sc); c.translate(-W / 2, -420);
    for (let i = 0; i < word.length; i++) { const ch = word[i], cw = c.measureText(ch).width; neonText(c, ch, x + cw / 2, 420, sz, i < 3 ? COL.pink : COL.cyan, flickerK(t, 3.0 + i * 0.05, i) * out); x += cw; }
    c.restore();
    ['EXPLORE', 'BUY LAND', 'HANG OUT'].forEach((s, i) => { const k = pop(prog(t, 4.5 + i * 0.5, 5.0 + i * 0.5)); if (k <= 0) return; const x = W / 2 + (i - 1) * 420; c.save(); c.globalAlpha = out; c.translate(x, 640); c.scale(k, k);
      c.font = SANS(800, 40); const w = c.measureText(s).width + 80; c.fillStyle = 'rgba(14,8,30,0.75)'; c.beginPath(); c.roundRect(-w / 2, -40, w, 80, 40); c.fill();
      c.strokeStyle = [COL.cyan, COL.pink, COL.yellow][i]; c.lineWidth = 3; c.shadowColor = c.strokeStyle; c.shadowBlur = 20; c.stroke(); c.shadowBlur = 0; c.letterSpacing = '6px'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 3, 2); c.restore(); });
  }
  const CAPS = [[7.05, 11.45, 'EXPLORE', 'EVERY BUILDING IS A PROJECT', COL.cyan], [11.55, 12.95, 'EXPLORE', 'LIVE IN ARCTOWN', COL.cyan], [13.05, 16.4, 'BUY LAND', 'CLAIM A PLOT · APPLY AT THE TOWN HALL', COL.pink],
    [16.6, 19.45, 'BUILD', 'MAKE IT YOUR HQ', COL.cyan], [19.55, 24.95, 'HANG OUT', 'PROXIMITY VOICE · CHAT · FRIENDS', COL.yellow]];
  function captions(c, t) {
    for (const [t0, t1, a, b, col] of CAPS) {
      if (t < t0 || t > t1) continue; const k = io5(prog(t, t0, t0 + 0.25)), out = io3(prog(t, t1 - 0.2, t1));
      c.save(); c.globalAlpha = 1 - out; const g = c.createLinearGradient(0, 880, 0, H); g.addColorStop(0, 'rgba(8,4,20,0)'); g.addColorStop(0.7, 'rgba(8,4,20,0.8)'); g.addColorStop(1, 'rgba(8,4,20,0.92)'); c.fillStyle = g; c.fillRect(0, 880, W, H - 880);
      c.translate(80, 990); c.scale(lerp(1.3, 1, k), lerp(1.3, 1, k)); c.font = NEONF(96); const aw = c.measureText(a).width; neonText(c, a, 0, 0, 96, col, 1, 'left');
      c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 14; c.fillRect(0, 52, aw * io3(prog(t, t0 + 0.1, t0 + 0.45)), 5); c.shadowBlur = 0;
      c.globalAlpha = (1 - out) * prog(t, t0 + 0.15, t0 + 0.4); c.font = SANS(800, 28); c.letterSpacing = '5px'; c.fillStyle = '#EDE8FF'; c.textBaseline = 'middle'; c.fillText(b, aw + 40, 8); c.restore();
    }
  }
  // real gameplay cutaways with callouts (coordinates are the screenshot's own pixels)
  const CUTS = [[11.5, 13.0, 'shot_avenue', [[377, 537, 'Your Project Here', COL.pink, 11.8], [1600, 535, 'FINALITY', COL.purple, 12.1], [130, 280, 'Every building on the map', COL.cyan, 12.4]]],
    [13.0, 14.5, 'shot_sale', [[795, 330, 'UP FOR SALE', COL.pink, 13.25], [125, 590, 'Plots for sale', COL.pink, 13.6]]],
    [22.0, 23.5, 'shot_hall', [[200, 600, 'Chat with everyone nearby', COL.yellow, 22.25], [855, 385, 'Town Hall', COL.cyan, 22.55], [1140, 705, 'Proximity voice', COL.cyan, 22.85]]]];
  function cutaway(c, t) {
    const cut = CUTS.find(([a, b]) => t >= a && t < b); if (!cut) return false; const [t0, t1, key, calls] = cut, im = IMG[key]; if (!im) return false;
    const z = 1.0 + 0.07 * prog(t, t0, t1), s = Math.max(W / im.width, H / im.height) * z, dw = im.width * s, dh = im.height * s, ox = (W - dw) / 2 + (prog(t, t0, t1) - 0.5) * -30, oy = (H - dh) / 2;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.drawImage(im, ox, oy, dw, dh);
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,4,30,0.55)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    const bk = A(t, t0, 0.3); c.save(); c.globalAlpha = bk; c.font = SANS(800, 24); c.letterSpacing = '4px'; const bw = c.measureText('IN-GAME FOOTAGE').width + 70; c.fillStyle = 'rgba(10,6,24,0.85)'; c.beginPath(); c.roundRect(W / 2 - bw / 2, 26, bw, 52, 26); c.fill(); c.strokeStyle = rgba(COL.pink, 0.8); c.lineWidth = 2; c.stroke();
    c.fillStyle = Math.floor(t * 3) % 2 ? COL.blood || '#FF2A3D' : '#FF2A3D'; c.beginPath(); c.arc(W / 2 - bw / 2 + 28, 52, 8, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.fillText('IN-GAME FOOTAGE', W / 2 - bw / 2 + 46, 53); c.restore();
    for (const [px, py, label, col, tc] of calls) {
      const k = pop(prog(t, tc, tc + 0.4)); if (k <= 0) continue; const x = ox + px * s, y = oy + py * s;
      c.save(); c.translate(x, y); c.strokeStyle = col; c.lineWidth = 4; c.shadowColor = col; c.shadowBlur = 18; c.beginPath(); c.arc(0, 0, 46 * k, 0, TAU); c.stroke();
      c.beginPath(); c.arc(0, 0, 46 + ((t - tc) * 60) % 30, 0, TAU); c.globalAlpha = 0.4; c.stroke(); c.globalAlpha = 1; c.shadowBlur = 0;
      const lx = x > W * 0.6 ? -1 : 1; c.beginPath(); c.moveTo(lx * 46 * 0.7, -46 * 0.7); c.lineTo(lx * 90, -90); c.lineTo(lx * (110), -90); c.stroke();
      c.font = SANS(800, 34); const w = c.measureText(label).width + 40; const bx = lx > 0 ? 110 : -110 - w; c.globalAlpha = k; c.fillStyle = 'rgba(10,6,24,0.9)'; c.beginPath(); c.roundRect(bx, -120, w, 60, 30); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.fillText(label, bx + 20, -88); c.restore();
    }
    return true;
  }
  function chatBubbles(c, t, heads) {
    for (const [t0, i, msg] of CHAT) {
      const hd = heads[i]; if (!hd || t < t0 || t > t0 + 2.4 || t >= 22 && t < 23.5) continue; const k = pop(prog(t, t0, t0 + 0.35)), out = prog(t, t0 + 2.1, t0 + 2.4);
      c.save(); c.globalAlpha = 1 - out; c.translate(hd.x, hd.y - 40); c.scale(k, k); c.font = SANS(700, 30); const w = c.measureText(msg).width + 44, h = 58;
      c.fillStyle = 'rgba(255,255,255,0.96)'; c.beginPath(); c.roundRect(-w / 2, -h, w, h, 22); c.moveTo(-10, 0); c.lineTo(0, 14); c.lineTo(10, 0); c.fill(); c.fillStyle = '#16122A'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(msg, 0, -h / 2 + 1); c.restore();
    }
    AV.forEach((a, i) => { const hd = heads[i]; if (hd && hd.s > 9) T.nameTag(c, hd.x, hd.y - 2, hd.s, a.name, a.tag || '#2E7BFF'); });
  }
  function endCard(c, t) {
    if (t < 25.4) return; const k = A(t, 25.6, 0.6);
    c.save(); c.fillStyle = `rgba(8,4,20,${0.45 * k})`; c.fillRect(0, 0, W, H); c.restore();
    c.save(); c.font = NEONF(250); const word = 'ArcTown', tw = c.measureText(word).width; let x = W / 2 - tw / 2;
    for (let i = 0; i < word.length; i++) { const ch = word[i], cw = c.measureText(ch).width; neonText(c, ch, x + cw / 2, 400, 250, i < 3 ? COL.pink : COL.cyan, flickerK(t, 25.6 + i * 0.05, i + 9)); x += cw; } c.restore();
    const sk = A(t, 26.4, 0.5); if (sk > 0) { c.save(); c.globalAlpha = sk; c.font = SANS(800, 34); c.letterSpacing = '12px'; c.fillStyle = '#EDE8FF'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('EXPLORE  ·  BUY LAND  ·  HANG OUT', W / 2 + 6, 560); c.restore(); }
    const bk = pop(prog(t, 27.0, 27.5)); if (bk > 0) { const p = 1 + 0.05 * Math.exp(-((t % BT) * 9)); c.save(); c.translate(W / 2, 700); c.scale(bk * p, bk * p); c.shadowColor = COL.pink; c.shadowBlur = 40;
      const g = c.createLinearGradient(-260, 0, 260, 0); g.addColorStop(0, COL.pink); g.addColorStop(1, COL.purple); c.fillStyle = g; c.beginPath(); c.roundRect(-260, -50, 520, 100, 50); c.fill(); c.shadowBlur = 0;
      c.font = SANS(900, 40); c.letterSpacing = '4px'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ENTER THE CITY', 3, 2); c.restore();
      c.save(); c.globalAlpha = bk; neonText(c, 'arctown.app', W / 2, 830, 64, COL.cyan, 1); c.restore(); }
  }

  // ---------- finishing ----------
  const FLASH = [3.0, 7.0, 11.5, 13.0, 14.5, 19.5, 22.0, 23.5, 25.0];
  let GRAIN = null;
  function finish(c, t) {
    let f = 0; for (const T0 of FLASH) if (t >= T0) f = Math.max(f, 0.7 * Math.exp(-(t - T0) * 13)); if (f > 0.01) { c.fillStyle = `rgba(235,230,255,${f})`; c.fillRect(0, 0, W, H); }
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 18; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.1); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    const fi = 1 - prog(t, 0, 0.35), fo = prog(t, 29.3, 30); if (fi > 0 || fo > 0) { c.fillStyle = `rgba(0,0,0,${Math.max(fi, fo)})`; c.fillRect(0, 0, W, H); }
  }

  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.imageSmoothingQuality = 'high';
    if (!cutaway(c, t)) {
      const heads = [], cam = camAt(t);
      SALESIGN.tex = t < 16.5 ? SALETEX : HQTEX;
      const items = t > 19 && t < 25.5 ? avatarItems(t, heads) : [];
      T.render(c, cam, t, { power, lineLen: t < 3 ? 370 + 330 * io3(prog(t, 0.2, 2.6)) : 1e9, items, cubePower: A(t, 2.4, 0.6) });
      if (t >= 14.5 && t < 19.5) hqFx(c, t);
      if (items.length) chatBubbles(c, t, heads);
    }
    title(c, t); captions(c, t); endCard(c, t); finish(c, t);
  }
  function hqFx(c, t) { // scan beam + sparks when the plot becomes your HQ
    const k = prog(t, 16.45, 17.4); if (k <= 0 || k >= 1) return;
    const y = lerp(0, SH0 * 1.85, k), pts = [[SALE.x0 - 0.5, y, SALE.z0 - 0.5], [SALE.x1 + 0.5, y, SALE.z0 - 0.5], [SALE.x1 + 0.5, y, SALE.z1 + 0.5], [SALE.x0 - 0.5, y, SALE.z1 + 0.5]];
    if (T.polyPath(c, pts)) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(COL.cyan, 0.25 * (1 - k)); c.fill(); c.restore(); T.neon(c, COL.cyan, 3, 1 - k * 0.5); }
  }

  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(NEONF(80)), document.fonts.load(SANS(800, 30)), document.fonts.load(SANS(600, 30)), ...['shot_avenue', 'shot_sale', 'shot_hall'].map((k) => load(k, `../assets/arctown/${k}.jpg`))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
