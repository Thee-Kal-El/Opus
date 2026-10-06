// THEE_KAL_EL — 15s "all out" motion piece, 1920x1080 @ 60fps, cut to 120 BPM. Dark, red-black cyberpunk.
// 0–1 boot glitch · 1.0 DROP: the YouTube play button slams · 1.5–5 dive through it into a 3D tunnel walled with
// his real videos and Shorts, word slams on every beat · 5–8 a 3D blockchain of video blocks · 8–11 the pixel avatar
// assembles from particles, explodes and reforms as @THEE_KAL_EL · 11–13 rapid-fire montage · 13–15 chrome lockup.
// renderAt(t) is deterministic.
(() => {
  'use strict';
  const K = window.KIT, { TAU, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, rr, hash } = K;
  const V = !!window.VERTICAL; // 9:16 build: kal/badass_vertical.html
  const W = V ? 1080 : 1920, H = V ? 1920 : 1080, FPS = 60, DUR = 15, BT = 0.5;
  const VY = (land, vert) => (V ? vert : land);
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const RED = '#FF0033', CY = '#22E4FF', BG = '#050507';
  const D = (s, w = 800) => `${w} ${s}px "Inter Tight", sans-serif`, M = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const VIDS = ['snakepot', 'cypher', 'limewire_back', 'limewire_merch', 'protonmail', 'damnbruh'];
  const SHORTS = ['short_dapps', 'short_netflix', 'short_vibes', 'short_tcg', 'short_onepiece', 'short_eminem', 'short_bumper', 'short_summer', 'short_playabull', 'short_nitro', 'short_ags20', 'short_raposa', 'short_heatbit'];
  const ASSETS = ['avatar_hd', 'banner_hd', 'kal_cutout', ...VIDS, ...SHORTS];
  const ease = (t, a, b, f = io3) => f(prog(t, a, b));
  const pulse = (t, T, k = 12) => (t >= T ? Math.exp(-(t - T) * k) : 0);
  function txt(c, s, x, y, font, col, align = 'center', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  function cover(c, k, x, y, w, h) { const im = IMG[k]; if (!im) return; const s = Math.max(w / im.width, h / im.height), sw = w / s, sh = h / s; c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h); }
  function slam(c, s, x, y, size, k, col = '#fff', split = 1) { // big word with RGB split + stroke
    c.save(); c.font = D(size, 800); c.letterSpacing = `${-size * 0.03}px`; { const mw = c.measureText(s).width, lim = W * 0.9; if (mw > lim) { size = size * lim / mw; c.font = D(size, 800); c.letterSpacing = `${-size * 0.03}px`; } } c.textAlign = 'center'; c.textBaseline = 'middle';
    const off = 14 * split * (1 - k * 0.7);
    c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(RED, 0.85); c.fillText(s, x - off, y); c.fillStyle = rgba(CY, 0.7); c.fillText(s, x + off, y); c.globalCompositeOperation = 'source-over';
    c.lineWidth = size * 0.035; c.strokeStyle = '#000'; c.lineJoin = 'round'; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); c.restore();
  }

  // ---------- 3D ----------
  let CAM = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, f: 900 };
  function setCam(c) { CAM = c; CAM.cy = Math.cos(c.yaw); CAM.sy = Math.sin(c.yaw); CAM.cp = Math.cos(c.pitch); CAM.sp = Math.sin(c.pitch); CAM.cr = Math.cos(c.roll); CAM.sr = Math.sin(c.roll); }
  function P(x, y, z) {
    const dx = x - CAM.x, dy = y - CAM.y, dz = z - CAM.z; const x1 = dx * CAM.cy - dz * CAM.sy, z1 = dx * CAM.sy + dz * CAM.cy, y2 = dy * CAM.cp - z1 * CAM.sp, z2 = dy * CAM.sp + z1 * CAM.cp;
    const x3 = x1 * CAM.cr - y2 * CAM.sr, y3 = x1 * CAM.sr + y2 * CAM.cr; if (z2 < 0.2) return null; return [W / 2 + x3 * CAM.f / z2, H / 2 - y3 * CAM.f / z2, z2];
  }
  // draw image region onto a 3D quad (tl, tr, bl corners) in `n` strips along u to tame affine error
  function quadImg(c, k, tl, tr, bl, n = 4, sub = null) {
    const im = IMG[k]; if (!im) return false; const [sx0, sy0, sw0, sh0] = sub || (() => { const a = Math.hypot(tr[0] - tl[0], tr[1] - tl[1], tr[2] - tl[2]) / Math.hypot(bl[0] - tl[0], bl[1] - tl[1], bl[2] - tl[2]); const ia = im.width / im.height; return ia > a ? [(im.width - im.height * a) / 2, 0, im.height * a, im.height] : [0, (im.height - im.width / a) / 2, im.width, im.width / a]; })();
    let drew = false;
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n, L = (u) => [lerp(tl[0], tr[0], u), lerp(tl[1], tr[1], u), lerp(tl[2], tr[2], u)], B = (u) => { const p = L(u); return [p[0] + bl[0] - tl[0], p[1] + bl[1] - tl[1], p[2] + bl[2] - tl[2]]; };
      const a = P(...L(u0)), b = P(...L(u1)), d = P(...B(u0)); if (!a || !b || !d) continue;
      const sw = sw0 / n, sx = sx0 + sw * i; c.save(); c.setTransform((b[0] - a[0]) / sw, (b[1] - a[1]) / sw, (d[0] - a[0]) / sh0, (d[1] - a[1]) / sh0, a[0], a[1]); c.drawImage(im, sx, sy0, sw + 0.6, sh0, 0, 0, sw + 0.6, sh0); c.restore(); drew = true;
    }
    return drew;
  }
  function line3(c, a, b) { const p = P(...a), q = P(...b); if (!p || !q) return false; c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); return true; }
  function glowStroke(c, col, w, a = 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = rgba(col, 0.15 * a); c.lineWidth = w * 6; c.stroke(); c.strokeStyle = rgba(col, 0.5 * a); c.lineWidth = w * 2.2; c.stroke(); c.strokeStyle = rgba(col, a); c.lineWidth = w; c.stroke(); c.restore(); }

  // ---------- S0 boot (0–1) ----------
  function boot(c, t) {
    if (t >= 1.0) return; c.fillStyle = BG; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) { const y = hash(i, Math.floor(t * 30)) * H, h = 2 + hash(i, 2, Math.floor(t * 30)) * 18; c.fillStyle = `rgba(255,0,51,${0.04 + hash(i, 3, Math.floor(t * 30)) * 0.12})`; c.fillRect(0, y, W, h); }
    const p = clamp(prog(t, 0.1, 0.92)); txt(c, '> INITIALIZING THEE_KAL_EL' + (Math.floor(t * 8) % 2 ? '_' : ''), W / 2 - 360, H / 2 - 40, M(700, VY(30, 38)), '#fff', 'left', 'middle', 2);
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(W / 2 - 360, H / 2 + 10, 720, 6); c.fillStyle = RED; c.fillRect(W / 2 - 360, H / 2 + 10, 720 * io3(p), 6);
    txt(c, `${Math.floor(io3(p) * 100)}%  ·  BLOCK ${String(Math.floor(io3(p) * 121)).padStart(3, '0')} / 121`, W / 2 - 360, H / 2 + 50, M(500, 22), '#8A8A96', 'left', 'middle', 2);
  }
  // ---------- S1 play button + S2 tunnel (1–5) ----------
  const TW = 8, TH = 4.5, TL = 4.2;
  function tunnelZ(t) { const d = Math.max(0, t - 1.5); return d * 16 + d * d * 2.2; }
  function tunnel(c, t) {
    if (t < 1.0 || t >= 5.05) return;
    c.fillStyle = BG; c.fillRect(0, 0, W, H);
    const dive = ease(t, 1.45, 1.75, io5);
    if (t < 1.75) { // play button slam then dive through it
      const s = (t < 1.45 ? lerp(3.2, 1, crit(prog(t, 1.0, 1.25))) : 1) * (1 + dive * 14), sh = pulse(t, 1.0, 9) * 26;
      c.save(); c.translate(W / 2 + (hash(Math.floor(t * 60), 1) - 0.5) * sh, H / 2 + (hash(Math.floor(t * 60), 2) - 0.5) * sh); c.scale(s, s);
      const w = 420, h = 296; c.save(); c.shadowColor = RED; c.shadowBlur = 90; rr(c, -w / 2, -h / 2, w, h, 84); c.fillStyle = RED; c.fill(); c.restore();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-58, -78); c.lineTo(98, 0); c.lineTo(-58, 78); c.closePath(); c.fill(); c.restore();
      if (dive > 0.4) { c.save(); c.globalAlpha = clamp((dive - 0.4) * 3); drawTunnel(c, t); c.restore(); }
      return;
    }
    drawTunnel(c, t);
    // word slams on the beat
    const WORDS = [[2.0, 'WEB3'], [2.5, 'CRYPTO'], [3.0, 'GAMING'], [3.5, 'DEFI'], [4.0, 'DEPIN']];
    for (const [T0, w] of WORDS) if (t >= T0 && t < T0 + 0.5) { const k = crit(prog(t, T0, T0 + 0.16)); slam(c, w, W / 2, H / 2 + 10, lerp(330, 250, k), k); }
    if (t >= 4.5) { const k = crit(prog(t, 4.5, 4.7)); slam(c, 'THE FUTURE', W / 2, H / 2, lerp(300, 210, k), k); }
  }
  function drawTunnel(c, t) {
    const z = tunnelZ(t), roll = Math.sin(t * 1.3) * 0.12 + ease(t, 4.4, 5.0) * 0.6; setCam({ x: Math.sin(t * 1.7) * 0.5, y: Math.cos(t * 1.1) * 0.3, z, yaw: 0, pitch: 0, roll, f: VY(820, 700) });
    // light at the end of the tunnel
    const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 420); g.addColorStop(0, 'rgba(255,40,70,0.55)'); g.addColorStop(0.4, 'rgba(120,0,30,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const k0 = Math.floor(z / TL), far = 22;
    for (let k = k0 + far; k >= k0; k--) {
      const z0 = k * TL, z1 = z0 + TL - 0.25, fog = clamp(1 - (z0 - z) / (far * TL)), al = fog * fog;
      if (al <= 0.02) continue; c.save(); c.globalAlpha = al;
      // side walls: 2 rows of videos each
      for (const sd of [-1, 1]) for (const r of [0, 1]) { const y1 = TH / 2 - r * TH / 2, y0 = y1 - TH / 2 + 0.12, x = sd * TW / 2, key = VIDS[((k * 3 + r * 2 + (sd > 0 ? 1 : 0)) % 6 + 6) % 6];
        if (sd < 0) quadImg(c, key, [x, y1, z1], [x, y1, z0], [x, y0, z1]); else quadImg(c, key, [x, y1, z0], [x, y1, z1], [x, y0, z0]); }
      // floor + ceiling: Shorts lying along the tunnel
      for (const fl of [-1, 1]) for (let j = 0; j < 3; j++) { const x0 = -TW / 2 + 0.2 + j * (TW / 3), x1 = x0 + TW / 3 - 0.4, y = fl * TH / 2, key = SHORTS[((k * 5 + j * 3 + (fl > 0 ? 7 : 0)) % SHORTS.length + SHORTS.length) % SHORTS.length];
        if (fl < 0) quadImg(c, key, [x0, y, z1], [x1, y, z1], [x0, y, z0], 3, null); else quadImg(c, key, [x0, y, z0], [x1, y, z0], [x0, y, z1], 3, null); }
      c.restore();
      // neon ribs
      c.beginPath(); line3(c, [-TW / 2, -TH / 2, z0], [TW / 2, -TH / 2, z0]); line3(c, [TW / 2, -TH / 2, z0], [TW / 2, TH / 2, z0]); line3(c, [TW / 2, TH / 2, z0], [-TW / 2, TH / 2, z0]); line3(c, [-TW / 2, TH / 2, z0], [-TW / 2, -TH / 2, z0]);
      glowStroke(c, k % 4 === 0 ? CY : RED, 2, al * (0.6 + 0.4 * pulse(t, Math.round(t * 2) / 2, 6)));
    }
    // speed streaks
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 70; i++) { const a = hash(i, 1) * TAU, r0 = 200 + ((hash(i, 2) * 900 + t * 2400 * (0.6 + hash(i, 3))) % 900), len = 60 + hash(i, 4) * 180; c.strokeStyle = `rgba(255,${hash(i, 5) < 0.3 ? 220 : 60},${hash(i, 5) < 0.3 ? 255 : 90},${0.25 * (r0 / 1100)})`; c.lineWidth = 2; c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); c.lineTo(W / 2 + Math.cos(a) * (r0 + len), H / 2 + Math.sin(a) * (r0 + len)); c.stroke(); } c.restore();
  }
  // ---------- S3 blockchain (5–8) ----------
  const BLOCKS = Array.from({ length: 9 }, (_, i) => ({ i, x: (i - 4) * 7.2, y: Math.sin(i * 0.9) * 1.6, z: Math.cos(i * 0.7) * 3, key: [...VIDS, 'banner_hd', 'cypher', 'snakepot'][i] }));
  function chain(c, t) {
    if (t < 5.0 || t >= 8.05) return; c.fillStyle = BG; c.fillRect(0, 0, W, H);
    const d = prog(t, 5.0, 8.0), a = lerp(-0.9, 0.7, io3(d)), r = lerp(22, 18, d), cx = lerp(-14, 14, io3(d));
    setCam({ x: cx + Math.sin(a) * r, y: 4.2 - d * 1.6, z: -Math.cos(a) * r, yaw: Math.atan2(cx - (cx + Math.sin(a) * r), Math.cos(a) * r), pitch: -0.12 + d * 0.08, roll: Math.sin(t * 2) * 0.04, f: VY(1000, 760) });
    // grid floor
    c.save(); c.beginPath(); for (let k = -20; k <= 20; k++) { line3(c, [k * 4, -6, -60], [k * 4, -6, 60]); line3(c, [-80, -6, k * 3], [80, -6, k * 3]); } c.strokeStyle = 'rgba(255,0,51,0.12)'; c.lineWidth = 1; c.stroke(); c.restore();
    // links
    c.beginPath(); for (let i = 0; i < BLOCKS.length - 1; i++) { const p = BLOCKS[i], q = BLOCKS[i + 1]; line3(c, [p.x, p.y, p.z], [q.x, q.y, q.z]); } glowStroke(c, RED, 3, 0.9);
    // data packets racing along the links
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < BLOCKS.length - 1; i++) { const p = BLOCKS[i], q = BLOCKS[i + 1], u = (t * 1.6 + i * 0.37) % 1, s = P(lerp(p.x, q.x, u), lerp(p.y, q.y, u), lerp(p.z, q.z, u)); if (!s) continue; const g = c.createRadialGradient(s[0], s[1], 0, s[0], s[1], 30); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.3, rgba(CY, 0.6)); g.addColorStop(1, rgba(CY, 0)); c.fillStyle = g; c.fillRect(s[0] - 30, s[1] - 30, 60, 60); } c.restore();
    const order = BLOCKS.map((b) => { const p = P(b.x, b.y, b.z); return [p ? p[2] : -1, b]; }).filter((q) => q[0] > 0).sort((p, q) => q[0] - p[0]);
    for (const [, b] of order) { const ap = crit(prog(t, 5.0 + b.i * 0.08, 5.45 + b.i * 0.08)); if (ap > 0) cube(c, b, 1.9 * ap, t); }
    // hashes
    c.save(); for (let i = 0; i < 14; i++) { const p = P(-30 + hash(i, 1) * 60, -3 + hash(i, 2) * 10, -10 + hash(i, 3) * 20); if (!p) continue; c.globalAlpha = 0.35 * clamp(1 - p[2] / 60); txt(c, '0x' + Math.floor(hash(i, 4) * 1e12).toString(16).slice(0, 8) + '…', p[0], p[1], M(600, clamp(900 / p[2], 10, 34)), i % 3 ? '#8A8A96' : RED); } c.restore();
    const k = crit(prog(t, 5.5, 5.8)); if (k > 0) { c.save(); c.globalAlpha = 1 - ease(t, 7.75, 8.0); slam(c, 'SHOWING YOU', W / 2, VY(190, 400), 90, k, '#fff', 0.5); slam(c, 'THE LATEST PROJECTS', W / 2, VY(300, 510), 120, crit(prog(t, 5.75, 6.05)), '#fff', 0.6);
      const n = Math.floor(lerp(0, 121, ease(t, 6.3, 7.4))); c.save(); c.globalAlpha *= A(t, 6.3, 0.3); txt(c, V ? `${n} VIDEOS  ·  ON-CHAIN` : `${n} VIDEOS  ·  ON-CHAIN, ON-CAMERA`, W / 2, VY(1000, 1520), M(700, 34), RED, 'center', 'middle', 6); c.restore(); c.restore(); }
  }
  function cube(c, b, s, t) {
    const ry = t * 0.8 + b.i, cr = Math.cos(ry), sr = Math.sin(ry), V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([a, bb, d]) => [b.x + (a * cr + d * sr) * s, b.y + bb * s, b.z + (-a * sr + d * cr) * s]);
    const faces = [[3, 2, 0], [6, 7, 5], [7, 3, 4], [2, 6, 1], [7, 6, 3], [0, 1, 4]].map((f, i) => { const [tl, tr, bl] = f.map((j) => V[j]); const cz = (tl[2] + tr[2] + bl[2]) / 3, n = [(tr[1] - tl[1]) * (bl[2] - tl[2]) - (tr[2] - tl[2]) * (bl[1] - tl[1]), (tr[2] - tl[2]) * (bl[0] - tl[0]) - (tr[0] - tl[0]) * (bl[2] - tl[2]), (tr[0] - tl[0]) * (bl[1] - tl[1]) - (tr[1] - tl[1]) * (bl[0] - tl[0])];
      const mid = [(tr[0] + bl[0]) / 2, (tr[1] + bl[1]) / 2, (tr[2] + bl[2]) / 2], vis = n[0] * (CAM.x - mid[0]) + n[1] * (CAM.y - mid[1]) + n[2] * (CAM.z - mid[2]) > 0; return { tl, tr, bl, i, vis, cz }; });
    for (const f of faces) { if (!f.vis) continue; const br = [f.tr[0] + f.bl[0] - f.tl[0], f.tr[1] + f.bl[1] - f.tl[1], f.tr[2] + f.bl[2] - f.tl[2]], p = [f.tl, f.tr, br, f.bl].map((q) => P(...q)); if (p.some((q) => !q)) continue;
      c.beginPath(); p.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); c.fillStyle = f.i < 4 ? '#0B0B10' : '#120A10'; c.fill();
      if (f.i < 4) { c.save(); c.globalAlpha = 0.92; quadImg(c, f.i % 2 ? b.key : VIDS[(b.i + f.i) % 6], f.tl, f.tr, f.bl, 3); c.restore(); }
      c.beginPath(); p.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); glowStroke(c, b.i % 3 === 0 ? CY : RED, 2.2, 0.95); }
    const lp = P(b.x, b.y + s + 0.8, b.z); if (lp) txt(c, `BLOCK #${String(b.i * 13 + 4).padStart(3, '0')}`, lp[0], lp[1], M(700, clamp(520 / lp[2], 12, 30)), '#fff', 'center', 'middle', 2);
  }
  // ---------- S4 particles: avatar assemble → explode → @THEE_KAL_EL (8–11) ----------
  let PTS = null;
  function buildParticles() {
    const N = 74, cell = 640 / N, cnv = document.createElement('canvas'); cnv.width = cnv.height = N; const g = cnv.getContext('2d'); g.drawImage(IMG.avatar_hd, 0, 0, N, N); const d = g.getImageData(0, 0, N, N).data;
    const TWd = V ? 1000 : 1800, THd = V ? 520 : 260, tc = document.createElement('canvas'); tc.width = TWd; tc.height = THd; const tg = tc.getContext('2d'); tg.fillStyle = '#fff'; tg.font = D(V ? 230 : 210, 800); tg.textAlign = 'center'; tg.textBaseline = 'middle'; tg.letterSpacing = '-4px';
    if (V) { tg.fillText('@THEE_', TWd / 2, 135); tg.fillText('KAL_EL', TWd / 2, 385); } else tg.fillText('@THEE_KAL_EL', 900, 140);
    const td = tg.getImageData(0, 0, TWd, THd).data, targ = []; for (let y = 0; y < THd; y += 7) for (let x = 0; x < TWd; x += 7) if (td[(y * TWd + x) * 4 + 3] > 128) targ.push([(W - TWd) / 2 + x, H / 2 - THd / 2 + y]);
    PTS = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = (y * N + x) * 4, j = PTS.length; PTS.push({ hx: W / 2 - 320 + x * cell, hy: H / 2 - 320 + y * cell, col: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`, cell, a: hash(j, 1) * TAU, v: 0.4 + hash(j, 2), tz: targ[(j * 7919) % targ.length], dl: hash(j, 3) }); }
  }
  function particles(c, t) {
    if (t < 8.0 || t >= 11.05) return; c.fillStyle = BG; c.fillRect(0, 0, W, H); if (!PTS) buildParticles();
    const rg = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 700); rg.addColorStop(0, 'rgba(255,0,51,0.22)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    const ex = prog(t, 9.5, 10.05), re = prog(t, 10.0, 10.75), red = ease(t, 10.0, 10.6);
    for (const p of PTS) {
      const ak = io5(clamp((t - 8.0 - p.dl * 0.5) / 0.55)), sx = p.hx + Math.cos(p.a) * 1400 * p.v, sy = p.hy + Math.sin(p.a) * 900 * p.v;
      let x = lerp(sx, p.hx, ak), y = lerp(sy, p.hy, ak);
      if (t > 9.5) { const e = io3(ex) * (1 - io5(clamp((re - p.dl * 0.35) / 0.65))), dx = p.hx - W / 2, dy = p.hy - H / 2, dl = Math.hypot(dx, dy) + 1; const ox = x + (dx / dl) * 700 * p.v * e + Math.sin(p.a * 3 + t * 6) * 60 * e, oy = y + (dy / dl) * 700 * p.v * e + Math.cos(p.a * 2 + t * 5) * 60 * e;
        const k = io5(clamp((re - p.dl * 0.35) / 0.65)); x = lerp(ox, p.tz[0], k); y = lerp(oy, p.tz[1], k); }
      const sz = t > 10.0 ? lerp(p.cell, 6, red) : p.cell; c.fillStyle = t > 10.2 ? (hash(p.dl * 1e4 | 0, 9) < 0.15 ? RED : '#fff') : p.col; if (t > 10.0 && t < 10.2) c.fillStyle = p.col; c.fillRect(x - sz / 2, y - sz / 2, sz + 0.6, sz + 0.6);
    }
    if (t > 8.6 && t < 9.5) { const gl = Math.floor(t * 20) % 5 === 0; if (gl) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4; c.drawImage(cv, -16, 0); c.restore(); } txt(c, 'MEET YOUR GUIDE TO WEB3', W / 2, VY(960, 1360), M(700, VY(34, 30)), '#fff', 'center', 'middle', 8); }
    if (t > 10.75) { const k = pulse(t, 10.75, 6); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * k; c.fillStyle = RED; c.fillRect(0, H / 2 - VY(160, 300), W, VY(320, 600)); c.restore(); }
  }
  // ---------- S5 montage (11–13) ----------
  const MONT = [['PLAY', 'short_playabull'], ['EARN', 'short_dapps'], ['OWN', 'short_vibes'], ['BUILD', 'short_bumper'], ['TRADE', 'cypher'], ['MINT', 'short_onepiece'], ['LEARN', 'protonmail'], ['WIN', 'snakepot']];
  function montage(c, t) {
    if (t < 11.0 || t >= 13.0) return; const i = Math.min(7, Math.floor((t - 11.0) / 0.25)), lt = t - 11.0 - i * 0.25, [w, key] = MONT[i];
    c.fillStyle = BG; c.fillRect(0, 0, W, H); const z = 1.15 - lt * 0.5; c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.rotate((i % 2 ? 1 : -1) * 0.02); c.translate(-W / 2, -H / 2); cover(c, key, 0, 0, W, H); c.restore();
    c.save(); c.globalCompositeOperation = 'color'; c.fillStyle = i % 2 ? '#FF0033' : '#1A1A22'; c.fillRect(0, 0, W, H); c.restore(); c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, W, H);
    slam(c, w, W / 2, H / 2, lerp(420, 340, crit(prog(lt, 0, 0.1))), crit(prog(lt, 0, 0.1)));
    txt(c, `0${i + 1} / 08`, 90, 90, M(700, 26), '#fff', 'left', 'middle', 4);
  }
  // ---------- S6 lockup (13–15) ----------
  function lockup(c, t) {
    if (t < 13.0) return; c.fillStyle = BG; c.fillRect(0, 0, W, H);
    const rg = c.createRadialGradient(W / 2, H / 2 - 60, 0, W / 2, H / 2, 900); rg.addColorStop(0, 'rgba(255,0,51,0.28)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    // rotating rays
    c.save(); c.translate(W / 2, VY(330, 640)); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i++) { c.rotate(TAU / 16); c.fillStyle = 'rgba(255,0,51,0.05)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(1400, -90); c.lineTo(1400, 90); c.closePath(); c.fill(); } c.restore();
    const ak = crit(prog(t, 13.0, 13.3)); c.save(); c.translate(W / 2, VY(330, 640)); c.scale(lerp(2.4, 1, ak) * VY(1, 1.2), lerp(2.4, 1, ak) * VY(1, 1.2)); c.rotate((t - 13) * 0.0);
    c.save(); c.shadowColor = RED; c.shadowBlur = 60; c.beginPath(); c.arc(0, 0, 160, 0, TAU); c.fillStyle = RED; c.fill(); c.restore();
    c.save(); c.beginPath(); c.arc(0, 0, 150, 0, TAU); c.clip(); if (IMG.avatar_hd) c.drawImage(IMG.avatar_hd, -150, -150, 300, 300); c.restore();
    c.lineWidth = 6; c.strokeStyle = CY; c.globalAlpha = 0.8; for (let k = 0; k < 3; k++) { const a0 = t * 2 + k * TAU / 3; c.beginPath(); c.arc(0, 0, 186, a0, a0 + 1.2); c.stroke(); } c.restore();
    // chrome title
    const tk = crit(prog(t, 13.25, 13.5)); if (tk > 0) { c.save(); c.translate(W / 2, VY(640, 1030)); c.scale(lerp(1.5, 1, tk) * VY(1, 0.72), lerp(1.5, 1, tk) * VY(1, 0.72)); c.font = D(170, 800); c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '-5px';
      const g = c.createLinearGradient(0, -85, 0, 85); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, '#C9CBD6'); g.addColorStop(0.5, '#5A5C68'); g.addColorStop(0.62, '#E9EAF0'); g.addColorStop(1, '#8E909C');
      c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(RED, 0.8); c.fillText('THEE_KAL_EL', -10 * (1 - tk) - 4, 0); c.fillStyle = rgba(CY, 0.6); c.fillText('THEE_KAL_EL', 10 * (1 - tk) + 4, 0); c.globalCompositeOperation = 'source-over';
      c.lineWidth = 8; c.strokeStyle = '#000'; c.strokeText('THEE_KAL_EL', 0, 0); c.fillStyle = g; c.fillText('THEE_KAL_EL', 0, 0);
      const sh = ((t - 13.3) * 1.2) % 1.6; c.save(); c.globalCompositeOperation = 'source-atop'; const sg = c.createLinearGradient(-900 + sh * 1400, 0, -700 + sh * 1400, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.9)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sg; c.fillText('THEE_KAL_EL', 0, 0); c.restore(); c.restore(); }
    const sk = A(t, 13.55, 0.3); if (sk > 0) { c.save(); c.globalAlpha = sk; txt(c, 'BLOCKCHAIN  ·  WEB3  ·  CRYPTO  ·  GAMING', W / 2, VY(760, 1140), M(700, VY(30, 22)), '#B9B9C6', 'center', 'middle', VY(8, 3)); c.restore(); }
    const bk = pop(prog(t, 13.75, 14.1)); if (bk > 0) { const p = 1 + 0.06 * pulse(t, Math.floor(t * 2) / 2, 9); c.save(); c.translate(W / 2, VY(880, 1290)); c.scale(bk * p, bk * p); c.shadowColor = RED; c.shadowBlur = 50; rr(c, -260, -52, 520, 104, 52); c.fillStyle = RED; c.fill(); c.shadowBlur = 0;
      c.fillStyle = '#fff'; rr(c, -205, -18, 50, 36, 10); c.fill(); c.fillStyle = RED; c.beginPath(); c.moveTo(-187, -9); c.lineTo(-169, 0); c.lineTo(-187, 9); c.closePath(); c.fill(); txt(c, 'SUBSCRIBE', 30, 2, D(46, 800), '#fff', 'center', 'middle', 4); c.restore();
      c.save(); c.globalAlpha = bk; txt(c, 'youtube.com/@thee_kal_el', W / 2, VY(990, 1410), M(700, 28), '#8A8A96', 'center', 'middle', 3); c.restore(); }
  }

  // ---------- global finishing ----------
  const HITS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 8.0, 9.5, 10.75, 11.0, 11.25, 11.5, 11.75, 12.0, 12.25, 12.5, 12.75, 13.0, 13.25];
  let BUF = null, GRAIN = null;
  function finish(c, t) {
    let h = 0; for (const T0 of HITS) h = Math.max(h, pulse(t, T0, 14));
    if (h > 0.05) { if (!BUF) { BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; } const b = BUF.getContext('2d'); b.clearRect(0, 0, W, H); b.drawImage(cv, 0, 0); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28 * h;
      c.drawImage(BUF, -18 * h, 0); c.drawImage(BUF, 18 * h, 0); c.restore(); c.fillStyle = `rgba(255,255,255,${0.22 * h})`; c.fillRect(0, 0, W, H); }
    // glitch slices around hits and at the very end
    const gk = Math.max(pulse(t, 9.5, 8), pulse(t, 13.0, 8), ease(t, 14.55, 14.9)); if (gk > 0.15) for (let i = 0; i < 8; i++) { const y = hash(i, Math.floor(t * 60), 4) * H, hh = 10 + hash(i, 5, Math.floor(t * 60)) * 70, dx = (hash(i, 6, Math.floor(t * 60)) - 0.5) * 200 * gk; c.drawImage(cv, 0, y, W, hh, dx, y, W, hh); }
    c.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 26; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.7)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    if (t > 14.85) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }
  }
  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.filter = 'none'; c.imageSmoothingQuality = 'high';
    let sh = 0; for (const T0 of HITS) sh = Math.max(sh, pulse(t, T0, 16) * 22); const sx = (hash(Math.round(t * FPS), 3) - 0.5) * 2 * sh, sy = (hash(Math.round(t * FPS), 4) - 0.5) * 2 * sh;
    c.save(); c.translate(sx, sy); c.translate(W / 2, H / 2); c.scale(1.025, 1.025); c.translate(-W / 2, -H / 2);
    boot(c, t); tunnel(c, t); chain(c, t); particles(c, t); montage(c, t); lockup(c, t);
    c.restore(); finish(c, t);
  }
  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(D(100)), document.fonts.load(M(700, 20)), ...ASSETS.map((k) => load(k, `../assets/yt/${k}.png`))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
