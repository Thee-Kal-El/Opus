// ESCAPE VELOCITY · Episode 01 "The Threshold" — 60s, 1920×1080 @ 24fps (2.39:1 letterbox), composited over the Three.js scenes in world.js.
// 0 black / EARTH · 2147 · 2.2 Earth from orbit · 12 the debris belt (satellite destroyed at 17.5) · 21 the divided city (ration line,
// war on the horizon, NO ONE LEAVES) · 33 Launch Complex 39-X: MERIDIAN, the crew walk-out + dossiers, countdown, perimeter breach at 50.6,
// ignition 54.6 · 56.6 cut · 57 title card. renderAt(t) is a pure function of t.
(() => {
  'use strict';
  const W = 1920, H = 1080, FPS = 24, DUR = 60, TAU = Math.PI * 2, BAR = 138, AY0 = BAR, AY1 = H - BAR;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const TX = '#EEF1F5', TX2 = '#9AA3AF', CY = '#7FD4E6', AMB = '#F0B45A', RED = '#FF4A3D';
  const SERIF = (s) => `italic 400 ${s}px "Instrument Serif", serif`, F = (w, s) => `${w} ${s}px "Inter Tight", sans-serif`, MONO = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`, MARK = (s) => `400 ${s}px "Permanent Marker", cursive`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k, prog = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2), out3 = (p) => 1 - Math.pow(1 - p, 3);
  const hash = (a, b = 0, c = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  const tw = (c, s, font, ls = 0) => { c.font = font; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.letterSpacing = '0px'; return w; };
  const ESC = () => window.ESC;

  // ---------- shot list ----------
  const SHOTS = [['earth', 2.2, 12.2], ['debris', 12.2, 21.1], ['city', 21.1, 33.1], ['pad', 33.1, 56.6]];
  const HIT = 17.5, BREACH = 50.6, IGN = 54.6;
  function shotAt(t) { return SHOTS.find(([, a, b]) => t >= a && t < b); }

  // ---------- captions (film subtitles) ----------
  const CAPS = [[3.6, 8.8, 'In 2147, humanity stands at the edge of the sky.'], [13.4, 16.9, 'Above us: a graveyard of our own making.'], [22.0, 25.8, 'Below: famine. Rationing. A world divided.'],
    [26.3, 29.9, 'Those who can leave, and those who never will.'], [30.2, 33.0, 'Some would rather burn the ships than watch them go.'], [34.3, 37.6, 'MERIDIAN. Launch Complex 39-X.'],
    [45.0, 48.8, 'Six scientists. One ship. No second chances.'], [51.6, 54.4, 'The countdown does not stop.']];
  function captions(c, t) { for (const [a, b, s] of CAPS) { if (t < a || t > b) continue; const k = prog(t, a, a + 0.5) * (1 - prog(t, b - 0.45, b)); c.save(); c.globalAlpha = k; c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 18; txt(c, s, W / 2, AY1 - 62, SERIF(46), TX, 'center', 'middle', 0.5); c.restore(); } }

  // ---------- silhouettes ----------
  // human silhouettes: jointed limbs drawn as round-capped strokes, tapered torso, varied builds / coats / hoods / bags; astronauts get
  // helmets, backpacks and bulky limbs. A rim pass (offset, coloured) under the black pass sells the backlight.
  function person(c, x, y, h, ph, o = {}) {
    const s = h / 100, suit = !!o.suit, seed = o.seed || 0, walk = o.walk ? Math.sin(ph) : 0, lean = (o.lean ?? 0) * s, build = suit ? 1.25 : 0.85 + hash(seed, 1) * 0.35, coat = !suit && hash(seed, 2) > 0.45, hood = !suit && hash(seed, 3) > 0.7, bag = !suit && hash(seed, 4) > 0.7;
    const sway = o.walk ? 0 : Math.sin(ph) * 1.2 * s, hipY = y - 50 * s, shY = y - 82 * s, sx = x + lean + sway;
    const draw = (dx, dy) => {
      c.lineCap = 'round'; c.lineJoin = 'round';
      // legs (thigh + shin)
      [[-1, walk], [1, -walk]].forEach(([side, w]) => { const hx = x + dx + side * 4.5 * s * build, hy = hipY + dy, a1 = w * 0.42, kx = hx + Math.sin(a1) * 25 * s, ky = hy + Math.cos(a1) * 25 * s, a2 = a1 - Math.max(0, w * side) * 0 - (o.walk ? Math.max(0, -w) * 0.5 : 0), fx = kx + Math.sin(a2) * 25 * s, fy = ky + Math.cos(a2) * 25 * s;
        c.lineWidth = (suit ? 11 : 7.5) * s * build; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke(); c.lineWidth = (suit ? 12 : 7) * s; c.beginPath(); c.moveTo(fx - 1 * s, fy); c.lineTo(fx + 6 * s, fy); c.stroke(); });
      // torso
      const sw = (suit ? 15 : 12) * s * build, ww = (suit ? 12 : 8.5) * s * build, bot = coat ? y - 26 * s : hipY + 4 * s, flare = coat ? 13 * s * build : ww;
      if (suit) { c.beginPath(); c.roundRect(sx + dx - sw - 6 * s, shY + dy + 2 * s, 12 * s, 30 * s, 4 * s); c.fill(); }
      c.beginPath(); c.moveTo(sx + dx - sw, shY + dy + 3 * s); c.quadraticCurveTo(sx + dx - sw, shY + dy - 3 * s, sx + dx - sw + 5 * s, shY + dy - 3 * s); c.lineTo(sx + dx + sw - 5 * s, shY + dy - 3 * s); c.quadraticCurveTo(sx + dx + sw, shY + dy - 3 * s, sx + dx + sw, shY + dy + 3 * s);
      c.lineTo(x + dx + flare, bot + dy); c.lineTo(x + dx - flare, bot + dy); c.closePath(); c.fill();
      // arms (upper + fore)
      [[-1, -walk], [1, walk]].forEach(([side, w]) => { const ax = sx + dx + side * (sw - 2 * s), ay = shY + dy + 1 * s, a1 = w * 0.4 + side * 0.06, ex = ax + Math.sin(a1) * 18 * s, ey = ay + Math.cos(a1) * 18 * s, a2 = a1 - 0.25 - Math.abs(w) * 0.2, hx = ex + Math.sin(a2) * 16 * s, hy = ey + Math.cos(a2) * 16 * s;
        c.lineWidth = (suit ? 9 : 5.5) * s * build; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke(); });
      if (bag) { c.beginPath(); c.roundRect(x + dx + sw - 2 * s, hipY + dy - 14 * s, 12 * s, 16 * s, 3 * s); c.fill(); }
      // neck + head
      c.lineWidth = (suit ? 10 : 5) * s; c.beginPath(); c.moveTo(sx + dx, shY + dy); c.lineTo(sx + dx, shY + dy - 6 * s); c.stroke();
      c.beginPath(); if (suit) c.arc(sx + dx, shY + dy - 13 * s, 11 * s, 0, TAU); else if (hood) { c.ellipse(sx + dx, shY + dy - 12 * s, 8.6 * s, 10 * s, 0, 0, TAU); } else c.ellipse(sx + dx, shY + dy - 12 * s, 6.4 * s, 8 * s, 0, 0, TAU); c.fill(); };
    if (o.rim) { c.strokeStyle = c.fillStyle = o.rim; draw(-2.4, -1.2); }
    c.strokeStyle = c.fillStyle = o.fill || '#040406'; draw(0, 0);
    if (suit) { c.fillStyle = rgba('#9FD8FF', 0.5); c.beginPath(); c.ellipse(sx + 4 * s, shY - 13 * s, 6 * s, 3.4 * s, -0.25, 0, TAU); c.fill(); }
  }
  // ration line (21.1–27): queue receding toward a closed ration point
  function rationLine(c, t) { if (t < 21.1 || t > 27.6) return; const a = (1 - prog(t, 27.0, 27.6)); c.save(); c.globalAlpha = a;
    const g = c.createLinearGradient(0, 760, 0, AY1); g.addColorStop(0, 'rgba(10,6,4,0)'); g.addColorStop(1, 'rgba(10,6,4,0.95)'); c.fillStyle = g; c.fillRect(0, 760, W, AY1 - 760);
    // booth + sign
    c.fillStyle = '#060506'; c.fillRect(250, 640, 190, 260); const fl = 0.75 + 0.25 * Math.sin(t * 11) * Math.sin(t * 3.7); c.save(); c.shadowColor = RED; c.shadowBlur = 30 * fl; c.fillStyle = rgba(RED, 0.9 * fl); c.fillRect(262, 652, 166, 50); c.restore();
    txt(c, 'RATION POINT 7', 345, 668, MONO(700, 15), '#1a0503', 'center', 'middle', 2); txt(c, 'CLOSED', 345, 690, MONO(800, 17), '#1a0503', 'center', 'middle', 6);
    const Q = []; for (let i = 0; i < 26; i++) { const d = i / 25 + (hash(i, 9) - 0.5) * 0.03; if (hash(i, 7) < 0.08) continue; Q.push([d, i]); }
    Q.sort((p, q) => q[0] - p[0]).forEach(([d, i]) => { const x = lerp(470, 1880, Math.pow(clamp(d), 0.85)) + (hash(i, 5) - 0.5) * 30, y = lerp(902, 968, d), child = hash(i, 6) > 0.86, h = lerp(150, 340, Math.pow(clamp(d), 1.25)) * (child ? 0.62 : 0.9 + hash(i, 8) * 0.2);
      person(c, x, y, h, t * 0.7 + i * 1.9, { rim: rgba('#FF8A3A', 0.6), seed: i * 13 + 5, lean: (hash(i, 4) - 0.55) * 6 }); if (child) person(c, x + 22 * h / 100, y, h / 0.62 * 0.95, t * 0.7 + i, { rim: rgba('#FF8A3A', 0.6), seed: i * 31 + 2 }); });
    c.restore(); }
  // graffiti on a foreground wall (27.4–33.1)
  function graffiti(c, t) { if (t < 27.4 || t > 33.1) return; const a = prog(t, 27.4, 28) * (1 - prog(t, 32.7, 33.1)); c.save(); c.globalAlpha = a;
    c.beginPath(); c.moveTo(1180, AY1); c.lineTo(1260, 560); c.lineTo(W, 500); c.lineTo(W, AY1); c.closePath(); const g = c.createLinearGradient(1180, 0, W, 0); g.addColorStop(0, '#0b0a0c'); g.addColorStop(1, '#161417'); c.fillStyle = g; c.fill(); c.clip();
    for (let i = 0; i < 700; i++) { c.fillStyle = `rgba(255,255,255,${0.02 * hash(i, 3)})`; c.fillRect(1180 + hash(i, 1) * 760, 500 + hash(i, 2) * 450, 2, 2); }
    const k = prog(t, 27.8, 29.2); c.save(); c.translate(1300, 700); c.rotate(-0.06); c.beginPath(); c.rect(-20, -120, 640 * k, 260); c.clip();
    c.shadowColor = 'rgba(255,40,30,0.35)'; c.shadowBlur = 14; txt(c, 'NO ONE', 0, -30, MARK(110), '#C8241B', 'left'); txt(c, 'LEAVES', 20, 80, MARK(110), '#C8241B', 'left');
    for (let i = 0; i < 14; i++) { const x = 20 + hash(i, 5) * 520, l = 20 + hash(i, 6) * 70; c.fillStyle = '#A81E16'; c.fillRect(x, 20 + (i % 2) * 110, 3, l * prog(t, 29, 31)); } c.restore(); c.restore(); }
  // emergency broadcast lower third (28–33)
  function broadcast(c, t) { if (t < 28.2 || t > 33.1) return; const k = out3(prog(t, 28.2, 28.7)) * (1 - prog(t, 32.7, 33.1)); c.save(); c.globalAlpha = k;
    c.fillStyle = 'rgba(160,20,14,0.88)'; c.fillRect(0, AY0 + 40, 300, 46); txt(c, '● EMERGENCY BROADCAST', 24, AY0 + 63, MONO(700, 16), '#fff', 'left', 'middle', 2);
    c.fillStyle = 'rgba(8,8,10,0.82)'; c.fillRect(300, AY0 + 40, 900, 46); const msg = 'ANTI-LAUNCH MILITIAS ADVANCING ON COASTAL LAUNCH SITES · CURFEW IN EFFECT · '; c.save(); c.beginPath(); c.rect(300, AY0 + 40, 900, 46); c.clip(); txt(c, msg + msg, 320 - ((t - 28.2) * 120) % tw(c, msg, MONO(500, 16), 1), AY0 + 63, MONO(500, 16), TX, 'left', 'middle', 1); c.restore(); c.restore(); }

  // ---------- orbital HUD ----------
  function bracket(c, x, y, s, col, a = 1) { c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = 1.5; const L = s * 0.35; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(x + dx * s, y + dy * s - dy * L); c.lineTo(x + dx * s, y + dy * s); c.lineTo(x + dx * s - dx * L, y + dy * s); c.stroke(); }); c.restore(); }
  function orbitHUD(c, t, pts) { if (t < 12.2 || t > 21.1) return;
    c.save(); txt(c, 'LEO · 412 KM', 60, AY0 + 40, MONO(500, 15), TX2, 'left', 'middle', 3); txt(c, `TRACKED OBJECTS  ${(412880 + Math.floor((t - 12) * 37)).toLocaleString('en-US')}`, W - 60, AY0 + 40, MONO(600, 15), CY, 'right', 'middle', 3);
    for (let i = 0; i < 7; i++) { const p = pts['d' + i]; if (!p || !p[2] || p[1] < AY0 + 60 || p[1] > AY1 - 60) continue; const a = out3(prog(t, 13 + i * 0.25, 13.4 + i * 0.25)); bracket(c, p[0], p[1], 22, CY, a * 0.8); c.globalAlpha = a; txt(c, `OBJ ${48210 + i * 317}`, p[0] + 30, p[1] - 14, MONO(500, 12), CY, 'left', 'middle', 1); txt(c, `${(7.4 + hash(i, 2) * 0.6).toFixed(2)} KM/S`, p[0] + 30, p[1] + 4, MONO(500, 12), TX2, 'left', 'middle', 1); c.globalAlpha = 1; }
    const sp = pts.sat; if (sp && sp[2] && t < HIT) { bracket(c, sp[0], sp[1], 60, AMB, out3(prog(t, 14, 14.6))); txt(c, 'SAT-07 · COMMS RELAY', sp[0] + 72, sp[1] - 52, MONO(600, 14), AMB, 'left', 'middle', 2);
      if (t > HIT - 1.4) { c.globalAlpha = (Math.floor(t * 6) % 2) ? 1 : 0.4; txt(c, 'COLLISION WARNING', sp[0] + 72, sp[1] - 30, MONO(700, 14), RED, 'left', 'middle', 2); c.globalAlpha = 1; } }
    if (pts.proj && pts.proj[2]) { const [x, y] = pts.proj; const g = c.createLinearGradient(x - 160, y + 30, x, y); g.addColorStop(0, 'rgba(255,220,180,0)'); g.addColorStop(1, 'rgba(255,240,220,0.95)'); c.strokeStyle = g; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 160, y + 30); c.lineTo(x, y); c.stroke(); }
    if (t >= HIT) { const d = t - HIT; if (sp) { const r = 40 + d * 600, a = Math.max(0, 1 - d / 0.9); const g = c.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], r); g.addColorStop(0, `rgba(255,245,230,${a})`); g.addColorStop(0.3, `rgba(255,170,90,${a * 0.6})`); g.addColorStop(1, 'rgba(255,120,50,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
      const k = out3(prog(t, HIT + 0.3, HIT + 0.7)); c.globalAlpha = k * (1 - prog(t, 20.6, 21.1)); c.fillStyle = 'rgba(30,6,5,0.8)'; c.fillRect(W / 2 - 330, AY0 + 90, 660, 92); c.strokeStyle = RED; c.lineWidth = 1.5; c.strokeRect(W / 2 - 330 + 0.5, AY0 + 90.5, 659, 91);
      txt(c, 'COLLISION EVENT · SAT-07 LOST', W / 2, AY0 + 122, MONO(700, 20), RED, 'center', 'middle', 3); txt(c, 'KESSLER CASCADE RISK: SEVERE', W / 2, AY0 + 154, MONO(600, 16), TX, 'center', 'middle', 4); }
    c.restore(); }

  // ---------- launch complex ----------
  const CREW = [['CMDR. AMARA OKAFOR', 'MISSION COMMANDER', 'LAGOS'], ['LT. MEI TAKAHASHI', 'PILOT', 'OSAKA'], ['DR. ELIAS VANCE', 'EXOBIOLOGIST', 'VANCOUVER'], ['DR. RAFAEL ORTIZ', 'FLIGHT SURGEON', 'BOGOTÁ'], ['PROF. KWAME ASANTE', 'PLANETARY GEOLOGIST', 'KUMASI'], ['SGT. NADIA VOLKOV', 'SECURITY OFFICER', 'MURMANSK']];
  const WALK0 = 37.6, CARD0 = 38.4, CARDD = 1.05;
  function crew(c, t) { if (t < WALK0 || t > 45.6) return; const a = 1 - prog(t, 45.1, 45.6); c.save(); c.globalAlpha = a;
    const g = c.createLinearGradient(0, 780, 0, AY1); g.addColorStop(0, 'rgba(4,5,8,0)'); g.addColorStop(1, 'rgba(4,5,8,0.9)'); c.fillStyle = g; c.fillRect(0, 780, W, AY1 - 780);
    const xs = []; for (let i = 0; i < 6; i++) { const x = -260 + (t - WALK0) * 170 + (5 - i) * 190, y = 942; xs.push(x); person(c, x, y, 300 - (i % 2) * 12, (t - WALK0) * 6.5 + i * 1.3, { suit: true, walk: true, seed: i, rim: rgba('#CFE6FF', 0.75) }); }
    const i = clamp(Math.floor((t - CARD0) / CARDD), 0, 5), T0 = CARD0 + i * CARDD; if (t >= CARD0 && t < CARD0 + 6 * CARDD + 0.4) { const k = out3(prog(t, T0, T0 + 0.25)), [nm, role, from] = CREW[i];
      bracket(c, xs[i], 942 - 150, 120, CY, k * 0.8);
      const x = 120, y = AY0 + 70; c.globalAlpha = a * k; c.fillStyle = 'rgba(6,9,14,0.82)'; c.fillRect(x, y, 560, 170); c.fillStyle = CY; c.fillRect(x, y, 4, 170);
      txt(c, `CREW ${String(i + 1).padStart(2, '0')} / 06`, x + 28, y + 30, MONO(600, 14), CY, 'left', 'middle', 3); txt(c, nm, x + 28, y + 76, F(600, 36), TX, 'left', 'middle', 0); txt(c, role, x + 28, y + 114, MONO(500, 16), TX2, 'left', 'middle', 3); txt(c, `ORIGIN · ${from}   ·   STATUS · READY`, x + 28, y + 144, MONO(500, 13), rgba(TX2, 0.8), 'left', 'middle', 2);
      // helmet glyph
      c.strokeStyle = rgba(CY, 0.8); c.lineWidth = 2; c.beginPath(); c.arc(x + 500, y + 70, 30, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(x + 504, y + 72, 18, 11, 0, 0, TAU); c.stroke(); }
    c.restore(); }
  function countdown(c, t) { if (t < 44 || t > 56.6) return; const rem = Math.max(0, 56.0 - t), a = prog(t, 44, 44.5); c.save(); c.globalAlpha = a;
    const s = Math.floor(rem), cs = Math.floor((rem - s) * 100); txt(c, 'MERIDIAN · LAUNCH CONTROL', W - 60, AY0 + 36, MONO(600, 14), TX2, 'right', 'middle', 3);
    txt(c, `T – 00:00:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`, W - 60, AY0 + 78, MONO(600, 34), t > IGN - 0.2 ? AMB : TX, 'right', 'middle', 2);
    txt(c, t > IGN - 1.2 ? 'IGNITION SEQUENCE START' : t > BREACH ? 'LAUNCH COMMIT · GO' : 'ALL SYSTEMS NOMINAL', W - 60, AY0 + 114, MONO(600, 14), t > IGN - 1.2 ? AMB : t > BREACH ? CY : TX2, 'right', 'middle', 3);
    c.restore();
    if (t >= BREACH && t < 55.6) { const k = out3(prog(t, BREACH + 0.15, BREACH + 0.5)), fl = (Math.floor(t * 4) % 2) ? 1 : 0.55; c.save(); c.globalAlpha = k * fl; c.fillStyle = 'rgba(40,6,5,0.82)'; c.fillRect(60, AY0 + 36, 470, 84); c.strokeStyle = RED; c.lineWidth = 1.5; c.strokeRect(60.5, AY0 + 36.5, 469, 83);
      txt(c, '⚠ PERIMETER BREACH · SECTOR 4', 84, AY0 + 64, MONO(700, 18), RED, 'left', 'middle', 2); txt(c, 'HOSTILES AT THE FENCE LINE', 84, AY0 + 96, MONO(500, 14), TX, 'left', 'middle', 3); c.restore();
      c.save(); c.globalAlpha = 0.08 * fl * k; c.fillStyle = RED; c.fillRect(0, AY0, W, AY1 - AY0); c.restore(); } }

  // ---------- title ----------
  function titleCard(c, t) { if (t < 57) return; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const k = out3(prog(t, 57.15, 58.3)); c.save(); c.globalAlpha = k; txt(c, 'ESCAPE VELOCITY', W / 2, H / 2 - 20, F(300, 92), TX, 'center', 'middle', 34 - 14 * k); c.restore();
    c.save(); c.globalAlpha = prog(t, 57.8, 58.5); c.fillStyle = rgba(TX, 0.5); c.fillRect(W / 2 - 220, H / 2 + 46, 440, 1); txt(c, 'EPISODE 01  ·  THE THRESHOLD', W / 2, H / 2 + 86, MONO(500, 18), TX2, 'center', 'middle', 8); c.restore();
    c.save(); c.globalAlpha = prog(t, 58.8, 59.4) * (1 - prog(t, 59.6, 60)); txt(c, 'TO BE CONTINUED', W / 2, AY1 - 70, SERIF(34), AMB, 'center', 'middle', 2); c.restore(); }

  // ---------- frame ----------
  let GLOW = null, GRAIN = null;
  function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.letterSpacing = '0px'; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const sh = shotAt(t); let pts = {};
    if (sh) { const [name, a, b] = sh, k = prog(t, a, b);
      const r = name === 'earth' ? ESC().earth(t, { k }) : name === 'debris' ? ESC().debris(t, { k, hitT: HIT }) : name === 'city' ? ESC().city(t, { k }) : ESC().pad(t, { k: prog(t, 33.1, 56), breachT: BREACH, ignite: ease(prog(t, IGN, IGN + 1.6)) });
      pts = r.pts; c.drawImage(r.canvas, 0, 0, W, H);
      if (!GLOW) { GLOW = document.createElement('canvas'); GLOW.width = 240; GLOW.height = 135; } GLOW.getContext('2d').drawImage(r.canvas, 0, 0, 240, 135); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45; c.drawImage(GLOW, 0, 0, W, H); c.restore();
      // sun flare on the Earth shot
      if (name === 'earth' && pts.sun && pts.sun[2]) { const [x, y] = pts.sun, f = prog(t, 6.5, 9.5); if (f > 0) { const g = c.createRadialGradient(x, y, 0, x, y, 420 * f + 40); g.addColorStop(0, `rgba(255,250,240,${0.95 * f})`); g.addColorStop(0.08, `rgba(255,220,170,${0.5 * f})`); g.addColorStop(1, 'rgba(255,160,90,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = `rgba(255,230,200,${0.1 * f})`; c.fillRect(x - 700, y - 0.5, 1400, 1); c.restore(); } }
      // breach + ignition light
      if (name === 'pad' && t >= BREACH && pts.breach && pts.breach[2]) { const d = t - BREACH, [x, y] = pts.breach; const g = c.createRadialGradient(x, y, 0, x, y, 300 + d * 200); g.addColorStop(0, `rgba(255,190,120,${Math.max(0, 0.9 - d * 0.5)})`); g.addColorStop(1, 'rgba(255,90,30,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }
      if (name === 'pad' && t >= IGN && pts.base) { const ig = ease(prog(t, IGN, IGN + 1.6)), [x, y] = pts.base; const g = c.createRadialGradient(x, y, 0, x, y, 900 * ig + 50); g.addColorStop(0, `rgba(255,245,220,${ig})`); g.addColorStop(0.15, `rgba(255,170,80,${0.7 * ig})`); g.addColorStop(1, 'rgba(255,100,30,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }
      // dips between shots
      const dip = Math.max(1 - prog(t, a, a + 0.45), prog(t, b - 0.35, b)); if (dip > 0) { c.fillStyle = `rgba(0,0,0,${dip})`; c.fillRect(0, 0, W, H); }
    }
    // overlays
    rationLine(ctx, t); graffiti(ctx, t); broadcast(ctx, t); orbitHUD(ctx, t, pts); crew(ctx, t); countdown(ctx, t);
    if (t < 3.4) { const k = prog(t, 0.6, 1.4) * (1 - prog(t, 2.6, 3.3)); c.save(); c.globalAlpha = k; txt(c, 'EARTH  ·  2147', W / 2, H / 2, MONO(500, 24), TX, 'center', 'middle', 14); c.restore(); }
    if (t > 56.4 && t < 57.2) { const k = 1 - Math.abs(t - 56.7) / 0.4; c.fillStyle = `rgba(255,244,230,${clamp(k)})`; c.fillRect(0, 0, W, H); }
    captions(ctx, t); titleCard(ctx, t);
    // grade: grain + vignette + letterbox
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 16; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalAlpha = 0.7; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const vg = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    c.fillStyle = '#000'; c.fillRect(0, 0, W, BAR); c.fillRect(0, H - BAR, W, BAR);
  }
  window.FILM = { W, H, FPS, DUR, renderAt };
  const waitE = new Promise((res) => { const chk = () => (window.ESC ? res() : setTimeout(chk, 20)); chk(); });
  window.FILM.ready = Promise.all([waitE, document.fonts.load(SERIF(46)), document.fonts.load(F(300, 40)), document.fonts.load(F(600, 40)), document.fonts.load(F(700, 40)), document.fonts.load(MONO(500, 20)), document.fonts.load(MONO(600, 20)), document.fonts.load(MONO(700, 20)), document.fonts.load(MONO(800, 20)), document.fonts.load(MARK(60))]).then(() => document.fonts.ready);
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
