// ARCTOWN — 30s vertical (9:16) film, 1080x1920 @ 60fps, cut to 120 BPM. JavaScript (canvas) only.
// 0–2.5 drone dive into the avenue under the neon title · 2.5–10 EXPLORE: third-person follow cam, people walking
// the streets and stepping into buildings, live minimap · 10–11.5 THE SHIFT: the whole city sinks into a glowing
// plot grid · 11.5–19 BUY LAND: an apply flow, rapid-fire claims, buildings rising, the city rebuilds · 19–26 HANG OUT:
// plaza crowd, chat panel, voice, a friend request · 26–30 end card. renderAt(t) is deterministic.
(() => {
  'use strict';
  const W = 1080, H = 1920, FPS = 60, DUR = 30, BT = 0.5;
  const T = window.TOWN('neon', { W, H }), { TAU, COL, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, hash, NEONF, SANS } = T;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const F = 1000;
  const smooth = (t, a, b) => io3(prog(t, a, b)), bump = (t, a, b, e = 0.45) => smooth(t, a, a + e) * (1 - smooth(t, b - e, b));

  // ---------- the player ----------
  const PL = { x: 1.8, z0: 22, v: 9 };
  const plZ = (t) => PL.z0 + PL.v * clamp(t - 2.5, 0, 7.5);
  // ---------- city state: the shift (sink) and the rebuild ----------
  const STREET = T.BOXES.filter((b) => b.kind === 'brick' && b.z0 < 262), TOWERS = T.BOXES.filter((b) => b.kind === 'tower');
  const sinkK = (b, t) => io3(prog(t, 10.05 + clamp(b.z0 / 262) * 0.55, 10.6 + clamp(b.z0 / 262) * 0.55));
  // purchases: the hero plot (with the apply flow) then rapid claims on the beat
  const byZ = (side, z) => STREET.filter((b) => b.side === side).sort((a, b) => Math.abs((a.z0 + a.z1) / 2 - z) - Math.abs((b.z0 + b.z1) / 2 - z))[0];
  const OWN = [['Guest-1664', COL.cyan], ['Guest-3683', COL.pink], ['Guest-2041', COL.yellow], ['Guest-8812', COL.purple], ['Guest-0420', COL.cyan], ['Guest-7319', COL.pink], ['Guest-5150', COL.yellow], ['Guest-9001', COL.purple], ['Guest-2718', COL.cyan]];
  const HERO = byZ(1, 128);
  const CLAIMS = [[HERO, 13.05, 'YOUR HQ', COL.green]];
  { const used = new Set([HERO]); const picks = [[-1, 120], [1, 160], [-1, 150], [1, 96], [-1, 180], [1, 190], [-1, 96], [-1, 210], [1, 214]];
    picks.forEach(([side, z], i) => { let b = byZ(side, z); if (used.has(b)) b = STREET.filter((q) => q.side === side && !used.has(q)).sort((a, c) => Math.abs(a.z0 - z) - Math.abs(c.z0 - z))[0]; used.add(b); CLAIMS.push([b, 13.75 + i * 0.5, OWN[i][0], OWN[i][1]]); }); }
  const claimOf = (b) => CLAIMS.find((c) => c[0] === b);
  for (const b of STREET) {
    const h0 = b.h, cl = claimOf(b);
    b.hFn = (t) => { const s = sinkK(b, t); if (s <= 0) return h0; const rise = cl ? crit(prog(t, cl[1] + 0.05, cl[1] + 0.75)) : 0, re = io3(prog(t, 18.3 + clamp(b.z0 / 262) * 0.5, 18.8 + clamp(b.z0 / 262) * 0.5)); return h0 * Math.max(1 - s, rise, re); };
  }
  for (const b of TOWERS) { const h0 = b.h; b.hFn = (t) => h0 * (1 - io3(prog(t, 10.1, 10.9)) * (1 - io3(prog(t, 18.4, 19.2)))); }
  T.SIGNS.forEach((s) => { if (s.box && s.box.kind === 'brick') s.alpha = (t) => 1 - clamp(sinkK(s.box, t) * 3) + clamp((s.box.hFn(t) / Math.max(1, s.box.h) - 0.7) * 3.3) * (t > 13 ? 1 : 0); });

  // ---------- walkers (people exploring) ----------
  const NAMES = ['Guest-1664', 'Guest-3683', 'Guest-2041', 'Guest-8812', 'Guest-0420', 'Guest-7319', 'Guest-5150', 'Guest-9001', 'Octavius', 'Guest-2718', 'Guest-4096', 'Guest-6060'];
  const TOPS = ['#2D3B6E', '#1F1D2A', '#6B2C8F', '#1E6B5F', '#8F2C4E', '#3A3F8F', '#2B5D7A', '#7A3B1E', '#C9302C', '#3C2A6B', '#245E3A', '#5A2A6E'];
  const HAIRS = ['#2A1A14', '#C2582B', '#F1D06B', '#3A2A20', '#151515', '#B4472A', '#E8E2D0', '#2A1A14', '#C9302C', '#6B3A1E', '#151515', '#F1D06B'];
  const WALK = NAMES.map((name, i) => { const side = i % 2 ? 1 : -1, onRoad = i % 4 === 3; return { name, top: TOPS[i], hair: HAIRS[i], bot: name === 'Octavius', skin: name === 'Octavius' ? '#D93A33' : undefined, legs: name === 'Octavius' ? '#A82622' : undefined,
    x: onRoad ? side * (3 + hash(i, 1) * 3) : side * (9.4 + hash(i, 2) * 1.6), z0: 30 + i * 8.5 + hash(i, 3) * 6, v: (hash(i, 4) < 0.5 ? 1 : -1) * (1.2 + hash(i, 5) * 0.8), ph: i * 0.9,
    enter: i === 2 ? 6.4 : i === 5 ? 8.6 : 0, tag: name === 'Octavius' ? '#E0782A' : undefined }; });
  function walkerState(w, t) {
    let x = w.x, z = w.z0 + w.v * t, al = 1;
    if (w.enter) { const k = prog(t, w.enter - 0.9, w.enter); x = lerp(w.x, Math.sign(w.x) * 14.2, io3(k)); al = 1 - prog(t, w.enter - 0.25, w.enter); z = w.z0 + w.v * Math.min(t, w.enter - 0.9); }
    return { x, z, al };
  }

  // ---------- plaza crowd (hang out) ----------
  const CROWD = [
    { name: 'Octavius', bot: true, top: '#C9302C', legs: '#A82622', hair: '#C9302C', skin: '#D93A33', x: 1.5, z: 292, tag: '#E0782A', wave: true },
    { name: 'Guest-1664', top: '#2D3B6E', hair: '#2A1A14', x: 4.5, z: 283, talk: true, ph: 1 }, { name: 'Guest-3683', top: '#1F1D2A', hair: '#C2582B', x: -5, z: 285, talk: true, ph: 2 },
    { name: 'Guest-2041', top: '#6B2C8F', hair: '#F1D06B', x: -2.5, z: 289, dance: true, ph: 3 }, { name: 'Guest-8812', top: '#1E6B5F', hair: '#3A2A20', x: 7.5, z: 290, ph: 4 },
    { name: 'Guest-0420', top: '#8F2C4E', hair: '#151515', x: -8, z: 292, wave: true, ph: 5 }, { name: 'Guest-7319', top: '#3A3F8F', hair: '#B4472A', x: 10, z: 295, dance: true, ph: 6 },
    { name: 'Guest-5150', top: '#2B5D7A', hair: '#E8E2D0', x: -11, z: 296, ph: 7 }, { name: 'Guest-9001', top: '#7A3B1E', hair: '#2A1A14', x: 0.5, z: 284.5, talk: true, ph: 8 },
  ];
  const ME = { name: 'You', top: '#26233A', hair: '#B4472A', back: true, x: -0.6, z: 279, tag: '#22C55E' };

  // ---------- camera ----------
  function track(keys, t) {
    if (t <= keys[0][0]) return keys[0].slice(1); if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1].slice(1);
    let i = 0; while (t > keys[i + 1][0]) i++;
    const k0 = keys[i], k1 = keys[i + 1], dt = k1[0] - k0[0], s = (t - k0[0]) / dt, s2 = s * s, s3 = s2 * s;
    const tan = (j, c) => (j <= 0 || j >= keys.length - 1 ? 0 : (keys[j + 1][c] - keys[j - 1][c]) / (keys[j + 1][0] - keys[j - 1][0]));
    return [1, 2, 3, 4, 5].map((c) => (2 * s3 - 3 * s2 + 1) * k0[c] + (s3 - 2 * s2 + s) * dt * tan(i, c) + (-2 * s3 + 3 * s2) * k1[c] + (s3 - s2) * dt * tan(i + 1, c));
  }
  const look = (x, y, z, tx, ty, tz) => [Math.atan2(tx - x, tz - z), Math.atan2(ty - y, Math.hypot(tx - x, tz - z))];
  function followCam(t) {
    const z = plZ(t), gx = -15 * bump(t, 3.6, 5.3) + 15 * bump(t, 5.5, 7.3), cx = PL.x - 0.6, cy = 3.6, cz = z - 9.5;
    const [yaw, pitch] = look(cx, cy, cz, PL.x + gx, 2.2, z + 16); return [cx, cy, cz, yaw, pitch];
  }
  const TOP = [0, 230, 128, 0.0, -1.5];
  function camAt(t) {
    let c;
    if (t < 2.5) c = track([[0, 0, 150, 30, 0, -1.05], [2.5, ...followCam(2.5)]], t);
    else if (t < 10) c = followCam(t);
    else if (t < 11.5) { const a = followCam(10), k = io3(prog(t, 10, 11.5)); c = a.map((v, i) => lerp(v, TOP[i], i === 4 ? io5(prog(t, 10, 11.5)) : k)); }
    else if (t < 19) { const d = prog(t, 11.5, 19); c = [Math.sin(d * 2) * 4, 230 - d * 20, 128 + d * 26, 0.12 * Math.sin(d * 2.4), -1.5]; }
    else if (t < 26) { const from = [Math.sin(2) * 4, 210, 154, 0.12 * Math.sin(2.4), -1.5]; const a = [-1.2, 3.0, 270], b = [0.3, 2.7, 274]; const k = io3(prog(t, 19, 20.2)), p = io3(prog(t, 20.2, 26)); const pos = a.map((v, i) => lerp(v, b[i], p)); const [yy, pp] = look(...pos, 0.6, 1.4, 300); const to = [...pos, yy, pp]; c = from.map((v, i) => lerp(v, to[i], k)); }
    else c = track([[26, 0.3, 2.7, 274, ...look(0.3, 2.7, 274, 0.6, 1.4, 300)], [28.0, 0, 24, 262, 0, 0.42], [30, 0, 44, 262, 0, 0.5]], t);
    return { x: c[0], y: c[1], z: c[2], yaw: c[3], pitch: c[4], f: F, roll: 0 };
  }

  // ---------- world extras ----------
  const plotState = (b, t) => { const cl = claimOf(b); if (cl && t >= cl[1]) return { claimed: true, own: cl[2], col: cl[3], at: cl[1] }; return { claimed: false }; };
  function plots(c, t) {
    const k = prog(t, 10.4, 11.2) * (1 - prog(t, 18.6, 19.3)); if (k <= 0) return;
    for (const b of STREET) {
      const st = plotState(b, t), pts = [[b.x0, 0.06, b.z0], [b.x1, 0.06, b.z0], [b.x1, 0.06, b.z1], [b.x0, 0.06, b.z1]];
      if (!T.polyPath(c, pts)) continue;
      const col = st.claimed ? st.col : COL.pink, fl = st.claimed ? 0.32 + 0.4 * Math.exp(-(t - st.at) * 3) : 0.12 + 0.06 * Math.sin(t * 4 + b.id);
      c.fillStyle = rgba(col, fl * k); c.fill(); T.neon(c, col, 2.2, k * (st.claimed ? 1 : 0.85));
      if (b === HERO && t > 12.2 && t < 13.1) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(COL.green, 0.25 + 0.2 * Math.sin(t * 20)); c.fill(); c.restore(); T.neon(c, COL.green, 4, 1); }
    }
  }
  const heads = [];
  function worldItems(t) {
    const it = [];
    if (t < 10.4) {
      it.push([PL.x, plZ(t), (c) => { const h = T.drawAvatar(c, { name: 'You', top: '#26233A', hair: '#B4472A', back: true, x: PL.x, z: plZ(t), walk: t > 2.5, bob: t > 2.5 && t < 10 ? 0.07 : 0, bpm: 1.6 }, t); if (h) heads.push([h, 'You', '#22C55E']); }]);
      WALK.forEach((w) => { const s = walkerState(w, t); if (s.al <= 0.01) return; it.push([s.x, s.z, (c) => { c.save(); c.globalAlpha = s.al; const h = T.drawAvatar(c, { ...w, x: s.x, z: s.z, walk: true }, t); c.restore(); if (h && s.al > 0.5) heads.push([h, w.name, w.tag || '#2E7BFF']); }]);
        if (w.enter && t > w.enter - 0.35 && t < w.enter + 0.6) it.push([Math.sign(w.x) * 14, s.z, (c) => doorFlash(c, Math.sign(w.x) * 13.9, s.z, t - (w.enter - 0.35)), -0.3]); });
    }
    if (t > 19) {
      CROWD.forEach((a) => { const x = a.x + (a.walk ? Math.sin(t * 0.5 + a.ph) * 2 : 0); it.push([x, a.z, (c) => { const h = T.drawAvatar(c, { ...a, x, bob: a.dance ? 0.2 : 0, bpm: 1 }, t); if (h) heads.push([h, a.name, a.tag || '#2E7BFF', a]); }]);
        if (a.talk) it.push([x, a.z + 0.01, (c) => voiceRing(c, x, a.z, t, a.ph), 0.2]); });
      it.push([ME.x, ME.z, (c) => { const h = T.drawAvatar(c, ME, t); if (h) heads.push([h, 'You', ME.tag, ME]); }]);
    }
    return it;
  }
  function doorFlash(c, x, z, d) {
    const p = T.P(x, 1.4, z); if (!p) return; const s = F / p[2], k = Math.exp(-d * 3);
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], s * 3); g.addColorStop(0, rgba(COL.cyan, 0.8 * k)); g.addColorStop(1, rgba(COL.cyan, 0)); c.fillStyle = g; c.fillRect(p[0] - s * 3, p[1] - s * 3, s * 6, s * 6); c.restore();
  }
  function voiceRing(c, x, z, t, i) {
    for (let k = 0; k < 3; k++) { const ph = ((t * 0.9 + k / 3 + i * 0.13) % 1), r = 0.6 + ph * 4, pts = []; for (let j = 0; j < 28; j++) { const a = j / 28 * TAU; pts.push([x + Math.cos(a) * r, 0.05, z + Math.sin(a) * r]); }
      if (T.polyPath(c, pts)) T.neon(c, COL.cyan, 1.5, (1 - ph) * 0.8); }
  }

  // ---------- UI (screen space) ----------
  const glass = (c, x, y, w, h, r = 28, edge = 'rgba(255,255,255,0.14)') => { c.save(); c.fillStyle = 'rgba(16,10,34,0.72)'; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); c.strokeStyle = edge; c.lineWidth = 2; c.stroke(); c.restore(); };
  function txt(c, s, x, y, font, col, align = 'left', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  function neonText(c, s, x, y, size, glow, k = 1, align = 'center') {
    c.save(); c.font = NEONF(size); c.textAlign = align; c.textBaseline = 'middle';
    for (const [blur, a] of [[size * 0.5, 0.9], [size * 0.18, 1], [0, 1]]) { c.shadowColor = glow; c.shadowBlur = blur; c.globalAlpha = a * k; c.fillStyle = blur ? glow : '#FFFFFF'; c.fillText(s, x, y); }
    c.restore();
  }
  function flickerK(t, t0, seed) { if (t < t0) return 0; const d = t - t0; if (d > 0.45) return 1; return hash(Math.floor(t * 30), seed) < 0.25 + d * 1.6 ? 1 : 0.1; }
  function logo(c, t, t0, y, size, out = 1) {
    c.save(); c.font = NEONF(size); const word = 'ArcTown', tw = c.measureText(word).width; let x = W / 2 - tw / 2;
    for (let i = 0; i < word.length; i++) { const ch = word[i], cw = c.measureText(ch).width; neonText(c, ch, x + cw / 2, y, size, i < 3 ? COL.pink : COL.cyan, flickerK(t, t0 + i * 0.05, i) * out); x += cw; } c.restore();
  }
  function hook(c, t) {
    if (t > 2.7) return; const out = 1 - prog(t, 2.2, 2.6);
    logo(c, t, 0.25, 720, 230, out);
    ['EXPLORE', 'BUY LAND', 'HANG OUT'].forEach((s, i) => { const k = pop(prog(t, 0.9 + i * 0.25, 1.4 + i * 0.25)); if (k <= 0) return; c.save(); c.globalAlpha = out; c.translate(W / 2 + (i - 1) * 320, 880); c.scale(k, k);
      c.font = SANS(800, 34); const w = c.measureText(s).width + 64; c.fillStyle = 'rgba(14,8,30,0.75)'; c.beginPath(); c.roundRect(-w / 2, -34, w, 68, 34); c.fill(); c.strokeStyle = [COL.cyan, COL.pink, COL.yellow][i]; c.lineWidth = 3; c.shadowColor = c.strokeStyle; c.shadowBlur = 16; c.stroke(); c.shadowBlur = 0; txt(c, s, 2, 2, SANS(800, 34), '#fff', 'center', 4); c.restore(); });
  }
  const CAPS = [[2.7, 9.9, 'EXPLORE', 'Walk in. Every building is a project.', COL.cyan, 1470], [13.6, 15.4, 'BUY LAND', 'Claim a plot in ArcTown.', COL.pink, 1470], [15.5, 18.9, 'BUILD', 'Watch your HQ rise.', COL.yellow, 1470],
    [19.6, 23.8, 'HANG OUT', 'Chat · Voice · Friends', COL.yellow, 330]];
  function captions(c, t) {
    for (const [t0, t1, a, b, col, y] of CAPS) {
      if (t < t0 || t > t1) continue; const k = io5(prog(t, t0, t0 + 0.25)), out = io3(prog(t, t1 - 0.2, t1));
      c.save(); c.globalAlpha = 1 - out; c.translate(W / 2, y); c.scale(lerp(1.3, 1, k), lerp(1.3, 1, k));
      neonText(c, a, 0, 0, 132, col, 1); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 12; const lw = 360 * io3(prog(t, t0 + 0.1, t0 + 0.45)); c.fillRect(-lw / 2, 78, lw, 5); c.shadowBlur = 0;
      c.globalAlpha = (1 - out) * prog(t, t0 + 0.15, t0 + 0.4); txt(c, b, 0, 130, SANS(700, 40), '#EDE8FF', 'center', 1); c.restore();
    }
  }
  function hud(c, t) {
    const k = prog(t, 2.6, 3.0) * (1 - prog(t, 25.8, 26.2)); if (k <= 0) return; c.save(); c.globalAlpha = k;
    glass(c, 40, 70, 420, 96, 48); c.fillStyle = '#22C55E'; c.beginPath(); c.arc(92, 118, 11, 0, TAU); c.fill(); c.globalAlpha = k * (0.5 + 0.5 * Math.sin(t * 5)); c.beginPath(); c.arc(92, 118, 20, 0, TAU); c.strokeStyle = '#22C55E'; c.lineWidth = 2; c.stroke(); c.globalAlpha = k;
    txt(c, 'ArcTown', 122, 106, SANS(800, 36), '#fff'); txt(c, t < 19 ? 'Exploring · Avenue' : 'Town Hall plaza', 122, 140, SANS(500, 24), '#B9AED8');
    if (t < 19) minimap(c, t);
    c.restore();
  }
  function minimap(c, t) {
    const x0 = 770, y0 = 70, w = 270, h = 380, zr = [0, 300], xr = [-42, 42]; glass(c, x0, y0, w, h, 24);
    const mx = (x) => x0 + 18 + (x - xr[0]) / (xr[1] - xr[0]) * (w - 36), mz = (z) => y0 + h - 18 - (z - zr[0]) / (zr[1] - zr[0]) * (h - 36);
    c.save(); c.beginPath(); c.roundRect(x0, y0, w, h, 24); c.clip();
    c.fillStyle = 'rgba(46,40,71,0.9)'; c.fillRect(mx(-8), mz(300), mx(8) - mx(-8), mz(0) - mz(300));
    c.fillStyle = rgba(COL.cyan, 0.8); c.fillRect(mx(0) - 1, mz(300), 2, mz(0) - mz(300));
    for (const b of STREET) { const st = plotState(b, t), sunk = sinkK(b, t) > 0.5 && b.hFn(t) < b.h * 0.5; c.fillStyle = st.claimed ? rgba(st.col, 0.85) : sunk ? rgba(COL.pink, 0.35) : 'rgba(255,200,140,0.55)'; c.fillRect(mx(b.x0), mz(b.z1), mx(b.x1) - mx(b.x0), mz(b.z0) - mz(b.z1));
      if (st.claimed && t - st.at < 0.6) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(mx(b.x0) - 3, mz(b.z1) - 3, mx(b.x1) - mx(b.x0) + 6, mz(b.z0) - mz(b.z1) + 6); } }
    c.fillStyle = '#E9E6F5'; c.fillRect(mx(-19), mz(318), mx(19) - mx(-19), mz(296) - mz(318));
    if (t < 10.5) { WALK.forEach((w2) => { const s = walkerState(w2, t); if (s.al < 0.3) return; c.fillStyle = '#2E7BFF'; c.beginPath(); c.arc(mx(s.x), mz(s.z), 4, 0, TAU); c.fill(); });
      const px = mx(PL.x), pz = mz(plZ(t)); c.fillStyle = '#22C55E'; c.beginPath(); c.moveTo(px, pz - 11); c.lineTo(px + 8, pz + 8); c.lineTo(px, pz + 3); c.lineTo(px - 8, pz + 8); c.closePath(); c.fill(); }
    c.restore(); txt(c, 'MAP', x0 + 22, y0 + 26, SANS(800, 18), '#B9AED8', 'left', 3);
  }
  function shiftFx(c, t) {
    const k = prog(t, 9.95, 10.9); if (k <= 0 || k >= 1) return;
    const y = lerp(-80, H + 80, io3(k)); c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(0, y - 120, 0, y + 20); g.addColorStop(0, rgba(COL.cyan, 0)); g.addColorStop(0.85, rgba(COL.cyan, 0.35)); g.addColorStop(1, rgba('#ffffff', 0.9)); c.fillStyle = g; c.fillRect(0, y - 120, W, 140);
    c.fillStyle = rgba(COL.pink, 0.4); c.fillRect(0, y + 22, W, 4); c.restore();
  }
  function shiftTitle(c, t) {
    if (t < 10.3 || t > 11.7) return; const k = pop(prog(t, 10.3, 10.75)), out = prog(t, 11.35, 11.65);
    c.save(); c.globalAlpha = 1 - out; c.translate(W / 2, 900); c.scale(k, k); txt(c, 'NOW…', 0, -110, SANS(700, 46), '#EDE8FF', 'center', 10); neonText(c, 'MAKE IT', 0, 0, 150, COL.cyan); neonText(c, 'YOURS', 0, 150, 190, COL.pink); c.restore();
  }
  function cursor(c, x, y, press = 0) {
    c.save(); c.translate(x, y); c.scale(2.2 - press * 0.3, 2.2 - press * 0.3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.lineTo(6, 16.5); c.lineTo(10, 25); c.lineTo(13.5, 23.5); c.lineTo(9.5, 15); c.lineTo(17, 15); c.closePath();
    c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1.4; c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 8; c.fill(); c.stroke(); c.restore();
  }
  const center = (b, y = 0.1) => T.P((b.x0 + b.x1) / 2, y, (b.z0 + b.z1) / 2);
  function buyUI(c, t) {
    if (t < 11.4 || t > 19.2) return;
    // claim labels over each plot
    for (const b of STREET) { const st = plotState(b, t), p = center(b, Math.max(0.1, b.hFn(t)) + 0.5); if (!p || t > 18.5) continue; const vis = prog(t, 10.9, 11.4);
      if (!st.claimed) { if (b === HERO && t > 12.2) continue; c.save(); c.globalAlpha = vis * 0.9; c.font = SANS(800, 22); const w = c.measureText('FOR SALE').width + 28; c.fillStyle = 'rgba(14,8,30,0.82)'; c.beginPath(); c.roundRect(p[0] - w / 2, p[1] - 18, w, 36, 18); c.fill(); c.strokeStyle = rgba(COL.pink, 0.9); c.lineWidth = 2; c.stroke(); txt(c, 'FOR SALE', p[0], p[1] + 1, SANS(800, 22), '#FFD6F5', 'center', 2); c.restore(); }
      else { const k = pop(prog(t, st.at, st.at + 0.4)); c.save(); c.translate(p[0], p[1] - 10); c.scale(k, k); c.font = SANS(800, 26); const w = c.measureText(st.own).width + 34; c.fillStyle = rgba(st.col, 0.92); c.beginPath(); c.roundRect(-w / 2, -21, w, 42, 21); c.fill(); txt(c, st.own, 0, 1, SANS(800, 26), '#0B0618', 'center'); c.restore();
        const d = t - st.at; if (d < 0.7) { c.save(); c.strokeStyle = st.col; c.lineWidth = 4; c.globalAlpha = 1 - d / 0.7; c.beginPath(); c.arc(p[0], p[1], 30 + d * 220, 0, TAU); c.stroke(); c.restore(); } } }
    // hero flow: cursor → modal → apply → approved
    const hp = center(HERO, 0.1);
    if (hp && t < 12.4) { const k = io5(prog(t, 11.55, 12.15)), x = lerp(W * 0.3, hp[0] + 6, k), y = lerp(H * 0.95, hp[1] + 6, k); cursor(c, x, y, t > 12.15 && t < 12.3 ? 1 : 0); if (t > 12.2) { const d = t - 12.2; c.save(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.globalAlpha = 1 - d / 0.25; c.beginPath(); c.arc(hp[0], hp[1], 20 + d * 200, 0, TAU); c.stroke(); c.restore(); } }
    const mk = io5(prog(t, 12.3, 12.6)) * (1 - io5(prog(t, 13.3, 13.6))); if (mk > 0) {
      const y0 = lerp(H, 1180, mk), x0 = 70, w = W - 140, h = 470; c.save(); glass(c, x0, y0, w, h, 36, rgba(COL.pink, 0.7));
      txt(c, 'UP FOR SALE', x0 + 50, y0 + 70, NEONF(64), '#FFD6F5'); txt(c, 'Plot 14  ·  East Avenue', x0 + 50, y0 + 140, SANS(600, 36), '#EDE8FF');
      txt(c, 'Your business here — apply at the Town Hall', x0 + 50, y0 + 196, SANS(500, 30), '#B9AED8');
      const ok = t >= 12.95, press = t > 12.82 && t < 12.95 ? 1 : 0, bx = x0 + 50, by = y0 + 270, bw = w - 100, bh = 120;
      c.save(); c.translate(bx + bw / 2, by + bh / 2); c.scale(1 - press * 0.05, 1 - press * 0.05); c.shadowColor = ok ? '#22C55E' : COL.pink; c.shadowBlur = 36;
      const g = c.createLinearGradient(-bw / 2, 0, bw / 2, 0); g.addColorStop(0, ok ? '#22C55E' : COL.pink); g.addColorStop(1, ok ? '#15A34A' : COL.purple); c.fillStyle = g; c.beginPath(); c.roundRect(-bw / 2, -bh / 2, bw, bh, 60); c.fill(); c.shadowBlur = 0;
      txt(c, ok ? 'APPROVED  ✓' : 'APPLY FOR THIS PLOT', 0, 2, SANS(900, 44), '#fff', 'center', 3); c.restore();
      if (t < 12.95) cursor(c, bx + bw * 0.62, by + bh * 0.62 + (1 - io5(prog(t, 12.55, 12.8))) * 160, press);
      c.restore();
    }
    // claim feed + counter
    const n = CLAIMS.filter((cl) => t >= cl[1]).length; if (t > 13.0) { const k = A(t, 13.0, 0.4); c.save(); c.globalAlpha = k; glass(c, W / 2 - 230, 210, 460, 118, 30, rgba(COL.cyan, 0.6)); txt(c, 'PLOTS CLAIMED', W / 2, 246, SANS(800, 24), '#B9AED8', 'center', 5);
      const bump2 = Math.exp(-Math.max(0, t - (CLAIMS.filter((cl) => t >= cl[1]).slice(-1)[0] || [0, 0])[1]) * 8); c.save(); c.translate(W / 2, 292); c.scale(1 + bump2 * 0.25, 1 + bump2 * 0.25); neonText(c, String(n), 0, 0, 62, COL.cyan); c.restore(); c.restore(); }
    CLAIMS.slice(1).forEach(([b, tc, own, col], i) => { const d = t - tc; if (d < 0 || d > 1.6) return; const k = io5(prog(d, 0, 0.25)) * (1 - io3(prog(d, 1.3, 1.6))), row = CLAIMS.slice(1).filter((q) => t - q[1] >= 0 && t - q[1] <= 1.6 && q[1] > tc).length;
      c.save(); c.globalAlpha = k; const y = 380 + row * 92; glass(c, W / 2 - 330 + (1 - k) * 80, y, 660, 76, 38); c.fillStyle = col; c.beginPath(); c.arc(W / 2 - 290 + (1 - k) * 80, y + 38, 13, 0, TAU); c.fill();
      txt(c, `${own}  claimed a plot`, W / 2 - 262 + (1 - k) * 80, y + 39, SANS(700, 30), '#fff'); c.restore(); void i; });
  }
  // chat panel + bubbles + friend request (hang out)
  const CHAT = [[19.9, 'Octavius', '#E0782A', 'Welcome to ArcTown! Glad you stopped by'], [20.7, 'Guest-1664', '#2EF2FF', 'gm gm! who just bought on East Ave?'], [21.5, 'Guest-3683', '#FF3FD8', 'me!! building my HQ tonight'],
    [22.3, 'Guest-2041', '#FFE45C', 'voice is so clean in here'], [23.5, 'You', '#22C55E', 'gm everyone!'], [24.3, 'Guest-9001', '#9B6BFF', 'come check out FINALITY']];
  const TYPE = [22.6, 23.4, 'gm everyone!'];
  function chatPanel(c, t) {
    if (t < 19.6 || t > 26.3) return; const k = io5(prog(t, 19.6, 20.0)) * (1 - io3(prog(t, 25.9, 26.3))); const x0 = 40, w = W - 80, h = 560, y0 = lerp(H, H - h - 150, k);
    c.save(); glass(c, x0, y0, w, h, 32); c.save(); c.beginPath(); c.roundRect(x0, y0, w, h - 110, 32); c.clip();
    const shown = CHAT.filter(([tt]) => t >= tt), rowH = 76; let y = y0 + h - 140 - (shown.length - 1) * rowH;
    shown.forEach(([tt, who, col, msg], i) => { const kk = io5(prog(t, tt, tt + 0.25)); c.save(); c.globalAlpha = kk; const yy = y + i * rowH + (1 - kk) * 30; if (yy < y0 + 10) { c.restore(); return; }
      c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.roundRect(x0 + 24, yy - 30, 92, 34, 17); c.fill(); txt(c, 'NEAR', x0 + 70, yy - 13, SANS(800, 18), '#B9AED8', 'center', 2);
      txt(c, who, x0 + 134, yy - 13, SANS(800, 30), col); c.font = SANS(800, 30); const nw = c.measureText(who).width; txt(c, msg, x0 + 134 + nw + 16, yy - 13, SANS(500, 30), '#EDE8FF'); c.restore(); });
    c.restore();
    // tabs + input
    const iy = y0 + h - 94; c.fillStyle = '#2E7BFF'; c.beginPath(); c.roundRect(x0 + 24, iy, 160, 70, 18); c.fill(); txt(c, 'Nearby', x0 + 104, iy + 36, SANS(700, 28), '#fff', 'center');
    txt(c, 'Everyone', x0 + 260, iy + 36, SANS(600, 28), '#D7D0EE', 'center'); c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2; c.beginPath(); c.roundRect(x0 + 360, iy, w - 384, 70, 18); c.stroke();
    const typed = t >= TYPE[0] && t < TYPE[1] ? TYPE[2].slice(0, Math.floor(prog(t, TYPE[0], TYPE[1] - 0.2) * TYPE[2].length)) : '';
    txt(c, typed || 'Message nearby', x0 + 384, iy + 36, SANS(500, 28), typed ? '#fff' : '#8E86A8'); if (typed && Math.floor(t * 4) % 2 === 0) { c.font = SANS(500, 28); c.fillStyle = '#fff'; c.fillRect(x0 + 388 + c.measureText(typed).width, iy + 18, 3, 36); }
    c.restore();
  }
  function bubbles(c, t) {
    const B = [[20.7, 'Guest-1664', 'gm gm!'], [21.5, 'Guest-3683', 'building my HQ tonight'], [22.3, 'Guest-2041', 'voice is so clean'], [23.5, 'You', 'gm everyone!'], [24.3, 'Guest-9001', 'check out FINALITY']];
    for (const [t0, who, msg] of B) { const hd = heads.find(([, n]) => n === who); if (!hd || t < t0 || t > t0 + 2.2) continue; const [h] = hd, k = pop(prog(t, t0, t0 + 0.35)), out = prog(t, t0 + 1.9, t0 + 2.2);
      c.save(); c.globalAlpha = 1 - out; c.translate(h.x, h.y - 40); c.scale(k, k); c.font = SANS(700, 30); const w = c.measureText(msg).width + 44, hh = 58;
      c.fillStyle = 'rgba(255,255,255,0.96)'; c.beginPath(); c.roundRect(-w / 2, -hh, w, hh, 22); c.moveTo(-10, 0); c.lineTo(0, 14); c.lineTo(10, 0); c.fill(); c.fillStyle = '#16122A'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(msg, 0, -hh / 2 + 1); c.restore(); }
    // hearts floating from dancers
    heads.forEach(([h, , , a]) => { if (!a || !a.dance || t < 19.5) return; for (let k = 0; k < 3; k++) { const ph = ((t * 0.7 + k / 3 + (a.ph || 0) * 0.1) % 1), x = h.x + Math.sin(ph * 6 + k) * 18, y = h.y - 30 - ph * 160, s = 14 * (1 - ph * 0.3); c.save(); c.globalAlpha = 1 - ph; c.fillStyle = k % 2 ? COL.pink : '#FF5A7A'; c.translate(x, y); c.beginPath(); c.moveTo(0, s * 0.35); c.bezierCurveTo(-s, -s * 0.4, -s * 0.5, -s * 1.1, 0, -s * 0.5); c.bezierCurveTo(s * 0.5, -s * 1.1, s, -s * 0.4, 0, s * 0.35); c.fill(); c.restore(); } });
  }
  function friendToast(c, t) {
    if (t < 24.0 || t > 25.9) return; const k = io5(prog(t, 24.0, 24.3)) * (1 - io3(prog(t, 25.5, 25.9))), y = lerp(-140, 200, k), acc = t >= 24.75;
    c.save(); glass(c, 70, y, W - 140, 120, 30, rgba(acc ? '#22C55E' : COL.cyan, 0.7)); c.fillStyle = '#2D3B6E'; c.beginPath(); c.arc(140, y + 60, 34, 0, TAU); c.fill(); c.fillStyle = '#E6B08A'; c.beginPath(); c.arc(140, y + 54, 18, 0, TAU); c.fill();
    txt(c, acc ? "You're now friends with Guest-1664" : 'Guest-1664 sent a friend request', 196, y + 46, SANS(700, 30), '#fff'); txt(c, acc ? 'Say hi in Nearby chat' : 'Tap to accept', 196, y + 84, SANS(500, 26), '#B9AED8');
    if (!acc) { const p = t > 24.6 ? 1 : 0; c.save(); c.translate(W - 200, y + 60); c.scale(1 - p * 0.06, 1 - p * 0.06); c.fillStyle = '#22C55E'; c.beginPath(); c.roundRect(-70, -32, 140, 64, 32); c.fill(); txt(c, 'Accept', 0, 2, SANS(800, 28), '#fff', 'center'); c.restore(); cursor(c, W - 190 + (1 - io5(prog(t, 24.25, 24.55))) * 60, y + 72 + (1 - io5(prog(t, 24.25, 24.55))) * 140, p); }
    c.restore();
  }
  function voicePill(c, t) {
    if (t < 20.2 || t > 25.9) return; const k = A(t, 20.2, 0.4) * (1 - prog(t, 25.6, 25.9)); c.save(); c.globalAlpha = k; glass(c, W - 360, 540, 320, 72, 36, rgba(COL.cyan, 0.6));
    for (let i = 0; i < 5; i++) { const hh = 10 + 24 * Math.abs(Math.sin(t * 9 + i * 1.3)); c.fillStyle = COL.cyan; c.fillRect(W - 326 + i * 12, 576 - hh / 2, 6, hh); }
    txt(c, '3 nearby in voice', W - 252, 577, SANS(700, 26), '#fff'); c.restore();
  }
  function names(c, t) { for (const [h, n, col] of heads) if (h.s > 13 && t < 26) T.nameTag(c, h.x, h.y - 2, h.s, n, col); }
  function endCard(c, t) {
    if (t < 26.0) return; const k = A(t, 26.2, 0.6); c.save(); c.fillStyle = `rgba(8,4,20,${0.5 * k})`; c.fillRect(0, 0, W, H); c.restore();
    logo(c, t, 26.3, 760, 210);
    const sk = A(t, 26.9, 0.5); if (sk > 0) { c.save(); c.globalAlpha = sk; txt(c, 'Explore. Own land. Hang out.', W / 2, 900, SANS(700, 46), '#EDE8FF', 'center'); c.restore(); }
    const bk = pop(prog(t, 27.4, 27.9)); if (bk > 0) { const p = 1 + 0.05 * Math.exp(-((t % BT) * 9)); c.save(); c.translate(W / 2, 1080); c.scale(bk * p, bk * p); c.shadowColor = COL.pink; c.shadowBlur = 40;
      const g = c.createLinearGradient(-300, 0, 300, 0); g.addColorStop(0, COL.pink); g.addColorStop(1, COL.purple); c.fillStyle = g; c.beginPath(); c.roundRect(-300, -62, 600, 124, 62); c.fill(); c.shadowBlur = 0; txt(c, 'ENTER ARCTOWN', 3, 2, SANS(900, 46), '#fff', 'center', 4); c.restore();
      c.save(); c.globalAlpha = bk; neonText(c, 'arctown.app', W / 2, 1240, 72, COL.cyan); c.restore(); }
  }

  // ---------- finishing ----------
  const FLASH = [2.5, 11.5, 19.0, 26.0];
  let GRAIN = null;
  function finish(c, t) {
    let f = 0; for (const T0 of FLASH) if (t >= T0) f = Math.max(f, 0.55 * Math.exp(-(t - T0) * 13)); if (f > 0.01) { c.fillStyle = `rgba(235,230,255,${f})`; c.fillRect(0, 0, W, H); }
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 16; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const v = c.createRadialGradient(W / 2, H / 2, W * 0.5, W / 2, H / 2, H * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    const fi = 1 - prog(t, 0, 0.3), fo = prog(t, 29.3, 30); if (fi > 0 || fo > 0) { c.fillStyle = `rgba(0,0,0,${Math.max(fi, fo)})`; c.fillRect(0, 0, W, H); }
  }

  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.imageSmoothingQuality = 'high';
    heads.length = 0;
    T.render(c, camAt(t), t, { items: worldItems(t), ground: (cc) => plots(cc, t), cubePower: 1 - prog(t, 10, 10.6) + prog(t, 18.6, 19.2) });
    shiftFx(c, t); names(c, t); bubbles(c, t); buyUI(c, t); hud(c, t); voicePill(c, t); chatPanel(c, t); friendToast(c, t);
    hook(c, t); shiftTitle(c, t); captions(c, t); endCard(c, t); finish(c, t);
  }

  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(NEONF(80)), document.fonts.load(SANS(800, 30)), document.fonts.load(SANS(500, 30)), document.fonts.load(SANS(900, 30))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
