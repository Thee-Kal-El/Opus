// THEE_KAL_EL — 10s vertical creator reel (1080×1920 @ 60fps), cut to a 120 BPM cinematic-phonk score (beat = 0.5s).
// Pro-edition language: one Three.js network world as the stage, restrained editorial type, light-scan reveal, giant name set BEHIND
// the subject for depth, 3D-tracked style data pins, beat-cut kinetic line, end card. Copy stays above y≈1450 and clear of the
// right-side app buttons (TikTok / Reels / Shorts safe zone).
// 0–1.5 fly-through cold open · 1.5 scan reveal · 2–5 name + pins · 5–7.5 kinetic line (camera whips on beats) · 7.5–10 end card.
(() => {
  'use strict';
  const W = 1080, H = 1920, FPS = 60, DUR = 10, TAU = Math.PI * 2;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const TX = '#E8EEF5', TX2 = '#8A96A8', TX3 = '#4A5566', ACC = '#5CE1E6', AMB = '#F5B544';
  const F = (w, s) => `${w} ${s}px "Inter Tight", Geist, sans-serif`, MONO = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k, prog = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2), out5 = (p) => 1 - Math.pow(1 - p, 5), out3 = (p) => 1 - Math.pow(1 - p, 3);
  const hash = (a, b = 0, c = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const V3 = { add: (a, b) => a.map((x, i) => x + b[i]), lerp: (a, b, k) => a.map((x, i) => x + (b[i] - x) * k) };
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  const tw = (c, s, font, ls = 0) => { c.font = font; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.letterSpacing = '0px'; return w; };
  const fit = (c, s, w, size, maxW, ls = 0) => Math.min(size, size * maxW / Math.max(1, tw(c, s, F(w, size), ls)));
  function reveal(c, s, x, y, font, col, t, T, align = 'left', ls = 0, dur = 0.6) { if (t < T) return; const k = out5(prog(t, T, T + dur)); c.save(); c.font = font; const m = c.measureText('Hg'), hg = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * 1.35; c.beginPath(); c.rect(0, y - hg * 0.62, W, hg * 1.15); c.clip(); c.globalAlpha *= k; txt(c, s, x, y + (1 - k) * hg * 0.9, font, col, align, 'middle', ls); c.restore(); }
  function ticks(c, x, y, w, h, col, L = 16) { c.strokeStyle = col; c.lineWidth = 2; [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, dx, dy]) => { c.beginPath(); c.moveTo(px + dx * L, py); c.lineTo(px, py); c.lineTo(px, py + dy * L); c.stroke(); }); }

  // ---------- portrait (graded once: cool tint + floor fade; plus a cyan rim/halo layer) ----------
  const IMG = new Image(); IMG.src = '../story/kal_cutout_x4.png';
  const PH = 1390, PW = Math.round(PH * 2920 / 4360), PX = Math.round(W / 2 - PW / 2), PY = H - PH + 30;
  let PORT = null, RIM = null;
  function prep() {
    PORT = document.createElement('canvas'); PORT.width = PW; PORT.height = PH; const p = PORT.getContext('2d'); p.drawImage(IMG, 0, 0, PW, PH);
    p.globalCompositeOperation = 'source-atop'; p.fillStyle = 'rgba(24,70,96,0.16)'; p.fillRect(0, 0, PW, PH);
    const g = p.createLinearGradient(0, PH * 0.55, 0, PH); g.addColorStop(0, 'rgba(5,7,10,0)'); g.addColorStop(1, 'rgba(5,7,10,0.92)'); p.fillStyle = g; p.fillRect(0, 0, PW, PH);
    RIM = document.createElement('canvas'); RIM.width = PW + 120; RIM.height = PH + 120; const r = RIM.getContext('2d'); r.drawImage(IMG, 60, 60, PW, PH); r.globalCompositeOperation = 'source-in'; r.fillStyle = ACC; r.fillRect(0, 0, RIM.width, RIM.height);
  }

  // ---------- camera ----------
  const W3 = () => window.WORLD;
  function camAt(t) {
    const u = lerp(0.06, 0.5, ease(prog(t, 0, 1.7))), fly = { pos: V3.add(W3().curve(u), [3.2, 2.0, 0]), look: W3().curve(u + 0.05) };
    let a = 0.8 + t * 0.07; [5, 5.5, 6, 6.5].forEach((b) => { a += 0.42 * out3(prog(t, b, b + 0.28)); });
    const rise = ease(prog(t, 7.5, 10)), r = lerp(78, 98, rise), h = lerp(16, 6, rise), orb = { pos: [Math.cos(a) * r, h, Math.sin(a) * r], look: [0, lerp(-2, 8, rise), 0] };
    const k = ease(prog(t, 1.3, 2.4)); return { pos: V3.lerp(fly.pos, orb.pos, k), look: V3.lerp(fly.look, orb.look, k) };
  }
  function worldState(t) { const st = { cam: camAt(t), offX: 0, dim: t > 1.5 ? 0.25 : 0 }; if (t >= 5 && t < 7.5) st.focusDistrict = clamp(Math.floor((t - 5) / 0.5), 0, 4) * 2 % 8; if (t < 1.6) st.spineHi = 12; st.towers = prog(t, 7.4, 9.6); return st; }

  // ---------- scenes ----------
  function intro(c, t) { if (t >= 1.7) return; const o = 1 - out3(prog(t, 1.35, 1.6)); c.save(); c.globalAlpha = o;
    const bg = c.createRadialGradient(W / 2, 910, 0, W / 2, 910, 420); bg.addColorStop(0, 'rgba(5,7,10,0.8)'); bg.addColorStop(1, 'rgba(5,7,10,0)'); c.fillStyle = bg; c.fillRect(0, 490, W, 840);
    reveal(c, 'SIGNAL ACQUIRED', W / 2, 860, MONO(600, 34), ACC, t, 0.25, 'center', 10);
    const k = ease(prog(t, 0.3, 1.3)); c.fillStyle = 'rgba(232,238,245,0.15)'; c.fillRect(W / 2 - 260, 910, 520, 1); c.fillStyle = ACC; c.fillRect(W / 2 - 260, 909.5, 520 * k, 2);
    reveal(c, 'IDENTITY · THEE_KAL_EL', W / 2, 965, MONO(600, 24), TX, t, 0.7, 'center', 6); c.restore(); }
  // giant name behind the subject
  function nameBack(c, t) { if (t < 1.9) return; const fs = fit(c, 'KAL_EL', 600, 330, W - 110, -6);
    const drift = (t - 2) * 6, o = 1 - 0.25 * prog(t, 7.5, 8.2);
    c.save(); c.globalAlpha = o;
    reveal(c, 'THEE', 62 - drift * 0.5, 345, F(600, fs * 0.62), rgba(TX, 0.92), t, 1.95, 'left', -4, 0.8);
    reveal(c, 'KAL_EL', 54 + drift * 0.4, 545, F(600, fs), TX, t, 2.1, 'left', -6, 0.9);
    c.fillStyle = rgba(ACC, 0.9); c.fillRect(62, 690, (W - 124) * out3(prog(t, 2.4, 3.2)), 2);
    c.restore(); }
  function portrait(c, t) { if (t < 1.5 || !PORT) return; const sy = PY + PH * ease(prog(t, 1.5, 2.15)), s = 1.06 - 0.06 * out3(prog(t, 1.5, 3.5)), bob = Math.sin(t * 1.3) * 4;
    c.save(); c.translate(W / 2, H); c.scale(s, s); c.translate(-W / 2, -H + bob);
    c.save(); c.beginPath(); c.rect(0, 0, W, sy); c.clip();
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.filter = 'blur(28px)'; c.drawImage(RIM, PX - 60, PY - 60); c.filter = 'none'; c.globalAlpha = 0.9; c.drawImage(RIM, PX - 60 - 4, PY - 60 - 2); c.restore();
    c.drawImage(PORT, PX, PY); c.restore();
    if (t < 2.25) { const k = prog(t, 1.5, 2.15); c.fillStyle = `rgba(200,250,255,${0.9 * (1 - k * 0.6)})`; c.fillRect(0, sy, W, 2); const g = c.createLinearGradient(0, sy - 160, 0, sy); g.addColorStop(0, 'rgba(92,225,230,0)'); g.addColorStop(1, 'rgba(92,225,230,0.18)'); c.fillStyle = g; c.fillRect(0, sy - 160, W, 160); }
    c.restore(); }
  function pin(c, x, y, label, sub, t, T, T1, side = 1, col = ACC) { if (t < T || t > T1) return; const k = out3(prog(t, T, T + 0.5)), o = 1 - out3(prog(t, T1 - 0.3, T1)); c.save(); c.globalAlpha = k * o;
    c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 10 + 3 * Math.sin(t * 4), 0, TAU); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill();
    const lx = x + side * 70, ly = y - 56, ex = lx + side * 40 * k; c.beginPath(); c.moveTo(x + side * 8, y - 8); c.lineTo(lx, ly); c.lineTo(ex, ly); c.stroke();
    c.fillStyle = 'rgba(8,11,16,0.7)'; const lw = Math.max(tw(c, label, MONO(600, 20), 3), tw(c, sub, MONO(500, 15), 2)) + 24; c.fillRect(side > 0 ? ex + 4 : ex - 4 - lw, ly - 22, lw, 54);
    txt(c, label, ex + side * 16, ly - 4, MONO(600, 20), TX, side > 0 ? 'left' : 'right', 'middle', 3); txt(c, sub, ex + side * 16, ly + 20, MONO(500, 15), TX2, side > 0 ? 'left' : 'right', 'middle', 2); c.restore(); }
  function pins(c, t) { pin(c, 640, 740, 'CREATOR', 'YOUTUBE · @THEE_KAL_EL', t, 2.6, 4.95, 1); pin(c, 400, 1020, 'BLOCKCHAIN', 'WEB3 · CRYPTO · DEFI', t, 3.1, 4.95, -1, AMB); pin(c, 700, 1180, 'HOST', 'BLOCKCHAIN 101', t, 3.6, 4.95, 1); }
  function kinetic(c, t) { if (t < 4.95 || t > 7.6) return; const o = 1 - out3(prog(t, 7.25, 7.55)); c.save(); c.globalAlpha = o;
    const g = c.createLinearGradient(0, 960, 0, H); g.addColorStop(0, 'rgba(5,7,10,0)'); g.addColorStop(0.18, 'rgba(5,7,10,0.72)'); g.addColorStop(1, 'rgba(5,7,10,0.85)'); c.fillStyle = g; c.fillRect(0, 960, W, H - 960);
    const fs = 104; reveal(c, 'Decoding', 70, 1150, F(600, fs), TX, t, 5.0, 'left', -2, 0.45); reveal(c, 'the', 70 + tw(c, 'Decoding ', F(600, fs), -2), 1150, F(600, fs), TX, t, 5.5, 'left', -2, 0.45);
    reveal(c, 'decentralized', 70, 1265, F(600, fit(c, 'decentralized', 600, fs, W - 220, -2)), TX, t, 6.0, 'left', -2, 0.45);
    reveal(c, 'future.', 70, 1380, F(600, fs), AMB, t, 6.5, 'left', -2, 0.45);
    c.fillStyle = rgba(ACC, 0.9); c.fillRect(70, 1080, 120 * out3(prog(t, 5, 5.4)), 2); c.restore(); }
  function endCard(c, t) { if (t < 7.5) return; const g = c.createLinearGradient(0, 940, 0, H); g.addColorStop(0, 'rgba(5,7,10,0)'); g.addColorStop(0.2, 'rgba(5,7,10,0.78)'); g.addColorStop(1, 'rgba(5,7,10,0.9)'); c.save(); c.globalAlpha = out3(prog(t, 7.5, 7.9)); c.fillStyle = g; c.fillRect(0, 940, W, H - 940); c.restore();
    reveal(c, 'FOLLOW', 70, 1105, MONO(600, 22), ACC, t, 7.6, 'left', 10);
    reveal(c, '@THEE_KAL_EL', 70, 1185, F(600, fit(c, '@THEE_KAL_EL', 600, 104, W - 220, -2)), TX, t, 7.75, 'left', -2, 0.7);
    c.fillStyle = rgba(ACC, 0.9); c.fillRect(70, 1250, (W - 300) * out3(prog(t, 8.0, 8.8)), 2);
    reveal(c, 'Blockchain, decoded.', 70, 1305, F(500, 44), AMB, t, 8.2, 'left');
    reveal(c, 'YOUTUBE · TIKTOK · INSTAGRAM · TWITCH · KICK', 70, 1380, MONO(500, Math.min(22, 22 * (W - 230) / tw(c, 'YOUTUBE · TIKTOK · INSTAGRAM · TWITCH · KICK', MONO(500, 22), 4))), TX2, t, 8.6, 'left', 4);
    const fo = prog(t, 9.6, 10); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); } }
  function hud(c, t) { const a = clamp((t - 0.1) * 2) * (1 - prog(t, 9.6, 10)); c.save(); c.globalAlpha = a; ticks(c, 44, 200, W - 88, 1340, 'rgba(232,238,245,0.32)', 18);
    txt(c, 'THEE_KAL_EL', 70, 232, MONO(600, 17), TX, 'left', 'middle', 4); txt(c, 'CREATOR REEL', 70 + tw(c, 'THEE_KAL_EL', MONO(600, 17), 4) + 18, 232, MONO(500, 17), TX3, 'left', 'middle', 4);
    const ff = Math.floor((t % 1) * 60); txt(c, `00:${String(Math.floor(t)).padStart(2, '0')}:${String(ff).padStart(2, '0')}`, W - 70, 232, MONO(500, 16), TX3, 'right', 'middle', 2);
    c.fillStyle = (Math.floor(t * 2) % 2) ? '#FF4D5E' : 'rgba(255,77,94,0.3)'; c.beginPath(); c.arc(W - 70 - tw(c, '00:00:00', MONO(500, 16), 2) - 18, 232, 5, 0, TAU); c.fill(); c.restore(); }

  // ---------- finishing ----------
  const CUTS = [1.5, 5, 5.5, 6, 6.5, 7.5];
  let GRAIN = null, GLOW = null;
  function finish(c, t) {
    for (const T of CUTS) if (t >= T && t < T + 0.22) { const k = 1 - (t - T) / 0.22; c.fillStyle = `rgba(200,250,255,${0.07 * k})`; c.fillRect(0, 0, W, H); }
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 10; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalAlpha = 0.6; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const vg = c.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, H * 0.85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  }
  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.letterSpacing = '0px'; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    const wr = W3().render(t, worldState(t)); c.drawImage(wr.canvas, 0, 0, W, H);
    if (!GLOW) { GLOW = document.createElement('canvas'); GLOW.width = 135; GLOW.height = 240; } GLOW.getContext('2d').drawImage(wr.canvas, 0, 0, 135, 240);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; c.drawImage(GLOW, 0, 0, W, H); c.restore();
    // micro push on beats after the drop
    let kick = 0; for (let b = 2; b < 10; b += 0.5) kick = Math.max(kick, t >= b ? Math.exp(-(t - b) * 14) : 0); const z = 1 + 0.008 * kick * (t > 1.5 ? 1 : 0);
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
    intro(c, t); nameBack(c, t); portrait(c, t); pins(c, t); kinetic(c, t); endCard(c, t); c.restore();
    hud(c, t); finish(c, t);
  }
  window.FILM = { W, H, FPS, DUR, renderAt };
  const waitW = new Promise((res) => { const chk = () => (window.WORLD ? res() : setTimeout(chk, 20)); chk(); });
  window.FILM.ready = Promise.all([waitW, IMG.decode().then(prep), document.fonts.load(F(500, 40)), document.fonts.load(F(600, 40)), document.fonts.load(MONO(500, 20)), document.fonts.load(MONO(600, 20))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
