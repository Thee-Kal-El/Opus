// Procedural artwork for the film: the pearlescent "liquid silk" cover and the designed playlist sleeves.
// Everything is deterministic (no Math.random), generated once at load into offscreen canvases.
window.ART = (() => {
  'use strict';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

  // ---------- pearlescent silk / molten glass ----------
  // Height field of broad folds built around a sweeping S-curve, lit with a key light,
  // specular highlights, a fresnel rim and a thin-film style pastel palette.
  function silk(size = 1024) {
    const c = mk(size, size), g = c.getContext('2d'), im = g.createImageData(size, size), d = im.data;
    const PAL = ['#C9B8F5', '#A9E2F2', '#F6C3D3', '#EBD7A4', '#BFEFD9', '#C9B8F5'].map(hex); // lavender, powder cyan, blush, champagne, mint
    const pal = (k) => { k = ((k % 1) + 1) % 1 * 5; const i = Math.floor(k), f = k - i, a = PAL[i], b = PAL[i + 1]; const s = f * f * (3 - 2 * f); return [lerp(a[0], b[0], s), lerp(a[1], b[1], s), lerp(a[2], b[2], s)]; };
    const sCurve = (y) => 0.42 * Math.sin(2.5 * y + 0.35) + 0.12 * y;
    const height = (x, y) => {
      const dS = x - sCurve(y);
      const w = dS + 0.16 * Math.sin(3.2 * y + 1.6 * x) + 0.05 * Math.sin(7.1 * y - 3.7 * x + 1.0);
      const ridge = 0.85 * Math.exp(-dS * dS * 7.0);                       // the prominent S-shaped fold
      const folds = 0.34 * Math.sin(w * 4.2 + 0.4) + 0.09 * Math.sin(w * 9.5 + y * 2.4);
      return [ridge + folds, w];
    };
    const L = (() => { const v = [-0.45, -0.62, 0.64], n = Math.hypot(...v); return v.map((a) => a / n); })();
    const L2 = (() => { const v = [0.6, 0.35, 0.72], n = Math.hypot(...v); return v.map((a) => a / n); })();
    const e = 1.5 / size;
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const x = (px / size) * 2 - 1, y = (py / size) * 2 - 1;
        const [h, w] = height(x, y), [hx] = height(x + e, y), [hy] = height(x, y + e);
        let nx = -(hx - h) / e * 0.32, ny = -(hy - h) / e * 0.32, nz = 1;
        const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        const ndl = clamp(nx * L[0] + ny * L[1] + nz * L[2]); const diff = 0.58 + 0.55 * Math.pow(ndl, 1.2);
        const hx2 = L[0], hy2 = L[1], hz2 = L[2] + 1, hl = Math.hypot(hx2, hy2, hz2);
        const spec = Math.pow(clamp((nx * hx2 + ny * hy2 + nz * hz2) / hl), 120) * 1.25;
        const h2x = L2[0], h2y = L2[1], h2z = L2[2] + 1, h2l = Math.hypot(h2x, h2y, h2z);
        const spec2 = Math.pow(clamp((nx * h2x + ny * h2y + nz * h2z) / h2l), 30) * 0.4;
        const fres = Math.pow(1 - nz, 2.2);
        const phase = 0.55 * (1 - nz) + w * 0.32 + 0.12 * y + h * 0.25;   // thin-film hue drift
        let [r, gg, b] = pal(phase);
        const stri = 0.010 * Math.sin(w * 260 + 2.5 * Math.sin(y * 7)) + 0.012 * Math.sin(w * 61 - y * 3);
        const shade = diff * (1 + stri);
        r = r * shade + 255 * (spec + spec2) + 60 * fres; gg = gg * shade + 255 * (spec + spec2) + 75 * fres; b = b * shade + 255 * (spec + spec2) + 95 * fres;
        // deeper tone in the folds for depth
        const occ = 0.80 + 0.22 * clamp(h * 0.9 + 0.55);
        const i = (py * size + px) * 4;
        d[i] = clamp(r * occ, 0, 255); d[i + 1] = clamp(gg * occ, 0, 255); d[i + 2] = clamp(b * occ, 0, 255); d[i + 3] = 255;
      }
    }
    g.putImageData(im, 0, 0);
    return c;
  }

  // ---------- playlist sleeves ----------
  const SLEEVE = 600;
  function sleeve(kind) {
    const c = mk(SLEEVE, SLEEVE), g = c.getContext('2d'), S = SLEEVE;
    const font = (w, s) => `${w} ${s}px Geist, sans-serif`;
    const title = (lines, col, size = 84, y = S - 60) => {
      g.fillStyle = col; g.font = font(800, size); g.letterSpacing = `${-size * 0.04}px`; g.textBaseline = 'alphabetic';
      lines.forEach((l, i) => g.fillText(l, 44, y - (lines.length - 1 - i) * size * 0.95));
      g.letterSpacing = '0px';
    };
    const small = (s, col) => { g.fillStyle = col; g.font = font(600, 22); g.letterSpacing = '4px'; g.fillText(s, 46, 70); g.letterSpacing = '0px'; };
    const circle = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
    switch (kind) {
      case 'late': { // mustard, crescent moon + horizon lines
        g.fillStyle = '#E3B23C'; g.fillRect(0, 0, S, S);
        circle(400, 200, 120, '#2B1E0A'); circle(450, 165, 108, '#E3B23C');
        g.strokeStyle = '#2B1E0A'; g.lineWidth = 6; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(330 + i * 18, 360 + i * 22); g.lineTo(560, 360 + i * 22); g.stroke(); }
        small('PLAYLIST', 'rgba(43,30,10,0.75)'); title(['Late', 'Nights'], '#2B1E0A', 100); break;
      }
      case 'energy': { // pink, sunburst
        g.fillStyle = '#FF5FA2'; g.fillRect(0, 0, S, S);
        g.save(); g.translate(430, 190); g.fillStyle = '#FFD84D';
        for (let i = 0; i < 16; i++) { g.rotate(Math.PI / 8); g.beginPath(); g.moveTo(0, -40); g.lineTo(14, -150); g.lineTo(-14, -150); g.closePath(); g.fill(); }
        g.restore(); circle(430, 190, 62, '#FFD84D');
        small('PLAYLIST', 'rgba(60,5,30,0.7)'); title(['Good', 'Energy'], '#3C051E', 100); break;
      }
      case 'focus': { // blue, concentric squares
        g.fillStyle = '#2E5BFF'; g.fillRect(0, 0, S, S);
        g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 5;
        for (let i = 0; i < 6; i++) { const s = 60 + i * 34; g.strokeRect(420 - s / 2, 200 - s / 2, s, s); }
        g.fillStyle = '#BFEFFF'; g.fillRect(410, 190, 20, 20);
        small('PLAYLIST', 'rgba(255,255,255,0.75)'); title(['Deep', 'Focus'], '#FFFFFF', 100); break;
      }
      case 'mix1': case 'mix2': case 'mix3': {
        const [bg, fg, acc, n] = { mix1: ['#14B8A6', '#04211E', '#F2FFF9', '1'], mix2: ['#FF7A3D', '#2A0E02', '#FFE7D6', '2'], mix3: ['#8B5CF6', '#FFFFFF', '#1A0B3D', '3'] }[kind];
        g.fillStyle = bg; g.fillRect(0, 0, S, S);
        // stacked arcs motif
        for (let i = 0; i < 3; i++) { g.strokeStyle = i === 1 ? acc : fg; g.globalAlpha = 0.85; g.lineWidth = 26; g.beginPath(); g.arc(S - 40, 40, 150 + i * 60, Math.PI / 2, Math.PI); g.stroke(); }
        g.globalAlpha = 1;
        g.fillStyle = fg; g.font = font(900, 240); g.letterSpacing = '-12px'; g.fillText(n, 40, 300); g.letterSpacing = '0px';
        small('MADE FOR YOU', fg); title(['Daily', 'Mix'], fg, 92); break;
      }
      case 'chill': { // mint, waves
        g.fillStyle = '#7FE3C1'; g.fillRect(0, 0, S, S);
        g.strokeStyle = '#0B3B2E'; g.lineWidth = 8;
        for (let r = 0; r < 5; r++) { g.beginPath(); for (let x = 300; x <= 580; x += 6) { const y = 120 + r * 40 + Math.sin(x / 34 + r) * 12; x === 300 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
        small('PLAYLIST', 'rgba(11,59,46,0.7)'); title(['Chill', 'Waves'], '#0B3B2E', 100); break;
      }
      case 'throw': { // red, stripes
        g.fillStyle = '#E8423C'; g.fillRect(0, 0, S, S);
        ['#FFD84D', '#FF9A3D', '#FFF1E0'].forEach((col, i) => { g.fillStyle = col; g.fillRect(300, 90 + i * 60, 260, 34); });
        small('PLAYLIST', 'rgba(255,241,224,0.85)'); title(['Throw', 'back'], '#FFF1E0', 100); break;
      }
      case 'run': { // lime, diagonal bars
        g.fillStyle = '#C6F432'; g.fillRect(0, 0, S, S);
        g.fillStyle = '#121212'; for (let i = 0; i < 4; i++) { g.save(); g.translate(360 + i * 52, 80); g.transform(1, 0, -0.45, 1, 0, 0); g.fillRect(0, 0, 26, 230); g.restore(); }
        small('PLAYLIST', 'rgba(18,18,18,0.7)'); title(['Run', 'Mode'], '#121212', 100); break;
      }
    }
    return c;
  }

  // Bake rounded corners into a square cover canvas (radius as a fraction of the size).
  function rounded(src, size = 600, rf = 0.035) {
    const c = mk(size, size), g = c.getContext('2d');
    g.beginPath(); g.roundRect(0, 0, size, size, size * rf); g.clip();
    g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, size, size);
    return c;
  }

  return { silk, sleeve, rounded, mk };
})();
