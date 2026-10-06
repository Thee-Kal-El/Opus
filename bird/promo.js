// BIRDEYE × $NOSELLING — flashy 30s promo, 1920x1080 @ 60fps, cut to a 128 BPM grid (64 beats = 30s).
// Real screenshots (dashboard + token page) for the "this is the actual site" moments, a vector rebuild of
// the bubble map for crisp deep zooms, a Buy-frenzy beat, and the YOU BETTER NOT SELL! finale.
(() => {
  'use strict';
  const K = window.KIT, { C, F, M, TAU, clamp, lerp, prog, io3, io5, o3, crit, pop, A, hash, rgba, rr, text } = K;
  const W = 1920, H = 1080, FPS = 60, DUR = 30, BPM = 128, BT = 60 / BPM, BAR = BT * 4;
  const T = (bar, beat = 0) => (bar * 4 + beat) * BT;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const IMG = {};
  const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const beatIdx = (t) => Math.floor(t / BT + 1e-6), beatPh = (t) => t - beatIdx(t) * BT, pulse = (t, k = 10) => Math.exp(-beatPh(t) * k);

  // ---------- helpers ----------
  // draw an image (or region) with a perspective tilt about its centre (strip projection)
  function persp(c, img, sx, sy, sw, sh, cx, cy, w, h, rx = 0, ry = 0, alpha = 1) {
    c.save(); c.globalAlpha *= alpha; const D = 2200;
    if (Math.abs(rx) < 1e-4 && Math.abs(ry) < 1e-4) { c.drawImage(img, sx, sy, sw, sh, cx - w / 2, cy - h / 2, w, h); c.restore(); return; }
    if (Math.abs(rx) >= Math.abs(ry)) {
      const n = 90, s = Math.sin(rx), co = Math.cos(rx);
      for (let i = 0; i < n; i++) { const v0 = i / n, v1 = (i + 1) / n, y0 = (v0 - 0.5) * h, y1 = (v1 - 0.5) * h, f0 = D / (D - y0 * s), f1 = D / (D - y1 * s), f = (f0 + f1) / 2; c.drawImage(img, sx, sy + v0 * sh, sw, (v1 - v0) * sh + 0.5, cx - w * f / 2, cy + y0 * co * f0, w * f, (y1 * co * f1 - y0 * co * f0) + 0.8); }
    } else {
      const n = 120, s = Math.sin(ry), co = Math.cos(ry);
      for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n, x0 = (u0 - 0.5) * w, x1 = (u1 - 0.5) * w, f0 = D / (D + x0 * s), f1 = D / (D + x1 * s), f = (f0 + f1) / 2; c.drawImage(img, sx + u0 * sw, sy, (u1 - u0) * sw + 0.5, sh, cx + x0 * co * f0, cy - h * f / 2, (x1 * co * f1 - x0 * co * f0) + 0.8, h * f); }
    }
    c.restore();
  }
  // "camera" over a screenshot: show source rect centred at (fx,fy) with zoom z (1 = fit width)
  function shot(c, img, fx, fy, z, o = {}) {
    const iw = img.naturalWidth, ih = img.naturalHeight, base = W / iw, s = base * z;
    const sw = W / s, sh = H / s, sx = clamp(fx - sw / 2, 0, Math.max(0, iw - sw)), sy = clamp(fy - sh / 2, 0, Math.max(0, ih - sh));
    persp(c, img, sx, sy, Math.min(sw, iw), Math.min(sh, ih), W / 2, H / 2, Math.min(sw, iw) * s, Math.min(sh, ih) * s, o.rx || 0, o.ry || 0, o.alpha ?? 1);
  }
  function band(c, a = 1) { const g = c.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, `rgba(0,0,0,${0.92 * a})`); g.addColorStop(0.75, `rgba(0,0,0,${0.75 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 230); }
  function punchText(c, s, x, y, size, col, t, t0, o = {}) {
    if (t < t0) return; const k = io5(prog(t, t0, t0 + 0.18)), out = o.out != null ? io3(prog(t, o.out, o.out + 0.12)) : 0;
    if (out >= 1) return;
    c.save(); c.translate(x, y); const sc = lerp(o.from ?? 1.6, 1, k) * (1 + out * 0.3); c.scale(sc, sc); c.globalAlpha = clamp(k * 3) * (1 - out);
    c.font = F(900, size); c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.letterSpacing = `${-size * 0.03}px`;
    if (o.chroma !== false) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,40,80,0.7)'; c.fillText(s, -6 * (1 - k) - 3, 0); c.fillStyle = 'rgba(40,200,255,0.7)'; c.fillText(s, 6 * (1 - k) + 3, 0); c.globalCompositeOperation = 'source-over'; }
    if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = 40; }
    c.fillStyle = col; c.fillText(s, 0, 0); c.restore();
  }
  function tag(c, s, x, y, col, t, t0, size = 30) {
    const k = pop(prog(t, t0, t0 + 0.35)); if (k <= 0) return;
    c.save(); c.translate(x, y); c.scale(k, k); c.font = F(800, size); const w = c.measureText(s).width + size * 1.2;
    rr(c, -w / 2, -size * 0.9, w, size * 1.8, size * 0.9); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 30; c.fill(); c.shadowBlur = 0;
    text(c, s, 0, 2, F(800, size), '#000', 'center'); c.restore();
  }

  // ---------- BAR 0: logo slam + SEE / TRACK / TRADE ----------
  function open(c, t) {
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const b = beatIdx(t);
    if (b === 0) {
      const k = io5(prog(t, 0, 0.25));
      c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 900); g.addColorStop(0, rgba(C.orange, 0.4)); g.addColorStop(1, rgba(C.orange, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
      c.save(); c.translate(W / 2, H / 2); c.scale(lerp(3, 1, k), lerp(3, 1, k)); K.wordmark(c, -330, 0, 150); c.restore();
    } else {
      const words = ['SPOT IT.', 'TRACK IT.', 'TRADE IT.'], cols = ['#FFFFFF', C.orange, C.green];
      for (let i = 0; i < 3; i++) { const yy = 300 + i * 240; if (b >= i + 1) punchText(c, words[i], W / 2, yy, 190, b === i + 1 ? cols[i] : rgba('#FFFFFF', 0.35), t, T(0, i + 1)); }
    }
  }

  // ---------- BARS 1–2: the real dashboard, tilting in, chain sweep, push ----------
  function dashboard(c, t) {
    const img = IMG.dash, lt = t - T(1);
    const k = A(t, T(1), 0.9, crit);
    const rx = lerp(0.9, 0.06, k) + 0.04 * Math.sin(lt * 1.5), z = lerp(0.85, 1.0, k) + 0.08 * A(t, T(2), BAR, io3);
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(W / 2, H * 0.6, 0, W / 2, H * 0.6, 1100); g.addColorStop(0, rgba(C.orange, 0.18)); g.addColorStop(1, rgba(C.orange, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    const iw = img.naturalWidth, ih = img.naturalHeight, w = W * 0.92 * z, h = w * ih / iw;
    persp(c, img, 0, 0, iw, ih, W / 2, H / 2 + lerp(300, 10, k), w, h, rx, 0.06 * Math.sin(lt), clamp(k * 2));
    // chain highlight sweeping across the chain tabs on 8ths
    if (t > T(1, 2)) {
      const i = Math.floor((t - T(1, 2)) / (BT / 2)) % 10, cy = H / 2 + lerp(300, 10, k) - h / 2 + (116 / ih) * h, cw = w / 10;
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(C.orange, 0.22); c.fillRect(W / 2 - w / 2 + i * cw, cy - 22, cw, 44); c.restore();
    }
    punchText(c, 'EVERY CHAIN.', W / 2, 120, 96, '#FFFFFF', t, T(1, 2), { out: T(2, 1) });
    punchText(c, 'ONE SCREEN.', W / 2, 120, 96, C.orange, t, T(2, 1), { out: T(2, 3.6) });
  }

  // ---------- BARS 3–5: the bubble map, rebuilt in vector ----------
  const BX = 80, BY = 40, BW = 1760, BH = 1000;
  function bubbleWorld(c, t) {
    const lt = t - T(3);
    c.fillStyle = '#000'; c.fillRect(BX - 2000, BY - 2000, BW + 4000, BH + 4000);
    K.BUBBLES.forEach(([n, p, s, u, v], i) => {
      const t0 = T(3) + (i % 16) * (BT / 4) + Math.floor(i / 16) * BT;
      const k = pop(prog(t, t0, t0 + 0.45)); if (k <= 0) return;
      const r = s * 150 * k, x = BX + u * BW + Math.sin(lt * 0.9 + i) * 8, y = BY + v * BH + Math.cos(lt * 0.8 + i * 1.3) * 8;
      K.bubble(c, x, y, r, n, p);
    });
  }
  const bub = (name) => { const b = K.BUBBLES.find((q) => q[0] === name); return [BX + b[3] * BW, BY + b[4] * BH, b[2] * 150]; };
  function bubbleMap(c, t) {
    const [nx, ny, nr] = bub('NIGHT'), [zx, zy, zr] = bub('ZRO'), [lx, ly] = bub('LIT');
    // camera keys: whole map → NIGHT → ZRO → LIT → whole map
    const keys = [[T(3), W / 2, H / 2, 1.0], [T(3, 3.5), W / 2, H / 2, 1.0], [T(4, 0.5), nx, ny, 2.6], [T(4, 2), nx, ny, 2.9], [T(4, 3), zx, zy, 2.8], [T(5, 0), zx, zy, 3.0], [T(5, 1.2), lx, ly, 2.6], [T(5, 2.4), W / 2, H / 2, 1.0], [T(6), W / 2, H / 2, 0.95]];
    let i = 0; while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1], k = io5(prog(t, a[0], b[0]));
    const z = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), k)), cx = lerp(a[1], b[1], k), cy = lerp(a[2], b[2], k);
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cx, -cy); bubbleWorld(c, t); c.restore();
    // header chip like the site
    c.save(); rr(c, 40, 30, 260, 54, 8); c.fillStyle = 'rgba(17,17,17,0.9)'; c.fill(); c.strokeStyle = C.line2; c.stroke(); text(c, 'BUBBLE MAP · 24h', 62, 57, F(800, 22), C.ink); c.restore();
    punchText(c, 'WATCH THE MARKET MOVE', W / 2, 980, 64, '#FFFFFF', t, T(3, 1), { out: T(4, 0.2), chroma: false });
    tag(c, 'NIGHT +14.88%', W / 2, 960, C.green, t, T(4, 1));
    tag(c, 'ZRO +9.88%', W / 2, 960, C.green, t, T(4, 3.2));
    tag(c, 'LIT +8.36%', W / 2, 960, C.green, t, T(5, 1.4));
  }

  // ---------- BARS 6–7: trending + profitable traders (real screenshot crops) ----------
  function trending(c, t) {
    const img = IMG.dash, b = t < T(7) ? 0 : 1;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    if (b === 0) {
      // trending tokens table: push in + scanner over PLAGUE / HIGGS
      const k = A(t, T(6), BAR, io3), z = lerp(2.4, 3.0, k);
      shot(c, img, 240, 380 + k * 40, z, { rx: 0.05 * (1 - k) }); band(c);
      const rowY = (r) => H / 2 + (236 + r * 49 - (380 + k * 40)) * (W / img.naturalWidth) * z;
      const hi = t < T(6, 2) ? 2 : 3;
      c.save(); c.strokeStyle = C.orange; c.lineWidth = 4; c.shadowColor = C.orange; c.shadowBlur = 20; c.strokeRect(20, rowY(hi) + 4, W - 40, 49 * (W / img.naturalWidth) * z - 8); c.restore();
      punchText(c, '+106%', W * 0.78, 200, 150, C.green, t, T(6, 0.5), { out: T(6, 1.9), glow: C.green });
      punchText(c, '+395%', W * 0.78, 200, 170, C.green, t, T(6, 2), { glow: C.green });
      punchText(c, 'TRENDING NOW', W * 0.27, 120, 70, '#FFFFFF', t, T(6), { chroma: false });
    } else {
      const k = A(t, T(7), BAR, io3), z = lerp(2.2, 2.6, k);
      shot(c, img, 720, 360 + k * 60, z); band(c);
      punchText(c, 'FOLLOW THE SMART MONEY', W / 2, 110, 76, '#FFFFFF', t, T(7), { chroma: false });
      punchText(c, '+$8.58M', W * 0.8, 960, 120, C.green, t, T(7, 2), { glow: C.green });
    }
  }

  // ---------- BARS 8–9: large trades + token page ----------
  function tokenPage(c, t) {
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    if (t < T(9)) {
      const img = IMG.dash, k = A(t, T(8), BAR, io3);
      shot(c, img, lerp(1300, 1500, k), 800, lerp(2.25, 2.5, k), { ry: -0.05 * (1 - k) }); band(c);
      punchText(c, 'EVERY WHALE MOVE. LIVE.', W / 2, 110, 76, '#FFFFFF', t, T(8, 0.5), { chroma: false });
    } else {
      const img = IMG.token, k = A(t, T(9), BAR * 0.95, io5);
      // whip from the full token page into the NOSELLING header
      const z = lerp(1.0, 3.6, k), fx = lerp(960, 1700, k), fy = lerp(480, 215, k);
      shot(c, img, fx, fy, z); band(c, 1 - A(t, T(9, 3.4), 0.2));
      if (t > T(9, 2)) { const kk = A(t, T(9, 2), 0.4); c.save(); c.globalAlpha = kk; c.strokeStyle = C.orange; c.lineWidth = 5; c.shadowColor = C.orange; c.shadowBlur = 30; rr(c, 120, 330, W - 240, 420, 30); c.stroke(); c.restore(); }
      punchText(c, 'FOUND ON BIRDEYE', W / 2, 110, 76, '#FFFFFF', t, T(9), { chroma: false, out: T(9, 3.4) });
    }
  }

  // ---------- BARS 10–11: BUY FRENZY ----------
  function frenzy(c, t) {
    const lt = t - T(10);
    c.fillStyle = '#050505'; c.fillRect(0, 0, W, H);
    // radial green rays
    c.save(); c.translate(W * 0.3, H / 2); c.rotate(lt * 0.3); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) { c.rotate(TAU / 18); c.fillStyle = rgba(C.green, 0.05 + 0.04 * pulse(t, 6)); c.beginPath(); c.moveTo(0, 0); c.lineTo(1600, -90); c.lineTo(1600, 90); c.closePath(); c.fill(); }
    c.restore();
    // coin
    const ck = A(t, T(10), 0.6, crit); K.coin(c, W * 0.3, H / 2 - 40, 270 * ck * (1 + 0.04 * pulse(t, 9)), t, { spin: (1 - ck) * TAU * 2 + Math.sin(t * 2) * 0.15, glow: C.green });
    text(c, '$NOSELLING', W * 0.3, H / 2 + 300, F(900, 80), '#FFFFFF', 'center');
    // buy feed: a green Buy row lands on every 8th
    const PW = 820, PX = W - PW - 90, rows = Math.min(14, Math.floor(lt / (BT / 2)) + 1);
    rr(c, PX - 20, 120, PW + 40, 860, 18); c.fillStyle = C.panel; c.fill(); c.strokeStyle = C.line2; c.stroke();
    text(c, 'Trades', PX + 10, 160, F(800, 26), C.ink); c.fillStyle = C.orange; c.fillRect(PX + 10, 182, 80, 3);
    text(c, 'Type', PX + 10, 220, F(600, 18), C.dim); text(c, 'Value', PX + 180, 220, F(600, 18), C.dim); text(c, 'NOSELLING', PX + 400, 220, F(600, 18), C.dim); text(c, 'Trader', PX + PW - 10, 220, F(600, 18), C.dim, 'right');
    for (let i = 0; i < rows && i < 13; i++) {
      const idx = rows - 1 - i, ry = 262 + i * 54, fresh = i === 0 ? 1 - prog(lt - idx * BT / 2, 0, 0.3) : 0;
      if (fresh > 0) { c.fillStyle = rgba(C.green, 0.25 * fresh); c.fillRect(PX - 10, ry - 24, PW + 20, 48); }
      const val = (0.5 + hash(idx, 3) * 40).toFixed(2), amt = (0.2 + hash(idx, 4) * 9).toFixed(2);
      text(c, 'Buy', PX + 10, ry, M(800, 22), C.green); text(c, `$${val}`, PX + 180, ry, M(700, 22), C.green);
      text(c, `+${amt}M`, PX + 400, ry, M(600, 22), C.ink);
      text(c, `0x${(hash(idx, 5) * 0xffff | 0).toString(16).padStart(4, '0')}…${(hash(idx, 6) * 0xffff | 0).toString(16).padStart(4, '0')}`, PX + PW - 10, ry, M(500, 20), C.mute, 'right');
    }
    // the Buy button gets hammered on every beat
    const bx = PX + PW / 2, by = 1000, press = 1 - 0.08 * pulse(t, 14);
    c.save(); c.translate(bx, by - 10); c.scale(press, press); rr(c, -PW / 2, -40, PW, 80, 12); c.fillStyle = C.green; c.shadowColor = C.green; c.shadowBlur = 30 + 40 * pulse(t, 8); c.fill(); c.shadowBlur = 0;
    text(c, 'Buy', 0, 2, F(800, 40), '#000', 'center'); c.restore();
    punchText(c, 'BUY', W * 0.3, 170, 150, C.green, t, T(10, 1), { out: T(10, 1.9), glow: C.green });
    punchText(c, 'HOLD', W * 0.3, 170, 150, '#FFFFFF', t, T(10, 2), { out: T(10, 2.9) });
    punchText(c, 'DON’T SELL', W * 0.3, 170, 150, C.red, t, T(10, 3), { glow: C.red });
  }

  // ---------- BARS 12–15: YOU BETTER NOT SELL! + CTA ----------
  function finale(c, t) {
    const lt = t - T(12), k = A(t, T(12), 0.3);
    const ck = A(t, T(12, 1), 0.9, crit);
    const dz = 1 + 0.03 * pulse(t, 8);
    c.save(); c.translate(W / 2, H / 2); c.scale(dz, dz); c.translate(-W / 2, -H / 2);
    K.betterNotSell(c, W, H * 0.84, t, k, { spin: (1 - ck) * TAU * 2, coinDy: (1 - ck) * -600 });
    c.restore();
    c.fillStyle = '#030303'; c.fillRect(0, H * 0.84, W, H * 0.16);
    const ca = A(t, T(13), 0.4);
    if (ca > 0) {
      c.save(); c.globalAlpha = ca;
      text(c, '$NOSELLING', 520, H * 0.92, F(900, 54), '#FFFFFF', 'center');
      text(c, 'on', 820, H * 0.92, F(500, 34), C.mute, 'center');
      K.wordmark(c, 880, H * 0.92, 52);
      const bp = 1 + 0.06 * pulse(t, 10), bx = 1500, by = H * 0.92;
      c.save(); c.translate(bx, by); c.scale(bp, bp); rr(c, -170, -42, 340, 84, 42); c.fillStyle = C.green; c.shadowColor = C.green; c.shadowBlur = 40; c.fill(); c.shadowBlur = 0;
      text(c, 'BUY NOW  →', 0, 2, F(900, 36), '#000', 'center'); c.restore();
      c.restore();
    }
  }

  // ---------- frame ----------
  function renderAt(t) {
    t = clamp(t, 0, DUR - 1e-6);
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.filter = 'none';
    // beat camera punch (bigger on bar lines)
    const onBar = beatIdx(t) % 4 === 0, z = 1 + (onBar ? 0.03 : 0.012) * pulse(t, 11);
    c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
    if (t < T(1)) open(c, t);
    else if (t < T(3)) dashboard(c, t);
    else if (t < T(6)) bubbleMap(c, t);
    else if (t < T(8)) trending(c, t);
    else if (t < T(10)) tokenPage(c, t);
    else if (t < T(12)) frenzy(c, t);
    else finale(c, t);
    c.setTransform(1, 0, 0, 1, 0, 0);
    // flash + chromatic edge on bar cuts
    const bi = beatIdx(t), ph = beatPh(t);
    if (bi % 4 === 0 && bi > 0) { const fl = 0.55 * Math.exp(-ph * 16); c.fillStyle = `rgba(255,255,255,${fl})`; c.fillRect(0, 0, W, H); }
    else if (bi < 4 || (bi >= 40 && bi < 48)) { const fl = 0.18 * Math.exp(-ph * 20); c.fillStyle = `rgba(255,255,255,${fl})`; c.fillRect(0, 0, W, H); }
    const v = c.createRadialGradient(W / 2, H / 2, 560, W / 2, H / 2, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    const fo = prog(t, DUR - 0.25, DUR); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  }

  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(F(900, 40)), document.fonts.load(M(700, 20)), load('dash', '../assets/bird/dashboard.png'), load('token', '../assets/bird/token_page.png')]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
