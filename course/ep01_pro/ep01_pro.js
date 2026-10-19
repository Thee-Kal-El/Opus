// BLOCKCHAIN 101 · EP01 — PRO EDITION. 180s, 1920×1080 @ 60fps on the 120 BPM score grid (bar = 2s).
// A single persistent Three.js world (three_world.js) is the stage for the whole film; the camera travels through it while a restrained
// editorial layer (Inter Tight + mono labels, hairline rules, numbered bullets, data pins tracked to 3D objects) carries the copy.
// 0 boot · 6 title · 12 what is a blockchain · 30 key sectors · 78 history (camera flies down the chain) · 122 power · 146 careers · 168 outro.
// Presenter lane: ?lane=right (default) | left | none — copy stays in the content column; the 3D focus is shifted into it too.
(() => {
  'use strict';
  const W = 1920, H = 1080, FPS = 60, DUR = 180, TAU = Math.PI * 2;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const BG = '#05070A', TX = '#E8EEF5', TX2 = '#8A96A8', TX3 = '#4A5566', ACC = '#5CE1E6', AMB = '#F5B544', RED = '#FF4D5E';
  const F = (w, s) => `${w} ${s}px "Inter Tight", Geist, sans-serif`, MONO = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k, prog = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2), out5 = (p) => 1 - Math.pow(1 - p, 5), out3 = (p) => 1 - Math.pow(1 - p, 3);
  const hash = (a, b = 0, c = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const V3 = { add: (a, b) => a.map((x, i) => x + b[i]), sub: (a, b) => a.map((x, i) => x - b[i]), mul: (a, k) => a.map((x) => x * k), lerp: (a, b, k) => a.map((x, i) => x + (b[i] - x) * k), norm: (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); }, cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]] };
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  const tw = (c, s, font, ls = 0) => { c.font = font; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.letterSpacing = '0px'; return w; };
  function wrap(c, s, font, maxW) { c.font = font; const out = []; let line = ''; for (const w of s.split(' ')) { const tst = line ? line + ' ' + w : w; if (c.measureText(tst).width > maxW && line) { out.push(line); line = w; } else line = tst; } if (line) out.push(line); return out; }
  const fit = (c, s, w, size, maxW, ls = 0) => Math.min(size, size * maxW / Math.max(1, tw(c, s, F(w, size), ls)));

  // ---------- layout / lane ----------
  const LANE = (location.search.match(/lane=(\w+)/) || [])[1] || 'right';
  const [CA0, CA1] = LANE === 'left' ? [740, 1840] : LANE === 'none' ? [360, 1560] : [80, 1180], CX = (CA0 + CA1) / 2, CW = CA1 - CA0;
  const OFFX = W / 2 - CX; // shifts the 3D focus into the content column
  const PY0 = 640, PY1 = 948; // standard info panel band

  // ---------- typographic primitives ----------
  // masked line reveal: text rises into a clip box
  function reveal(c, s, x, y, font, col, t, T, align = 'left', ls = 0, dur = 0.7) { if (t < T) return; const k = out5(prog(t, T, T + dur)); c.save(); c.font = font; const m = c.measureText('Hg'), hgt = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * 1.35; c.beginPath(); c.rect(0, y - hgt * 0.62, W, hgt * 1.15); c.clip(); c.globalAlpha *= k; txt(c, s, x, y + (1 - k) * hgt * 0.9, font, col, align, 'middle', ls); c.restore(); }
  function rule(c, x, y, w, t, T, col = 'rgba(232,238,245,0.18)', dur = 0.9) { if (t < T) return; const k = ease(prog(t, T, T + dur)); c.fillStyle = col; c.fillRect(x, y, w * k, 1); }
  function ticks(c, x, y, w, h, col = ACC, L = 14, a = 1) { c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = 2; [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, dx, dy]) => { c.beginPath(); c.moveTo(px + dx * L, py); c.lineTo(px, py); c.lineTo(px, py + dy * L); c.stroke(); }); c.restore(); }
  function panel(c, x, y, w, h, t, T, col = ACC) { if (t < T) return; const k = out3(prog(t, T, T + 0.6)); c.save(); c.globalAlpha *= k; c.fillStyle = 'rgba(8,11,16,0.78)'; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(232,238,245,0.09)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); ticks(c, x, y, w, h, col, 14, 1); c.restore(); }
  // numbered bullet: index in mono accent, text body, hairline under
  function item(c, t, T, n, s, x, y, maxW, size = 31, col = ACC) { if (t < T) return 0; const lines = wrap(c, s, F(500, size), maxW - 90); txt(c, String(n).padStart(2, '0'), x, y, MONO(600, 18), rgba(col, out3(prog(t, T, T + 0.4))), 'left', 'middle', 2);
    lines.forEach((ln, i) => reveal(c, ln, x + 64, y + i * size * 1.28, F(500, size), TX, t, T + i * 0.08)); return lines.length; }
  // section kicker docked top-left of the content column
  function kicker(c, t, T, num, title) { const k = out3(prog(t, T + 1.6, T + 2.3)); if (k <= 0) return; c.save(); c.globalAlpha = k; txt(c, num, CA0, 150, MONO(600, 18), ACC, 'left', 'middle', 4); txt(c, title.toUpperCase(), CA0 + 56, 150, MONO(600, 18), TX, 'left', 'middle', 4); c.fillStyle = 'rgba(232,238,245,0.16)'; c.fillRect(CA0, 172, CW * ease(k), 1); c.restore(); }
  // section opener: centred in the content column, then fades as the kicker docks
  function opener(c, t, T, num, title, sub) { if (t < T || t > T + 2.6) return; const o = 1 - out3(prog(t, T + 1.9, T + 2.5)); c.save(); c.globalAlpha = o;
    c.fillStyle = `rgba(5,7,10,${0.35 * o})`; c.fillRect(0, 0, W, H);
    reveal(c, `CHAPTER ${num}`, CX, H / 2 - 110, MONO(600, 20), ACC, t, T + 0.05, 'center', 8);
    const fs = fit(c, title, 600, 104, CW - 60, -1); reveal(c, title, CX, H / 2 - 20, F(600, fs), TX, t, T + 0.15, 'center', -1, 0.9);
    rule(c, CX - Math.min(420, CW / 2 - 40), H / 2 + 52, Math.min(840, CW - 80), t, T + 0.3, rgba(ACC, 0.7), 1.0);
    if (sub) reveal(c, sub, CX, H / 2 + 100, F(400, 30), TX2, t, T + 0.5, 'center', 0);
    c.restore(); }
  // data pin: ring on a projected 3D point + leader + mono label (only inside the content column)
  function pin(c, p, label, sub, t, T, side = 1, col = ACC, a = 1) { if (!p || !p[2] || t < T) return; const [x, y] = p; if (x < CA0 - 20 || x > CA1 + 20 || y < 120 || y > H - 120) return; const k = out3(prog(t, T, T + 0.6)); c.save(); c.globalAlpha *= k * a;
    c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 9 + 3 * Math.sin(t * 3), 0, TAU); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(x, y, 2.5, 0, TAU); c.fill();
    const lx = x + side * 60, ly = y - 46, ex = lx + side * 30 * k; c.beginPath(); c.moveTo(x + side * 7, y - 7); c.lineTo(lx, ly); c.lineTo(ex, ly); c.stroke();
    txt(c, label, ex + side * 10, ly - 1, MONO(600, 16), TX, side > 0 ? 'left' : 'right', 'middle', 2); if (sub) txt(c, sub, ex + side * 10, ly + 20, MONO(500, 13), TX2, side > 0 ? 'left' : 'right', 'middle', 1); c.restore(); }

  // ---------- camera choreography ----------
  const W3 = () => window.WORLD;
  const wide = (t, r = 150, h = 52, a0 = 0.6) => { const a = a0 + t * 0.035; return { pos: [Math.cos(a) * r, h, Math.sin(a) * r], look: [0, -4, 0] }; };
  function spineShot(i, t, side = 1, dist = 13) { const p = W3().spinePoint(i), tg = W3().spineTangent(i), sd = V3.norm(V3.cross(tg, [0, 1, 0])); const drift = Math.sin(t * 0.3) * 1.2; return { pos: V3.add(V3.add(V3.add(p, V3.mul(sd, side * dist)), [0, 3.5 + drift * 0.3, 0]), V3.mul(tg, -3.5 + drift)), look: V3.add(p, [0, -1.2, 0]) }; }
  function districtShot(d, t) { const c = W3().districtPoint(d), out = V3.norm([c[0], 0, c[2]]), side = V3.cross(out, [0, 1, 0]), s = Math.sin(t * 0.25) * 5; return { pos: V3.add(V3.add(c, V3.add(V3.mul(out, 34), V3.mul(side, 10 + s))), [0, 13, 0]), look: V3.add(c, [0, -2, 0]) }; }
  const mix = (a, b, k) => ({ pos: V3.lerp(a.pos, b.pos, k), look: V3.lerp(a.look, b.look, k) });
  // sector / history indices
  const FS = 30, F0 = 36, FD = 42 / 8, HSt = 78, H0 = 80, HD = 42 / 9, HSPINE = [2, 5, 7, 10, 12, 15, 18, 21, 24];
  function camAt(t) {
    if (t < 12) { const k = ease(prog(t, 3.5, 12)); return mix({ pos: [0, 14, 230], look: [0, 0, 0] }, wide(t, 150, 46, 1.2), k); }
    if (t < 30) { const s = spineShot(12, t, 1, 15); return t < 14.5 ? mix(wide(t, 150, 46, 1.2), s, ease(prog(t, 12, 14.5))) : s; }
    if (t < F0) { const w = wide(t, 118, 48, 0.9); return t < FS + 2.5 ? mix(spineShot(12, t, 1, 15), w, ease(prog(t, FS, FS + 2.5))) : w; }
    if (t < HSt) { const i = clamp(Math.floor((t - F0) / FD), 0, 7), T0 = F0 + i * FD, prev = i === 0 ? wide(t, 118, 48, 0.9) : districtShot(i - 1, t); return mix(prev, districtShot(i, t), ease(prog(t, T0, T0 + 1.6))); }
    if (t < 122) { if (t < H0) return mix(districtShot(7, t), spineShot(HSPINE[0], t, -1, 16), ease(prog(t, HSt, H0 + 0.6))); const i = clamp(Math.floor((t - H0) / HD), 0, 8), T0 = H0 + i * HD, prev = spineShot(HSPINE[Math.max(0, i - 1)], t, -1, 16); return mix(prev, spineShot(HSPINE[i], t, -1, 16), ease(prog(t, T0, T0 + 1.5))); }
    if (t < 146) { const w = wide(t, 112, 52, 2.2); return t < 124.5 ? mix(spineShot(HSPINE[8], t, -1, 16), w, ease(prog(t, 122, 124.5))) : w; }
    if (t < 168) { const a = 0.4 + t * 0.05, low = { pos: [Math.cos(a) * 112, -6 + Math.sin(t * 0.2) * 3, Math.sin(a) * 112], look: [0, 4, 0] }; return t < 148.5 ? mix(wide(t, 112, 52, 2.2), low, ease(prog(t, 146, 148.5))) : low; }
    { const end = wide(t, 190, 80, 1.5); return mix({ pos: [Math.cos(0.4 + 168 * 0.05) * 112, -6, Math.sin(0.4 + 168 * 0.05) * 112], look: [0, 4, 0] }, end, ease(prog(t, 168, 175))); }
  }
  function worldState(t) {
    const st = { cam: camAt(t), offX: OFFX, dim: 0 };
    if (t >= 21.2 && t < 24.2) st.spineBad = 13; else if (t >= 12 && t < 30) st.spineHi = 12;
    if (t >= F0 && t < HSt) st.focusDistrict = clamp(Math.floor((t - F0) / FD), 0, 7);
    if (t >= H0 && t < 122) st.spineHi = HSPINE[clamp(Math.floor((t - H0) / HD), 0, 8)];
    if (t >= 124 && t < 134) st.central = t < 129.6 ? ease(prog(t, 124.3, 127.5)) : 1 - ease(prog(t, 129.6, 132.2));
    if (t >= 146 && t < 168.5) st.towers = prog(t, 148.2, 153.5);
    if (t >= 134 && t < 146) st.dim = 0.35 * ease(prog(t, 134, 135));
    return st;
  }

  // ---------- HUD (quiet) ----------
  const SECTIONS = [[0, '00', 'BOOT'], [6, '00', 'INTRO'], [12, '01', 'WHAT IS A BLOCKCHAIN'], [30, '02', 'KEY SECTORS'], [78, '03', 'HISTORY'], [122, '04', 'POWER TO THE PEOPLE'], [146, '05', 'THE OPPORTUNITY'], [168, '06', 'OUTRO']];
  const CUTS = SECTIONS.slice(2).map((s) => s[0]);
  function hud(c, t) { const a = clamp((t - 5.5) * 1.5) * (1 - prog(t, 178.5, 180)); if (a <= 0) return; c.save(); c.globalAlpha = a;
    const m = 40; ticks(c, m, m, W - 2 * m, H - 2 * m, 'rgba(232,238,245,0.35)', 18);
    txt(c, 'BLOCKCHAIN 101', 72, 74, MONO(600, 15), TX, 'left', 'middle', 4); txt(c, 'EPISODE 01', 72 + tw(c, 'BLOCKCHAIN 101', MONO(600, 15), 4) + 20, 74, MONO(500, 15), TX3, 'left', 'middle', 4);
    const sec = SECTIONS.filter((s) => t >= s[0]).pop(); if (sec[1] !== '00') { txt(c, `${sec[1]} / 05`, W - 72, 74, MONO(600, 15), ACC, 'right', 'middle', 3); txt(c, sec[2], W - 72 - tw(c, `${sec[1]} / 05`, MONO(600, 15), 3) - 20, 74, MONO(500, 15), TX2, 'right', 'middle', 3); }
    const mm = Math.floor(t / 60), ss = Math.floor(t % 60), ff = Math.floor((t % 1) * 60); txt(c, `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`, 72, H - 74, MONO(500, 14), TX3, 'left', 'middle', 2);
    txt(c, '@THEE_KAL_EL', W - 72, H - 74, MONO(500, 14), TX3, 'right', 'middle', 3);
    const px = 220, pw = W - 440, py = H - 75; c.fillStyle = 'rgba(232,238,245,0.12)'; c.fillRect(px, py, pw, 1); c.fillStyle = ACC; c.fillRect(px, py - 0.5, pw * t / DUR, 2); CUTS.forEach((T) => { c.fillStyle = t >= T ? TX : TX3; c.fillRect(px + pw * T / DUR, py - 4, 1, 9); });
    c.restore(); }

  // ---------- scenes ----------
  const BOOT = [['INITIALIZING NODE', 0.5], ['CONNECTING TO PEERS', 1.2], ['SYNCING LEDGER', 1.9], ['VERIFYING CHAIN INTEGRITY', 2.6], ['TRUSTED THIRD PARTY', 3.3]];
  function boot(c, t) { if (t >= 6.5) return; const a = 1 - out3(prog(t, 5.2, 6.4)); c.save(); c.globalAlpha = a; c.fillStyle = `rgba(5,7,10,${clamp(1.15 - t / 6)})`; c.fillRect(0, 0, W, H);
    const x0 = CX - 300, y0 = H / 2 - 120;
    BOOT.forEach(([s, T], i) => { if (t < T) return; const y = y0 + i * 48, done = t > T + 0.55, last = i === BOOT.length - 1; txt(c, s, x0, y, MONO(500, 18), TX2, 'left', 'middle', 3);
      const dots = Math.floor(clamp((t - T) / 0.5) * 18); txt(c, '·'.repeat(dots), x0 + 380, y, MONO(500, 18), TX3, 'left', 'middle', 2);
      if (done) txt(c, last ? 'NOT REQUIRED' : 'OK', x0 + 600, y, MONO(600, 18), last ? AMB : ACC, 'right', 'middle', 3); });
    const pk = prog(t, 0.4, 4.2); c.fillStyle = 'rgba(232,238,245,0.12)'; c.fillRect(x0, y0 + 270, 600, 1); c.fillStyle = ACC; c.fillRect(x0, y0 + 269.5, 600 * ease(pk), 2); txt(c, `${Math.round(pk * 100)}%`, x0 + 600, y0 + 296, MONO(500, 14), TX3, 'right', 'middle', 2);
    c.restore(); }
  function title(c, t) { if (t < 6 || t >= 12.6) return; const o = 1 - out3(prog(t, 11.6, 12.4)); c.save(); c.globalAlpha = o;
    reveal(c, 'EPISODE 01', CX, 380, MONO(600, 20), ACC, t, 6.2, 'center', 10);
    const fs = fit(c, 'BLOCKCHAIN 101', 600, 150, CW - 40, -2); reveal(c, 'BLOCKCHAIN 101', CX, 480, F(600, fs), TX, t, 6.35, 'center', -2, 1.0);
    rule(c, CX - Math.min(380, CW / 2 - 30), 565, Math.min(760, CW - 60), t, 6.8, rgba(ACC, 0.8), 1.2);
    reveal(c, 'The Decentralized Future', CX, 618, F(400, 40), TX2, t, 7.1, 'center');
    reveal(c, 'PRESENTED BY @THEE_KAL_EL', CX, 700, MONO(500, 16), TX3, t, 7.8, 'center', 6);
    c.restore(); }

  // 12–30 what is a blockchain
  const HASHES = ['0x00a3f9…c41e', '0x00c71e…9b2d', '0x009b2d…e5a8', '0x00e5a8…4f61'];
  function whatIs(c, t, wr) { if (t < 12 || t >= 30.4) return; opener(c, t, 12, '01', 'What is a blockchain?', 'The simple version'); kicker(c, t, 12, '01', 'What is a blockchain'); const o = 1 - out3(prog(t, 29.5, 30.2)); c.save(); c.globalAlpha = o;
    [11, 12, 13, 14].forEach((bi, k) => { const bad = bi === 13 && t >= 21.2 && t < 24.2; pin(c, wr.spine[bi], `BLOCK 18,442,${String(17 + k).padStart(3, '0')}`, bad ? 'HASH MISMATCH' : `PREV ${HASHES[k]}`, t, 14.4 + k * 0.5, k % 2 ? -1 : 1, bad ? RED : k === 1 ? AMB : ACC); });
    if (t >= 21.2 && t < 27) { const k = out3(prog(t, 21.2, 21.6)), ok = t >= 24.2; c.save(); c.globalAlpha *= k; const s = ok ? 'NETWORK CONSENSUS · CHANGE REJECTED' : 'TAMPER ATTEMPT DETECTED', col = ok ? ACC : RED, w = tw(c, s, MONO(600, 16), 3) + 48; c.fillStyle = 'rgba(8,11,16,0.85)'; c.fillRect(CX - w / 2, 220, w, 44); c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(CX - w / 2 + 0.5, 220.5, w - 1, 43); txt(c, s, CX, 243, MONO(600, 16), col, 'center', 'middle', 3); c.restore(); }
    panel(c, CA0, PY0, CW, PY1 - PY0, t, 14.2);
    const B = [[14.5, 'A shared digital ledger: a record of every transaction'], [17.5, 'Copied across thousands of independent computers'], [20.5, 'Each block is cryptographically linked to the one before it'], [24.8, 'No bank. No single owner. No single point of failure.']];
    let y = PY0 + 56; B.forEach(([T, s], i) => { const n = item(c, t, T, i + 1, s, CA0 + 40, y, CW - 80); y += (wrap(c, s, F(500, 31), CW - 170).length) * 40 + 30; });
    c.restore(); }

  // 30–78 key sectors
  const SECT = [
    ['DeFi', 'Decentralized Finance', ['Lending, borrowing and trading without a bank', 'Smart contracts replace the intermediary', 'Open 24/7 to anyone with an internet connection']],
    ['DeSci', 'Decentralized Science', ['Research funded directly by communities', 'Open, verifiable data and results', 'Scientists retain ownership of their work']],
    ['DePIN', 'Decentralized Physical Infrastructure', ['Real-world networks built by everyday people', 'Earn tokens for sharing wireless, storage, compute and mapping', 'Examples: Helium, Filecoin, Render']],
    ['NFTs', 'Digital Ownership', ['Verifiable ownership of digital assets', 'Art, music, tickets, credentials, in-game items', 'Programmable royalties for creators']],
    ['DAOs', 'Decentralized Autonomous Organizations', ['Organizations governed by code and member votes', 'Treasury fully visible on-chain', 'No central executive required']],
    ['RWA', 'Real-World Assets', ['Real estate, bonds and commodities, tokenized', 'Fractional ownership of high-value assets', 'Global, round-the-clock settlement']],
    ['Stablecoins', 'Digital Dollars', ['Tokens pegged to currencies like the US dollar', 'Cross-border payments that settle in seconds', 'Low fees, no banking hours']],
    ['GameFi & SocialFi', 'Games, Creators & Communities', ['Players own their in-game assets', 'Creators own their audience and revenue', 'Portable identity and data']],
  ];
  function sectors(c, t, wr) { if (t < FS || t >= 78.4) return; opener(c, t, FS, '02', 'Key sectors', 'Blockchain is far more than currency'); kicker(c, t, FS, '02', 'Key sectors');
    if (t >= FS + 2 && t < F0 + 0.4) { const o = 1 - out3(prog(t, F0 - 0.4, F0 + 0.3)); c.save(); c.globalAlpha = o; SECT.forEach(([n], d) => pin(c, wr.districts[d], n.toUpperCase(), `DISTRICT 0${d + 1}`, t, FS + 2.3 + d * 0.22, wr.districts[d] && wr.districts[d][0] > CX ? 1 : -1)); c.restore(); return; }
    if (t < F0) return; const i = clamp(Math.floor((t - F0) / FD), 0, 7), T0 = F0 + i * FD, [ab, full, bl] = SECT[i], o = (i < 7 ? 1 - out3(prog(t, T0 + FD - 0.35, T0 + FD)) : 1 - out3(prog(t, 77.6, 78.2)));
    c.save(); c.globalAlpha = o;
    pin(c, wr.districts[i], ab.toUpperCase(), 'ACTIVE DISTRICT', t, T0 + 0.9, wr.districts[i] && wr.districts[i][0] > CX ? 1 : -1, ACC);
    reveal(c, `02.${i + 1}`, CA0, 250, MONO(600, 18), ACC, t, T0 + 0.1, 'left', 4);
    reveal(c, ab, CA0, 320, F(600, fit(c, ab, 600, 84, CW - 40, -1)), TX, t, T0 + 0.15, 'left', -1, 0.8);
    reveal(c, full, CA0, 385, F(400, 28), TX2, t, T0 + 0.3, 'left');
    panel(c, CA0, PY0, CW, PY1 - PY0, t, T0 + 0.35);
    txt(c, `${String(i + 1).padStart(2, '0')} / 08`, CA1 - 28, PY0 + 30, MONO(500, 14), TX3, 'right', 'middle', 3);
    let y = PY0 + 70; bl.forEach((s, j) => { item(c, t, T0 + 0.6 + j * 0.75, j + 1, s, CA0 + 40, y, CW - 80); y += wrap(c, s, F(500, 31), CW - 170).length * 40 + 34; });
    // sector index strip
    const sw = (CW - 7 * 6) / 8; SECT.forEach(([n], d) => { const x = CA0 + d * (sw + 6), on = d === i; c.fillStyle = on ? ACC : d < i ? 'rgba(232,238,245,0.35)' : 'rgba(232,238,245,0.12)'; c.fillRect(x, PY1 + 22, sw, 2); txt(c, n.split(' ')[0].toUpperCase().slice(0, 11), x, PY1 + 40, MONO(500, 11), on ? TX : TX3, 'left', 'middle', 1); });
    c.restore(); }

  // 78–122 history
  const HIST = [
    [2008, 'The Whitepaper', 'Satoshi Nakamoto publishes “Bitcoin: A Peer-to-Peer Electronic Cash System.”', 'October 31, 2008, amid the global financial crisis.'],
    [2009, 'The Genesis Block', 'Bitcoin’s first block is mined on January 3, 2009.', 'Embedded message: “Chancellor on brink of second bailout for banks.”'],
    [2010, 'Bitcoin Pizza Day', '10,000 BTC is exchanged for two pizzas: the first real-world purchase.', 'May 22, 2010.'],
    [2015, 'Ethereum Launches', 'Proposed by Vitalik Buterin in 2013; mainnet goes live in 2015.', 'Introduces smart contracts: programs that run on the blockchain.'],
    [2017, 'Solana Is Proposed', 'Anatoly Yakovenko publishes the Solana whitepaper.', 'Proof of History: a new approach to high-throughput blockchains.'],
    [2020, 'Solana Mainnet & DeFi Summer', 'Solana’s mainnet beta launches with high speed and low fees.', 'Decentralized finance grows rapidly across the industry.'],
    [2022, 'The Merge', 'Ethereum transitions from Proof of Work to Proof of Stake.', 'Network energy consumption falls by roughly 99.95%.'],
    [2024, 'Institutional Adoption', 'U.S. regulators approve spot Bitcoin ETFs.', 'Traditional finance gains direct exposure to digital assets.'],
    [2026, 'Today', 'Thousands of projects. Millions of users. Still early.', 'This course will show you how it all works.'],
  ];
  function history(c, t, wr) { if (t < HSt || t >= 122.4) return; opener(c, t, HSt, '03', 'A brief history', 'From whitepaper to Wall Street'); kicker(c, t, HSt, '03', 'History'); if (t < H0) return;
    const i = clamp(Math.floor((t - H0) / HD), 0, 8), T0 = H0 + i * HD, [yr, ttl, l1, l2] = HIST[i], o = i < 8 ? 1 - out3(prog(t, T0 + HD - 0.35, T0 + HD)) : 1 - out3(prog(t, 121.6, 122.2));
    // timeline ticks along the top of the content column
    const ty = 225; c.fillStyle = 'rgba(232,238,245,0.12)'; c.fillRect(CA0, ty, CW, 1); HIST.forEach(([y2], j) => { const x = CA0 + 20 + j * (CW - 40) / 8, on = j <= i; c.fillStyle = j === i ? AMB : on ? TX : TX3; c.fillRect(x - 0.5, ty - (j === i ? 8 : 4), j === i ? 2 : 1, j === i ? 17 : 9); txt(c, String(y2), x, ty + 24, MONO(j === i ? 600 : 500, 13), j === i ? TX : TX3, 'center', 'middle', 1); });
    c.fillStyle = AMB; c.fillRect(CA0, ty - 0.5, 20 + i * (CW - 40) / 8, 2);
    c.save(); c.globalAlpha = o;
    pin(c, wr.spine[HSPINE[i]], `BLOCK · ${yr}`, ttl.toUpperCase(), t, T0 + 0.8, 1, AMB);
    panel(c, CA0, PY0 - 40, CW, PY1 - PY0 + 40, t, T0 + 0.15, AMB);
    const prevYr = i > 0 ? HIST[i - 1][0] : yr, shown = Math.round(lerp(prevYr, yr, out3(prog(t, T0, T0 + 0.9))));
    txt(c, String(shown), CA0 + 40, PY0 + 40, F(300, 92), AMB, 'left', 'middle', -2);
    reveal(c, ttl, CA0 + 40 + tw(c, '0000', F(300, 92), -2) + 36, PY0 + 34, F(600, fit(c, ttl, 600, 44, CW - 380, 0)), TX, t, T0 + 0.25, 'left');
    c.fillStyle = 'rgba(232,238,245,0.14)'; c.fillRect(CA0 + 40, PY0 + 98, (CW - 80) * out3(prog(t, T0 + 0.2, T0 + 1)), 1);
    let y = PY0 + 140; wrap(c, l1, F(500, 30), CW - 80).forEach((ln, j) => { reveal(c, ln, CA0 + 40, y, F(500, 30), TX, t, T0 + 0.45 + j * 0.08); y += 40; }); y += 6;
    wrap(c, l2, F(400, 26), CW - 80).forEach((ln, j) => { reveal(c, ln, CA0 + 40, y, F(400, 26), TX2, t, T0 + 0.7 + j * 0.08); y += 35; });
    c.restore(); }

  // 122–146 power
  function power(c, t, wr) { if (t < 122 || t >= 146.4) return; opener(c, t, 122, '04', 'Power to the people', 'Why decentralization matters'); kicker(c, t, 122, '04', 'Power to the people');
    if (t >= 124.6 && t < 133.8) { const cen = t < 129.6, T = cen ? 124.6 : 130.2, o = (cen ? 1 - out3(prog(t, 129.2, 129.7)) : 1 - out3(prog(t, 133.2, 133.8))); c.save(); c.globalAlpha = o; const col = cen ? RED : ACC;
      reveal(c, cen ? 'CENTRALIZED' : 'DECENTRALIZED', CA0, 260, MONO(600, 18), col, t, T, 'left', 6);
      reveal(c, cen ? 'One intermediary controls the data, the rules and the money.' : 'The network is the people. No single point of control.', CA0, 318, F(500, fit(c, 'One intermediary controls the data, the rules and the money.', 500, 40, CW - 20)), TX, t, T + 0.15, 'left');
      if (cen) pin(c, wr.hub, 'CENTRAL AUTHORITY', 'SINGLE POINT OF FAILURE', t, 126, 1, RED); c.restore(); }
    if (t >= 134) { panel(c, CA0, 360, CW, PY1 - 360, t, 134);
      const B = [[134.6, 'No intermediary taking a cut'], [136.4, 'Every transaction is publicly verifiable'], [138.2, 'You hold your own keys and your own assets'], [140.0, 'Censorship-resistant: no one can lock you out']];
      let y = 420; B.forEach(([T, s], i) => { item(c, t, T, i + 1, s, CA0 + 40, y, CW - 80); y += wrap(c, s, F(500, 31), CW - 170).length * 40 + 30; });
      if (t >= 142) { c.fillStyle = 'rgba(232,238,245,0.14)'; c.fillRect(CA0 + 40, 820, (CW - 80) * out3(prog(t, 142, 143)), 1); reveal(c, 'Power and visibility, back in the hands of the people.', CA0 + 40, 875, F(600, fit(c, 'Power and visibility, back in the hands of the people.', 600, 38, CW - 80)), AMB, t, 142.2, 'left'); } }
  }

  // 146–168 careers
  const JOBS = ['Smart Contract Engineer', 'Security Auditor', 'Protocol Engineer', 'On-chain Data Analyst', 'Developer Relations', 'Product Manager', 'Tokenomics Designer', 'Web3 Product Designer', 'Research Scientist', 'Content & Education'];
  const VS = [['Rigid hierarchy', 'Flat, merit-driven teams'], ['Office-bound, 9 to 5', 'Remote-first and global'], ['Credential-gated', 'Skills and proven work matter most'], ['Formal and slow-moving', 'Casual, creative, fast-shipping culture']];
  function careers(c, t, wr) { if (t < 146 || t >= 168.4) return; opener(c, t, 146, '05', 'The opportunity', 'An industry still being built'); kicker(c, t, 146, '05', 'The opportunity');
    if (t >= 148 && t < 153.4) { const o = 1 - out3(prog(t, 152.8, 153.4)); c.save(); c.globalAlpha = o;
      reveal(c, 'Rapidly evolving technology.', CA0, 300, F(600, fit(c, 'Rapidly evolving technology.', 600, 72, CW - 20, -1)), TX, t, 148.2, 'left', -1, 0.9);
      reveal(c, 'A rapidly growing industry.', CA0, 390, F(600, fit(c, 'Rapidly evolving technology.', 600, 72, CW - 20, -1)), AMB, t, 149.2, 'left', -1, 0.9);
      reveal(c, 'NEW PROTOCOLS · NEW COMPANIES · NEW ROLES', CA0, 470, MONO(500, 16), TX2, t, 150.2, 'left', 4); c.restore(); }
    if (t >= 153 && t < 159.4) { const o = 1 - out3(prog(t, 158.8, 159.4)); c.save(); c.globalAlpha = o;
      reveal(c, 'High-paying roles, in demand worldwide', CA0, 270, F(600, fit(c, 'High-paying roles, in demand worldwide', 600, 50, CW - 20)), TX, t, 153.2, 'left');
      panel(c, CA0, 340, CW, 560, t, 153.4); const cw = (CW - 80) / 2;
      JOBS.forEach((j, n) => { const T = 153.6 + n * 0.3, x = CA0 + 40 + (n % 2) * cw, y = 400 + Math.floor(n / 2) * 98; if (t < T) return; txt(c, String(n + 1).padStart(2, '0'), x, y, MONO(600, 16), rgba(ACC, out3(prog(t, T, T + 0.4))), 'left', 'middle', 2); reveal(c, j, x + 52, y, F(500, 28), TX, t, T); c.fillStyle = 'rgba(232,238,245,0.08)'; c.fillRect(x, y + 34, (cw - 40) * out3(prog(t, T, T + 0.8)), 1); });
      c.restore(); }
    if (t >= 159) { const o = 1 - out3(prog(t, 167.6, 168.2)); c.save(); c.globalAlpha = o; const pw = CW / 2 - 12;
      panel(c, CA0, 250, pw, 660, t, 159, TX3); panel(c, CX + 12, 250, pw, 660, t, 159, ACC);
      reveal(c, 'TRADITIONAL', CA0 + 36, 300, MONO(600, 16), TX3, t, 159.2, 'left', 5); reveal(c, 'WEB3', CX + 48, 300, MONO(600, 16), ACC, t, 159.2, 'left', 5);
      VS.forEach(([a, b], i) => { const T = 159.8 + i * 1.6, y = 390 + i * 130; const fa = F(400, fit(c, a, 400, 28, pw - 72)), fb = F(600, fit(c, b, 600, 28, pw - 72));
        reveal(c, a, CA0 + 36, y, fa, TX2, t, T); if (t > T + 0.35) { c.font = fa; c.fillStyle = rgba(RED, 0.7); c.fillRect(CA0 + 36, y, c.measureText(a).width * out3(prog(t, T + 0.35, T + 0.8)), 1.5); }
        reveal(c, b, CX + 48, y, fb, TX, t, T + 0.5); c.fillStyle = 'rgba(232,238,245,0.08)'; if (i < 3) { c.fillRect(CA0 + 36, y + 62, pw - 72, 1); c.fillRect(CX + 48, y + 62, pw - 72, 1); } });
      c.restore(); }
  }

  // 168–180 outro
  function outro(c, t) { if (t < 168) return;
    reveal(c, 'THE FUTURE IS', CX, 360, MONO(600, 22), ACC, t, 168.3, 'center', 12);
    reveal(c, 'Decentralized.', CX, 450, F(600, fit(c, 'Decentralized.', 600, 140, CW - 40, -2)), TX, t, 168.6, 'center', -2, 1.1);
    rule(c, CX - Math.min(360, CW / 2 - 30), 540, Math.min(720, CW - 60), t, 169.4, rgba(ACC, 0.8), 1.2);
    reveal(c, 'Welcome to Blockchain 101.', CX, 595, F(400, 36), TX2, t, 170.2, 'center');
    reveal(c, 'NEXT · EPISODE 02', CX, 680, MONO(600, 18), AMB, t, 171.6, 'center', 8);
    reveal(c, '@THEE_KAL_EL', CX, 760, MONO(500, 18), TX, t, 173, 'center', 6);
    const fo = prog(t, 178.2, 180); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); } }

  // ---------- finishing ----------
  let GRAIN = null;
  function finish(c, t) {
    // section cut: a single hairline light sweep
    for (const T of CUTS) if (t >= T && t < T + 0.6) { const k = ease(prog(t, T, T + 0.6)), y = k * H; const g = c.createLinearGradient(0, y - 120, 0, y); g.addColorStop(0, 'rgba(92,225,230,0)'); g.addColorStop(1, `rgba(92,225,230,${0.10 * (1 - k)})`); c.fillStyle = g; c.fillRect(0, y - 120, W, 120); c.fillStyle = `rgba(200,250,255,${0.6 * (1 - k)})`; c.fillRect(0, y, W, 1); }
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 10; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalAlpha = 0.6; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const vg = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.1); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  }
  // soft bloom: 3D frame shrunk and stretched back, added on top
  let GLOW = null;
  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.letterSpacing = '0px'; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    const wr = W3().render(t, worldState(t));
    c.drawImage(wr.canvas, 0, 0, W, H);
    if (!GLOW) { GLOW = document.createElement('canvas'); GLOW.width = 240; GLOW.height = 135; } const g = GLOW.getContext('2d'); g.drawImage(wr.canvas, 0, 0, 240, 135);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; c.drawImage(GLOW, 0, 0, W, H); c.restore();
    if (t < 6.5) { /* boot sits over a darkened world */ }
    boot(c, t); title(c, t); whatIs(c, t, wr); sectors(c, t, wr); history(c, t, wr); power(c, t, wr); careers(c, t, wr); outro(c, t);
    hud(c, t); finish(c, t);
  }
  window.FILM = { W, H, FPS, DUR, renderAt, LANE };
  const waitW = new Promise((res) => { const chk = () => (window.WORLD ? res() : setTimeout(chk, 20)); chk(); });
  window.FILM.ready = Promise.all([waitW, document.fonts.load(F(300, 40)), document.fonts.load(F(400, 40)), document.fonts.load(F(500, 40)), document.fonts.load(F(600, 40)), document.fonts.load(MONO(500, 20)), document.fonts.load(MONO(600, 20))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
