// THE BLOCKCHAIN RUSH — 15s showreel introducing Thee_Kal_El. 1920x1080 @ 60fps.
// Locked to a 128 BPM grid: 32 beats = 8 bars = exactly 15s. Every scene cut is on a bar line,
// every word swap on a beat or an 8th. reel/synth.mjs composes the score from the same grid.
// Deterministic: renderAt(t) draws the frame at t seconds (open index.html to preview live).
(() => {
  'use strict';

  const W = 1920, H = 1080, CX = 960, CY = 540, DUR = 15, FPS = 60, TAU = Math.PI * 2, M = 96;
  const BPM = 128, BT = 60 / BPM, BAR = BT * 4;
  const T = (bar, beat = 0) => (bar * 4 + beat) * BT;

  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  const C = {
    bg: '#05060A', ink: '#F5F5F7', mute: '#8A8F98', card: '#0C0E13',
    gold: '#FFC24A', cyan: '#5CE1FF', blue: '#4F86FF', violet: '#9A7BFF', pink: '#FF5CD6', red: '#FF4D5E',
  };
  const F = {
    sans: (s, w = 800) => `${w} ${s}px "Inter Tight", sans-serif`,
    serif: (s) => `italic 400 ${s}px "Instrument Serif", serif`,
    mono: (s, w = 500) => `${w} ${s}px "JetBrains Mono", monospace`,
  };

  // ---------- math ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const frac = (x) => x - Math.floor(x);
  const E = {
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inCubic: (x) => x * x * x,
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inOutQuint: (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2),
    outBack: (x) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  };
  function rng(seed) {
    return () => {
      seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const R = rng(1849);
  function hash(a, b) { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; }
  function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
  function mix(a, b, k) {
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round(lerp((A >> s) & 255, (B >> s) & 255, clamp(k)));
    return '#' + ((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1);
  }
  // beat-relative helpers
  const beatIdx = (t) => Math.floor(t / BT + 1e-6);
  const beatPh = (t) => t - beatIdx(t) * BT;                      // seconds since last beat
  const pulse = (t, k = 10) => Math.exp(-beatPh(t) * k);           // decays after every beat

  // ---------- prerendered layers ----------
  const dotGrid = (() => { const c = mk(W, H), g = c.getContext('2d'); g.fillStyle = '#fff'; for (let y = 20; y < H; y += 40) for (let x = 20; x < W; x += 40) g.fillRect(x - 1, y - 1, 2, 2); return c; })();
  const vignette = (() => {
    const c = mk(W, H), g = c.getContext('2d');
    const gr = g.createRadialGradient(CX, CY, 420, CX, CY, 1150);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.7)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H); return c;
  })();
  const grains = Array.from({ length: 4 }, (_, k) => {
    const c = mk(W / 2, H / 2), g = c.getContext('2d'), im = g.createImageData(W / 2, H / 2), r = rng(k * 31 + 7);
    for (let i = 0; i < im.data.length; i += 4) { const v = (r() * 255) | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  });

  // ---------- primitives ----------
  function radial(c, x, y, r, col, a) {
    if (a <= 0.001 || r <= 0) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(0.45, rgba(col, a * 0.35)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function neonStroke(c, col, w, a) {
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(col, 0.10 * a); c.lineWidth = w * 7; c.stroke();
    c.strokeStyle = rgba(col, 0.28 * a); c.lineWidth = w * 3; c.stroke();
    c.strokeStyle = rgba(col, 0.9 * a); c.lineWidth = w * 1.3; c.stroke();
    c.strokeStyle = rgba('#FFFFFF', 0.85 * a); c.lineWidth = Math.max(0.8, w * 0.45); c.stroke();
    c.globalCompositeOperation = 'source-over';
  }

  // 3D block: 'glass' = see-through neon glass, 'solid' = shaded block. col tints the neon.
  const CV = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const CF = [[[0, 1, 2, 3], [0, 0, -1]], [[5, 4, 7, 6], [0, 0, 1]], [[4, 0, 3, 7], [-1, 0, 0]],
    [[1, 5, 6, 2], [1, 0, 0]], [[4, 5, 1, 0], [0, -1, 0]], [[3, 2, 6, 7], [0, 1, 0]]];
  const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const LIGHT = (() => { const v = [-0.45, -0.75, -0.5], l = Math.hypot(...v); return v.map((x) => x / l); })();
  function cube(c, x, y, h, rx, ry, o = {}) {
    const style = o.style || 'glass', alpha = o.alpha ?? 1, col = o.col || C.cyan, glow = o.glow ?? 1;
    if (alpha <= 0.005 || h < 0.5) return;
    const cx = Math.cos(rx), sxn = Math.sin(rx), cy = Math.cos(ry), syn = Math.sin(ry);
    const rot = ([a, b, d]) => { const x1 = a * cy + d * syn, z1 = -a * syn + d * cy; return [x1, b * cx - z1 * sxn, b * sxn + z1 * cx]; };
    const P = CV.map((v) => { const [a, b, d] = rot(v); const f = 5 / (5 + d); return [x + a * h * f, y + b * h * f, d]; });
    const faces = CF.map(([idx, n]) => { const nn = rot(n); return { idx, front: nn[2] < 0, z: idx.reduce((s, i) => s + P[i][2], 0) / 4, lit: clamp(nn[0] * LIGHT[0] + nn[1] * LIGHT[1] + nn[2] * LIGHT[2]) }; }).sort((a, b) => b.z - a.z);
    const poly = (idx) => { c.beginPath(); idx.forEach((i, k) => (k ? c.lineTo(P[i][0], P[i][1]) : c.moveTo(P[i][0], P[i][1]))); c.closePath(); };
    c.save(); c.globalAlpha = alpha; c.lineJoin = 'round'; c.lineCap = 'round';
    if (style === 'solid') {
      for (const f of faces) {
        if (!f.front) continue;
        const base = mix('#0A1432', mix('#4F86FF', '#9DBBFF', 0.3), f.lit);
        const p0 = P[f.idx[0]], p2 = P[f.idx[2]];
        const g = c.createLinearGradient(p0[0], p0[1], p2[0], p2[1]);
        g.addColorStop(0, mix(base, '#FFFFFF', 0.1 + 0.1 * f.lit)); g.addColorStop(1, base);
        poly(f.idx); c.fillStyle = g; c.fill();
        c.strokeStyle = rgba('#CFE0FF', 0.15 + 0.5 * f.lit); c.lineWidth = Math.max(1, h / 70); c.stroke();
      }
    } else if (style === 'holo') {
      // iridescent see-through: faces shift cyan→blue→violet→pink with orientation and time
      const w = Math.min(3.4, Math.max(1, h / 28)), tt = o.t || 0;
      const PAL = [C.cyan, C.blue, C.violet, C.pink];
      const hc = (k) => { k = frac(k) * 4; const i = Math.floor(k); return mix(PAL[i], PAL[(i + 1) % 4], k - i); };
      c.globalCompositeOperation = 'lighter'; radial(c, x, y, h * 2.6, C.violet, 0.14 * glow);
      for (const f of faces) {
        const k = f.idx[0] * 0.13 + f.lit * 0.4 + tt * 0.12;
        poly(f.idx);
        const p0 = P[f.idx[0]], p2 = P[f.idx[2]];
        const g = c.createLinearGradient(p0[0], p0[1], p2[0], p2[1]);
        const a0 = f.front ? 0.22 + 0.25 * f.lit : 0.10;
        g.addColorStop(0, rgba(hc(k), a0)); g.addColorStop(0.5, rgba(hc(k + 0.25), a0 * 0.8)); g.addColorStop(1, rgba(hc(k + 0.5), a0));
        c.fillStyle = g; c.fill();
      }
      c.globalCompositeOperation = 'source-over';
      for (const [a, b] of EDGES) {
        const fr = faces.some((f) => f.front && f.idx.includes(a) && f.idx.includes(b));
        c.beginPath(); c.moveTo(P[a][0], P[a][1]); c.lineTo(P[b][0], P[b][1]);
        neonStroke(c, fr ? hc((a + b) * 0.07 + tt * 0.15) : C.violet, fr ? w * 0.9 : w * 0.6, fr ? glow : 0.35 * glow);
      }
    } else {
      const w = Math.min(3.4, Math.max(1, h / 28));
      c.globalCompositeOperation = 'lighter'; radial(c, x, y, h * 2.6, col, 0.14 * glow); c.globalCompositeOperation = 'source-over';
      for (const f of faces) {
        poly(f.idx);
        const p0 = P[f.idx[0]], p2 = P[f.idx[2]];
        const g = c.createLinearGradient(p0[0], p0[1], p2[0], p2[1]);
        const a0 = f.front ? 0.10 + 0.22 * f.lit : 0.05;
        g.addColorStop(0, rgba(f.front ? '#BFE6FF' : C.blue, a0)); g.addColorStop(1, rgba(C.blue, a0 * 0.35));
        c.fillStyle = g; c.fill();
      }
      c.globalCompositeOperation = 'lighter'; radial(c, x, y, h * 0.9, col, 0.35 * glow); c.globalCompositeOperation = 'source-over';
      const edge = (front) => { c.beginPath(); for (const [a, b] of EDGES) { const fr = faces.some((f) => f.front && f.idx.includes(a) && f.idx.includes(b)); if (fr === front) { c.moveTo(P[a][0], P[a][1]); c.lineTo(P[b][0], P[b][1]); } } };
      edge(false); neonStroke(c, C.blue, w * 0.7, 0.45 * glow);
      edge(true); neonStroke(c, col, w, glow);
    }
    c.restore();
  }

  // Masked word-by-word rise. segs: [[text, font, fill, letterSpacing?], ...]
  function line(c, segs, x, y, size, t, o) {
    o = Object.assign({ t0: 0, dur: 0.55, st: 0.05, out: 99, outDur: 0.3, align: 'left', alpha: 1 }, o);
    if (t < o.t0 || t > o.out + o.outDur + 0.4) return;
    const words = [];
    c.save();
    for (const [txt, font, fill, ls = 0] of segs) {
      c.font = font; c.letterSpacing = ls + 'px';
      for (const p of txt.split(/(\s+)/)) { if (!p) continue; const w = c.measureText(p).width; words.push(/^\s+$/.test(p) ? { space: true, w } : { s: p, font, fill, w, ls }); }
    }
    const total = words.reduce((a, b) => a + b.w, 0);
    let px = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    c.beginPath(); c.rect(px - 60, y - size * 1.1, total + 120, size * 1.5); c.clip();
    c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    let k = 0;
    for (const wd of words) {
      if (wd.space) { px += wd.w; continue; }
      const pin = E.outExpo(prog(t, o.t0 + k * o.st, o.t0 + k * o.st + o.dur));
      const pout = E.inOutQuint(prog(t, o.out, o.out + o.outDur));
      c.globalAlpha = o.alpha * clamp(pin * 1.5) * (1 - pout);
      c.font = wd.font; c.letterSpacing = wd.ls + 'px';
      c.fillStyle = typeof wd.fill === 'function' ? wd.fill(c, px, wd.w, y, size) : wd.fill;
      c.fillText(wd.s, px, y + (1 - pin) * size * 1.15 - pout * size * 1.2);
      px += wd.w; k++;
    }
    c.restore();
  }
  function chars(c, str, x, y, size, t, o) {
    o = Object.assign({ t0: 0, dur: 0.6, st: 0.025, out: 99, outDur: 0.3, font: F.sans(size, 800), fill: () => C.ink, ls: -0.035 * size, align: 'left' }, o);
    if (t < o.t0) return;
    c.save(); c.font = o.font; c.letterSpacing = o.ls + 'px';
    const ws = [...str].map((ch) => c.measureText(ch).width), total = ws.reduce((a, b) => a + b, 0);
    let px = o.align === 'center' ? x - total / 2 : x;
    c.beginPath(); c.rect(px - 60, y - size * 1.05, total + 120, size * 1.35); c.clip();
    [...str].forEach((ch, i) => {
      const pin = E.outExpo(prog(t, o.t0 + i * o.st, o.t0 + i * o.st + o.dur));
      const pout = E.inOutQuint(prog(t, o.out, o.out + o.outDur));
      c.globalAlpha = clamp(pin * 1.5) * (1 - pout);
      c.fillStyle = o.fill(ch);
      c.fillText(ch, px, y + (1 - pin) * size * 1.1 - pout * size);
      px += ws[i];
    });
    c.restore();
  }
  // Hard-cut punch text: lands at full size with a quick scale settle (the cut itself is on the beat).
  function punch(c, str, x, y, font, fill, t, t0, o = {}) {
    if (t < t0) return;
    const k = E.outExpo(prog(t, t0, t0 + (o.dur || 0.22)));
    c.save(); c.font = font; c.letterSpacing = (o.ls || 0) + 'px'; c.textAlign = o.align || 'center'; c.textBaseline = 'alphabetic';
    c.translate(x, y); const s = lerp(o.from ?? 1.18, 1, k) * (o.scale || 1); c.scale(s, s);
    c.globalAlpha = (o.alpha ?? 1) * clamp(k * 4);
    if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.blur || 40; }
    c.fillStyle = typeof fill === 'function' ? fill(c, c.measureText(str).width) : fill;
    c.fillText(str, 0, 0);
    c.restore();
  }
  const grad = (a, b) => (c, w) => { const g = c.createLinearGradient(-w / 2, -80, w / 2, 40); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const lgrad = (a, b) => (c, x, w, y, size) => { const g = c.createLinearGradient(x, y - size, x + w, y); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const GOLD = lgrad('#FFE08A', '#FFAA2B');
  function label(c, s, x, y, a, col = C.mute, align = 'left', size = 18) {
    if (a <= 0.005) return;
    c.save(); c.globalAlpha = a; c.font = F.mono(size, 500); c.letterSpacing = '4px'; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); c.restore();
  }
  function chip(c, s, x, y, col, t, t0) {
    const k = E.outBack(prog(t, t0, t0 + 0.28));
    if (k <= 0) return 0;
    c.save(); c.font = F.mono(22, 700); c.letterSpacing = '3px';
    const w = c.measureText(s).width + 44;
    c.globalAlpha = clamp(k * 2); c.translate(x + w / 2, y); c.scale(k, k);
    c.beginPath(); c.roundRect(-w / 2, -26, w, 52, 26);
    c.fillStyle = rgba(col, 0.12); c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.stroke();
    c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, 1);
    c.restore();
    return w;
  }

  // ---------- photos ----------
  const loadImg = (src) => { const im = new Image(); im.src = src; return im.decode().then(() => im); };
  let portraitCv = null, socialsImg = null;
  const photosReady = Promise.all([loadImg('../assets/portrait.png'), loadImg('../assets/socials_card.jpg')]).then(([pi, si]) => {
    portraitCv = mk(pi.naturalWidth, pi.naturalHeight);
    const g = portraitCv.getContext('2d'); g.drawImage(pi, 0, 0);
    const fade = g.createLinearGradient(0, pi.naturalHeight * 0.7, 0, pi.naturalHeight);
    fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, 0, pi.naturalWidth, pi.naturalHeight);
    socialsImg = si;
  });

  // ---------- background ----------
  function background(c, t) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const ph = TAU * t / DUR;
    radial(c, CX, -200, 1300, '#2A4CB0', 0.16);
    radial(c, CX + Math.sin(ph) * 500, 820 + Math.cos(ph * 2) * 120, 900, C.blue, 0.05);
    radial(c, CX - Math.cos(ph) * 600, 300 + Math.sin(ph) * 140, 700, C.violet, 0.04);
    c.globalAlpha = 0.04 + 0.03 * pulse(t, 8); c.drawImage(dotGrid, 0, 0); c.globalAlpha = 1;
  }

  // ================= BAR 0 — HOOK: every rush, one per beat =================
  const DUST = Array.from({ length: 220 }, () => ({ x: R() * W, y: R() * H, s: 1 + R() * 3, v: 120 + R() * 380, w: R() * TAU }));
  const BURST = Array.from({ length: 16 }, (_, i) => ({ a: (i / 16) * TAU + R() * 0.3, r: 380 + R() * 520, h: 20 + R() * 34, sp: (R() - 0.5) * 5 }));
  function hook(c, t) {
    if (t >= T(1)) return;
    const b = beatIdx(t), bt = beatPh(t);
    if (b === 0) {
      radial(c, CX, CY, 900, C.gold, 0.18);
      for (const d of DUST) {
        const y = (d.y + t * d.v) % H, x = d.x + Math.sin(t * 3 + d.w) * 20;
        c.fillStyle = rgba(C.gold, 0.35 + 0.4 * hash(d.x | 0, 1)); c.fillRect(x, y, d.s, d.s * 2.2);
      }
      label(c, 'THE GOLD RUSH', CX, 300, 1, C.gold, 'center', 22);
      punch(c, '1849', CX, 660, F.sans(330, 800), grad('#FFE7A3', '#FF9F1C'), t, 0, { ls: -14, glow: rgba(C.gold, 0.5), blur: 60 });
    } else if (b === 1) {
      // dial-up era: perspective wire grid
      c.save(); c.strokeStyle = rgba(C.cyan, 0.35); c.lineWidth = 1.5;
      const HY = 620, sp = (bt * 260) % 60;
      for (let i = -24; i <= 24; i++) { c.beginPath(); c.moveTo(CX + i * 30, HY); c.lineTo(CX + i * 260, H); c.stroke(); }
      for (let k = 0; k < 14; k++) { const z = (k * 60 + sp) / 840; const y = HY + Math.pow(z, 2.2) * (H - HY); c.globalAlpha = z; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.restore();
      radial(c, CX, HY, 700, C.cyan, 0.16);
      label(c, 'THE INTERNET RUSH', CX, 300, 1, C.cyan, 'center', 22);
      punch(c, '1995', CX, 600, F.sans(330, 800), grad('#FFFFFF', '#9FE8FF'), t, T(0, 1), { ls: -14, glow: rgba(C.cyan, 0.5), blur: 60 });
    } else if (b === 2) {
      const k = E.outExpo(clamp(bt / 0.45));
      radial(c, CX, CY, 1000, C.violet, 0.2);
      for (const q of BURST) cube(c, CX + Math.cos(q.a) * q.r * k, CY + Math.sin(q.a) * q.r * k * 0.8, q.h, 0.5, q.a + q.sp * t, { col: hash(q.h | 0, 3) > 0.5 ? C.cyan : C.violet, alpha: 0.9 });
      label(c, 'THE BLOCKCHAIN RUSH', CX, 300, 1, C.cyan, 'center', 22);
      punch(c, 'NOW', CX, 660, F.sans(360, 800), grad(C.cyan, C.violet), t, T(0, 2), { ls: -12, glow: rgba(C.violet, 0.6), blur: 70 });
    } else {
      radial(c, CX, CY, 1000, C.gold, 0.12);
      punch(c, 'DON’T BE', CX, 470, F.sans(170, 800), C.ink, t, T(0, 3), { ls: -6 });
      punch(c, 'late.', CX + 20, 700, F.serif(280), grad('#FFE08A', '#FF9F1C'), t, T(0, 3) + 0.06, { glow: rgba(C.gold, 0.5), blur: 50 });
    }
  }

  // ================= BAR 1 — EARLY: adoption curve =================
  const sCurve = (u) => 1 / (1 + Math.exp(-11 * (u - 0.6)));
  function early(c, t) {
    if (t < T(1) || t >= T(2)) return;
    const X0 = M + 40, X1 = W - M - 40, Y0 = 940, Y1 = 470;
    const pt = (u) => [lerp(X0, X1, u), lerp(Y0, Y1, (sCurve(u) - sCurve(0)) / (sCurve(1) - sCurve(0)))];
    line(c, [['Every rush has', F.sans(92, 800), C.ink, -3]], M, 210, 92, t, { t0: T(1, 0) });
    line(c, [['an ', F.sans(92, 800), C.ink, -3], ['early crowd.', F.serif(112), GOLD]], M, 320, 92, t, { t0: T(1, 1) });
    // axis + stage labels
    c.strokeStyle = 'rgba(255,255,255,0.15)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(X0, Y0); c.lineTo(X1, Y0); c.stroke();
    ['INNOVATORS', 'EARLY ADOPTERS', 'EARLY MAJORITY', 'LATE MAJORITY', 'LAGGARDS'].forEach((s, i) => {
      label(c, s, lerp(X0, X1, 0.08 + i * 0.21), Y0 + 40, prog(t, T(1, 0.5) + i * 0.05, T(1, 0.5) + i * 0.05 + 0.2) * 0.8, C.mute, 'center', 16);
    });
    const d = E.outCubic(prog(t, T(1, 0), T(1, 2)));
    const MU = 0.24;
    // early zone fill (beat 3)
    const zk = E.outExpo(prog(t, T(1, 3), T(1, 3) + 0.3));
    if (zk > 0) {
      c.beginPath(); c.moveTo(X0, Y0);
      for (let i = 0; i <= 60; i++) { const [x, y] = pt((i / 60) * MU * zk); c.lineTo(x, y); }
      c.lineTo(pt(MU * zk)[0], Y0); c.closePath();
      const g = c.createLinearGradient(0, Y1, 0, Y0); g.addColorStop(0, rgba(C.gold, 0.35)); g.addColorStop(1, rgba(C.gold, 0.02));
      c.fillStyle = g; c.fill();
    }
    c.beginPath();
    for (let i = 0; i <= 200 * d; i++) { const [x, y] = pt(i / 200); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    const lg = c.createLinearGradient(X0, 0, X1, 0); lg.addColorStop(0, C.gold); lg.addColorStop(0.35, C.cyan); lg.addColorStop(1, C.violet);
    c.shadowColor = rgba(C.cyan, 0.7); c.shadowBlur = 20; c.strokeStyle = lg; c.lineWidth = 5; c.stroke(); c.shadowBlur = 0;
    // YOU ARE HERE (beat 2)
    const mk2 = E.outBack(prog(t, T(1, 2), T(1, 2) + 0.3));
    if (mk2 > 0) {
      const [x, y] = pt(MU);
      for (let r = 0; r < 2; r++) { const p = frac(beatPh(t) / BT + r * 0.5); c.strokeStyle = rgba(C.gold, 0.7 * (1 - p)); c.lineWidth = 2; c.beginPath(); c.arc(x, y, 12 + p * 50, 0, TAU); c.stroke(); }
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x, y, 11 * mk2, 0, TAU); c.fill();
      c.strokeStyle = rgba(C.gold, 0.8); c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 18); c.lineTo(x, y - 110 * mk2); c.stroke();
      label(c, 'YOU ARE HERE', x, y - 135 * mk2, clamp(mk2), C.gold, 'center', 22);
    }
    if (zk > 0) {
      c.save(); c.globalAlpha = zk; c.font = F.serif(64); c.fillStyle = C.ink; c.textAlign = 'left';
      c.fillText('It’s still early.', pt(MU)[0] + 160, pt(MU)[1] - 210); c.restore();
    }
  }

  // ================= BAR 2 — MEET =================
  function meet(c, t) {
    if (t < T(2) || t >= T(3)) return;
    const lt = t - T(2);
    // glass block on the right, clear of the portrait
    const ck = E.outBack(prog(t, T(2), T(2) + 0.5));
    cube(c, 1570, 500, 175 * ck, 0.5, lt * 0.9 + 0.6, { col: C.cyan, glow: 1 + 0.4 * pulse(t, 8) });
    // portrait centred under the headline, rising in beside the tagline
    if (portraitCv) {
      const pin = E.outExpo(prog(t, T(2), T(2) + 0.7));
      const s = 0.72, w = portraitCv.width * s, h = portraitCv.height * s, px = 1010;
      c.save(); c.globalAlpha = clamp(pin * 2);
      c.globalCompositeOperation = 'lighter'; radial(c, px, 560, 460, C.blue, 0.22); c.globalCompositeOperation = 'source-over';
      c.drawImage(portraitCv, px - w / 2, H - h + 12 + (1 - pin) * 300, w, h);
      c.restore();
    }
    line(c, [['Meet', F.serif(92), GOLD]], M + 4, 215, 92, t, { t0: T(2, 0) });
    chars(c, 'Thee_Kal_El', M, 360, 140, t, { t0: T(2, 1), fill: (ch) => (ch === '_' ? C.cyan : C.ink) });
    let x = M;
    x += chip(c, 'BLOCKCHAIN CREATOR', x, 452, C.cyan, t, T(2, 2)) + 14;
    x += chip(c, 'EDUCATOR', x, 452, C.violet, t, T(2, 2.5)) + 14;
    chip(c, 'UP & COMING', x, 452, C.gold, t, T(2, 3));
    line(c, [['Here so you’re', F.serif(60), '#D6D9E0']], M, 560, 60, t, { t0: T(2, 3), st: 0.03 });
    line(c, [['never late.', F.serif(76), GOLD]], M, 640, 76, t, { t0: T(2, 3) + 0.08, st: 0.03 });
  }

  // ================= BAR 3 — WHAT HE TEACHES (8 words on 8ths) =================
  const WORDS = [['WALLETS', 'your keys. your coins.'], ['DeFi', 'banking without the bank.'], ['NFTs', 'ownership, on-chain.'], ['LAYER 2s', 'faster. cheaper.'],
    ['ZK PROOFS', 'privacy by math.'], ['DAOs', 'internet-native orgs.'], ['STAKING', 'earn by securing.'], ['RWAs', 'real assets, tokenized.']];
  const PANELS = [null, C.cyan, null, C.gold, null, C.violet, null, '#FFFFFF'];
  let brightPanel = false;
  function teaches(c, t) {
    brightPanel = false;
    if (t < T(3) || t >= T(4)) return;
    const slot = Math.floor((t - T(3)) / (BT / 2) + 1e-6), st = t - T(3) - slot * BT / 2;
    const i = Math.min(7, slot), [word, sub] = WORDS[i], panel = PANELS[i];
    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]], [dx, dy] = dirs[i % 4];
    const wk = E.outExpo(clamp(st / 0.12));
    if (panel) {
      brightPanel = true;
      c.fillStyle = panel; c.fillRect((1 - wk) * dx * -W, (1 - wk) * dy * -H, W, H);
    } else if (i > 0) {
      c.fillStyle = C.bg; c.fillRect((1 - wk) * dx * -W, (1 - wk) * dy * -H, W, H);
      radial(c, CX, CY, 900, [C.cyan, C.gold, C.violet, C.pink][i % 4], 0.12);
    }
    const ink = panel ? '#06070B' : C.ink;
    // outline marquee of the word behind
    c.save(); c.font = F.sans(190, 800); c.letterSpacing = '-4px'; c.strokeStyle = rgba(panel ? '#000000' : '#FFFFFF', 0.12); c.lineWidth = 2;
    for (let r = 0; r < 5; r++) {
      const y = 110 + r * 220, off = ((t * 300 * (r % 2 ? 1 : -1)) % 1400 + 1400) % 1400;
      for (let k = -2; k < 3; k++) c.strokeText(word, k * 1400 - off + (r % 2) * 500, y);
    }
    c.restore();
    // small spinning block above the word
    cube(c, CX, 300, 46, 0.5, t * 2.2, { style: panel ? 'solid' : 'glass', col: C.cyan });
    punch(c, word, CX, 640, F.sans(230, 800), ink, t, T(3) + slot * BT / 2, { ls: -8, from: 1.25, dur: 0.16 });
    punch(c, sub, CX, 740, F.serif(64), panel ? 'rgba(6,7,11,0.8)' : '#C9CDD6', t, T(3) + slot * BT / 2 + 0.03, { from: 1.1, dur: 0.16 });
    label(c, `${String(i + 1).padStart(2, '0')} / 08`, CX, 860, 1, panel ? 'rgba(6,7,11,0.7)' : C.mute, 'center', 20);
    for (let k = 0; k < 8; k++) { c.fillStyle = k <= i ? (panel ? '#06070B' : C.cyan) : rgba(panel ? '#000000' : '#FFFFFF', 0.2); c.fillRect(CX - 8 * 28 / 2 + k * 28, 896, 20, 4); }
    label(c, 'WHAT HE TEACHES', CX, 200, 1, panel ? 'rgba(6,7,11,0.75)' : C.gold, 'center', 20);
  }

  // ================= BAR 4 — FOR EVERYONE: onboarding the masses =================
  const CROWD = Array.from({ length: 520 }, () => ({ y0: 430 + R() * 420, ph: R(), sp: 0.22 + R() * 0.18, w: R() * TAU, lane: (R() * 7) | 0, col: [C.cyan, C.gold, C.violet][(R() * 3) | 0] }));
  function everyone(c, t) {
    if (t < T(4) || t >= T(5)) return;
    const lt = t - T(4), GX = CX, GY = 640;
    for (const p of CROWD) {
      const u = frac(p.ph + lt * p.sp);
      const x = lerp(-60, W + 60, u);
      let y, col, r;
      if (x < GX) {
        const k = clamp((x - (GX - 380)) / 380); // funnel toward the gate
        y = lerp(p.y0 + Math.sin(lt * 4 + p.w) * 16, GY + (p.y0 - 640) * 0.15, E.inOutCubic(k)); col = rgba('#9AA0AA', 0.55); r = 2.4;
      } else {
        const k = E.outCubic(clamp((x - GX) / 300));
        y = lerp(GY, 470 + p.lane * 56, k); col = rgba(p.col, 0.9); r = 3;
      }
      c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
    // lanes on the right = organized, connected
    for (let l = 0; l < 7; l++) { const y = 470 + l * 56; const g = c.createLinearGradient(GX + 200, 0, W, 0); g.addColorStop(0, rgba(C.cyan, 0)); g.addColorStop(1, rgba(C.cyan, 0.18)); c.strokeStyle = g; c.lineWidth = 1.5; c.beginPath(); c.moveTo(GX + 200, y); c.lineTo(W, y); c.stroke(); }
    cube(c, GX, GY, 120 * (1 + 0.06 * pulse(t, 9)), 0.5, lt * 1.4 + 0.4, { col: C.gold, glow: 1.2 });
    label(c, 'ONBOARDING', GX, GY + 200, 0.9, C.gold, 'center', 18);
    // word timings ride the grid: "everyone." lands on beat 1, "Just" on beat 3
    line(c, [['Built for ', F.sans(92, 800), C.ink, -3], ['everyone.', F.serif(116), GOLD]], CX, 210, 92, t, { t0: T(4, 0), st: BT / 2, align: 'center' });
    line(c, [['No jargon. No gatekeeping. ', F.sans(40, 600), '#B4B9C3', -0.5], ['Just clarity.', F.serif(54), GOLD]], CX, 950, 44, t, { t0: T(4, 2), st: BT / 4, align: 'center' });
  }

  // ================= BAR 5 — LEARN: episode wall =================
  const EPS = ['What is a Blockchain?', 'Your First Wallet', 'DeFi in 60 Seconds', 'Spot a Rug Pull', 'Layer 2s, Explained', 'NFTs, Really?',
    'Staking 101', 'Bitcoin vs Ethereum', 'Gas Fees, Simply', 'Seed Phrases 101', 'What is a DAO?', 'Stablecoins, Explained'];
  const THUMB = [[C.blue, C.violet], [C.gold, C.red], [C.cyan, C.blue], [C.violet, C.pink], [C.gold, C.cyan], [C.pink, C.violet]];
  function learn(c, t) {
    if (t < T(5) || t >= T(6)) return;
    const lt = t - T(5);
    const steps = beatIdx(t) - beatIdx(T(5)), stepK = E.outExpo(clamp(beatPh(t) / 0.25));
    c.save(); c.translate(CX, CY); c.rotate(-0.12); c.scale(1.05 + 0.015 * pulse(t, 9), 1.05 + 0.015 * pulse(t, 9)); c.translate(-CX, -CY);
    const CWd = 420, CHt = 236, GAP = 36;
    for (let r = 0; r < 5; r++) {
      const dir = r % 2 ? 1 : -1, y = CY - 2 * (CHt + GAP) + r * (CHt + GAP) - CHt / 2;
      const off = dir * ((steps + stepK) * 120 + lt * 60);
      for (let k = -3; k < 7; k++) {
        const n = ((k + r * 3) % EPS.length + EPS.length) % EPS.length;
        const x = k * (CWd + GAP) + (off % (CWd + GAP)) - 200;
        const [a, b] = THUMB[(n + r) % THUMB.length];
        c.save(); c.beginPath(); c.roundRect(x, y, CWd, CHt, 18); c.clip();
        const g = c.createLinearGradient(x, y, x + CWd, y + CHt); g.addColorStop(0, mix(a, '#05060A', 0.45)); g.addColorStop(1, mix(b, '#05060A', 0.7));
        c.fillStyle = g; c.fillRect(x, y, CWd, CHt);
        radial(c, x + CWd * 0.75, y + CHt * 0.4, 160, a, 0.5);
        c.font = F.mono(16, 600); c.letterSpacing = '3px'; c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillText(`EP. ${String(n + 1).padStart(2, '0')}`, x + 22, y + 36);
        c.font = F.sans(34, 800); c.letterSpacing = '-1px'; c.fillStyle = '#FFFFFF';
        const words = EPS[n].split(' '); let l1 = '', l2 = '';
        for (const w of words) { if (c.measureText(l1 + w).width < 250 && !l2) l1 += w + ' '; else l2 += w + ' '; }
        c.fillText(l1.trim(), x + 22, y + 120); c.fillText(l2.trim(), x + 22, y + 160);
        c.fillStyle = 'rgba(255,255,255,0.92)'; c.beginPath(); c.arc(x + CWd - 70, y + 100, 34, 0, TAU); c.fill();
        c.fillStyle = '#06070B'; c.beginPath(); c.moveTo(x + CWd - 80, y + 84); c.lineTo(x + CWd - 54, y + 100); c.lineTo(x + CWd - 80, y + 116); c.closePath(); c.fill();
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.roundRect(x + CWd - 78, y + CHt - 46, 58, 28, 6); c.fill();
        c.font = F.mono(15, 600); c.letterSpacing = '0px'; c.fillStyle = '#fff'; c.fillText(`${(n % 3) + 0}:${String(30 + n * 7 % 29).padStart(2, '0')}`, x + CWd - 71, y + CHt - 26);
        c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(x, y + CHt - 6, CWd, 6);
        c.fillStyle = C.red; c.fillRect(x, y + CHt - 6, CWd * (0.2 + 0.7 * hash(n, r)), 6);
        c.restore();
      }
    }
    c.restore();
    // plate + headline
    c.save(); c.translate(CX, CY); c.scale(1, 0.42);
    const pg = c.createRadialGradient(0, 0, 0, 0, 0, 900); pg.addColorStop(0, 'rgba(5,6,10,0.92)'); pg.addColorStop(0.6, 'rgba(5,6,10,0.75)'); pg.addColorStop(1, 'rgba(5,6,10,0)');
    c.fillStyle = pg; c.fillRect(-900, -900, 1800, 1800); c.restore();
    punch(c, 'Learn it in minutes.', CX, 540, F.sans(118, 800), C.ink, t, T(5, 0), { ls: -4 });
    punch(c, 'Not years.', CX, 680, F.serif(140), grad('#FFE08A', '#FF9F1C'), t, T(5, 2), { glow: rgba(C.gold, 0.4) });
    label(c, 'FREE  ·  BITE-SIZED  ·  EVERY WEEK', CX, 400, prog(t, T(5, 1), T(5, 1) + 0.15), C.cyan, 'center', 20);
  }

  // ================= BAR 6 — THE RUSH IS ON: fly-through + 3·2·1 =================
  const CHAIN = Array.from({ length: 72 }, (_, i) => { const k = i - 14; return { k, z: k * 3.2, x: 1.4 * Math.sin(k * 0.45), ph: R() * TAU }; });
  const STREAK = Array.from({ length: 260 }, () => ({ a: R() * TAU, z: R(), col: [C.cyan, C.gold, C.violet][(R() * 3) | 0] }));
  function rush(c, t) {
    if (t < T(6) || t >= T(7)) return;
    const lt = t - T(6);
    const travel = 6 * lt + 4.5 * lt * lt;
    const camZ = -4 - travel,  // camera pulls back, so the chain streams away from the viewer (streaks still rush in)
      camX = 1.4 * Math.sin(((camZ + 9) / 3.2) * 0.45), FL = 900, HY = 600;
    // speed streaks
    c.globalCompositeOperation = 'lighter';
    const spd = 0.6 + lt * 1.4;
    for (const s of STREAK) {
      const z = frac(s.z - lt * spd * 0.5), z2 = Math.min(1, z + 0.02 + spd * 0.03);
      const r1 = 60 / (0.03 + z), r2 = 60 / (0.03 + z2);
      c.strokeStyle = rgba(s.col, 0.55 * clamp((1 - z) * 1.6)); c.lineWidth = 1 + 2 * (1 - z);
      c.beginPath(); c.moveTo(CX + Math.cos(s.a) * r2, HY + Math.sin(s.a) * r2 * 0.6); c.lineTo(CX + Math.cos(s.a) * r1, HY + Math.sin(s.a) * r1 * 0.6); c.stroke();
    }
    radial(c, CX, HY, 700, C.blue, 0.22 + 0.3 * lt / BAR);
    c.globalCompositeOperation = 'source-over';
    const vis = CHAIN.map((b) => ({ b, rel: b.z - camZ })).filter((o) => o.rel > 2 && o.rel < 90).sort((a, b) => b.rel - a.rel);
    for (const { b, rel } of vis) {
      const x = CX + (b.x - camX) * FL / rel, y = HY + 1.3 * FL / rel;
      const fog = clamp((90 - rel) / 55) * clamp((rel - 2) / 2);
      // far blocks are solid; the nearest one or two turn holographic as the camera reaches them
      const holo = E.inOutCubic(clamp((10 - rel) / 3));
      const h = 0.4 * FL / rel;
      if (holo < 1) cube(c, x, y, h, 0.42, lt * 1.5 + b.ph, { alpha: fog * (1 - holo), style: 'solid' });
      if (holo > 0) cube(c, x, y, h, 0.42, lt * 1.5 + b.ph, { alpha: fog * holo, style: 'holo', t, glow: 0.9 });
    }
    // copy: beat 0 headline, beats 1-3 countdown
    punch(c, 'THE RUSH IS ON.', CX, 250, F.sans(120, 800), C.ink, t, T(6, 0), { ls: -3 });
    label(c, 'DON’T WATCH FROM THE SIDELINES', CX, 320, prog(t, T(6, 0.5), T(6, 0.5) + 0.15), C.gold, 'center', 22);
    const b = beatIdx(t) - beatIdx(T(6));
    if (b >= 1) {
      const n = String(4 - b), bt = beatPh(t);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(C.gold, 0.8 * (1 - bt / BT)); c.lineWidth = 4; c.beginPath(); c.arc(CX, 640, 160 + E.outExpo(bt / BT) * 260, 0, TAU); c.stroke();
      c.restore();
      punch(c, n, CX, 790, F.sans(420, 800), grad('#FFFFFF', '#FFC24A'), t, T(6, b), { from: 1.5, dur: 0.2, glow: rgba(C.gold, 0.6), blur: 60 });
    }
  }

  // ================= BAR 7 — JOIN NOW (the drop) =================
  const PLATFORMS = 'YOUTUBE  ✦  TIKTOK  ✦  INSTAGRAM  ✦  TWITCH  ✦  KICK  ✦  ';
  function join(c, t) {
    if (t < T(7)) return;
    const lt = t - T(7);
    // shockwave on the drop
    for (const [dl, col] of [[0, C.gold], [0.05, C.cyan]]) {
      const p = clamp((lt - dl) / 0.7); if (p <= 0 || p >= 1) continue;
      c.strokeStyle = rgba(col, 1 - p); c.lineWidth = 30 * (1 - p) + 1; c.beginPath(); c.arc(CX, CY, E.outExpo(p) * 1300, 0, TAU); c.stroke();
    }
    radial(c, 520, 500, 700, C.violet, 0.22);
    if (socialsImg) {
      const k = E.outExpo(prog(t, T(7), T(7) + 0.6)), S = 600, x = 200 - (1 - k) * 800, y = 150;
      c.save(); c.globalAlpha = clamp(k * 1.5);
      c.save(); c.beginPath(); c.roundRect(x, y, S, S, 40); c.clip(); c.drawImage(socialsImg, x, y, S, S); c.restore();
      c.beginPath(); c.roundRect(x, y, S, S, 40); neonStroke(c, C.cyan, 2.4, 0.9 + 0.3 * pulse(t, 8));
      c.restore();
    }
    const RX = 900;
    label(c, 'NEW EPISODES WEEKLY', RX, 220, prog(t, T(7), T(7) + 0.2), C.gold, 'left', 22);
    chars(c, 'FOLLOW NOW', RX - 6, 370, 138, t, { t0: T(7, 0), st: 0.02, dur: 0.45 });
    chars(c, '@Thee_Kal_El', RX - 2, 480, 96, t, { t0: T(7, 1), st: 0.02, dur: 0.45, font: F.sans(96, 700), fill: (ch) => (ch === '_' ? C.cyan : ch === '@' ? C.gold : C.ink) });
    line(c, [['Blockchain, explained — ', F.sans(40, 500), '#B4B9C3', -0.5], ['before everyone else gets it.', F.serif(50), GOLD]], RX, 575, 44, t, { t0: T(7, 2), st: 0.03 });
    // JOIN NOW button, bouncing on every beat
    const k = E.outBack(prog(t, T(7, 3), T(7, 3) + 0.3));
    if (k > 0) {
      const s = k * (1 + 0.05 * pulse(t, 12)), w = 470, h = 104, x = RX + w / 2, y = 720;
      c.save(); c.translate(x, y); c.scale(s, s);
      c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, h / 2);
      const g = c.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, '#FFE08A'); g.addColorStop(1, '#FF9F1C');
      c.fillStyle = g; c.shadowColor = rgba(C.gold, 0.8); c.shadowBlur = 40 + 30 * pulse(t, 8); c.fill(); c.shadowBlur = 0;
      c.save(); c.clip(); const sx = lerp(-w, w, frac(lt / (BT * 2))); const sg = c.createLinearGradient(sx - 90, 0, sx + 90, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.6)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sg; c.fillRect(-w / 2, -h / 2, w, h); c.restore();
      c.font = F.sans(40, 800); c.letterSpacing = '1px'; c.fillStyle = '#140C00'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('JOIN NOW  →', 0, 3);
      c.restore();
    }
    // platform ticker
    const tk = prog(t, T(7), T(7) + 0.25);
    c.save(); c.globalAlpha = tk;
    c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(0, 880, W, 64);
    c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 880); c.lineTo(W, 880); c.moveTo(0, 944); c.lineTo(W, 944); c.stroke();
    c.font = F.mono(26, 700); c.letterSpacing = '6px'; c.textBaseline = 'middle';
    const tw = c.measureText(PLATFORMS).width, off = (lt * 260) % tw;
    for (let k2 = -1; k2 < 3; k2++) { c.fillStyle = C.ink; c.fillText(PLATFORMS, k2 * tw - off, 913); }
    c.restore();
  }

  // ---------- chrome: labels + beat counter ----------
  const SECT = ['THE RUSH', 'STILL EARLY', 'MEET', 'WHAT HE TEACHES', 'FOR EVERYONE', 'LEARN', 'THE RUSH IS ON', 'JOIN NOW'];
  function chrome(c, t) {
    const ink = brightPanel ? 'rgba(6,7,11,0.85)' : C.ink, mute = brightPanel ? 'rgba(6,7,11,0.6)' : C.mute;
    label(c, 'THEE_KAL_EL', M, 64, 0.9, ink);
    label(c, 'THE BLOCKCHAIN RUSH — 2026', W - M, 64, 0.7, mute, 'right');
    const bar = Math.min(7, Math.floor(t / BAR + 1e-6)), beat = beatIdx(t) % 4;
    c.save(); c.font = F.mono(18, 500); c.letterSpacing = '4px'; c.textBaseline = 'middle';
    c.fillStyle = brightPanel ? 'rgba(6,7,11,0.85)' : C.gold; c.fillText(String(bar + 1).padStart(2, '0'), M, H - 64);
    c.fillStyle = mute; c.fillText(SECT[bar], M + 52, H - 64); c.restore();
    for (let k = 0; k < 4; k++) {
      const on = k === beat, x = W - M - (4 - k) * 30;
      c.fillStyle = on ? (brightPanel ? '#06070B' : C.gold) : (brightPanel ? 'rgba(6,7,11,0.25)' : 'rgba(255,255,255,0.2)');
      const hh = on ? 6 + 10 * pulse(t, 12) : 6; c.fillRect(x, H - 64 - hh / 2, 20, hh);
    }
    label(c, `${BPM} BPM`, W - M - 140, H - 64, 0.6, mute, 'right', 16);
  }

  // ---------- frame ----------
  function renderAt(t) {
    t = clamp(t, 0, DUR - 1e-6);
    const frame = Math.round(t * FPS), c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0;
    // camera punch on every beat (bigger on bar lines), shake on the drop
    const onBar = beatIdx(t) % 4 === 0;
    const zoom = 1 + (onBar ? 0.025 : 0.01) * pulse(t, 10);
    const drop = t >= T(7) ? Math.exp(-(t - T(7)) * 6) : 0;
    const sx = (hash(frame, 1) - 0.5) * 30 * drop, sy = (hash(frame, 2) - 0.5) * 30 * drop;
    c.translate(CX + sx, CY + sy); c.scale(zoom, zoom); c.translate(-CX, -CY);
    background(c, t);
    hook(c, t); early(c, t); meet(c, t); teaches(c, t); everyone(c, t); learn(c, t); rush(c, t); join(c, t);
    c.setTransform(1, 0, 0, 1, 0, 0);
    chrome(c, t);
    // flash on every bar line (strong on the hook beats, countdown beats and the drop)
    const bi = beatIdx(t), ph = beatPh(t);
    const strong = bi < 4 || (bi >= 25 && bi < 28) || bi === 28;
    const fl = (bi % 4 === 0 || strong) ? (bi === 28 ? 0.85 : strong ? 0.35 : 0.22) * Math.exp(-ph * 22) : 0;
    if (fl > 0.004) { c.fillStyle = rgba('#FFF6E0', fl); c.fillRect(0, 0, W, H); }
    c.drawImage(vignette, 0, 0);
    c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.04; c.drawImage(grains[frame % 4], 0, 0, W, H);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // fade out on the last 8th
    const fo = prog(t, DUR - BT / 2, DUR);
    if (fo > 0) { c.fillStyle = rgba('#000000', E.inCubic(fo)); c.fillRect(0, 0, W, H); }
  }

  window.REEL = { W, H, DUR, FPS, BPM, renderAt };
  window.REEL.ready = Promise.all([document.fonts.load(F.sans(100)), document.fonts.load(F.serif(100)), document.fonts.load(F.mono(20))])
    .then(() => document.fonts.ready).then(() => photosReady);
  if (!/[?&]render\b/.test(location.search)) {
    window.REEL.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
  }
})();
