// GENEX (genex.games) — 15s hype trailer, 1920x1080 @ 60fps, cut to 120 BPM. Built from the site screenshots.
// 0–2 the prompt box: "Create a party game for you and 7 friends" → Create · 2–5.5 GAMES: a tilted wall of every card,
// heroes pop on the beat · 5.5–7.5 TOOLS · 7.5–9 ASSETS (rapid fire + Remix) · 9–12.5 the desktop app, your own models,
// self-improving skills · 12.5–15 end card: open-source, Download for macOS / Linux. renderAt(t) is deterministic.
(() => {
  'use strict';
  const K = window.KIT, { TAU, clamp, lerp, prog, io3, io5, crit, pop, A, rgba, rr, hash } = K;
  const V = !!window.VERTICAL;
  const W = V ? 1080 : 1920, H = V ? 1920 : 1080, FPS = 60, DUR = 20, BT = 0.5;
  // time map: 0–9 unchanged; from the desktop app on, every clip is held longer (design → real knots, all on the beat)
  const KN = [[0, 0], [9, 9], [11, 12.5], [12.5, 15.5], [15, 20]];
  const toDesign = (r) => { for (let i = 0; i < KN.length - 1; i++) { const [d0, r0] = KN[i], [d1, r1] = KN[i + 1]; if (r <= r1 || i === KN.length - 2) return d0 + (r - r0) * (d1 - d0) / (r1 - r0); } return r; };
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const BLUE = '#5B6CF0', BLUE2 = '#8A96FF', INK = '#ECEDF3', MUTE = '#8C90A6', BG = '#07080C', CARD = '#14161E', GREEN = '#22C55E';
  const G = (w, s) => `${w} ${s}px Geist, "Inter Tight", sans-serif`, M = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const IMG = {}; const load = (k, s) => { const im = new Image(); im.src = s; return im.decode().then(() => { IMG[k] = im; }); };
  const GAMES = [...Array(8)].map((_, i) => `game${i}`), TOOLS = [...Array(8)].map((_, i) => `tool${i}`), ASSETS = [...Array(8)].map((_, i) => `asset${i}`), ALL = [...GAMES, ...TOOLS, ...ASSETS];
  const ease = (t, a, b, f = io3) => f(prog(t, a, b)), pulse = (t, T, k = 12) => (t >= T ? Math.exp(-(t - T) * k) : 0), oexp = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  function cover(c, k, x, y, w, h, r = 0) { const im = IMG[k]; if (!im) return; const s = Math.max(w / im.width, h / im.height), sw = w / s, sh = h / s; c.save(); if (r) { rr(c, x, y, w, h, r); c.clip(); } c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h); c.restore(); }
  function cursor(c, x, y, press = 0) { c.save(); c.translate(x, y); c.scale(1.8 - press * 0.25, 1.8 - press * 0.25); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.lineTo(6, 16.5); c.lineTo(10, 25); c.lineTo(13.5, 23.5); c.lineTo(9.5, 15); c.lineTo(17, 15); c.closePath(); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1.5; c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 8; c.fill(); c.stroke(); c.restore(); }
  function wordmark(c, x, y, size, k = 1, a = 1) { c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(lerp(1.5, 1, k), lerp(1.5, 1, k)); c.font = G(300, size); c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = `${size * 0.12}px`; c.shadowColor = rgba(BLUE2, 0.6); c.shadowBlur = size * 0.4; c.fillStyle = '#fff'; c.fillText('GENEX', size * 0.06, 0); c.restore(); }
  function slam(c, s, x, y, size, k, col = '#fff') { c.save(); c.font = G(700, size); c.letterSpacing = `${-size * 0.03}px`; const mw = c.measureText(s).width; if (mw > W * 0.92) { size *= W * 0.92 / mw; c.font = G(700, size); } c.textAlign = 'center'; c.textBaseline = 'middle';
    c.globalCompositeOperation = 'lighter'; const o = 14 * (1 - k); c.fillStyle = rgba(BLUE, 0.85); c.fillText(s, x - o, y); c.fillStyle = rgba('#FF4FD8', 0.6); c.fillText(s, x + o, y); c.globalCompositeOperation = 'source-over'; c.fillStyle = col; c.fillText(s, x, y); c.restore(); }
  function btn(c, x, y, s, primary, font = M(600, 30), padX = 34, h = 76) { c.font = font; const w = c.measureText(s).width + padX * 2; rr(c, x - w / 2, y - h / 2, w, h, 12); c.fillStyle = primary ? BLUE : '#1A1C24'; c.fill(); if (!primary) { c.strokeStyle = '#30333F'; c.lineWidth = 2; c.stroke(); } txt(c, s, x, y + 1, font, '#fff', 'center'); return w; }

  // ---------- background: stormy clouds + stars (as on the site) ----------
  let CLOUD = null;
  function cloudTex() { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 260; i++) { const x = hash(i, 1) * 512, y = hash(i, 2) * 512, r = 30 + hash(i, 3) * 110, gr = g.createRadialGradient(x, y, 0, x, y, r); const a = 0.025 + hash(i, 4) * 0.045; gr.addColorStop(0, `rgba(140,150,190,${a})`); gr.addColorStop(1, 'rgba(140,150,190,0)'); g.fillStyle = gr; for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) { g.save(); g.translate(dx, dy); g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); } } return c; }
  function background(c, t, a = 1) {
    c.fillStyle = BG; c.fillRect(0, 0, W, H); if (!CLOUD) CLOUD = cloudTex();
    c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'lighter'; for (const [sc, sp] of [[2.2, 18], [3.4, 9]]) { const p = c.createPattern(CLOUD, 'repeat'); p.setTransform(new DOMMatrix().translate(-t * sp, -t * sp * 0.3).scale(sc)); c.fillStyle = p; c.fillRect(0, 0, W, H); } c.restore();
    for (let i = 0; i < 90; i++) { const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + hash(i, 3) * 2) + i)); c.fillStyle = `rgba(255,255,255,${0.5 * tw * hash(i, 4)})`; c.fillRect(hash(i, 1) * W, hash(i, 2) * H, 2, 2); }
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, Math.max(W, H) * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.75)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
  }

  // ---------- S1 the prompt (0–2) ----------
  const PROMPT = 'Create a party game for you and 7 friends';
  function prompt(c, t) {
    if (t > 2.1) return; const ex = ease(t, 1.75, 2.05, io5); c.save(); c.globalAlpha = 1 - ex; c.translate(W / 2, H / 2); c.scale(1 + ex * 0.6, 1 + ex * 0.6); c.translate(-W / 2, -H / 2);
    const tk = oexp(prog(t, 0.05, 0.5)); c.save(); c.globalAlpha *= tk; c.font = G(500, V ? 58 : 64); c.letterSpacing = '-1.5px'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; const tl = 'Everything you need to ship a game';
    if (V) { c.fillText('Everything you need', W / 2, 560 - (1 - tk) * 30); c.fillText('to ship a game', W / 2, 640 - (1 - tk) * 30); } else c.fillText(tl, W / 2, 300 - (1 - tk) * 30); c.restore();
    const bw = V ? 980 : 1180, bh = 220, bx = W / 2 - bw / 2, by = (V ? 820 : 400), pk = oexp(prog(t, 0.0, 0.45));
    c.save(); c.globalAlpha *= pk; c.translate(0, (1 - pk) * 40); rr(c, bx, by, bw, bh, 34); c.fillStyle = 'rgba(28,30,40,0.82)'; c.fill(); c.strokeStyle = rgba(BLUE2, 0.25 + 0.5 * pulse(t, 1.4, 4)); c.lineWidth = 2; c.stroke();
    const n = Math.floor(clamp(prog(t, 0.3, 1.15)) * PROMPT.length), typed = PROMPT.slice(0, n); txt(c, typed || PROMPT, bx + 44, by + 62, G(400, V ? 32 : 36), typed ? INK : '#5F6377'); if (typed && t < 1.3 && Math.floor(t * 6) % 2) { c.font = G(400, V ? 32 : 36); c.fillStyle = INK; c.fillRect(bx + 48 + c.measureText(typed).width, by + 42, 3, 40); }
    c.beginPath(); c.arc(bx + 76, by + 158, 32, 0, TAU); c.strokeStyle = '#3A3D4C'; c.lineWidth = 2; c.stroke(); txt(c, '+', bx + 76, by + 157, G(300, 40), MUTE, 'center');
    const cx = bx + bw - 120, pr = t > 1.32 && t < 1.45 ? 1 : 0; rr(c, bx + bw - 520, by + 126, 210, 64, 32); c.fillStyle = '#20222C'; c.fill(); txt(c, 'Opus 5.5  ⌄', bx + bw - 415, by + 159, G(500, 28), INK, 'center');
    c.save(); c.translate(cx, by + 158); c.scale(1 - pr * 0.07, 1 - pr * 0.07); rr(c, -95, -32, 190, 64, 32); c.fillStyle = t > 1.38 ? BLUE : '#2A2C37'; c.fill(); txt(c, 'Create', 0, 1, G(600, 28), '#fff', 'center'); c.restore();
    if (t < 1.6) { const k = io5(prog(t, 0.95, 1.32)); cursor(c, lerp(cx + 260, cx + 10, k), lerp(by + 420, by + 170, k), pr); }
    // shockwave from Create
    if (t > 1.38) { const d = t - 1.38; c.save(); c.globalCompositeOperation = 'lighter'; for (let r = 0; r < 3; r++) { const rad = (d - r * 0.06) * 2400; if (rad <= 0) continue; c.strokeStyle = rgba(BLUE2, Math.max(0, 0.7 - d * 1.2)); c.lineWidth = 6; c.beginPath(); c.arc(cx, by + 158, rad, 0, TAU); c.stroke(); } c.restore(); }
    c.restore(); c.restore();
  }

  // ---------- S2–S4 the library wall (2–9) ----------
  const HEROES = [
    [2.5, 'game0', 'Opus 5.5 NBA 2K', '@Simeon M', '4.9k'], [3.0, 'game1', 'Lost Cathedral', '@Simeon M', '2.2k'], [3.5, 'game2', 'Stick & Steel', '@Simeon M', '2.1k'], [4.0, 'game3', 'Skate Dog', '@Threejs Community', '217'],
    [4.5, 'game4', null, null, '5k'], [4.75, 'game6', null, null, '1.7k'], [5.0, 'game5', null, null, '250'],
    [6.0, 'tool6', 'Elemental Sandbox', '@Threejs Community', '1.9k'], [6.5, 'tool2', 'Demiurge — Procedural', '@Threejs Community', '73'], [7.0, 'tool5', 'Poseidon — Real-time', '@Threejs Community', '101'],
    ...['Mechanical Typewriter', 'Oak Refectory Table', 'Oak Church Pew', 'Loaded Bookshelf', 'Loaded Server Rack', 'Iron Portcullis', 'Grandfather Clock', 'Bentwood Cafe Chair'].map((n, i) => [8.0 + i * 0.125, `asset${i}`, n, '@Threejs Community', ['30', '30', '34', '29', '31', '29', '30', '36'][i]]),
  ];
  const SECTIONS = [[2.0, 5.5, 'GAMES', 43, GAMES], [5.5, 7.5, 'TOOLS', 16, TOOLS], [7.5, 9.0, 'ASSETS', 44, ASSETS]];
  function wall(c, t) {
    if (t < 1.95 || t > 9.05) return; background(c, t, 0.8);
    const sec = SECTIONS.find(([a, b]) => t >= a && t < b) || SECTIONS[2], [s0, , label, count, list] = sec;
    const CW = 460, CH = 256, PX = 500, PY = 300;
    c.save(); c.translate(W / 2, H / 2); c.transform(1, -0.12, 0.3, 1, 0, 0); c.rotate(-0.08); const z = (V ? 0.95 : 0.8) + 0.08 * Math.sin(t * 0.7); c.scale(z, z); c.translate(-((t - 2) * 260) % PX, 0);
    for (let r = -4; r <= 4; r++) for (let col = -4; col <= 5; col++) { const key = ALL[(((col * 3 + r * 5 + 100) % 24) + 24) % 24], inSec = list.includes(key), ap = oexp(prog(t, s0 + hash(col, r) * 0.35, s0 + 0.35 + hash(col, r) * 0.35));
      c.save(); c.translate(col * PX, r * PY + ((col % 2) ? PY / 2 : 0)); c.globalAlpha = (inSec ? 1 : 0.25) * (t < 2.4 ? ap : 1); rr(c, -CW / 2 - 4, -CH / 2 - 4, CW + 8, CH + 8, 18); c.fillStyle = CARD; c.fill(); cover(c, key, -CW / 2, -CH / 2, CW, CH, 14); c.restore(); }
    c.restore();
    c.fillStyle = 'rgba(7,8,12,0.35)'; c.fillRect(0, 0, W, H);
    // section label slam + counter
    const lk = crit(prog(t, s0, s0 + 0.18)); if (t - s0 < 0.5) { c.save(); c.globalAlpha = 1 - prog(t, s0 + 0.38, s0 + 0.5); slam(c, label, W / 2, H / 2, lerp(380, 300, lk), lk); c.restore(); }
    // section pill: centered and large, label + live count
    c.save(); c.globalAlpha = A(t, s0 + 0.3, 0.3); const cnt = Math.round(lerp(0, count, ease(t, s0 + 0.3, s0 + 0.9))), nm = label[0] + label.slice(1).toLowerCase(), lf = G(600, V ? 116 : 64), bw = V ? 200 : 120, bh = V ? 104 : 64, gap = V ? 44 : 30;
    const lw = (c.font = lf, c.measureText(nm).width), PW = lw + gap + bw + (V ? 120 : 100), PH = V ? 210 : 124, px = W / 2 - PW / 2, py = V ? 270 : 46, cy = py + PH / 2;
    rr(c, px, py, PW, PH, PH / 2); c.fillStyle = 'rgba(14,15,22,0.88)'; c.fill(); c.strokeStyle = '#2C2F3C'; c.lineWidth = 3; c.stroke();
    const x0 = W / 2 - (lw + gap + bw) / 2; txt(c, nm, x0, cy + 2, lf, INK); rr(c, x0 + lw + gap, cy - bh / 2, bw, bh, bh / 2); c.fillStyle = '#262938'; c.fill(); txt(c, String(cnt), x0 + lw + gap + bw / 2, cy + 2, M(600, V ? 58 : 36), MUTE, 'center'); c.restore();
    // hero card
    const hi = HEROES.filter(([t0]) => t >= t0).pop(); if (!hi) return; const [t0, key, name, by, plays] = hi, next = HEROES.find(([tt]) => tt > t0), dur = Math.min(0.5, (next ? next[0] : t0 + 0.5) - t0);
    if (t > t0 + dur + 0.01 || t < s0 + 0.45) return; const k = io5(prog(t, t0, t0 + Math.min(0.16, dur * 0.5))), hw = V ? 940 : 1120, hh = hw * 0.556, x = W / 2, y = H / 2 - (V ? 40 : 30);
    c.save(); c.translate(x, y); c.scale(lerp(0.6, 1, k) * (1 + (t - t0) * 0.06), lerp(0.6, 1, k) * (1 + (t - t0) * 0.06)); c.rotate((1 - k) * (hash(t0 * 10 | 0, 1) - 0.5) * 0.3);
    c.shadowColor = rgba(BLUE, 0.7); c.shadowBlur = 80; rr(c, -hw / 2 - 8, -hh / 2 - 8, hw + 16, hh + 16, 24); c.fillStyle = CARD; c.fill(); c.shadowBlur = 0; cover(c, key, -hw / 2, -hh / 2, hw, hh, 18);
    rr(c, -hw / 2, -hh / 2, hw, hh, 18); c.strokeStyle = rgba(BLUE2, 0.8); c.lineWidth = 3; c.stroke();
    if (name) { txt(c, name, -hw / 2, hh / 2 + 52, G(600, V ? 46 : 52), '#fff'); txt(c, 'By ', -hw / 2, hh / 2 + 104, M(500, 26), MUTE); c.font = M(500, 26); txt(c, by, -hw / 2 + c.measureText('By ').width, hh / 2 + 104, M(500, 26), BLUE2); }
    void plays;
    if (name && key.startsWith('tool') || key === 'asset7') { const rk = key === 'asset7' ? pop(prog(t, t0 + 0.02, t0 + 0.2)) : 1; c.save(); c.translate(hw / 2 - 90, hh / 2 + 70); c.scale(rk, rk); rr(c, -90, -32, 180, 64, 14); c.fillStyle = '#1A1C24'; c.fill(); c.strokeStyle = '#30333F'; c.lineWidth = 2; c.stroke(); txt(c, '⟳ Remix', 0, 1, M(600, 26), INK, 'center'); c.restore(); }
    c.restore();
  }

  // ---------- S5 the desktop app (9–12.5) ----------
  function desktop(c, t) {
    if (t < 8.95 || t > 12.55) return; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { const z = ((hash(i, 5) - (t - 9) * 0.25) % 1 + 1) % 1, x = W / 2 + (hash(i, 1) - 0.5) * W * 1.6 / (z + 0.2), y = H / 2 + (hash(i, 2) - 0.5) * H * 1.6 / (z + 0.2); c.fillStyle = `rgba(200,210,255,${0.6 * (1 - z)})`; c.fillRect(x, y, 2.5 * (1 - z) + 0.8, 2.5 * (1 - z) + 0.8); }
    const gl = c.createRadialGradient(W / 2, H * 0.32, 0, W / 2, H * 0.32, W * 0.6); gl.addColorStop(0, rgba(BLUE, 0.25)); gl.addColorStop(1, rgba(BLUE, 0)); c.fillStyle = gl; c.fillRect(0, 0, W, H);
    const part2 = t >= 11.0;
    if (!part2) {
      const k1 = crit(prog(t, 9.0, 9.2)), k2 = crit(prog(t, 9.15, 9.35)), hy = V ? 330 : 150;
      c.save(); c.font = G(500, V ? 96 : 110); c.letterSpacing = '-3px'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.globalAlpha = k1; c.fillText(V ? 'Desktop app' : 'Desktop app built', W / 2, hy); c.globalAlpha = k2; c.fillText(V ? 'built for game dev' : 'for game dev with AI', W / 2, hy + (V ? 110 : 120)); if (V) { c.globalAlpha = crit(prog(t, 9.3, 9.5)); c.fillText('with AI', W / 2, hy + 220); } c.restore();
      const ak = io5(prog(t, 9.3, 9.9)), aw = V ? 1040 : 1500, ah = V ? aw * 0.82 : aw * 337 / 1046, ax = W / 2 - aw / 2, ay = (V ? 760 : 380) + (1 - ak) * 300;
      c.save(); c.globalAlpha = ak; c.translate(W / 2, ay + ah / 2); const zk = ease(t, 10.1, 10.95, io3); c.scale(1 + zk * 0.55, 1 + zk * 0.55); c.translate(-W / 2 + zk * aw * 0.12, -(ay + ah / 2) - zk * ah * 0.02);
      c.shadowColor = rgba(BLUE, 0.6); c.shadowBlur = 90; rr(c, ax, ay, aw, ah, 24); c.fillStyle = '#000'; c.fill(); c.shadowBlur = 0; cover(c, 'app', ax, ay, aw, ah, 24); c.restore();
      [[9.9, 'Workers build in parallel'], [10.3, 'Reviewers play every part'], [10.65, 'Changes are live · 7 min']].forEach(([t0, s], i) => { const k = pop(prog(t, t0, t0 + 0.35)); if (k <= 0 || t > 10.98) return; c.save(); c.translate(V ? W / 2 : 330 + i * 630, V ? 1460 + i * 100 : 990); c.scale(k, k); c.font = M(600, 28); const w = c.measureText(s).width + 70; rr(c, -w / 2, -34, w, 68, 34); c.fillStyle = 'rgba(20,22,32,0.92)'; c.fill(); c.strokeStyle = rgba(BLUE2, 0.6); c.lineWidth = 2; c.stroke(); c.fillStyle = GREEN; c.beginPath(); c.arc(-w / 2 + 30, 0, 7, 0, TAU); c.fill(); txt(c, s, -w / 2 + 48, 1, M(600, 28), INK); c.restore(); });
    } else {
      const ek = ease(t, 12.25, 12.5, io5); c.save(); c.globalAlpha = 1 - ek;
      const cards = [['Use your own subscription', 'or local AI models', 'Your Claude or ChatGPT plan, or a free model on your Mac', 'modelicons'], ['Self-improving', 'harness and skills', 'Learns from every build and improves its own skills', 'skill']];
      cards.forEach(([a, b, d, img], i) => { const k = io5(prog(t, 11.0 + i * 0.25, 11.45 + i * 0.25)); const cw = V ? 960 : 840, chh = V ? 760 : 760, cx = V ? W / 2 - cw / 2 : 100 + i * 880, cy = V ? 140 + i * 860 : 160; c.save(); c.globalAlpha *= k; c.translate(0, (1 - k) * 120);
        rr(c, cx, cy, cw, chh, 30); c.fillStyle = '#05060A'; c.fill(); c.strokeStyle = '#23263A'; c.lineWidth = 2; c.stroke(); txt(c, a, cx + 50, cy + 80, G(500, 50), '#fff'); txt(c, b, cx + 50, cy + 140, G(500, 50), '#fff'); txt(c, d, cx + 50, cy + 205, G(400, 26), MUTE);
        const im = IMG[img]; if (im) { const iw = cw - 100, ih = iw * im.height / im.width, iy = cy + 250; c.save(); rr(c, cx + 50, iy, iw, Math.min(ih, chh - 290), 16); c.clip(); c.drawImage(im, cx + 50, iy, iw, ih); c.restore(); }
        if (i === 0) [0, 1, 2].forEach((j) => { const pk = pulse(t, 11.55 + j * 0.15, 5); if (pk > 0.02) { const im2 = IMG[img], iw = cw - 100, sx = cx + 50 + iw * (0.17 + j * 0.33), sy = cy + 250 + iw * (im2 ? im2.height / im2.width : 0.47) * 0.85; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(GREEN, pk); c.lineWidth = 4; c.beginPath(); c.arc(sx, sy, 40 + (1 - pk) * 60, 0, TAU); c.stroke(); c.restore(); } });
        if (i === 1) { const ln = Math.floor(clamp(prog(t, 11.6, 12.2)) * 4); const im3 = IMG[img], iw = cw - 100, ih = iw * (im3 ? im3.height / im3.width : 0.58); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(BLUE, 0.22); rr(c, cx + 50 + iw * 0.02, cy + 250 + ih * (0.39 + ln * 0.105), iw * 0.78, ih * 0.1, 6); c.fill(); c.restore(); }
        c.restore(); });
      c.restore();
    }
  }

  // ---------- S6 end card (12.5–15) ----------
  function endCard(c, t) {
    if (t < 12.45) return; background(c, t, 1); const k = crit(prog(t, 12.5, 12.8)), cy = H / 2 - (V ? 200 : 150);
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(W / 2, cy, 0, W / 2, cy, W * 0.5); g.addColorStop(0, rgba(BLUE, 0.35 * k)); g.addColorStop(1, rgba(BLUE, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    const pk = A(t, 12.5, 0.3); c.save(); c.globalAlpha = pk; c.font = M(700, 26); const pw = c.measureText('Open-source  ·  MIT License').width + 60; rr(c, W / 2 - pw / 2, cy - (V ? 190 : 170), pw, 56, 28); c.fillStyle = '#0B0F2A'; c.fill(); c.strokeStyle = rgba(BLUE2, 0.6); c.lineWidth = 2; c.stroke(); txt(c, 'Open-source  ·  MIT License', W / 2, cy - (V ? 161 : 141), M(700, 26), '#fff', 'center'); c.restore();
    wordmark(c, W / 2, cy, V ? 150 : 200, k);
    const sk = A(t, 12.75, 0.35); c.save(); c.globalAlpha = sk; c.font = G(500, V ? 46 : 50); c.letterSpacing = '-1px'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText('Everything you need to ship a game', W / 2, cy + (V ? 150 : 150)); c.restore();
    const bk1 = pop(prog(t, 13.05, 13.45)), bk2 = pop(prog(t, 13.15, 13.55)), by = cy + (V ? 300 : 300), pr = t > 13.85 && t < 14.0 ? 1 : 0;
    if (bk1 > 0) { c.save(); c.translate(V ? W / 2 : W / 2 - 230, by); c.scale(bk1 * (1 - pr * 0.06) * (V ? 1.3 : 1), bk1 * (1 - pr * 0.06) * (V ? 1.3 : 1)); c.shadowColor = rgba(BLUE, 0.6); c.shadowBlur = 40; btn(c, 0, 0, ' Download for macOS', true); c.restore(); }
    if (bk2 > 0) { c.save(); c.translate(V ? W / 2 : W / 2 + 250, V ? by + 130 : by); c.scale(bk2 * (V ? 1.3 : 1), bk2 * (V ? 1.3 : 1)); btn(c, 0, 0, '🐧 Download for Linux', false); c.restore(); }
    if (bk2 > 0) { c.save(); c.globalAlpha = bk2; const yA = by + (V ? 260 : 100), yB = by + (V ? 370 : 182);
      // soft dark floor so the chips sit on calmer ground
      const fl = c.createLinearGradient(0, yA - 120, 0, H); fl.addColorStop(0, 'rgba(7,8,12,0)'); fl.addColorStop(0.45, 'rgba(7,8,12,0.55)'); fl.addColorStop(1, 'rgba(7,8,12,0.85)'); c.fillStyle = fl; c.fillRect(0, yA - 120, W, H - yA + 120);
      // "Coming soon to Windows" — frosted glass chip with the Windows mark
      c.font = M(500, 24); const wt = 'Coming soon to Windows', ww = c.measureText(wt).width + 92; rr(c, W / 2 - ww / 2, yA - 26, ww, 52, 26); c.fillStyle = 'rgba(14,16,26,0.78)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.10)'; c.lineWidth = 1.5; c.stroke();
      const ix = W / 2 - ww / 2 + 30, iy = yA - 9; c.fillStyle = '#4FA3F7'; [[0, 0], [10, 0], [0, 10], [10, 10]].forEach(([dx, dy]) => c.fillRect(ix + dx, iy + dy, 8.5, 8.5));
      txt(c, wt, ix + 30, yA + 1, M(500, 24), '#B9BED3');
      // genex.games — glowing URL pill in the brand blue
      c.font = M(700, 32); c.letterSpacing = '2px'; const gw = c.measureText('genex.games').width + 96; c.letterSpacing = '0px'; const gp = 0.6 + 0.4 * Math.sin(t * 3);
      c.save(); c.shadowColor = rgba(BLUE, 0.55 + 0.25 * gp); c.shadowBlur = 34; rr(c, W / 2 - gw / 2, yB - 34, gw, 68, 34); c.fillStyle = '#0B0F2A'; c.fill(); c.restore();
      rr(c, W / 2 - gw / 2, yB - 34, gw, 68, 34); c.strokeStyle = rgba(BLUE2, 0.75); c.lineWidth = 2; c.stroke();
      c.fillStyle = BLUE2; c.beginPath(); c.arc(W / 2 - gw / 2 + 30, yB, 6, 0, TAU); c.fill();
      txt(c, 'genex.games', W / 2 + 10, yB + 1, M(700, 32), '#FFFFFF', 'center', 'middle', 2); c.restore(); }
    if (t > 13.3 && t < 14.4) { const ck = io5(prog(t, 13.4, 13.85)); cursor(c, lerp(W / 2 + 420, (V ? W / 2 : W / 2 - 230) + 40, ck), lerp(H - 60, by + 14, ck), pr); }
    if (t > 13.95) { const d = t - 13.95; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(BLUE2, Math.max(0, 0.8 - d)); c.lineWidth = 5; c.beginPath(); c.arc(V ? W / 2 : W / 2 - 230, by, d * 1600, 0, TAU); c.stroke(); c.restore(); }
  }

  // ---------- finishing ----------
  const HITS = [1.38, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 9.0, 11.0, 12.5, 13.95];
  let BUF = null;
  function finish(c, t) {
    let h = 0; for (const T0 of HITS) h = Math.max(h, pulse(t, T0, 14));
    if (h > 0.05) { if (!BUF) { BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; } const b = BUF.getContext('2d'); b.clearRect(0, 0, W, H); b.drawImage(cv, 0, 0); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.2 * h; c.drawImage(BUF, -16 * h, 0); c.drawImage(BUF, 16 * h, 0); c.restore(); c.fillStyle = `rgba(190,200,255,${0.16 * h})`; c.fillRect(0, 0, W, H); }
    c.fillStyle = 'rgba(0,0,0,0.08)'; for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
    const fi = 1 - prog(t, 0, 0.25), fo = prog(t, 14.6, 15); if (fi > 0 || fo > 0) { c.fillStyle = `rgba(0,0,0,${Math.max(fi, fo)})`; c.fillRect(0, 0, W, H); }
  }
  function renderAt(tReal) {
    const t = toDesign(tReal), c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.filter = 'none'; c.imageSmoothingQuality = 'high';
    let sh = 0; for (const T0 of HITS) sh = Math.max(sh, pulse(t, T0, 18) * 14); c.save(); c.translate((hash(Math.round(t * FPS), 3) - 0.5) * 2 * sh, (hash(Math.round(t * FPS), 4) - 0.5) * 2 * sh);
    if (t < 2.0) { background(c, t, 1); prompt(c, t); }
    wall(c, t); desktop(c, t); endCard(c, t); c.restore(); finish(c, t);
  }
  window.FILM = { W, H, FPS, DUR, renderAt };
  window.FILM.ready = Promise.all([document.fonts.load(G(300, 100)), document.fonts.load(G(500, 40)), document.fonts.load(G(700, 40)), document.fonts.load(M(600, 20)), document.fonts.load(M(700, 20)), ...ALL.map((k) => load(k, `../assets/genex/${k}_hd.png`)), ...['app', 'modelicons', 'skill'].map((k) => load(k, `../assets/genex/${k}_hd.png`))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
