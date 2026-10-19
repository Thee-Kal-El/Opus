// BLOCKCHAIN 101 — Episode 01: "The Decentralized Future". 180s, 1920x1080 @ 60fps, cut to a 120 BPM dark phonk score (bar = 2s).
// 0 boot terminal · 6 title drop · 12 what is a blockchain · 30 history (2008→today) · 74 the fields (DeFi, DeSci, DePIN…) ·
// 122 power to the people · 146 careers · 168 outro. Cyberpunk look: neon skyline, moving grid floor, HUD, glitch cuts.
// renderAt(t) is a pure function of t, so any frame can be rendered in any order.
(() => {
  'use strict';
  const W = 1920, H = 1080, FPS = 60, DUR = 180, TAU = Math.PI * 2;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const BG = '#05040D', CY = '#00F0FF', MG = '#FF2BD6', YL = '#F5FF3B', VIO = '#9B6BFF', WH = '#EAF6FF', RED = '#FF3355', OR = '#F7931A', GRN = '#3DFF9A', BLU = '#3D8BFF', DIM = '#8C93B8';
  const D = (s) => `900 ${s}px Geist, "Inter Tight", sans-serif`, G = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`, MONO = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k, prog = (t, a, b) => clamp((t - a) / (b - a));
  const io3 = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2), o3 = (p) => 1 - Math.pow(1 - p, 3), o5 = (p) => 1 - Math.pow(1 - p, 5);
  const pop = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const z = 0.5, w = 13, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * p) * (Math.cos(wd * p) + z / Math.sqrt(1 - z * z) * Math.sin(wd * p)); };
  const pulse = (t, T, k = 10) => (t >= T ? Math.exp(-(t - T) * k) : 0);
  const hash = (a, b = 0, c = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  const tw = (c, s, font, ls = 0) => { c.font = font; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.letterSpacing = '0px'; return w; };
  function wrap(c, s, font, maxW) { c.font = font; const out = []; let line = ''; for (const w of s.split(' ')) { const tst = line ? line + ' ' + w : w; if (c.measureText(tst).width > maxW && line) { out.push(line); line = w; } else line = tst; } if (line) out.push(line); return out; }
  // scrambled reveal: characters resolve left→right, the rest flicker through glyphs
  const GL = '01#$%&@<>/\\[]{}=+*^?ABCDEFXYZ';
  function scr(s, p, t, salt = 0) { if (p >= 1) return s; let o = ''; const n = s.length, f = Math.floor(t * 30); for (let i = 0; i < n; i++) { const ch = s[i]; o += (i / n < p || ch === ' ') ? ch : GL[(hash(i, f, salt) * GL.length) | 0]; } return o; }
  // glowing neon text with chromatic split on entry
  function neon(c, s, x, y, font, col, align = 'left', glow = 1, split = 0, ls = 0) {
    c.save(); c.font = font; c.textAlign = align; c.textBaseline = 'middle'; c.letterSpacing = ls + 'px';
    if (split > 0.01) { c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(MG, 0.7); c.fillText(s, x - 10 * split, y); c.fillStyle = rgba(CY, 0.7); c.fillText(s, x + 10 * split, y); c.globalCompositeOperation = 'source-over'; }
    c.shadowColor = col; c.shadowBlur = 28 * glow; c.fillStyle = col; c.fillText(s, x, y); c.shadowBlur = 0; c.fillText(s, x, y); c.restore();
  }
  // condensed display headline, auto-fit
  function head(c, s, x, y, size, col, maxW, align = 'center', glow = 1, split = 0) {
    c.save(); c.font = D(size); c.letterSpacing = '-3px'; const w = c.measureText(s).width * 0.84, k = Math.min(1, maxW / w); c.translate(x, y); c.scale(0.84 * k, k); c.letterSpacing = '0px';
    neon(c, s, 0, 0, D(size), col, align, glow, split / k, -3); c.restore();
  }

  // ---------------- coins / icons ----------------
  function coin(c, x, y, r, col, draw, k = 1) { if (k <= 0) return; c.save(); c.translate(x, y); c.scale(k, k); c.shadowColor = col; c.shadowBlur = r * 0.8; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = col; c.fill(); c.shadowBlur = 0; c.lineWidth = r * 0.08; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke(); draw(r); c.restore(); }
  const BTC = (c, x, y, r, k) => coin(c, x, y, r, OR, (r) => txt(c, '₿', 0, r * 0.06, G(900, r * 1.3), '#fff', 'center'), k);
  const ETH = (c, x, y, r, k) => coin(c, x, y, r, '#627EEA', (r) => { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -r * 0.62); c.lineTo(r * 0.38, r * 0.02); c.lineTo(0, r * 0.22); c.lineTo(-r * 0.38, r * 0.02); c.closePath(); c.fill(); c.globalAlpha = 0.75; c.beginPath(); c.moveTo(0, r * 0.32); c.lineTo(r * 0.38, r * 0.1); c.lineTo(0, r * 0.62); c.lineTo(-r * 0.38, r * 0.1); c.closePath(); c.fill(); }, k);
  const SOL = (c, x, y, r, k) => coin(c, x, y, r, '#111', (r) => { const g = c.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, '#9945FF'); g.addColorStop(1, '#14F195'); c.fillStyle = g; [-0.36, 0, 0.36].forEach((dy, i) => { c.save(); c.translate(0, dy * r); c.beginPath(); const w = r * 1.1, h = r * 0.2, sk = r * 0.18 * (i === 1 ? -1 : 1); c.moveTo(-w / 2 + sk, -h / 2); c.lineTo(w / 2 + sk, -h / 2); c.lineTo(w / 2 - sk, h / 2); c.lineTo(-w / 2 - sk, h / 2); c.closePath(); c.fill(); c.restore(); }); }, k);
  // line icons (drawn in a 200x200 box centred on 0,0)
  const ICON = {
    doc: (c) => { c.strokeRect(-55, -75, 110, 150); for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-35, -45 + i * 22); c.lineTo(i === 4 ? 0 : 35, -45 + i * 22); c.stroke(); } },
    pizza: (c) => { c.beginPath(); c.moveTo(0, 75); c.lineTo(-65, -55); c.quadraticCurveTo(0, -85, 65, -55); c.closePath(); c.stroke(); [[-15, -30], [18, -20], [0, 15]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 10, 0, TAU); c.stroke(); }); },
    merge: (c) => { c.beginPath(); c.moveTo(-60, -70); c.quadraticCurveTo(-60, 0, 0, 10); c.moveTo(60, -70); c.quadraticCurveTo(60, 0, 0, 10); c.lineTo(0, 75); c.stroke(); c.beginPath(); c.moveTo(-18, 52); c.lineTo(0, 75); c.lineTo(18, 52); c.stroke(); },
    bank: (c) => { c.beginPath(); c.moveTo(-75, -30); c.lineTo(0, -75); c.lineTo(75, -30); c.closePath(); c.stroke(); for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-54 + i * 36, -15); c.lineTo(-54 + i * 36, 50); c.stroke(); } c.strokeRect(-80, 55, 160, 18); },
    pin: (c) => { c.beginPath(); c.arc(0, -25, 45, Math.PI * 0.85, Math.PI * 2.15); c.lineTo(0, 75); c.closePath(); c.stroke(); c.beginPath(); c.arc(0, -25, 16, 0, TAU); c.stroke(); },
    swap: (c) => { c.beginPath(); c.moveTo(-60, -25); c.lineTo(60, -25); c.lineTo(35, -50); c.moveTo(60, 25); c.lineTo(-60, 25); c.lineTo(-35, 50); c.stroke(); },
    flask: (c) => { c.beginPath(); c.moveTo(-20, -75); c.lineTo(-20, -15); c.lineTo(-65, 70); c.lineTo(65, 70); c.lineTo(20, -15); c.lineTo(20, -75); c.moveTo(-32, -75); c.lineTo(32, -75); c.stroke(); c.beginPath(); c.moveTo(-45, 35); c.lineTo(45, 35); c.stroke(); },
    tower: (c) => { c.beginPath(); c.moveTo(0, -20); c.lineTo(-40, 75); c.moveTo(0, -20); c.lineTo(40, 75); c.moveTo(-26, 40); c.lineTo(26, 40); c.stroke(); c.beginPath(); c.arc(0, -25, 9, 0, TAU); c.fill(); [36, 62].forEach((r) => { c.beginPath(); c.arc(0, -25, r, -0.7 - Math.PI / 2 + Math.PI / 2 - 0.5, -0.5 + 0.3); c.stroke(); c.beginPath(); c.arc(0, -25, r, Math.PI - 0.3 + 0.5 - 0.5, Math.PI + 0.7); c.stroke(); }); },
    frame: (c) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI / 2; c.lineTo(Math.cos(a) * 78, Math.sin(a) * 78); } c.closePath(); c.stroke(); c.beginPath(); c.moveTo(-40, 30); c.lineTo(-10, -5); c.lineTo(10, 15); c.lineTo(25, 0); c.lineTo(45, 30); c.stroke(); c.beginPath(); c.arc(-20, -30, 10, 0, TAU); c.stroke(); },
    vote: (c) => { c.strokeRect(-60, -5, 120, 75); c.beginPath(); c.moveTo(-30, -5); c.lineTo(-30, -60); c.lineTo(30, -60); c.lineTo(30, -5); c.stroke(); c.beginPath(); c.moveTo(-15, -35); c.lineTo(-3, -22); c.lineTo(18, -48); c.stroke(); },
    house: (c) => { c.beginPath(); c.moveTo(-70, -5); c.lineTo(0, -70); c.lineTo(70, -5); c.moveTo(-52, -20); c.lineTo(-52, 70); c.lineTo(52, 70); c.lineTo(52, -20); c.stroke(); c.beginPath(); c.arc(0, 25, 24, 0, TAU); c.stroke(); txt(c, '$', 0, 27, G(900, 32), c.strokeStyle, 'center'); },
    dollar: (c) => { c.beginPath(); c.arc(0, 0, 72, 0, TAU); c.stroke(); txt(c, '$', 0, 6, G(900, 100), c.strokeStyle, 'center'); },
    pad: (c) => { rr(c, -80, -40, 160, 85, 40); c.stroke(); c.beginPath(); c.moveTo(-45, 2); c.lineTo(-15, 2); c.moveTo(-30, -13); c.lineTo(-30, 17); c.stroke(); [[30, -8], [48, 10]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill(); }); },
  };
  function icon(c, k, x, y, s, col, lw = 9) { c.save(); c.translate(x, y); c.scale(s / 200, s / 200); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.shadowColor = col; c.shadowBlur = 24; ICON[k](c); c.restore(); }

  // ---------------- world: skyline, grid floor, data rain ----------------
  const SKY = []; for (let i = 0, x = -40; x < W + 80; i++) { const w = 50 + hash(i, 1) * 110, h = 90 + Math.pow(hash(i, 2), 1.6) * 330; SKY.push([x, w, h, i]); x += w + 6; }
  function world(c, t, acc = CY, acc2 = MG, alarm = 0) {
    let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, alarm ? '#14030A' : '#06041A'); g.addColorStop(0.62, alarm ? '#2A0612' : '#1A0A38'); g.addColorStop(1, BG); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const hz = 700;
    // horizon sun-glow
    g = c.createRadialGradient(W / 2, hz, 0, W / 2, hz, 900); g.addColorStop(0, rgba(alarm ? RED : acc2, 0.38)); g.addColorStop(0.5, rgba(alarm ? RED : VIO, 0.12)); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // data rain (far layer)
    c.save(); c.font = MONO(700, 20); c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < 48; i++) { const x = 20 + i * 40, sp = 30 + hash(i, 7) * 80; for (let j = 0; j < 20; j++) { const v = hash(i, j); if (v < 0.55) continue; const y = (j * 36 + t * sp) % 720; c.fillStyle = rgba(acc, 0.03 + 0.08 * hash(j, i)); c.fillText(GL[(hash(i, j, Math.floor(t * 3 + i)) * GL.length) | 0], x, y); } }
    c.restore();
    // skyline (parallax drift) with lit windows
    c.save(); const off = (t * 6) % 200;
    for (const [x0, w, h, i] of SKY) { const x = x0 - off, y = hz - h; c.fillStyle = '#070512'; c.fillRect(x, y, w, h + 2); c.fillStyle = rgba(acc, 0.35); c.fillRect(x, y, w, 2);
      for (let wy = y + 14; wy < hz - 10; wy += 18) for (let wx = x + 8; wx < x + w - 8; wx += 14) { const v = hash(i, wx | 0, wy | 0); if (v < 0.8) continue; c.fillStyle = v > 0.95 ? rgba(acc2, 0.7) : rgba(acc, 0.35 + 0.3 * Math.sin(t * 2 + v * 40) ** 2); c.fillRect(wx, wy, 5, 7); }
      if (hash(i, 9) > 0.8) { c.fillStyle = (Math.floor(t * 2 + i) % 2) ? RED : 'rgba(255,51,85,0.25)'; c.fillRect(x + w / 2 - 3, y - 14, 6, 6); } }
    c.restore();
    // grid floor
    c.save(); c.beginPath(); c.rect(0, hz, W, H - hz); c.clip(); g = c.createLinearGradient(0, hz, 0, H); g.addColorStop(0, '#0B0620'); g.addColorStop(1, '#020108'); c.fillStyle = g; c.fillRect(0, hz, W, H - hz);
    c.strokeStyle = rgba(alarm ? RED : acc2, 0.5); c.lineWidth = 2; c.shadowColor = alarm ? RED : acc2; c.shadowBlur = 8;
    for (let i = -30; i <= 30; i++) { c.beginPath(); c.moveTo(W / 2 + i * 26, hz); c.lineTo(W / 2 + i * 260, H); c.stroke(); }
    const sc = (t * 0.6) % 1; for (let k = 0; k < 14; k++) { const z = (k + sc) / 14, y = hz + (H - hz) * Math.pow(z, 2.4); c.globalAlpha = clamp(z * 2); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } c.restore();
    c.fillStyle = rgba(acc, 0.8); c.fillRect(0, hz - 1, W, 2);
  }

  // ---------------- HUD ----------------
  const SECTIONS = [[0, 'BOOT'], [6, 'INTRO'], [12, '01 · WHAT IS IT'], [30, '02 · HISTORY'], [74, '03 · THE FIELDS'], [122, '04 · POWER'], [146, '05 · CAREERS'], [168, 'OUTRO']];
  const CUTS = SECTIONS.slice(1).map((s) => s[0]);
  function hud(c, t) {
    const a = clamp((t - 0.3) * 2); if (a <= 0) return; c.save(); c.globalAlpha = a * 0.9;
    c.strokeStyle = rgba(CY, 0.8); c.lineWidth = 3; const m = 34, L = 60;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, dx, dy]) => { c.beginPath(); c.moveTo(x + dx * L, y); c.lineTo(x, y); c.lineTo(x, y + dy * L); c.stroke(); });
    txt(c, 'BLOCKCHAIN 101 // EP.01', 70, 62, MONO(700, 20), rgba(CY, 0.85), 'left', 'middle', 3);
    const sec = SECTIONS.filter((s) => t >= s[0]).pop()[1]; txt(c, sec, W / 2, 62, MONO(700, 20), rgba(WH, 0.7), 'center', 'middle', 4);
    const mm = Math.floor(t / 60), ss = Math.floor(t % 60), fr = Math.floor((t % 1) * 60);
    c.fillStyle = (Math.floor(t * 1.5) % 2) ? RED : rgba(RED, 0.3); c.beginPath(); c.arc(W - 250, 62, 8, 0, TAU); c.fill();
    txt(c, `REC ${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(fr).padStart(2, '0')}`, W - 232, 62, MONO(700, 20), rgba(WH, 0.85), 'left', 'middle', 2);
    // progress bar with chapter ticks
    const px = 70, pw = W - 140, py = H - 58; c.fillStyle = rgba(WH, 0.15); c.fillRect(px, py, pw, 4); const gg = c.createLinearGradient(px, 0, px + pw, 0); gg.addColorStop(0, CY); gg.addColorStop(1, MG); c.fillStyle = gg; c.fillRect(px, py, pw * t / DUR, 4);
    CUTS.forEach((T) => { c.fillStyle = t >= T ? WH : rgba(WH, 0.35); c.fillRect(px + pw * T / DUR - 1, py - 6, 3, 16); });
    c.restore();
  }

  // ---------------- reusable pieces ----------------
  // section opener: big scrambled title centred, then it docks top-left for the rest of the section
  function opener(c, t, T, num, title, sub, col) {
    if (t < T) return; const k = prog(t, T, T + 0.5), dock = io3(prog(t, T + 1.7, T + 2.2));
    const x = lerp(W / 2, 110, dock), y = lerp(H / 2 - 20, 150, dock), s = lerp(1, 0.42, dock), align = dock > 0.5 ? 'left' : 'center';
    c.save(); c.translate(x, y); c.scale(s, s);
    const ox = align === 'left' ? 0 : 0; txt(c, `// ${num}`, ox, -140, MONO(800, 46), col, align, 'middle', 8);
    head(c, scr(title, prog(t, T, T + 0.6), t, num.length), ox, 0, 200, WH, 2600, align, 1, pulse(t, T, 6));
    if (sub) { c.globalAlpha = clamp(prog(t, T + 0.4, T + 0.8) - dock * 2); if (c.globalAlpha > 0) txt(c, sub, ox, 135, G(600, 44), DIM, align, 'middle', 2); }
    c.restore();
    if (dock < 0.5) { const bw = 900 * o5(k) * (1 - dock * 2); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 20; c.fillRect(W / 2 - bw / 2, H / 2 + 75, bw, 6); c.shadowBlur = 0; }
  }
  // bullet: diamond marker, wipe-in, scrambled text
  function bullet(c, t, T, x, y, s, col, size = 46, maxW = 760) {
    if (t < T) return 0; const k = o5(prog(t, T, T + 0.45)), lines = wrap(c, s, G(800, size), maxW);
    c.save(); c.globalAlpha = clamp(k * 1.5); c.translate((1 - k) * -60, 0);
    c.save(); c.translate(x + 14, y); c.rotate(Math.PI / 4); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 18; c.fillRect(-10, -10, 20, 20); c.restore();
    lines.forEach((ln, i) => neon(c, scr(ln, prog(t, T + i * 0.1, T + 0.5 + i * 0.1), t, i + 7), x + 50, y + i * size * 1.22, G(800, size), WH, 'left', 0.25, pulse(t, T, 8)));
    c.restore(); return lines.length;
  }
  function panel(c, x, y, w, h, col, a = 1) { c.save(); c.globalAlpha = a; rr(c, x, y, w, h, 18); c.fillStyle = 'rgba(8,6,24,0.78)'; c.fill(); c.lineWidth = 2; c.strokeStyle = rgba(col, 0.6); c.stroke(); c.fillStyle = col; c.fillRect(x + 24, y, 90, 4); c.restore(); }

  // ---------------- S0: boot + title (0–12) ----------------
  const BOOT = ['> boot decentralized_os v1.0', '> connecting to peers ......... OK', '> syncing blocks ............. OK', '> verifying hashes ........... OK', '> trusted third party ........ NOT REQUIRED'];
  function boot(c, t) {
    if (t >= 6.2) return; c.fillStyle = '#020104'; c.fillRect(0, 0, W, H);
    BOOT.forEach((ln, i) => { const T0 = 0.4 + i * 0.75, n = Math.floor(clamp((t - T0) / 0.5) * ln.length); if (n <= 0) return; const s = ln.slice(0, n), last = i === BOOT.length - 1;
      txt(c, s, 220, 330 + i * 70, MONO(700, 38), last && n === ln.length ? YL : (s.endsWith('OK') ? GRN : CY), 'left', 'middle', 1); });
    if (Math.floor(t * 3) % 2 && t < 4.4) { const i = clamp(Math.floor((t - 0.4) / 0.75), 0, 4), ln = BOOT[i], n = Math.floor(clamp((t - 0.4 - i * 0.75) / 0.5) * ln.length); c.fillStyle = CY; c.fillRect(220 + tw(c, ln.slice(0, n), MONO(700, 38), 1) + 6, 310 + i * 70, 20, 40); }
    // hash storm before the drop
    if (t > 4.4) { const k = prog(t, 4.4, 6); c.save(); c.font = MONO(700, 30); c.textAlign = 'center'; for (let i = 0; i < 160 * k; i++) { c.fillStyle = rgba(hash(i, 3) > 0.5 ? CY : MG, 0.2 + 0.6 * k); c.fillText('0x' + Math.floor(hash(i, Math.floor(t * 20)) * 0xffffff).toString(16).padStart(6, '0'), hash(i, 1) * W, hash(i, 2) * H); } c.restore(); }
    if (t > 5.85) { c.fillStyle = `rgba(255,255,255,${prog(t, 5.85, 6.0)})`; c.fillRect(0, 0, W, H); }
  }
  function title(c, t) {
    if (t < 6 || t >= 12.4) return; world(c, t);
    const k = pop(prog(t, 6, 6.5)), out = io3(prog(t, 11.7, 12.2));
    c.save(); c.globalAlpha = 1 - out; c.translate(W / 2, 430); c.scale(lerp(1.6, 1, k) * (1 + out * 0.2), lerp(1.6, 1, k) * (1 + out * 0.2));
    head(c, scr('BLOCKCHAIN', prog(t, 6, 6.7), t, 1), 0, 0, 300, WH, 1500, 'center', 1.2, pulse(t, 6, 3) + pulse(t, 8, 8) + pulse(t, 10, 8));
    c.restore();
    c.save(); c.globalAlpha = 1 - out; const k2 = pop(prog(t, 6.6, 7.0)); c.translate(W / 2, 640); c.scale(k2, k2);
    rr(c, -150, -80, 300, 160, 24); c.fillStyle = MG; c.shadowColor = MG; c.shadowBlur = 60; c.fill(); c.shadowBlur = 0; head(c, '101', 0, 4, 150, '#0A0014', 260, 'center', 0); c.restore();
    c.save(); c.globalAlpha = (1 - out) * prog(t, 7.2, 7.7); txt(c, 'EPISODE 01  —  THE DECENTRALIZED FUTURE', W / 2, 800, MONO(800, 40), CY, 'center', 'middle', 6); c.restore();
    c.save(); c.globalAlpha = (1 - out) * prog(t, 8.2, 8.7); txt(c, 'with @THEE_KAL_EL', W / 2, 870, G(700, 36), DIM, 'center', 'middle', 4); c.restore();
    // orbiting coins
    [BTC, ETH, SOL].forEach((f, i) => { const kk = pop(prog(t, 8.8 + i * 0.2, 9.2 + i * 0.2)) * (1 - out); f(c, W / 2 + (i - 1) * 130, 960 + Math.sin(t * 2.4 + i) * 6, 44, kk); });
  }

  // ---------------- S1: what is a blockchain (12–30) ----------------
  function block(c, x, y, s, n, hashS, prevS, col, bad = 0) { c.save(); c.translate(x, y); const d = s * 0.3, cc = bad ? RED : col;
    c.shadowColor = cc; c.shadowBlur = 30; c.fillStyle = 'rgba(10,8,30,0.92)'; c.fillRect(-s / 2, -s / 2, s, s); c.shadowBlur = 0;
    c.fillStyle = rgba(cc, 0.25); c.beginPath(); c.moveTo(-s / 2, -s / 2); c.lineTo(-s / 2 + d, -s / 2 - d); c.lineTo(s / 2 + d, -s / 2 - d); c.lineTo(s / 2, -s / 2); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = rgba(cc, 0.12); c.beginPath(); c.moveTo(s / 2, -s / 2); c.lineTo(s / 2 + d, -s / 2 - d); c.lineTo(s / 2 + d, s / 2 - d); c.lineTo(s / 2, s / 2); c.closePath(); c.fill();
    c.strokeStyle = cc; c.lineWidth = 3; c.strokeRect(-s / 2, -s / 2, s, s); c.beginPath(); c.moveTo(-s / 2, -s / 2); c.lineTo(-s / 2 + d, -s / 2 - d); c.lineTo(s / 2 + d, -s / 2 - d); c.lineTo(s / 2 + d, s / 2 - d); c.lineTo(s / 2, s / 2); c.moveTo(s / 2, -s / 2); c.lineTo(s / 2 + d, -s / 2 - d); c.stroke();
    txt(c, `BLOCK #${n}`, -s / 2 + 14, -s / 2 + 26, MONO(800, 17), cc, 'left'); txt(c, 'prev ' + prevS, -s / 2 + 14, -2, MONO(600, 14), DIM, 'left'); txt(c, 'hash ' + hashS, -s / 2 + 14, 24, MONO(700, 14), bad ? RED : WH, 'left');
    c.fillStyle = rgba(cc, 0.5); for (let i = 0; i < 3; i++) c.fillRect(-s / 2 + 14, s / 2 - 40 + i * 10, (s - 28) * (0.4 + hash(n, i) * 0.6), 4); c.restore(); }
  const HS = ['0000a3f9', '0000c71e', '00009b2d', '0000e5a8', '00004f61'];
  function whatIs(c, t) {
    if (t < 12 || t >= 30.4) return; world(c, t); opener(c, t, 12, '01', 'WHAT IS A BLOCKCHAIN?', 'The simple version', CY);
    // chain of blocks building on the right
    const bx = 1080, by = 560, gap = 205;
    for (let i = 0; i < 4; i++) { const T0 = 14 + i * 0.75, k = pop(prog(t, T0, T0 + 0.5)); if (k <= 0) continue;
      const x = bx + (i % 2) * 0 + i * gap, y = by + (i % 2 ? 120 : -40), bad = i === 2 && t > 21.2 && t < 24.2 ? 1 : 0;
      if (i > 0) { const px = bx + (i - 1) * gap, py = by + ((i - 1) % 2 ? 120 : -40); c.save(); c.strokeStyle = bad ? RED : CY; c.lineWidth = 4; c.setLineDash([12, 10]); c.lineDashOffset = -t * 60; c.globalAlpha = k; c.beginPath(); c.moveTo(px + 80, py); c.lineTo(x - 80, y); c.stroke(); c.restore();
        const pp = ((t * 0.8 + i * 0.3) % 1); c.fillStyle = WH; c.shadowColor = CY; c.shadowBlur = 20; c.beginPath(); c.arc(lerp(px + 80, x - 80, pp), lerp(py, y, pp), 6, 0, TAU); c.fill(); c.shadowBlur = 0; }
      c.save(); c.translate(x, y); c.scale(k, k); block(c, 0, 0, 165, 1000 + i, bad ? 'ffff13a7' : HS[i + 1], HS[i], i % 2 ? MG : CY, bad); c.restore(); }
    if (t > 21.2 && t < 24.2) { const k = pop(prog(t, 21.2, 21.5)); c.save(); c.translate(bx + 2 * gap, by - 260); c.scale(k, k); rr(c, -230, -36, 460, 72, 36); c.fillStyle = RED; c.shadowColor = RED; c.shadowBlur = 40; c.fill(); c.shadowBlur = 0; txt(c, '✕ TAMPER DETECTED', 0, 2, MONO(800, 28), '#fff', 'center'); c.restore(); }
    if (t > 24.2 && t < 27) { const k = pop(prog(t, 24.2, 24.5)); c.save(); c.translate(bx + 2 * gap, by - 260); c.scale(k, k); rr(c, -220, -36, 440, 72, 36); c.fillStyle = GRN; c.shadowColor = GRN; c.shadowBlur = 40; c.fill(); c.shadowBlur = 0; txt(c, '✓ NETWORK REJECTS IT', 0, 2, MONO(800, 26), '#06140C', 'center'); c.restore(); }
    // bullets
    const B = [[14.5, 'A shared digital ledger: a record book of transactions'], [17.5, 'Copied across thousands of computers worldwide'], [20.5, 'Each block locks to the one before it, so history can’t be secretly changed'], [24.8, 'No bank. No boss. No single owner.']];
    let y = 330; B.forEach(([T0, s], i) => { const n = bullet(c, t, T0, 110, y, s, i === 3 ? YL : CY, 44, 760); y += (n || 1) * 54 + 52; });
    fade(c, t, 29.7, 30.3);
  }
  function fade(c, t, a, b) { const k = prog(t, a, b); if (k > 0) { c.fillStyle = `rgba(2,1,8,${k})`; c.fillRect(0, 0, W, H); } }

  // ---------------- S2: history (30–74) ----------------
  const HIST = [
    [2008, 'THE WHITEPAPER', 'Satoshi Nakamoto publishes “Bitcoin: A Peer-to-Peer Electronic Cash System.”', 'Oct 31, 2008, in the middle of the global financial crisis.', 'doc', OR],
    [2009, 'GENESIS BLOCK', 'Bitcoin’s very first block is mined on January 3, 2009.', 'Hidden inside: “Chancellor on brink of second bailout for banks.”', 'btc', OR],
    [2010, 'BITCOIN PIZZA DAY', '10,000 BTC buys two pizzas: the first real-world Bitcoin purchase.', 'May 22, 2010. The crypto world still celebrates it every year.', 'pizza', YL],
    [2015, 'ETHEREUM GOES LIVE', 'Proposed by a 19-year-old Vitalik Buterin in 2013, launched in 2015.', 'It added SMART CONTRACTS: programs that run on the blockchain.', 'eth', '#8FA2FF'],
    [2017, 'SOLANA IS BORN', 'Anatoly Yakovenko publishes the Solana whitepaper.', 'Proof of History: a new way to make blockchains blazing fast.', 'sol', GRN],
    [2020, 'SOLANA + DeFi SUMMER', 'Solana’s mainnet beta launches: high speed, tiny fees.', 'DeFi explodes: lending and trading with no bank in the middle.', 'swap', '#14F195'],
    [2022, 'THE MERGE', 'Ethereum switches from mining to Proof of Stake.', 'Its energy use drops by roughly 99.95%.', 'merge', '#8FA2FF'],
    [2024, 'WALL STREET ARRIVES', 'The U.S. approves spot Bitcoin ETFs.', 'Big finance is now buying in, and the tech keeps growing.', 'bank', CY],
    [2026, 'YOU ARE HERE', 'Thousands of projects. Millions of users. Still early.', 'And you’re about to understand how it all works.', 'pin', MG],
  ];
  const H0 = 32, HD = 42 / HIST.length;
  function history(c, t) {
    if (t < 30 || t >= 74.4) return; world(c, t, OR, MG); opener(c, t, 30, '02', 'THE HISTORY', 'How it all started', OR);
    if (t < H0) return; const idx = clamp(Math.floor((t - H0) / HD), 0, HIST.length - 1), T0 = H0 + idx * HD, [yr, ttl, l1, l2, ic, col] = HIST[idx];
    // timeline rail
    const ry = 265, sp = 230, cam = lerp(idx - 1, idx, o5(prog(t, T0, T0 + 0.6))) * sp;
    c.save(); c.fillStyle = rgba(WH, 0.2); c.fillRect(0, ry - 2, W, 4); const g = c.createLinearGradient(0, 0, W / 2, 0); g.addColorStop(0, rgba(CY, 0)); g.addColorStop(1, CY); c.fillStyle = g; c.fillRect(0, ry - 2, W / 2, 4);
    HIST.forEach(([y2], i) => { const x = W / 2 + i * sp - cam; if (x < -100 || x > W + 100) return; const on = i <= idx, cur = i === idx; c.beginPath(); c.arc(x, ry, cur ? 16 : 10, 0, TAU); c.fillStyle = cur ? HIST[i][5] : on ? WH : '#2A2A44'; c.shadowColor = HIST[i][5]; c.shadowBlur = cur ? 30 : 0; c.fill(); c.shadowBlur = 0; txt(c, String(y2), x, ry + 44, MONO(800, cur ? 30 : 22), cur ? WH : on ? DIM : '#3A3A5A', 'center'); });
    c.restore();
    // card
    const k = o5(prog(t, T0, T0 + 0.55)), outK = idx < HIST.length - 1 ? io3(prog(t, T0 + HD - 0.3, T0 + HD)) : 0;
    c.save(); c.globalAlpha = clamp(k * 1.4) * (1 - outK); c.translate((1 - k) * 160 - outK * 160, 0);
    panel(c, 110, 360, 1700, 560, col);
    // rolling year
    const prevYr = idx > 0 ? HIST[idx - 1][0] : yr, shown = Math.round(lerp(prevYr, yr, o3(prog(t, T0, T0 + 0.7))));
    head(c, String(shown), 180, 560, 230, col, 700, 'left', 1.2, pulse(t, T0, 6));
    txt(c, ttl, 185, 710, G(900, 64), WH, 'left', 'middle', 2);
    const r1 = wrap(c, l1, G(700, 40), 1020), r2 = wrap(c, l2, G(600, 34), 1020); let yy = 790;
    r1.forEach((ln) => { neon(c, scr(ln, prog(t, T0 + 0.3, T0 + 1.0), t, 3), 185, yy, G(700, 40), WH, 'left', 0.15); yy += 48; }); yy += 8;
    r2.forEach((ln) => { txt(c, scr(ln, prog(t, T0 + 0.6, T0 + 1.3), t, 5), 185, yy, G(600, 34), DIM, 'left'); yy += 42; });
    // icon / coin on the right
    const ik = pop(prog(t, T0 + 0.2, T0 + 0.7)), cx = 1560, cy2 = 600, bob = Math.sin(t * 2) * 10;
    if (ic === 'btc') BTC(c, cx, cy2 + bob, 150, ik); else if (ic === 'eth') ETH(c, cx, cy2 + bob, 150, ik); else if (ic === 'sol') SOL(c, cx, cy2 + bob, 150, ik);
    else { c.save(); c.translate(cx, cy2 + bob); c.scale(ik, ik); c.beginPath(); c.arc(0, 0, 160, 0, TAU); c.fillStyle = rgba(col, 0.08); c.fill(); c.lineWidth = 3; c.strokeStyle = rgba(col, 0.6); c.stroke(); icon(c, ic, 0, 0, 220, col, 10); c.restore(); }
    if (ic === 'doc' && t > T0 + 0.8) BTC(c, cx + 110, cy2 + 110 + bob, 56, pop(prog(t, T0 + 0.8, T0 + 1.2)));
    if (ic === 'swap' && t > T0 + 0.8) SOL(c, cx - 140, cy2 - 120 + bob, 50, pop(prog(t, T0 + 0.8, T0 + 1.2)));
    c.restore();
    fade(c, t, 73.7, 74.3);
  }

  // ---------------- S3: the fields (74–122) ----------------
  const FIELDS = [
    ['DeFi', 'Decentralized Finance', 'swap', CY, ['Lend, borrow & trade with no bank', 'Smart contracts replace the middleman', 'Open 24/7 to anyone with internet']],
    ['DeSci', 'Decentralized Science', 'flask', GRN, ['Communities fund research directly', 'Open, verifiable data & results', 'Scientists keep ownership of their work']],
    ['DePIN', 'Decentralized Physical Infrastructure', 'tower', YL, ['Everyday people build real-world networks', 'Earn tokens for sharing WiFi, storage, GPUs & maps', 'Examples: Helium, Filecoin, Render']],
    ['NFTs', 'Digital Ownership', 'frame', MG, ['Provable ownership of digital items', 'Art, music, tickets & game items', 'Creators can earn royalties']],
    ['DAOs', 'Decentralized Autonomous Organizations', 'vote', VIO, ['Groups run by code + community votes', 'The treasury is visible to every member', 'No CEO required']],
    ['RWA', 'Real-World Assets', 'house', OR, ['Real estate, bonds & gold: tokenized', 'Own a fraction of big-ticket assets', 'Trade them globally, any time']],
    ['STABLECOINS', 'Digital Dollars', 'dollar', BLU, ['Tokens pegged to currencies like the US dollar', 'Send money worldwide in seconds', 'Low fees. No bank hours.']],
    ['GameFi & SocialFi', 'Play, Post & Own', 'pad', RED, ['Truly own your in-game items', 'Creators own their audience', 'Your data and identity stay yours']],
  ];
  const F0 = 80, FD = 42 / FIELDS.length;
  function fields(c, t) {
    if (t < 74 || t >= 122.4) return; world(c, t, CY, VIO); opener(c, t, 74, '03', 'THE FIELDS', 'Blockchain is way more than coins', GRN);
    // 76–80: overview grid
    if (t >= 76 && t < 80.3) { const out = io3(prog(t, 79.7, 80.2));
      FIELDS.forEach(([ab, , ic, col], i) => { const k = pop(prog(t, 76.2 + i * 0.18, 76.6 + i * 0.18)); if (k <= 0) return; const cx = 300 + (i % 4) * 440, cy = 420 + Math.floor(i / 4) * 330;
        c.save(); c.globalAlpha = 1 - out; c.translate(cx, cy); c.scale(k * (1 - out * 0.3), k * (1 - out * 0.3)); c.beginPath(); for (let j = 0; j < 6; j++) { const a = j * TAU / 6; c.lineTo(Math.cos(a) * 150, Math.sin(a) * 150 * 0.92); } c.closePath(); c.fillStyle = 'rgba(8,6,24,0.85)'; c.fill(); c.lineWidth = 4; c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 24; c.stroke(); c.shadowBlur = 0;
        icon(c, ic, 0, -28, 120, col, 10); txt(c, ab.split(' ')[0], 0, 80, G(900, ab.length > 6 ? 30 : 40), WH, 'center'); c.restore(); });
      return; }
    if (t < F0) return; const idx = clamp(Math.floor((t - F0) / FD), 0, FIELDS.length - 1), T0 = F0 + idx * FD, [ab, full, ic, col, bl] = FIELDS[idx];
    const k = o5(prog(t, T0, T0 + 0.5)), outK = idx < FIELDS.length - 1 ? io3(prog(t, T0 + FD - 0.3, T0 + FD)) : io3(prog(t, 121.7, 122.2));
    c.save(); c.globalAlpha = clamp(k * 1.4) * (1 - outK);
    // left: giant icon behind acronym
    c.save(); c.translate(470 - (1 - k) * 200, 560); c.globalAlpha *= 0.18; icon(c, ic, 0, 0, 640, col, 6); c.restore();
    head(c, scr(ab, prog(t, T0, T0 + 0.5), t, idx), 470 - (1 - k) * 200, 520, ab.length > 6 ? 150 : 230, col, 760, 'center', 1.3, pulse(t, T0, 6));
    txt(c, full.toUpperCase(), 470 - (1 - k) * 200, 680, MONO(800, full.length > 26 ? 24 : 30), WH, 'center', 'middle', 3);
    // counter
    txt(c, `${String(idx + 1).padStart(2, '0')} / ${String(FIELDS.length).padStart(2, '0')}`, 470, 790, MONO(700, 26), DIM, 'center', 'middle', 4);
    // right: panel + bullets
    panel(c, 900 + (1 - k) * 200, 330, 900, 470, col);
    let y = 420; bl.forEach((s, i) => { const n = bullet(c, t, T0 + 0.6 + i * 0.75, 950 + (1 - k) * 200, y, s, col, 40, 760); y += (n || 1) * 49 + 48; });
    c.restore();
    // field chip strip along the bottom
    FIELDS.forEach(([a2, , , c2], i) => { const x = 160 + i * 205, on = i === idx; c.save(); c.globalAlpha = on ? 1 : 0.45; rr(c, x - 92, 900, 184, 46, 23); c.fillStyle = on ? c2 : 'rgba(10,8,30,0.8)'; c.fill(); c.lineWidth = 2; c.strokeStyle = c2; c.stroke(); txt(c, a2.split(' ')[0].slice(0, 11), x, 924, G(800, 20), on ? '#05040D' : WH, 'center'); c.restore(); });
  }

  // ---------------- S4: power to the people (122–146) ----------------
  const NODES = Array.from({ length: 18 }, (_, i) => { const a = i * 2.39996 + 0.4, r = 0.42 + 0.58 * Math.sqrt((i + 0.5) / 18); return [Math.cos(a) * r * 520, Math.sin(a) * r * 330]; });
  function power(c, t) {
    if (t < 122 || t >= 146.4) return; const alarm = t < 129.6 ? 1 : 0; world(c, t, alarm ? RED : CY, alarm ? RED : MG, alarm); opener(c, t, 122, '04', 'POWER TO THE PEOPLE', 'Why decentralization matters', MG);
    if (t < 124) return; const shrink = io3(prog(t, 134, 135)), cx = lerp(W / 2, 1400, shrink), cy = lerp(570, 560, shrink), s = lerp(1, 0.62, shrink);
    c.save(); c.translate(cx, cy); c.scale(s, s);
    const appear = (i) => pop(prog(t, 124.2 + i * 0.08, 124.6 + i * 0.08));
    if (t < 129.6) { // centralized star
      NODES.forEach(([x, y], i) => { const k = appear(i); if (k <= 0) return; c.strokeStyle = rgba(RED, 0.6); c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(x * k, y * k); c.stroke(); const pp = (t * 0.7 + i * 0.13) % 1; c.fillStyle = RED; c.beginPath(); c.arc(x * pp, y * pp, 5, 0, TAU); c.fill(); });
      const sk = pop(prog(t, 124, 124.5)) * (1 + 0.05 * Math.sin(t * 8)); c.save(); c.scale(sk, sk); rr(c, -110, -80, 220, 160, 20); c.fillStyle = '#2A0610'; c.fill(); c.lineWidth = 5; c.strokeStyle = RED; c.shadowColor = RED; c.shadowBlur = 40; c.stroke(); c.shadowBlur = 0; icon(c, 'bank', 0, -12, 120, RED, 10); txt(c, 'GATEKEEPER', 0, 58, MONO(800, 20), RED, 'center', 'middle', 3); c.restore();
    } else { // shatter → mesh
      const k = prog(t, 129.6, 131.2);
      if (k < 1) for (let i = 0; i < 18; i++) { const a = hash(i, 1) * TAU, d = o3(k) * (200 + hash(i, 2) * 300); c.save(); c.globalAlpha = 1 - k; c.translate(Math.cos(a) * d, Math.sin(a) * d); c.rotate(k * 6 * (hash(i, 3) - 0.5)); c.fillStyle = RED; c.fillRect(-14, -9, 28, 18); c.restore(); }
      for (let i = 0; i < NODES.length; i++) for (let j = i + 1; j < NODES.length; j++) { const [x1, y1] = NODES[i], [x2, y2] = NODES[j], d = Math.hypot(x1 - x2, y1 - y2); if (d > 300) continue; const lk = prog(t, 130.2 + (i + j) * 0.035, 130.8 + (i + j) * 0.035); if (lk <= 0) continue;
        c.strokeStyle = rgba(CY, 0.55); c.lineWidth = 3; c.beginPath(); c.moveTo(x1, y1); c.lineTo(lerp(x1, x2, lk), lerp(y1, y2, lk)); c.stroke(); if (lk >= 1) { const pp = (t * 0.5 + i * 0.1 + j * 0.07) % 1; c.fillStyle = WH; c.beginPath(); c.arc(lerp(x1, x2, pp), lerp(y1, y2, pp), 4, 0, TAU); c.fill(); } }
    }
    NODES.forEach(([x, y], i) => { const k = appear(i); if (k <= 0) return; const col = alarm ? '#FF8899' : CY; c.save(); c.translate(x * (alarm ? k : 1), y * (alarm ? k : 1)); c.scale(k, k); c.beginPath(); c.arc(0, 0, 26, 0, TAU); c.fillStyle = 'rgba(8,6,24,0.95)'; c.fill(); c.lineWidth = 4; c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 20; c.stroke(); c.shadowBlur = 0;
      c.fillStyle = col; c.beginPath(); c.arc(0, -6, 7, 0, TAU); c.fill(); c.beginPath(); c.arc(0, 14, 12, Math.PI, 0); c.fill(); c.restore(); });
    c.restore();
    // labels
    if (t < 134) { const lab = alarm ? ['CENTRALIZED', 'One gatekeeper controls the data, the rules & your money'] : ['DECENTRALIZED', 'The network IS the people. No single point of control.'];
      const T0 = alarm ? 124.6 : 130.4, k = o5(prog(t, T0, T0 + 0.5)), col = alarm ? RED : CY; c.save(); c.globalAlpha = k * (1 - prog(t, 133.5, 134)); head(c, lab[0], W / 2, 960, 74, col, 900, 'center', 1, pulse(t, T0, 6)); txt(c, lab[1], W / 2, 1020, G(600, 30), WH, 'center'); c.restore(); }
    // bullets
    const B = [[134.6, 'No middleman taking a cut'], [136.4, 'Every transaction is publicly verifiable'], [138.2, 'You hold your own keys and your own money'], [140.0, 'Censorship-resistant: no one can shut you out']];
    let y = 330; B.forEach(([T0, s]) => { const n = bullet(c, t, T0, 110, y, s, CY, 44, 820); y += (n || 1) * 54 + 46; });
    if (t > 142) { const k = pop(prog(t, 142, 142.5)); c.save(); c.translate(W / 2, 935); c.scale(k, k); rr(c, -720, -58, 1440, 116, 58); c.fillStyle = 'rgba(8,6,24,0.9)'; c.fill(); c.lineWidth = 4; c.strokeStyle = YL; c.shadowColor = YL; c.shadowBlur = 30; c.stroke(); c.shadowBlur = 0; head(c, 'POWER + VISIBILITY → BACK TO THE PEOPLE', 0, 4, 64, YL, 1360, 'center', 0.8); c.restore(); }
    fade(c, t, 145.7, 146.3);
  }

  // ---------------- S5: careers (146–168) ----------------
  const JOBS = ['Smart Contract Developer', 'Security Auditor', 'Protocol Engineer', 'Blockchain Data Analyst', 'DevRel & Community', 'Product Manager', 'Tokenomics Designer', 'Web3 UX Designer', 'Researcher', 'Content Creator'];
  const VS = [['Suits & strict dress codes', 'Hoodies welcome'], ['9-to-5 in a cubicle', 'Remote: work from anywhere'], ['Layers of management', 'Flat, fast-moving teams'], ['Gatekept by degrees', 'Skills & proof of work win']];
  function careers(c, t) {
    if (t < 146 || t >= 168.4) return; world(c, t, YL, MG); opener(c, t, 146, '05', 'THE OPPORTUNITY', 'Where the jobs are going', YL);
    // 148–153: much technology, much growing + growth line
    if (t >= 148 && t < 153.3) { const out = io3(prog(t, 152.8, 153.3)); c.save(); c.globalAlpha = 1 - out;
      head(c, 'MUCH TECHNOLOGY.', 140, 440, 150, WH, 1100, 'left', 1, pulse(t, 148.2, 6)); if (t > 149.2) head(c, 'MUCH GROWING.', 140, 610, 150, YL, 1100, 'left', 1.3, pulse(t, 149.2, 6));
      const k = io3(prog(t, 148.6, 151.5)); c.strokeStyle = GRN; c.lineWidth = 8; c.shadowColor = GRN; c.shadowBlur = 30; c.beginPath(); let lx = 1180, ly = 820; c.moveTo(lx, ly); const pts = []; for (let i = 1; i <= 12; i++) { const x = 1180 + i * 52, y = 820 - Math.pow(i / 12, 2.2) * 520 + (hash(i, 9) - 0.5) * 50; pts.push([x, y]); }
      const n = pts.length * k; for (let i = 0; i < n; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); c.shadowBlur = 0; if (n >= 1) { const [x, y] = pts[Math.max(0, Math.floor(n) - 1)]; c.fillStyle = WH; c.beginPath(); c.arc(x, y, 12, 0, TAU); c.fill(); }
      c.restore(); return; }
    // 153–159: job chips
    if (t >= 153 && t < 159.3) { const out = io3(prog(t, 158.8, 159.3)); c.save(); c.globalAlpha = 1 - out;
      head(c, 'HIGH-PAYING ROLES, AND MORE EVERY YEAR', W / 2, 300, 80, YL, 1600, 'center', 1, pulse(t, 153.2, 6));
      const ROWS = [[0, 1, 2], [3, 4, 5, 6], [7, 8, 9]], f = G(800, 34);
      ROWS.forEach((row, ri) => { const ws = row.map((i) => tw(c, JOBS[i], f) + 70), gap = 34, total = ws.reduce((a, b) => a + b, 0) + gap * (row.length - 1); let x = W / 2 - total / 2;
        row.forEach((i, k2) => { const j = JOBS[i], w = ws[k2], k = pop(prog(t, 153.6 + i * 0.3, 154.0 + i * 0.3)), col = [CY, MG, GRN, YL, VIO][i % 5], cx = x + w / 2, y = 470 + ri * 130; x += w + gap; if (k <= 0) return;
          c.save(); c.translate(cx, y + Math.sin(t * 1.5 + i) * 6); c.scale(k, k); rr(c, -w / 2, -36, w, 72, 36); c.fillStyle = 'rgba(8,6,24,0.9)'; c.fill(); c.lineWidth = 3; c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 20; c.stroke(); c.shadowBlur = 0; txt(c, j, 0, 2, f, WH, 'center'); c.restore(); }); });
      txt(c, '$  $  $', W / 2, 870, G(900, 60), rgba(GRN, 0.8 * prog(t, 156.8, 157.3)), 'center', 'middle', 20);
      c.restore(); return; }
    // 159–168: traditional vs web3
    if (t >= 159) { const out = io3(prog(t, 167.6, 168.2)); c.save(); c.globalAlpha = 1 - out;
      const k0 = o5(prog(t, 159, 159.5)); panel(c, 140, 300, 780, 600, '#777799', k0); panel(c, 1000, 300, 780, 600, CY, k0);
      head(c, 'TRADITIONAL JOB', 530, 370, 54, DIM, 700, 'center', 0); head(c, 'WEB3', 1390, 370, 64, CY, 700, 'center', 1.2, pulse(t, 159, 6));
      VS.forEach(([a, b], i) => { const T0 = 159.8 + i * 1.6, k = o5(prog(t, T0, T0 + 0.4)), k2 = o5(prog(t, T0 + 0.5, T0 + 0.9)), y = 480 + i * 100;
        if (k > 0) { c.save(); c.globalAlpha *= k; txt(c, a, 200, y, G(700, 36), '#8888AA', 'left'); const sw = tw(c, a, G(700, 36)) * o5(prog(t, T0 + 0.3, T0 + 0.6)); c.fillStyle = RED; c.fillRect(196, y - 2, sw, 5); c.restore(); }
        if (k2 > 0) { c.save(); c.globalAlpha *= k2; c.translate((1 - k2) * 60, 0); txt(c, '✓', 1060, y, G(900, 40), GRN, 'left'); neon(c, scr(b, prog(t, T0 + 0.5, T0 + 1.0), t, i), 1115, y, G(800, 38), WH, 'left', 0.2); c.restore(); } });
      c.restore(); }
  }

  // ---------------- S6: outro (168–180) ----------------
  function outro(c, t) {
    if (t < 168) return; world(c, t, CY, MG);
    const k = pop(prog(t, 168.2, 168.8));
    c.save(); c.translate(W / 2, 420); c.scale(lerp(1.5, 1, k), lerp(1.5, 1, k)); head(c, scr('THE FUTURE IS', prog(t, 168.2, 168.9), t, 1), 0, -110, 120, WH, 1500, 'center', 1, pulse(t, 168.2, 5)); head(c, scr('DECENTRALIZED.', prog(t, 168.6, 169.4), t, 2), 0, 50, 210, CY, 1700, 'center', 1.4, pulse(t, 168.6, 5)); c.restore();
    if (t > 170.2) { const a = prog(t, 170.2, 170.8); c.save(); c.globalAlpha = a; txt(c, 'WELCOME TO BLOCKCHAIN 101', W / 2, 650, MONO(800, 44), MG, 'center', 'middle', 8); c.restore(); }
    if (t > 171.6) { const kk = pop(prog(t, 171.6, 172.1)); c.save(); c.translate(W / 2, 760); c.scale(kk, kk); rr(c, -380, -48, 760, 96, 48); c.fillStyle = YL; c.shadowColor = YL; c.shadowBlur = 40; c.fill(); c.shadowBlur = 0; txt(c, 'NEXT  →  EPISODE 02', 0, 3, G(900, 48), '#0A0014', 'center', 'middle', 4); c.restore(); }
    if (t > 173) { const a = prog(t, 173, 173.6); c.save(); c.globalAlpha = a; txt(c, '@THEE_KAL_EL', W / 2, 880, MONO(800, 48), WH, 'center', 'middle', 6); c.restore(); }
    [BTC, ETH, SOL].forEach((f, i) => { const kk = pop(prog(t, 173.6 + i * 0.2, 174 + i * 0.2)); f(c, W / 2 + (i - 1) * 120, 975 + Math.sin(t * 2.4 + i) * 5, 38, kk); });
    const fo = prog(t, 178.3, 180); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  }

  // ---------------- finishing: glitch cuts, chroma on hits, scanlines, grain ----------------
  const HITS = [6, 8, 10, 12, 30, 74, 122, 129.6, 134, 142, 146, 148.2, 149.2, 153.2, 159, 168.2, 168.6].concat(HIST.map((_, i) => H0 + i * HD), FIELDS.map((_, i) => F0 + i * FD));
  let BUF = null, GRAIN = null, SCAN = null;
  function finish(c, t) {
    if (!BUF) { BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; }
    // glitch slices at section cuts
    let gk = 0; for (const T of CUTS) if (t >= T - 0.05 && t < T + 0.35) gk = Math.max(gk, 1 - (t - T + 0.05) / 0.4);
    const b = BUF.getContext('2d');
    if (gk > 0) { b.clearRect(0, 0, W, H); b.drawImage(cv, 0, 0); const f = Math.floor(t * 40); for (let i = 0; i < 14; i++) { const y = hash(i, f) * H, h = 8 + hash(i, f, 2) * 70; c.drawImage(BUF, 0, y, W, h, (hash(i, f, 3) - 0.5) * 220 * gk, y, W, h); }
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * gk; c.drawImage(BUF, -18 * gk, 0); c.restore(); }
    let h = 0; for (const T of HITS) h = Math.max(h, pulse(t, T, 12));
    if (h > 0.05) { b.clearRect(0, 0, W, H); b.drawImage(cv, 0, 0); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.12 * h; c.drawImage(BUF, -10 * h, 0); c.drawImage(BUF, 10 * h, 0); c.restore(); }
    if (!SCAN) { SCAN = document.createElement('canvas'); SCAN.width = 4; SCAN.height = 4; const s = SCAN.getContext('2d'); s.fillStyle = 'rgba(0,0,0,0.22)'; s.fillRect(0, 0, 4, 1); }
    c.fillStyle = c.createPattern(SCAN, 'repeat'); c.fillRect(0, 0, W, H);
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 14; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const vg = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  }
  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.letterSpacing = '0px'; c.setLineDash([]);
    let sh = 0; for (const T of [6, 12, 30, 74, 122, 129.6, 134, 146, 168.2]) sh = Math.max(sh, pulse(t, T, 9) * 12);
    c.fillStyle = BG; c.fillRect(0, 0, W, H);
    c.save(); c.translate((hash(Math.round(t * FPS), 3) - 0.5) * 2 * sh, (hash(Math.round(t * FPS), 4) - 0.5) * 2 * sh);
    boot(c, t); title(c, t); whatIs(c, t); history(c, t); fields(c, t); power(c, t); careers(c, t); outro(c, t); c.restore();
    hud(c, t); finish(c, t);
  }
  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(D(100)), document.fonts.load(G(600, 40)), document.fonts.load(G(700, 40)), document.fonts.load(G(800, 40)), document.fonts.load(MONO(700, 30)), document.fonts.load(MONO(800, 30)), document.fonts.load(MONO(600, 30))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
