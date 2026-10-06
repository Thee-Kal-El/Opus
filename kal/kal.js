// THEE_KAL_EL — "Blockchain, explained." 20s SaaS-style promo, 1920x1080 @ 60fps, cut to 120 BPM.
// 0–2 hook: "Blockchain is confusing." → struck through → "the future." · 2–4 meet Kal El (channel card + stats)
// 4–14 a bento board of 12 real-world use cases, each card with a live mini-UI and the video that covers it,
// the camera gliding card to card, then pulling back to the whole board · 14–17 proof: a wall of real videos
// · 17–20 end card with Subscribe + platforms. Light, clean, product-launch look. renderAt(t) is deterministic.
(() => {
  'use strict';
  const K = window.KIT, { TAU, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, rr, hash } = K;
  const W = 1920, H = 1080, FPS = 60, DUR = 20, BT = 0.5;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const C = { bg: '#F5F2EA', bg2: '#EEEADF', ink: '#141413', mute: '#6E6A62', faint: '#A8A398', line: '#E3DDD0', card: '#FFFFFF', accent: '#FF5A36', violet: '#6E56CF', green: '#16A34A', blue: '#2F6BFF', red: '#FF0033', yellow: '#F5B700' };
  const D = (s) => `800 ${s}px "Inter Tight", sans-serif`;
  const G = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`;
  const M = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const SERIF = (s) => `italic 400 ${s}px "Instrument Serif", serif`;
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const VIDS = ['snakepot', 'cypher', 'limewire_back', 'limewire_merch', 'protonmail', 'damnbruh'];
  const SHORTS = ['short_dapps', 'short_netflix', 'short_vibes', 'short_tcg', 'short_onepiece', 'short_eminem', 'short_bumper', 'short_summer', 'short_playabull', 'short_nitro'];
  const ASSETS = ['avatar_hd', 'banner_hd', 'short_heatbit', ...VIDS, ...SHORTS];

  // ---------- helpers ----------
  const ease = (t, a, b, f = io3) => f(prog(t, a, b));
  const oexp = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  function cover(c, k, x, y, w, h, r = 0) { const im = IMG[k]; if (!im) return; const s = Math.max(w / im.width, h / im.height), sw = w / s, sh = h / s; c.save(); if (r) { rr(c, x, y, w, h, r); c.clip(); } c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h); c.restore(); }
  // word-by-word reveal: rise + un-blur + fade (the modern product-video type move)
  function words(c, parts, x, y, t, t0, o = {}) {
    // parts: [[text, font, color]], laid out on one line; returns total width
    let w = 0; const ws = parts.map(([s, f]) => { c.font = f; const m = c.measureText(s).width; return m; }); const gap = o.gap ?? 0.26 * (o.size || 100);
    const total = ws.reduce((a, b) => a + b, 0) + gap * (parts.length - 1); let cx = o.align === 'center' ? x - total / 2 : x;
    parts.forEach(([s, f, col], i) => { const k = oexp(prog(t, t0 + i * (o.stag ?? 0.08), t0 + i * (o.stag ?? 0.08) + 0.45)); if (k > 0.001) {
      c.save(); c.globalAlpha *= k; if (k < 0.98) c.filter = `blur(${(1 - k) * 14}px)`; c.font = f; c.fillStyle = col; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(s, cx, y + (1 - k) * 40); c.restore(); }
      cx += ws[i] + gap; });
    w = total; return w;
  }
  function card(c, x, y, w, h, r = 28, o = {}) {
    c.save(); c.shadowColor = `rgba(40,30,10,${o.sh ?? 0.10})`; c.shadowBlur = o.blur ?? 40; c.shadowOffsetY = o.oy ?? 14; rr(c, x, y, w, h, r); c.fillStyle = o.fill || C.card; c.fill(); c.restore();
    rr(c, x, y, w, h, r); c.strokeStyle = o.stroke || C.line; c.lineWidth = o.lw ?? 1.5; c.stroke();
  }
  function pill(c, x, y, s, font, fg, bg, o = {}) { c.font = font; const w = c.measureText(s).width + (o.padX ?? 28) * 2 + (o.icon ? 30 : 0), h = o.h ?? 56; rr(c, x - (o.center ? w / 2 : 0), y - h / 2, w, h, h / 2); c.fillStyle = bg; c.fill(); if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = 1.5; c.stroke(); } const x0 = x - (o.center ? w / 2 : 0); if (o.icon) o.icon(c, x0 + (o.padX ?? 28) + 10, y); txt(c, s, x0 + (o.padX ?? 28) + (o.icon ? 30 : 0), y + 1, font, fg, 'left', 'middle', o.ls ?? 0); return w; }
  const dot = (col) => (c, x, y) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill(); };
  function check(c, x, y, s, col = C.green, k = 1) { c.save(); c.strokeStyle = col; c.lineWidth = s * 0.16; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); const p = [[-0.35, 0], [-0.08, 0.28], [0.4, -0.3]]; c.moveTo(x + p[0][0] * s, y + p[0][1] * s); if (k > 0.5) { c.lineTo(x + p[1][0] * s, y + p[1][1] * s); c.lineTo(x + lerp(p[1][0], p[2][0], (k - 0.5) * 2) * s, y + lerp(p[1][1], p[2][1], (k - 0.5) * 2) * s); } else c.lineTo(x + lerp(p[0][0], p[1][0], k * 2) * s, y + lerp(p[0][1], p[1][1], k * 2) * s); c.stroke(); c.restore(); }
  function avatar(c, x, y, r, ring = 0) { c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); if (IMG.avatar_hd) c.drawImage(IMG.avatar_hd, x - r, y - r, r * 2, r * 2); c.restore(); if (ring) { c.beginPath(); c.arc(x, y, r + ring * 0.5, 0, TAU); c.strokeStyle = '#fff'; c.lineWidth = ring; c.stroke(); } }

  function ytButton(c, x, y, w, h, r, triK = 1, fill = C.red) {
    rr(c, x - w / 2, y - h / 2, w, h, r); c.fillStyle = fill; c.fill();
    if (triK > 0.01) { const s = h * 0.24 * triK; c.beginPath(); c.moveTo(x - s * 0.8, y - s); c.lineTo(x + s * 1.1, y); c.lineTo(x - s * 0.8, y + s); c.closePath(); c.fillStyle = '#fff'; c.fill(); }
  }
  function iconYT(c, x, y, s) { ytButton(c, x, y, s * 1.4, s, s * 0.26); }
  function iconTikTok(c, x, y, s) {
    rr(c, x - s / 2, y - s / 2, s, s, s * 0.24); c.fillStyle = '#000'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.stroke();
    const note = (dx, dy, col) => { c.save(); c.translate(x + dx, y + dy); c.strokeStyle = col; c.lineWidth = s * 0.085; c.lineCap = 'round';
      c.beginPath(); c.arc(-s * 0.08, s * 0.16, s * 0.12, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(s * 0.04, s * 0.16); c.lineTo(s * 0.04, -s * 0.27); c.quadraticCurveTo(s * 0.1, -s * 0.12, s * 0.24, -s * 0.11); c.stroke(); c.restore(); };
    note(-s * 0.025, -s * 0.02, '#25F4EE'); note(s * 0.025, s * 0.02, '#FE2C55'); note(0, 0, '#fff');
  }
  function iconInsta(c, x, y, s) {
    const g = c.createLinearGradient(x - s / 2, y + s / 2, x + s / 2, y - s / 2); g.addColorStop(0, '#FEDA75'); g.addColorStop(0.3, '#FA7E1E'); g.addColorStop(0.55, '#D62976'); g.addColorStop(0.8, '#962FBF'); g.addColorStop(1, '#4F5BD5');
    rr(c, x - s / 2, y - s / 2, s, s, s * 0.26); c.fillStyle = g; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = s * 0.075; rr(c, x - s * 0.3, y - s * 0.3, s * 0.6, s * 0.6, s * 0.17); c.stroke(); c.beginPath(); c.arc(x, y, s * 0.14, 0, TAU); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x + s * 0.18, y - s * 0.18, s * 0.04, 0, TAU); c.fill();
  }
  function iconTwitch(c, x, y, s) {
    rr(c, x - s / 2, y - s / 2, s, s, s * 0.24); c.fillStyle = '#9146FF'; c.fill();
    const u = s / 10; c.save(); c.translate(x - 3.2 * u, y - 3.4 * u); c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(0.9 * u, 0); c.lineTo(6.6 * u, 0); c.lineTo(6.6 * u, 4.1 * u); c.lineTo(4.7 * u, 6 * u); c.lineTo(3.2 * u, 6 * u); c.lineTo(2 * u, 7.2 * u); c.lineTo(2 * u, 6 * u); c.lineTo(0, 6 * u); c.lineTo(0, 0.9 * u); c.closePath(); c.fill();
    c.fillStyle = '#9146FF'; c.fillRect(2.6 * u, 1.4 * u, 0.8 * u, 2.2 * u); c.fillRect(4.6 * u, 1.4 * u, 0.8 * u, 2.2 * u); c.restore();
  }
  function iconKick(c, x, y, s) {
    rr(c, x - s / 2, y - s / 2, s, s, s * 0.2); c.fillStyle = '#53FC18'; c.fill();
    const u = s / 10; c.fillStyle = '#000'; c.save(); c.translate(x - 3.2 * u, y - 3.5 * u);
    c.fillRect(0, 0, 2.2 * u, 7 * u); c.fillRect(2.2 * u, 2.3 * u, 1.4 * u, 2.4 * u); c.fillRect(3.6 * u, 1.1 * u, 1.4 * u, 1.3 * u); c.fillRect(3.6 * u, 4.6 * u, 1.4 * u, 1.3 * u);
    c.fillRect(5, 0, 0, 0); c.fillRect(5 * u, 0, 1.6 * u, 1.3 * u); c.fillRect(5 * u, 5.7 * u, 1.6 * u, 1.3 * u); c.restore();
  }
  const ICONS = [iconYT, iconTikTok, iconInsta, iconTwitch, iconKick];

  function chainSol(c, x, y, s) {
    const g = c.createLinearGradient(x - s / 2, y + s / 2, x + s / 2, y - s / 2); g.addColorStop(0, '#9945FF'); g.addColorStop(1, '#14F195'); c.fillStyle = g;
    for (const [dy, dir] of [[-0.32, 1], [0, -1], [0.32, 1]]) { const yy = y + dy * s, h = s * 0.17, w = s * 0.86, sk = s * 0.18 * dir; c.beginPath(); c.moveTo(x - w / 2 + Math.max(0, sk), yy - h / 2); c.lineTo(x + w / 2 + Math.min(0, sk), yy - h / 2); c.lineTo(x + w / 2 - Math.max(0, sk), yy + h / 2); c.lineTo(x - w / 2 - Math.min(0, sk), yy + h / 2); c.closePath(); c.fill(); }
  }
  function chainEth(c, x, y, s) {
    const t = y - s * 0.55, m = y + s * 0.08, b = y + s * 0.55, w = s * 0.36;
    const f = (pts, col) => { c.beginPath(); pts.forEach(([a, bb], i) => (i ? c.lineTo(a, bb) : c.moveTo(a, bb))); c.closePath(); c.fillStyle = col; c.fill(); };
    f([[x, t], [x - w, m], [x, m + s * 0.1]], '#C9C9F2'); f([[x, t], [x + w, m], [x, m + s * 0.1]], '#8C8CDB');
    f([[x, b], [x - w, m + s * 0.14], [x, m + s * 0.24]], '#C9C9F2'); f([[x, b], [x + w, m + s * 0.14], [x, m + s * 0.24]], '#8C8CDB');
  }
  function chainAvax(c, x, y, s) {
    c.fillStyle = '#E84142'; c.beginPath(); c.arc(x, y, s / 2, 0, TAU); c.fill(); c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(x - s * 0.03, y - s * 0.28); c.lineTo(x + s * 0.11, y - s * 0.04); c.lineTo(x - s * 0.06, y + s * 0.24); c.lineTo(x - s * 0.3, y + s * 0.24); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x + s * 0.17, y + s * 0.05); c.lineTo(x + s * 0.3, y + s * 0.24); c.lineTo(x + s * 0.05, y + s * 0.24); c.closePath(); c.fill();
  }
  function chainPoly(c, x, y, s) {
    rr(c, x - s / 2, y - s / 2, s, s, s * 0.24); c.fillStyle = '#8247E5'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = s * 0.075; c.lineJoin = 'round';
    const hex = (cx, cy, r) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * TAU / 6; c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); c.stroke(); };
    hex(x - s * 0.1, y + s * 0.05, s * 0.17); hex(x + s * 0.1, y - s * 0.05, s * 0.17);
  }
  function chainBtc(c, x, y, s) {
    c.fillStyle = '#F7931A'; c.beginPath(); c.arc(x, y, s / 2, 0, TAU); c.fill();
    c.save(); c.translate(x, y); c.rotate(0.24); txt(c, 'B', 2, 4, D(s * 0.62), '#fff', 'center'); c.fillStyle = '#fff'; for (const dx of [-0.06, 0.07]) { c.fillRect(dx * s - s * 0.025, -s * 0.33, s * 0.05, s * 0.1); c.fillRect(dx * s - s * 0.025, s * 0.23, s * 0.05, s * 0.1); } c.restore();
  }
  const CHAINS = [[chainSol, 'SOLANA'], [chainEth, 'ETHEREUM'], [chainBtc, 'BITCOIN'], [chainAvax, 'AVALANCHE'], [chainPoly, 'POLYGON']];
  const ICONS5 = ICONS;

  // ---------- background ----------
  function background(c, t, cam) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const s = cam ? cam.z : 1, ox = cam ? (W / 2 - cam.x * s) : 0, oy = cam ? (H / 2 - cam.y * s) : 0, step = 40 * s;
    c.fillStyle = 'rgba(20,20,19,0.10)';
    for (let x = ((ox % step) + step) % step; x < W; x += step) for (let y = ((oy % step) + step) % step; y < H; y += step) c.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
    const g = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 1.0); g.addColorStop(0, 'rgba(245,242,234,0)'); g.addColorStop(1, 'rgba(232,226,212,0.9)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }

  // ---------- S1 hook (0–2) ----------
  function hook(c, t) {
    if (t > 2.15) return; const ex = ease(t, 1.85, 2.1, io5); c.save(); c.globalAlpha = 1 - ex; c.translate(0, -ex * 80); if (ex > 0) c.filter = `blur(${ex * 10}px)`;
    const y = 590, size = 132;
    // measure layout: "Blockchain is" + slot
    c.font = D(size); const a = c.measureText('Blockchain is').width; c.font = SERIF(size * 1.12); const b1 = c.measureText('confusing.').width, b2 = c.measureText('the future.').width;
    const swap = ease(t, 1.25, 1.6, io5), slot = lerp(b1, b2, swap), total = a + 34 + slot, x0 = W / 2 - total / 2;
    words(c, [['Blockchain', D(size), C.ink], ['is', D(size), C.ink]], x0, y, t, 0.1, { size, stag: 0.12 });
    const bx = x0 + a + 34;
    // "confusing." then a strike, then it drops away
    const ck = oexp(prog(t, 0.4, 0.85)), drop = ease(t, 1.25, 1.55, io5);
    if (ck > 0 && drop < 1) { c.save(); c.globalAlpha *= ck * (1 - drop); c.filter = ck < 0.98 ? `blur(${(1 - ck) * 14}px)` : 'none'; txt(c, 'confusing.', bx, y + (1 - ck) * 40 + drop * 70, SERIF(size * 1.12), C.faint, 'left', 'alphabetic'); c.restore();
      const sk = ease(t, 0.95, 1.2, io3); if (sk > 0) { c.save(); c.globalAlpha *= 1 - drop; c.strokeStyle = C.accent; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx - 6, y - size * 0.3 + drop * 70); c.lineTo(bx - 6 + (b1 + 12) * sk, y - size * 0.3 + drop * 70); c.stroke(); c.restore(); } }
    const fk = oexp(prog(t, 1.35, 1.8)); if (fk > 0) {
      const hk = ease(t, 1.45, 1.8, io5); c.save(); c.fillStyle = rgba(C.accent, 0.16); rr(c, bx - 14, y - size * 0.86, (b2 + 28) * hk, size * 1.08, 14); c.fill(); c.restore();
      c.save(); c.globalAlpha *= fk; if (fk < 0.98) c.filter = `blur(${(1 - fk) * 14}px)`; txt(c, 'the future.', bx, y + (1 - fk) * -40, SERIF(size * 1.12), C.accent, 'left', 'alphabetic'); c.restore(); }
    const lk = A(t, 0.05, 0.4); c.save(); c.globalAlpha *= lk; pill(c, W / 2, 330, 'THEE_KAL_EL', M(700, 22), C.mute, 'rgba(255,255,255,0.7)', { center: true, stroke: C.line, ls: 4, icon: dot(C.accent), h: 50 }); c.restore();
    c.restore();
  }

  // ---------- S2 meet (2–4) ----------
  function meet(c, t) {
    if (t < 1.95 || t > 4.15) return; const ex = ease(t, 3.8, 4.1, io5); c.save(); c.translate(-ex * 500, 0); c.globalAlpha = 1 - ex;
    words(c, [['Meet', D(118), C.ink], ['Kal El.', SERIF(132), C.accent]], 160, 470, t, 2.05, { size: 118, stag: 0.12 });
    const sk = oexp(prog(t, 2.4, 2.85)); if (sk > 0) { c.save(); c.globalAlpha *= sk; c.translate(0, (1 - sk) * 30);
      txt(c, 'Blockchain tech, explained in plain', 164, 560, G(500, 40), C.mute); txt(c, 'English — one real project at a time.', 164, 612, G(500, 40), C.mute); c.restore(); }
    [['121 videos', C.ink], ['Web3', C.violet], ['Crypto', C.accent], ['Gaming', C.green]].forEach(([s, col], i) => { const k = pop(prog(t, 2.75 + i * 0.1, 3.2 + i * 0.1)); if (k <= 0) return; c.save(); c.translate(164, 720); c.globalAlpha *= clamp(k); const x = [0, 210, 340, 490][i]; c.translate(x, 0); c.scale(k, k);
      pill(c, 0, 0, s, G(700, 30), col === C.ink ? '#fff' : col, col === C.ink ? C.ink : rgba(col, 0.1), { stroke: col === C.ink ? null : rgba(col, 0.35), h: 62, padX: 24 }); c.restore(); });
    // channel card (right)
    const k = oexp(prog(t, 2.1, 2.7)); if (k > 0) {
      const x = 1040, y = 250, w = 720, h = 580; c.save(); c.globalAlpha *= clamp(k * 1.5); c.translate(x + w / 2, y + h / 2 + (1 - k) * 120); c.rotate((1 - k) * 0.06 - 0.015 * Math.sin(t)); c.translate(-w / 2, -h / 2);
      card(c, 0, 0, w, h, 32, { sh: 0.16, blur: 60, oy: 24 }); cover(c, 'banner_hd', 16, 16, w - 32, 230, 20);
      avatar(c, 110, 290, 76, 8); txt(c, 'Kal El', 210, 330, D(56), C.ink); txt(c, '@Thee_Kal_El', 212, 380, G(500, 30), C.mute);
      const subs = Math.round(lerp(0, 230, ease(t, 2.5, 3.3))); txt(c, `${subs} subscribers  ·  121 videos`, 40, 450, G(500, 28), C.mute);
      txt(c, 'Just showing you the way to play-to-earn games and crypto!', 40, 494, G(400, 26), C.ink);
      const sb = t > 3.35; c.save(); c.translate(w - 140, 330); const p = sb ? 1 - 0.1 * Math.exp(-(t - 3.35) * 14) : 1; c.scale(p, p); rr(c, -100, -32, 200, 64, 32); c.fillStyle = sb ? '#E9E5DC' : C.ink; c.fill(); txt(c, sb ? 'Subscribed' : 'Subscribe', 0, 2, G(700, 26), sb ? C.ink : '#fff', 'center'); c.restore();
      c.restore();
    }
  }

  // ---------- S3 use-case bento (4–14) ----------
  const CW = 560, CH = 420, PX = 600, PY = 460;
  const CASES = [
    ['PAYMENTS', 'Spend crypto like cash', 'Cards that pay with your wallet.', 'cypher', 'Thee Crypto Card is here', payAnim],
    ['GAMING', 'Play games. Earn rewards.', 'Skill-based, wallet-powered games.', 'snakepot', 'SnakePot! Free Web3 games', snakeAnim],
    ['EARN', 'Get paid to test apps', 'Try new dApps, earn for feedback.', 'short_dapps', 'Get paid to test Solana dApps', testAnim],
    ['MEDIA', 'Own your music & files', 'Creators and fans, owning the media.', 'limewire_back', 'LimeWire is back', waveAnim],
    ['PRIVACY', 'Keep your data yours', 'Encrypted by default. Your keys.', 'protonmail', 'Proton Mail walkthrough', lockAnim],
    ['DEPIN', 'Hardware that earns', 'Real devices, rewarded onchain.', 'short_heatbit', 'Meet Heatbit', depinAnim],
    ['COLLECTIBLES', 'Collect what you love', 'Cards, packs and digital ownership.', 'short_vibes', 'Vibes TCG', collectAnim],
    ['SOCIAL', 'Watch together, anywhere', 'Shared experiences, built on web3.', 'short_netflix', 'Netflix watch parties', socialAnim],
    ['DEFI', 'Swap, stake & earn', 'Your bank, without the bank.', null, null, swapAnim],
    ['REAL-WORLD ASSETS', 'Own a slice of anything', 'Stocks, property, art — tokenized.', null, null, rwaAnim],
    ['DAOS', 'Vote with your wallet', 'Communities that run themselves.', null, null, voteAnim],
    ['MULTICHAIN', 'Every chain, explained', 'Solana, Ethereum, Avalanche & more.', null, null, chainAnim],
  ];
  const ORDER = [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11];
  const cellOf = (i) => [(i % 4) * PX, Math.floor(i / 4) * PY];
  const BOARD = [1.5 * PX, 1 * PY], T0 = 4.45, STEP = 0.72;
  function boardCam(t) {
    const zIn = 1.32, zAll = 0.71;
    if (t < T0) { const k = ease(t, 4.0, T0, io5), [x, y] = cellOf(ORDER[0]); return { x: lerp(BOARD[0], x, k), y: lerp(BOARD[1] + 300, y, k), z: lerp(0.62, zIn, k) }; }
    const f = (t - T0) / STEP, i = Math.min(11, Math.floor(f)), fr = f - i;
    if (t >= T0 + 12 * STEP - 0.25) { const k = ease(t, T0 + 12 * STEP - 0.25, T0 + 12 * STEP + 0.45, io5), [x, y] = cellOf(ORDER[11]); return { x: lerp(x, BOARD[0], k), y: lerp(y, BOARD[1], k), z: Math.exp(lerp(Math.log(zIn), Math.log(zAll), k)) }; }
    const a = cellOf(ORDER[i]), b = cellOf(ORDER[Math.min(11, i + 1)]), m = io5(clamp((fr - 0.62) / 0.38));
    return { x: lerp(a[0], b[0], m), y: lerp(a[1], b[1], m), z: zIn * (1 - 0.06 * Math.sin(Math.PI * m)) };
  }
  const focusIdx = (t) => (t < T0 || t > T0 + 12 * STEP - 0.25 ? -1 : ORDER[Math.min(11, Math.floor((t - T0) / STEP + 0.38))]);
  function board(c, t) {
    if (t < 3.95 || t > 14.15) return; const cam = boardCam(t), fi = focusIdx(t), all = t > T0 + 12 * STEP - 0.25;
    const ex = ease(t, 13.85, 14.1, io5);
    background(c, t, cam); c.save(); c.globalAlpha = 1 - ex; c.translate(W / 2, H / 2); c.scale(cam.z * (1 + ex * 0.3), cam.z * (1 + ex * 0.3)); c.translate(-cam.x, -cam.y);
    CASES.forEach((cs, i) => {
      const [cx, cy] = cellOf(i), appear = oexp(prog(t, 3.95 + i * 0.03, 4.5 + i * 0.03)), focused = i === fi, dim = all ? 1 : focused ? 1 : 0.55;
      const fk = focused ? 1 : 0; c.save(); c.translate(cx, cy + (1 - appear) * 80); c.globalAlpha *= appear; const sc = all ? 1 : focused ? 1.0 : 0.96; c.scale(sc, sc);
      card(c, -CW / 2, -CH / 2, CW, CH, 30, { sh: 0.08 + fk * 0.08, blur: 30 + fk * 30, stroke: focused ? rgba(C.accent, 0.5) : C.line, lw: focused ? 2.5 : 1.5 });
      c.globalAlpha *= dim; drawCase(c, cs, i, t);
      c.restore();
    });
    c.restore();
    // HUD: counter pill + header
    const hk = A(t, 4.3, 0.4) * (1 - ease(t, 12.6, 12.9)) * (1 - ex); if (hk > 0 && fi >= 0) { c.save(); c.globalAlpha = hk; const n = String(ORDER.indexOf(fi) + 1).padStart(2, '0'); pill(c, 80, 80, `USE CASE ${n} / 12`, M(700, 22), C.ink, 'rgba(255,255,255,0.85)', { stroke: C.line, ls: 3, icon: dot(C.accent), h: 52 }); c.restore(); }
    const ik = ease(t, 3.95, 4.15) * (1 - ease(t, 4.35, 4.6)); if (ik > 0) { c.save(); c.globalAlpha = ik; words(c, [['Everything', D(110), C.ink], ['blockchain', D(110), C.ink], ['can', D(110), C.ink], ['do.', SERIF(122), C.accent]], W / 2, 580, t, 3.95, { size: 110, align: 'center', stag: 0.05 }); c.restore(); }
    const ok = oexp(prog(t, 13.2, 13.6)) * (1 - ex); if (ok > 0) { c.save(); c.globalAlpha = ok; c.translate(W / 2, H / 2 + (1 - ok) * 30); c.filter = ok < 0.98 ? `blur(${(1 - ok) * 10}px)` : 'none';
      card(c, -560, -110, 1120, 220, 110, { fill: 'rgba(255,255,255,0.94)', sh: 0.2, blur: 80, oy: 20 }); c.filter = 'none';
      txt(c, 'One channel.', -470, 8, D(92), C.ink, 'left', 'middle'); c.font = D(92); const w1 = c.measureText('One channel.').width; txt(c, 'Every use case.', -470 + w1 + 26, 14, SERIF(104), C.accent, 'left', 'middle'); c.restore(); }
  }
  function drawCase(c, [tag, title, sub, thumb, vid, anim], i, t) {
    const x0 = -CW / 2 + 36, y0 = -CH / 2 + 46;
    txt(c, `${String(i + 1).padStart(2, '0')}  ${tag}`, x0, y0, M(700, 18), C.accent, 'left', 'middle', 3);
    txt(c, title, x0, y0 + 52, D(40), C.ink); txt(c, sub, x0, y0 + 96, G(500, 23), C.mute);
    c.save(); c.translate(0, 34); anim(c, t, i); c.restore();
    if (thumb) { const y = CH / 2 - 52; rr(c, x0 - 8, y - 26, CW - 56, 52, 26); c.fillStyle = C.bg; c.fill(); cover(c, thumb, x0, y - 18, 64, 36, 6);
      c.fillStyle = C.red; rr(c, x0 + 78, y - 11, 30, 22, 6); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x0 + 89, y - 6); c.lineTo(x0 + 99, y); c.lineTo(x0 + 89, y + 6); c.closePath(); c.fill();
      txt(c, vid, x0 + 120, y + 1, G(600, 21), C.ink); }
    else { const y = CH / 2 - 52; txt(c, 'Covered on the channel', x0, y + 1, G(600, 21), C.mute); }
  }
  // ---------- the 12 micro-animations (local coords: card centre, area ~ x±240, y -40..80) ----------
  const L = (t) => t * 1.0;
  function payAnim(c, t) {
    const p = (L(t) % 2.4) / 2.4, sw = io5(clamp(p / 0.35)), ok = p > 0.42;
    c.save(); c.translate(-90 + sw * 120, 20); c.rotate(-0.12 + sw * 0.12); const g = c.createLinearGradient(-110, -70, 110, 70); g.addColorStop(0, '#1C1B22'); g.addColorStop(1, '#3B3550'); rr(c, -110, -68, 220, 136, 16); c.fillStyle = g; c.fill();
    c.fillStyle = '#E8C46A'; rr(c, -82, -30, 36, 28, 5); c.fill(); txt(c, '•••• 4242', -82, 36, M(700, 18), '#fff'); c.restore();
    c.save(); c.translate(150, 20); rr(c, -70, -80, 140, 160, 18); c.fillStyle = C.bg2; c.fill(); rr(c, -54, -64, 108, 60, 10); c.fillStyle = ok ? rgba(C.green, 0.15) : '#fff'; c.fill();
    txt(c, ok ? 'Approved' : '$4.20', 0, -34, G(700, 20), ok ? C.green : C.ink, 'center'); if (ok) check(c, 0, 30, 46, C.green, clamp((p - 0.42) / 0.15)); c.restore();
  }
  function snakeAnim(c, t) {
    c.save(); rr(c, -230, -60, 460, 150, 18); c.fillStyle = '#0F1A12'; c.fill(); c.clip();
    for (let i = 0; i < 6; i++) { const x = -200 + ((i * 83 + 40) % 420), y = -40 + (i * 37 % 110); c.fillStyle = ['#FFD84D', '#FF6B6B', '#6BCBFF'][i % 3]; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); }
    for (let k = 0; k < 18; k++) { const u = t * 2.2 - k * 0.09, x = Math.sin(u * 0.9) * 180, y = Math.sin(u * 1.7) * 45 + 15; c.fillStyle = `hsl(${120 + k * 4},80%,${55 - k}%)`; c.beginPath(); c.arc(x, y, 12 - k * 0.35, 0, TAU); c.fill(); }
    const pk = (t * 1.1) % 1; c.globalAlpha = 1 - pk; txt(c, '+$0.50', 150, 10 - pk * 40, G(800, 26), '#7CFF4F', 'center'); c.restore();
  }
  function testAnim(c, t) {
    ['Connect wallet', 'Try the swap', 'Send feedback'].forEach((s, i) => { const y = -40 + i * 46, k = clamp(((t * 0.9) % 3.0) - i * 0.6); c.fillStyle = k > 0.3 ? rgba(C.green, 0.12) : C.bg2; rr(c, -220, y - 18, 300, 38, 12); c.fill(); txt(c, s, -200, y + 1, G(600, 21), C.ink); if (k > 0.3) check(c, 60, y, 28, C.green, clamp((k - 0.3) * 3)); });
    const kk = clamp(((t * 0.9) % 3.0) - 1.9); c.save(); c.globalAlpha = clamp(kk * 3); c.translate(170, 6); c.scale(0.8 + 0.2 * pop(kk), 0.8 + 0.2 * pop(kk)); rr(c, -70, -40, 140, 80, 18); c.fillStyle = C.ink; c.fill(); txt(c, '+ reward', 0, 1, G(700, 24), '#fff', 'center'); c.restore();
  }
  function waveAnim(c, t) {
    for (let i = 0; i < 34; i++) { const x = -230 + i * 14, h = 12 + 70 * Math.abs(Math.sin(t * 4 + i * 0.5) * Math.sin(i * 0.31 + t)); c.fillStyle = i / 34 < (t * 0.25) % 1 ? C.accent : '#D9D3C5'; rr(c, x, 10 - h / 2, 8, h, 4); c.fill(); }
    pill(c, 120, -45, 'Owned by you', G(700, 20), C.green, rgba(C.green, 0.12), { h: 40, padX: 16, icon: (cc, x, y) => check(cc, x, y, 20, C.green) });
  }
  function lockAnim(c, t) {
    const p = (t * 0.8) % 2.4, cl = io5(clamp(p / 0.4)); c.save(); c.translate(-140, 10); c.strokeStyle = C.ink; c.lineWidth = 12; c.beginPath(); c.arc(0, -28 - (1 - cl) * 22, 34, Math.PI, 0); c.stroke(); rr(c, -52, -28, 104, 84, 14); c.fillStyle = C.ink; c.fill(); c.fillStyle = C.accent; c.beginPath(); c.arc(0, 8, 9, 0, TAU); c.fill(); c.restore();
    const msg = 'my-seed-phrase-is…', scr = '•'.repeat(18), n = Math.floor(clamp((p - 0.4) / 0.8) * msg.length); txt(c, scr.slice(0, n) + msg.slice(n), -60, 0, M(700, 24), C.ink); txt(c, 'end-to-end encrypted', -60, 40, G(600, 20), C.green);
  }
  function depinAnim(c, t) {
    c.save(); c.translate(-140, 14); rr(c, -50, -70, 100, 140, 30); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = C.line; c.lineWidth = 3; c.stroke(); for (let i = 0; i < 6; i++) { c.fillStyle = '#CFC8B8'; c.fillRect(-30, -50 + i * 14, 60, 5); } c.restore();
    for (let i = 0; i < 4; i++) { const p = ((t * 0.7 + i / 4) % 1), x = -80 + p * 300, y = -20 + Math.sin(p * 6 + i) * 30, s = 22; c.save(); c.globalAlpha = Math.sin(p * Math.PI); c.fillStyle = '#F7931A'; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); txt(c, '₿', x, y + 2, G(800, 24), '#fff', 'center'); c.restore(); }
    txt(c, 'earning…', 120, 66, M(700, 20), C.mute, 'center');
  }
  function collectAnim(c, t) {
    const sp = 0.5 + 0.5 * Math.sin(t * 1.6); ['short_vibes', 'short_tcg', 'short_onepiece'].forEach((k, i) => { c.save(); c.translate((i - 1) * 110 * (0.6 + 0.4 * sp), 14 + Math.abs(i - 1) * 12); c.rotate((i - 1) * 0.22 * sp); c.shadowColor = 'rgba(0,0,0,0.2)'; c.shadowBlur = 16; rr(c, -56, -84, 112, 168, 12); c.fillStyle = '#fff'; c.fill(); c.shadowBlur = 0; cover(c, k, -50, -78, 100, 156, 9); c.restore(); });
  }
  function socialAnim(c, t) {
    c.save(); rr(c, -230, -66, 300, 160, 16); c.fillStyle = '#111'; c.fill(); cover(c, 'short_netflix', -230, -66, 300, 160, 16); c.fillStyle = 'rgba(0,0,0,0.25)'; rr(c, -230, -66, 300, 160, 16); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(-80, 14, 26, 0, TAU); c.fill(); c.fillStyle = C.ink; c.beginPath(); c.moveTo(-88, 2); c.lineTo(-68, 14); c.lineTo(-88, 26); c.closePath(); c.fill(); c.restore();
    ['lol this part', 'gm from Tokyo', '🍿'.length ? 'popcorn ready' : ''].forEach((s, i) => { const k = clamp(((t * 0.9) % 3) - i * 0.7); if (k <= 0) return; c.save(); c.globalAlpha = clamp(k * 3); const y = -44 + i * 50; rr(c, 90, y - 20, 150, 40, 20); c.fillStyle = [C.bg2, rgba(C.violet, 0.14), rgba(C.accent, 0.14)][i]; c.fill(); txt(c, s, 104, y + 1, G(600, 18), C.ink); c.restore(); });
  }
  function swapAnim(c, t) {
    const p = (t * 0.8) % 2, fl = io5(clamp((p - 0.6) / 0.3));
    const tok = (y, a, b, col) => { rr(c, -230, y - 30, 330, 60, 16); c.fillStyle = C.bg2; c.fill(); c.fillStyle = col; c.beginPath(); c.arc(-198, y, 16, 0, TAU); c.fill(); txt(c, a, -170, y + 1, G(700, 24), C.ink); txt(c, b, 80, y + 1, M(700, 22), C.ink, 'right'); };
    tok(-26, fl > 0.5 ? 'USDC' : 'SOL', fl > 0.5 ? '312.40' : '2.00', fl > 0.5 ? '#2775CA' : '#9945FF'); tok(50, fl > 0.5 ? 'SOL' : 'USDC', fl > 0.5 ? '2.00' : '312.40', fl > 0.5 ? '#9945FF' : '#2775CA');
    c.save(); c.translate(-65, 12); c.rotate(fl * Math.PI); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill(); c.strokeStyle = C.line; c.lineWidth = 2; c.stroke(); txt(c, '⇅', 0, 1, G(800, 22), C.ink, 'center'); c.restore();
    rr(c, 130, -40, 100, 100, 18); c.fillStyle = rgba(C.green, 0.12); c.fill(); txt(c, 'APY', 180, -12, M(700, 16), C.green, 'center'); txt(c, `${(6.2 + Math.sin(t * 2) * 0.4).toFixed(1)}%`, 180, 22, G(800, 28), C.green, 'center');
  }
  function rwaAnim(c, t) {
    c.save(); c.translate(-150, 14); const k = (t * 0.6) % 1, sl = [[0, 0.42, C.accent], [0.42, 0.68, C.violet], [0.68, 0.86, C.blue], [0.86, 1, C.yellow]];
    sl.forEach(([a, b, col], i) => { const off = i === 0 ? 12 * Math.sin(k * Math.PI) : 0, m = (a + b) / 2 * TAU - Math.PI / 2; c.fillStyle = col; c.beginPath(); c.moveTo(Math.cos(m) * off, Math.sin(m) * off); c.arc(Math.cos(m) * off, Math.sin(m) * off, 70, a * TAU - Math.PI / 2, b * TAU - Math.PI / 2); c.closePath(); c.fill(); }); c.restore();
    c.save(); c.strokeStyle = C.green; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath(); for (let i = 0; i <= 20; i++) { const x = -20 + i * 12, y = 50 - i * 4 - Math.sin(i * 0.9 + t * 2) * 8; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore();
    txt(c, '0.042 shares', 100, 76, M(700, 18), C.mute, 'center');
  }
  function voteAnim(c, t) {
    const p = clamp(((t * 0.6) % 2) / 1.2); [['Yes', 0.72, C.green], ['No', 0.18, C.accent], ['Abstain', 0.10, C.faint]].forEach(([s, v, col], i) => { const y = -36 + i * 48; txt(c, s, -220, y + 1, G(700, 22), C.ink); rr(c, -110, y - 14, 300, 28, 14); c.fillStyle = C.bg2; c.fill(); rr(c, -110, y - 14, 300 * v * io3(p), 28, 14); c.fillStyle = col; c.fill(); txt(c, `${Math.round(v * 100 * io3(p))}%`, 230, y + 1, M(700, 20), C.ink, 'right'); });
  }
  function chainAnim(c, t) {
    const fns = [chainSol, chainEth, chainBtc, chainAvax, chainPoly]; fns.forEach((fn, i) => { const a = t * 0.9 + i / fns.length * TAU, x = Math.cos(a) * 170, y = Math.sin(a) * 50 + 14, s = 58 + Math.sin(a) * 10; c.save(); c.globalAlpha *= 0.6 + 0.4 * (Math.sin(a) + 1) / 2; fn(c, x, y, s); c.restore(); });
  }

  // ---------- S4 proof wall (14–17) ----------
  function proof(c, t) {
    if (t < 13.95 || t > 17.15) return; const ex = ease(t, 16.8, 17.1, io5); background(c, t); c.save(); c.globalAlpha = 1 - ex;
    c.save(); c.translate(W / 2, H / 2); c.rotate(-0.12); c.translate(-W / 2, -H / 2);
    const rows = [[VIDS, 400, 225, -1, 240], [SHORTS, 220, 360, 1, 560], [[...VIDS].reverse(), 400, 225, -1, 900]];
    rows.forEach(([list, w, h, dir, y], r) => { const gap = 28, span = list.length * (w + gap), off = ((t - 14) * 160 * dir + r * 130) % span;
      for (let k = -1; k < Math.ceil((W + 800) / span) + 1; k++) list.forEach((key, i) => { const x = -400 + k * span + i * (w + gap) + off; if (x < -w - 400 || x > W + 400) return; const ap = oexp(prog(t, 14.0 + (i % 6) * 0.04 + r * 0.06, 14.5 + (i % 6) * 0.04 + r * 0.06));
        c.save(); c.globalAlpha *= ap; c.translate(x, y - h / 2 + (1 - ap) * 60); card(c, -6, -6, w + 12, h + 12, 20, { sh: 0.12, blur: 30 }); cover(c, key, 0, 0, w, h, 14); c.restore(); }); });
    c.restore();
    const g = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 900); g.addColorStop(0, 'rgba(245,242,234,0.92)'); g.addColorStop(0.5, 'rgba(245,242,234,0.55)'); g.addColorStop(1, 'rgba(245,242,234,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const k = oexp(prog(t, 14.2, 14.65)); c.save(); c.globalAlpha *= k; c.filter = k < 0.98 ? `blur(${(1 - k) * 12}px)` : 'none'; card(c, W / 2 - 600, H / 2 - 170, 1200, 340, 44, { fill: 'rgba(255,255,255,0.96)', sh: 0.18, blur: 90, oy: 24 }); c.restore();
    words(c, [['121', D(130), C.ink], ['videos.', D(130), C.ink]], W / 2, H / 2 + 10, t, 14.3, { size: 130, align: 'center', stag: 0.1 });
    words(c, [['Real', SERIF(64), C.accent], ['projects.', SERIF(64), C.accent], ['Real', SERIF(64), C.ink], ['walkthroughs.', SERIF(64), C.ink]], W / 2, H / 2 + 110, t, 14.7, { size: 64, align: 'center', stag: 0.08 });
    c.restore();
  }

  // ---------- S5 end card (17–20) ----------
  function endCard(c, t) {
    if (t < 16.95) return; background(c, t); const k = oexp(prog(t, 17.0, 17.5));
    c.save(); c.globalAlpha = k; c.translate(W / 2, 290 + (1 - k) * 40); c.scale(lerp(0.7, 1, pop(prog(t, 17.0, 17.6))), lerp(0.7, 1, pop(prog(t, 17.0, 17.6))));
    c.shadowColor = 'rgba(40,30,10,0.25)'; c.shadowBlur = 40; c.shadowOffsetY = 14; c.beginPath(); c.arc(0, 0, 110, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.shadowBlur = 0; avatar(c, 0, 0, 102); c.restore();
    words(c, [['Thee_Kal_El', D(120), C.ink]], W / 2, 540, t, 17.15, { size: 120, align: 'center' });
    words(c, [['Learn', SERIF(66), C.mute], ['the', SERIF(66), C.mute], ['future,', SERIF(66), C.accent], ['one', SERIF(66), C.mute], ['project', SERIF(66), C.mute], ['at', SERIF(66), C.mute], ['a', SERIF(66), C.mute], ['time.', SERIF(66), C.mute]], W / 2, 630, t, 17.35, { size: 66, align: 'center', stag: 0.04 });
    const bk = pop(prog(t, 17.7, 18.2)); if (bk > 0) { const sb = t >= 18.55, pr = t > 18.42 && t < 18.55 ? 1 : 0; c.save(); c.translate(W / 2, 770); c.scale(bk * (1 - pr * 0.06), bk * (1 - pr * 0.06));
      c.shadowColor = sb ? 'rgba(0,0,0,0.1)' : rgba(C.red, 0.35); c.shadowBlur = 30; c.shadowOffsetY = 10; rr(c, -290, -48, 580, 96, 48); c.fillStyle = sb ? C.ink : C.red; c.fill(); c.shadowBlur = 0; c.shadowOffsetY = 0;
      if (sb) { check(c, -100, 0, 34, '#fff', clamp((t - 18.55) / 0.25)); txt(c, 'Subscribed', 20, 2, G(800, 36), '#fff', 'center'); } else { c.fillStyle = '#fff'; rr(c, -232, -16, 44, 32, 9); c.fill(); c.fillStyle = C.red; c.beginPath(); c.moveTo(-216, -8); c.lineTo(-200, 0); c.lineTo(-216, 8); c.closePath(); c.fill(); txt(c, 'Subscribe on YouTube', 28, 2, G(800, 34), '#fff', 'center'); }
      c.restore();
      if (t < 18.9) { const ck = io5(prog(t, 17.95, 18.42)); cursor(c, lerp(W / 2 + 420, W / 2 + 120, ck), lerp(1000, 790, ck), pr); }
      if (sb) burst(c, W / 2, 770, t, 18.55); }
    ICONS5.forEach((fn, i) => { const kk = pop(prog(t, 18.0 + i * 0.08, 18.5 + i * 0.08)); if (kk <= 0) return; c.save(); c.translate(W / 2 + (i - 2) * 120, 930); c.scale(kk * 0.75, kk * 0.75); fn(c, 0, 0, 80); c.restore(); });
    const hk = A(t, 18.6, 0.4); if (hk > 0) { c.save(); c.globalAlpha = hk; txt(c, '@Thee_Kal_El  ·  everywhere', W / 2, 1010, M(700, 22), C.mute, 'center', 'middle', 3); c.restore(); }
  }
  function cursor(c, x, y, press = 0) { c.save(); c.translate(x, y); c.scale(1.7 - press * 0.25, 1.7 - press * 0.25); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.lineTo(6, 16.5); c.lineTo(10, 25); c.lineTo(13.5, 23.5); c.lineTo(9.5, 15); c.lineTo(17, 15); c.closePath(); c.fillStyle = C.ink; c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = 8; c.fill(); c.stroke(); c.restore(); }
  function burst(c, x, y, t, t0) { const d = t - t0; if (d < 0 || d > 1.1) return; for (let i = 0; i < 36; i++) { const a = hash(i, 7) * TAU, v = 300 + hash(i, 8) * 600, px = x + Math.cos(a) * v * d, py = y + Math.sin(a) * v * d * 0.7 + 400 * d * d, s = (5 + hash(i, 9) * 8) * (1 - d / 1.1);
    c.save(); c.translate(px, py); c.rotate(d * 8 + i); c.globalAlpha = 1 - d / 1.1; c.fillStyle = [C.accent, C.violet, C.yellow, C.green, C.blue][i % 5]; c.fillRect(-s, -s * 0.5, s * 2, s); c.restore(); } }

  // ---------- frame ----------
  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.filter = 'none'; c.imageSmoothingQuality = 'high';
    if (t < 4.0) { background(c, t); hook(c, t); meet(c, t); }
    if (t >= 3.95 && t < 14.15) board(c, t);
    if (t >= 13.95 && t < 17.15) proof(c, t);
    if (t >= 16.95) endCard(c, t);
    const fi = 1 - prog(t, 0, 0.25); if (fi > 0) { c.fillStyle = `rgba(245,242,234,${fi})`; c.fillRect(0, 0, W, H); }
  }

  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(D(100)), document.fonts.load(G(700, 30)), document.fonts.load(G(500, 30)), document.fonts.load(M(700, 20)), document.fonts.load(SERIF(60)), ...ASSETS.map((k) => load(k, `../assets/yt/${k}.png`))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
