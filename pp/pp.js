// ANAHEIM PRANCING PUPS — "We bring the spa to your paws." 20s (15s design timeline, slowed), 1920x1080 @ 60fps, cut to 120 BPM.
// 0–1.5 wolf crest reveal + logo ring build · 1.5–4 headline with paw-print stamps and soap bubbles · 4–6.5 the grooming bus ·
// 6.5–9.5 services (Hair Trimming, Deshedding Package) · 9.5–12 happy pups + 07+ years · 12–15 book / call end card.
// Scene changes ride the site's slanted cyan/navy/black stripe. renderAt(t) is deterministic.
(() => {
  'use strict';
  const K = window.KIT, { TAU, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, rr, hash } = K;
  const V = !!window.VERTICAL, W = V ? 1080 : 1920, H = V ? 1920 : 1080, FPS = 60, DUR = 20;
  // Authored on a 15s "design" timeline, played back over 20s for reading time. Knots are [design, real] (shared with the
  // score's F()): crest 1.5→2s, headline 2.5→3.5s, bus 2.5→3s, services 3→4.5s, pups 2.5→3.5s, end card 3→3.5s.
  const KN = [[0, 0], [1.5, 2], [4, 5.5], [6.5, 8.5], [9.5, 13], [12, 16.5], [15, 20]];
  const toDesign = (r) => { for (let i = 0; i < KN.length - 1; i++) { const [d0, r0] = KN[i], [d1, r1] = KN[i + 1]; if (r <= r1 || i === KN.length - 2) return d0 + (r - r0) * (d1 - d0) / (r1 - r0); } return r; };
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const CY = '#1BBEF2', NAVY = '#083F5E', NAVY2 = '#0B2C44', ICE = '#EAF2F8', INK = '#111418', GREY = '#5A6068';
  const S = (w, s) => `${w} ${s}px "DejaVu Serif", "Liberation Serif", serif`, G = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`, M = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const ASSETS = ['wolf', 'logo', 'bus', 'trim', 'deshed', 'ico_trim', 'ico_deshed', 'kiss', 'aussie', 'stars'];
  const ease = (t, a, b, f = io3) => f(prog(t, a, b)), pulse = (t, T, k = 12) => (t >= T ? Math.exp(-(t - T) * k) : 0), o3 = (p) => 1 - Math.pow(1 - p, 3);
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  function tw(c, s, font, ls = 0) { c.font = font; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.letterSpacing = '0px'; return w; }
  function cover(c, k, x, y, w, h, r = 0, fx = 0.5, fy = 0.5) { const im = IMG[k]; if (!im) return; const s = Math.max(w / im.width, h / im.height), sw = w / s, sh = h / s; c.save(); if (r) { rr(c, x, y, w, h, r); c.clip(); } c.drawImage(im, (im.width - sw) * fx, (im.height - sh) * fy, sw, sh, x, y, w, h); c.restore(); }
  function contain(c, k, x, y, w) { const im = IMG[k]; if (!im) return; const h = w * im.height / im.width; c.drawImage(im, x - w / 2, y - h / 2, w, h); }

  // ---------- vectors ----------
  function paw(c, x, y, s, col, rot = 0) { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath(); c.ellipse(0, s * 0.28, s * 0.42, s * 0.34, 0, 0, TAU); c.fill(); for (const [dx, dy, r] of [[-0.42, -0.12, 0.15], [-0.16, -0.42, 0.16], [0.16, -0.42, 0.16], [0.42, -0.12, 0.15]]) { c.beginPath(); c.ellipse(dx * s, dy * s, r * s, r * s * 1.25, dx * 0.6, 0, TAU); c.fill(); } c.restore(); }
  function bubble(c, x, y, r, a = 1) {
    c.save(); c.globalAlpha = a; const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(0.75, 'rgba(180,235,255,0.10)'); g.addColorStop(0.93, 'rgba(120,220,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0.75)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,190,240,0.35)'; c.lineWidth = Math.max(1, r * 0.04); c.beginPath(); c.arc(x, y, r * 0.96, 0.2, 1.6); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(x - r * 0.42, y - r * 0.42, r * 0.16, r * 0.09, -0.8, 0, TAU); c.fill(); c.restore();
  }
  // a field of rising soap bubbles; seed picks the field, dens scales count
  function bubbles(c, t, seed, n = 26, a = 1, burstT = -1) {
    for (let i = 0; i < n; i++) { const r = 14 + hash(i, seed) * 60, sp = 60 + hash(i, seed, 1) * 140, x = hash(i, seed, 2) * W + Math.sin(t * (0.8 + hash(i, seed, 3)) + i) * 30, y = H + r - ((t * sp + hash(i, seed, 4) * (H + 200)) % (H + 2 * r + 200));
      if (burstT > 0 && t > burstT + hash(i, seed, 5) * 0.3) { const k = prog(t, burstT + hash(i, seed, 5) * 0.3, burstT + hash(i, seed, 5) * 0.3 + 0.15); if (k < 1) { c.save(); c.globalAlpha = (1 - k) * a; c.strokeStyle = '#fff'; c.lineWidth = 2; for (let j = 0; j < 8; j++) { const an = j / 8 * TAU; c.beginPath(); c.moveTo(x + Math.cos(an) * r * (0.8 + k), y + Math.sin(an) * r * (0.8 + k)); c.lineTo(x + Math.cos(an) * r * (1 + k * 1.5), y + Math.sin(an) * r * (1 + k * 1.5)); c.stroke(); } c.restore(); } continue; }
      bubble(c, x, y, r, a); }
  }
  function phoneIco(c, x, y, s, col = '#fff') { c.save(); c.translate(x, y); c.scale(s / 40, s / 40); c.fillStyle = col; c.beginPath(); c.moveTo(-12, -16); c.quadraticCurveTo(-8, -20, -4, -16); c.lineTo(0, -9); c.quadraticCurveTo(2, -5, -2, -2); c.quadraticCurveTo(2, 6, 9, 9); c.quadraticCurveTo(12, 5, 16, 7); c.lineTo(20, 12); c.quadraticCurveTo(22, 17, 16, 20); c.quadraticCurveTo(-4, 22, -18, 2); c.quadraticCurveTo(-22, -10, -12, -16); c.fill(); c.restore(); }
  function sparkle(c, x, y, s, col = '#fff', rot = 0) { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.moveTo(s, 0); for (let i = 1; i <= 4; i++) { const a = i * TAU / 4; c.quadraticCurveTo(0, 0, Math.cos(a) * s, Math.sin(a) * s); } c.closePath(); c.fillStyle = col; c.fill(); c.restore(); }
  function arcText(c, s, cx, cy, R, mid, font, col, bottom = false, k = 1, ls = 6) {
    c.font = font; const ws = [...s].map((ch) => c.measureText(ch).width + ls), tot = ws.reduce((a, b) => a + b, 0) - ls; let a = mid - (bottom ? -1 : 1) * tot / R / 2;
    [...s].forEach((ch, i) => { const kk = clamp(k * s.length - i); const ca = a + (bottom ? -1 : 1) * ws[i] / R / 2; if (kk > 0) { c.save(); c.translate(cx + Math.cos(ca) * R, cy + Math.sin(ca) * R); c.rotate(ca + (bottom ? -Math.PI / 2 : Math.PI / 2)); c.globalAlpha = kk; txt(c, ch, 0, 0, font, col, 'center', 'middle'); c.restore(); } a += (bottom ? -1 : 1) * ws[i] / R; });
  }
  // the round crest, rebuilt in vector around the (keyed) wolf; k drives the build-on
  function crest(c, x, y, R, t, t0) {
    const ring = io5(prog(t, t0, t0 + 0.4)); c.save(); c.beginPath(); c.arc(x, y, R, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.97)'; c.globalAlpha = ring; c.fill(); c.restore();
    c.save(); c.strokeStyle = '#C9CED4'; c.lineWidth = R * 0.012; c.beginPath(); c.arc(x, y, R * 0.97, -Math.PI / 2, -Math.PI / 2 + TAU * ring); c.stroke(); c.restore();
    const lk = io3(prog(t, t0 + 0.2, t0 + 0.5)); c.save(); c.strokeStyle = '#C9CED4'; c.lineWidth = R * 0.01; for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(x + sx * R * 0.97, y); c.lineTo(x + sx * lerp(R * 0.97, R * 0.32, lk), y); c.stroke(); } c.restore();
    const wk = pop(prog(t, t0 + 0.05, t0 + 0.45)); if (wk > 0) { c.save(); c.translate(x, y + R * 0.02); c.scale(wk, wk); contain(c, 'wolf', 0, 0, R * 0.92); c.restore(); }
    const tk = prog(t, t0 + 0.25, t0 + 0.7); arcText(c, 'ANAHEIM', x, y, R * 0.76, -Math.PI / 2, S(700, R * 0.19), '#4A4F57', false, tk, R * 0.02); arcText(c, 'PRANCING PUPS', x, y, R * 0.78, Math.PI / 2, S(700, R * 0.155), '#4A4F57', true, tk, R * 0.012);
    const ek = A(t, t0 + 0.4, 0.3); c.save(); c.globalAlpha = ek; c.fillStyle = 'rgba(255,255,255,0.95)'; for (const sx of [-1, 1]) { c.fillRect(x + sx * R * 0.62 - R * 0.17, y - R * 0.08, R * 0.34, R * 0.16); } txt(c, 'EST', x - R * 0.62, y + R * 0.01, S(700, R * 0.1), '#4A4F57', 'center'); txt(c, '2019', x + R * 0.62, y + R * 0.01, S(700, R * 0.1), '#4A4F57', 'center'); c.restore();
  }
  // the site's slanted stripes; p 0→1 sweeps a full-cover band across the frame (scene swap happens at p=0.5)
  function stripeWipe(c, t, T0, d = 0.42) {
    const p = prog(t, T0 - d / 2, T0 + d / 2); if (p <= 0 || p >= 1) return; const sk = H * 0.45, span = W + sk + 900, x = lerp(-span, W + 200, io3(p));
    const band = (x0, w, col) => { c.beginPath(); c.moveTo(x0 + sk, 0); c.lineTo(x0 + sk + w, 0); c.lineTo(x0 + w, H); c.lineTo(x0, H); c.closePath(); c.fillStyle = col; c.fill(); };
    band(x - 60, 40, '#000'); band(x, 140, CY); band(x + 140, W + 300, NAVY); band(x + W + 440, 70, CY); band(x + W + 530, 26, '#000');
  }
  function slashDeco(c, y, t, k = 1) { // decorative stripes along an edge, like the site's hero bottom
    c.save(); c.globalAlpha = k; c.translate(0, y); c.rotate(-0.06); const o = (1 - k) * -W; c.fillStyle = '#000'; c.fillRect(o - 100, 70, W * 0.42, 10); c.fillStyle = CY; c.fillRect(o - 100, 30, W * 0.66, 22); c.fillStyle = NAVY; c.fillRect(o + W * 0.5, 14, W * 0.7, 26); c.restore();
  }

  // ---------- S0 crest (0–1.5) ----------
  function intro(c, t) {
    if (t >= 1.5) return; const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7); g.addColorStop(0, '#0D4F75'); g.addColorStop(1, '#03121D'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    bubbles(c, t, 2, 22, 0.55);
    // diamond gem lines draw on, then the wolf flashes in through a growing diamond
    const R = V ? 330 : 300, cx = W / 2, cy = H / 2, dk = io5(prog(t, 0.05, 0.7)); c.save(); c.strokeStyle = CY; c.lineWidth = 4; c.shadowColor = CY; c.shadowBlur = 24;
    for (let i = 0; i < 3; i++) { const sz = (120 + i * 95) * (1 + 0.06 * Math.sin(t * 3 + i)), per = 4 * Math.hypot(sz, sz * 0.62), k = clamp(dk * 1.4 - i * 0.2); c.setLineDash([per * k, per]); c.beginPath(); c.moveTo(cx, cy - sz); c.lineTo(cx + sz * 0.62, cy); c.lineTo(cx, cy + sz); c.lineTo(cx - sz * 0.62, cy); c.closePath(); c.globalAlpha = 1 - prog(t, 0.75, 1.0); c.stroke(); } c.setLineDash([]);
    c.restore();
    const rv = prog(t, 0.72, 1.0); if (t >= 0.72) { c.save(); const s = 60 + 1400 * o3(rv); c.beginPath(); c.moveTo(cx, cy - s); c.lineTo(cx + s * 0.8, cy); c.lineTo(cx, cy + s); c.lineTo(cx - s * 0.8, cy); c.closePath(); c.clip(); crest(c, cx, cy, R, t, 0.72); c.restore(); }
    const fl = pulse(t, 0.75, 9) * (t >= 0.75 ? 1 : 0); if (fl > 0) { c.fillStyle = `rgba(190,240,255,${0.6 * fl})`; c.fillRect(0, 0, W, H); }
    // eye glints
    for (const ex of [-0.11, 0.11]) { const gk = Math.sin(clamp(prog(t, 1.0, 1.35)) * Math.PI); if (gk > 0) sparkle(c, cx + ex * R, cy - 0.02 * R, 50 * gk, '#BFF3FF', t * 4); }
    // light leak sweep across the crest
    const sw = prog(t, 1.05, 1.45); if (sw > 0 && sw < 1) { c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip(); c.globalCompositeOperation = 'lighter'; const lx = lerp(cx - R * 1.5, cx + R * 1.5, sw), lg = c.createLinearGradient(lx - 120, 0, lx + 120, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.55)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = lg; c.fillRect(cx - R, cy - R, 2 * R, 2 * R); c.restore(); }
  }

  // ---------- S1 headline (1.5–4.0) ----------
  function headline(c, t) {
    if (t < 1.5 || t >= 4.0) return; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    // dark photo-like hero plate with the site's slashed bottom edge
    const pg = c.createLinearGradient(0, 0, W, H); pg.addColorStop(0, '#16384F'); pg.addColorStop(1, '#0A1E2C'); c.save(); c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, H * (V ? 0.8 : 0.8)); c.lineTo(0, H * (V ? 0.86 : 0.9)); c.closePath(); c.fillStyle = pg; c.fill(); c.clip();
    // giant paw trail behind the type
    for (let i = 0; i < 8; i++) { const T0 = 1.6 + i * 0.25, k = pop(prog(t, T0, T0 + 0.25)); if (k <= 0) continue; const x = (V ? 120 : 140) + i * (V ? 120 : 240), y = (V ? 1350 : 860) + (i % 2 ? -70 : 50) - i * (V ? 70 : 30); paw(c, x, y, 70 * k, rgba(CY, 0.18), 0.5 + (i % 2 ? 0.25 : -0.1)); }
    bubbles(c, t, 5, 18, 0.8); c.restore();
    slashDeco(c, H * (V ? 0.79 : 0.78), t, ease(t, 1.5, 1.9));
    const f = S(700, V ? 128 : 150), lines = V ? [['WE BRING', 1.55], ['THE SPA', 1.8], ['TO YOUR', 2.3], ['PAWS', 2.55]] : [['WE BRING THE SPA', 1.55], ['TO YOUR PAWS', 2.3]], ly0 = V ? 380 : 300, lh = V ? 165 : 185;
    lines.forEach(([s, T0], li) => { const words = s.split(' '); let total = tw(c, s, f); let x = W / 2 - total / 2; words.forEach((w, wi) => { const T = T0 + wi * 0.09, k = crit(prog(t, T, T + 0.25)), ww = tw(c, w, f); if (k > 0) { c.save(); c.translate(x + ww / 2, ly0 + li * lh); c.scale(lerp(2.2, 1, k), lerp(2.2, 1, k)); c.globalAlpha = clamp(k * 2.5); const isPaws = w === 'PAWS'; txt(c, w, 0, 0, f, isPaws ? CY : '#fff', 'center', 'middle'); c.restore(); } x += ww + tw(c, ' ', f); }); });
    const pk = pop(prog(t, 2.85, 3.15)); if (pk > 0) { const px = V ? W / 2 + 260 : W / 2 + 560, py = V ? ly0 + 3 * lh : ly0 + lh; paw(c, px, py - 10, 70 * pk, CY, 0.3); }
    const sk = A(t, 3.0, 0.35); c.save(); c.globalAlpha = sk; const sub = V ? ['Luxury mobile dog grooming', 'Orange County & surrounding areas'] : ['Luxury mobile dog grooming · now serving Orange County & surrounding areas'];
    sub.forEach((s, i) => txt(c, s, W / 2, (V ? ly0 + 4 * lh + 20 : ly0 + 2 * lh + 10) + i * 60 + (1 - sk) * 20, G(500, V ? 46 : 44), 'rgba(255,255,255,0.9)', 'center')); c.restore();
    const out = ease(t, 3.7, 4.0, (p) => p * p); if (out > 0) { c.save(); c.globalAlpha = out * 0.2; c.fillStyle = CY; c.fillRect(0, 0, W, H); c.restore(); }
  }

  // ---------- S2 bus (4.0–6.5) ----------
  function bus(c, t) {
    if (t < 4.0 || t >= 6.5) return; const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#CDEBFA'); sky.addColorStop(1, '#F4FAFD'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
    // the photo drives in from the right with speed streaks, settles with a suspension bounce, then a slow push
    const drive = ease(t, 4.0, 4.55, (p) => 1 - Math.pow(1 - p, 4)), settle = Math.sin(prog(t, 4.55, 4.9) * Math.PI * 2) * 8 * (1 - prog(t, 4.55, 4.9)), push = 1 + 0.08 * prog(t, 4.6, 6.5);
    const bw = V ? 1000 * 1.75 : 1240, bh = bw * 673 / 1080, bx = W / 2 - bw / 2 + (1 - drive) * W * 1.1 + (V ? 0 : 260), by = (V ? 520 : 275) + settle;
    c.save(); c.translate(W / 2, H / 2); c.scale(push, push); c.translate(-W / 2, -H / 2);
    if (drive < 1) { c.save(); c.strokeStyle = rgba(NAVY, 0.25 * (1 - drive)); c.lineWidth = 6; for (let i = 0; i < 14; i++) { const y = by + hash(i, 4) * bh, l = 300 + hash(i, 5) * 600; c.beginPath(); c.moveTo(bx + bw + 40, y); c.lineTo(bx + bw + 40 + l, y); c.stroke(); } c.restore(); }
    c.save(); c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 50; c.shadowOffsetY = 20; rr(c, bx, by, bw, bh, 34); c.fillStyle = '#fff'; c.fill(); c.restore(); cover(c, 'bus', bx, by, bw, bh, 34);
    c.restore();
    // copy block
    const cx0 = V ? 80 : 90, cy0 = V ? 1330 : 80;
    const tag = A(t, 4.5, 0.3); c.save(); c.globalAlpha = tag; rr(c, cx0, cy0 - 34, tw(c, 'MOBILE PET GROOMING SERVICE', G(800, 28), 4) + 50, 68, 34); c.fillStyle = '#E53935'; c.fill(); txt(c, 'MOBILE PET GROOMING SERVICE', cx0 + 25, cy0 + 1, G(800, 28), '#fff', 'left', 'middle', 4); c.restore();
    const L = V ? [['THE SPA', 4.75, NAVY], ['ON WHEELS.', 4.95, CY]] : [['THE SPA ON WHEELS.', 4.75, NAVY]];
    L.forEach(([s, T0, col], i) => { const k = crit(prog(t, T0, T0 + 0.3)); c.save(); c.beginPath(); c.rect(cx0 - 10, cy0 + 50 + i * 130, W, 140); c.clip(); if (V) txt(c, s, cx0, cy0 + 120 + i * 130 + (1 - k) * 140, S(700, 120), col); else { txt(c, 'THE SPA ', cx0, cy0 + 110 + (1 - k) * 140, S(700, 96), NAVY); txt(c, 'ON WHEELS.', cx0 + tw(c, 'THE SPA ', S(700, 96)), cy0 + 110 + (1 - k) * 140, S(700, 96), CY); } c.restore(); });
    const chips = ['Self-contained', 'Climate controlled', 'Water-temp controlled', 'Serving all of OC']; let x = V ? cx0 : 90, y = V ? cy0 + 380 : 420;
    chips.forEach((s, i) => { const k = pop(prog(t, 5.3 + i * 0.12, 5.65 + i * 0.12)), f = G(700, V ? 34 : 30), w = tw(c, s, f) + 80; if (V && x + w > W - 60) { x = cx0; y += 92; } if (!V) { x = 90; } if (k > 0) { c.save(); c.translate(x + w / 2, y); c.scale(k, k); rr(c, -w / 2, -34, w, 68, 34); c.fillStyle = i === 3 ? NAVY : '#fff'; c.shadowColor = 'rgba(0,0,0,0.15)'; c.shadowBlur = 20; c.fill(); c.shadowBlur = 0; c.beginPath(); c.arc(-w / 2 + 34, 0, 9, 0, TAU); c.fillStyle = CY; c.fill(); txt(c, s, -w / 2 + 54, 2, f, i === 3 ? '#fff' : NAVY); c.restore(); } if (V) x += w + 18; else y += 90; });
  }

  // ---------- S3 services (6.5–9.5) ----------
  const SERV = [['trim', 'ico_trim', 'Hair Trimming', ['Breed-specific haircuts', 'Face & ear grooming', 'Nail clipping', 'Paw pad trimming'], 6.55], ['deshed', 'ico_deshed', 'Deshedding Package', ['Thorough brushing', 'Deshedding treatments', 'Coat conditioning', 'A sleek, healthy coat'], 7.05]];
  function services(c, t) {
    if (t < 6.5 || t >= 9.5) return; c.fillStyle = ICE; c.fillRect(0, 0, W, H); bubbles(c, t, 9, 14, 0.9);
    const hk = crit(prog(t, 6.5, 6.8)); c.save(); c.globalAlpha = clamp(hk * 2); txt(c, 'PAMPERING, PERFECTED.', W / 2, (V ? 170 : 95) - (1 - hk) * 40, S(700, V ? 70 : 64), NAVY, 'center'); c.restore();
    const exitK = ease(t, 9.25, 9.5, (p) => p * p);
    SERV.forEach(([ph, ic, title, pts, T0], i) => {
      const k = crit(prog(t, T0, T0 + 0.45)); if (k <= 0) return;
      const cw = V ? 900 : 780, ch = V ? 800 : 860, x = V ? W / 2 - cw / 2 : W / 2 - cw - 30 + i * (cw + 60), y = V ? 280 + i * 820 : 170;
      const flip = 1 - k, rot = (i ? 1 : -1) * flip * 0.25;
      c.save(); c.translate(x + cw / 2, y + ch / 2 + flip * 300 + exitK * (i ? 1 : -1) * 1400); c.rotate(rot); c.scale(Math.max(0.02, Math.cos(flip * 1.2)), 1); c.translate(-cw / 2, -ch / 2);
      if (V) { const sc = 0.74; c.scale(1, sc); }
      c.save(); c.shadowColor = 'rgba(8,63,94,0.18)'; c.shadowBlur = 40; c.shadowOffsetY = 16; rr(c, 0, 60, cw, ch - 60, 28); c.fillStyle = '#fff'; c.fill(); c.restore();
      const pw = cw - 100, phh = pw * 430 / 880; cover(c, ph, 50, 0, pw, phh, 24);
      const ik = pop(prog(t, T0 + 0.3, T0 + 0.65)); c.save(); c.translate(cw / 2, phh); c.scale(ik, ik); c.rotate((1 - ik) * -1.5 + (ph === 'trim' ? Math.sin(t * 12) * 0.06 * pulse(t, T0 + 0.7, 3) : 0)); c.beginPath(); c.arc(0, 0, 105, 0, TAU); c.fillStyle = CY; c.fill(); c.beginPath(); c.arc(0, 0, 100, 0, TAU); c.clip(); contain(c, ic, 0, 0, 220); c.restore();
      const dk = io5(prog(t, T0 + 0.45, T0 + 0.7)); c.fillStyle = CY; c.fillRect(cw / 2 - 35 * dk, phh + 140, 70 * dk, 7);
      const tk = A(t, T0 + 0.5, 0.3); c.save(); c.globalAlpha = tk; txt(c, title, cw / 2, phh + 200 + (1 - tk) * 20, S(700, 54), INK, 'center'); c.restore();
      pts.forEach((p, j) => { const pk = A(t, T0 + 0.7 + j * 0.1, 0.25); if (pk <= 0) return; const yy = phh + 262 + j * 48; c.save(); c.globalAlpha = pk; c.translate((1 - pk) * 40, 0); paw(c, 150, yy, 22, CY, 0.2); txt(c, p, 185, yy + 2, G(500, 34), '#333', 'left'); c.restore(); });
      const bk = pop(prog(t, T0 + 1.15, T0 + 1.5)), press = pulse(t, 8.75 + i * 0.12, 9) * (t >= 8.75 + i * 0.12 ? 1 : 0); if (bk > 0) { c.save(); c.translate(cw / 2, ch - 30); c.scale(bk * (1 - press * 0.08), bk * (1 - press * 0.08)); rr(c, -170, -42, 340, 84, 14); c.fillStyle = press > 0.1 ? '#0E9ACB' : CY; c.fill(); txt(c, 'BOOK NOW', 0, 2, G(800, 36), '#fff', 'center'); c.restore(); }
      c.restore();
    });
  }

  // ---------- S4 happy pups (9.5–12.0) ----------
  function pups(c, t) {
    if (t < 9.5 || t >= 12.0) return; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    const tex = c.createLinearGradient(0, 0, 0, H); tex.addColorStop(0, ICE); tex.addColorStop(1, '#fff'); c.fillStyle = tex; c.fillRect(0, 0, W, H);
    const drift = (t - 9.5) * 18;
    const P = V ? [['kiss', 60, 330, 600, 420, 0.5, -0.05], ['stars', 60, 790, 600, 760, 0.5, 0.04], ['aussie', 600, 520, 420, 1040, 0.5, 0.03]] : [['kiss', 90, 100, 720, 430, 0.5, -0.04], ['stars', 90, 580, 720, 430, 0.4, 0.03], ['aussie', 1180, 90, 650, 900, 0.45, 0.05]];
    P.forEach(([k, x, y, w, h, fy, r], i) => { const T0 = 9.55 + i * 0.15, a = crit(prog(t, T0, T0 + 0.45)); if (a <= 0) return; c.save(); c.translate(x + w / 2, y + h / 2 + (1 - a) * 500 - drift * (i - 1)); c.rotate(r * (1 - a) * 3 + r * 0.3); c.scale(lerp(0.7, 1, a), lerp(0.7, 1, a));
      c.shadowColor = 'rgba(8,63,94,0.25)'; c.shadowBlur = 40; c.shadowOffsetY = 18; rr(c, -w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 34); c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent'; cover(c, k, -w / 2, -h / 2, w, h, 26, 0.5, fy); c.restore(); });
    // glints: freshly groomed shine
    [[V ? 300 : 420, V ? 520 : 300], [V ? 820 : 1440, V ? 760 : 360], [V ? 250 : 330, V ? 1150 : 770]].forEach(([x, y], i) => { const k = Math.sin(clamp(prog(t, 10.2 + i * 0.25, 10.6 + i * 0.25)) * Math.PI); if (k > 0) sparkle(c, x, y, 60 * k, '#fff', t * 3); });
    // 07+ years badge counting up
    const bx = V ? W / 2 : 995, by = V ? 1560 : 470, bk = pop(prog(t, 10.0, 10.4)); if (bk > 0) { c.save(); c.translate(bx, by); c.scale(bk, bk); c.beginPath(); c.arc(0, 0, 215, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.beginPath(); c.arc(0, 0, 190, 0, TAU); c.fillStyle = NAVY; c.fill();
      const rk = io5(prog(t, 10.1, 10.9)); c.strokeStyle = CY; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, 202, -Math.PI / 2, -Math.PI / 2 + TAU * rk); c.stroke();
      const n = Math.round(7 * o3(prog(t, 10.1, 10.8))); txt(c, String(n).padStart(2, '0') + '+', 0, -30, S(700, 120), '#fff', 'center'); txt(c, 'YEARS OF', 0, 62, G(800, 34), '#fff', 'center', 'middle', 2); txt(c, 'EXPERIENCE', 0, 104, G(800, 34), '#fff', 'center', 'middle', 2); c.restore(); }
    const qk = A(t, 10.8, 0.4); if (qk > 0) { c.save(); c.globalAlpha = qk; if (V) txt(c, 'Exceptional care, comfort & pampering.', W / 2, 170, S(700, 46), NAVY, 'center'); else { txt(c, 'Exceptional care,', 995, 770, S(700, 34), NAVY, 'center'); txt(c, 'comfort &', 995, 818, S(700, 34), NAVY, 'center'); txt(c, 'pampering.', 995, 866, S(700, 34), CY, 'center'); } c.restore(); }
  }

  // ---------- S5 end card (12.0–15.0) ----------
  function endCard(c, t) {
    if (t < 12.0) return; const g = c.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W); g.addColorStop(0, '#0E5A86'); g.addColorStop(1, '#041826'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    bubbles(c, t, 13, 24, 0.6);
    const R = V ? 260 : 250, cx = V ? W / 2 : 520, cy = V ? 470 : H / 2 - 30; const ck = pop(prog(t, 12.0, 12.4)); c.save(); c.translate(cx, cy); c.scale(ck, ck); c.translate(-cx, -cy); c.save(); c.shadowColor = rgba(CY, 0.7); c.shadowBlur = 80; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.restore(); crest(c, cx, cy, R, t, 12.0); c.restore();
    const rx = V ? W / 2 : 880, al = V ? 'center' : 'left'; let y = V ? 860 : 250;
    const L = [['WE BRING THE SPA', 12.35, '#fff'], ['TO YOUR PAWS', 12.5, CY]]; L.forEach(([s, T0, col], i) => { const k = crit(prog(t, T0, T0 + 0.3)); c.save(); c.beginPath(); c.rect(0, y - 60 + i * 95, W, 110); c.clip(); txt(c, s, rx, y + i * 95 + (1 - k) * 100, S(700, V ? 78 : 88), col, al); c.restore(); }); y += V ? 260 : 250;
    const bk = pop(prog(t, 12.9, 13.25)), press = pulse(t, 13.6, 9) * (t >= 13.6 ? 1 : 0); if (bk > 0) { const bw = V ? 860 : 960, bx = V ? W / 2 : rx + bw / 2; c.save(); c.translate(bx, y); c.scale(bk * (1 - 0.06 * press), bk * (1 - 0.06 * press)); rr(c, -bw / 2, -60, bw, 120, 18); c.fillStyle = '#fff'; c.shadowColor = rgba(CY, 0.6 * (0.4 + press)); c.shadowBlur = 40; c.fill(); c.shadowBlur = 0; txt(c, 'BOOK YOUR MOBILE GROOMING APPOINTMENT', 0, 3, G(800, V ? 34 : 38), INK, 'center'); c.restore();
      if (t > 13.3 && t < 14.2) { const k = prog(t, 13.3, 13.6); c.save(); c.translate(bx + 260 + (1 - k) * 160, y + 40 + (1 - k) * 120); c.scale(1.8 - 0.3 * press, 1.8 - 0.3 * press); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.lineTo(6, 16.5); c.lineTo(10, 25); c.lineTo(13.5, 23.5); c.lineTo(9.5, 15); c.lineTo(17, 15); c.closePath(); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1.5; c.fill(); c.stroke(); c.restore(); }
      const rp = prog(t, 13.6, 14.0); if (rp > 0 && rp < 1) { c.save(); c.strokeStyle = rgba(CY, 1 - rp); c.lineWidth = 6; rr(c, bx - bw / 2 - 30 * rp, y - 60 - 30 * rp, bw + 60 * rp, 120 + 60 * rp, 18 + 20 * rp); c.stroke(); c.restore(); } }
    y += V ? 170 : 150; const ok = A(t, 13.2, 0.3); c.save(); c.globalAlpha = ok; txt(c, 'OR CALL ME AT:', rx, y, G(800, 34), 'rgba(255,255,255,0.85)', al, 'middle', 2); c.restore();
    y += V ? 100 : 90; const nk = crit(prog(t, 13.35, 13.65)); if (nk > 0) { const nf = G(800, V ? 84 : 76), nw = tw(c, '(714) 924-2927', nf) + 110, nx = V ? W / 2 - nw / 2 : rx; c.save(); c.globalAlpha = clamp(nk * 2); c.translate(0, (1 - nk) * 50); rr(c, nx, y - 38, 76, 76, 12); c.fillStyle = CY; c.fill(); phoneIco(c, nx + 38, y, 46, '#fff'); txt(c, '(714) 924-2927', nx + 110, y + 3, nf, '#fff'); c.restore(); }
    y += V ? 140 : 120; const uk = A(t, 13.7, 0.35); c.save(); c.globalAlpha = uk; txt(c, 'anaheimprancingpups.com', rx, y, M(700, V ? 34 : 32), CY, al, 'middle', 2); c.restore();
    slashDeco(c, H - (V ? 150 : 70), t, ease(t, 12.2, 12.7));
  }

  // ---------- finishing ----------
  const HITS = [0.75, 1.5, 1.8, 2.3, 2.55, 4.0, 4.55, 6.5, 7.0, 8.75, 9.5, 10.0, 12.0, 13.6];
  const WIPES = [1.5, 4.0, 6.5, 9.5, 12.0];
  let BUF = null, GRAIN = null, TREAL = 0;
  function finish(c, t) {
    let h = 0; for (const T0 of HITS) h = Math.max(h, pulse(t, T0, 15));
    if (h > 0.05) { if (!BUF) { BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; } const b = BUF.getContext('2d'); b.clearRect(0, 0, W, H); b.drawImage(cv, 0, 0); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.12 * h; c.drawImage(BUF, -10 * h, 0); c.drawImage(BUF, 10 * h, 0); c.restore(); }
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 12; } g.putImageData(d, 0, 0); }
    const fr = Math.round(TREAL * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const fo = prog(t, 14.6, 15); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  }
  function renderAt(tReal) {
    const t = toDesign(tReal), c = ctx; TREAL = tReal; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.filter = 'none'; c.imageSmoothingQuality = 'high';
    let sh = 0; for (const T0 of HITS) sh = Math.max(sh, pulse(t, T0, 18) * 8); c.save(); c.translate((hash(Math.round(t * FPS), 3) - 0.5) * 2 * sh, (hash(Math.round(t * FPS), 4) - 0.5) * 2 * sh);
    intro(c, t); headline(c, t); bus(c, t); services(c, t); pups(c, t); endCard(c, t); c.restore();
    for (const T0 of WIPES) stripeWipe(c, t, T0); finish(c, t);
  }
  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(S(700, 60)), document.fonts.load(G(700, 30)), document.fonts.load(G(500, 30)), document.fonts.load(G(800, 30)), document.fonts.load(M(700, 20)), ...ASSETS.map((k) => load(k, `../assets/pups/${k}.png`))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
