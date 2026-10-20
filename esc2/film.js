// ESCAPE VELOCITY · Episode 01 "The Threshold" — Blender remake. 60 s, 1920×1080 @ 24 fps, 2.39:1 letterbox.
// Composites the EEVEE frame sequences in out/esc2_frames/<shot>/ with 2D CRT inserts (boot, debris radar, crew dossiers),
// captions, rain, countdown/breach HUD, film grain and the segmented title. renderAt(t) is async (loads one plate) and pure in t.
(() => {
  'use strict';
  const W = 1920, H = 1080, FPS = 24, DUR = 60, TAU = Math.PI * 2, BAR = 138, AY0 = BAR, AY1 = H - BAR;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const TX = '#ECE8DF', PH = '#7CFFA0', PHD = '#2E8F55', AMB = '#FFB347', RED = '#FF3B2E';
  const SERIF = (s) => `italic 400 ${s}px "Instrument Serif", serif`, F = (w, s) => `${w} ${s}px "Inter Tight", sans-serif`, MONO = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), prog = (t, a, b) => clamp((t - a) / (b - a)), out3 = (p) => 1 - Math.pow(1 - p, 3);
  const hash = (a, b = 0, c = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  function txt(c, s, x, y, font, col, align = 'left', base = 'middle', ls = 0) { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }

  // ---------- shot list: [name, start s, end s, frames dir, first frame] ----------
  const SHOTS = [['boot', 0, 3], ['window', 3, 12, 'window'], ['radar', 12, 15], ['debris', 15, 21, 'debris'], ['street', 21, 27, 'street'], ['city', 27, 33, 'city'],
    ['padwide', 33, 38, 'padwide'], ['dossier', 38, 45], ['padclose', 45, 50.5, 'padclose'], ['ignition', 50.5, 56.6, 'ignition']];
  const BREACH = 50.5 + 8 / 24, IGN = 50.5 + 98 / 24;
  const RAIN = new Set(['street', 'city', 'padwide', 'padclose', 'ignition']);
  const CAPS = [[3.8, 8.8, 'In 2147, humanity stands at the edge of the sky.'], [15.5, 19.8, 'Above us: a graveyard of our own making.'], [21.9, 26.2, 'Below: famine. Rationing. A world divided.'],
    [27.3, 30.3, 'Those who can leave, and those who never will.'], [30.5, 33.0, 'Some would rather burn the ships than watch them go.'], [33.9, 37.6, 'MERIDIAN. Launch Complex 39-X.'],
    [45.4, 49.6, 'Six scientists. One ship. No second chances.'], [51.8, 54.4, 'The countdown does not stop.']];
  const CREW = [['CMDR. AMARA OKAFOR', 'MISSION COMMANDER', 'LAGOS'], ['LT. MEI TAKAHASHI', 'PILOT', 'OSAKA'], ['DR. ELIAS VANCE', 'EXOBIOLOGIST', 'VANCOUVER'], ['DR. RAFAEL ORTIZ', 'FLIGHT SURGEON', 'BOGOTÁ'], ['PROF. KWAME ASANTE', 'PLANETARY GEOLOGIST', 'KUMASI'], ['SGT. NADIA VOLKOV', 'SECURITY OFFICER', 'MURMANSK']];
  const shotAt = (t) => SHOTS.find(([, a, b]) => t >= a && t < b);

  // ---------- plates ----------
  const plate = (dir, f) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `../out/esc2_frames/${dir}/${String(f).padStart(5, '0')}.png`; });

  // ---------- CRT inserts ----------
  function crtFrame(c, t, draw, tint = PH) {
    c.fillStyle = '#020604'; c.fillRect(0, 0, W, H);
    c.save(); c.shadowColor = rgba(tint, 0.85); c.shadowBlur = 14; draw(c); c.restore();
    // scanlines, roll bar, curvature vignette, flicker
    c.fillStyle = 'rgba(0,0,0,0.32)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2);
    const ry = ((t * 260) % (H + 300)) - 150, g = c.createLinearGradient(0, ry - 120, 0, ry + 120); g.addColorStop(0, 'rgba(120,255,170,0)'); g.addColorStop(0.5, 'rgba(120,255,170,0.05)'); g.addColorStop(1, 'rgba(120,255,170,0)'); c.fillStyle = g; c.fillRect(0, ry - 120, W, 240);
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.98); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.92)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    c.fillStyle = `rgba(0,0,0,${0.06 * hash(Math.round(t * FPS), 5)})`; c.fillRect(0, 0, W, H);
  }
  const typed = (s, t, t0, cps = 38) => s.slice(0, Math.max(0, Math.floor((t - t0) * cps)));
  const cursor = (t) => (Math.floor(t * 3) % 2 ? '█' : ' ');

  function boot(c, t) {
    crtFrame(c, t, (c) => {
      const L = [['ARIADNE SYSTEMS  ·  ORBITAL OPERATIONS TERMINAL 07', 0.15], ['EARTH ORBITAL AUTHORITY  ·  RESTRICTED', 0.55], ['', 0], ['DATE ........ 11.03.2147   04:12 UTC', 0.95], ['POPULATION .. 11,904,221,007', 1.3], ['RATION LEVEL  C  (SEVERE)', 1.62], ['LAUNCH WINDOW  MERIDIAN  ·  T-14:00:00', 1.95]];
      let y = 300; for (const [s, t0] of L) { if (s) txt(c, typed(s, t, t0) + (t > t0 && t < t0 + s.length / 38 + 0.2 ? cursor(t) : ''), 330, y, MONO(500, 30), s.startsWith('RATION') ? AMB : PH, 'left', 'middle', 2); y += 58; }
      if (t > 2.35) txt(c, '> CONNECTING TO MERIDIAN' + '.'.repeat(Math.floor((t - 2.35) * 6) % 4), 330, y + 30, MONO(500, 30), PH, 'left', 'middle', 2);
    });
    const k = prog(t, 0, 0.25) * (1 - prog(t, 2.75, 3)); c.fillStyle = `rgba(0,0,0,${1 - k})`; c.fillRect(0, 0, W, H);
  }

  function radar(c, t) {
    const lt = t - 12;
    crtFrame(c, t, (c) => {
      const cx = 760, cy = 540, R = 330;
      c.strokeStyle = rgba(PH, 0.55); c.lineWidth = 2; for (let r = R / 4; r <= R; r += R / 4) { c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); }
      c.beginPath(); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.stroke();
      c.fillStyle = rgba(PH, 0.2); c.beginPath(); c.arc(cx, cy, 38, 0, TAU); c.fill(); txt(c, 'EARTH', cx, cy, MONO(600, 14), PH, 'center');
      const sw = lt * 2.4; const g = c.createConicGradient(sw - 0.9, cx, cy); g.addColorStop(0, 'rgba(124,255,160,0)'); g.addColorStop(0.14, 'rgba(124,255,160,0.28)'); g.addColorStop(0.15, 'rgba(124,255,160,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
      for (let i = 0; i < 260; i++) { const a = hash(i, 1) * TAU + lt * 0.05 * (0.5 + hash(i, 4)), r = 60 + Math.pow(hash(i, 2), 0.7) * (R - 70), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        const age = ((sw - a) % TAU + TAU) % TAU, b = 0.25 + 0.75 * Math.exp(-age * 1.2); c.fillStyle = rgba(PH, b); c.fillRect(x - 2, y - 2, 4, 4); }
      // SAT-07 with a closing track
      const sa = -0.7, sr = 210, sx = cx + Math.cos(sa) * sr, sy = cy + Math.sin(sa) * sr, blink = Math.floor(lt * 4) % 2;
      c.strokeStyle = blink ? RED : AMB; c.lineWidth = 2; c.strokeRect(sx - 14, sy - 14, 28, 28); txt(c, 'SAT-07', sx + 24, sy - 2, MONO(600, 16), AMB);
      const p = prog(lt, 0.3, 3); c.strokeStyle = RED; c.setLineDash([8, 6]); c.beginPath(); c.moveTo(sx - 260, sy + 120); c.lineTo(sx - 260 + 246 * p, sy + 120 - 113 * p); c.stroke(); c.setLineDash([]);
      // side panel
      const X = 1180; txt(c, 'ORBITAL DEBRIS FIELD · LEO-3', X, 260, MONO(600, 26), PH, 'left', 'middle', 2);
      txt(c, `TRACKED OBJECTS .... ${(41207 + Math.floor(lt * 37)).toLocaleString('en-US')}`, X, 330, MONO(500, 22), PH, 'left', 'middle', 1);
      txt(c, 'UNTRACKED (EST.) ... 1.2 M', X, 370, MONO(500, 22), PH, 'left', 'middle', 1);
      txt(c, 'KESSLER INDEX ...... 0.91', X, 410, MONO(500, 22), AMB, 'left', 'middle', 1);
      if (lt > 0.9) { const k = Math.floor(lt * 4) % 2; c.fillStyle = k ? 'rgba(255,59,46,0.18)' : 'rgba(255,59,46,0.08)'; c.fillRect(X - 16, 470, 600, 120); c.strokeStyle = RED; c.lineWidth = 2; c.strokeRect(X - 16, 470, 600, 120);
        txt(c, '⚠ COLLISION ALERT · SAT-07', X + 4, 508, MONO(700, 26), RED, 'left', 'middle', 2); txt(c, `IMPACT PROBABILITY  ${Math.min(98, 61 + Math.floor((lt - 0.9) * 22))}%`, X + 4, 552, MONO(500, 22), TX, 'left', 'middle', 2); }
    });
    const k = prog(lt, 0, 0.2) * (1 - prog(lt, 2.8, 3)); c.fillStyle = `rgba(0,0,0,${1 - k})`; c.fillRect(0, 0, W, H);
  }

  function dossier(c, t) {
    const lt = t - 38, i = Math.min(5, Math.floor(lt / 1.15)), il = lt - i * 1.15;
    crtFrame(c, t, (c) => {
      txt(c, 'ARIADNE SYSTEMS · PERSONNEL FILE · MERIDIAN FLIGHT CREW', 300, 230, MONO(600, 22), PH, 'left', 'middle', 2);
      c.fillStyle = rgba(PH, 0.5); c.fillRect(300, 256, 1320, 2);
      txt(c, `${String(i + 1).padStart(2, '0')} / 06`, 1620, 230, MONO(600, 22), PH, 'right', 'middle', 2);
      // portrait frame: wireframe helmet + scan line
      const px = 300, py = 310, pw = 380, ph = 440; c.strokeStyle = rgba(PH, 0.8); c.lineWidth = 2; c.strokeRect(px, py, pw, ph);
      c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip(); c.strokeStyle = rgba(PH, 0.5); c.lineWidth = 1.5;
      for (let k = 0; k < 9; k++) { c.beginPath(); c.ellipse(px + pw / 2, py + 200, 120 - k * 3, 150, 0, Math.PI * (0.05 + k * 0.1), Math.PI * (0.95 + k * 0.1)); c.stroke(); }
      c.beginPath(); c.ellipse(px + pw / 2, py + 210, 78, 52, 0, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(px + 40, py + ph); c.quadraticCurveTo(px + pw / 2, py + 330, px + pw - 40, py + ph); c.stroke();
      const sy = py + ((il * 420) % ph); c.fillStyle = rgba(PH, 0.18); c.fillRect(px, sy, pw, 18); c.restore();
      const [nm, role, from] = CREW[i], X = 760;
      txt(c, typed(nm, lt, i * 1.15 + 0.05, 46), X, 360, MONO(700, 46), TX, 'left', 'middle', 2);
      txt(c, 'ROLE ...... ' + typed(role, lt, i * 1.15 + 0.3, 60), X, 450, MONO(500, 26), PH, 'left', 'middle', 2);
      txt(c, 'ORIGIN .... ' + typed(from, lt, i * 1.15 + 0.45, 60), X, 500, MONO(500, 26), PH, 'left', 'middle', 2);
      txt(c, 'CLEARANCE . ' + typed('LEVEL 5 · FLIGHT', lt, i * 1.15 + 0.55, 60), X, 550, MONO(500, 26), PH, 'left', 'middle', 2);
      if (il > 0.7) txt(c, 'STATUS .... CLEARED FOR LAUNCH', X, 620, MONO(700, 26), AMB, 'left', 'middle', 2);
      txt(c, 'BIOMETRIC LOCK ' + '▮'.repeat(Math.min(12, Math.floor(il * 14))), X, 720, MONO(500, 20), PHD, 'left', 'middle', 2);
    });
    if (il < 0.08) { c.fillStyle = 'rgba(124,255,160,0.10)'; c.fillRect(0, 0, W, H); }   // page-flip blip
    const k = prog(lt, 0, 0.2) * (1 - prog(lt, 6.8, 7)); c.fillStyle = `rgba(0,0,0,${1 - k})`; c.fillRect(0, 0, W, H);
  }

  // ---------- overlays ----------
  function rain(c, t, heavy = 1) {
    const fr = Math.round(t * FPS); c.save(); c.strokeStyle = 'rgba(210,220,235,0.16)'; c.lineWidth = 1.4; c.beginPath();
    for (let i = 0; i < 420 * heavy; i++) { const x = hash(i, fr, 1) * (W + 300) - 150, y = hash(i, fr, 2) * H, l = 30 + hash(i, 3) * 60; c.moveTo(x, y); c.lineTo(x - l * 0.18, y + l); }
    c.stroke(); c.restore();
  }
  function captions(c, t) { for (const [a, b, s] of CAPS) { if (t < a || t > b) continue; const k = prog(t, a, a + 0.45) * (1 - prog(t, b - 0.4, b)); c.save(); c.globalAlpha = k; c.shadowColor = 'rgba(0,0,0,0.95)'; c.shadowBlur = 16; txt(c, s, W / 2, AY1 - 64, SERIF(46), TX, 'center', 'middle', 0.5); c.restore(); } }
  function countdown(c, t) {
    if (t < 45.2 || t > 56.6) return; const rem = Math.max(0, IGN - t), a = prog(t, 45.2, 45.7), s = Math.floor(rem), cs = Math.floor((rem - s) * 100);
    c.save(); c.globalAlpha = a; c.shadowColor = rgba(PH, 0.7); c.shadowBlur = 10;
    txt(c, 'MERIDIAN · LAUNCH CONTROL', W - 70, AY0 + 40, MONO(600, 15), PH, 'right', 'middle', 3);
    txt(c, `T-00:00:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`, W - 70, AY0 + 84, MONO(600, 36), t > IGN - 0.3 ? AMB : PH, 'right', 'middle', 2);
    txt(c, t > IGN - 1.2 ? 'IGNITION SEQUENCE START' : t > BREACH ? 'HOLD OVERRIDDEN · GO' : 'ALL SYSTEMS NOMINAL', W - 70, AY0 + 122, MONO(600, 15), t > IGN - 1.2 ? AMB : t > BREACH ? RED : PH, 'right', 'middle', 3);
    c.restore();
    if (t >= BREACH && t < 55.4) { const k = out3(prog(t, BREACH + 0.1, BREACH + 0.4)), fl = Math.floor(t * 4) % 2 ? 1 : 0.5; c.save(); c.globalAlpha = k * fl; c.fillStyle = 'rgba(40,4,3,0.8)'; c.fillRect(70, AY0 + 30, 500, 92); c.strokeStyle = RED; c.lineWidth = 2; c.strokeRect(70, AY0 + 30, 500, 92);
      txt(c, '⚠ PERIMETER BREACH · SECTOR 4', 94, AY0 + 60, MONO(700, 19), RED, 'left', 'middle', 2); txt(c, 'HOSTILES INSIDE THE FENCE LINE', 94, AY0 + 96, MONO(500, 15), TX, 'left', 'middle', 3); c.restore();
      c.save(); c.globalAlpha = 0.07 * fl * k; c.fillStyle = RED; c.fillRect(0, AY0, W, AY1 - AY0); c.restore(); }
  }
  // segmented title (each glyph assembles from horizontal slices, like a stencil being punched out of the dark)
  let TITLE = null;
  function titleCard(c, t) {
    if (t < 57) return; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const S = 'ESCAPE VELOCITY'; c.font = F(300, 104); c.letterSpacing = '30px'; const tw = c.measureText(S).width; c.letterSpacing = '0px';
    if (!TITLE) { TITLE = document.createElement('canvas'); TITLE.width = W; TITLE.height = 200; const g = TITLE.getContext('2d'); txt(g, S, W / 2 + 15, 100, F(300, 104), TX, 'center', 'middle', 30); }
    const x0 = W / 2 - tw / 2, cw = tw / S.length, SL = 6, y0 = H / 2 - 40 - 100, sh = 200 / SL;
    for (let i = 0; i < S.length; i++) { if (S[i] === ' ') continue; for (let k = 0; k < SL; k++) {
      const ta = 57.25 + hash(i, k, 9) * 1.3; if (t < ta) continue; const a = prog(t, ta, ta + 0.12); const fl = t < ta + 0.2 ? (hash(i, k, Math.round(t * FPS)) > 0.4 ? 1 : 0.3) : 1;
      c.globalAlpha = a * fl; c.drawImage(TITLE, x0 + i * cw - 6, k * sh, cw + 4, sh, x0 + i * cw - 6, y0 + k * sh, cw + 4, sh); } }
    c.globalAlpha = 1;
    c.save(); c.globalAlpha = prog(t, 58.5, 59.0); c.fillStyle = rgba(TX, 0.45); c.fillRect(W / 2 - 240, H / 2 + 46, 480, 1); txt(c, 'EPISODE 01  ·  THE THRESHOLD', W / 2, H / 2 + 88, MONO(500, 19), '#A9A49A', 'center', 'middle', 8); c.restore();
    c.save(); c.globalAlpha = prog(t, 59.0, 59.4) * (1 - prog(t, 59.7, 60)); txt(c, 'TO BE CONTINUED', W / 2, AY1 - 70, SERIF(34), AMB, 'center', 'middle', 2); c.restore();
  }

  // ---------- frame ----------
  let GRAIN = null;
  async function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.letterSpacing = '0px'; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const sh = shotAt(t);
    if (sh) { const [name, a, b, dir] = sh;
      if (name === 'boot') boot(c, t); else if (name === 'radar') radar(c, t); else if (name === 'dossier') dossier(c, t);
      else { const f = Math.min(Math.round((b - a) * FPS), Math.floor((t - a) * FPS + 1e-6) + 1), im = await plate(dir, f);
        if (im) c.drawImage(im, 0, 0, W, H); else { c.fillStyle = '#111'; c.fillRect(0, 0, W, H); txt(c, `${dir} ${f}`, W / 2, H / 2, MONO(500, 30), '#555', 'center'); }
        if (RAIN.has(name)) rain(c, t, name === 'city' ? 0.6 : 1);
        const dip = Math.max(1 - prog(t, a, a + 0.4), prog(t, b - 0.3, b)); if (dip > 0) { c.fillStyle = `rgba(0,0,0,${dip})`; c.fillRect(0, 0, W, H); } } }
    countdown(c, t);
    if (t > 56.45 && t < 57.1) { const k = 1 - Math.abs(t - 56.65) / 0.45; c.fillStyle = `rgba(255,246,232,${clamp(k * 1.2)})`; c.fillRect(0, 0, W, H); }
    captions(c, t); titleCard(c, t);
    // grade: warm-green lift in the shadows, heavy grain, vignette, letterbox
    c.save(); c.globalCompositeOperation = 'lighten'; c.fillStyle = 'rgb(9,11,9)'; c.fillRect(0, 0, W, H); c.restore();
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 512; const g = GRAIN.getContext('2d'), d = g.createImageData(512, 512); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 11) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 30; } g.putImageData(d, 0, 0); }
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 512 | 0), -(hash(fr, 2) * 512 | 0)); c.fillRect(0, 0, W + 512, H + 512); c.restore();
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    c.fillStyle = '#000'; c.fillRect(0, 0, W, BAR); c.fillRect(0, H - BAR, W, BAR);
  }

  window.FILM = { W, H, FPS, DUR, renderAt, ready: document.fonts.ready.then(() => document.fonts.load(MONO(500, 20))).then(() => document.fonts.load(SERIF(40))).then(() => document.fonts.load(F(300, 100))) };
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = async () => { await renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
