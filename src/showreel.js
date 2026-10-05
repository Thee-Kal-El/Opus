// THEE_KAL_EL — 15s looping showreel, 1080x1080.
// Deterministic: renderAt(t) draws the frame at t seconds, so the same code previews live
// (open index.html) and renders frame-exact for encoding (render/render.mjs).
(() => {
  'use strict';

  const W = 1080, H = 1080, CX = 540, CY = 540, DUR = 15, FPS = 60, TAU = Math.PI * 2;
  const M = 72; // outer margin

  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------- design tokens ----------
  const C = {
    bg: '#050608', ink: '#F5F5F7', mute: '#8A8F98', card: '#0C0E13',
    accent: '#4F86FF', accent2: '#9A7BFF',
  };
  const F = {
    sans: (s, w = 700) => `${w} ${s}px "Inter Tight", sans-serif`,
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
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inOutQuint: (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2),
  };
  function rng(seed) {
    return () => {
      seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const R = rng(20261005);
  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  function mix(a, b, k) {
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round(lerp((A >> s) & 255, (B >> s) & 255, clamp(k)));
    return '#' + ((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1);
  }

  // ---------- prerendered layers ----------
  const dotGrid = (() => {
    const c = mk(W, H), g = c.getContext('2d');
    g.fillStyle = '#FFFFFF';
    for (let y = 18; y < H; y += 36) for (let x = 18; x < W; x += 36) g.fillRect(x - 1, y - 1, 2, 2);
    return c;
  })();
  const vignette = (() => {
    const c = mk(W, H), g = c.getContext('2d');
    const gr = g.createRadialGradient(CX, CY, 300, CX, CY, 800);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.65)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H); return c;
  })();
  const grains = Array.from({ length: 4 }, (_, k) => {
    const c = mk(W / 2, H / 2), g = c.getContext('2d');
    const im = g.createImageData(W / 2, H / 2), r = rng(k * 977 + 3);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = (r() * 255) | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0); return c;
  });

  // ---------- drawing primitives ----------
  function radial(c, x, y, r, col, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(0.45, rgba(col, a * 0.35)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Shaded 3D cube. (x, y) screen centre, h = half-edge in px, rx/ry rotation,
  // tone 0 = graphite, 1 = accent. Back faces are culled, so no sorting needed.
  const CV = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const CF = [[[0, 1, 2, 3], [0, 0, -1]], [[5, 4, 7, 6], [0, 0, 1]], [[4, 0, 3, 7], [-1, 0, 0]],
    [[1, 5, 6, 2], [1, 0, 0]], [[4, 5, 1, 0], [0, -1, 0]], [[3, 2, 6, 7], [0, 1, 0]]];
  const LIGHT = (() => { const v = [-0.45, -0.75, -0.5], l = Math.hypot(...v); return v.map((x) => x / l); })();
  function cube(c, x, y, h, rx, ry, tone = 0, alpha = 1, style = STYLE) {
    if (alpha <= 0.005 || h < 0.5) return;
    if (style !== 'solid') return styledCube(c, x, y, h, rx, ry, tone, alpha, style);
    const cx = Math.cos(rx), sxn = Math.sin(rx), cy = Math.cos(ry), syn = Math.sin(ry);
    const rot = ([a, b, d]) => {
      const x1 = a * cy + d * syn, z1 = -a * syn + d * cy;
      return [x1, b * cx - z1 * sxn, b * sxn + z1 * cx];
    };
    const P = CV.map((v) => { const [a, b, d] = rot(v); const f = 5 / (5 + d); return [x + a * h * f, y + b * h * f]; });
    c.save(); c.globalAlpha = alpha; c.lineJoin = 'round';
    for (const [idx, n] of CF) {
      const nn = rot(n);
      if (nn[2] >= 0) continue;
      const lit = clamp(nn[0] * LIGHT[0] + nn[1] * LIGHT[1] + nn[2] * LIGHT[2]);
      const base = mix(mix('#0B0D12', '#2C313C', lit), mix('#0A1432', '#6E9BFF', lit), tone);
      const p0 = P[idx[0]], p2 = P[idx[2]];
      const g = c.createLinearGradient(p0[0], p0[1], p2[0], p2[1]);
      g.addColorStop(0, mix(base, '#FFFFFF', 0.08 + 0.1 * lit)); g.addColorStop(1, base);
      c.beginPath(); idx.forEach((i, k) => (k ? c.lineTo(...P[i]) : c.moveTo(...P[i]))); c.closePath();
      c.fillStyle = g; c.fill();
      c.strokeStyle = rgba(tone > 0.5 ? '#CFE0FF' : '#FFFFFF', 0.1 + 0.45 * lit); c.lineWidth = Math.max(1, h / 70);
      c.stroke();
    }
    c.restore();
  }

  // ---------- neon block styles ----------
  // STYLE picks the look for every block in the reel (?block=<name> overrides it for previews).
  const STYLES = ['solid', 'glass', 'holo', 'hyper', 'crystal', 'circuit'];
  let STYLE = (location.search.match(/[?&]block=(\w+)/) || [])[1] || 'glass';
  let curT = 0;
  const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const NEON = { cyan: '#5CE1FF', blue: '#4F86FF', violet: '#9A7BFF', pink: '#FF5CD6' };
  function geom(x, y, h, rx, ry) {
    const cx = Math.cos(rx), sxn = Math.sin(rx), cy = Math.cos(ry), syn = Math.sin(ry);
    const rot = ([a, b, d]) => { const x1 = a * cy + d * syn, z1 = -a * syn + d * cy; return [x1, b * cx - z1 * sxn, b * sxn + z1 * cx]; };
    const P = CV.map((v) => { const [a, b, d] = rot(v); const f = 5 / (5 + d); return [x + a * h * f, y + b * h * f, d]; });
    const faces = CF.map(([idx, n]) => {
      const nn = rot(n);
      return { idx, n: nn, front: nn[2] < 0, z: idx.reduce((s, i) => s + P[i][2], 0) / 4,
        lit: clamp(nn[0] * LIGHT[0] + nn[1] * LIGHT[1] + nn[2] * LIGHT[2]) };
    }).sort((a, b) => b.z - a.z);
    const edges = EDGES.map(([a, b]) => ({ a, b, front: faces.some((f) => f.front && f.idx.includes(a) && f.idx.includes(b)) }));
    return { P, faces, edges, rot };
  }
  const poly = (c, P, idx) => { c.beginPath(); idx.forEach((i, k) => (k ? c.lineTo(P[i][0], P[i][1]) : c.moveTo(P[i][0], P[i][1]))); c.closePath(); };
  // layered additive stroke = neon tube
  function neonStroke(c, col, w, a) {
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(col, 0.10 * a); c.lineWidth = w * 7; c.stroke();
    c.strokeStyle = rgba(col, 0.28 * a); c.lineWidth = w * 3; c.stroke();
    c.strokeStyle = rgba(col, 0.9 * a); c.lineWidth = w * 1.3; c.stroke();
    c.strokeStyle = rgba('#FFFFFF', 0.85 * a); c.lineWidth = Math.max(0.8, w * 0.45); c.stroke();
    c.globalCompositeOperation = 'source-over';
  }
  function edgePath(c, P, es) { c.beginPath(); for (const e of es) { c.moveTo(P[e.a][0], P[e.a][1]); c.lineTo(P[e.b][0], P[e.b][1]); } }
  const holoCol = (k) => { const pal = [NEON.cyan, NEON.blue, NEON.violet, NEON.pink]; k = frac(k) * 4; const i = Math.floor(k); return mix(pal[i], pal[(i + 1) % 4], k - i); };

  function styledCube(c, x, y, h, rx, ry, tone, alpha, style) {
    const { P, faces, edges, rot } = geom(x, y, h, rx, ry);
    const glow = 0.45 + 0.55 * tone;           // side/inactive blocks glow less
    const w = Math.min(3.2, Math.max(1, h / 28));
    c.save(); c.globalAlpha = alpha; c.lineJoin = 'round'; c.lineCap = 'round';
    // light spill under/around the block
    c.globalCompositeOperation = 'lighter';
    radial(c, x, y, h * 2.6, style === 'holo' ? NEON.violet : NEON.blue, 0.16 * glow);
    c.globalCompositeOperation = 'source-over';
    const back = edges.filter((e) => !e.front), front = edges.filter((e) => e.front);

    if (style === 'glass') {
      for (const f of faces) {
        poly(c, P, f.idx);
        const p0 = P[f.idx[0]], p2 = P[f.idx[2]];
        const g = c.createLinearGradient(p0[0], p0[1], p2[0], p2[1]);
        const a0 = f.front ? 0.10 + 0.22 * f.lit : 0.05;
        g.addColorStop(0, rgba(f.front ? '#BFE6FF' : NEON.blue, a0)); g.addColorStop(1, rgba(NEON.blue, a0 * 0.35));
        c.fillStyle = g; c.fill();
      }
      c.globalCompositeOperation = 'lighter'; radial(c, x, y, h * 0.9, NEON.cyan, 0.35 * glow); c.globalCompositeOperation = 'source-over';
      edgePath(c, P, back); neonStroke(c, NEON.blue, w * 0.7, 0.45 * glow);
      edgePath(c, P, front); neonStroke(c, NEON.cyan, w, glow);
    } else if (style === 'holo') {
      for (const f of faces) {
        const k = f.n[0] * 0.35 + f.n[1] * 0.25 + f.n[2] * 0.2 + curT * 0.12;
        poly(c, P, f.idx);
        const p0 = P[f.idx[0]], p2 = P[f.idx[2]];
        const g = c.createLinearGradient(p0[0], p0[1], p2[0], p2[1]);
        const a0 = f.front ? 0.22 + 0.25 * f.lit : 0.10;
        g.addColorStop(0, rgba(holoCol(k), a0)); g.addColorStop(0.5, rgba(holoCol(k + 0.25), a0 * 0.8)); g.addColorStop(1, rgba(holoCol(k + 0.5), a0));
        c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fill(); c.globalCompositeOperation = 'source-over';
      }
      edgePath(c, P, back); neonStroke(c, NEON.violet, w * 0.6, 0.35 * glow);
      for (const e of front) {
        c.beginPath(); c.moveTo(P[e.a][0], P[e.a][1]); c.lineTo(P[e.b][0], P[e.b][1]);
        neonStroke(c, holoCol((e.a + e.b) * 0.07 + curT * 0.15), w * 0.9, glow);
      }
    } else if (style === 'hyper') {
      // wire cube with a solid glowing core block inside, joined at the corners (tesseract)
      const inner = geom(x, y, h * 0.46, rx, -ry * 1.3 + 0.8);
      c.beginPath(); for (let i = 0; i < 8; i++) { c.moveTo(P[i][0], P[i][1]); c.lineTo(inner.P[i][0], inner.P[i][1]); }
      neonStroke(c, NEON.violet, w * 0.5, 0.45 * glow);
      edgePath(c, P, back); neonStroke(c, NEON.blue, w * 0.7, 0.5 * glow);
      for (const f of inner.faces) {
        if (!f.front) continue;
        poly(c, inner.P, f.idx);
        c.fillStyle = mix('#14306E', '#8FB8FF', f.lit); c.fill();
      }
      c.globalCompositeOperation = 'lighter'; radial(c, x, y, h * 0.8, NEON.blue, 0.35 * glow); c.globalCompositeOperation = 'source-over';
      edgePath(c, inner.P, inner.edges.filter((e) => e.front)); neonStroke(c, NEON.cyan, w * 0.6, glow);
      edgePath(c, P, front); neonStroke(c, NEON.cyan, w, glow);
      c.globalCompositeOperation = 'lighter';
      for (const p of P) { if (p[2] < 0.5) radial(c, p[0], p[1], w * 5, '#FFFFFF', 0.8 * glow); }
      c.globalCompositeOperation = 'source-over';
    } else if (style === 'crystal') {
      // frosted glass with a glowing core and an orbiting ring inside
      for (const f of faces) {
        if (f.front) continue;
        poly(c, P, f.idx); c.fillStyle = rgba('#9FC3FF', 0.06); c.fill();
      }
      edgePath(c, P, back); c.strokeStyle = rgba('#CFE0FF', 0.25 * glow); c.lineWidth = w * 0.6; c.stroke();
      c.globalCompositeOperation = 'lighter';
      radial(c, x, y, h * 1.1, NEON.cyan, 0.55 * glow); radial(c, x, y, h * 0.35, '#FFFFFF', 0.9 * glow);
      c.globalCompositeOperation = 'source-over';
      c.save(); c.translate(x, y); c.rotate(curT * 1.2); c.scale(1, 0.35);
      c.beginPath(); c.arc(0, 0, h * 0.62, 0, TAU); c.restore(); neonStroke(c, NEON.violet, w * 0.5, glow);
      for (const f of faces) {
        if (!f.front) continue;
        poly(c, P, f.idx);
        const p0 = P[f.idx[0]], p2 = P[f.idx[2]];
        const g = c.createLinearGradient(p0[0], p0[1], p2[0], p2[1]);
        g.addColorStop(0, rgba('#FFFFFF', 0.20 + 0.25 * f.lit)); g.addColorStop(0.55, rgba('#BFD6FF', 0.08)); g.addColorStop(1, rgba('#7FA8FF', 0.14));
        c.fillStyle = g; c.fill();
      }
      edgePath(c, P, front); c.strokeStyle = rgba('#FFFFFF', 0.75); c.lineWidth = w * 0.8; c.stroke();
      edgePath(c, P, front); neonStroke(c, NEON.cyan, w * 0.5, 0.5 * glow);
    } else if (style === 'circuit') {
      // dark smoked glass with live neon circuitry on each visible face
      for (const f of faces) {
        poly(c, P, f.idx);
        c.fillStyle = f.front ? rgba(mix('#060B1E', '#16264F', f.lit), 0.78) : rgba('#0A1430', 0.35); c.fill();
      }
      for (const f of faces) {
        if (!f.front) continue;
        const [p0, p1, p2, p3] = f.idx.map((i) => P[i]);
        const at = (u, v) => [lerp(lerp(p0[0], p1[0], u), lerp(p3[0], p2[0], u), v), lerp(lerp(p0[1], p1[1], u), lerp(p3[1], p2[1], u), v)];
        c.beginPath();
        for (let k = 1; k < 4; k++) { const a = at(k / 4, 0.12), b = at(k / 4, 0.88); c.moveTo(...a); c.lineTo(...b); const d = at(0.12, k / 4), e2 = at(0.88, k / 4); c.moveTo(...d); c.lineTo(...e2); }
        c.strokeStyle = rgba(NEON.blue, 0.22 * glow); c.lineWidth = Math.max(0.7, w * 0.35); c.stroke();
        // traveling data pulses
        for (let k = 1; k < 4; k++) {
          const u = frac(curT * 0.8 + k * 0.31 + f.idx[0] * 0.13);
          const a = at(k / 4, lerp(0.12, 0.88, u)), b = at(lerp(0.12, 0.88, frac(u + 0.5)), k / 4);
          c.globalCompositeOperation = 'lighter';
          radial(c, a[0], a[1], w * 4, NEON.cyan, 0.9 * glow); radial(c, b[0], b[1], w * 4, NEON.pink, 0.7 * glow);
          c.globalCompositeOperation = 'source-over';
        }
        const cc = at(0.5, 0.5);
        c.fillStyle = rgba(NEON.cyan, 0.8 * glow); c.fillRect(cc[0] - w * 1.5, cc[1] - w * 1.5, w * 3, w * 3);
      }
      edgePath(c, P, back); neonStroke(c, NEON.blue, w * 0.5, 0.3 * glow);
      edgePath(c, P, front); neonStroke(c, NEON.cyan, w * 0.9, glow);
    }
    c.restore();
  }

  // A line of mixed-font segments that reveals word by word from behind a mask and exits upward.
  // segs: [[text, font, fill, letterSpacing?], ...]
  function line(c, segs, x, y, size, t, o) {
    o = Object.assign({ t0: 0, dur: 0.7, st: 0.06, out: 99, outDur: 0.4, align: 'left', alpha: 1 }, o);
    if (t < o.t0 || t > o.out + o.outDur + 0.5) return;
    const words = [];
    c.save();
    for (const [txt, font, fill, ls = 0] of segs) {
      c.font = font; c.letterSpacing = ls + 'px';
      for (const p of txt.split(/(\s+)/)) {
        if (!p) continue;
        const w = c.measureText(p).width;
        words.push(/^\s+$/.test(p) ? { space: true, w } : { s: p, font, fill, w, ls });
      }
    }
    const total = words.reduce((a, b) => a + b.w, 0);
    let px = o.align === 'center' ? x - total / 2 : x;
    c.beginPath(); c.rect(px - 40, y - size * 1.05, total + 80, size * 1.45); c.clip();
    c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    let k = 0;
    for (const wd of words) {
      if (wd.space) { px += wd.w; continue; }
      const pin = E.outExpo(prog(t, o.t0 + k * o.st, o.t0 + k * o.st + o.dur));
      const pout = E.inOutQuint(prog(t, o.out + k * o.st * 0.5, o.out + k * o.st * 0.5 + o.outDur));
      const dy = (1 - pin) * size * 1.15 - pout * size * 1.2;
      c.globalAlpha = o.alpha * clamp(pin * 1.5) * (1 - pout);
      c.font = wd.font; c.letterSpacing = wd.ls + 'px';
      c.fillStyle = typeof wd.fill === 'function' ? wd.fill(c, px, wd.w, y, size) : wd.fill;
      c.fillText(wd.s, px, y + dy);
      px += wd.w; k++;
    }
    c.restore();
  }
  // Per-character variant, used for the name.
  function chars(c, str, x, y, size, t, o) {
    o = Object.assign({ t0: 0, dur: 0.8, st: 0.03, out: 99, outDur: 0.4, font: F.sans(size, 700), fill: C.ink, ls: -0.035 * size }, o);
    if (t < o.t0 || t > o.out + o.outDur + 0.6) return;
    c.save(); c.font = o.font; c.letterSpacing = o.ls + 'px';
    const ws = [...str].map((ch) => c.measureText(ch).width);
    const total = ws.reduce((a, b) => a + b, 0);
    let px = o.align === 'left' ? x : x - total / 2;
    c.beginPath(); c.rect(px - 40, y - size * 1.0, total + 80, size * 1.3); c.clip();
    c.textBaseline = 'alphabetic';
    [...str].forEach((ch, i) => {
      const pin = E.outExpo(prog(t, o.t0 + i * o.st, o.t0 + i * o.st + o.dur));
      const pout = E.inOutQuint(prog(t, o.out + i * o.st * 0.6, o.out + i * o.st * 0.6 + o.outDur));
      c.globalAlpha = clamp(pin * 1.5) * (1 - pout);
      c.fillStyle = typeof o.fill === 'function' ? o.fill(ch) : o.fill;
      c.fillText(ch, px, y + (1 - pin) * size * 1.1 - pout * size * 1.15);
      px += ws[i];
    });
    c.restore();
  }
  const accentFill = (c, x, w, y, size) => {
    const g = c.createLinearGradient(x, y - size, x + w, y);
    g.addColorStop(0, '#6E9BFF'); g.addColorStop(1, C.accent2); return g;
  };
  const nameFill = (ch) => (ch === '_' ? C.accent : C.ink);
  function label(c, s, x, y, a, col = C.mute, align = 'left') {
    if (a <= 0.005) return;
    c.save(); c.globalAlpha = a; c.font = F.mono(17, 500); c.letterSpacing = '3px';
    c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); c.restore();
  }

  // ---------- timeline ----------
  const SECTIONS = [[0, 1, '00', 'INTRO'], [1, 3.5, '01', 'IDENTITY'], [3.5, 6.5, '02', 'PROJECTS'],
    [6.5, 9.5, '03', 'RESEARCH'], [9.5, 12.5, '04', 'WHAT’S NEXT'], [12.5, 15, '05', 'FOLLOW']];

  // The hero block sits at the loop seam in the same pose at 15s and 0s, and anchors identity + end card.
  function heroState(t) {
    const ry = TAU * (t / DUR) * 2 + 0.62;
    const rx = 0.5 + 0.08 * Math.sin(TAU * t / DUR);
    const m = E.inOutCubic(prog(t, 0.92, 1.6));
    let x = lerp(CX, 770, m), y = lerp(330, 560, m), h = lerp(62, 145, m), a = 1;
    if (t >= 3.1 && t < 12.5) { const k = E.inOutCubic(prog(t, 3.1, 3.5)); h *= 1 - k; a = 1 - k; }
    if (t >= 12.5) { const k = E.outExpo(prog(t, 14.3, 14.95)); x = CX; y = 330; h = 62 * k; a = clamp(k * 1.2); }
    return { x, y, h, a, rx, ry };
  }

  // ---------- background + chrome ----------
  function background(c, t) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const ph = TAU * t / DUR;
    radial(c, CX, -120, 950, '#2A4CB0', 0.16);
    radial(c, CX + Math.sin(ph) * 220, 760 + Math.cos(ph * 2) * 90, 620, C.accent, 0.05);
    radial(c, CX - Math.cos(ph) * 260, 380 + Math.sin(ph) * 120, 520, C.accent2, 0.035);
    c.globalAlpha = 0.045; c.drawImage(dotGrid, 0, 0); c.globalAlpha = 1;
  }

  function chrome(c, t) {
    label(c, 'THEE_KAL_EL', M, M, 0.9, C.ink);
    label(c, 'BLOCKCHAIN — RESEARCH', W - M, M, 0.55, C.mute, 'right');
    for (const [a, b, n, name] of SECTIONS) {
      const k = Math.min(prog(t, a, a + 0.3), 1 - prog(t, b - 0.2, b));
      if (k <= 0) continue;
      c.save(); c.globalAlpha = k; c.translate(0, (1 - k) * 8);
      c.font = F.mono(17, 500); c.letterSpacing = '3px'; c.textBaseline = 'middle';
      c.fillStyle = C.accent; c.fillText(n, M, H - M);
      c.fillStyle = C.mute; c.fillText(name, M + 44, H - M);
      c.restore();
    }
    const p = 0.5 + 0.5 * Math.cos(TAU * t * 2);
    c.fillStyle = rgba(C.accent, 0.5 + 0.5 * p);
    c.beginPath(); c.arc(W - M - 64, H - M, 4, 0, TAU); c.fill();
    label(c, 'LIVE', W - M, H - M, 0.55, C.mute, 'right');
  }

  // ---------- 00 hook ----------
  function hook(c, t) {
    if (t > 1.3) return;
    const k = prog(t, 0, 0.9);
    if (k > 0 && k < 1) {
      c.strokeStyle = rgba('#9DBBFF', 0.35 * (1 - k)); c.lineWidth = 1.5;
      c.beginPath(); c.arc(CX, 330, 70 + E.outExpo(k) * 420, 0, TAU); c.stroke();
    }
    line(c, [['The future', F.sans(124, 700), C.ink, -4.5]], CX, 610, 124, t, { t0: 0.02, st: 0.07, dur: 0.6, out: 0.8, outDur: 0.32, align: 'center' });
    line(c, [['is ', F.sans(124, 700), C.ink, -4.5], ['on-chain.', F.serif(140), accentFill]], CX, 740, 124, t,
      { t0: 0.14, st: 0.07, dur: 0.6, out: 0.84, outDur: 0.32, align: 'center' });
  }

  // ---------- 01 identity: chain + name ----------
  function identity(c, t) {
    if (t < 0.95 || t > 3.6) return;
    label(c, 'BLOCKCHAIN  ·  PROJECTS  ·  FUTURE', M, 168, prog(t, 1.55, 1.9) * (1 - prog(t, 3.05, 3.25)), C.mute);
    chars(c, 'Thee_Kal_El', M, 272, 86, t, { t0: 1.22, st: 0.032, dur: 0.85, out: 3.08, outDur: 0.34, fill: nameFill, align: 'left' });
    line(c, [['your guide to what’s next,', F.serif(48), '#C9CDD6']], M, 348, 48, t, { t0: 1.7, st: 0.04, dur: 0.7, out: 3.12, outDur: 0.32 });
    line(c, [['on-chain.', F.serif(48), accentFill]], M, 398, 48, t, { t0: 1.82, st: 0.04, dur: 0.7, out: 3.16, outDur: 0.32 });
  }

  // ---------- photos ----------
  const PORTRAIT = { cx: 300, scale: 0.6 };
  const loadImg = (src) => { const im = new Image(); im.src = src; return im.decode().then(() => im); };
  let portraitCv = null, socialsImg = null;
  const photosReady = Promise.all([loadImg('assets/portrait.png'), loadImg('assets/socials_card.jpg')]).then(([pi, si]) => {
    // bake a soft fade into the bottom of the cut-out so it melts into the floor
    portraitCv = mk(pi.naturalWidth, pi.naturalHeight);
    const g = portraitCv.getContext('2d');
    g.drawImage(pi, 0, 0);
    const fade = g.createLinearGradient(0, pi.naturalHeight * 0.72, 0, pi.naturalHeight);
    fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, 0, pi.naturalWidth, pi.naturalHeight);
    socialsImg = si;
  });

  // identity: portrait slides in from the left, under the text column (the glass block stays clear on the right)
  function portrait(c, t) {
    if (!portraitCv || t < 1.0 || t > 3.6) return;
    const pin = E.outExpo(prog(t, 1.12, 2.0)), pout = E.inOutCubic(prog(t, 3.02, 3.45));
    const a = clamp(prog(t, 1.12, 1.55)) * (1 - pout);
    if (a <= 0.01) return;
    const w = portraitCv.width * PORTRAIT.scale, h = portraitCv.height * PORTRAIT.scale;
    const x = PORTRAIT.cx - w / 2 - (1 - pin) * 420 - pout * 320, y = H - h + 10;
    c.save(); c.globalAlpha = a;
    c.globalCompositeOperation = 'lighter';
    radial(c, x + w / 2, y + h * 0.35, 420, C.accent, 0.18);
    c.globalCompositeOperation = 'source-over';
    c.drawImage(portraitCv, x, y, w, h);
    c.restore();
  }

  // end card: socials card slides in from the left with a neon glass frame
  function socials(c, t) {
    if (!socialsImg || t < 12.45 || t > 14.8) return;
    const pin = E.outExpo(prog(t, 12.5, 13.35)), pout = E.inOutCubic(prog(t, 14.25, 14.65));
    const a = clamp(prog(t, 12.5, 12.9)) * (1 - pout);
    if (a <= 0.01) return;
    const S = 560, x = (W - S) / 2 - (1 - pin) * 520 - pout * 420, y = 170, r = 36;
    c.save(); c.globalAlpha = a;
    c.globalCompositeOperation = 'lighter';
    radial(c, x + S / 2, y + S / 2, S * 0.9, C.accent2, 0.22);
    c.globalCompositeOperation = 'source-over';
    c.save(); c.beginPath(); c.roundRect(x, y, S, S, r); c.clip();
    c.drawImage(socialsImg, x, y, S, S);
    c.restore();
    c.beginPath(); c.roundRect(x, y, S, S, r);
    neonStroke(c, '#5CE1FF', 2.2, 0.9);
    c.restore();
  }

  // ---------- 02 projects carousel ----------
  const PROJECTS = [
    ['DeFi', 'Lending, DEXs, yield.'], ['Layer 2', 'Scaling, made usable.'], ['ZK Proofs', 'Privacy by math.'],
    ['RWA', 'Real assets, on-chain.'], ['DePIN', 'Physical networks.'], ['AI × Crypto', 'Agents with wallets.'],
    ['Restaking', 'Shared security.'],
  ].map(([name, desc], i) => {
    const vals = []; let v = 0.3;
    for (let k = 0; k < 30; k++) { v += 0.022 + (R() - 0.5) * 0.08; vals.push(v); }
    const mn = Math.min(...vals), mx = Math.max(...vals);
    return { name, desc, i, vals: vals.map((x) => (x - mn) / (mx - mn)), ph: R() * TAU };
  });
  function projects(c, t) {
    if (t < 3.4 || t > 6.7) return;
    label(c, 'WHAT YOU GET', M, 196, prog(t, 3.55, 3.85) * (1 - prog(t, 6.15, 6.35)), C.accent);
    line(c, [['Every project,', F.sans(92, 700), C.ink, -3.2]], M, 300, 92, t, { t0: 3.5, out: 6.18 });
    line(c, [['decoded.', F.serif(108), accentFill]], M, 400, 92, t, { t0: 3.62, out: 6.22 });

    const CW = 300, CH = 360, GAP = 28, Y = 488;
    const scroll = (1 - E.outExpo(prog(t, 3.6, 4.6))) * 520 - E.inOutCubic(prog(t, 4.2, 6.4)) * 760;
    const out = E.inOutQuint(prog(t, 6.15, 6.5));
    for (const p of PROJECTS) {
      const x = M + p.i * (CW + GAP) + scroll - out * 300;
      if (x > W + 20 || x + CW < -20) continue;
      const pin = E.outExpo(prog(t, 3.65 + p.i * 0.07, 4.4 + p.i * 0.07));
      const a = pin * (1 - out);
      if (a <= 0.01) continue;
      const yy = Y + (1 - pin) * 80;
      const focus = clamp(1 - Math.abs(x + CW / 2 - CX) / 360);
      c.save(); c.globalAlpha = a;
      c.beginPath(); c.roundRect(x, yy, CW, CH, 22);
      const g = c.createLinearGradient(0, yy, 0, yy + CH);
      g.addColorStop(0, mix(C.card, '#1A1F2B', 0.6 + 0.4 * focus)); g.addColorStop(1, C.card);
      c.fillStyle = g; c.fill();
      c.strokeStyle = rgba(mix('#262B36', C.accent, focus), 0.7 + 0.3 * focus); c.lineWidth = 1.5; c.stroke();
      c.clip();
      const sh = c.createLinearGradient(0, yy, 0, yy + 90);
      sh.addColorStop(0, 'rgba(255,255,255,0.05)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = sh; c.fillRect(x, yy, CW, 90);
      c.font = F.mono(16, 500); c.letterSpacing = '2px'; c.fillStyle = C.mute; c.textBaseline = 'alphabetic';
      c.fillText(String(p.i + 1).padStart(2, '0'), x + 26, yy + 44);
      c.font = F.sans(40, 650); c.letterSpacing = '-1px'; c.fillStyle = C.ink;
      c.fillText(p.name, x + 26, yy + 218);
      c.font = F.sans(21, 400); c.letterSpacing = '0px'; c.fillStyle = C.mute;
      c.fillText(p.desc, x + 26, yy + 252);
      const cx0 = x + 26, cw = CW - 52, cy0 = yy + 278, chh = 56;
      c.beginPath();
      p.vals.forEach((v, k) => { const px = cx0 + (k / (p.vals.length - 1)) * cw, py = cy0 + chh - v * chh; k ? c.lineTo(px, py) : c.moveTo(px, py); });
      const lc = mix('#6B7180', '#7EA6FF', focus);
      c.strokeStyle = lc; c.lineWidth = 2; c.stroke();
      c.lineTo(cx0 + cw, cy0 + chh); c.lineTo(cx0, cy0 + chh); c.closePath();
      const fg = c.createLinearGradient(0, cy0, 0, cy0 + chh);
      fg.addColorStop(0, rgba(lc, 0.22)); fg.addColorStop(1, rgba(lc, 0)); c.fillStyle = fg; c.fill();
      c.restore();
      cube(c, x + CW - 62, yy + 98, 30, 0.5, t * 0.9 + p.ph, focus, a);
    }
  }

  // ---------- 03 noise → signal ----------
  const DOTS = Array.from({ length: 420 }, (_, i) => ({ x: M + R() * (W - 2 * M), y: 470 + R() * 460, ph: R() * TAU, sp: 0.6 + R() * 1.4, u: i / 419 }));
  const curve = (u) => {
    const f = 0.1 + 0.72 * Math.pow(u, 1.7) + 0.05 * Math.sin(u * 8.5) * (1 - u * 0.6);
    return [M + 20 + u * (W - 2 * M - 40), 930 - f * 430];
  };
  function signal(c, t) {
    if (t < 6.4 || t > 9.7) return;
    const out = E.inOutQuint(prog(t, 9.15, 9.5));
    label(c, 'THE METHOD', M, 196, prog(t, 6.55, 6.85) * (1 - prog(t, 9.1, 9.3)), C.accent);
    line(c, [['Less noise.', F.sans(92, 700), C.ink, -3.2]], M, 300, 92, t, { t0: 6.5, out: 9.12 });
    line(c, [['More ', F.sans(92, 700), C.ink, -3.2], ['signal.', F.serif(108), accentFill]], M, 400, 92, t, { t0: 7.35, out: 9.18 });

    const ain = prog(t, 6.5, 6.9);
    for (const d of DOTS) {
      const jx = Math.sin(t * 3.1 * d.sp + d.ph) * 14, jy = Math.cos(t * 2.7 * d.sp + d.ph * 1.3) * 14;
      const [cxp, cyp] = curve(d.u);
      const k = E.inOutCubic(prog(t, 7.35 + d.u * 0.55, 8.05 + d.u * 0.55));
      const x = lerp(d.x + jx, cxp, k), y = lerp(d.y + jy, cyp, k) - out * 40;
      c.fillStyle = rgba(mix('#7A808C', '#7EA6FF', k), (0.6 + 0.35 * k) * ain * (1 - out));
      c.beginPath(); c.arc(x, y, 2.4 + 0.6 * k, 0, TAU); c.fill();
    }
    const dl = E.inOutCubic(prog(t, 8.0, 8.9));
    if (dl > 0) {
      c.save(); c.globalAlpha = 1 - out; c.translate(0, -out * 40);
      c.beginPath();
      const n = 120;
      for (let i = 0; i <= n * dl; i++) { const [x, y] = curve(i / n); i ? c.lineTo(x, y) : c.moveTo(x, y); }
      const g = c.createLinearGradient(M, 0, W - M, 0);
      g.addColorStop(0, rgba('#6E9BFF', 0.2)); g.addColorStop(1, C.accent2);
      c.shadowColor = rgba(C.accent, 0.8); c.shadowBlur = 18; c.strokeStyle = g; c.lineWidth = 3.5; c.stroke();
      c.shadowBlur = 0;
      const [ex, ey] = curve(dl);
      const pulse = frac(t * 1.5);
      c.strokeStyle = rgba('#B9CCFF', 0.6 * (1 - pulse)); c.lineWidth = 1.5;
      c.beginPath(); c.arc(ex, ey, 8 + pulse * 26, 0, TAU); c.stroke();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ex, ey, 6, 0, TAU); c.fill();
      c.restore();
      const ka = prog(t, 8.75, 9.0) * (1 - out);
      if (ka > 0) {
        const [ex2, ey2] = curve(1);
        c.save(); c.globalAlpha = ka; c.font = F.serif(40); c.fillStyle = C.ink; c.textAlign = 'right';
        c.fillText('found early.', ex2 - 6, ey2 + 62 + (1 - ka) * 10); c.restore();
      }
    }
  }

  // ---------- 04 depth chain ----------
  const CHAIN = Array.from({ length: 44 }, (_, k) => ({ k, z: k * 3.4, x: 1.5 * Math.sin(k * 0.42), ph: R() * TAU }));
  function future(c, t) {
    if (t < 9.35 || t > 12.7) return;
    const lt = t - 9.35;
    const camZ = -5 + 5.2 * lt + 1.1 * lt * lt;
    const camX = 1.5 * Math.sin(((camZ + 10) / 3.4) * 0.42);
    const FL = 760, HY = 640, CAMY = -1.0;
    const ain = E.outCubic(prog(t, 9.35, 9.9)), out = E.inOutQuint(prog(t, 12.2, 12.55));
    const env = ain * (1 - out);
    radial(c, CX, HY, 560, C.accent, 0.2 * env);
    c.save(); c.globalAlpha = env;
    const hg = c.createLinearGradient(0, 0, W, 0);
    hg.addColorStop(0, 'rgba(110,155,255,0)'); hg.addColorStop(0.5, 'rgba(160,190,255,0.55)'); hg.addColorStop(1, 'rgba(110,155,255,0)');
    c.fillStyle = hg; c.fillRect(0, HY - 0.5, W, 1);
    c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 1;
    const FY = 0.95 - CAMY;
    for (let gx = -14; gx <= 14; gx += 2) {
      c.beginPath();
      c.moveTo(CX + (gx - camX) * FL / 1.2, HY + FY * FL / 1.2);
      c.lineTo(CX + (gx - camX) * FL / 80, HY + FY * FL / 80); c.stroke();
    }
    for (let gz = Math.ceil(camZ / 3) * 3; gz < camZ + 80; gz += 3) {
      const rel = gz - camZ; if (rel < 1.2) continue;
      const y = HY + FY * FL / rel;
      c.strokeStyle = rgba('#FFFFFF', 0.06 * clamp((80 - rel) / 40)); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
    }
    c.restore();
    const vis = CHAIN.map((b) => ({ b, rel: b.z - camZ })).filter((o) => o.rel > 0.9 && o.rel < 90).sort((a, b) => b.rel - a.rel);
    const proj = (b, rel) => [CX + (b.x - camX) * FL / rel, HY + (0.45 - CAMY) * FL / rel];
    for (const { b, rel } of vis) {
      const nb = CHAIN[b.k + 1];
      if (!nb) continue;
      const [x1, y1] = proj(b, rel), [x2, y2] = proj(nb, nb.z - camZ);
      c.strokeStyle = rgba('#FFFFFF', 0.16 * env * clamp((90 - rel) / 50)); c.lineWidth = Math.max(1, 3 * FL / rel / 200);
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      const u = frac(t * 1.2 + b.k * 0.37);
      c.fillStyle = rgba('#9DBBFF', env * clamp((60 - rel) / 30));
      c.beginPath(); c.arc(lerp(x1, x2, u), lerp(y1, y2, u), Math.max(1.5, FL / rel / 40), 0, TAU); c.fill();
    }
    for (const { b, rel } of vis) {
      const [x, y] = proj(b, rel);
      const fog = clamp((90 - rel) / 55) * clamp((rel - 2.5) / 2.5);
      // blocks stay in the reel's style down the line and turn solid only for the nearest ~2 before the camera passes
      const solid = E.inOutCubic(clamp((10.5 - rel) / 3));
      const h = 0.36 * FL / rel, ry = t * 0.6 + b.ph, tone = clamp((22 - rel) / 8);
      if (solid < 1) cube(c, x, y, h, 0.42, ry, tone, fog * env * (1 - solid));
      if (solid > 0) cube(c, x, y, h, 0.42, ry, tone, fog * env * solid, 'solid');
    }
    line(c, [['Leading you', F.sans(100, 700), C.ink, -3.5]], CX, 250, 100, t, { t0: 9.55, out: 12.15, align: 'center' });
    line(c, [['into the ', F.sans(100, 700), C.ink, -3.5], ['future.', F.serif(118), accentFill]], CX, 362, 100, t,
      { t0: 9.72, out: 12.2, align: 'center' });
    const ms = [['2018', 'GENESIS', 10.6], ['2026', 'NOW', 10.85], ['NEXT', 'WITH YOU', 11.1]];
    ms.forEach(([big, small, ts], i) => {
      const k = E.outExpo(prog(t, ts, ts + 0.6)) * (1 - prog(t, 12.05, 12.3));
      if (k <= 0) return;
      const x = CX + (i - 1) * 260;
      c.save(); c.globalAlpha = k; c.textAlign = 'center';
      c.font = F.sans(40, 600); c.letterSpacing = '-1px'; c.fillStyle = i === 2 ? '#9DBBFF' : C.ink;
      c.fillText(big, x, 470 + (1 - k) * 16);
      c.restore();
      label(c, small, x, 505 + (1 - k) * 16, k * 0.8, C.mute, 'center');
    });
  }

  // ---------- 05 end card ----------
  function endcard(c, t) {
    if (t < 12.5) return;
    socials(c, t);
    line(c, [['Leading you into the future.', F.serif(52), accentFill]], CX, 812, 52, t,
      { t0: 13.0, st: 0.04, out: 14.3, align: 'center' });
    const k = E.outExpo(prog(t, 13.3, 13.95)) * (1 - E.inOutCubic(prog(t, 14.3, 14.6)));
    if (k > 0.005) {
      const w = 380, h = 72, y = 905 + (1 - k) * 20;
      c.save(); c.globalAlpha = k;
      c.beginPath(); c.roundRect(CX - w / 2, y - h / 2, w, h, h / 2);
      c.fillStyle = C.ink; c.fill();
      c.font = F.sans(25, 600); c.letterSpacing = '-0.2px'; c.fillStyle = '#07080B'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const nudge = Math.max(0, Math.sin(TAU * (t - 13.5))) * 6;
      c.fillText('Follow for what’s next', CX - 16, y + 1);
      c.fillText('→', CX + 138 + nudge, y + 1);
      c.restore();
    }
  }

  function heroDraw(c, t) {
    const s = heroState(t);
    if (s.a <= 0.01) return;
    c.globalCompositeOperation = 'lighter';
    radial(c, s.x, s.y, Math.min(s.h * 4.2, 420), C.accent, 0.22 * s.a);
    c.globalCompositeOperation = 'source-over';
    c.save(); c.globalAlpha = 0.5 * s.a; c.translate(s.x, s.y + s.h * 1.9); c.scale(1, 0.18);
    radial(c, 0, 0, s.h * 1.6, '#000000', 0.9); c.restore();
    cube(c, s.x, s.y, s.h, s.rx, s.ry, 1, s.a);
  }

  // ---------- frame ----------
  function renderAt(t) {
    t = ((t % DUR) + DUR) % DUR;
    curT = t;
    const frame = Math.round(t * FPS);
    const c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0;
    background(c, t);
    future(c, t);
    signal(c, t);
    projects(c, t);
    heroDraw(c, t);
    portrait(c, t);
    identity(c, t);
    hook(c, t);
    endcard(c, t);
    chrome(c, t);
    c.drawImage(vignette, 0, 0);
    c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.035;
    c.drawImage(grains[frame % grains.length], 0, 0, W, H);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }

  window.SHOWREEL = { W, H, DUR, FPS, renderAt, STYLES, setStyle: (s) => { STYLE = s; },
    drawBlock: (c, x, y, h, rx, ry, tone, alpha, style, t) => { curT = t; const prev = STYLE; STYLE = style; cube(c, x, y, h, rx, ry, tone, alpha, style); STYLE = prev; } };
  window.SHOWREEL.ready = Promise.all([
    document.fonts.load(F.sans(100)), document.fonts.load(F.serif(100)), document.fonts.load(F.mono(20)),
  ]).then(() => document.fonts.ready).then(() => photosReady);

  if (!/[?&]render\b/.test(location.search)) {
    window.SHOWREEL.ready.then(() => {
      const t0 = performance.now();
      const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); };
      loop();
    });
  }
})();
