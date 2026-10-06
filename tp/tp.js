// TELEPARTY — 15s hype promo, 1920x1080 @ 60fps, cut to 120 BPM.
// 0–1 four friends, four screens, out of sync → 1.0 SNAP: synced · 1–2.5 the screens merge, wordmark slams
// 2.5–6 the watch party: synced playback, group chat with the real profile icons, host pause/play · 6–10.5 MAKE IT
// YOURS: the site's customize flow, animated (nickname typed, icon grid, pick, toggle, Start the party → icon blast)
// 10.5–12.5 beat-cut montage · 12.5–15 end card with Install Teleparty. renderAt(t) is deterministic.
(() => {
  'use strict';
  const K = window.KIT, { TAU, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, rr, hash } = K;
  const W = 1920, H = 1080, FPS = 60, DUR = 15, BT = 0.5;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const RED = '#E8384F', PUR = '#A35BC9', DK = '#141414', CARD = '#262626', LINE = '#3A3A3A', LIGHT = '#F7F7F7', GOLD = '#F5C518';
  const D = (s, w = 800) => `${w} ${s}px "Inter Tight", sans-serif`, G = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`;
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const ICONS = Array.from({ length: 20 }, (_, i) => `icon${String(i).padStart(2, '0')}`);
  const ease = (t, a, b, f = io3) => f(prog(t, a, b)), pulse = (t, T, k = 12) => (t >= T ? Math.exp(-(t - T) * k) : 0), oexp = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  const grad = (c, x0, x1) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, RED); g.addColorStop(1, PUR); return g; };
  function icon(c, i, x, y, r) { const im = IMG[ICONS[((i % 20) + 20) % 20]]; if (im) c.drawImage(im, x - r, y - r, r * 2, r * 2); }
  function cursor(c, x, y, press = 0) { c.save(); c.translate(x, y); c.scale(1.8 - press * 0.25, 1.8 - press * 0.25); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.lineTo(6, 16.5); c.lineTo(10, 25); c.lineTo(13.5, 23.5); c.lineTo(9.5, 15); c.lineTo(17, 15); c.closePath(); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1.5; c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 8; c.fill(); c.stroke(); c.restore(); }
  function slam(c, s, x, y, size, k, col = '#fff') { c.save(); c.font = D(size); c.letterSpacing = `${-size * 0.03}px`; const mw = c.measureText(s).width; if (mw > W * 0.9) { size *= W * 0.9 / mw; c.font = D(size); } c.textAlign = 'center'; c.textBaseline = 'middle';
    c.globalCompositeOperation = 'lighter'; const o = 12 * (1 - k); c.fillStyle = rgba(RED, 0.8); c.fillText(s, x - o, y); c.fillStyle = rgba(PUR, 0.8); c.fillText(s, x + o, y); c.globalCompositeOperation = 'source-over'; c.fillStyle = col; c.fillText(s, x, y); c.restore(); }
  function wordmark(c, x, y, size, k = 1) { c.save(); c.translate(x, y); c.scale(lerp(1.6, 1, k), lerp(1.6, 1, k)); c.font = D(size); c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = `${-size * 0.035}px`; const w = c.measureText('Teleparty').width; c.fillStyle = grad(c, -w / 2, w / 2); c.shadowColor = rgba(RED, 0.45); c.shadowBlur = size * 0.25; c.fillText('Teleparty', 0, 0); c.restore(); }
  function burst(c, x, y, t, t0, n = 60) { const d = t - t0; if (d < 0 || d > 1.3) return; for (let i = 0; i < n; i++) { const a = hash(i, 7) * TAU, v = 400 + hash(i, 8) * 900, px = x + Math.cos(a) * v * d, py = y + Math.sin(a) * v * d * 0.8 + 600 * d * d, s = (6 + hash(i, 9) * 9) * (1 - d / 1.3);
    c.save(); c.translate(px, py); c.rotate(d * 9 + i); c.globalAlpha = 1 - d / 1.3; c.fillStyle = [RED, PUR, GOLD, '#fff', '#5BC0EB'][i % 5]; c.fillRect(-s, -s * 0.45, s * 2, s * 0.9); c.restore(); } }

  // ---------- the "movie" (procedural, so nothing copyrighted plays on screen) ----------
  function movie(c, x, y, w, h, tm, paused = false) {
    c.save(); rr(c, x, y, w, h, 16); c.clip();
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#1B1035'); g.addColorStop(0.55, '#7A2A6B'); g.addColorStop(1, '#F07A4A'); c.fillStyle = g; c.fillRect(x, y, w, h);
    const sx = x + w * 0.62, sy = y + h * 0.62; const sg = c.createRadialGradient(sx, sy, 0, sx, sy, h * 0.32); sg.addColorStop(0, '#FFE6A8'); sg.addColorStop(0.5, '#FFB36B'); sg.addColorStop(1, 'rgba(255,140,80,0)'); c.fillStyle = sg; c.fillRect(x, y, w, h);
    for (let L = 0; L < 3; L++) { c.fillStyle = ['#3B1748', '#26102F', '#120818'][L]; c.beginPath(); c.moveTo(x, y + h); for (let i = 0; i <= 24; i++) { const u = i / 24, px = x + u * w; c.lineTo(px, y + h * (0.62 + L * 0.1) - Math.abs(Math.sin(u * 7 + L * 2 + tm * (0.1 + L * 0.08))) * h * (0.16 - L * 0.03)); } c.lineTo(x + w, y + h); c.closePath(); c.fill(); }
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.5 * hash(i, 2)})`; c.fillRect(x + hash(i, 1) * w, y + hash(i, 3) * h * 0.45, 2, 2); }
    if (paused) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x, y, w, h); c.fillStyle = '#fff'; const s = Math.min(w, h) * 0.08; c.fillRect(x + w / 2 - s * 0.9, y + h / 2 - s, s * 0.6, s * 2); c.fillRect(x + w / 2 + s * 0.3, y + h / 2 - s, s * 0.6, s * 2); }
    c.restore();
  }
  function controls(c, x, y, w, prog01, paused, dots) { c.fillStyle = 'rgba(255,255,255,0.25)'; rr(c, x, y, w, 6, 3); c.fill(); c.fillStyle = RED; rr(c, x, y, w * prog01, 6, 3); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x + w * prog01, y + 3, 9, 0, TAU); c.fill(); (dots || []).forEach((i, k) => { c.save(); c.beginPath(); c.arc(x + w * prog01 + (k - (dots.length - 1) / 2) * 0, y - 22 - k * 0, 0, 0, 0); c.restore(); }); }

  // ---------- S1 out of sync → SYNCED (0–1.0) and merge (1–2.5) ----------
  const FRIENDS = [['Raymond', 3, -0.18], ['Maya', 0, 0.12], ['Jordan', 9, -0.05], ['Priya', 17, 0.2]];
  function hook(c, t) {
    if (t > 2.6) return; c.fillStyle = DK; c.fillRect(0, 0, W, H);
    const merge = ease(t, 1.45, 2.1, io5), synced = t >= 1.0;
    FRIENDS.forEach(([name, ic, off], i) => {
      const gx = i % 2, gy = Math.floor(i / 2), w0 = 780, h0 = 400, x0 = 150 + gx * 840, y0 = 110 + gy * 470;
      const x = lerp(x0, 260, merge), y = lerp(y0, 150, merge), w = lerp(w0, 1400, merge), h = lerp(h0, 700, merge);
      const shake = !synced ? Math.sin(t * 40 + i) * 2 : 0, pk = pop(prog(t, 0.05 + i * 0.07, 0.5 + i * 0.07)); if (pk <= 0) return;
      c.save(); c.translate(x + w / 2 + shake, y + h / 2); c.scale(pk, pk); c.translate(-w / 2, -h / 2); c.globalAlpha = merge > 0 && i > 0 ? 1 - merge : 1;
      c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40; rr(c, -8, -8, w + 16, h + 16, 22); c.fillStyle = CARD; c.fill(); c.shadowBlur = 0;
      const tm = synced ? 1.2 + (t - 1.0) : t + off * 6; movie(c, 0, 0, w, h, tm);
      const p = synced ? 0.42 + (t - 1.0) * 0.004 : 0.42 + off; controls(c, 30, h - 40, w - 60, clamp(p), false);
      icon(c, ic, 50, 50, 30); txt(c, name, 92, 50, G(700, 26), '#fff');
      const lbl = synced ? 'SYNCED' : ['12:04', '12:31', '11:58', '12:17'][i]; c.font = G(800, 22); const lw = c.measureText(lbl).width + 40; rr(c, w - lw - 24, 28, lw, 44, 22); c.fillStyle = synced ? '#22C55E' : 'rgba(0,0,0,0.55)'; c.fill(); txt(c, lbl, w - lw / 2 - 24, 51, G(800, 22), '#fff', 'center', 'middle', 2);
      c.restore();
    });
    if (t < 1.0) { const k = A(t, 0.2, 0.3); c.save(); c.globalAlpha = k; txt(c, 'Movie night… miles apart?', W / 2, 1040, G(700, 34), '#BDBDBD', 'center'); c.restore(); }
    if (t >= 1.0 && t < 1.5) { const k = crit(prog(t, 1.0, 1.15)); slam(c, 'SYNCED.', W / 2, H / 2, lerp(330, 260, k), k); }
    if (t >= 1.5) { const k = crit(prog(t, 1.6, 1.9)); c.save(); c.fillStyle = `rgba(20,20,20,${0.55 * k})`; c.fillRect(0, 0, W, H); c.restore(); wordmark(c, W / 2, H / 2 - 30, 230, k); const sk = A(t, 1.9, 0.3); c.save(); c.globalAlpha = sk; txt(c, 'A new way to watch TV together', W / 2, H / 2 + 120, G(700, 50), '#fff', 'center'); c.globalAlpha = A(t, 2.1, 0.3); txt(c, 'formerly Netflix Party', W / 2, H / 2 + 190, G(600, 28), '#9A9A9A', 'center', 'middle', 2); c.restore(); }
  }

  // ---------- S2 the watch party (2.5–6) ----------
  const CHAT = [[2.9, 3, 'Raymond', 'no spoilers!!'], [3.3, 0, 'Maya', 'popcorn ready'], [3.75, 9, 'Jordan', 'PAUSE I need snacks'], [4.55, 17, 'Priya', 'okay go go go'], [5.0, 11, 'Sam', 'THIS SCENE'], [5.45, 6, 'Alex', 'ep 2 after this?']];
  function party(c, t) {
    if (t < 2.45 || t > 6.15) return; c.fillStyle = DK; c.fillRect(0, 0, W, H);
    const inK = ease(t, 2.45, 2.8, io5), ex = ease(t, 5.85, 6.1, io5); c.save(); c.translate(-ex * W, 0);
    const paused = t > 3.8 && t < 4.3, mx = 70, my = 120, mw = 1260, mh = 720, tm = 2 + (paused ? 3.8 - 2.5 : t - 2.5 - (t > 4.3 ? 0.5 : 0));
    c.save(); c.globalAlpha = inK; rr(c, mx - 10, my - 60, mw + 20, mh + 160, 24); c.fillStyle = CARD; c.fill();
    c.fillStyle = '#FF5F57'; c.beginPath(); c.arc(mx + 22, my - 30, 9, 0, TAU); c.fill(); c.fillStyle = '#FEBC2E'; c.beginPath(); c.arc(mx + 52, my - 30, 9, 0, TAU); c.fill(); c.fillStyle = '#28C840'; c.beginPath(); c.arc(mx + 82, my - 30, 9, 0, TAU); c.fill();
    movie(c, mx, my, mw, mh, tm, paused); controls(c, mx + 30, my + mh + 44, mw - 60, 0.42 + (tm - 2) * 0.01, paused);
    [3, 0, 9, 17, 11, 6].forEach((ic, k) => { c.save(); c.beginPath(); c.arc(mx + 30 + (mw - 60) * (0.42 + (tm - 2) * 0.01), my + mh + 47, 0, 0, 0); c.restore(); icon(c, ic, mx + 60 + k * 58, my + mh + 90, 24); });
    txt(c, '6 watching · in sync', mx + 430, my + mh + 90, G(600, 26), '#BDBDBD');
    c.restore();
    // chat sidebar
    const sx = 1380, sw = 470; c.save(); c.globalAlpha = inK; c.translate((1 - inK) * 200, 0); rr(c, sx, my - 60, sw, mh + 160, 24); c.fillStyle = CARD; c.fill(); txt(c, 'Teleparty chat', sx + 30, my - 20, G(800, 28), '#fff');
    c.fillStyle = LINE; c.fillRect(sx + 24, my + 12, sw - 48, 2);
    const shown = CHAT.filter(([t0]) => t >= t0); let y = my + 60;
    const events = [[3.8, 'Jordan paused the video', RED], [4.3, 'Raymond played the video', '#22C55E']].filter(([t0]) => t >= t0);
    const rows = [...shown.map((m) => ({ k: 'm', t0: m[0], m })), ...events.map((e) => ({ k: 'e', t0: e[0], e }))].sort((a, b) => a.t0 - b.t0);
    rows.slice(-7).forEach((r) => { const k = io5(prog(t, r.t0, r.t0 + 0.25)); c.save(); c.globalAlpha *= k; c.translate((1 - k) * 60, 0);
      if (r.k === 'm') { const [, ic, who, msg] = r.m; icon(c, ic, sx + 56, y + 26, 26); txt(c, who, sx + 96, y + 12, G(700, 22), '#BDBDBD'); rr(c, sx + 96, y + 26, Math.min(sw - 130, 30 + msg.length * 14), 44, 16); c.fillStyle = '#3A3A3A'; c.fill(); txt(c, msg, sx + 112, y + 49, G(600, 24), '#fff'); y += 96; }
      else { const [, s, col] = r.e; c.font = G(700, 22); const w = c.measureText(s).width + 40; rr(c, sx + sw / 2 - w / 2, y, w, 40, 20); c.fillStyle = rgba(col, 0.18); c.fill(); txt(c, s, sx + sw / 2, y + 21, G(700, 22), col, 'center'); y += 62; }
      c.restore(); });
    rr(c, sx + 24, my + mh + 30, sw - 48, 60, 18); c.strokeStyle = LINE; c.lineWidth = 2; c.stroke(); txt(c, 'Type a message…', sx + 48, my + mh + 61, G(500, 24), '#7A7A7A');
    c.restore();
    // phone joins the party, in sync with the desktop
    const ph = ease(t, 4.85, 5.2, io5); if (ph > 0) { const px = lerp(1500, 1040, ph), py = 330, pw = 270, phh = 540; c.save(); c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 50; rr(c, px, py, pw, phh, 38); c.fillStyle = '#0B0B0B'; c.fill(); c.shadowBlur = 0; rr(c, px, py, pw, phh, 38); c.strokeStyle = '#444'; c.lineWidth = 3; c.stroke();
      movie(c, px + 14, py + 50, pw - 28, 150, tm, paused); [[3, 'no spoilers!!'], [9, 'PAUSE I need snacks'], [17, 'okay go go go']].forEach(([ic, m], k) => { icon(c, ic, px + 36, py + 250 + k * 70, 16); rr(c, px + 60, py + 236 + k * 70, 190, 30, 12); c.fillStyle = '#2E2E2E'; c.fill(); txt(c, m, px + 70, py + 252 + k * 70, G(600, 15), '#fff'); });
      rr(c, px + 14, py + phh - 64, pw - 28, 40, 14); c.strokeStyle = '#3A3A3A'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#22C55E'; rr(c, px + pw / 2 - 40, py + 16, 80, 22, 11); c.fill(); txt(c, 'HD', px + pw / 2, py + 28, G(800, 14), '#fff', 'center'); c.restore(); }
    // floating hearts from the chat
    for (let i = 0; i < 10; i++) { const ph = ((t * 0.6 + i / 10) % 1), x = 1300 + Math.sin(ph * 7 + i) * 50, y2 = 900 - ph * 600, s = 18 * (1 - ph * 0.4); if (t < 4.6) continue; c.save(); c.globalAlpha = (1 - ph) * ease(t, 4.6, 4.9); c.fillStyle = i % 2 ? RED : PUR; c.translate(x, y2); c.beginPath(); c.moveTo(0, s * 0.35); c.bezierCurveTo(-s, -s * 0.4, -s * 0.5, -s * 1.1, 0, -s * 0.5); c.bezierCurveTo(s * 0.5, -s * 1.1, s, -s * 0.4, 0, s * 0.35); c.fill(); c.restore(); }
    // feature tags
    [[2.6, 3.15, 'SYNCED PLAYBACK'], [3.2, 3.75, 'GROUP CHAT'], [3.8, 4.85, 'ONE PAUSE. EVERYONE PAUSES.'], [4.9, 5.85, 'SYNC IN HD · DESKTOP + MOBILE']].forEach(([t0, t1, s]) => { if (t < t0 || t > t1) return; const k = io5(prog(t, t0, t0 + 0.2)), o = prog(t, t1 - 0.15, t1); c.save(); c.globalAlpha = 1 - o; c.font = D(54); const w = c.measureText(s).width + 70; c.translate(mx + 40, my + 40); c.scale(lerp(1.3, 1, k), lerp(1.3, 1, k)); rr(c, 0, 0, w, 90, 45); c.fillStyle = grad(c, 0, w); c.fill(); txt(c, s, 35, 47, D(54), '#fff'); c.restore(); });
    c.restore();
  }

  // ---------- S3 MAKE IT YOURS (6–10.5) — the site's customize section, animated ----------
  const GX = [0, 1, 2, 3], GY = [0, 1, 2, 3, 4];
  function custom(c, t) {
    if (t < 5.85 || t > 10.6) return; const inK = ease(t, 5.85, 6.15, io5); c.save(); c.translate((1 - inK) * W, 0);
    c.fillStyle = LIGHT; c.fillRect(0, 0, W, H);
    // left copy (from the site)
    const k1 = oexp(prog(t, 6.15, 6.6)); c.save(); c.globalAlpha = k1; txt(c, 'MAKE IT YOURS', 120, 330, G(600, 26), '#6B6B6B', 'left', 'middle', 2); c.restore();
    const title = 'Customize your Teleparty'; const n = Math.floor(clamp(prog(t, 6.2, 6.9)) * title.length); txt(c, title.slice(0, n), 120, 420, D(68), '#141414');
    const k2 = A(t, 6.8, 0.4); c.save(); c.globalAlpha = k2; ['Customize your Teleparty by choosing a fun user', 'icon and nickname. Choose from a large array', 'of themed icons and make the experience yours!'].forEach((s, i) => txt(c, s, 120, 510 + i * 48, G(400, 34), '#333')); c.restore();
    // panels (scaled up recreation of the screenshot UI)
    const S = 1.5, ox = 1090, oy = 200, pk = oexp(prog(t, 6.3, 6.8)); c.save(); c.translate(ox, oy + (1 - pk) * 80); c.globalAlpha = pk; c.scale(S, S);
    // nickname card
    rr(c, 0, 0, 255, 110, 8); c.fillStyle = CARD; c.fill(); txt(c, 'Set a nickname', 16, 24, G(700, 15), '#fff'); c.fillStyle = '#555'; c.fillRect(16, 42, 222, 1.5);
    rr(c, 16, 52, 222, 42, 6); c.fillStyle = '#1C1C1C'; c.fill(); const nick = 'My name is Raymond', nn = Math.floor(clamp(prog(t, 6.6, 7.3)) * nick.length); txt(c, nick.slice(0, nn) + (t < 7.4 && Math.floor(t * 4) % 2 ? '|' : ''), 28, 73, G(500, 13), '#ddd');
    // profile card
    rr(c, 0, 120, 255, 212, 8); c.fillStyle = CARD; c.fill(); const picked = t >= 7.85, pic = picked ? 3 : -1;
    c.save(); c.beginPath(); c.arc(38, 156, 21, 0, TAU); c.fillStyle = '#444'; c.fill(); c.restore(); if (picked) { const pp = pop(prog(t, 7.85, 8.2)); c.save(); c.translate(38, 156); c.scale(pp, pp); icon(c, pic, 0, 0, 21); c.restore(); }
    txt(c, nn >= nick.length ? 'Raymond' : '', 72, 156, G(700, 16), '#fff'); c.fillStyle = '#555'; c.fillRect(16, 188, 222, 1.5);
    txt(c, 'Create a Teleparty', 16, 212, G(700, 15), '#fff'); txt(c, 'Only I have control', 16, 240, G(500, 12), '#BDBDBD');
    const on = ease(t, 8.55, 8.7, io5); rr(c, 196, 230, 42, 22, 11); c.fillStyle = on > 0.5 ? RED : '#555'; c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(lerp(207, 227, on), 241, 9, 0, TAU); c.fill();
    const bp = t > 9.15 && t < 9.32 ? 0.95 : 1; c.save(); c.translate(127, 290); c.scale(bp, bp); rr(c, -111, -20, 222, 40, 8); c.fillStyle = grad(c, -111, 111); c.fill(); txt(c, 'Start the party', 0, 1, G(600, 14), '#fff', 'center'); c.restore();
    // icon grid card
    rr(c, 265, 0, 268, 378, 8); c.fillStyle = CARD; c.fill(); txt(c, 'Choose a profile picture', 281, 24, G(700, 15), '#fff'); c.fillStyle = '#555'; c.fillRect(281, 42, 236, 1.5);
    const blast = ease(t, 9.3, 10.3, io3);
    GY.forEach((gy) => GX.forEach((gx) => { const i = gy * 4 + gx, k = pop(prog(t, 6.75 + i * 0.035, 7.2 + i * 0.035)); if (k <= 0) return; let x = 307 + gx * 62, y = 70 + gy * 62;
      if (blast > 0) { const a = hash(i, 3) * TAU, d = blast * (400 + hash(i, 4) * 500); x += Math.cos(a) * d; y += Math.sin(a) * d - blast * 120; }
      c.save(); c.translate(x, y); const sel = i === 3 && t > 7.8 && blast === 0; c.scale(k * (sel ? 1.12 : 1) * (1 + blast * 1.5), k * (sel ? 1.12 : 1) * (1 + blast * 1.5)); c.rotate(blast * (hash(i, 5) - 0.5) * 6); icon(c, i, 0, 0, 27);
      if (sel) { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.stroke(); } c.restore(); }));
    c.restore();
    // pencil + gradient underline (as on the site)
    const ul = ease(t, 6.5, 7.2); if (ul > 0) { c.save(); c.globalAlpha = pk; const x0 = ox + 140 * S, y0 = oy + 388 * S, x1 = x0 + 480 * S * ul; c.fillStyle = grad(c, x0, x0 + 480 * S); rr(c, x0, y0, x1 - x0, 6, 3); c.fill(); if (IMG.pencil) c.drawImage(IMG.pencil, x1 - 250, y0 - 170, 290, 200); c.restore(); }
    // cursor: pick the cookie → toggle → start the party
    const P = (u, v) => [ox + u * S, oy + v * S]; let cx, cy, pr = 0;
    if (t > 7.35) { const a = P(420, 330), b = P(493, 70), d = P(217, 241), e = P(127, 290); if (t < 7.85) { const k = io5(prog(t, 7.35, 7.8)); cx = lerp(a[0], b[0], k); cy = lerp(a[1], b[1], k); pr = t > 7.75 ? 1 : 0; } else if (t < 8.6) { const k = io5(prog(t, 8.05, 8.5)); cx = lerp(b[0], d[0], k); cy = lerp(b[1], d[1], k); pr = t > 8.48 ? 1 : 0; } else { const k = io5(prog(t, 8.7, 9.1)); cx = lerp(d[0], e[0], k); cy = lerp(d[1], e[1], k); pr = t > 9.12 && t < 9.32 ? 1 : 0; } if (t < 9.6) cursor(c, cx + 6, cy + 6, pr); }
    burst(c, ox + 127 * S, oy + 290 * S, t, 9.3, 80);
    const sk = crit(prog(t, 9.3, 9.45)); if (t > 9.3) { c.save(); c.globalAlpha = 1 - prog(t, 10.2, 10.5); c.translate(W / 2, H / 2); c.rotate(-0.04); const bw = W * 1.3 * io5(prog(t, 9.3, 9.45)); c.fillStyle = grad(c, -bw / 2, bw / 2); c.fillRect(-bw / 2, -130, bw, 260); c.rotate(0.04); slam(c, 'START THE PARTY', 0, 0, lerp(200, 160, sk), sk); c.restore(); }
    c.restore();
  }

  // ---------- S4 montage (10.5–12.5) ----------
  const MONT = [['WATCH.', RED], ['CHAT.', PUR], ['IN HD.', '#141414'], ['TOGETHER.', RED]];
  function montage(c, t) {
    if (t < 10.5 || t >= 12.5) return; const i = Math.min(3, Math.floor((t - 10.5) / 0.5)), lt = t - 10.5 - i * 0.5, [w, col] = MONT[i];
    c.fillStyle = col; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 26; k++) { const a = k / 26 * TAU + t * 0.8 * (k % 2 ? 1 : -1), r = 380 + (k % 3) * 160 + lt * 200, x = W / 2 + Math.cos(a) * r * 1.4, y = H / 2 + Math.sin(a) * r * 0.7; icon(c, k + i * 5, x, y, 46 + (k % 3) * 12); }
    const k = crit(prog(lt, 0, 0.12)); slam(c, w, W / 2, H / 2, lerp(380, 300, k), k);
    if (i === 3 && lt > 0.1) { const hk = A(lt, 0.1, 0.15); c.save(); c.globalAlpha = hk; txt(c, 'HOST A WATCH PARTY ON', W / 2, H / 2 + 190, G(800, 28), '#fff', 'center', 'middle', 6); c.restore();
      const SV = ['Netflix', 'YouTube', 'Disney+', 'HBO Max', 'Hulu', 'Amazon Prime']; c.font = G(800, 34); const ws = SV.map((s) => c.measureText(s).width + 56), tot = ws.reduce((a, b) => a + b, 0) + 20 * (SV.length - 1); let x = W / 2 - tot / 2;
      SV.forEach((s, j) => { const kk = pop(prog(lt, 0.12 + j * 0.04, 0.4 + j * 0.04)); if (kk > 0) { c.save(); c.translate(x + ws[j] / 2, H / 2 + 270); c.scale(kk, kk); rr(c, -ws[j] / 2, -34, ws[j], 68, 34); c.fillStyle = '#141414'; c.fill(); txt(c, s, 0, 2, G(800, 34), '#fff', 'center'); c.restore(); } x += ws[j] + 20; }); }
  }

  // ---------- S5 end card (12.5–15) ----------
  function endCard(c, t) {
    if (t < 12.5) return; c.fillStyle = DK; c.fillRect(0, 0, W, H);
    const rg = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 900); rg.addColorStop(0, rgba(PUR, 0.25)); rg.addColorStop(1, rgba(RED, 0)); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 20; k++) { const a = k / 20 * TAU + (t - 12.5) * 0.5, rk = pop(prog(t, 12.55 + k * 0.02, 13.0 + k * 0.02)); if (rk <= 0) continue; icon(c, k, W / 2 + Math.cos(a) * 840 * rk, H / 2 + 10 + Math.sin(a) * 470 * rk, 44); }
    wordmark(c, W / 2, H / 2 - 90, 220, crit(prog(t, 12.55, 12.85)));
    const sk = A(t, 12.85, 0.35); c.save(); c.globalAlpha = sk; txt(c, 'A new way to watch TV together', W / 2, H / 2 + 40, G(700, 50), '#fff', 'center'); c.restore();
    const bk = pop(prog(t, 13.1, 13.5)); if (bk > 0) { const pr = t > 13.78 && t < 13.92 ? 1 : 0, p = 1 + 0.04 * pulse(t, Math.floor(t * 2) / 2, 9); c.save(); c.translate(W / 2, H / 2 + 190); c.scale(bk * p * (1 - pr * 0.05), bk * p * (1 - pr * 0.05)); c.shadowColor = rgba(RED, 0.5); c.shadowBlur = 50; rr(c, -290, -50, 580, 100, 14); c.fillStyle = grad(c, -290, 290); c.fill(); c.shadowBlur = 0; txt(c, 'Get Teleparty for free!', 0, 2, G(700, 40), '#fff', 'center'); c.restore();
      if (t < 14.2) { const k = io5(prog(t, 13.35, 13.75)); cursor(c, lerp(W / 2 + 380, W / 2 + 70, k), lerp(H / 2 + 420, H / 2 + 210, k), pr); }
      burst(c, W / 2, H / 2 + 190, t, 13.85, 70); c.save(); c.globalAlpha = bk; txt(c, '*Available on Chrome, Edge, & Safari Browsers', W / 2, H / 2 + 290, G(500, 28), '#9A9A9A', 'center'); txt(c, 'teleparty.com', W / 2, H / 2 + 345, G(700, 32), '#E0E0E0', 'center', 'middle', 2); c.restore(); }
  }

  // ---------- finishing ----------
  const HITS = [1.0, 1.6, 2.5, 3.8, 6.0, 9.3, 10.5, 11.0, 11.5, 12.0, 12.5, 13.85];
  let BUF = null;
  function finish(c, t) {
    let h = 0; for (const T0 of HITS) h = Math.max(h, pulse(t, T0, 14));
    if (h > 0.05) { if (!BUF) { BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; } const b = BUF.getContext('2d'); b.clearRect(0, 0, W, H); b.drawImage(cv, 0, 0); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 * h; c.drawImage(BUF, -14 * h, 0); c.drawImage(BUF, 14 * h, 0); c.restore(); c.fillStyle = `rgba(255,255,255,${0.2 * h})`; c.fillRect(0, 0, W, H); }
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.1); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.35)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    const fo = prog(t, 14.6, 15); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  }
  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.filter = 'none'; c.imageSmoothingQuality = 'high';
    let sh = 0; for (const T0 of HITS) sh = Math.max(sh, pulse(t, T0, 18) * 14); c.save(); c.translate((hash(Math.round(t * FPS), 3) - 0.5) * 2 * sh, (hash(Math.round(t * FPS), 4) - 0.5) * 2 * sh);
    hook(c, t); party(c, t); custom(c, t); montage(c, t); endCard(c, t); c.restore(); finish(c, t);
  }
  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(D(100)), document.fonts.load(G(700, 30)), document.fonts.load(G(500, 30)), ...ICONS.map((k) => load(k, `../assets/tp/${k}.png`)), load('pencil', '../assets/tp/pencil.png')]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
