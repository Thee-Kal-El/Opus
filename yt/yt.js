// THEE_KAL_EL — "The Future, Explained." 30s YouTube channel film, 1920x1080 @ 60fps, cut to 120 BPM.
// 0–4 a YouTube play button morphs into the pixel avatar · 4–8 kinetic word slams + chain logos · 8–12 the
// channel page builds and gets subscribed · 12–20 a tilted wall of real thumbnails with whip-zooms on five
// videos · 20–24 a Shorts carousel · 24–26 the socials card · 26–30 end card. All over a synthwave floor.
// renderAt(t) is deterministic (no timers), so every frame renders identically.
(() => {
  'use strict';
  const K = window.KIT, { TAU, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, rr, hash } = K;
  const W = 1920, H = 1080, FPS = 60, DUR = 30, BT = 0.5;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const C = { bg: '#07020F', deep: '#14062B', mag: '#FF2BD6', pink: '#FF5FA2', cyan: '#22E4FF', red: '#FF0033', ink: '#FFFFFF', mute: '#B9A9D9',
    purple: '#8B3DFF', yel: '#FFD23F', card: '#0F0A1A', card2: '#1B1430' };
  const D = (s) => `900 ${s}px "Inter Tight", sans-serif`;
  const G = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`;
  const M = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const SERIF = (s) => `italic 400 ${s}px "Instrument Serif", serif`;
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const VIDS = ['snakepot', 'cypher', 'limewire_merch', 'protonmail', 'damnbruh', 'limewire_back'];
  const SHORTS = ['short_dapps', 'short_netflix', 'short_tcg', 'short_eminem', 'short_bumper', 'short_vibes', 'short_summer', 'short_nitro', 'short_ags20', 'short_onepiece', 'short_playabull', 'short_raposa'];
  const ASSETS = ['avatar', 'banner', 'socials', ...VIDS, ...SHORTS];

  // ---------- helpers ----------
  const ease = (t, a, b, f = io3) => f(prog(t, a, b));
  function cover(c, k, x, y, w, h, r = 0) { // draw image k into the box, center-cropped to fill it
    const im = IMG[k]; if (!im) return; const s = Math.max(w / im.width, h / im.height), sw = w / s, sh = h / s;
    c.save(); if (r) { rr(c, x, y, w, h, r); c.clip(); } c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h); c.restore();
  }
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  function chroma(c, s, x, y, font, k, col = '#fff', align = 'center', ls = 0) { // RGB-split text, split = k
    c.save(); c.font = font; c.textAlign = align; c.textBaseline = 'middle'; c.letterSpacing = ls + 'px';
    if (k > 0.01) { c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(C.mag, 0.75); c.fillText(s, x - 10 * k, y); c.fillStyle = rgba(C.cyan, 0.75); c.fillText(s, x + 10 * k, y); c.globalCompositeOperation = 'source-over'; }
    c.fillStyle = col; c.fillText(s, x, y); c.restore();
  }
  const beatPulse = (t, a = 0, b = 99) => (t < a || t > b ? 0 : Math.exp(-((t % BT + BT) % BT) * 9));

  // ---------- synthwave backdrop ----------
  // horizon height, grid speed and sun strength are keyed per scene so the floor flows through the whole film
  const BGK = [[0, 760, 0.9, 0.0, 640], [3.5, 720, 1.0, 0.9, 640], [4.0, 780, 2.2, 0.0, 960], [8.0, 820, 1.0, 0.0, 960], [12.0, 1000, 0.6, 0, 960], [20.0, 800, 1.6, 0, 960], [24.0, 760, 1.2, 0.0, 560], [26.0, 760, 0.8, 1.0, 560], [30, 760, 0.6, 1.0, 560]];
  function bgParams(t) { let i = 0; while (i < BGK.length - 2 && t >= BGK[i + 1][0]) i++; const a = BGK[i], b = BGK[i + 1], k = io3(prog(t, b[0] - 0.5, b[0])); return { hz: lerp(a[1], b[1], k), sp: lerp(a[2], b[2], k), sun: lerp(a[3], b[3], k), sx: lerp(a[4], b[4], k) }; }
  let GRIDZ = 0, lastT = 0;
  function backdrop(c, t) {
    const { hz, sp, sun, sx: sunX } = bgParams(t);
    // grid scroll is integrated so speed changes never jump
    if (t < lastT || t - lastT > 0.2) { GRIDZ = 0; for (let s = 0; s < t; s += 1 / FPS) GRIDZ += bgParams(s).sp / FPS; } else GRIDZ += ((bgParams(lastT).sp + sp) / 2) * (t - lastT); lastT = t;
    const sky = c.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#04010A'); sky.addColorStop(0.65, '#12042A'); sky.addColorStop(1, '#3A0A52'); c.fillStyle = sky; c.fillRect(0, 0, W, hz);
    for (let i = 0; i < 170; i++) { const x = hash(i, 1) * W, y = hash(i, 2) * hz * 0.9, tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + hash(i, 3) * 2) + i)); c.fillStyle = `rgba(255,255,255,${0.55 * tw * hash(i, 4)})`; const s = hash(i, 5) < 0.1 ? 2.4 : 1.4; c.fillRect(x, y, s, s); }
    if (sun > 0.01) { // striped retro sun
      const R = 250, sx = sunX, sy = hz - 70; c.save(); c.globalAlpha = sun; c.beginPath(); c.rect(0, 0, W, sy - 10);
      for (let k = 0; k < 9; k++) { const y0 = sy - 10 + k * 26, gap = 3 + k * 2.4; c.rect(0, y0 + gap, W, 26 - gap); } c.clip();
      const g = c.createLinearGradient(0, sy - R, 0, sy + R); g.addColorStop(0, '#FFE45C'); g.addColorStop(0.45, '#FF7A59'); g.addColorStop(1, '#FF1F9A');
      c.shadowColor = C.mag; c.shadowBlur = 80; c.fillStyle = g; c.beginPath(); c.arc(sx, sy, R, 0, TAU); c.fill(); c.restore();
    }
    const fl = c.createLinearGradient(0, hz, 0, H); fl.addColorStop(0, '#1A0533'); fl.addColorStop(1, '#05010B'); c.fillStyle = fl; c.fillRect(0, hz, W, H - hz);
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = -26; i <= 26; i++) { const xb = W / 2 + i * 260; c.strokeStyle = rgba(C.mag, 0.32); c.lineWidth = 1.6; c.beginPath(); c.moveTo(W / 2 + i * 34, hz); c.lineTo(xb, H + 400); c.stroke(); }
    const fr = GRIDZ % 1;
    for (let k = 0; k < 26; k++) { const z = k + 1 - fr; if (z <= 0.15) continue; const y = hz + 420 / z; if (y > H + 4) continue; const a = clamp(1.2 / z) * 0.6; c.strokeStyle = rgba(C.mag, a); c.lineWidth = 1 + 2.2 / z; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    const hg = c.createLinearGradient(0, hz - 60, 0, hz + 60); hg.addColorStop(0, 'rgba(255,43,214,0)'); hg.addColorStop(0.5, 'rgba(255,43,214,0.45)'); hg.addColorStop(1, 'rgba(255,43,214,0)'); c.fillStyle = hg; c.fillRect(0, hz - 60, W, 120);
    c.restore();
  }

  // ---------- icons (vector) ----------
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

  function avatarDisc(c, x, y, r, t, ringK = 1) {
    c.save(); c.shadowColor = C.mag; c.shadowBlur = 60 * ringK; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = '#1A0A2A'; c.fill(); c.restore();
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); if (IMG.avatar) c.drawImage(IMG.avatar, x - r, y - r, r * 2, r * 2); c.restore();
    if (ringK <= 0.01) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const p = beatPulse(t);
    for (const [rad, col, n, sp, lw] of [[r + 18 + p * 10, C.mag, 3, 0.9, 6], [r + 34 + p * 16, C.cyan, 5, -0.6, 3]]) {
      c.strokeStyle = rgba(col, 0.9 * ringK); c.lineWidth = lw; c.shadowColor = col; c.shadowBlur = 18;
      for (let i = 0; i < n; i++) { const a0 = t * sp + i * TAU / n; c.beginPath(); c.arc(x, y, rad, a0, a0 + (TAU / n) * 0.62 * ringK); c.stroke(); }
    }
    c.restore();
  }
  function cursor(c, x, y, press = 0) {
    c.save(); c.translate(x, y); c.scale(1.6 - press * 0.25, 1.6 - press * 0.25); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.lineTo(6, 16.5); c.lineTo(10, 25); c.lineTo(13.5, 23.5); c.lineTo(9.5, 15); c.lineTo(17, 15); c.closePath();
    c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1.6; c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 8; c.fill(); c.stroke(); c.restore();
  }
  function bell(c, x, y, s, rot = 0, col = '#fff') {
    c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath(); c.moveTo(-s * 0.42, s * 0.28); c.quadraticCurveTo(-s * 0.32, s * 0.12, -s * 0.32, -s * 0.08); c.quadraticCurveTo(-s * 0.32, -s * 0.42, 0, -s * 0.44); c.quadraticCurveTo(s * 0.32, -s * 0.42, s * 0.32, -s * 0.08);
    c.quadraticCurveTo(s * 0.32, s * 0.12, s * 0.42, s * 0.28); c.closePath(); c.fill(); c.beginPath(); c.arc(0, s * 0.38, s * 0.1, 0, TAU); c.fill(); c.restore();
  }
  function burst(c, x, y, t, t0, n = 46, cols = [C.red, '#fff', C.mag, C.yel]) {
    const d = t - t0; if (d < 0 || d > 1.3) return;
    for (let i = 0; i < n; i++) { const a = hash(i, 7) * TAU, v = 380 + hash(i, 8) * 700, px = x + Math.cos(a) * v * d * (1 - d * 0.35), py = y + Math.sin(a) * v * d * (1 - d * 0.35) + 520 * d * d, s = (4 + hash(i, 9) * 9) * (1 - d / 1.3);
      c.save(); c.translate(px, py); c.rotate(d * 8 + i); c.fillStyle = cols[i % cols.length]; c.globalAlpha = 1 - d / 1.3; c.fillRect(-s, -s * 0.5, s * 2, s); c.restore(); }
  }

  // ---------- S1 HOOK (0–4): play button → avatar → name ----------
  function hook(c, t) {
    if (t > 4.05) return;
    const ex = ease(t, 3.55, 4.0, io5); // exit: whip zoom into the avatar
    c.save(); if (ex > 0) { c.translate(640, 520); c.scale(1 + ex * 5, 1 + ex * 5); c.translate(-640, -520); c.globalAlpha = 1 - ex; }
    const slide = ease(t, 1.5, 2.0, io5), cx = lerp(W / 2, 640, slide), cy = lerp(520, 520, slide);
    const s = pop(prog(t, 0.0, 0.55)), press = Math.exp(-Math.max(0, t - 0.5) * 10) * (t > 0.5 ? 1 : 0) * 0.08;
    const m = ease(t, 0.75, 1.3, io5);           // button → circle morph
    const w = lerp(330, 300, m), h = lerp(232, 300, m), r = lerp(70, 150, m);
    c.save(); c.translate(cx, cy); c.scale(s * (1 - press), s * (1 - press));
    c.shadowColor = C.red; c.shadowBlur = 70 * (1 - m); ytButton(c, 0, 0, w, h, r, 1 - m); c.shadowBlur = 0;
    if (m > 0) { c.save(); c.globalAlpha = m; avatarDisc(c, 0, 0, 150, t, ease(t, 1.1, 1.8)); c.restore(); }
    c.restore();
    // name
    const name = 'KAL EL', font = D(190); c.font = font; c.letterSpacing = '-4px';
    let x = 860; const nw = []; for (const ch of name) nw.push(c.measureText(ch).width - 4); c.letterSpacing = '0px';
    [...name].forEach((ch, i) => { const k = A(t, 2.0 + i * 0.05, 0.45); if (k <= 0) { x += nw[i]; return; } c.save(); c.translate(x + nw[i] / 2, 470 + (1 - k) * -120); c.globalAlpha = clamp(k * 2) * c.globalAlpha; chroma(c, ch, 0, 0, font, (1 - k) * 2 + beatPulse(t, 2.5) * 0.4, '#fff', 'center'); c.restore(); x += nw[i]; });
    const hand = '@Thee_Kal_El', n = Math.floor(clamp(prog(t, 2.5, 3.1)) * hand.length);
    if (t > 2.45) { txt(c, hand.slice(0, n), 868, 600, M(700, 54), C.cyan); if (Math.floor(t * 4) % 2 === 0 || t < 3.1) { c.font = M(700, 54); c.fillStyle = C.cyan; c.fillRect(868 + c.measureText(hand.slice(0, n)).width + 6, 572, 26, 56); } }
    const st = A(t, 3.0, 0.4); if (st > 0) { c.save(); c.globalAlpha *= st; txt(c, 'BLOCKCHAIN TECH · WEB3 · CRYPTO', 870 + (1 - st) * 40, 680, G(700, 30), C.mute, 'left', 'middle', 6); c.restore(); }
    c.restore();
  }

  // ---------- S2 KINETIC (4–8) ----------
  const WORDS = [[4.0, 'BLOCKCHAIN', C.mag, '#fff'], [4.5, 'WEB3', C.cyan, '#07020F'], [5.0, 'CRYPTO', C.red, '#fff'], [5.5, 'PLAY-TO-EARN', C.purple, '#fff']];
  function kinetic(c, t) {
    if (t < 3.98 || t > 8.05) return;
    for (let i = 0; i < WORDS.length; i++) {
      const [t0, w, band, ink] = WORDS[i], t1 = i < WORDS.length - 1 ? WORDS[i + 1][0] : 6.0; if (t < t0 || t > t1 + 0.12) continue;
      const kin = A(t, t0, 0.32), out = ease(t, t1, t1 + 0.12, io5);
      c.save(); c.translate(W / 2, H / 2); c.rotate(-0.07);
      const bw = W * 1.6, bh = 330; c.fillStyle = band; c.fillRect(-bw / 2 + (1 - kin) * -bw - out * bw * 1.1, -bh / 2, bw, bh);
      c.fillStyle = rgba('#000000', 0.18); c.fillRect(-bw / 2 + (1 - kin) * -bw * 1.2 - out * bw, bh / 2 - 18, bw, 18);
      c.font = D(260); c.letterSpacing = '-8px'; const tw = c.measureText(w).width, fs = Math.min(260, 260 * 1650 / tw); c.letterSpacing = '0px';
      const sc = lerp(1.7, 1, kin) * (1 + (t - t0) * 0.06);
      c.scale(sc, sc); c.translate(out * -900, 0);
      for (let e = 3; e >= 1; e--) { c.save(); c.scale(1 + e * 0.12 * (1 - kin * 0.6), 1 + e * 0.12 * (1 - kin * 0.6)); c.font = D(fs); c.letterSpacing = '-8px'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.strokeStyle = rgba(ink === '#fff' ? '#ffffff' : '#07020F', 0.18 / e); c.lineWidth = 3; c.strokeText(w, 0, 6); c.restore(); }
      chroma(c, w, 0, 8, D(fs), (1 - kin) * 1.6, ink, 'center', -8);
      c.restore();
    }
    // 6–8: chain constellation around "SHOWING YOU THE LATEST PROJECTS"
    if (t >= 5.95) {
      const ex = ease(t, 7.55, 8.0, io5), inK = A(t, 6.0, 0.4);
      c.save(); c.translate(W / 2, H / 2 - 20); c.scale(1 + ex * 2.2, 1 + ex * 2.2); c.globalAlpha = 1 - ex;
      c.save(); c.globalAlpha *= inK; txt(c, 'SHOWING YOU', 0, -70, G(800, 46), C.cyan, 'center', 'middle', 14); c.restore();
      c.save(); c.scale(lerp(1.3, 1, inK), lerp(1.3, 1, inK)); c.globalAlpha *= inK; chroma(c, 'THE FUTURE', 0, 30, D(150), (1 - inK) * 2 + beatPulse(t, 6) * 0.5, '#fff', 'center', -4); c.restore();
      const k2 = A(t, 6.5, 0.35); if (k2 > 0) { c.save(); c.globalAlpha *= k2; txt(c, 'one project at a time.', 0, 140, SERIF(64), C.pink, 'center'); c.restore(); }
      CHAINS.forEach(([fn, label], i) => {
        const k = pop(prog(t, 6.0 + i * 0.25, 6.55 + i * 0.25)); if (k <= 0) return;
        const a = -Math.PI / 2 + (i - 2) * 0.62 + t * 0.12, ring = i % 2 ? 1 : -1;
        const px = Math.cos(a + Math.PI) * 760 * (i % 2 ? -1 : 1), py = (i % 2 ? -1 : 1) * 300 + Math.sin(t * 1.3 + i) * 12;
        const xx = [-720, -430, 0, 430, 720][i], yy = [-250, 300, -330, 300, -250][i] + Math.sin(t * 1.5 + i) * 14; void px; void py; void ring;
        c.save(); c.translate(xx, yy); c.scale(k, k); c.rotate((1 - k) * 0.6);
        c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 30; fn(c, 0, 0, 120); c.shadowBlur = 0; txt(c, label, 0, 100, G(800, 22), C.mute, 'center', 'middle', 5); c.restore();
      });
      c.restore();
    }
  }

  // ---------- S3 CHANNEL PAGE (8–12) ----------
  const CARD = { x: 210, y: 130, w: 1500, h: 820 };
  function channel(c, t) {
    if (t < 7.95 || t > 12.05) return;
    const inK = A(t, 8.0, 0.65), ex = ease(t, 11.5, 12.0, io5);
    c.save(); c.translate(W / 2, H / 2); const sc = lerp(0.82, 1, inK) * (1 + (t - 8) * 0.008) * (1 - ex * 0.75);
    c.translate(ex * -1500, lerp(700, 0, inK) + ex * 200); c.rotate(lerp(-0.1, 0, inK) - ex * 0.35); c.scale(sc, sc); c.translate(-W / 2, -H / 2);
    const { x, y, w, h } = CARD;
    c.save(); c.shadowColor = rgba(C.purple, 0.65); c.shadowBlur = 90; rr(c, x, y, w, h, 30); c.fillStyle = C.card; c.fill(); c.restore();
    rr(c, x, y, w, h, 30); c.strokeStyle = rgba(C.mag, 0.35); c.lineWidth = 2; c.stroke();
    // banner + sheen
    const bx = x + 30, by = y + 30, bw = w - 60, bh = Math.round(bw / 3.707), bk = A(t, 8.2, 0.5);
    c.save(); rr(c, bx, by, bw, bh, 18); c.clip(); c.globalAlpha = bk; if (IMG.banner) c.drawImage(IMG.banner, bx, by - (1 - bk) * 30, bw, bh);
    const shx = lerp(bx - 400, bx + bw + 400, ease(t, 8.5, 9.3)); const sg = c.createLinearGradient(shx - 200, 0, shx + 200, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sg; c.fillRect(bx, by, bw, bh); c.restore();
    const row = by + bh + 120;
    const ak = pop(prog(t, 8.35, 8.95)); if (ak > 0) { c.save(); c.translate(x + 150, row); c.scale(ak, ak); avatarDisc(c, 0, 0, 100, t, 0.6); c.restore(); }
    const nk = A(t, 8.5, 0.4);
    c.save(); c.globalAlpha = nk; c.translate((1 - nk) * 40, 0);
    txt(c, 'Kal El', x + 290, row - 52, G(800, 74), '#fff');
    const subs = t < 10.5 ? Math.round(lerp(0, 230, ease(t, 8.6, 9.6))) : 231 + 0;
    const sp = t >= 10.5 ? Math.exp(-(t - 10.5) * 5) : 0;
    c.font = G(500, 32); const hdl = '@Thee_Kal_El  ·  '; txt(c, hdl, x + 292, row + 8, G(500, 32), C.mute); const hw = c.measureText(hdl).width;
    c.save(); c.translate(x + 292 + hw, row + 8); c.scale(1 + sp * 0.35, 1 + sp * 0.35); txt(c, `${subs} subscribers`, 0, 0, G(sp > 0.01 ? 700 : 500, 32), t >= 10.5 ? '#fff' : C.mute); c.restore();
    c.font = G(sp > 0.01 || t >= 10.5 ? 700 : 500, 32); const sw2 = c.measureText(`${subs} subscribers`).width * (1 + sp * 0.35); txt(c, '  ·  121 videos', x + 292 + hw + sw2, row + 8, G(500, 32), C.mute);
    const desc = 'Just showing you the way to play-to-earn games and crypto!', dn = Math.floor(clamp(prog(t, 8.9, 10.0)) * desc.length);
    txt(c, desc.slice(0, dn), x + 292, row + 62, G(400, 30), '#D9D0EE');
    c.restore();
    // tabs
    const tk = A(t, 9.0, 0.4); c.save(); c.globalAlpha = tk; let tx = x + 60;
    ['Home', 'Videos', 'Shorts', 'Live', 'Playlists'].forEach((s, i) => { txt(c, s, tx, y + h - 62, G(i === 0 ? 700 : 500, 32), i === 0 ? '#fff' : C.mute); c.font = G(600, 32); const tw = c.measureText(s).width; if (i === 0) { c.fillStyle = '#fff'; c.fillRect(tx, y + h - 34, tw, 4); } tx += tw + 70; });
    c.fillStyle = C.card2; c.fillRect(x + 30, y + h - 30, w - 60, 2); c.restore();
    // subscribe button
    const subd = t >= 10.5, bxx = x + w - 340, byy = row - 40, bW = subd ? 300 : 270, bH = 84, bp = pop(prog(t, 9.2, 9.7)), cp = subd ? 1 - 0.12 * Math.exp(-(t - 10.5) * 14) : 1;
    if (bp > 0) {
      c.save(); c.translate(bxx + bW / 2, byy + bH / 2); c.scale(bp * cp, bp * cp);
      if (!subd) { c.shadowColor = rgba('#ffffff', 0.4 + beatPulse(t) * 0.4); c.shadowBlur = 30; }
      rr(c, -bW / 2, -bH / 2, bW, bH, bH / 2); c.fillStyle = subd ? '#2A2338' : '#fff'; c.fill(); c.shadowBlur = 0;
      if (subd) { const wig = Math.sin((t - 10.5) * 38) * 0.45 * Math.exp(-(t - 10.5) * 3.2); bell(c, -bW / 2 + 52, -2, 40, wig); txt(c, 'Subscribed', -bW / 2 + 88, 2, G(700, 32), '#fff'); }
      else txt(c, 'Subscribe', 0, 2, G(700, 34), '#0F0F0F', 'center');
      c.restore();
    }
    burst(c, bxx + bW / 2, byy + bH / 2, t, 10.5);
    if (t > 9.9 && t < 11.3) { const k = ease(t, 9.9, 10.42, io5), cx = lerp(1500, bxx + bW / 2 + 10, k), cy = lerp(1010, byy + bH / 2 + 8, k), pr = t > 10.45 && t < 10.62 ? 1 : 0; cursor(c, cx, cy, pr); }
    c.restore();
  }

  // ---------- S4 VIDEO WALL (12–20) ----------
  const CW = 480, CH = 270, PX = 540, PY = 320;
  const HEROES = [[12.5, 0, 0, 'snakepot', 'PLAY-TO-EARN', 'SNAKEPOT · FREE WEB3 GAMES'], [14.0, 2, -1, 'cypher', 'CRYPTO CARDS', 'THEE CRYPTO CARD IS HERE'],
    [15.5, 4, 0, 'limewire_back', 'WEB3 IS BACK', 'LIMEWIRE · BUT NOT WHAT YOU THINK'], [17.0, 3, 2, 'protonmail', 'PRIVACY FIRST', 'PROTON MAIL · COMPLETE WALKTHROUGH'],
    [18.5, 5, 1, 'damnbruh', '18K VIEWS', 'DAMN BRUH · A WEB3 SLITHER.IO']];
  const L = Math.log, ZH = L(1.95), WIDE = [2.5 * PX, 0.5 * PY];
  const WK = [[12.0, ...WIDE, L(0.36)], [12.2, ...WIDE, L(0.4)]];
  HEROES.forEach(([T, cx, cy], i) => { WK.push([T, cx * PX, cy * PY, ZH], [T + 1.2, cx * PX + 14, cy * PY - 6, L(2.05)]); if (i === HEROES.length - 1) WK.push([19.65, ...WIDE, L(0.38)], [20.1, ...WIDE, L(0.3)]); });
  function wallCam(t) {
    let i = 0; while (i < WK.length - 2 && t >= WK[i + 1][0]) i++;
    const a = WK[i], b = WK[i + 1], k = b[0] - a[0] < 0.8 ? io5(prog(t, a[0], b[0])) : io3(prog(t, a[0], b[0]));
    return { x: lerp(a[1], b[1], k), y: lerp(a[2], b[2], k), z: Math.exp(lerp(a[3], b[3], k)) };
  }
  function focusAt(t) { let f = 0, hi = -1; HEROES.forEach(([T], i) => { const k = ease(t, T - 0.08, T + 0.12) * (1 - ease(t, T + 1.18, T + 1.42)); if (k > f) { f = k; hi = i; } }); return { f, hi }; }
  function wall(c, t) {
    if (t < 11.95 || t > 20.1) return;
    const cam = wallCam(t), { f, hi } = focusAt(t), tilt = 1 - f;
    c.save(); c.translate(W / 2, H / 2); c.transform(1, -0.08 * tilt, 0.22 * tilt, 1, 0, 0); c.rotate(-0.05 * tilt); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
    const hx = W / cam.z * 0.95, hy = H / cam.z * 0.95;
    const c0 = Math.floor((cam.x - hx) / PX) - 1, c1 = Math.ceil((cam.x + hx) / PX) + 1, r0 = Math.floor((cam.y - hy) / PY) - 1, r1 = Math.ceil((cam.y + hy) / PY) + 1;
    const hero = hi >= 0 ? HEROES[hi] : null;
    for (let r = r0; r <= r1; r++) for (let col = c0; col <= c1; col++) {
      const hIdx = HEROES.findIndex((h) => h[1] === col && h[2] === r), isHero = hero && hero[1] === col && hero[2] === r;
      const key = hIdx >= 0 ? HEROES[hIdx][3] : VIDS[(((col % 6) + 6) % 6 + ((r % 6) + 6) % 6 * 4) % 6];
      const d = Math.hypot(col * PX - WIDE[0], r * PY - WIDE[1]) / PX, ink = pop(prog(t, 12.0 + d * 0.035, 12.5 + d * 0.035)); if (ink <= 0) continue;
      const x = col * PX, y = r * PY, s = ink * (isHero ? 1 + 0.05 * f : 1);
      c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = isHero ? 1 : 1 - 0.65 * f;
      if (isHero) { c.shadowColor = C.red; c.shadowBlur = 50 * f; rr(c, -CW / 2, -CH / 2, CW, CH, 14); c.fillStyle = '#000'; c.fill(); c.shadowBlur = 0; }
      cover(c, key, -CW / 2, -CH / 2, CW, CH, 14);
      if (isHero) {
        const T = hero[0], pk = ease(t, T, T + 1.3, (p) => p);
        rr(c, -CW / 2, -CH / 2, CW, CH, 14); c.strokeStyle = rgba(C.red, 0.95 * f); c.lineWidth = 3; c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(-CW / 2 + 10, CH / 2 - 12, CW - 20, 4); c.fillStyle = C.red; c.fillRect(-CW / 2 + 10, CH / 2 - 12, (CW - 20) * pk, 4);
        c.beginPath(); c.arc(-CW / 2 + 10 + (CW - 20) * pk, CH / 2 - 10, 6, 0, TAU); c.fill();
        const pl = 1 - ease(t, T + 0.15, T + 0.5); if (pl > 0) { c.save(); c.globalAlpha = pl; c.scale(1 + (1 - pl) * 0.6, 1 + (1 - pl) * 0.6); ytButton(c, 0, 0, 96, 68, 18); c.restore(); }
      } else { rr(c, -CW / 2, -CH / 2, CW, CH, 14); c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1.5; c.stroke(); }
      c.restore();
    }
    c.restore();
    const tk = A(t, 12.0, 0.3) * (1 - ease(t, 12.35, 12.55)); if (tk > 0) { c.save(); c.globalAlpha = tk; chroma(c, '121 VIDEOS', W / 2, H / 2, D(180), 1 - tk, '#fff', 'center', -4); c.restore(); }
  }

  // ---------- S5 SHORTS CAROUSEL (20–24) ----------
  function shorts(c, t) {
    if (t < 19.95 || t > 24.1) return;
    const n = SHORTS.length, step = ((t - 20) / BT | 0), fr = io5(clamp(((t - 20) % BT) / 0.22)), rot = -(step + fr) * TAU / n;
    const inK = (i) => pop(prog(t, 20.0 + i * 0.025, 20.55 + i * 0.025)), ex = ease(t, 23.6, 24.0, io5);
    const cards = SHORTS.map((k, i) => { const a = i * TAU / n + rot, z = Math.cos(a); return { k, i, x: Math.sin(a) * 880, z }; }).sort((p, q) => p.z - q.z);
    for (const { k, i, x, z } of cards) {
      const s = lerp(0.42, 1, (z + 1) / 2) ** 1.4 * inK(i) * (1 - ex), cw = 380, ch = 634; if (s <= 0.01) continue;
      const cx = W / 2 + x * (1 - ex), cy = 470 + (1 - (z + 1) / 2) * -60;
      c.save(); c.translate(cx, cy); c.scale(s, s); const front = z > 0.97;
      // reflection on the floor
      c.save(); c.translate(0, ch + 20); c.scale(1, -1); c.globalAlpha = 0.16 * clamp((z + 1) / 2); cover(c, k, -cw / 2, -ch / 2, cw, ch, 22); c.restore();
      if (front) { c.shadowColor = C.red; c.shadowBlur = 70; } else { c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 40; }
      rr(c, -cw / 2, -ch / 2, cw, ch, 22); c.fillStyle = '#000'; c.fill(); c.shadowBlur = 0;
      cover(c, k, -cw / 2, -ch / 2, cw, ch, 22);
      c.fillStyle = `rgba(7,2,15,${0.62 * (1 - (z + 1) / 2)})`; rr(c, -cw / 2, -ch / 2, cw, ch, 22); c.fill();
      rr(c, -cw / 2, -ch / 2, cw, ch, 22); c.strokeStyle = front ? rgba(C.red, 0.95) : 'rgba(255,255,255,0.12)'; c.lineWidth = front ? 4 : 2; c.stroke();
      if (front) { c.save(); c.translate(cw / 2 - 52, -ch / 2 + 52); const sp = 1 + beatPulse(t) * 0.15; c.scale(sp, sp); iconShorts(c, 0, 0, 52); c.restore(); }
      c.restore();
    }
  }
  function iconShorts(c, x, y, s) { // the red Shorts glyph
    c.save(); c.translate(x, y); c.rotate(-0.5); rr(c, -s * 0.32, -s * 0.5, s * 0.64, s, s * 0.32); c.fillStyle = C.red; c.fill();
    c.rotate(0.5); c.beginPath(); c.moveTo(-s * 0.12, -s * 0.17); c.lineTo(s * 0.18, 0); c.lineTo(-s * 0.12, s * 0.17); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.restore();
  }

  // ---------- S6 SOCIALS (24–26) ----------
  function socials(c, t) {
    if (t < 23.95 || t > 26.05) return;
    const ex = ease(t, 25.65, 26.0, io5);
    c.save(); c.globalAlpha = 1 - ex;
    for (let r = 0; r < 3; r++) { const y = 230 + r * 320, dir = r % 2 ? 1 : -1, off = ((t - 24) * 260 * dir) % 1400; c.save(); c.font = D(230); c.letterSpacing = '-6px'; c.textBaseline = 'middle'; c.strokeStyle = rgba(r === 1 ? C.cyan : C.mag, 0.28); c.lineWidth = 3;
      for (let k = -2; k < 3; k++) c.strokeText('@THEE_KAL_EL', off + k * 1400 - 200, y); c.restore(); }
    const k = pop(prog(t, 24.0, 24.6)), sway = Math.sin((t - 24) * 2.2) * 0.04, S = 700;
    c.save(); c.translate(W / 2, 500 + (1 - k) * 300); c.rotate(lerp(-0.25, 0, k) + sway * 0.5); c.scale(k * Math.cos(sway * 3) * (1 + ex * 1.5), k * (1 + ex * 1.5));
    c.shadowColor = C.purple; c.shadowBlur = 110; rr(c, -S / 2, -S / 2, S, S, 40); c.fillStyle = '#000'; c.fill(); c.shadowBlur = 0;
    cover(c, 'socials', -S / 2, -S / 2, S, S, 40); rr(c, -S / 2, -S / 2, S, S, 40); c.strokeStyle = rgba(C.mag, 0.8); c.lineWidth = 4; c.stroke();
    const shx = lerp(-S, S, ease(t, 24.4, 25.2)); c.save(); rr(c, -S / 2, -S / 2, S, S, 40); c.clip(); const g = c.createLinearGradient(shx - 150, -S / 2, shx + 150, S / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.28)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-S / 2, -S / 2, S, S); c.restore();
    c.restore();
    const lk = A(t, 24.5, 0.4); if (lk > 0) { c.save(); c.globalAlpha *= lk; rr(c, W / 2 - 520, 935, 1040, 76, 38); c.fillStyle = 'rgba(7,2,15,0.8)'; c.fill(); c.strokeStyle = rgba(C.mag, 0.6); c.lineWidth = 2; c.stroke();
      txt(c, 'YOUTUBE  ·  TIKTOK  ·  INSTAGRAM  ·  TWITCH  ·  KICK', W / 2, 974, G(800, 30), '#fff', 'center', 'middle', 6); c.restore(); }
    c.restore();
  }

  // ---------- S7 END CARD (26–30) ----------
  function endCard(c, t) {
    if (t < 25.95) return;
    const ak = pop(prog(t, 26.0, 26.6));
    c.save(); c.translate(560, 450); c.scale(ak, ak); avatarDisc(c, 0, 0, 165, t, ease(t, 26.2, 26.9)); c.restore();
    const nk = A(t, 26.15, 0.45); c.save(); c.globalAlpha = nk; c.translate((1 - nk) * 80, 0);
    c.font = D(120); c.letterSpacing = '-3px'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(C.mag, 0.7); c.fillText('THEE_KAL_EL', 798 - (1 - nk) * 14, 380); c.fillStyle = rgba(C.cyan, 0.7); c.fillText('THEE_KAL_EL', 802 + (1 - nk) * 14, 380); c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#fff'; c.fillText('THEE_KAL_EL', 800, 380); c.letterSpacing = '0px'; c.restore();
    const sk = A(t, 26.4, 0.45); if (sk > 0) { c.save(); c.globalAlpha = sk; const g = c.createLinearGradient(800, 0, 1500, 0); g.addColorStop(0, C.cyan); g.addColorStop(1, C.pink); txt(c, 'the future, explained.', 806 + (1 - sk) * 40, 478, SERIF(84), g); c.restore(); }
    const bk = pop(prog(t, 26.7, 27.2)); if (bk > 0) {
      const p = 1 + beatPulse(t, 27.5) * 0.06; c.save(); c.translate(800 + 180, 600); c.scale(bk * p, bk * p);
      c.shadowColor = C.red; c.shadowBlur = 50; rr(c, -180, -46, 360, 92, 46); c.fillStyle = C.red; c.fill(); c.shadowBlur = 0;
      bell(c, -118, -2, 40, Math.sin(t * 9) * 0.25 * beatPulse(t, 27.5)); txt(c, 'SUBSCRIBE', 22, 2, D(36), '#fff', 'center', 'middle', 2);
      const shx = lerp(-260, 260, ((t - 27) % 2) / 0.8); c.save(); rr(c, -180, -46, 360, 92, 46); c.clip(); const g = c.createLinearGradient(shx - 60, 0, shx + 60, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-180, -46, 360, 92); c.restore();
      c.restore();
      c.save(); c.globalAlpha = bk; txt(c, 'youtube.com/@Thee_Kal_El', 1200, 602, M(600, 30), C.mute); c.restore();
    }
    ICONS.forEach((fn, i) => { const k = pop(prog(t, 27.0 + i * 0.12, 27.5 + i * 0.12)); if (k <= 0) return; const x = W / 2 - 2 * 150 + i * 150, y = 830 + Math.sin(t * 2.4 + i) * 6;
      c.save(); c.translate(x, y); c.scale(k, k); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 24; fn(c, 0, 0, 96); c.restore(); });
  }

  // ---------- captions (wall + shorts) ----------
  const CAPS = [...HEROES.map(([T, , , , a, b]) => [T + 0.05, T + 1.3, a, b]), [20.4, 23.6, 'SHORTS', 'BITE-SIZED ALPHA']];
  function captions(c, t) {
    for (const [t0, t1, a0, b] of CAPS) {
      if (t < t0 || t > t1) continue;
      const k = io5(prog(t, t0, t0 + 0.22)), out = io3(prog(t, t1 - 0.2, t1));
      const a = a0 === '18K VIEWS' ? `${(lerp(0, 18, ease(t, t0, t0 + 0.8, io3)) | 0)}K VIEWS` : a0;
      c.save(); c.globalAlpha = 1 - out;
      const g = c.createLinearGradient(0, 900, 0, H); g.addColorStop(0, 'rgba(7,2,15,0)'); g.addColorStop(0.6, 'rgba(7,2,15,0.85)'); g.addColorStop(1, 'rgba(7,2,15,0.95)'); c.fillStyle = g; c.fillRect(0, 900, W, H - 900);
      c.translate(80, 1000); c.scale(lerp(1.3, 1, k), lerp(1.3, 1, k));
      c.font = D(76); c.textBaseline = 'alphabetic'; c.letterSpacing = '-2px'; c.textAlign = 'left';
      c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(C.mag, 0.6); c.fillText(a, -8 * (1 - k) - 2, 0); c.fillStyle = rgba(C.cyan, 0.6); c.fillText(a, 8 * (1 - k) + 2, 0); c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#fff'; c.fillText(a, 0, 0); c.font = D(76); const aw = c.measureText('18K VIEWS' === a0 ? '18K VIEWS' : a).width;
      c.fillStyle = C.red; c.fillRect(0, 16, aw * io3(prog(t, t0 + 0.1, t0 + 0.4)), 6);
      c.letterSpacing = '4px'; c.font = G(800, 26); c.globalAlpha = (1 - out) * prog(t, t0 + 0.15, t0 + 0.35); c.fillStyle = C.mute; c.fillText(b, aw + 36, -8);
      c.restore();
    }
  }

  // ---------- finishing ----------
  const HITS = [0.0, 4.0, 4.5, 5.0, 5.5, 6.0, 8.0, 10.5, 12.0, 12.5, 14.0, 15.5, 17.0, 18.5, 20.0, 24.0, 26.0];
  const FLASH = [4.0, 8.0, 12.0, 20.0, 24.0, 26.0];
  let GRAIN = null;
  function finish(c, t) {
    let f = 0; for (const T of FLASH) if (t >= T) f = Math.max(f, 0.75 * Math.exp(-(t - T) * 12)); if (f > 0.01) { c.fillStyle = `rgba(255,240,255,${f})`; c.fillRect(0, 0, W, H); }
    c.fillStyle = 'rgba(0,0,0,0.07)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    const fo = ease(t, 29.3, 30.0); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  }

  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.imageSmoothingQuality = 'high';
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    let sh = 0; for (const T of HITS) if (t >= T) sh = Math.max(sh, 14 * Math.exp(-(t - T) * 16)); const sx = (hash(Math.round(t * FPS), 3) - 0.5) * 2 * sh, sy = (hash(Math.round(t * FPS), 4) - 0.5) * 2 * sh;
    c.save(); c.translate(sx, sy); c.translate(W / 2, H / 2); c.scale(1.02, 1.02); c.translate(-W / 2, -H / 2);
    backdrop(c, t);
    if (t > 12 && t < 20) { c.fillStyle = `rgba(7,2,15,${0.55 * ease(t, 12, 12.3) * (1 - ease(t, 19.7, 20))})`; c.fillRect(0, 0, W, H); }
    hook(c, t); kinetic(c, t); channel(c, t); wall(c, t); shorts(c, t); socials(c, t); endCard(c, t);
    c.restore();
    captions(c, t); finish(c, t);
  }

  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(D(100)), document.fonts.load(G(700, 30)), document.fonts.load(M(700, 30)), document.fonts.load(SERIF(60)), ...ASSETS.map((k) => load(k, `../assets/yt/${k}.png`))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
