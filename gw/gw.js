// GIBWORK — "Hire the internet, or collect the bounty." 15s, 1920x1080 @ 60fps, cut to 120 BPM.
// 0–1.5 pixel logo build · 1.5–4 hero headline (task slot machine + bounty odometer) · 4–6.5 isometric bounty board ·
// 6.5–9.5 phone flow: bounty → "I can do this" → Submit Work → wallet gets paid · 9.5–11.5 top earners ·
// 11.5–12.75 category beat-cuts · 12.75–15 end card. All UI rebuilt in vector from the reference screenshots.
(() => {
  'use strict';
  const K = window.KIT, { TAU, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, rr, hash } = K;
  const W = 1920, H = 1080, FPS = 60, DUR = 15;
  const V = !!window.VERTICAL;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const PUR = '#8151FD', PUR2 = '#A98BFF', GRN = '#139A6B', GRN2 = '#1FD18E', INK = '#111114', PAPER = '#FAFAFA', MUTE = '#6E6E78', PILL = '#EFEFF1', DARK = '#0D0A16', USDC = '#2775CA';
  const G = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`, D = (s) => `900 ${s}px "Inter Tight", sans-serif`, M = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const ASSETS = ['kal', 'b_defi', 'b_e', 'b_man', 'b_target', 'b_robot', 'u_ravi', 'u_kellen', 'u_ice', 'u_siam', 'u_oma', 'u_luffy', 'u_jay', 'u_umalnz'];
  const ease = (t, a, b, f = io3) => f(prog(t, a, b)), pulse = (t, T, k = 12) => (t >= T ? Math.exp(-(t - T) * k) : 0), oexp = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  function tw(c, s, font, ls = 0) { c.font = font; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.letterSpacing = '0px'; return w; }
  function cover(c, k, x, y, w, h, r = 0) { const im = IMG[k]; if (!im) return; const s = Math.max(w / im.width, h / im.height), sw = w / s, sh = h / s; c.save(); if (r) { rr(c, x, y, w, h, r); c.clip(); } c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h); c.restore(); }
  function disc(c, k, x, y, r) { c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); cover(c, k, x - r, y - r, 2 * r, 2 * r); c.restore(); }

  // ---------- brand vectors ----------
  // the gibwork pixel "W": rects in grid units (6u wide, 7.5u tall), traced from the logo
  const GLYPH = [[0, 0, 1, 6.5], [5, 0, 1, 6.5], [2.5, 3.3, 1, 2.3], [2, 5.6, 2, 0.9], [1, 6.5, 1, 1], [4, 6.5, 1, 1]];
  const CELLS = []; GLYPH.forEach(([x, y, w, h]) => { const nx = Math.max(1, Math.round(w)), ny = Math.max(1, Math.round(h)); for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) CELLS.push([x + w * i / nx, y + h * j / ny, w / nx, h / ny]); });
  function glyph(c, x, y, u, col = '#fff') { c.fillStyle = col; for (const [gx, gy, gw, gh] of GLYPH) c.fillRect(x + (gx - 3) * u, y + (gy - 3.75) * u, gw * u + 0.5, gh * u + 0.5); }
  // assembling glyph: every cell flies in from a seeded 3D-ish scatter and lands at tLand + jitter
  function glyphBuild(c, x, y, u, t, t0, t1, col = '#fff', seed = 1, spread = 900) {
    c.fillStyle = col; CELLS.forEach(([gx, gy, gw, gh], i) => {
      const s0 = t0 + hash(i, seed) * (t1 - t0) * 0.55, k = crit(prog(t, s0, s0 + (t1 - t0) * 0.45)); if (k <= 0) return;
      const a = hash(i, seed, 2) * TAU, d = spread * (0.4 + hash(i, seed, 3)), sc = lerp(3 + hash(i, seed, 4) * 3, 1, k), rot = (1 - k) * (hash(i, seed, 5) - 0.5) * 6;
      const tx = x + (gx + gw / 2 - 3) * u, ty = y + (gy + gh / 2 - 3.75) * u, px = lerp(tx + Math.cos(a) * d, tx, k), py = lerp(ty + Math.sin(a) * d, ty, k);
      c.save(); c.translate(px, py); c.rotate(rot); c.scale(sc, sc); c.globalAlpha = clamp(k * 3); c.fillRect(-gw * u / 2, -gh * u / 2, gw * u + 0.5, gh * u + 0.5); c.restore();
    });
  }
  function logoDisc(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = PUR; c.fill(); glyph(c, x, y, r / 6.8); }
  function appIcon(c, x, y, s) { rr(c, x - s / 2, y - s / 2, s, s, s * 0.22); c.fillStyle = PUR; c.fill(); glyph(c, x, y + s * 0.02, s / 11); }
  function verified(c, x, y, r, col = PUR) { c.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, rr2 = i % 2 ? r * 0.86 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = r * 0.24; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x - r * 0.38, y + r * 0.02); c.lineTo(x - r * 0.1, y + r * 0.3); c.lineTo(x + r * 0.42, y - r * 0.3); c.stroke(); }
  function xLogo(c, x, y, s, col = '#fff') { c.save(); c.translate(x, y); c.strokeStyle = col; c.lineCap = 'butt'; c.lineWidth = s * 0.13; c.beginPath(); c.moveTo(-s * 0.42, -s * 0.48); c.lineTo(s * 0.42, s * 0.48); c.stroke(); c.lineWidth = s * 0.07; c.beginPath(); c.moveTo(s * 0.4, -s * 0.48); c.lineTo(-s * 0.4, s * 0.48); c.stroke(); c.restore(); }
  function bolt(c, x, y, s, col) { c.save(); c.translate(x, y); c.scale(s / 20, s / 20); c.beginPath(); c.moveTo(3, -10); c.lineTo(-6, 2); c.lineTo(0, 2); c.lineTo(-3, 10); c.lineTo(6, -2); c.lineTo(0, -2); c.closePath(); c.fillStyle = col; c.fill(); c.restore(); }
  function coinUSD(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = USDC; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = r * 0.1; c.beginPath(); c.arc(x, y, r * 0.66, 0, TAU); c.stroke(); txt(c, '$', x, y + r * 0.05, G(800, r * 0.95), '#fff', 'center', 'middle'); }
  function coinXP(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = PUR; c.fill(); bolt(c, x, y, r * 1.1, '#FFD84A'); }
  function sparkle(c, x, y, s, col, rot = 0) { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.moveTo(s, 0); for (let i = 1; i <= 4; i++) { const a = i * TAU / 4; c.quadraticCurveTo(0, 0, Math.cos(a) * s, Math.sin(a) * s); } c.closePath(); c.fillStyle = col; c.fill(); c.restore(); }
  function appStore(c, x, y, s = 1) {
    c.save(); c.translate(x, y); c.scale(s, s); rr(c, -150, -46, 300, 92, 16); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#DADADF'; c.lineWidth = 2; c.stroke();
    const g = c.createLinearGradient(0, -26, 0, 26); g.addColorStop(0, '#1AC8FC'); g.addColorStop(1, '#1D6FF2'); rr(c, -122, -28, 56, 56, 13); c.fillStyle = g; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-102, 14); c.lineTo(-88, -12); c.moveTo(-86, 14); c.lineTo(-100, -12); c.moveTo(-112, 6); c.lineTo(-77, 6); c.stroke();
    txt(c, 'DOWNLOAD ON THE', -50, -14, G(600, 15), '#333', 'left', 'middle', 0.5); txt(c, 'App Store', -50, 14, G(700, 31), INK); c.restore();
  }
  function playStore(c, x, y, s = 1) {
    c.save(); c.translate(x, y); c.scale(s, s); rr(c, -150, -46, 300, 92, 16); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#DADADF'; c.lineWidth = 2; c.stroke();
    const P = [-122, -28], T = (pts, col) => { c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.closePath(); c.fillStyle = col; c.fill(); };
    T([[-122, -28], [-92, 2], [-122, 32]], '#2196F3'); T([[-122, -28], [-74, -6], [-92, 2]], '#4CAF50'); T([[-122, 32], [-92, 2], [-74, 10]], '#F44336'); T([[-92, 2], [-74, -6], [-64, 2], [-74, 10]], '#FFC107'); void P;
    txt(c, 'GET IT ON', -50, -14, G(600, 15), '#333', 'left', 'middle', 0.5); txt(c, 'Google Play', -50, 14, G(700, 31), INK); c.restore();
  }
  let DOTS = null;
  function paper(c, t, glow = 1) {
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    if (!DOTS) { DOTS = document.createElement('canvas'); DOTS.width = DOTS.height = 26; const g = DOTS.getContext('2d'); g.fillStyle = '#D6D6DC'; g.beginPath(); g.arc(13, 13, 1.6, 0, TAU); g.fill(); }
    c.save(); c.fillStyle = c.createPattern(DOTS, 'repeat'); c.translate(-(t * 18 % 26), -(t * 9 % 26)); c.fillRect(0, 0, W + 26, H + 26); c.restore();
    if (glow) for (const [x, y, col, r] of [[W * 0.25 + Math.sin(t) * 120, H * 0.35, PUR, 700], [W * 0.8, H * 0.7 + Math.cos(t * 0.8) * 100, GRN2, 600]]) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, 0.13 * glow)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  }
  function darkBg(c, t) {
    c.fillStyle = DARK; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, 1100); g.addColorStop(0, rgba(PUR, 0.38)); g.addColorStop(0.6, rgba(PUR, 0.08)); g.addColorStop(1, rgba(PUR, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 1; const o = (t * 40) % 80; for (let x = -o; x < W; x += 80) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = -o; y < H; y += 80) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } c.restore();
  }

  // ---------- S0 logo build (0–1.5) ----------
  function intro(c, t) {
    if (t >= 1.5) return; darkBg(c, t);
    const mv = io5(prog(t, 0.95, 1.25)), lx = lerp(W / 2, W / 2 - 330, mv), ly = H / 2, sc = lerp(1, 0.62, mv), u = 46 * sc;
    // scanline sweep + pixel rain before the snap
    const sweep = prog(t, 0, 0.7); c.save(); c.globalAlpha = 0.6 * (1 - sweep); c.fillStyle = PUR; c.fillRect(0, H * sweep - 3, W, 6); c.restore();
    const dk = pop(prog(t, 0.72, 1.05)); if (dk > 0) { c.save(); c.shadowColor = PUR; c.shadowBlur = 90; c.beginPath(); c.arc(lx, ly, 6.8 * u * dk, 0, TAU); c.fillStyle = PUR; c.fill(); c.restore(); }
    const ring = prog(t, 0.75, 1.3); if (ring > 0 && ring < 1) { c.save(); c.strokeStyle = rgba(PUR2, 1 - ring); c.lineWidth = 30 * (1 - ring); c.beginPath(); c.arc(lx, ly, 6.8 * u + 700 * o3(ring), 0, TAU); c.stroke(); c.restore(); }
    glyphBuild(c, lx, ly, u, t, 0.05, 0.78, '#fff', 3, 1100);
    // wordmark
    if (t > 1.0) { const f = G(700, 210); let x = lx + 6.8 * u + 60; [...'gibwork'].forEach((ch, i) => { const k = crit(prog(t, 1.0 + i * 0.03, 1.25 + i * 0.03)); const w = tw(c, ch, f); c.save(); c.beginPath(); c.rect(x - 10, ly - 170, w + 20, 300); c.clip(); txt(c, ch, x, ly + 30 + (1 - k) * 220, f, '#fff', 'left', 'middle'); c.restore(); x += w; }); const vk = pop(prog(t, 1.22, 1.45)); if (vk > 0) verified(c, x + 50, ly - 20, 34 * vk); }
    // iris reveal of the hero on paper
    const ir = prog(t, 1.3, 1.5); if (ir > 0) { c.save(); c.beginPath(); c.arc(lx, ly, 2400 * io3(ir), 0, TAU); c.clip(); hero(c, 1.5 + (t - 1.5) * 0.3); c.restore(); }
  }
  const o3 = (p) => 1 - Math.pow(1 - p, 3);

  // ---------- S1 hero (1.5–4.0) ----------
  const TASKS = [['Find 15 sales leads', 'lead'], ['Build a Solana dApp', 'dev'], ['Design a new logo', 'design'], ['Edit a UGC video', 'video'], ['Write a launch thread', 'write'], ['Verify 50 emails', 'mail'], ['Create X Content', 'x']];
  function taskIcon(c, kind, x, y, r) {
    const cols = { lead: '#FF7A1A', dev: INK, design: '#E84393', video: '#E53935', write: GRN, mail: USDC, x: '#000' }; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = cols[kind]; c.fill();
    if (kind === 'x') return xLogo(c, x, y, r * 0.95);
    const gl = { lead: '◎', dev: '</>', design: '✦', video: '▶', write: '✎', mail: '@' }[kind]; txt(c, gl, x, y + r * 0.04, G(800, kind === 'dev' ? r * 0.7 : r * 1.05), '#fff', 'center', 'middle');
  }
  function hero(c, t) {
    paper(c, t);
    const zoom = ease(t, 3.72, 4.0, (p) => p * p * p), cx = 420, cy = 830; // zoom into the bounty pill
    c.save(); if (zoom > 0) { const s = 1 + zoom * 9; c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy); }
    const push = 1 + 0.04 * prog(t, 1.5, 3.7); c.translate(W / 2, H / 2); c.scale(push, push); c.translate(-W / 2, -H / 2);
    // background ghost ticker, as on the site
    c.save(); c.globalAlpha = 0.05; ['Find 15 sales leads • Content • Turn', 'Shortlist 15 people for this role • Development', 'Find verified emails for these leads • Social Media', 'Research investors focused on my sector • Design'].forEach((s, i) => txt(c, s + '  •  ' + s, 760 - ((t * (60 + i * 20)) % 900), 280 + i * 120, G(600, 44), INK)); c.restore();
    const X0 = 170, f1 = G(700, 160);
    // line 1: word slams
    let x = X0; [['Hire', 1.5], ['the', 1.62], ['internet', 1.75]].forEach(([w, T0]) => { const k = crit(prog(t, T0, T0 + 0.22)), ww = tw(c, w, f1); if (k > 0) { c.save(); c.translate(x + ww / 2, 250); const s = lerp(1.7, 1, k); c.scale(s, s); c.globalAlpha = clamp(k * 2.5); txt(c, w, 0, 0, f1, INK, 'center', 'middle', -3); c.restore(); } x += ww + 40; });
    [[1180, 150, 26, PUR], [1300, 220, 18, '#E84393'], [760, 160, 14, PUR2], [1350, 310, 22, PUR]].forEach(([sx, sy, s, col], i) => { const k = pop(prog(t, 1.92 + i * 0.06, 2.25 + i * 0.06)); if (k > 0) sparkle(c, sx, sy, s * k * 1.6, col, t * 2 + i); });
    // line 2: the task slot machine
    if (t > 1.95) {
      const sk = pop(prog(t, 1.95, 2.25)), n = TASKS.length, p = oexp(prog(t, 2.0, 2.95)) * (n - 1), fp = G(600, 92);
      const wOf = (i) => tw(c, TASKS[clamp(i, 0, n - 1) | 0][0], fp) + 170, i0 = Math.floor(p), pw = lerp(wOf(i0), wOf(i0 + 1), p - i0);
      c.save(); c.translate(X0, 445); c.scale(sk, sk); rr(c, 0, -72, pw, 144, 72); c.fillStyle = PILL; c.fill(); c.strokeStyle = '#DDDDE2'; c.lineWidth = 3; c.stroke(); c.clip();
      for (let i = Math.max(0, i0 - 1); i <= Math.min(n - 1, i0 + 2); i++) { const dy = (i - p) * 150; c.save(); c.globalAlpha = clamp(1 - Math.abs(i - p) * 0.9); taskIcon(c, TASKS[i][1], 76, dy, 44); txt(c, TASKS[i][0], 140, dy + 4, fp, INK, 'left', 'middle', -1); c.restore(); }
      c.restore();
    }
    // line 3: or collect the [$ odometer] bounty
    if (t > 2.95) {
      const f3 = G(700, 160); let x3 = X0; const words = [['or', 2.98], ['collect', 3.06], ['the', 3.14]];
      words.forEach(([w, T0]) => { const k = crit(prog(t, T0, T0 + 0.22)), ww = tw(c, w, f3); c.save(); c.beginPath(); c.rect(x3 - 10, 545, ww + 30, 200); c.clip(); txt(c, w, x3, 640 + (1 - k) * 190, f3, INK, 'left', 'middle', -3); c.restore(); x3 += ww + 40; });
      const pk = pop(prog(t, 3.22, 3.5)), fo = G(600, 112), pwid = tw(c, '$1,000.00', fo) + 70;
      x3 = X0; c.save(); c.translate(x3 + pwid / 2, 835); c.scale(pk, pk); rr(c, -pwid / 2, -72, pwid, 144, 72); c.fillStyle = PILL; c.fill(); c.strokeStyle = '#DDDDE2'; c.lineWidth = 3; c.stroke(); c.clip();
      const v = oexp(prog(t, 3.25, 3.7)) * 1000; txt(c, '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','), 0, 4, fo, INK, 'center', 'middle'); c.restore();
      const bk = crit(prog(t, 3.34, 3.56)); c.save(); c.globalAlpha = clamp(bk * 2); txt(c, 'bounty', x3 + pwid + 40 + (1 - bk) * 80, 835, f3, INK, 'left', 'middle', -3); c.restore();
    }
    c.restore();
  }

  // ---------- S2 bounty board (4.0–6.5) ----------
  const BOUNTIES = [
    ['Gibwork Developer Hackathon Bounty', 'logo', '@gibwork', 'Development', '$1000.00', 'Ends in 23 days', 'usd'],
    ['Create an X Thread About the Gibwork Mobile App', 'logo', '@gibwork', 'Social Media', '1980 XP', 'Ends in 2 months', 'xp'],
    ['Refer. Share. Win upto $300 USDC', 'b_defi', '@teamdefidotcom', 'Social Media', '530 XP', 'Ends in 5 days', 'xp'],
    ['Try Out the Gibwork Mobile App & Give Feedback', 'logo', '@gibwork', 'Testing', '$300.00', 'Open', 'usd'],
    ['How Often Do You Ad…', 'b_e', '', 'Research', '$150.00', 'Open', 'usd'],
    ['Invite Users, Earn Poi…', 'b_man', '', 'Community', '$125.00', 'Open', 'usd'],
    ['Create an X thread an…', 'b_target', '', 'Social Media', '$100.00', 'Open', 'usd'],
    ['Invite a UGC Creator to…', 'b_man', '', 'Community', '$30.00', 'Open', 'usd'],
    ['Follow, Quote Post & J…', 'b_robot', '', 'Social Media', '$10.00', 'Open', 'usd'],
  ];
  const CW = 860, CH = 150;
  function card(c, b, x, y, glow = 0) {
    const [title, ic, handle, tag, price, ends, kind] = b;
    c.save(); if (glow) { c.shadowColor = rgba(GRN2, 0.8 * glow); c.shadowBlur = 50 * glow; } else { c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 30; c.shadowOffsetY = 12; }
    rr(c, x, y, CW, CH, 18); c.fillStyle = '#fff'; c.fill(); c.restore(); rr(c, x, y, CW, CH, 18); c.strokeStyle = glow ? rgba(GRN, glow) : '#E4E4E8'; c.lineWidth = glow ? 4 : 2; c.stroke();
    if (ic === 'logo') logoDisc(c, x + 72, y + CH / 2, 44); else disc(c, ic, x + 72, y + CH / 2, 44);
    c.font = G(700, 30); let tt = title; while (c.measureText(tt).width > 500 && tt.length > 4) tt = tt.slice(0, -2) + '…'; txt(c, tt, x + 140, y + 38, G(700, 30), INK);
    if (handle) { txt(c, handle, x + 140, y + 78, G(500, 24), MUTE); verified(c, x + 152 + tw(c, handle, G(500, 24)), y + 78, 11); }
    const tg = G(600, 20), tgw = tw(c, tag, tg) + 28, ty = handle ? 116 : 90; rr(c, x + 140, y + ty - 17, tgw, 34, 17); c.strokeStyle = '#DADAE0'; c.lineWidth = 2; c.stroke(); txt(c, tag, x + 154, y + ty + 1, tg, INK);
    (kind === 'xp' ? coinXP : coinUSD)(c, x + CW - 38, y + 34, 15);
    txt(c, price, x + CW - 26, y + 84, G(800, 44), INK, 'right'); txt(c, ends, x + CW - 26, y + 122, G(500, 20), MUTE, 'right');
  }
  const ISO = [0.92, -0.28, 0.46, 0.78]; // a, b, c, d of the board's affine (isometric-ish tilt)
  function board(c, t) {
    if (t < 4.0 || t >= 6.5) return; darkBg(c, t);
    // left headline
    const L = [['Post a task.', 4.0, '#fff'], ['Or grab one', 4.25, GRN2], ['and get paid.', 4.5, GRN2]];
    L.forEach(([s, T0, col], i) => { const k = crit(prog(t, T0, T0 + 0.3)), ex = ease(t, 5.95, 6.3); c.save(); c.globalAlpha = clamp(k * 2) * (1 - ex); c.beginPath(); c.rect(90, 290 + i * 130, 900, 150); c.clip(); txt(c, s, 120 - ex * 200, 368 + i * 130 + (1 - k) * 130, G(800, 112), col, 'left', 'middle', -3); c.restore(); });
    const sub = A(t, 4.75, 0.3) * (1 - ease(t, 5.95, 6.3)); c.save(); c.globalAlpha = sub; txt(c, 'Get help with your tasks, or earn by completing others.', 124, 735, G(500, 34), 'rgba(255,255,255,0.7)'); c.restore();
    // isometric scrolling column
    const scroll = (t - 4.0) * 260 + 420 * io3(prog(t, 4.0, 4.6)), hiK = ease(t, 5.95, 6.45, io5);
    c.save(); c.translate(1330, 560); c.transform(...ISO, 0, 0);
    for (let r = -6; r < 10; r++) {
      const idx = ((r % BOUNTIES.length) + BOUNTIES.length) % BOUNTIES.length, y = r * (CH + 26) - scroll + 700; if (y < -1300 || y > 1300) continue;
      const appear = crit(prog(t, 4.0 + (r + 6) * 0.04, 4.35 + (r + 6) * 0.04)); if (appear <= 0) continue;
      const isHi = idx === 3 && r === 3; if (isHi && hiK > 0) continue;
      const beat = pulse(t, 4.0 + Math.floor((t - 4.0) / 0.5) * 0.5, 6) * (r % 2 === Math.floor((t - 4) / 0.5) % 2 ? 1 : 0);
      c.save(); c.globalAlpha = clamp(appear * 2) * (1 - hiK * 0.75); c.translate(-CW / 2 + (1 - appear) * 600, y); card(c, BOUNTIES[idx], 0, 0, beat * 0.6); c.restore();
    }
    c.restore();
    // the $300 app-testing bounty pulls out of the board toward camera
    if (hiK > 0) { const y = 3 * (CH + 26) - scroll + 700, m = ISO.map((v, i) => lerp(v, i === 0 || i === 3 ? 1.35 : 0, hiK)), ox = lerp(1330, W / 2, hiK), oy = lerp(560, H / 2, hiK);
      c.save(); c.translate(ox, oy); c.transform(...m, 0, 0); c.translate(-CW / 2, lerp(y, -CH / 2, hiK)); card(c, BOUNTIES[3], 0, 0, hiK); c.restore(); }
  }

  // ---------- S3 phone flow (6.5–9.5) ----------
  const PH = 980, PS = PH / 2340, PWID = 1080 * PS; // phone screen drawn in native 1080x2340 units
  function phoneScreens(c, t) {
    // A: bounty detail · B: submit work · C: wallet. Slide transitions between them.
    const ab = ease(t, 7.28, 7.45, io5), bc = ease(t, 8.26, 8.45, io5);
    if (ab < 1) { c.save(); c.translate(-1080 * ab, 0); scrDetail(c, t); c.restore(); }
    if (ab > 0 && bc < 1) { c.save(); c.translate(1080 * (1 - ab), -2340 * bc); scrSubmit(c, t); c.restore(); }
    if (bc > 0) { c.save(); c.translate(0, 2340 * (1 - bc)); scrWallet(c, t); c.restore(); }
  }
  function statusBar(c, light = true) { txt(c, '3:19', 60, 52, G(500, 38), '#333'); c.fillStyle = '#333'; rr(c, 940, 30, 80, 44, 22); c.fill(); txt(c, '74', 980, 53, G(700, 30), '#fff', 'center'); void light; }
  function roundBtn(c, x, y, r, fill = '#F0F0F0') { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = fill; c.fill(); }
  function crossIco(c, x, y, s, col = '#222') { c.strokeStyle = col; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - s, y - s); c.lineTo(x + s, y + s); c.moveTo(x + s, y - s); c.lineTo(x - s, y + s); c.stroke(); }
  function ripple(c, x, y, t, T0, col = 'rgba(255,255,255,0.6)') { const k = prog(t, T0, T0 + 0.35); if (k <= 0 || k >= 1) return; c.save(); c.fillStyle = col; c.globalAlpha = 1 - k; c.beginPath(); c.arc(x, y, 40 + 260 * o3(k), 0, TAU); c.fill(); c.restore(); }
  function finger(c, x, y, press) { c.save(); c.translate(x, y); const s = 1 - press * 0.12; c.scale(s, s); c.beginPath(); c.arc(0, 0, 46, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.85)'; c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 24; c.fill(); c.shadowBlur = 0; c.strokeStyle = rgba(PUR, 0.9); c.lineWidth = 6; c.stroke(); c.restore(); }
  function scrDetail(c, t) {
    c.fillStyle = '#fff'; c.fillRect(0, 0, 1080, 2340); statusBar(c);
    roundBtn(c, 75, 160, 52); crossIco(c, 75, 160, 18); rr(c, 418, 108, 244, 104, 52); c.fillStyle = '#F0F0F0'; c.fill(); txt(c, '$300.00', 540, 162, G(700, 46), INK, 'center');
    [[772, '💬'], [890, '≡'], [1008, '⋮']].forEach(([x, g]) => { roundBtn(c, x, 160, 52); txt(c, g === '💬' ? '○' : g, x, 162, G(700, 50), '#222', 'center'); });
    logoDisc(c, 80, 333, 40); txt(c, 'gibwork', 140, 333, G(600, 60), INK); verified(c, 400, 333, 18);
    txt(c, 'Try Out the Gibwork Mobile', 40, 448, G(800, 66), INK); txt(c, 'App & Give Feedback', 40, 536, G(800, 66), INK);
    const body = ['Gibwork is looking for real users to', 'try out the Gibwork mobile app. Download', 'it, set up your profile, explore bounties', 'and tell us what you love and what to fix.', 'Approved submissions are eligible for a', '$300 reward for detailed, honest feedback', 'with screenshots of your experience.'];
    body.forEach((s, i) => { const k = A(t, 6.6 + i * 0.04, 0.3); c.save(); c.globalAlpha = k; txt(c, s, 40, 705 + i * 71 + (1 - k) * 20, G(i >= 5 ? 700 : 400, 44), '#2A2A30'); c.restore(); });
    txt(c, 'Get the app:', 40, 1290, G(400, 44), '#2A2A30'); txt(c, 'App Store · Google Play · gib.work', 40, 1361, G(400, 44), PUR);
    const press = pulse(t, 7.05, 10) * (t >= 7.05 ? 1 : 0); rr(c, 40, 2005 + press * 6, 1000, 140, 70); c.fillStyle = press > 0.05 ? '#0C7F57' : GRN; c.fill(); txt(c, 'I can do this', 540, 2077 + press * 6, G(700, 54), '#fff', 'center');
    ripple(c, 600, 2075, t, 7.05);
  }
  const KB = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  function scrSubmit(c, t) {
    c.fillStyle = '#fff'; c.fillRect(0, 0, 1080, 2340); statusBar(c);
    roundBtn(c, 75, 160, 52); crossIco(c, 75, 160, 18); txt(c, 'Submit Work', 160, 162, G(800, 56), INK);
    const ok = pulse(t, 8.05, 8) * (t >= 8.05 ? 1 : 0), ck = 1 + ok * 0.25; c.save(); c.translate(1010, 160); c.scale(ck, ck); roundBtn(c, 0, 0, 52, GRN); c.strokeStyle = '#fff'; c.lineWidth = 8; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-20, 0); c.lineTo(-6, 15); c.lineTo(22, -14); c.stroke(); c.restore();
    c.fillStyle = '#E4E4E8'; c.fillRect(0, 228, 1080, 3);
    // typed note, word-wrapped to the screen width; the caret follows the last typed character
    const s = 'This app is exactly what I needed to help my business grow!', n = Math.floor(clamp((t - 7.45) / 0.53) * s.length), tf = G(400, 50), lines = [''];
    for (const w of s.slice(0, n).split(/(?<= )/)) { const cand = lines[lines.length - 1] + w; if (tw(c, cand.trimEnd(), tf) > 990 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = cand; }
    lines.forEach((ln, i) => txt(c, ln, 46, 310 + i * 72, tf, INK)); const cx = 46 + tw(c, lines[lines.length - 1], tf) + 4, cy = 268 + (lines.length - 1) * 72;
    if (Math.floor(t * 4) % 2 === 0 || t < 7.98) { c.fillStyle = '#7FCFC6'; c.fillRect(cx, cy, 5, 82); }
    ['⌀', 'H', 'B', 'I', 'U', '≡', '∞'].forEach((g, i) => txt(c, g, 75 + i * 155, 1172, G(i === 2 ? 800 : i === 3 ? 400 : 600, 58), '#333', 'center'));
    c.fillStyle = '#1B1B1E'; c.fillRect(0, 1330, 1080, 1010);
    const key = s[Math.max(0, n - 1)]?.toLowerCase(); KB.forEach((row, r) => { const kw = 88, gap = 6, w0 = (1080 - row.length * (kw + gap)) / 2; [...row].forEach((ch, i) => { const x = w0 + i * (kw + gap), y = 1450 + r * 125, hit = ch === key && t > 7.45 && t < 7.98; rr(c, x, y - 48, kw, 96, 14); c.fillStyle = hit ? '#5A5A66' : '#333338'; c.fill(); txt(c, ch, x + kw / 2, y, G(400, 46), '#fff', 'center'); }); });
    rr(c, 245, 1878, 590, 96, 14); c.fillStyle = '#333338'; c.fill(); txt(c, 'English (US)', 540, 1926, G(400, 36), '#ddd', 'center');
    ripple(c, 1010, 160, t, 8.05, rgba(GRN2, 0.6));
  }
  function scrWallet(c, t) {
    c.fillStyle = '#fff'; c.fillRect(0, 0, 1080, 2340); const tg = c.createLinearGradient(0, 0, 0, 260); tg.addColorStop(0, rgba(PUR, 0.12)); tg.addColorStop(1, rgba(PUR, 0)); c.fillStyle = tg; c.fillRect(0, 0, 1080, 260); statusBar(c);
    disc(c, 'kal', 92, 146, 52); rr(c, 465, 92, 186, 106, 53); c.fillStyle = '#F2F2F2'; c.fill(); roundBtn(c, 523, 145, 38, '#fff'); bolt(c, 523, 145, 44, INK); txt(c, '0', 596, 147, G(700, 50), INK, 'center');
    rr(c, 673, 92, 366, 106, 53); c.fillStyle = '#F2F2F2'; c.fill(); txt(c, 'Refer & earn', 856, 147, G(600, 50), INK, 'center');
    const paid = ease(t, 8.55, 9.05, (p) => 1 - Math.pow(1 - p, 4)), fl = pulse(t, 9.05, 5) * (t >= 9.05 ? 1 : 0);
    c.save(); c.shadowColor = fl > 0 ? rgba(GRN2, 0.7 * fl + 0.1) : 'rgba(0,0,0,0.12)'; c.shadowBlur = 30 + 60 * fl; const cg = c.createLinearGradient(70, 260, 1010, 850); cg.addColorStop(0, '#FDFDFD'); cg.addColorStop(1, '#ECEFEF'); rr(c, 70, 258, 940, 594, 70); c.fillStyle = cg; c.fill(); c.restore(); rr(c, 70, 258, 940, 594, 70); c.strokeStyle = '#E2E2E6'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#666'; for (const [qx, qy] of [[146, 338], [178, 338], [146, 370]]) { c.lineWidth = 6; c.strokeStyle = '#666'; c.strokeRect(qx, qy, 24, 24); } c.fillRect(182, 374, 10, 10); c.lineWidth = 5; rr(c, 905, 335, 40, 44, 8); c.stroke(); rr(c, 895, 325, 40, 44, 8); c.stroke();
    const amt = '$' + (300 * paid).toFixed(2); txt(c, amt, 112, 638, G(800, 140), paid > 0 && paid < 1 ? '#0C7F57' : INK); txt(c, '7WbWF...ymow7Xr', 112, 742, G(600, 44), '#A09C98');
    rr(c, 52, 772 + 120, 396, 116, 58); c.fillStyle = '#F4F4F2'; c.fill(); txt(c, 'Withdraw', 250, 950, G(600, 50), '#555', 'center'); rr(c, 474, 892, 398, 116, 58); c.fillStyle = GRN; c.fill(); txt(c, 'Add funds', 673, 950, G(600, 50), '#fff', 'center');
    txt(c, 'History', 52, 1128, G(800, 62), INK);
    const hk = crit(prog(t, 8.75, 9.1)); if (hk < 1) { c.save(); c.globalAlpha = 1 - hk; txt(c, 'Nothing here yet.', 540, 1330, G(500, 46), '#777', 'center'); c.restore(); }
    if (hk > 0) { c.save(); c.globalAlpha = hk; c.translate((1 - hk) * 400, 0); roundBtn(c, 112, 1290, 56, rgba(GRN, 0.14)); c.strokeStyle = GRN; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(90, 1292); c.lineTo(106, 1308); c.lineTo(136, 1276); c.stroke(); txt(c, 'Bounty reward', 196, 1266, G(700, 46), INK); txt(c, 'Try Out the Gibwork Mobile…', 196, 1322, G(500, 36), '#888'); txt(c, '+$300.00', 1030, 1290, G(800, 50), GRN, 'right'); c.restore(); }
    // bottom nav
    c.fillStyle = '#fff'; c.fillRect(0, 2000, 1080, 340); c.fillStyle = '#333'; [[144, 'h'], [342, 'p'], [738, 'u'], [936, 'w']].forEach(([x, k]) => { c.strokeStyle = '#444'; c.lineWidth = 7; if (k === 'w') { rr(c, x - 34, 2072, 68, 54, 12); c.fillStyle = '#111'; c.fill(); } else { c.beginPath(); c.arc(x, 2098, 30, 0, TAU); c.stroke(); } });
    roundBtn(c, 540, 2098, 78, GRN); c.strokeStyle = '#fff'; c.lineWidth = 9; c.beginPath(); c.moveTo(540, 2068); c.lineTo(540, 2128); c.moveTo(510, 2098); c.lineTo(570, 2098); c.stroke();
  }
  const BIGW = [[['PICK', 'IT.'], 6.5, '#fff'], [['SHIP', 'IT.'], 7.35, GRN2], [['GET', 'PAID.'], 8.35, '#fff']];
  function phone(c, t) {
    if (t < 6.5 || t >= 9.5) return; darkBg(c, t);
    // giant words on the left: outlined echo texture across the frame, then a hard two-line slam with a fill sweep
    const cur = BIGW.filter(([, T0]) => t >= T0).pop(); { const [ls, T0, col] = cur, k = crit(prog(t, T0, T0 + 0.25)), f = D(280);
      c.save(); c.globalAlpha = 0.1; c.strokeStyle = '#fff'; c.lineWidth = 2; c.font = D(200); c.textBaseline = 'middle'; c.textAlign = 'left'; for (let j = 0; j < 6; j++) c.strokeText((ls.join(' ') + '  ').repeat(4), -((t * 150 + j * 400) % 1400) * (j % 2 ? -1 : 1) - (j % 2 ? 1400 : 0), 100 + j * 190); c.restore();
      ls.forEach((w, j) => { const kk = crit(prog(t, T0 + j * 0.06, T0 + j * 0.06 + 0.25)); c.save(); c.beginPath(); c.rect(0, 205 + j * 290, 1100, 290); c.clip(); const y = 360 + j * 280 + (1 - kk) * 290;
        c.font = f; c.letterSpacing = '-8px'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = col; c.strokeText(w, 110, y); c.beginPath(); c.rect(0, 0, 110 + 1000 * ease(t, T0 + 0.12 + j * 0.06, T0 + 0.45 + j * 0.06), H); c.clip(); c.fillStyle = col; c.fillText(w, 110, y); c.letterSpacing = '0px'; c.restore(); }); void k; }
    const ink = crit(prog(t, 6.5, 6.85)), tilt = Math.sin(t * 1.6) * 0.04, ex = ease(t, 9.3, 9.5, (p) => p * p);
    const px = 1400 + Math.sin(t * 1.1) * 14, py = H / 2 + 10 + (1 - ink) * 700 - ex * 1200;
    // payout coin burst
    if (t > 8.55) for (let i = 0; i < 26; i++) { const T0 = 8.55 + hash(i, 7) * 0.25, k = prog(t, T0, T0 + 0.9); if (k <= 0 || k >= 1) continue; const a = (i % 2 ? -Math.PI * 0.15 : -Math.PI * 0.85) + (hash(i, 8) - 0.5) * 1.2, v = 500 + hash(i, 9) * 700, x = px + Math.cos(a) * v * k, y = py - 250 + Math.sin(a) * v * k + 900 * k * k; c.save(); c.globalAlpha = 1 - k * k; c.translate(x, y); c.scale(Math.cos(t * 9 + i), 1); (i % 4 ? coinUSD : coinXP)(c, 0, 0, 26 + hash(i, 10) * 18); c.restore(); }
    // phone body
    c.save(); c.translate(px, py); c.rotate(tilt + (1 - ink) * 0.4); c.scale(lerp(0.6, 1, ink), lerp(0.6, 1, ink));
    const fw = PWID + 34, fh = PH + 34; c.save(); c.shadowColor = rgba(PUR, 0.7); c.shadowBlur = 120; rr(c, -fw / 2, -fh / 2, fw, fh, 64); c.fillStyle = '#16141C'; c.fill(); c.restore(); rr(c, -fw / 2, -fh / 2, fw, fh, 64); c.strokeStyle = '#3A3550'; c.lineWidth = 4; c.stroke();
    c.save(); rr(c, -PWID / 2, -PH / 2, PWID, PH, 48); c.clip(); c.translate(-PWID / 2, -PH / 2); c.scale(PS, PS); phoneScreens(c, t); c.restore();
    rr(c, -55, -PH / 2 + 14, 110, 30, 15); c.fillStyle = '#000'; c.fill();
    c.restore();
    // taps: show the finger
    for (const [T0, sx, sy] of [[7.05, 600, 2075], [8.05, 1010, 160]]) { const k = prog(t, T0 - 0.2, T0 + 0.25); if (k > 0 && k < 1) { const x = px - PWID / 2 + sx * PS, y = py - PH / 2 + sy * PS; c.save(); c.globalAlpha = Math.sin(k * Math.PI); finger(c, x + (1 - k) * 60, y + (1 - k) * 80, pulse(t, T0, 10) * (t >= T0 ? 1 : 0)); c.restore(); } }
  }

  // ---------- S4 earners (9.5–11.5) ----------
  const EARN = [['u_ravi', 'Ravi Patel', 'Development', 668.86], ['u_kellen', 'Kellen Wisdom', 'Marketing', 451.10], ['u_ice', 'Ice Xtar', 'Community', 372.31], ['u_siam', 'Siam Ahmed', 'Marketing', 340.52], ['u_oma', 'Blessingsofficial Oma', 'Marketing', 307.38], ['u_luffy', 'Captain Luffy', 'Writing', 303.35], ['u_jay', 'Jay Smith', 'Marketing', 270.24], ['u_umalnz', 'Umalnz Forex', 'Marketing', 257.75]];
  const CHIPS = ['Explore', 'Development', 'Design', 'Marketing', 'Writing', 'Community', 'Social Media', 'Content', 'Research'];
  function earners(c, t) {
    if (t < 9.5 || t >= 11.5) return; paper(c, t, 0.8);
    const out = ease(t, 11.25, 11.5, (p) => p * p * p);
    c.save(); c.translate(W / 2, H / 2); c.scale(1 + out * 0.6, 1 + out * 0.6); c.translate(-W / 2, -H / 2); c.globalAlpha = 1 - out;
    const hk = crit(prog(t, 9.5, 9.8)); c.save(); c.beginPath(); c.rect(0, 70, W, 140); c.clip(); txt(c, 'Real people.', 140, 140 + (1 - hk) * 140, G(800, 96), INK, 'left', 'middle', -3); const hk2 = crit(prog(t, 9.62, 9.92)); txt(c, 'Real payouts.', 140 + tw(c, 'Real people. ', G(800, 96), -3), 140 + (1 - hk2) * 140, G(800, 96), GRN, 'left', 'middle', -3); c.restore();
    // category chips marquee
    let cx = 140 - Math.max(0, (t - 9.6) * 120); CHIPS.forEach((s, i) => { const k = pop(prog(t, 9.6 + i * 0.04, 9.95 + i * 0.04)), f = G(600, 34), w = tw(c, s, f) + 56; c.save(); c.translate(cx + w / 2, 262); c.scale(k, k); rr(c, -w / 2, -34, w, 68, 34); c.fillStyle = i === 0 ? '#E4E4E8' : '#F1F1F3'; c.fill(); txt(c, s, 0, 2, f, INK, 'center'); c.restore(); cx += w + 16; });
    // 2x4 leaderboard
    EARN.forEach(([k, name, cat, amt], i) => {
      const col = i % 2, row = i >> 1, x = 140 + col * 840, y = 360 + row * 160, T0 = 9.75 + i * 0.07, a = crit(prog(t, T0, T0 + 0.35)); if (a <= 0) return;
      c.save(); c.globalAlpha = clamp(a * 2) * (1 - out); c.translate((1 - a) * 300 * (col ? 1 : -1), 0);
      rr(c, x, y, 800, 136, 28); c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,0.08)'; c.shadowBlur = 24; c.shadowOffsetY = 8; c.fill(); c.shadowColor = 'transparent';
      txt(c, String(i + 1), x + 40, y + 68, M(800, 28), '#B5B5BE', 'center');
      const ak = pop(prog(t, T0 + 0.05, T0 + 0.4)); c.save(); c.translate(x + 130, y + 68); c.scale(ak, ak); c.beginPath(); c.arc(0, 0, 54, 0, TAU); c.fillStyle = i < 3 ? ['#F5C542', '#C8CCD4', '#D79A62'][i] : '#E6E6EA'; c.fill(); disc(c, k, 0, 0, 48); c.restore();
      { let nm = name; c.font = G(700, 38); while (c.measureText(nm).width > 330) nm = nm.slice(0, -2) + '…'; txt(c, nm, x + 206, y + 50, G(700, 38), INK); } txt(c, cat, x + 206, y + 96, G(500, 30), '#8A8580');
      const v = amt * (1 - Math.pow(1 - prog(t, T0 + 0.1, T0 + 0.9), 3)), s = '$' + v.toFixed(2), f = G(700, 38), w = tw(c, '$' + amt.toFixed(2), f) + 56; rr(c, x + 780 - w, y + 33, w, 70, 35); c.fillStyle = PILL; c.fill(); txt(c, s, x + 780 - w / 2, y + 70, f, INK, 'center');
      c.restore();
    });
    c.restore();
  }

  // ---------- S5 category beat-cuts (11.5–12.75) ----------
  const CUTS = [['DEVELOPMENT', PUR, '#fff'], ['DESIGN', INK, GRN2], ['MARKETING', GRN, '#fff'], ['WRITING', PAPER, PUR], ['CONTENT', PUR, '#fff']];
  function cuts(c, t) {
    if (t < 11.5 || t >= 12.75) return; const i = Math.min(4, Math.floor((t - 11.5) / 0.25)), lt = t - 11.5 - i * 0.25, [s, bg, fg] = CUTS[i];
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const f = D(300); c.font = f; c.letterSpacing = '-8px'; const w = c.measureText(s).width; c.letterSpacing = '0px'; const fit = Math.min(1, 1760 / w), k = crit(prog(lt, 0, 0.12));
    c.save(); c.translate(W / 2, H / 2); c.scale(fit * lerp(1.3, 1, k), fit * lerp(1.3, 1, k)); c.rotate((i % 2 ? 1 : -1) * 0.03 * (1 - k));
    for (let j = -3; j <= 3; j++) { if (!j) continue; c.save(); c.globalAlpha = 0.22 / Math.abs(j); c.strokeStyle = fg; c.lineWidth = 3; c.font = f; c.letterSpacing = '-8px'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.strokeText(s, (i % 2 ? 1 : -1) * lt * 400 * Math.sign(j), j * 250); c.letterSpacing = '0px'; c.restore(); }
    txt(c, s, 0, 0, f, fg, 'center', 'middle', -8); c.restore();
    txt(c, 'BOUNTIES IN', 70, 80, M(800, 30), fg, 'left', 'middle', 6); txt(c, `0${i + 1} / 05`, W - 70, 80, M(800, 30), fg, 'right', 'middle', 4);
    appIcon(c, W - 110, H - 100, 76);
  }

  // ---------- S6 end card (12.75–15) ----------
  function endCard(c, t) {
    if (t < 12.75) return; paper(c, t, 1.2);
    const ik = pop(prog(t, 12.75, 13.1)); c.save(); c.translate(W / 2, 290); c.scale(ik, ik); c.save(); c.shadowColor = rgba(PUR, 0.55); c.shadowBlur = 70; c.shadowOffsetY = 20; rr(c, -100, -100, 200, 200, 46); c.fillStyle = PUR; c.fill(); c.restore(); c.restore();
    glyphBuild(c, W / 2, 294, 200 / 11, t, 12.75, 13.15, '#fff', 9, 500);
    const f = G(700, 170); let x = W / 2 - tw(c, 'gibwork', f, -4) / 2; [...'gibwork'].forEach((ch, i) => { const k = crit(prog(t, 12.95 + i * 0.035, 13.25 + i * 0.035)), w = tw(c, ch, f) - 4; c.save(); c.beginPath(); c.rect(x - 10, 400, w + 30, 210); c.clip(); txt(c, ch, x, 505 + (1 - k) * 200, f, INK, 'left', 'middle'); c.restore(); x += w; });
    const vk = pop(prog(t, 13.3, 13.55)); if (vk > 0) verified(c, x + 46, 470, 32 * vk);
    const tk = A(t, 13.3, 0.35); c.save(); c.globalAlpha = tk; const tag1 = 'Hire the internet', tag2 = ' — or collect the bounty.', tf = G(600, 50), w1 = tw(c, tag1 + tag2, tf); txt(c, tag1, W / 2 - w1 / 2, 640 + (1 - tk) * 20, tf, PUR); txt(c, tag2, W / 2 - w1 / 2 + tw(c, tag1, tf), 640 + (1 - tk) * 20, tf, MUTE); c.restore();
    const a1 = pop(prog(t, 13.55, 13.9)), a2 = pop(prog(t, 13.65, 14.0)); if (a1 > 0) appStore(c, W / 2 - 170, 780, a1); if (a2 > 0) playStore(c, W / 2 + 170, 780, a2);
    const uk = pop(prog(t, 13.85, 14.2)); if (uk > 0) { c.save(); c.translate(W / 2, 925); c.scale(uk, uk); const uf = M(800, 34), w = tw(c, 'gib.work', uf, 3) + 90; rr(c, -w / 2, -38, w, 76, 38); c.fillStyle = INK; c.fill(); c.fillStyle = GRN2; c.beginPath(); c.arc(-w / 2 + 34, 0, 8, 0, TAU); c.fill(); txt(c, 'gib.work', 12, 2, uf, '#fff', 'center', 'middle', 3); c.restore(); }
    [[700, 210, 30, PUR], [1230, 180, 22, '#E84393'], [1300, 400, 16, PUR2], [600, 420, 18, GRN2], [1450, 820, 20, PUR], [470, 760, 16, '#E84393']].forEach(([sx, sy, s, col], i) => { const k = pop(prog(t, 13.1 + i * 0.07, 13.45 + i * 0.07)); if (k > 0) sparkle(c, sx, sy + Math.sin(t * 2 + i) * 8, s * 1.6 * k * (0.8 + 0.2 * Math.sin(t * 5 + i)), col, t + i); });
  }

  // ---------- finishing ----------
  const HITS = [0.75, 1.5, 4.0, 4.5, 5.0, 6.0, 6.5, 7.05, 7.35, 8.05, 8.35, 9.05, 9.5, 11.5, 11.75, 12.0, 12.25, 12.5, 12.75];
  let BUF = null, GRAIN = null;
  function finish(c, t) {
    let h = 0; for (const T0 of HITS) h = Math.max(h, pulse(t, T0, 15));
    if (h > 0.05) { if (!BUF) { BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; } const b = BUF.getContext('2d'); b.clearRect(0, 0, W, H); b.drawImage(cv, 0, 0); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.14 * h; c.drawImage(BUF, -12 * h, 0); c.drawImage(BUF, 12 * h, 0); c.restore(); }
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 12; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const fo = prog(t, 14.6, 15); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  }
  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.filter = 'none'; c.imageSmoothingQuality = 'high';
    let sh = 0; for (const T0 of HITS) sh = Math.max(sh, pulse(t, T0, 18) * 9); c.save(); c.translate((hash(Math.round(t * FPS), 3) - 0.5) * 2 * sh, (hash(Math.round(t * FPS), 4) - 0.5) * 2 * sh);
    intro(c, t); if (t >= 1.5 && t < 4.0) hero(c, t); board(c, t); phone(c, t); earners(c, t); cuts(c, t); endCard(c, t); c.restore(); finish(c, t);
  }
  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(D(100)), document.fonts.load(G(700, 30)), document.fonts.load(G(500, 30)), document.fonts.load(G(800, 30)), document.fonts.load(G(400, 30)), document.fonts.load(G(600, 30)), document.fonts.load(M(800, 20)), ...ASSETS.map((k) => load(k, `../assets/gibwork/${k}.png`))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
