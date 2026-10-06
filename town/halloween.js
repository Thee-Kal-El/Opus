// ARCTOWN HALLOWEEN PARTY — 30s invite, 1920x1080 @ 60fps, cut to 120 BPM.
// 0–4 a dark, haunted ArcTown lit only by lightning ("something is lurking…") · 4 DROP: the dripping title slams,
// pumpkins light up down the avenue · 8–13 spooky streets ($BOO HQ, Grimmer Market) with ghosts · 13–17.5 the
// costume party in the plaza · 17.5–19 in-game cutaway · 19–21 UP FOR SCARE · 21–23 blackout + jumpscare ·
// 23–30 the invite end card. Same city as the showcase, re-themed ('spooky'). renderAt(t) is deterministic.
(() => {
  'use strict';
  const VERT = !!window.VERTICAL, FOCAL = VERT ? 880 : 1050; // 9:16 build: town/halloween_vertical.html
  const T = window.TOWN('spooky', VERT ? { W: 1080, H: 1920 } : undefined), { W, H, TAU, COL, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, hash, SANS } = T;
  const FPS = 60, DUR = 30, BT = 0.5;
  const WHEN = 'THIS HALLOWEEN'; // ← the party date/time line on the end card
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const MARK = (s) => `400 ${s}px "Permanent Marker", cursive`, SERIF = (s) => `italic 400 ${s}px "Instrument Serif", serif`, DISP = (s) => `900 ${s}px "Inter Tight", sans-serif`;
  const OR = '#FF7A1A', PU = '#9B3DFF', GR = '#7CFF4F';
  const outline = (c, s, x, y, w) => { if (!VERT) return; c.save(); c.shadowBlur = 0; c.shadowColor = 'transparent'; c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#000'; c.lineJoin = 'round'; c.miterLimit = 2; c.lineWidth = w; c.strokeText(s, x, y); c.restore(); };

  function track(keys, t) {
    if (t <= keys[0][0]) return keys[0].slice(1); if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1].slice(1);
    let i = 0; while (t > keys[i + 1][0]) i++;
    const k0 = keys[i], k1 = keys[i + 1], dt = k1[0] - k0[0], s = (t - k0[0]) / dt, s2 = s * s, s3 = s2 * s;
    const tan = (j, c) => (j <= 0 || j >= keys.length - 1 || keys[j].hold ? 0 : (keys[j + 1][c] - keys[j - 1][c]) / (keys[j + 1][0] - keys[j - 1][0]));
    return [1, 2, 3, 4, 5].map((c) => (2 * s3 - 3 * s2 + 1) * k0[c] + (s3 - 2 * s2 + s) * dt * tan(i, c) + (-2 * s3 + 3 * s2) * k1[c] + (s3 - s2) * dt * tan(i + 1, c));
  }
  const look = (x, y, z, tx, ty, tz) => [Math.atan2(tx - x, tz - z), Math.atan2(ty - y, Math.hypot(tx - x, tz - z))];
  const signOf = (key, side) => T.SIGNS.find((s) => s.box && s.box.shop === key && s.box.side === side);
  function signShot(t0, t1, sg, side) { const zc = (sg.tl[2] + sg.tr[2]) / 2, sx = sg.tl[0], cx = -side * 5.5; return [[t0, -16, 4.2], [t1, -11, 5.0]].map(([tt, dz, y]) => { const z = zc + dz, [yaw, pitch] = look(cx, y, z, sx, 8.6, zc); return [tt, cx, y, z, yaw, pitch]; }); }
  const S_BOO = signOf('blip', -1), S_GRIM = signOf('glimmer', 1);
  const SCARE = T.BOXES.filter((b) => b.sale && b.side === -1).sort((a, b) => a.z0 - b.z0)[0], SCX = SCARE.x1, SCZ = (SCARE.z0 + SCARE.z1) / 2;
  const SHOTS = [
    [0, 4.0, [[0, 0, 2.6, -24, 0.04, 0.1], [4.0, 0, 3.0, -4, 0.04, 0.11]]],
    [4.0, 8.0, [[4.0, 0, 3.0, -4, 0.04, 0.11], [8.0, 2, 24, 30, 0.1, 0.1]]],
    [8.0, 13.0, (() => { const k = [...signShot(8.0, 9.45, S_BOO, -1), ...signShot(9.5, 10.95, S_GRIM, 1)]; k.push([13.0, 0, 3.4, (S_GRIM.tl[2] + 70), 0, 0.04]); k.forEach((q, i) => { if (i % 2 === 1) q.hold = true; }); return k; })()],
    [13.0, 17.5, [[13.0, -7, 2.8, 266, 0.1, 0.1], [17.5, 0, 3.2, 276, 0.0, 0.12]]],
    [19.0, 21.0, (() => { const a = [5, 4, SCZ - 22], b = [4, 5.5, SCZ - 14]; return [[19.0, ...a, ...look(...a, SCX, 10, SCZ)], [21.0, ...b, ...look(...b, SCX, 11, SCZ)]]; })()],
    [21.0, 23.0, [[21.0, 0, 2.4, 150, 0, 0.02], [23.0, 0, 2.4, 160, 0, 0.02]]],
    [23.0, 30.0, [[23.0, 0, 6, 210, 0.06, 0.2], [30.0, 0, 10, 238, 0.08, 0.26]]],
  ];
  function camAt(t) { const sh = SHOTS.find(([a, b]) => t >= a && t < b) || SHOTS[SHOTS.length - 1]; const [x, y, z, yaw, pitch] = track(sh[2], t); return { x, y, z, yaw, pitch, f: FOCAL, roll: 0 }; }

  // ---------- light ----------
  const BOLTS = [0.5, 2.6, 21.15];
  const bolt = (t) => { let k = 0; for (const b of BOLTS) { const d = t - b; if (d >= 0 && d < 0.5) k = Math.max(k, (d < 0.06 || (d > 0.12 && d < 0.18) ? 1 : 0.5) * Math.exp(-d * 6)); } return k; };
  const blackout = (t) => t >= 21.0 && t < 22.4;
  function power(b, t) {
    if (blackout(t)) return 0;
    if (t < 4.0) return b.kind === 'lamp' ? 0.25 : 0.18;
    const on = 4.0 + clamp(((b.z0 ?? 0) + 30) / 330) * 0.9 + hash(b.id || 0, 3) * 0.2; if (t < on) return 0.18; return t < on + 0.12 ? (Math.floor(t * 30) % 2 ? 1 : 0.2) : 1;
  }
  const lampPower = (l, t) => (blackout(t) ? (t > 21.6 && hash(Math.floor(t * 20), l.z | 0) < 0.15 ? 0.6 : 0) : power({ z0: l.z, id: l.z | 0, kind: 'lamp' }, t) * (hash(Math.floor(t * 12), l.z | 0) < 0.06 ? 0.2 : 1));

  // ---------- props ----------
  const PUMPKINS = []; for (let z = 4; z < 292; z += 11) for (const side of [-1, 1]) PUMPKINS.push({ x: side * (9.3 + hash(z, side) * 1.2), z: z + (side > 0 ? 5.5 : 0), s: 0.7 + hash(z, side, 2) * 0.5 });
  for (let k = 0; k < 10; k++) PUMPKINS.push({ x: -26 + k * 5.8, z: 297, s: 1.1 });
  function drawPumpkin(c, p, t) {
    const q = T.P(p.x, 0, p.z); if (!q) return; const s = FOCAL / q[2]; if (s < 0.8) return;
    const lit = t < 4 ? 0 : blackout(t) ? 0 : A(t, 4.0 + clamp(p.z / 300) * 1.6, 0.15), fl = 0.85 + 0.15 * Math.sin(t * 17 + p.z), r = 0.62 * p.s * s;
    if (lit > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(q[0], q[1] - r * 0.6, 0, q[0], q[1] - r * 0.6, r * 4.5); g.addColorStop(0, rgba(OR, 0.45 * lit * fl)); g.addColorStop(1, rgba(OR, 0)); c.fillStyle = g; c.fillRect(q[0] - r * 4.5, q[1] - r * 5, r * 9, r * 9); c.restore(); }
    const fk = T.fogK(q[2]); c.save(); c.translate(q[0], q[1] - r * 0.85); c.globalAlpha = 1 - fk * 0.5;
    for (const [dx, w, col] of [[-0.45, 0.6, '#B8480E'], [0.45, 0.6, '#B8480E'], [0, 0.72, '#E0631A']]) { c.fillStyle = col; c.beginPath(); c.ellipse(dx * r, 0, w * r, 0.85 * r, 0, 0, TAU); c.fill(); }
    c.fillStyle = '#3F5A1E'; c.fillRect(-0.08 * r, -1.08 * r, 0.16 * r, 0.32 * r);
    c.fillStyle = lit > 0 ? `rgba(255,${200 + 40 * fl | 0},90,${0.25 + 0.75 * lit * fl})` : '#401808';
    c.beginPath(); c.moveTo(-0.5 * r, -0.12 * r); c.lineTo(-0.22 * r, -0.42 * r); c.lineTo(-0.12 * r, -0.08 * r); c.closePath(); c.moveTo(0.5 * r, -0.12 * r); c.lineTo(0.22 * r, -0.42 * r); c.lineTo(0.12 * r, -0.08 * r); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-0.55 * r, 0.2 * r); for (let i = 0; i <= 6; i++) c.lineTo(lerp(-0.55, 0.55, i / 6) * r, (0.2 + (i % 2 ? 0.14 : 0)) * r); c.lineTo(0.4 * r, 0.5 * r); c.lineTo(-0.4 * r, 0.5 * r); c.closePath(); c.fill();
    c.restore();
  }
  function drawGhost(c, x, y, z, t, sc = 1, al = 0.85) {
    const q = T.P(x, y, z); if (!q) return; const s = FOCAL / q[2] * sc; if (s < 0.5) return; const fk = T.fogK(q[2]);
    c.save(); c.translate(q[0], q[1]); c.globalAlpha = al * (1 - fk * 0.4);
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 2.6); g.addColorStop(0, 'rgba(190,255,220,0.3)'); g.addColorStop(1, 'rgba(160,120,255,0)'); c.fillStyle = g; c.fillRect(-s * 2.6, -s * 2.6, s * 5.2, s * 5.2); c.restore();
    c.beginPath(); c.moveTo(-0.9 * s, 0.4 * s); c.quadraticCurveTo(-0.95 * s, -1.6 * s, 0, -1.6 * s); c.quadraticCurveTo(0.95 * s, -1.6 * s, 0.9 * s, 0.4 * s);
    for (let i = 0; i <= 8; i++) { const xx = lerp(0.9, -0.9, i / 8) * s, yy = (1.15 + 0.22 * Math.sin(t * 8 + i * 1.3)) * s * (i % 2 ? 0.85 : 1); c.lineTo(xx, yy); }
    c.closePath(); const gg = c.createLinearGradient(0, -1.6 * s, 0, 1.2 * s); gg.addColorStop(0, '#FFFFFF'); gg.addColorStop(1, 'rgba(220,210,255,0.35)'); c.fillStyle = gg; c.fill();
    c.fillStyle = '#140A1E'; c.beginPath(); c.ellipse(-0.32 * s, -0.75 * s, 0.16 * s, 0.24 * s, 0, 0, TAU); c.ellipse(0.32 * s, -0.75 * s, 0.16 * s, 0.24 * s, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(0, -0.22 * s, 0.13 * s, 0.19 * s * (0.8 + 0.2 * Math.sin(t * 5)), 0, 0, TAU); c.fill();
    c.restore();
  }
  const GHOSTS = [ // [x0, y, z0, vx, vz, phase]
    [-6, 7, 40, 1.4, 4, 0], [8, 10, 90, -1.2, 3, 1], [-3, 6, 130, 0.6, -2, 2], [5, 9, 175, -0.8, 2, 3], [-10, 12, 220, 1.0, 1, 4], [12, 8, 265, -1.5, 0.5, 5], [-14, 14, 285, 1.2, 0, 6], [16, 12, 290, -1.0, 0, 7]];
  function ghostItems(t) {
    const it = GHOSTS.map(([x0, y, z0, vx, vz, ph]) => { const x = x0 + Math.sin(t * 0.7 + ph) * 4 + vx * Math.sin(t * 0.3 + ph), z = z0 + Math.cos(t * 0.5 + ph) * 5 + vz * Math.sin(t * 0.2), yy = y + Math.sin(t * 1.7 + ph) * 1.2; return [x, z, (c) => drawGhost(c, x, yy, z, t + ph, 1.6, t < 4 ? 0.25 + 0.6 * bolt(t) : 0.8)]; });
    if (t > 11.6 && t < 12.6) { const k = io3(prog(t, 11.6, 12.6)), cam = camAt(t); it.push([0, cam.z + lerp(40, -2, k), (c) => drawGhost(c, lerp(3, -1, k), lerp(5, 3.4, k), cam.z + lerp(40, 1, k), t, 1.4, 0.9)]); }
    if (t > 19.2 && t < 21.0) { const k = crit(prog(t, 19.5, 20.4)); it.push([SCX + 1, SCZ, (c) => drawGhost(c, SCX + 1 + k * 5, lerp(4, 13, k), SCZ, t, lerp(0.5, 2.6, k), 0.9 * k), -2]); }
    return it;
  }
  // costume party in the plaza
  const AV = [
    { name: 'Guest-5730', costume: 'pumpkin', top: '#2A1A30', x: -4, z: 287, ph: 0.2 }, { name: 'Octavius', bot: true, top: '#C9302C', legs: '#A82622', hair: '#C9302C', skin: '#D93A33', x: 1.5, z: 292, tag: '#E0782A', costume: 'witch', ph: 1 },
    { name: 'Guest-1664', costume: 'ghost', x: 5.5, z: 284, ph: 2 }, { name: 'Guest-3683', costume: 'vamp', top: '#111018', hair: '#151515', skin: '#E9E1F2', x: -8.5, z: 291, ph: 3 },
    { name: 'Guest-2041', costume: 'witch', top: '#2B1640', hair: '#F1D06B', x: 9.5, z: 290, ph: 4 }, { name: 'Guest-8812', costume: 'pumpkin', top: '#1E3A2F', x: 0, z: 282, ph: 5 },
    { name: 'Guest-0420', costume: 'vamp', top: '#18101C', hair: '#2A1A14', x: 13, z: 294, ph: 0.7 }, { name: 'Guest-6666', costume: 'ghost', x: -12, z: 295, ph: 1.7 },
  ];
  const CHAT = [[13.4, 0, 'trick or treat!'], [13.9, 2, 'BOO!'], [14.6, 4, 'happy halloween!!'], [15.4, 3, 'this city is so spooky'], [16.1, 5, 'who brought the candy?']];
  function partyItems(t, heads) { return AV.map((a, i) => [a.x, a.z, (c) => { const h = T.drawAvatar(c, { ...a, bob: 0.22, bpm: 1, dance: true }, t); if (h) heads[i] = h; }]); }
  function spotlights(c, t) {
    c.save(); c.globalCompositeOperation = 'lighter';
    [[-20, OR, 0], [20, PU, 1.3], [-8, GR, 2.4], [8, OR, 3.3]].forEach(([x, col, ph]) => {
      const a = Math.sin(t * 1.4 + ph) * 0.5, b = T.P(x, 0.5, 300), top = T.P(x + Math.sin(a) * 90, 140, 300 + Math.cos(a * 1.3) * 40); if (!b || !top) return;
      const dx = top[0] - b[0], dy = top[1] - b[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, w = 160;
      const g = c.createLinearGradient(b[0], b[1], top[0], top[1]); g.addColorStop(0, rgba(col, 0.45)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g;
      c.beginPath(); c.moveTo(b[0] - nx * 6, b[1] - ny * 6); c.lineTo(top[0] - nx * w, top[1] - ny * w); c.lineTo(top[0] + nx * w, top[1] + ny * w); c.lineTo(b[0] + nx * 6, b[1] + ny * 6); c.closePath(); c.fill();
    }); c.restore();
  }

  // ---------- screen-space effects ----------
  function bats(c, t, t0, n = 26, seed = 1) {
    const d = t - t0; if (d < 0 || d > 3.2) return;
    for (let i = 0; i < n; i++) { const a = -0.3 - hash(i, seed) * 2.5, v = 380 + hash(i, seed, 2) * 900, x = W * (0.55 + hash(i, seed, 3) * 0.3) + Math.cos(a) * v * d + Math.sin(d * 5 + i) * 30, y = H * 0.42 + Math.sin(a) * v * d * 0.8 + Math.cos(d * 4 + i) * 20;
      const s = (14 + hash(i, seed, 4) * 26) * (1 + d * 0.5), fl = Math.sin(t * 28 + i * 2);
      c.save(); c.translate(x, y); c.fillStyle = '#05020A'; c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(-s * 0.5, -s * 0.6 * fl, -s, -s * 0.2 * fl); c.quadraticCurveTo(-s * 0.7, s * 0.05, -s * 0.55, s * 0.1); c.quadraticCurveTo(-s * 0.35, 0, -s * 0.15, s * 0.2);
      c.lineTo(0, s * 0.1); c.lineTo(s * 0.15, s * 0.2); c.quadraticCurveTo(s * 0.35, 0, s * 0.55, s * 0.1); c.quadraticCurveTo(s * 0.7, s * 0.05, s, -s * 0.2 * fl); c.quadraticCurveTo(s * 0.5, -s * 0.6 * fl, 0, 0); c.fill();
      c.beginPath(); c.arc(0, 0, s * 0.14, 0, TAU); c.fill(); c.restore(); }
  }
  function fog(c, t, k = 1) {
    c.save(); c.globalCompositeOperation = 'screen';
    for (let i = 0; i < 7; i++) { const x = ((hash(i, 1) * W * 1.6 + t * (30 + hash(i, 2) * 60)) % (W * 1.6)) - W * 0.3, y = H * (0.62 + hash(i, 3) * 0.32), r = 380 + hash(i, 4) * 400;
      const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(120,95,150,${0.16 * k})`); g.addColorStop(1, 'rgba(120,95,150,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
    c.restore();
  }
  function lightning(c, t) {
    const k = bolt(t); if (k <= 0.01) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(170,180,255,${0.55 * k})`; c.fillRect(0, 0, W, H);
    const b = BOLTS.findLast((x) => t >= x); let x = W * (0.25 + hash(b * 10 | 0, 1) * 0.5), y = 0; c.strokeStyle = `rgba(240,240,255,${k})`; c.lineWidth = 5; c.shadowColor = '#B9B4FF'; c.shadowBlur = 30; c.beginPath(); c.moveTo(x, y);
    for (let i = 0; i < 9; i++) { x += (hash(b * 10 | 0, i, 2) - 0.5) * 160; y += 45 + hash(b * 10 | 0, i, 3) * 30; c.lineTo(x, y); } c.stroke(); c.restore();
  }
  function cobwebs(c) {
    c.save(); c.strokeStyle = 'rgba(220,210,240,0.22)'; c.lineWidth = 1.5;
    for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [W, 0, -1, 1]]) { for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + sx * Math.cos(a) * 330, cy + sy * Math.sin(a) * 330); c.stroke(); }
      for (let r = 60; r < 330; r += 55) { c.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2, rr = r * (i % 2 ? 0.92 : 1); const px = cx + sx * Math.cos(a) * rr, py = cy + sy * Math.sin(a) * rr; i ? c.quadraticCurveTo(cx + sx * Math.cos(a - 0.13) * rr * 0.86, cy + sy * Math.sin(a - 0.13) * rr * 0.86, px, py) : c.moveTo(px, py); } c.stroke(); } }
    c.restore();
  }
  // dripping title: orange-to-blood gradient letters with slime drips that grow
  function dripText(c, s, x, y, size, t, t0, col = ['#FFC15A', '#FF6A1A', '#B0180A']) {
    c.save(); c.font = DISP(size); c.letterSpacing = '-2px'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const tw = c.measureText(s).width; let cx = x - tw / 2; const g = c.createLinearGradient(0, y - size * 0.75, 0, y + size * 0.6); g.addColorStop(0, col[0]); g.addColorStop(0.55, col[1]); g.addColorStop(1, col[2]);
    outline(c, s, cx, y, size * 0.08); c.shadowColor = rgba(col[1], 0.8); c.shadowBlur = size * 0.25; c.fillStyle = g; c.fillText(s, cx, y); c.shadowBlur = 0;
    for (let i = 0; i < s.length; i++) { const cw = c.measureText(s[i]).width; if (s[i] !== ' ') { const n = hash(i, s.length) < 0.6 ? 1 : 2; for (let k = 0; k < n; k++) { const dx = cx + cw * (0.25 + hash(i, k, 7) * 0.5), L = size * (0.12 + hash(i, k, 8) * 0.45) * crit(prog(t, t0 + 0.2 + hash(i, k, 9) * 0.6, t0 + 2.2)), w = size * (0.045 + hash(i, k, 10) * 0.03);
        if (L > 1) { c.fillStyle = col[2]; c.beginPath(); c.roundRect(dx - w / 2, y - size * 0.08, w, L + size * 0.08, w / 2); c.fill(); c.beginPath(); c.arc(dx, y + L, w * 0.9, 0, TAU); c.fill(); } } } cx += cw - 2; }
    c.restore();
  }
  function intro(c, t) {
    if (t > 4.0) return; const k = A(t, 0.9, 0.6) * (1 - prog(t, 3.6, 3.95)); if (k <= 0) return;
    const fl = t < 1.6 ? (hash(Math.floor(t * 24), 3) < 0.7 ? 1 : 0.3) : 1;
    c.save(); c.globalAlpha = k * fl; c.font = SERIF(96); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = rgba(OR, 0.8); c.shadowBlur = 30; c.fillStyle = '#FFE2C2';
    const msg = 'Something is lurking in ArcTown…', n = Math.floor(clamp(prog(t, 1.0, 2.6)) * msg.length); if (VERT) { const cut = 21; c.font = SERIF(92); outline(c, msg.slice(0, Math.min(n, cut)), W / 2, 560, 9); c.fillText(msg.slice(0, Math.min(n, cut)), W / 2, 560); if (n > cut) { outline(c, msg.slice(cut, n), W / 2, 670, 9); c.fillText(msg.slice(cut, n), W / 2, 670); } } else c.fillText(msg.slice(0, n), W / 2, 300); c.restore();
  }
  function titleCard(c, t, t0, t1, y0 = VERT ? 820 : 470) {
    if (t < t0 || t > t1) return; const k = A(t, t0, 0.45), out = prog(t, t1 - 0.35, t1);
    c.save(); c.globalAlpha = 1 - out; c.translate(W / 2, y0); c.scale(lerp(1.6, 1, k) * (VERT ? 0.6 : 1), lerp(1.6, 1, k) * (VERT ? 0.6 : 1)); c.translate(-W / 2, -y0);
    dripText(c, 'HALLOWEEN', W / 2, y0 - 40, 230, t, t0); dripText(c, 'PARTY', W / 2, y0 + 170, 200, t, t0 + 0.1, ['#D7A8FF', '#9B3DFF', '#4A0E8A']);
    const sk = A(t, t0 + 0.5, 0.4); c.globalAlpha = (1 - out) * sk; c.font = MARK(78); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = GR; c.shadowBlur = 26; c.fillStyle = '#DFFFD0'; outline(c, 'in ArcTown', W / 2, y0 + 310, 10); c.fillText('in ArcTown', W / 2, y0 + 310); c.restore();
  }
  const CAPS = [[8.05, 12.95, 'Spooky streets', 'EXPLORE THE HAUNTED CITY', OR], [13.05, 15.3, 'Costume party', 'COME HANG OUT IN ARCTOWN', PU], [15.4, 17.45, 'Bring your friends', 'PROXIMITY VOICE · CHAT', GR], [17.55, 18.95, 'Live in ArcTown', 'IN-GAME · ARCTOWN.APP', OR], [19.05, 20.95, 'Up for scare', 'IF YOU DARE…', OR]];
  function captions(c, t) {
    for (const [t0, t1, a, b, col] of CAPS) {
      if (t < t0 || t > t1) continue; const k = io5(prog(t, t0, t0 + 0.25)), out = io3(prog(t, t1 - 0.2, t1));
      c.save(); c.globalAlpha = 1 - out; const gy = VERT ? 1260 : 860, g = c.createLinearGradient(0, gy, 0, H); g.addColorStop(0, 'rgba(5,2,10,0)'); g.addColorStop(0.5, 'rgba(5,2,10,0.85)'); g.addColorStop(1, 'rgba(5,2,10,0.95)'); c.fillStyle = g; c.fillRect(0, gy, W, H - gy);
      if (VERT) { c.translate(W / 2, 1460); c.scale(lerp(1.3, 1, k), lerp(1.3, 1, k)); c.font = MARK(100); c.textAlign = 'center'; c.textBaseline = 'middle'; outline(c, a, 0, 0, 12); c.shadowColor = col; c.shadowBlur = 24; c.fillStyle = col; c.fillText(a, 0, 0); c.shadowBlur = 0; c.fillStyle = '#FFF4E8'; c.fillText(a, -2, -3);
        c.globalAlpha = (1 - out) * prog(t, t0 + 0.15, t0 + 0.4); c.font = SANS(800, 32); c.letterSpacing = '5px'; c.fillStyle = '#F2E6FF'; outline(c, b, 4, 100, 7); c.fillText(b, 4, 100); c.restore(); continue; }
      c.translate(80, 990); c.scale(lerp(1.3, 1, k), lerp(1.3, 1, k)); c.font = MARK(92); c.textBaseline = 'middle'; c.shadowColor = col; c.shadowBlur = 24; c.fillStyle = col; c.fillText(a, 0, 0); c.shadowBlur = 0; c.fillStyle = '#FFF4E8'; c.fillText(a, -2, -3);
      const aw = c.measureText(a).width; c.globalAlpha = (1 - out) * prog(t, t0 + 0.15, t0 + 0.4); c.font = SANS(800, 28); c.letterSpacing = '5px'; c.fillStyle = '#F2E6FF'; c.fillText(b, aw + 40, 10); c.restore();
    }
  }
  function cutaway(c, t) {
    if (t < 17.5 || t >= 19.0) return false; const im = IMG.shot_hall; if (!im) return false; const z = 1 + 0.06 * prog(t, 17.5, 19), s = Math.max(W / im.width, H / im.height) * z, dw = im.width * s, dh = im.height * s;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
    c.save(); c.globalCompositeOperation = 'color'; const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(120,40,200,0.55)'); g.addColorStop(1, 'rgba(255,110,20,0.55)'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(120,90,110,1)'; c.fillRect(0, 0, W, H); c.restore();
    fog(c, t, 1.4); cobwebs(c);
    return true;
  }
  function chatBubbles(c, t, heads) {
    for (const [t0, i, msg] of CHAT) { const hd = heads[i]; if (!hd || t < t0 || t > t0 + 2.2) continue; const k = pop(prog(t, t0, t0 + 0.35)), out = prog(t, t0 + 1.9, t0 + 2.2);
      c.save(); c.globalAlpha = 1 - out; c.translate(hd.x, hd.y - 34); c.scale(k, k); c.font = SANS(800, 30); const w = c.measureText(msg).width + 44, h = 58;
      c.fillStyle = 'rgba(255,240,225,0.97)'; c.beginPath(); c.roundRect(-w / 2, -h, w, h, 22); c.moveTo(-10, 0); c.lineTo(0, 14); c.lineTo(10, 0); c.fill(); c.strokeStyle = OR; c.lineWidth = 3; c.stroke(); c.fillStyle = '#1A0A10'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(msg, 0, -h / 2 + 1); c.restore(); }
    AV.forEach((a, i) => { const hd = heads[i]; if (hd && hd.s > 9) T.nameTag(c, hd.x, hd.y - 2, hd.s, a.name, a.tag || '#6A2BC2'); });
  }
  function jumpscare(c, t) {
    if (t < 21.9 || t > 23.0) return;
    const k = io5(prog(t, 21.9, 22.35)), s = lerp(0.05, 2.4, k), fl = 0.8 + 0.2 * Math.sin(t * 40);
    if (t < 22.5) { c.save(); c.translate(W / 2, H / 2 + 40); c.scale(s, s); c.rotate(Math.sin(t * 30) * 0.04);
      const r = 300; c.save(); c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2); gl.addColorStop(0, 'rgba(255,120,20,0.5)'); gl.addColorStop(1, 'rgba(255,60,0,0)'); c.fillStyle = gl; c.fillRect(-r * 2, -r * 2, r * 4, r * 4); c.restore();
      for (const [dx, w, col] of [[-0.45, 0.62, '#A53A0A'], [0.45, 0.62, '#A53A0A'], [0, 0.75, '#D85512']]) { c.fillStyle = col; c.beginPath(); c.ellipse(dx * r, 0, w * r, 0.85 * r, 0, 0, TAU); c.fill(); }
      c.fillStyle = `rgba(255,${220 * fl | 0},90,1)`; c.shadowColor = '#FFB020'; c.shadowBlur = 60;
      c.beginPath(); c.moveTo(-0.55 * r, -0.05 * r); c.lineTo(-0.2 * r, -0.5 * r); c.lineTo(-0.1 * r, 0); c.closePath(); c.moveTo(0.55 * r, -0.05 * r); c.lineTo(0.2 * r, -0.5 * r); c.lineTo(0.1 * r, 0); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-0.62 * r, 0.18 * r); for (let i = 0; i <= 8; i++) c.lineTo(lerp(-0.62, 0.62, i / 8) * r, (0.18 + (i % 2 ? 0.16 : 0)) * r); c.lineTo(0.45 * r, 0.6 * r); for (let i = 8; i >= 0; i--) c.lineTo(lerp(-0.45, 0.45, i / 8) * r, (0.6 - (i % 2 ? 0.14 : 0)) * r); c.closePath(); c.fill(); c.restore(); }
    if (t >= 22.35) { const q = A(t, 22.35, 0.3); c.save(); c.fillStyle = `rgba(5,2,10,${0.6})`; c.fillRect(0, 0, W, H); c.translate(W / 2, H / 2); c.scale(lerp(1.8, 1, q) + Math.sin(t * 50) * 0.01, lerp(1.8, 1, q)); if (VERT) { dripText(c, "DON'T", 0, -40, 230, t, 22.35, ['#FFFFFF', '#FF3A2A', '#7A0010']); dripText(c, 'MISS IT', 0, 200, 230, t, 22.45, ['#FFFFFF', '#FF3A2A', '#7A0010']); } else dripText(c, "DON'T MISS IT", 0, 60, 190, t, 22.35, ['#FFFFFF', '#FF3A2A', '#7A0010']); c.restore(); }
  }
  function endCard(c, t) {
    if (t < 23.0) return;
    c.fillStyle = `rgba(5,2,10,${0.5 * A(t, 23.0, 0.8)})`; c.fillRect(0, 0, W, H);
    titleCard(c, t, 23.0, 31, VERT ? 600 : 360);
    const k = A(t, 24.2, 0.5); if (k > 0) { c.save(); c.globalAlpha = k; c.font = SANS(900, 46); c.letterSpacing = '14px'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = OR; c.shadowBlur = 20; c.fillStyle = '#FFE8D0'; outline(c, WHEN, W / 2 + 7, VERT ? 1060 : 790, 9); c.fillText(WHEN, W / 2 + 7, VERT ? 1060 : 790); c.restore(); }
    const bk = pop(prog(t, 25.0, 25.5)); if (bk > 0) { const p = 1 + 0.05 * Math.exp(-((t % BT) * 9)); c.save(); c.translate(W / 2, VERT ? 1190 : 895); c.scale(bk * p, bk * p); c.shadowColor = OR; c.shadowBlur = 40;
      const g = c.createLinearGradient(-300, 0, 300, 0); g.addColorStop(0, OR); g.addColorStop(1, '#C2320A'); c.fillStyle = g; c.beginPath(); c.roundRect(-300, -52, 600, 104, 52); c.fill(); c.shadowBlur = 0;
      c.font = SANS(900, 40); c.letterSpacing = '4px'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('JOIN US… IF YOU DARE', 3, 2); c.restore();
      c.save(); c.globalAlpha = bk; c.font = MARK(58); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = GR; c.shadowBlur = 20; c.fillStyle = '#E8FFDA'; outline(c, 'arctown.app', W / 2, VERT ? 1330 : 1012, 9); c.fillText('arctown.app', W / 2, VERT ? 1330 : 1012); c.restore(); }
  }

  // ---------- finishing ----------
  const FLASH = [4.0, 8.0, 13.0, 17.5, 19.0, 23.0];
  let GRAIN = null;
  function finish(c, t) {
    let f = 0; for (const T0 of FLASH) if (t >= T0) f = Math.max(f, 0.6 * Math.exp(-(t - T0) * 13)); if (f > 0.01) { c.fillStyle = `rgba(255,200,150,${f})`; c.fillRect(0, 0, W, H); }
    if (t >= 22.35 && t < 22.6) { c.fillStyle = `rgba(255,255,255,${0.9 * (1 - prog(t, 22.35, 22.6))})`; c.fillRect(0, 0, W, H); }
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 26; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.0); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.75)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    const fi = 1 - prog(t, 0, 0.4), fo = prog(t, 29.3, 30); if (fi > 0 || fo > 0) { c.fillStyle = `rgba(0,0,0,${Math.max(fi, fo)})`; c.fillRect(0, 0, W, H); }
  }

  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.imageSmoothingQuality = 'high';
    if (!cutaway(c, t)) {
      const heads = [], cam = camAt(t), party = t >= 13 && t < 17.5;
      const items = [...PUMPKINS.map((p) => [p.x, p.z, (cc) => drawPumpkin(cc, p, t)]), ...ghostItems(t), ...(party || t >= 23 ? partyItems(t, heads) : [])];
      const sh = t >= 21 && t < 22.35 ? 0 : 0; void sh;
      T.render(c, cam, t, { power, lampPower, items, cubePower: blackout(t) ? 0 : t < 4 ? 0.2 : 0.8, sky: { stars: 0.5, moon: [0.32, 0.36, 170] } });
      if (party || t >= 23) spotlights(c, t);
      fog(c, t, t < 4 ? 1.3 : 1);
      if (party) chatBubbles(c, t, heads);
      if (blackout(t)) { c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, W, H); }
      lightning(c, t); cobwebs(c);
      bats(c, t, 2.6, 30, 1); bats(c, t, 4.0, 18, 2); bats(c, t, 23.2, 22, 3);
    }
    intro(c, t); titleCard(c, t, 4.0, 7.9); captions(c, t); jumpscare(c, t); endCard(c, t); finish(c, t);
  }

  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(MARK(80)), document.fonts.load(SERIF(80)), document.fonts.load(DISP(100)), document.fonts.load(T.NEONF(80)), document.fonts.load(SANS(800, 30)), load('shot_hall', '../assets/arctown/shot_hall.jpg')]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
