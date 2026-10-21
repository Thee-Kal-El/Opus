// MOTION BG — procedural "Lines" backgrounds (original canvas implementations of eight classic line-motion styles).
// Every background is a pure function of time:  BG[name](ctx, t, W, H, pal)  — draws a full frame, loops cleanly every LOOP seconds.
// Palettes: pal = { bg, fg, accent, dim }  (see PALETTES). Works at any size/aspect (1920x1080, 1080x1920, ...).
(() => {
  const TAU = Math.PI * 2, LOOP = 8;
  const hash = (a, b = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
  const PALETTES = {
    ember: { bg: '#121212', fg: '#FF5A1F', accent: '#FFFFFF', dim: '#6E2A12', paper: '#F2EFE8' },
    kick: { bg: '#0B0D0B', fg: '#53FC18', accent: '#FFFFFF', dim: '#1E5A0C', paper: '#EAF8E4' },
    twitch: { bg: '#0E0A16', fg: '#9146FF', accent: '#FFFFFF', dim: '#3B1E6E', paper: '#F0EAFB' },
    kicktwitch: { bg: '#0B0B10', fg: '#53FC18', accent: '#9146FF', dim: '#2A2A40', paper: '#F2F2F2' },
    mono: { bg: '#0E0E0E', fg: '#F2F2F2', accent: '#FF5A1F', dim: '#3A3A3A', paper: '#F2EFE8' },
  };
  const ph = (t) => (t % LOOP) / LOOP;                 // 0..1 loop phase

  // 09 SPEED LINES — horizontal streaks racing across, a few hot white ones
  function speedLines(c, t, W, H, p) {
    c.fillStyle = p.bg; c.fillRect(0, 0, W, H);
    const n = Math.round(H / 9);
    for (let i = 0; i < n; i++) {
      const y = (i + 0.5) * H / n + (hash(i, 9) - 0.5) * 6, sp = 0.5 + hash(i, 1) * 1.5, len = W * (0.08 + hash(i, 2) * 0.35);
      for (let k = 0; k < 2; k++) {
        const x = ((ph(t) * sp * 2 + hash(i, 3 + k)) % 1) * (W + len * 2) - len, hot = hash(i, 7 + k) > 0.9;
        const g = c.createLinearGradient(x, 0, x + len, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.8, hot ? p.accent : p.fg); g.addColorStop(1, hot ? p.accent : p.fg);
        c.globalAlpha = 0.35 + hash(i, 4 + k) * 0.65; c.fillStyle = g; c.fillRect(x, y - 1.5, len, hot ? 4 : 3);
      }
    }
    c.globalAlpha = 1;
  }
  // 10 SINE STACK — stacked phase-shifted sine lines on a solid field, one highlighted wave
  function sineStack(c, t, W, H, p) {
    c.fillStyle = p.fg; c.fillRect(0, 0, W, H);
    const n = 26, gap = H / (n - 4), A = H * 0.11;
    c.lineWidth = Math.max(2, H / 360); c.lineJoin = 'round';
    for (let i = -2; i < n; i++) {
      c.beginPath();
      for (let x = 0; x <= W; x += 6) { const u = x / W; const y = i * gap + Math.sin(u * TAU * 1.3 + ph(t) * TAU + i * 0.18) * A + Math.sin(u * TAU * 0.5 - ph(t) * TAU) * A * 0.4; x ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.strokeStyle = i === Math.round(n * 0.6) ? p.paper : p.bg; c.lineWidth = i === Math.round(n * 0.6) ? Math.max(3, H / 260) : Math.max(2, H / 360); c.stroke();
    }
  }
  // 11 LINE BURST — rays from a centre dot, breathing in length and slowly rotating, on paper
  function lineBurst(c, t, W, H, p) {
    c.fillStyle = p.paper; c.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2, n = 72, rot = ph(t) * TAU / 12;
    c.strokeStyle = p.bg; c.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = rot + i / n * TAU, br = 0.5 + 0.5 * Math.sin(ph(t) * TAU + i * 0.7), r0 = Math.min(W, H) * 0.06, r1 = r0 + R * (0.25 + 0.6 * br * (i % 3 ? 0.7 : 1));
      c.lineWidth = i % 6 ? 1.6 : 3; c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.stroke();
    }
    c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, Math.min(W, H) * 0.04, 0, TAU); c.stroke();
    c.fillStyle = p.fg; c.beginPath(); c.arc(cx, cy, Math.min(W, H) * 0.018 * (1 + 0.15 * Math.sin(ph(t) * TAU * 2)), 0, TAU); c.fill();
  }
  // 12 FLOW LINES — a ribbon of many thin lines twisting through space
  function flowLines(c, t, W, H, p) {
    c.fillStyle = p.bg; c.fillRect(0, 0, W, H);
    const n = 48, A = H * 0.16; c.lineWidth = Math.max(1, H / 900);
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1) - 0.5; c.beginPath();
      for (let x = -10; x <= W + 10; x += 8) { const u = x / W; const tw = Math.sin(u * TAU * 0.9 + ph(t) * TAU); const y = H / 2 + Math.sin(u * TAU * 0.75 - ph(t) * TAU + 0.6) * A + k * H * 0.24 * tw; x > -10 ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.strokeStyle = p.fg; c.globalAlpha = 0.35 + 0.65 * (1 - Math.abs(k) * 1.6); c.stroke();
    }
    c.globalAlpha = 1;
  }
  // 13 STRIPE TWIST — vertical ribbons pinching and twisting like twisted paper strips
  function stripeTwist(c, t, W, H, p) {
    c.fillStyle = p.bg; c.fillRect(0, 0, W, H);
    const n = 11, w = W / n;
    for (let i = 0; i < n + 1; i++) {
      const x0 = i * w, cols = [p.fg, p.dim];
      for (let s = 0; s < 2; s++) {
        c.beginPath();
        for (let y = 0; y <= H; y += 6) { const tw = Math.sin(y / H * TAU * 1.5 + ph(t) * TAU + i * 0.9 + s * Math.PI) * 0.5 * w * 0.9; c.lineTo(x0 + tw, y); }
        for (let y = H; y >= 0; y -= 6) { c.lineTo(x0, y); }
        c.closePath(); c.fillStyle = cols[(i + s) % 2]; c.fill();
      }
    }
  }
  // 14 MOIRÉ — two sets of concentric rings drifting against each other
  function moire(c, t, W, H, p) {
    c.fillStyle = p.bg; c.fillRect(0, 0, W, H);
    const R = Math.hypot(W, H), sp = Math.min(W, H) / 70; c.strokeStyle = p.fg; c.lineWidth = sp * 0.45;
    const cen = [[W * 0.42 + Math.cos(ph(t) * TAU) * W * 0.06, H * 0.5 + Math.sin(ph(t) * TAU) * H * 0.06], [W * 0.58 - Math.cos(ph(t) * TAU) * W * 0.06, H * 0.5 - Math.sin(ph(t) * TAU) * H * 0.04]];
    for (const [cx, cy] of cen) for (let r = sp; r < R; r += sp) { c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); }
  }
  // 15 SCAN BARS — bold horizontal bars with a pill-shaped scan cursor sweeping through
  function scanBars(c, t, W, H, p) {
    c.fillStyle = p.bg; c.fillRect(0, 0, W, H);
    const n = 13, h = H / n;
    for (let i = 0; i < n; i++) {
      const y = i * h, thick = h * (0.28 + 0.22 * (0.5 + 0.5 * Math.sin(ph(t) * TAU + i * 0.55)));
      c.fillStyle = p.paper; c.fillRect(0, y + (h - thick) / 2, W, thick);
    }
    const sy = ((ph(t) * 2) % 1) * H, sw = W * 0.45, sx = W * 0.02 + (Math.sin(ph(t) * TAU) * 0.5 + 0.5) * (W * 0.5);
    c.fillStyle = p.bg; c.beginPath(); c.roundRect(sx, sy - h * 0.18, sw, h * 0.36, h * 0.18); c.fill();
  }
  // 16 CONTOURS — topographic contour lines of a slowly morphing height field (marching squares)
  function contours(c, t, W, H, p) {
    c.fillStyle = p.bg; c.fillRect(0, 0, W, H);
    const cs = Math.max(8, Math.round(Math.min(W, H) / 70)), nx = Math.ceil(W / cs) + 1, ny = Math.ceil(H / cs) + 1, a = ph(t) * TAU;
    const blobs = [[0.25, 0.7, 0.3], [0.55, 0.35, 0.35], [0.85, 0.6, 0.25], [0.15, 0.25, 0.2], [0.7, 0.85, 0.22]];
    const f = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = i * cs / W, y = j * cs / H; let v = 0;
      blobs.forEach(([bx, by, r], k) => { const dx = (x - bx - Math.cos(a + k) * 0.03) * W / H, dy = y - by - Math.sin(a + k * 1.7) * 0.03; v += Math.exp(-(dx * dx + dy * dy) / (r * r * 0.35)); });
      f[j * nx + i] = v + 0.08 * Math.sin(x * 9 + a) * Math.cos(y * 7 - a);
    }
    c.strokeStyle = p.fg; c.lineWidth = Math.max(1, Math.min(W, H) / 700);
    for (let L = 0.08; L < 1.6; L += 0.08) {
      c.globalAlpha = 0.45 + 0.55 * Math.min(1, L); c.beginPath();
      for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const v0 = f[j * nx + i], v1 = f[j * nx + i + 1], v2 = f[(j + 1) * nx + i + 1], v3 = f[(j + 1) * nx + i];
        const idx = (v0 > L) | ((v1 > L) << 1) | ((v2 > L) << 2) | ((v3 > L) << 3); if (idx === 0 || idx === 15) continue;
        const x = i * cs, y = j * cs, lp = (a, b) => (L - a) / (b - a);
        const e = [[x + cs * lp(v0, v1), y], [x + cs, y + cs * lp(v1, v2)], [x + cs * lp(v3, v2), y + cs], [x, y + cs * lp(v0, v3)]];
        const seg = { 1: [3, 0], 2: [0, 1], 3: [3, 1], 4: [1, 2], 5: [3, 2, 1, 0], 6: [0, 2], 7: [3, 2], 8: [2, 3], 9: [0, 2], 10: [0, 3, 1, 2], 11: [1, 2], 12: [1, 3], 13: [0, 1], 14: [3, 0] }[idx];
        for (let s = 0; s < seg.length; s += 2) { c.moveTo(...e[seg[s]]); c.lineTo(...e[seg[s + 1]]); }
      }
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  const LIST = [['09', 'Speed Lines', 'speedLines', speedLines], ['10', 'Sine Stack', 'sineStack', sineStack], ['11', 'Line Burst', 'lineBurst', lineBurst], ['12', 'Flow Lines', 'flowLines', flowLines],
    ['13', 'Stripe Twist', 'stripeTwist', stripeTwist], ['14', 'Moiré', 'moire', moire], ['15', 'Scan Bars', 'scanBars', scanBars], ['16', 'Contours', 'contours', contours]];
  const BG = Object.fromEntries(LIST.map(([, , k, f]) => [k, f]));
  (typeof window !== 'undefined' ? window : globalThis).MOTIONBG = { BG, LIST, PALETTES, LOOP };
})();
