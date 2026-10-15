// PROTON MAIL — "Your email is being watched." 20s vertical (1080x1920) @ 60fps, cut to 120 BPM.
// 0–3 hook: an inbox under surveillance (tracker eyes swarm a letter) · 3–5.5 glitch → the Proton shield slams in ·
// 5.5–9 encryption: a message scrambles into ciphertext and locks · 9–12.5 real feature cards from proton.me
// (trackers blocked · password-protected email · 2FA failure) · 12.5–15.5 the real app inbox + trust line ·
// 15.5–20 end card. Captions sit at y≈1330, clear of the TikTok/Reels/Shorts UI overlay. renderAt(t) is deterministic.
(() => {
  'use strict';
  const W = 1080, H = 1920, FPS = 60, DUR = 20, TAU = Math.PI * 2;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const PUR = '#6D4AFF', PUR2 = '#A995FF', DEEP = '#0E0828', INK = '#07041A', YEL = '#FFE14A', RED = '#FF3B5C', GRN = '#2ECC71', LAV = '#F1EEFF';
  const D = (s) => `900 ${s}px "Inter Tight", sans-serif`, G = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`, MONO = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k, prog = (t, a, b) => clamp((t - a) / (b - a));
  const io3 = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2), io5 = (p) => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2), o3 = (p) => 1 - Math.pow(1 - p, 3);
  const crit = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const k = 7 * p; return (1 - (1 + k) * Math.exp(-k)) / (1 - 8 * Math.exp(-7)); };
  const pop = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const z = 0.55, w = 12, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * p) * (Math.cos(wd * p) + z / Math.sqrt(1 - z * z) * Math.sin(wd * p)); };
  const A = (t, t0, d, f = crit) => f(prog(t, t0, t0 + d)), pulse = (t, T, k = 12) => (t >= T ? Math.exp(-(t - T) * k) : 0);
  const hash = (a, b = 0, c = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  function tw(c, s, font) { c.font = font; return c.measureText(s).width; }
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const ASSETS = ['proton_logo', 'proton_phone', 'pm_pwd', 'pm_auth', 'pm_track', 'kal_cutout'];
  function img(c, k, x, y, w, r = 0) { const im = IMG[k]; if (!im) return 0; const h = w * im.height / im.width; c.save(); if (r) { rr(c, x, y, w, h, r); c.clip(); } c.drawImage(im, x, y, w, h); c.restore(); return h; }
  // poster word: dark stroke + drop shadow + fill
  function word(c, s, x, y, size, fill, k = 1, sx = 0.86, rot = -0.03) { if (k <= 0) return; c.save(); c.translate(x, y); c.rotate(rot); c.scale(sx * lerp(1.6, 1, k), lerp(1.6, 1, k)); c.globalAlpha = clamp(k * 2.5); c.font = D(size); c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '-2px'; c.lineJoin = 'round';
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillText(s, 10, 14); c.lineWidth = size * 0.16; c.strokeStyle = INK; c.strokeText(s, 0, 0);
    if (Array.isArray(fill)) { const g = c.createLinearGradient(0, -size / 2, 0, size / 2); fill.forEach((f, i) => g.addColorStop(i / (fill.length - 1), f)); c.fillStyle = g; } else c.fillStyle = fill; c.fillText(s, 0, 0); c.letterSpacing = '0px'; c.restore(); }

  // ---------- backdrops ----------
  const CH = 'ABCDEFGHKLMNOPQRSUVXYZ0123456789+%#';
  function cipherBg(c, t, glow = 1, alarm = 0) {
    const g = c.createRadialGradient(W / 2, 900, 0, W / 2, 900, 1300); g.addColorStop(0, alarm ? '#3A0F2A' : '#4A2FD0'); g.addColorStop(0.45, alarm ? '#1A0718' : '#22107A'); g.addColorStop(1, DEEP); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.font = MONO(700, 30); c.textAlign = 'center'; c.textBaseline = 'middle'; const sh = Math.floor(t * 8);
    for (let x = 20, i = 0; x < W; x += 46, i++) { const sp = 40 + hash(i, 7) * 120; for (let y = 0, j = 0; y < H + 46; y += 46, j++) { const v = hash(i, j); if (v < 0.4) continue; const yy = (y + t * sp) % (H + 46) - 23;
      c.fillStyle = alarm ? `rgba(255,90,120,${0.04 + 0.14 * hash(j, i)})` : `rgba(169,149,255,${(0.04 + 0.14 * hash(j, i)) * glow})`; c.fillText(CH[((v * 997 | 0) + sh * (hash(i, j, 3) > 0.85 ? 1 : 0)) % CH.length], x, yy); } }
    c.restore();
  }
  // ---------- vector bits ----------
  function eye(c, x, y, s, look = 0, blink = 1) { c.save(); c.translate(x, y); c.scale(s / 100, s / 100); c.beginPath(); c.moveTo(-60, 0); c.quadraticCurveTo(0, -50 * blink, 60, 0); c.quadraticCurveTo(0, 50 * blink, -60, 0); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
    if (blink > 0.2) { c.save(); c.clip(); c.beginPath(); c.arc(look * 14, 0, 24, 0, TAU); c.fillStyle = RED; c.fill(); c.beginPath(); c.arc(look * 14, 0, 11, 0, TAU); c.fillStyle = INK; c.fill(); c.restore(); } c.restore(); }
  function envelope(c, x, y, w, rot = 0) { const h = w * 0.66; c.save(); c.translate(x, y); c.rotate(rot); c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 40; c.shadowOffsetY = 16; rr(c, -w / 2, -h / 2, w, h, w * 0.06); c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent';
    c.beginPath(); c.moveTo(-w / 2 + 10, -h / 2 + 10); c.lineTo(0, h * 0.08); c.lineTo(w / 2 - 10, -h / 2 + 10); c.lineWidth = w * 0.025; c.strokeStyle = '#C9C2EE'; c.lineJoin = 'round'; c.stroke(); c.restore(); }
  function shield(c, x, y, s, k = 1) { if (k <= 0) return; c.save(); c.translate(x, y); c.scale(s / 500 * k, s / 500 * k); c.shadowColor = 'rgba(169,149,255,0.95)'; c.shadowBlur = 90;
    c.beginPath(); c.moveTo(0, -250); c.quadraticCurveTo(150, -200, 230, -210); c.quadraticCurveTo(250, 120, 0, 270); c.quadraticCurveTo(-250, 120, -230, -210); c.quadraticCurveTo(-150, -200, 0, -250); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent'; c.lineWidth = 12; c.strokeStyle = PUR; c.stroke();
    const im = IMG.proton_logo; if (im) { const lw = 300, lh = lw * im.height / im.width; c.drawImage(im, -lw / 2, -lh / 2 + 10, lw, lh); } c.restore(); }
  function lockBadge(c, x, y, r, closed = 1, col = GRN) { c.save(); c.translate(x, y); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = col; c.fill(); c.lineWidth = r * 0.11; c.strokeStyle = '#fff'; c.stroke(); const u = r / 70;
    c.fillStyle = '#fff'; rr(c, -30 * u, -6 * u, 60 * u, 46 * u, 8 * u); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 9 * u; c.beginPath(); const lift = (1 - closed) * 16 * u; c.moveTo(-20 * u, -6 * u - lift); c.lineTo(-20 * u, -16 * u - lift); c.arc(0, -16 * u - lift, 20 * u, Math.PI, 0); c.lineTo(20 * u, -6 * u - lift * (closed < 1 ? 2 : 1)); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(0, 14 * u, 7 * u, 0, TAU); c.fill(); c.restore(); }
  function card(c, k, cx, cy, w, rot, glow = PUR) { const im = IMG[k]; if (!im) return; const h = w * im.height / im.width; c.save(); c.translate(cx, cy); c.rotate(rot); c.shadowColor = rgba(glow, 0.8); c.shadowBlur = 70; rr(c, -w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 34); c.fillStyle = LAV; c.fill(); c.shadowColor = 'transparent'; c.save(); rr(c, -w / 2, -h / 2, w, h, 26); c.clip(); c.drawImage(im, -w / 2, -h / 2, w, h); c.restore(); c.restore(); }

  // ---------- captions (safe zone) ----------
  const CAPS = [[0.4, 2.85, 'YOUR EMAIL', 'IS BEING WATCHED.', RED], [3.0, 5.35, 'NOT ANYMORE.', 'PROTON MAIL', PUR2], [5.6, 8.85, 'END-TO-END', 'ENCRYPTED', GRN], [9.0, 12.35, 'TRACKERS? BLOCKED.', 'HACKERS? LOCKED OUT.', YEL],
    [12.5, 15.35, 'TRUSTED BY', 'MILLIONS WORLDWIDE', PUR2]];
  function captions(c, t) { for (const [t0, t1, a, b, col] of CAPS) { if (t < t0 || t > t1) continue; const k = io5(prog(t, t0, t0 + 0.22)), out = io3(prog(t, t1 - 0.2, t1));
    c.save(); c.globalAlpha = 1 - out; const g = c.createLinearGradient(0, 1150, 0, 1560); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(7,4,26,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 1150, W, 410);
    c.translate(W / 2, 1330); c.textAlign = 'center'; c.scale(lerp(1.3, 1, k), lerp(1.3, 1, k)); c.font = G(900, 92); c.letterSpacing = '-2px'; const fs = Math.min(92, 92 * (W - 260) / c.measureText(a).width); c.font = G(900, fs); c.textBaseline = 'alphabetic';
    c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,60,200,0.5)'; c.fillText(a, -6 * (1 - k) - 2, 0); c.fillStyle = 'rgba(80,160,255,0.5)'; c.fillText(a, 6 * (1 - k) + 2, 0); c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#fff'; c.fillText(a, 0, 0); const aw = c.measureText(a).width; c.fillStyle = col; const ul = aw * io3(prog(t, t0 + 0.1, t0 + 0.4)); c.fillRect(-ul / 2, 18, ul, 7);
    c.letterSpacing = '3px'; c.font = G(800, 44); c.globalAlpha = (1 - out) * prog(t, t0 + 0.15, t0 + 0.35); c.fillStyle = col; c.fillText(b, 0, 80); c.letterSpacing = '0px'; c.restore(); } }

  // ---------- S1 hook: surveillance (0–3) ----------
  function hook(c, t) {
    if (t >= 3.0) return; cipherBg(c, t, 0.6, 1);
    const ek = pop(prog(t, 0.05, 0.45)); c.save(); c.translate(W / 2, 640); c.scale(ek, ek); envelope(c, 0, 0, 520, -0.05); c.restore();
    // tracker eyes swarm in, one per 8th note
    for (let i = 0; i < 9; i++) { const T0 = 0.5 + i * 0.25, k = pop(prog(t, T0, T0 + 0.3)); if (k <= 0) continue; const a = i / 9 * TAU + 0.3, r = 330 + hash(i, 2) * 80, x = W / 2 + Math.cos(a) * r, y = 640 + Math.sin(a) * r * 0.9, look = Math.cos(a + Math.PI) * 0.9;
      const blink = t > 2.1 + i * 0.03 && t < 2.2 + i * 0.03 ? 0.1 : 1; c.save(); c.globalAlpha = clamp(k * 2); eye(c, x, y, 120 * k, look, blink);
      c.strokeStyle = rgba(RED, 0.5 * k); c.lineWidth = 3; c.setLineDash([10, 10]); c.lineDashOffset = -t * 60; c.beginPath(); c.moveTo(x, y); c.lineTo(W / 2, 640); c.stroke(); c.setLineDash([]); c.restore(); }
    // red scanline + glitch at the end
    const sl = (t * 0.9) % 1; c.fillStyle = rgba(RED, 0.25); c.fillRect(0, sl * H, W, 6);
    if (t > 2.6) { const g = prog(t, 2.6, 3.0); for (let i = 0; i < 16; i++) { const y = hash(i, Math.floor(t * 30)) * H, h = 10 + hash(i, 2, Math.floor(t * 30)) * 60; c.drawImage(cv, 0, y, W, h, (hash(i, 3, Math.floor(t * 30)) - 0.5) * 160 * g, y, W, h); } c.fillStyle = `rgba(255,255,255,${0.5 * pulse(t, 2.95, 20)})`; c.fillRect(0, 0, W, H); }
  }
  // ---------- S2 the shield (3–5.5) ----------
  function reveal(c, t) {
    if (t < 3.0 || t >= 5.5) return; cipherBg(c, t, 1);
    // eyes scatter away
    for (let i = 0; i < 9; i++) { const k = prog(t, 3.0, 3.6); if (k >= 1) break; const a = i / 9 * TAU + 0.3, r = 360 + k * 900; c.save(); c.globalAlpha = 1 - k; eye(c, W / 2 + Math.cos(a) * r, 640 + Math.sin(a) * r * 0.9, 120, 0, 1 - k); c.restore(); }
    const sk = pop(prog(t, 3.0, 3.45)); shield(c, W / 2, 640, 640, sk);
    const rg = prog(t, 3.0, 3.7); if (rg < 1) { c.save(); c.strokeStyle = rgba(PUR2, 1 - rg); c.lineWidth = 24 * (1 - rg); c.beginPath(); c.arc(W / 2, 640, 300 + 900 * o3(rg), 0, TAU); c.stroke(); c.restore(); }
    const lk = pop(prog(t, 3.6, 3.95)); if (lk > 0) { c.save(); c.translate(W / 2 + 220, 880); c.scale(lk, lk); lockBadge(c, 0, 0, 80, prog(t, 3.9, 4.1)); c.restore(); }
    word(c, 'PROTON MAIL', W / 2, 210, 150, ['#FFFFFF', PUR2], A(t, 3.4, 0.3), 0.86, 0);
  }
  // ---------- S3 encryption (5.5–9) ----------
  const MSG = ['Hey! Here is my bank', 'login + the house code:', 'pass: Sunflower#2026', 'door: 4 8 1 5'];
  function encrypt(c, t) {
    if (t < 5.5 || t >= 9.0) return; cipherBg(c, t, 1);
    const ck = crit(prog(t, 5.5, 5.9)), x0 = 90, y0 = 300, cw = W - 180, chh = 720; c.save(); c.translate(0, (1 - ck) * 800); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 50; rr(c, x0, y0, cw, chh, 40); c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent';
    c.fillStyle = PUR; rr(c, x0, y0, cw, 110, [40, 40, 0, 0]); c.fill(); txt(c, 'New message', x0 + 40, y0 + 56, G(800, 44), '#fff'); txt(c, 'To: friend@gmail.com', x0 + 40, y0 + 160, G(600, 34), '#666');
    const enc = clamp((t - 6.9) / 1.0), font = MONO(700, 46);
    MSG.forEach((line, i) => { const typed = Math.floor(clamp((t - 5.9 - i * 0.22) / 0.4) * line.length); let s = '';
      for (let j = 0; j < typed; j++) { const ch = line[j]; s += (ch !== ' ' && hash(i * 50 + j, 9) < enc * 1.3 - 0.15) ? CH[(hash(i, j, Math.floor(t * 20)) * CH.length) | 0] : ch; }
      txt(c, s, x0 + 40, y0 + 250 + i * 76, font, enc > 0.5 ? PUR : INK); });
    // encrypt button
    const bp = pulse(t, 6.85, 9) * (t >= 6.85 ? 1 : 0); rr(c, x0 + 40, y0 + chh - 130, cw - 80, 96, 48); c.fillStyle = enc >= 1 ? GRN : PUR; c.fill(); txt(c, enc >= 1 ? '✓  ENCRYPTED & SENT' : '🔒  ENCRYPT & SEND', W / 2, y0 + chh - 82 + bp * 4, G(800, 40), '#fff', 'center');
    c.restore();
    const lk = pop(prog(t, 7.9, 8.25)); if (lk > 0) { c.save(); c.translate(W - 170, 360); c.scale(lk, lk); lockBadge(c, 0, 0, 90); c.restore(); }
    // finger tap on the button
    if (t > 6.55 && t < 7.2) { const k = prog(t, 6.55, 7.2), x = W / 2 + 120 + (1 - k) * 80, y = y0 + chh - 82 + (1 - k) * 120; c.save(); c.globalAlpha = Math.sin(k * Math.PI); c.beginPath(); c.arc(x, y, 46 * (1 - 0.12 * pulse(t, 6.85, 10)), 0, TAU); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fill(); c.lineWidth = 6; c.strokeStyle = PUR; c.stroke(); c.restore(); }
  }
  // ---------- S4 feature cards (9–12.5) ----------
  function features(c, t) {
    if (t < 9.0 || t >= 12.5) return; cipherBg(c, t, 0.9);
    // one real card at a time, big and readable: slides in, gets stamped, slides out
    const C3 = [['pm_track', 9.0, -0.04, GRN, 'BLOCKED'], ['pm_pwd', 10.0, 0.03, PUR, 'LOCKED'], ['pm_auth', 11.0, -0.03, RED, 'DENIED']];
    C3.forEach(([k, T0, rot, col, st], i) => { const a = crit(prog(t, T0, T0 + 0.4)), out = i < 2 ? io3(prog(t, T0 + 0.9, T0 + 1.05)) : 0; if (a <= 0 || out >= 1) return; const im = IMG[k]; if (!im) return;
      const cw = 900, ch = cw * im.height / im.width, cy = 680; c.save(); c.translate((1 - a) * (i % 2 ? -1100 : 1100) + out * (i % 2 ? 1100 : -1100), 0); card(c, k, W / 2, cy, cw, rot * a, col);
      const sk = pop(prog(t, T0 + 0.35, T0 + 0.65)); if (sk > 0) { c.save(); c.translate(W / 2 + 230, cy + ch / 2 - 10); c.rotate(-0.18); c.scale(lerp(2.2, 1, clamp(sk)), lerp(2.2, 1, clamp(sk))); c.globalAlpha = clamp(sk * 2);
        c.font = D(74); const w = c.measureText(st).width + 60; rr(c, -w / 2, -56, w, 112, 16); c.fillStyle = 'rgba(255,255,255,0.92)'; c.fill(); c.lineWidth = 10; c.strokeStyle = col; c.stroke(); txt(c, st, 0, 4, D(74), col, 'center'); c.restore(); }
      c.restore(); });
    // step dots
    for (let i = 0; i < 3; i++) { const on = t >= 9 + i; c.beginPath(); c.arc(W / 2 - 50 + i * 50, 200, on ? 13 : 9, 0, TAU); c.fillStyle = on ? '#fff' : 'rgba(255,255,255,0.3)'; c.fill(); }
  }
  // ---------- S5 the app + trust (12.5–15.5) ----------
  function app(c, t) {
    if (t < 12.5 || t >= 15.5) return; cipherBg(c, t, 1);
    const k = crit(prog(t, 12.5, 13.0)), im = IMG.proton_phone; if (im) { const pw = 840, ph = pw * im.height / im.width; c.save(); c.translate(W / 2, 680 + (1 - k) * 900); c.rotate(-0.04 * (1 - k)); c.scale(1 + 0.03 * prog(t, 13, 15.5), 1 + 0.03 * prog(t, 13, 15.5));
      c.shadowColor = rgba(PUR, 0.9); c.shadowBlur = 90; rr(c, -pw / 2 - 12, -ph / 2 - 12, pw + 24, ph + 24, 54); c.fillStyle = PUR2; c.fill(); c.shadowColor = 'transparent'; c.save(); rr(c, -pw / 2, -ph / 2, pw, ph, 44); c.clip(); c.drawImage(im, -pw / 2, -ph / 2, pw, ph); c.restore(); c.restore(); }
    // trust chips
    [['🛡  OPEN SOURCE', 13.3, 230, 160], ['🔒  E2E ENCRYPTED', 13.5, 820, 140], ['🌍  MILLIONS OF USERS', 13.7, 540, 1110]].forEach(([s, T0, x, y], i) => { const kk = pop(prog(t, T0, T0 + 0.35)); if (kk <= 0) return; c.save(); c.translate(x, y); c.rotate(i === 1 ? 0.05 : -0.04); c.scale(kk, kk); const f = G(800, 38), w = tw(c, s, f) + 70; rr(c, -w / 2, -46, w, 92, 46); c.fillStyle = i === 2 ? YEL : '#fff'; c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 24; c.fill(); c.shadowColor = 'transparent'; txt(c, s, 0, 3, f, INK, 'center'); c.restore(); });
  }
  // ---------- S6 end card (15.5–20) ----------
  function endCard(c, t) {
    if (t < 15.5) return; cipherBg(c, t, 1.2);
    shield(c, W / 2, 560, 520, pop(prog(t, 15.5, 15.95)));
    word(c, 'SWITCH TO', W / 2, 960, 110, '#FFFFFF', A(t, 15.9, 0.3));
    word(c, 'PROTON MAIL', W / 2, 1110, 150, [YEL, '#FFB020'], A(t, 16.05, 0.3));
    const uk = pop(prog(t, 16.5, 16.85)); if (uk > 0) { c.save(); c.translate(W / 2, 1290); c.scale(uk, uk); const f = MONO(800, 46), w = tw(c, 'proton.me', f) + 110; rr(c, -w / 2, -50, w, 100, 50); c.fillStyle = INK; c.fill(); c.lineWidth = 5; c.strokeStyle = PUR2; c.stroke(); c.fillStyle = GRN; c.beginPath(); c.arc(-w / 2 + 44, 0, 10, 0, TAU); c.fill(); txt(c, 'proton.me', 16, 3, f, '#fff', 'center'); c.restore(); }
    const hk = A(t, 16.9, 0.35); if (hk > 0) { c.save(); c.globalAlpha = hk; txt(c, '@THEE_KAL_EL', W / 2, 1420 + (1 - hk) * 20, MONO(800, 44), PUR2, 'center', 'middle', 4); c.restore(); }
    const sp = (s) => { c.save(); c.translate(s[0], s[1] + Math.sin(t * 2 + s[0]) * 10); c.beginPath(); c.moveTo(s[2], 0); for (let i = 1; i <= 4; i++) { const a = i * TAU / 4; c.quadraticCurveTo(0, 0, Math.cos(a) * s[2], Math.sin(a) * s[2]); } c.closePath(); c.fillStyle = '#fff'; c.fill(); c.restore(); };
    [[200, 360, 30], [880, 330, 26], [910, 820, 22], [160, 860, 24]].forEach((s, i) => { if (t > 15.8 + i * 0.1) sp(s); });
  }

  // ---------- finishing ----------
  const HITS = [0.05, 3.0, 3.6, 5.5, 6.85, 7.9, 9.0, 9.4, 10.0, 10.4, 11.0, 11.4, 12.5, 15.5, 16.05];
  let BUF = null, GRAIN = null;
  function finish(c, t) {
    let h = 0; for (const T0 of HITS) h = Math.max(h, pulse(t, T0, 14));
    if (h > 0.05) { if (!BUF) { BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; } const b = BUF.getContext('2d'); b.clearRect(0, 0, W, H); b.drawImage(cv, 0, 0); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.14 * h; c.drawImage(BUF, -12 * h, 0); c.drawImage(BUF, 12 * h, 0); c.restore(); }
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 12; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const fo = prog(t, 19.5, 20); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  }
  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.letterSpacing = '0px';
    let sh = 0; for (const T0 of HITS) sh = Math.max(sh, pulse(t, T0, 18) * 9); c.save(); c.translate((hash(Math.round(t * FPS), 3) - 0.5) * 2 * sh, (hash(Math.round(t * FPS), 4) - 0.5) * 2 * sh);
    hook(c, t); reveal(c, t); encrypt(c, t); features(c, t); app(c, t); endCard(c, t); c.restore(); captions(c, t); finish(c, t);
  }
  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(D(100)), document.fonts.load(G(800, 40)), document.fonts.load(G(900, 40)), document.fonts.load(G(600, 40)), document.fonts.load(MONO(700, 30)), document.fonts.load(MONO(800, 30)), ...ASSETS.map((k) => load(k, `../story/${k}.png`))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
