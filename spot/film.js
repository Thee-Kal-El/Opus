// "BLOCKCHAIN RECORDS PRESENTS" — an 18s Spotify-style music-product film. 1920x1080 @ 60fps.
// Fully deterministic: every transform, opacity, mask and UI state is a pure function of absolute time t.
//   await window.seek(t)  renders the frame at t (with temporal subframe motion blur) into #c.
// No timers, no accumulated physics, no CSS transitions are involved in export.
(() => {
  'use strict';
  const W = 1920, H = 1080, FPS = 60, DUR = 18, TAU = Math.PI * 2;
  const SUBFRAMES = 4, SHUTTER = 0.5;                    // 4 temporal samples over a 180° shutter
  const S = { x: 192, y: 160, w: 1536, h: 810, r: 40 }; // the stage: 80% width, 75% height, slightly low
  const SCX = S.x + S.w / 2, SCY = S.y + S.h / 2;

  const TRACK = 'BLOCKCHAIN RECORDS PRESENTS', ARTIST = 'Thee_Kal_El', ALBUM = 'THE INTRO';
  const GREEN = '#1ED760', WHITE = '#FFFFFF', GRAY = '#A7A7A7', DIM = '#6F6F6F', STAGE = '#0A0A0A';
  const FONT = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`;

  const out = document.getElementById('c');
  const octx = out.getContext('2d');
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const frameCv = mk(W, H), fctx = frameCv.getContext('2d');

  // ---------- easing (no repeated bounce; one gentle overshoot only for the logo arrival) ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const crit = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const k = 7 * p; return (1 - (1 + k) * Math.exp(-k)) / (1 - 8 * Math.exp(-7)); }; // critically damped spring
  const arrive = (p) => { if (p <= 0) return 0; if (p >= 1) return 1; const z = 0.8, w = 10, wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * p) * (Math.cos(wd * p) + z / Math.sqrt(1 - z * z) * Math.sin(wd * p)); }; // ~1.5% overshoot
  const io3 = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const io5 = (p) => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2);
  const o3 = (p) => 1 - Math.pow(1 - p, 3);
  const A = (t, t0, dur, f = crit) => f(prog(t, t0, t0 + dur));
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };

  // ---------- assets ----------
  const COV = {};
  const loadImg = (src) => { const im = new Image(); im.src = src; return im.decode().then(() => im); };
  const ready = Promise.all([document.fonts.load(FONT(700, 40)), document.fonts.load(FONT(500, 40)), loadImg('../assets/socials_card.jpg')]).then(([, , hero]) => {
    COV.hero = ART.rounded(hero, 720, 0.03);
    COV.silk = ART.rounded(ART.silk(1024), 720, 0.03);
    for (const k of ['late', 'energy', 'focus', 'mix1', 'mix2', 'mix3', 'chill', 'throw', 'run']) COV[k] = ART.rounded(ART.sleeve(k), 600, 0.03);
    buildBackdrop(); buildUI();
  });

  // ---------- backdrop: atmospheric green outside the stage ----------
  let backdrop;
  function buildBackdrop() {
    backdrop = mk(W, H); const g = backdrop.getContext('2d');
    g.fillStyle = '#020604'; g.fillRect(0, 0, W, H);
    const blob = (x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
    blob(0, 0, 1500, '#1FCB6E', 0.95);      // luminous emerald, upper-left
    blob(260, 120, 700, '#5BF29C', 0.35);
    blob(W, 300, 1100, '#0E5A31', 0.85);    // deep forest toward the sides
    blob(0, 700, 900, '#0C4A28', 0.6);
    const fade = g.createLinearGradient(0, H * 0.45, 0, H); fade.addColorStop(0, 'rgba(1,4,2,0)'); fade.addColorStop(1, 'rgba(1,4,2,0.96)');
    g.fillStyle = fade; g.fillRect(0, 0, W, H);
    // restrained stage shadow
    g.save(); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 80; g.shadowOffsetY = 30;
    g.beginPath(); g.roundRect(S.x, S.y, S.w, S.h, S.r); g.fillStyle = STAGE; g.fill(); g.restore();
  }

  // ---------- primitives ----------
  function spotifyIcon(c, x, y, r, o = {}) {
    if (r <= 0.5) return;
    const fill = o.fill || GREEN, bar = o.bar || '#000000';
    c.save(); c.globalAlpha *= o.alpha ?? 1; c.translate(x, y);
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = fill; c.fill();
    c.strokeStyle = bar; c.lineCap = 'round';
    for (const [yy, lw, hs] of [[-0.24, 0.155, 0.56], [0.06, 0.125, 0.48], [0.33, 0.1, 0.4]]) {
      c.lineWidth = lw * r; c.beginPath();
      c.moveTo(-hs * r, (yy + 0.03) * r); c.quadraticCurveTo(-0.02 * r, (yy - 0.17) * r, hs * 0.96 * r, (yy + 0.1) * r); c.stroke();
    }
    c.restore();
  }
  function ellipsize(c, s, maxW) { if (c.measureText(s).width <= maxW) return s; while (s.length > 1 && c.measureText(s + '…').width > maxW) s = s.slice(0, -1); return s + '…'; }

  // Masked vertical text reveal. Comes up from below its own line box, leaves upward.
  function mtext(c, str, x, y, size, weight, color, t, tin, tout, o = {}) {
    const outDur = o.outDur ?? 0.16;
    if (t < tin || (tout != null && t >= tout + outDur)) return;
    const pin = A(t, tin, o.dur ?? 0.42);
    const pout = tout == null ? 0 : io3(prog(t, tout, tout + outDur));
    c.save(); c.font = FONT(weight, size); c.letterSpacing = (o.ls ?? -size * 0.02) + 'px'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    const w = c.measureText(str).width, x0 = o.align === 'left' ? x : x - w / 2;
    c.beginPath(); c.rect(x0 - 30, y - size * 1.02, w + 60, size * 1.36); c.clip();
    c.globalAlpha *= (o.alpha ?? 1) * clamp(pin * 1.8) * (1 - pout);
    c.fillStyle = color; c.fillText(str, x0, y + (1 - pin) * size * 1.15 - pout * size * 1.15);
    c.restore();
  }

  // Cover with optional perspective (rotY / rotX via strip projection) and in-plane rotation.
  function cover(c, img, x, y, size, o = {}) {
    const a = o.alpha ?? 1; if (a <= 0.003 || size < 1) return;
    const ry = o.ry || 0, rx = o.rx || 0, rz = o.rz || 0;
    c.save(); c.globalAlpha *= a; c.translate(x, y); if (rz) c.rotate(rz);
    if (o.shadow !== false) {
      c.save(); c.shadowColor = `rgba(0,0,0,${0.45 * (o.shadow ?? 1)})`; c.shadowBlur = size * 0.12; c.shadowOffsetY = size * 0.05;
      c.fillStyle = '#000'; c.beginPath(); c.roundRect(-size * 0.47 * Math.cos(ry), -size * 0.47, size * 0.94 * Math.cos(ry), size * 0.94, size * 0.03); c.fill(); c.restore();
    }
    persp(c, img, 0, 0, size, size, rx, ry);
    c.restore();
  }
  function persp(c, img, cx, cy, w, h, rx, ry) {
    const iw = img.width, ih = img.height;
    if (Math.abs(rx) < 1e-4 && Math.abs(ry) < 1e-4) { c.drawImage(img, cx - w / 2, cy - h / 2, w, h); return; }
    const D = 1700;
    if (Math.abs(ry) >= Math.abs(rx)) {
      const n = Math.max(24, Math.ceil(w / 7)), sy = Math.sin(ry), cyv = Math.cos(ry);
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n, x0 = (u0 - 0.5) * w, x1 = (u1 - 0.5) * w;
        const f0 = D / (D + x0 * sy), f1 = D / (D + x1 * sy), f = (f0 + f1) / 2;
        const px0 = x0 * cyv * f0, px1 = x1 * cyv * f1;
        c.drawImage(img, u0 * iw, 0, (u1 - u0) * iw + 0.5, ih, cx + px0, cy - h * f / 2, px1 - px0 + 0.8, h * f);
      }
    } else {
      const n = Math.max(24, Math.ceil(h / 6)), sx = Math.sin(rx), cxv = Math.cos(rx);
      for (let i = 0; i < n; i++) {
        const v0 = i / n, v1 = (i + 1) / n, y0 = (v0 - 0.5) * h, y1 = (v1 - 0.5) * h;
        const f0 = D / (D - y0 * sx), f1 = D / (D - y1 * sx), f = (f0 + f1) / 2;
        const py0 = y0 * cxv * f0, py1 = y1 * cxv * f1;
        c.drawImage(img, 0, v0 * ih, iw, (v1 - v0) * ih + 0.5, cx - w * f / 2, cy + py0, w * f, py1 - py0 + 0.8);
      }
    }
  }
  // consistent 2px UI icon strokes
  const ICON = {
    home(c, x, y, s) { c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y - s); c.lineTo(x + s, y); c.moveTo(x - s * 0.7, y - s * 0.25); c.lineTo(x - s * 0.7, y + s * 0.8); c.lineTo(x + s * 0.7, y + s * 0.8); c.lineTo(x + s * 0.7, y - s * 0.25); c.stroke(); },
    search(c, x, y, s) { c.beginPath(); c.arc(x - s * 0.15, y - s * 0.15, s * 0.62, 0, TAU); c.moveTo(x + s * 0.3, y + s * 0.3); c.lineTo(x + s * 0.85, y + s * 0.85); c.stroke(); },
    library(c, x, y, s) { c.beginPath(); c.moveTo(x - s * 0.7, y - s * 0.8); c.lineTo(x - s * 0.7, y + s * 0.8); c.moveTo(x - s * 0.15, y - s * 0.8); c.lineTo(x - s * 0.15, y + s * 0.8); c.moveTo(x + s * 0.35, y - s * 0.75); c.lineTo(x + s * 0.85, y + s * 0.8); c.stroke(); },
    dots(c, x, y, s, col) { c.fillStyle = col; for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(x, y + i * s * 0.55, s * 0.13, 0, TAU); c.fill(); } },
    vol(c, x, y, s) { c.beginPath(); c.moveTo(x - s, y - s * 0.35); c.lineTo(x - s * 0.5, y - s * 0.35); c.lineTo(x, y - s * 0.8); c.lineTo(x, y + s * 0.8); c.lineTo(x - s * 0.5, y + s * 0.35); c.lineTo(x - s, y + s * 0.35); c.closePath(); c.stroke(); c.beginPath(); c.arc(x + s * 0.2, y, s * 0.55, -0.8, 0.8); c.stroke(); },
    play(c, x, y, s, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x - s * 0.38, y - s * 0.55); c.lineTo(x + s * 0.6, y); c.lineTo(x - s * 0.38, y + s * 0.55); c.closePath(); c.fill(); },
    pause(c, x, y, s, col) { c.fillStyle = col; c.fillRect(x - s * 0.45, y - s * 0.5, s * 0.3, s); c.fillRect(x + s * 0.15, y - s * 0.5, s * 0.3, s); },
    skip(c, x, y, s, col, dir) { c.fillStyle = col; c.save(); c.translate(x, y); c.scale(dir, 1); c.beginPath(); c.moveTo(-s * 0.45, -s * 0.5); c.lineTo(s * 0.3, 0); c.lineTo(-s * 0.45, s * 0.5); c.closePath(); c.fill(); c.fillRect(s * 0.32, -s * 0.5, s * 0.14, s); c.restore(); },
  };

  // ---------- the desktop interface (built once, drawn with perspective on entrance) ----------
  const UI = { w: 1280, h: 720, cv: null, cards: [] };
  const FEATURED = [['silk', 'Liquid Light', 'Mirae'], ['late', 'Late Nights', 'Juno Hale, Vela'], ['mix1', 'Daily Mix 1', 'Kiro, Nova Lane']];
  function buildUI() {
    const cv = mk(UI.w, UI.h), g = cv.getContext('2d');
    g.beginPath(); g.roundRect(0, 0, UI.w, UI.h, 18); g.fillStyle = '#000000'; g.fill();
    // sidebar
    g.beginPath(); g.roundRect(8, 8, 72, UI.h - 16, 12); g.fillStyle = '#121212'; g.fill();
    g.strokeStyle = '#B3B3B3'; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round';
    ICON.home(g, 44, 52, 11); ICON.search(g, 44, 100, 11); ICON.library(g, 44, 150, 11);
    ['energy', 'focus', 'chill', 'throw', 'run'].forEach((k, i) => { g.save(); g.beginPath(); g.roundRect(22, 200 + i * 58, 44, 44, 6); g.clip(); g.drawImage(COV[k], 22, 200 + i * 58, 44, 44); g.restore(); });
    // main panel
    g.beginPath(); g.roundRect(88, 8, UI.w - 96, UI.h - 16, 12);
    const mg = g.createLinearGradient(0, 8, 0, 300); mg.addColorStop(0, '#1F3A2A'); mg.addColorStop(1, '#121212'); g.fillStyle = mg; g.fill();
    g.fillStyle = WHITE; g.font = FONT(700, 28); g.letterSpacing = '-0.5px'; g.fillText('Made for you', 120, 92);
    g.fillStyle = GRAY; g.font = FONT(600, 15); g.letterSpacing = '0px'; g.fillText('Show all', 880, 92);
    UI.cards = [];
    FEATURED.forEach(([k, title, sub], i) => {
      const x = 120 + i * 272, y = 116;
      g.beginPath(); g.roundRect(x, y, 252, 318, 10); g.fillStyle = '#181818'; g.fill();
      g.save(); g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 18; g.shadowOffsetY = 8; g.drawImage(COV[k], x + 16, y + 16, 220, 220); g.restore();
      g.fillStyle = WHITE; g.font = FONT(700, 17); g.fillText(title, x + 16, y + 268);
      g.fillStyle = GRAY; g.font = FONT(500, 14); g.fillText(sub, x + 16, y + 292);
      UI.cards.push({ k, x: x + 16 + 110, y: y + 16 + 110, s: 220 });
    });
    // supporting rows (right column + bottom grid)
    g.fillStyle = WHITE; g.font = FONT(700, 18); g.fillText('Recently played', 960, 92);
    ['energy', 'focus', 'chill', 'mix2', 'mix3'].forEach((k, i) => {
      const y = 116 + i * 64;
      g.save(); g.beginPath(); g.roundRect(960, y, 48, 48, 5); g.clip(); g.drawImage(COV[k], 960, y, 48, 48); g.restore();
      g.fillStyle = '#E6E6E6'; g.font = FONT(600, 14); g.fillText(['Good Energy', 'Deep Focus', 'Chill Waves', 'Daily Mix 2', 'Daily Mix 3'][i], 1022, y + 21);
      g.fillStyle = DIM; g.font = FONT(500, 12); g.fillText('Playlist', 1022, y + 40);
    });
    g.fillStyle = WHITE; g.font = FONT(700, 18); g.fillText('Jump back in', 120, 480);
    ['mix2', 'throw', 'chill', 'run', 'energy', 'mix3'].forEach((k, i) => {
      const x = 120 + (i % 3) * 360, y = 500 + Math.floor(i / 3) * 76;
      g.beginPath(); g.roundRect(x, y, 340, 60, 6); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fill();
      g.save(); g.beginPath(); g.roundRect(x, y, 60, 60, 6); g.clip(); g.drawImage(COV[k], x, y, 60, 60); g.restore();
      g.fillStyle = '#F0F0F0'; g.font = FONT(700, 14); g.fillText(['Daily Mix 2', 'Throwback', 'Chill Waves', 'Run Mode', 'Good Energy', 'Daily Mix 3'][i], x + 76, y + 36);
    });
    UI.cv = cv;
  }

  // ---------- persistent player ----------
  function playerVis(t) {
    return Math.min(A(t, 2.55, 0.4), 1 - A(t, 7.5, 0.22, io3)) + (t > 8 ? Math.min(A(t, 8.8, 0.4), 1 - A(t, 14.0, 0.4, io3)) : 0);
  }
  function player(c, t) {
    const v = clamp(playerVis(t)); if (v <= 0.003) return;
    const w = 900, h = 70, cx = SCX, cy = S.y + S.h - 64 + (1 - v) * 26, x = cx - w / 2, y = cy - h / 2;
    c.save(); c.globalAlpha *= v;
    c.beginPath(); c.roundRect(x, y, w, h, 16); c.fillStyle = 'rgba(22,22,22,0.82)'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 1; c.stroke();
    c.save(); c.beginPath(); c.roundRect(x + 12, y + 12, 46, 46, 6); c.clip(); c.drawImage(COV.hero, x + 12, y + 12, 46, 46); c.restore();
    c.font = FONT(600, 15); c.fillStyle = WHITE; c.letterSpacing = '-0.1px'; c.fillText(ellipsize(c, TRACK, 210), x + 72, y + 31);
    c.font = FONT(500, 13); c.fillStyle = GRAY; c.fillText(ARTIST, x + 72, y + 51);
    // transport
    const playing = t >= 7.25;
    ICON.skip(c, cx - 52, cy - 8, 14, '#B3B3B3', -1); ICON.skip(c, cx + 52, cy - 8, 14, '#B3B3B3', 1);
    c.beginPath(); c.arc(cx, cy - 8, 17, 0, TAU); c.fillStyle = WHITE; c.fill();
    if (playing) ICON.pause(c, cx, cy - 8, 13, '#000'); else ICON.play(c, cx + 1, cy - 8, 14, '#000');
    const pw = 300, px = cx - pw / 2, py = cy + 21;
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.roundRect(px, py - 1.5, pw, 3, 1.5); c.fill();
    const prog01 = playing ? 0.08 + 0.5 * clamp((t - 7.25) / 10) : 0.08;
    c.fillStyle = GREEN; c.beginPath(); c.roundRect(px, py - 1.5, pw * prog01, 3, 1.5); c.fill();
    c.strokeStyle = '#B3B3B3'; c.lineWidth = 1.8; c.lineCap = 'round'; c.lineJoin = 'round'; ICON.vol(c, x + w - 120, cy, 9);
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x + w - 100, cy - 1.5, 70, 3); c.fillStyle = '#E6E6E6'; c.fillRect(x + w - 100, cy - 1.5, 46, 3);
    c.restore();
  }

  // ---------- shot list (times are absolute seconds; boundaries sit on the 120 BPM grid) ----------
  // 0.0 logo · 0.5 Discover · 1.5 UI · 2.5 New for you · 3.25 Fresh finds · 4.0 Every mood · 5.0 search
  // 5.75 cover · 6.5 detail · 7.5 green · 8.25 zoom · 9.75 rhythm · 11.25 every day · 12.5 float · 14.0 converge · 15.25 wordmark

  // 0.0–1.5  logo arrival → identity + "Discover / new music"
  function shotIntro(c, t) {
    if (t >= 1.55) return;
    const IDY = 420;
    c.save(); c.font = FONT(700, 30); c.letterSpacing = '-0.6px'; const tw = c.measureText('Spotify').width; c.restore();
    const idIconX = SCX - (40 + 12 + tw) / 2 + 20;
    const m = A(t, 0.5, 0.42, io3);
    const r = t < 0.5 ? 74 * arrive(t / 0.5) : lerp(74, 20, m);
    const ix = lerp(SCX, idIconX, m), iy = lerp(SCY, IDY, m);
    const idOut = A(t, 1.3, 0.14, io3);
    c.save(); c.globalAlpha *= 1 - idOut; c.translate(0, -idOut * 10);
    spotifyIcon(c, ix, iy, r);
    // small wordmark slides out from behind the icon, clipped so the two never touch
    const wk = A(t, 0.72, 0.4);
    if (wk > 0) {
      c.save(); c.beginPath(); c.rect(ix + r + 10, iy - 30, 400, 60); c.clip();
      c.font = FONT(700, 30); c.letterSpacing = '-0.6px'; c.fillStyle = WHITE; c.globalAlpha *= clamp(wk * 2);
      c.fillText('Spotify', idIconX + 32 + (1 - wk) * -40, iy + 11); c.restore();
    }
    c.restore();
    mtext(c, 'Discover', SCX, 548, 66, 650, WHITE, t, 0.62, 1.28);
    mtext(c, 'new music', SCX, 626, 66, 650, GREEN, t, 0.72, 1.31);
  }

  // 1.5–3.25  desktop UI rises (tilted → frontal), then we move closer to three covers: "New for you"
  const NEW_LAYOUT = [0, 1, 2].map((i) => ({ x: SCX + (i - 1) * 300, y: 500, s: 250 }));
  const uiOrigin = () => ({ x: SCX - UI.w / 2, y: SCY - 6 - UI.h / 2 });
  function shotUI(c, t) {
    if (t < 1.42 || t >= 3.3) return;
    const p = A(t, 1.42, 0.9), z = A(t, 2.5, 0.45, io3);
    const uiA = clamp(prog(t, 1.42, 1.66)) * (1 - clamp(prog(t, 2.52, 2.82)));
    const o = uiOrigin();
    if (uiA > 0.003) {
      const rx = lerp(0.5, 0, p), dy = lerp(150, 0, p), s0 = lerp(0.9, 1, p);
      // zoom toward the featured row's centroid
      const fx = o.x + UI.cards[1].x, fy = o.y + UI.cards[1].y, zs = lerp(1, 1.65, z);
      c.save(); c.globalAlpha *= uiA;
      c.translate(fx, fy); c.scale(zs, zs); c.translate(-fx, -fy);
      c.translate(SCX, SCY - 6 + dy); c.scale(s0, s0);
      persp(c, UI.cv, 0, 0, UI.w, UI.h, rx, 0);
      c.restore();
    }
    if (t >= 2.5) {
      // featured covers lift out of the UI and settle into the "New for you" layout (match-position)
      const k = A(t, 2.5, 0.55);
      UI.cards.forEach((cd, i) => {
        const L = NEW_LAYOUT[i], wk = A(t, 3.25, 0.4);
        if (t >= 3.25) return; // handed to the list shot
        cover(c, COV[cd.k], lerp(o.x + cd.x, L.x, k), lerp(o.y + cd.y, L.y, k), lerp(cd.s, L.s, k), { shadow: k });
      });
      mtext(c, 'New for you', SCX, 334, 30, 700, WHITE, t, 2.74, 3.2, { outDur: 0.12 });
      FEATURED.forEach(([, title, sub], i) => {
        const L = NEW_LAYOUT[i];
        mtext(c, title, L.x, L.y + 162, 19, 650, WHITE, t, 2.84 + i * 0.04, 3.2, { outDur: 0.1 });
        mtext(c, sub, L.x, L.y + 186, 15, 500, GRAY, t, 2.88 + i * 0.04, 3.2, { outDur: 0.1 });
      });
    }
  }

  // 3.25–4.15  featured covers withdraw into a "Fresh finds" list
  const LIST = { x: 560, w: 800, y0: 406, dy: 92 };
  const ROWS = [['silk', 'Liquid Light', 'Mirae'], ['late', 'Midnight Drive', 'Juno Hale'], ['mix1', 'Open Road', 'Kiro & Vale'], ['energy', 'Sunday Glow', 'Nova Lane']];
  function shotList(c, t) {
    if (t < 3.25 || t >= 4.2) return;
    const k = A(t, 3.25, 0.42);
    mtext(c, 'Fresh finds', LIST.x, 330, 34, 700, WHITE, t, 3.36, 3.98, { align: 'left', outDur: 0.12 });
    ROWS.forEach(([cov, title, artist], i) => {
      const ry = LIST.y0 + i * LIST.dy, ex = A(t, 4.0 + i * 0.025, 0.14, io3);
      const thumb = { x: LIST.x + 34, y: ry, s: 68 };
      c.save(); c.globalAlpha *= 1 - ex; c.translate(0, -ex * 18);
      if (i < 3) {
        const L = NEW_LAYOUT[i];
        cover(c, COV[cov], lerp(L.x, thumb.x, k), lerp(L.y, thumb.y, k), lerp(L.s, thumb.s, k), { shadow: 1 - k });
      } else {
        const a = A(t, 3.4, 0.3); cover(c, COV[cov], thumb.x, thumb.y, thumb.s * lerp(0.8, 1, a), { alpha: a, shadow: 0 });
      }
      const rk = A(t, 3.4 + i * 0.06, 0.38);
      if (rk > 0) {
        c.save(); c.globalAlpha *= clamp(rk * 1.6); c.translate(0, (1 - rk) * 14);
        if (i > 0) { c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(LIST.x, ry - LIST.dy / 2, LIST.w, 1); }
        c.font = FONT(600, 23); c.letterSpacing = '-0.3px'; c.fillStyle = WHITE; c.fillText(title, LIST.x + 92, ry - 4);
        c.font = FONT(500, 17); c.fillStyle = GRAY; c.fillText(artist, LIST.x + 92, ry + 22);
        ICON.dots(c, LIST.x + LIST.w - 16, ry, 14, '#B3B3B3');
        c.restore();
      }
      c.restore();
    });
  }

  // 4.0–5.0  "Every mood": a sideways strip of sleeves, cropped by the stage edges
  const STRIP = ['late', 'energy', 'focus', 'mix1', 'chill', 'mix2', 'throw', 'mix3', 'run'];
  function shotMood(c, t) {
    if (t < 4.05 || t >= 5.05) return;
    mtext(c, 'Every mood', SCX, 330, 54, 700, WHITE, t, 4.14, 4.86, { outDur: 0.12 });
    mtext(c, 'Find what moves you', SCX, 378, 22, 500, GRAY, t, 4.22, 4.88, { outDur: 0.12 });
    const off = 900 * (1 - A(t, 4.05, 0.6)) - (t - 4.05) * 150;
    const a = clamp(prog(t, 4.05, 4.2)) * (1 - A(t, 4.86, 0.16, io3));
    STRIP.forEach((k, i) => cover(c, COV[k], SCX + (i - 4) * 262 + off + 131, 600, 236, { alpha: a, shadow: 0.8 }));
  }

  // 5.0–5.9  search: type the artist, reveal one selected result
  const SEARCH = { x: SCX - 310, y: 368, w: 620, h: 64 };
  const RESULT = { x: SCX - 310, y: 452, w: 620, h: 96 };
  const RTHUMB = { x: RESULT.x + 14 + 36, y: RESULT.y + 48, s: 72 };
  const QUERY = ARTIST, TYPE0 = 5.1, TYPE_STEP = 0.029;
  function shotSearch(c, t) {
    if (t < 4.95 || t >= 5.95) return;
    const fa = A(t, 4.95, 0.32), ex = A(t, 5.75, 0.13, io3);
    c.save(); c.globalAlpha *= (1 - ex);
    // field
    c.save(); c.globalAlpha *= clamp(fa * 1.4); const fs = lerp(0.96, 1, fa);
    c.translate(SCX, SEARCH.y + SEARCH.h / 2); c.scale(fs, fs); c.translate(-SCX, -(SEARCH.y + SEARCH.h / 2));
    c.beginPath(); c.roundRect(SEARCH.x, SEARCH.y, SEARCH.w, SEARCH.h, 32); c.fillStyle = '#1F1F1F'; c.fill();
    c.strokeStyle = t >= TYPE0 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)'; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = '#B3B3B3'; c.lineWidth = 2; c.lineCap = 'round'; ICON.search(c, SEARCH.x + 34, SEARCH.y + 32, 10);
    const n = clamp(Math.floor((t - TYPE0) / TYPE_STEP) + 1, 0, QUERY.length);
    const typed = t >= TYPE0 ? QUERY.slice(0, n) : '';
    c.font = FONT(500, 22); c.letterSpacing = '0px';
    if (typed) { c.fillStyle = WHITE; c.fillText(typed, SEARCH.x + 62, SEARCH.y + 40); }
    else { c.fillStyle = DIM; c.fillText('What do you want to play?', SEARCH.x + 62, SEARCH.y + 40); }
    if (t >= TYPE0 && Math.floor(t * 4) % 2 === 0) { const cw = c.measureText(typed).width; c.fillStyle = GREEN; c.fillRect(SEARCH.x + 64 + cw, SEARCH.y + 20, 2, 26); }
    c.restore();
    // result
    const rk = A(t, 5.42, 0.3);
    if (rk > 0) {
      c.save(); c.beginPath(); c.rect(RESULT.x - 20, RESULT.y - 6, RESULT.w + 40, RESULT.h + 30); c.clip();
      c.translate(0, (1 - rk) * -RESULT.h * 0.6); c.globalAlpha *= clamp(rk * 1.5);
      const sel = A(t, 5.6, 0.18);
      c.beginPath(); c.roundRect(RESULT.x, RESULT.y, RESULT.w, RESULT.h, 12); c.fillStyle = `rgba(255,255,255,${0.05 + 0.07 * sel})`; c.fill();
      c.font = FONT(650, 19); c.fillStyle = WHITE; c.fillText(TRACK, RESULT.x + 102, RESULT.y + 42);
      c.font = FONT(500, 15); c.fillStyle = GRAY; c.fillText(`Song · ${ARTIST}`, RESULT.x + 102, RESULT.y + 66);
      const ps = 1 + 0.08 * Math.sin(Math.PI * prog(t, 5.6, 5.8));
      c.save(); c.translate(RESULT.x + RESULT.w - 46, RESULT.y + 48); c.scale(ps, ps);
      c.beginPath(); c.arc(0, 0, 24, 0, TAU); c.fillStyle = GREEN; c.fill(); ICON.play(c, 2, 0, 18, '#000'); c.restore();
      c.restore();
    }
    c.restore();
    // thumbnail is drawn by the hero track (it becomes the big cover)
  }

  // ---------- the hero artwork: one continuous object from search → detail → brand tile → zoom → float ----------
  function heroState(t) {
    if (t < 5.42 || t >= 14.95) return null;
    const rk = A(t, 5.42, 0.3);
    let x = RTHUMB.x, y = RTHUMB.y + (1 - rk) * -RESULT.h * 0.6, s = RTHUMB.s, a = clamp(rk * 1.5), shadow = 0.3;
    const k1 = A(t, 5.75, 0.45);                     // → large centred cover
    x = lerp(x, SCX, k1); y = lerp(y, 445, k1); s = lerp(s, 360, k1); shadow = lerp(0.3, 1, k1);
    const k2 = A(t, 6.5, 0.45);                      // → slides left for the detail view
    x = lerp(x, 760, k2); y = lerp(y, 490, k2); s = lerp(s, 400, k2);
    const k3 = A(t, 7.55, 0.45);                     // → contracts into the brand tile on green
    x = lerp(x, SCX, k3); y = lerp(y, 470, k3); s = lerp(s, 250, k3);
    const k4 = A(t, 8.35, 0.8, io3);                 // → dramatic zoom toward camera (fastest mid-move = motion blur)
    y = lerp(y, 540, k4); s = lerp(s, 2650, k4);
    s *= 1 + 0.05 * clamp((t - 9.15) / 0.6);         // slow drift while it holds
    const k5 = A(t, 9.75, 0.3, io3);                 // → clears into type
    s *= 1 + 0.08 * k5; a *= 1 - k5;
    if (t >= 10.05 && t < 12.55) return null;
    if (t >= 12.55) {                                // re-enters as one of the floating covers
      const f = floatState(t, 3); return f;
    }
    return { x, y, s, a, shadow, rz: 0, ry: 0 };
  }

  // 5.75–7.55  title under cover, then detail view
  function shotTrack(c, t) {
    if (t < 5.9 || t >= 7.65) return;
    mtext(c, TRACK, SCX, 690, 32, 700, WHITE, t, 6.0, 6.42, { outDur: 0.12 });
    mtext(c, ARTIST, SCX, 728, 22, 600, GREEN, t, 6.07, 6.44, { outDur: 0.12 });
    const X = 1010, out = 7.42;
    mtext(c, `SINGLE  ·  ${ALBUM}`, X, 372, 15, 600, GRAY, t, 6.62, out, { align: 'left', ls: 2.5, outDur: 0.1 });
    mtext(c, 'BLOCKCHAIN RECORDS', X, 440, 50, 750, WHITE, t, 6.66, out, { align: 'left', outDur: 0.1 });
    mtext(c, 'PRESENTS', X, 494, 50, 750, WHITE, t, 6.72, out, { align: 'left', outDur: 0.1 });
    mtext(c, ARTIST, X, 542, 26, 600, GREEN, t, 6.78, out, { align: 'left', outDur: 0.1 });
    mtext(c, 'A new frequency', X, 580, 20, 500, GRAY, t, 6.84, out, { align: 'left', outDur: 0.1 });
    const bk = A(t, 6.92, 0.36), bout = A(t, out, 0.1, io3);
    if (bk > 0 && bout < 1) {
      const press = 1 - 0.05 * Math.sin(Math.PI * prog(t, 7.25, 7.4));
      const s = lerp(0.9, 1, bk) * press, cx = X + 78, cy = 640;
      c.save(); c.globalAlpha *= clamp(bk * 1.6) * (1 - bout); c.translate(cx, cy); c.scale(s, s);
      c.beginPath(); c.roundRect(-78, -27, 156, 54, 27); c.fillStyle = GREEN; c.fill();
      ICON.play(c, -30, 0, 18, '#000'); c.font = FONT(700, 19); c.fillStyle = '#000'; c.fillText('Play', -12, 7);
      c.restore();
    }
  }

  // 7.5–8.5  brand-colour fill from the Play button, tile + dark identity, back to dark
  function shotBrand(c, t) {
    if (t < 7.5 || t >= 8.55) return;
    const gR = A(t, 7.5, 0.34, io3) * 1900;
    c.save(); c.beginPath(); c.arc(1088, 640, gR, 0, TAU); c.fillStyle = GREEN; c.fill(); c.restore();
    const dR = A(t, 8.25, 0.27, io3) * 1900;
    if (dR > 0) { c.beginPath(); c.arc(SCX, 470, dR, 0, TAU); c.fillStyle = STAGE; c.fill(); }
    // dark identity under the tile
    const ik = A(t, 7.9, 0.36), iout = A(t, 8.18, 0.1, io3);
    if (ik > 0 && iout < 1) {
      c.save(); c.globalAlpha *= clamp(ik * 1.6) * (1 - iout); c.translate(0, (1 - ik) * 12);
      c.font = FONT(700, 30); c.letterSpacing = '-0.6px'; const tw = c.measureText('Spotify').width;
      const gx = SCX - (40 + 12 + tw) / 2;
      spotifyIcon(c, gx + 20, 660, 20, { fill: '#000000', bar: GREEN });
      c.fillStyle = '#000000'; c.fillText('Spotify', gx + 52, 671);
      c.restore();
    }
  }

  // 9.75–11.25  "Find your / rhythm"
  function shotRhythm(c, t) {
    if (t < 9.8 || t >= 11.3) return;
    mtext(c, 'Find your', SCX, 520, 86, 650, WHITE, t, 9.92, 11.02, { outDur: 0.14 });
    mtext(c, 'rhythm', SCX, 614, 86, 650, GREEN, t, 10.0, 11.05, { outDur: 0.14 });
  }

  // 11.25–12.6  "Made for your every day": three sleeves → six
  const SIX = ['mix1', 'late', 'energy', 'focus', 'mix2', 'mix3'];
  const sixPos = (j) => ({ x: SCX + (j - 2.5) * 206, y: 560, s: 182 });
  function shotEveryday(c, t) {
    if (t < 11.2 || t >= 12.75) return;
    mtext(c, 'Made for your every day', SCX, 318, 44, 650, WHITE, t, 11.22, 12.38, { outDur: 0.14 });
    mtext(c, 'Your sound, always evolving', SCX, 742, 22, 500, GRAY, t, 12.0, 12.4, { outDur: 0.12 });
    const ent = A(t, 11.2, 0.55), spread = A(t, 11.85, 0.42);
    SIX.forEach((k, j) => {
      const orig = { late: 0, energy: 1, focus: 2 }[k];
      if (k === 'late' || k === 'focus') { if (t >= 12.5) return; } // these two continue as floating covers
      const exitK = A(t, 12.5, 0.2, io3);
      const P = sixPos(j);
      if (orig != null) {
        const sx = SCX + (orig - 1) * 316, tilt = (orig - 1);
        const x = lerp(sx, P.x, spread), y = lerp(560 + (1 - ent) * 90, P.y, spread), s = lerp(272, P.s, spread);
        const ry = lerp(-tilt * lerp(0.62, 0.2, ent), 0, spread), rz = lerp(tilt * 0.05, 0, spread);
        cover(c, COV[k], x, y, s * (1 - exitK * 0.3), { alpha: clamp(ent * 1.6) * (1 - exitK), ry, rz });
      } else {
        const a = A(t, 11.92 + (j === 0 ? 0 : 0.04 * j), 0.36);
        cover(c, COV[k], P.x, P.y + (1 - a) * 30, P.s * lerp(0.85, 1, a) * (1 - exitK * 0.3), { alpha: clamp(a * 1.5) * (1 - exitK) });
      }
    });
  }

  // 12.5–14.95  four floating covers (coordinated), then convergence around the icon
  const FLOAT = [
    { k: 'focus', x: 1218, y: 668, s: 206, rz: -0.05, ry: -0.24, from: 3 },
    { k: 'late', x: 1236, y: 448, s: 236, rz: 0.07, ry: -0.34, from: 1 },
    { k: 'silk', x: 690, y: 470, s: 252, rz: -0.08, ry: 0.34, from: null },
    { k: 'hero', x: SCX, y: 528, s: 330, rz: 0, ry: 0, from: null },
  ];
  const PETAL = [[-0.55, 0.9], [0.55, -0.9], [-0.3, 0.9], [0.3, -0.9]];
  function floatState(t, i) {
    const F = FLOAT[i], lt = t - 12.5;
    let x = F.x, y = F.y, s = F.s, rz = F.rz, ry = F.ry, a = 1;
    const ph = lt * 1.5;
    y += 9 * Math.sin(ph + i * 0.45); rz += 0.018 * Math.sin(ph * 0.8 + i * 0.45); x += 5 * Math.cos(ph * 0.7 + i * 0.45);
    const k = A(t, 12.5, 0.5);
    if (F.from != null) {
      const P = sixPos(F.from); x = lerp(P.x, x, k); y = lerp(P.y, y, k); s = lerp(P.s, s, k); rz *= k; ry *= k;
    } else {
      const e = A(t, 12.58, 0.5); s *= lerp(0.55, 1, e); a = clamp(e * 1.6); if (i === 3) { x = lerp(SCX, x, e); y = lerp(560, y, e); }
    }
    // converge: fold toward the centre around the icon
    const cv = A(t, 14.0, 0.62, io3);
    if (cv > 0) {
      // land as petals ringing the icon (radius just outside it), not on top of each other
      const ang = Math.atan2(F.y - 528, F.x - SCX + (i === 3 ? 0.001 : 0)) + (i === 3 ? Math.PI / 2 : 0), rad = 118;
      x = lerp(x, SCX + Math.cos(ang) * rad, cv); y = lerp(y, 520 + Math.sin(ang) * rad, cv); s = lerp(s, s * 0.36, cv);
      rz = lerp(rz, PETAL[i][0], cv); ry = lerp(ry, PETAL[i][1], cv);
      a *= 1 - A(t, 14.55, 0.4, io3);
    }
    return { x, y, s, a, shadow: 1 - cv, rz, ry };
  }
  function shotFloat(c, t) {
    if (t < 12.5 || t >= 14.95) return;
    for (let i = 0; i < 3; i++) { const f = floatState(t, i); cover(c, COV[FLOAT[i].k], f.x, f.y, f.s, f); }
  }

  // 14.4–18  icon emerges from the convergence point, slides left beside the wordmark
  function shotLogo(c, t) {
    if (t < 14.4) return;
    const r0 = 66 * arrive(prog(t, 14.42, 14.95));
    c.save(); c.font = FONT(700, 136); c.letterSpacing = '-4px'; const ww = c.measureText('Spotify').width; c.restore();
    const R = 66, gap = 34, group = 2 * R + gap + ww, fx = SCX - group / 2 + R;
    const mv = A(t, 15.25, 0.62);
    const ix = lerp(SCX, fx, mv), iy = lerp(520, 500, mv);
    spotifyIcon(c, ix, iy, t < 15.25 ? r0 : R);
    if (t >= 15.3) {
      const x0 = fx + R + gap, wa = A(t, 15.3, 0.6);
      c.save(); c.beginPath(); c.rect(Math.max(x0 - 6, ix + R + gap - 6), iy - 110, 1400, 220); c.clip();
      c.font = FONT(700, 136); c.letterSpacing = '-4px'; c.fillStyle = WHITE; c.globalAlpha *= clamp(wa * 1.8);
      c.fillText('Spotify', x0 + (1 - wa) * 36, iy + 48); c.restore();
    }
    mtext(c, 'Discover new music', SCX, 664, 44, 600, WHITE, t, 15.95, null);
    mtext(c, 'every day', SCX, 718, 44, 600, GREEN, t, 16.06, null);
  }

  // ---------- frame ----------
  function renderScene(c, t) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0;
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(backdrop, 0, 0);
    c.save();
    c.beginPath(); c.roundRect(S.x, S.y, S.w, S.h, S.r); c.clip();
    c.fillStyle = STAGE; c.fillRect(S.x, S.y, S.w, S.h);
    shotIntro(c, t); shotUI(c, t); shotList(c, t); shotMood(c, t); shotSearch(c, t);
    shotBrand(c, t);
    shotEveryday(c, t); shotFloat(c, t);
    const h = heroState(t); if (h) cover(c, COV.hero, h.x, h.y, h.s, h);
    shotTrack(c, t); shotRhythm(c, t); shotLogo(c, t);
    player(c, t);
    c.restore();
    // fine inner edge on the stage
    c.beginPath(); c.roundRect(S.x + 0.5, S.y + 0.5, S.w - 1, S.h - 1, S.r); c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 1; c.stroke();
  }

  // Temporal supersampling: SUBFRAMES samples across the shutter, averaged. Static pixels stay identical, so
  // stationary text and artwork remain perfectly sharp; only moving elements pick up blur.
  async function seek(t) {
    await ready;
    t = clamp(t, 0, DUR);
    octx.setTransform(1, 0, 0, 1, 0, 0); octx.globalCompositeOperation = 'source-over';
    for (let k = 0; k < SUBFRAMES; k++) {
      const tk = clamp(t + ((k + 0.5) / SUBFRAMES - 0.5) * SHUTTER / FPS, 0, DUR);
      renderScene(fctx, tk);
      octx.globalAlpha = 1 / (k + 1); octx.drawImage(frameCv, 0, 0);
    }
    octx.globalAlpha = 1;
  }

  window.seek = seek;
  window.FILM = { W, H, FPS, DUR, ready, seek };
  if (!/[?&]render\b/.test(location.search)) {
    ready.then(() => { const t0 = performance.now(); const loop = () => { renderScene(octx, ((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
  }
})();
