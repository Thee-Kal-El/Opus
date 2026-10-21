// ESCAPE VELOCITY · anime reel — 30 s, 1080×1920 @ 24 fps. Composites the cel-shaded Blender plates (transparent sky) over
// painted anime skies, then adds the anime language: sun + god rays + lens flare, floating light motes, impact frames and
// speed lines at ignition, camera shake, bold subtitles and a katakana title card. renderAt(t) is async and pure in t.
(() => {
  'use strict';
  const W = 1080, H = 1920, FPS = 24, DUR = 30, TAU = Math.PI * 2;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const F = (w, s) => `${w} ${s}px "Inter Tight", sans-serif`, JP = (s) => `700 ${s}px "WenQuanYi Zen Hei", sans-serif`, MONO = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), prog = (t, a, b) => clamp((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
  const out3 = (p) => 1 - Math.pow(1 - p, 3), ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const hash = (a, b = 0, c = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };

  // [name, start, end] — plates are out/anime_frames/<name>/#####.png
  const SHOTS = [['reveal', 0, 6], ['crew', 6, 11], ['hull', 11, 15], ['ignite', 15, 20], ['climb', 20, 26]];
  const IGN = 15 + 17 / 24, LIFT = 15 + 63 / 24;
  // sky palettes (top → horizon) and sun placement per shot
  const SKY = {
    reveal: { stops: [[0, '#1B1446'], [0.32, '#5B2F7E'], [0.55, '#D4547A'], [0.72, '#FF8A4C'], [0.86, '#FFC46B']], sun: [800, 1010, 120] },
    crew: { stops: [[0, '#241552'], [0.3, '#7A3482'], [0.52, '#E85C70'], [0.7, '#FF9A4A'], [0.82, '#FFD27A']], sun: [560, 1150, 150] },
    hull: { stops: [[0, '#2A1A5E'], [0.4, '#8A3C8A'], [0.75, '#F07A5A'], [1, '#FFC072']], sun: [980, 380, 140] },
    ignite: { stops: [[0, '#1E1850'], [0.35, '#6A3488'], [0.6, '#E2627A'], [0.78, '#FF9850'], [0.9, '#FFCB70']], sun: [170, 900, 110] },
    climb: { stops: [[0, '#080B2A'], [0.35, '#1C2470'], [0.62, '#5A3A9A'], [0.85, '#E06A88'], [1, '#FFA460']], sun: [150, 1700, 160] },
  };
  const CAPS = [[1.2, 5.4, '2147.', 'The sky is the last way out.'], [6.6, 10.6, '', 'Six of us. One ship.'], [11.5, 14.7, '', 'They call her MERIDIAN.'],
    [16.6, 19.6, '', 'No second chances.'], [21.0, 25.4, '', 'Hold on to something.']];
  const shotAt = (t) => SHOTS.find(([, a, b]) => t >= a && t < b);
  const plate = (dir, f) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `../out/anime_frames/${dir}/${String(f).padStart(5, '0')}.png`; });

  function sky(c, name, k) {
    const P = SKY[name], g = c.createLinearGradient(0, 0, 0, H); P.stops.forEach(([p, col]) => g.addColorStop(p, col)); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // stars in the upper sky (more of them as the climb goes higher)
    const sN = name === 'climb' ? 120 + 180 * k : 60;
    for (let i = 0; i < sN; i++) { const x = hash(i, 1) * W, y = hash(i, 2) * H * (name === 'climb' ? 0.4 + 0.3 * k : 0.32), tw = 0.5 + 0.5 * Math.sin(k * 40 + i), a = (1 - y / (H * 0.45)) * 0.8 * tw;
      c.fillStyle = `rgba(255,248,235,${clamp(a)})`; const r = hash(i, 3) < 0.08 ? 2.6 : 1.3; c.fillRect(x - r / 2, y - r / 2, r, r); if (r > 2) { c.fillRect(x - 7, y - 0.6, 14, 1.2); c.fillRect(x - 0.6, y - 7, 1.2, 14); } }
    // painted streak clouds near the horizon (thin, layered, lit from below)
    for (let i = 0; i < 7; i++) { const y = H * (0.55 + i * 0.035) + Math.sin(i * 3) * 30, x = ((hash(i, 7) * W * 1.6 + k * 60 * (i % 2 ? 1 : -1)) % (W * 1.6)) - W * 0.3, w = 420 + hash(i, 8) * 520;
      c.fillStyle = `rgba(255,${190 + i * 6},${170 - i * 10},${0.22 + 0.05 * (i % 3)})`; c.beginPath(); c.ellipse(x, y, w / 2, 9 + hash(i, 9) * 9, 0, 0, TAU); c.fill(); }
  }
  function sunGlow(c, name, k, front = false) {
    const [x, y, r] = SKY[name].sun, yy = name === 'climb' ? y + k * 600 : y;
    c.save(); c.globalCompositeOperation = 'lighter';
    if (!front) {
      let g = c.createRadialGradient(x, yy, 0, x, yy, r * 7); g.addColorStop(0, 'rgba(255,240,200,0.75)'); g.addColorStop(0.12, 'rgba(255,190,120,0.45)'); g.addColorStop(1, 'rgba(255,120,80,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = '#FFF8E6'; c.beginPath(); c.arc(x, yy, r * 0.62, 0, TAU); c.fill();
    } else {
      // god rays: soft wedges rotating slowly
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + k * 0.25 + hash(i, 4) * 0.2, wd = 0.04 + hash(i, 5) * 0.05, L = 2400;
        const g = c.createRadialGradient(x, yy, 0, x, yy, L); g.addColorStop(0, 'rgba(255,230,180,0.16)'); g.addColorStop(1, 'rgba(255,200,150,0)'); c.fillStyle = g;
        c.beginPath(); c.moveTo(x, yy); c.lineTo(x + Math.cos(a - wd) * L, yy + Math.sin(a - wd) * L); c.lineTo(x + Math.cos(a + wd) * L, yy + Math.sin(a + wd) * L); c.closePath(); c.fill(); }
      // lens flare: ghosts along the line through the frame centre
      const dx = W / 2 - x, dy = H / 2 - yy;
      [[0.35, 26, '255,200,140', 0.22], [0.6, 60, '160,200,255', 0.12], [0.9, 14, '255,160,200', 0.3], [1.25, 90, '200,255,220', 0.08], [1.55, 34, '255,220,160', 0.18]].forEach(([p, s, col, a]) => {
        const fx = x + dx * p, fy = yy + dy * p; c.fillStyle = `rgba(${col},${a})`; c.beginPath(); for (let j = 0; j < 6; j++) { const aa = j / 6 * TAU + 0.3; c[j ? 'lineTo' : 'moveTo'](fx + Math.cos(aa) * s, fy + Math.sin(aa) * s); } c.closePath(); c.fill(); });
      // horizontal anamorphic streak
      const g2 = c.createLinearGradient(x - 700, 0, x + 700, 0); g2.addColorStop(0, 'rgba(255,190,140,0)'); g2.addColorStop(0.5, 'rgba(255,230,190,0.55)'); g2.addColorStop(1, 'rgba(255,190,140,0)'); c.fillStyle = g2; c.fillRect(x - 700, yy - 3, 1400, 6);
    }
    c.restore();
  }
  function motes(c, t, n = 40) {   // floating light specks drifting up through the sunbeam
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const sp = 30 + hash(i, 2) * 60, x = (hash(i, 1) * W + Math.sin(t * 0.7 + i) * 30) % W, y = H - ((hash(i, 3) * H + t * sp) % H), r = 2 + hash(i, 4) * 5, a = 0.35 + 0.35 * Math.sin(t * 3 + i * 2);
      const g = c.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, `rgba(255,236,190,${a})`); g.addColorStop(1, 'rgba(255,200,150,0)'); c.fillStyle = g; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); }
    c.restore();
  }
  function speedLines(c, t, cx, cy, strength, col = '255,255,255') {
    const fr = Math.round(t * FPS); c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 90; i++) { const a = hash(i, fr % 3, 1) * TAU, r0 = 380 + hash(i, fr, 2) * 300, L = 400 + hash(i, fr, 3) * 900, w = 2 + hash(i, 4) * 7;
      c.strokeStyle = `rgba(${col},${0.22 * strength})`; c.lineWidth = w; c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * (r0 + L), cy + Math.sin(a) * (r0 + L)); c.stroke(); }
    c.restore();
  }
  function caption(c, t) {
    for (const [a, b, small, s] of CAPS) { if (t < a || t > b) continue; const k = prog(t, a, a + 0.35) * (1 - prog(t, b - 0.3, b)), y = 1330;
      c.save(); c.globalAlpha = k; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      if (small) { c.font = F(800, 86); c.letterSpacing = '6px'; c.lineWidth = 14; c.strokeStyle = 'rgba(20,10,40,0.9)'; c.strokeText(small, W / 2, y - 110); c.fillStyle = '#FFE7B0'; c.fillText(small, W / 2, y - 110); }
      c.font = F(800, 56); c.letterSpacing = '0px'; c.lineWidth = 12; c.strokeStyle = 'rgba(20,10,40,0.92)'; c.strokeText(s, W / 2, y); c.fillStyle = '#FFFFFF'; c.fillText(s, W / 2, y); c.restore(); }
  }
  function title(c, t) {
    const lt = t - 26; if (lt < 0) return;
    sky(c, 'climb', 1); c.save(); c.globalAlpha = 0.65; c.fillStyle = '#0A0820'; c.fillRect(0, 0, W, H); c.restore();
    // diagonal colour slashes punching in
    const sl = [['#FF8A4C', -0.32, 760, 0.0], ['#7A3482', -0.32, 860, 0.12], ['#FFE7B0', -0.32, 980, 0.22]];
    for (const [col, rot, y, d] of sl) { const p = out3(prog(lt, d, d + 0.35)); c.save(); c.translate(W / 2, y); c.rotate(rot); c.fillStyle = col; c.globalAlpha = 0.9; c.fillRect(-1400 + (1 - p) * -1400, -26, 2800 * p, 52); c.restore(); }
    const k = out3(prog(lt, 0.3, 0.9)), sc = 1.25 - 0.25 * k;
    c.save(); c.translate(W / 2, 880); c.scale(sc, sc); c.globalAlpha = k; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.font = JP(70); c.fillStyle = '#FFE7B0'; c.fillText('エスケープ・ベロシティ', 0, -170);
    c.font = 'italic ' + F(900, 150); c.letterSpacing = '-4px'; c.lineWidth = 22; c.strokeStyle = '#140A28'; c.strokeText('ESCAPE', 0, -30); c.strokeText('VELOCITY', 0, 115);
    const g = c.createLinearGradient(0, -100, 0, 180); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.55, '#FFE1A6'); g.addColorStop(1, '#FF8A4C'); c.fillStyle = g; c.fillText('ESCAPE', 0, -30); c.fillText('VELOCITY', 0, 115); c.restore();
    c.save(); c.globalAlpha = prog(lt, 1.0, 1.5); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = MONO(600, 30); c.letterSpacing = '10px'; c.fillStyle = '#FFE7B0'; c.fillText('EPISODE 01 · THE THRESHOLD', W / 2, 1110);
    c.font = F(700, 34); c.letterSpacing = '4px'; c.fillStyle = '#FFFFFF'; c.globalAlpha = prog(lt, 1.8, 2.3); c.fillText('Thee_Kal_El', W / 2, 1230); c.restore();
    if (lt < 0.12) { c.fillStyle = `rgba(255,255,255,${1 - lt / 0.12})`; c.fillRect(0, 0, W, H); }
    const fo = prog(lt, 3.6, 4); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  }

  async function renderAt(t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.letterSpacing = '0px';
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const sh = shotAt(t);
    if (sh) { const [name, a, b] = sh, k = (t - a) / (b - a), f = Math.min(Math.round((b - a) * FPS), Math.floor((t - a) * FPS + 1e-6) + 1);
      // camera shake after ignition
      let sx = 0, sy = 0; if (name === 'ignite' && t > IGN) { const amp = 18 * Math.exp(-(t - IGN) * 0.6) + 6; sx = (hash(f, 1) - 0.5) * amp; sy = (hash(f, 2) - 0.5) * amp; } if (name === 'climb') { sx = (hash(f, 3) - 0.5) * 8; sy = (hash(f, 4) - 0.5) * 8; }
      c.save(); c.translate(sx, sy); c.translate(-12, -20); c.scale(1 + 24 / W, 1 + 40 / H);
      sky(c, name, k); sunGlow(c, name, k, false);
      const im = await plate(name, f); if (im) { c.drawImage(im, 0, 0, W, H);
        // soft bloom of the plate's highlights
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18; c.filter = 'blur(18px) brightness(1.3)'; c.drawImage(im, 0, 0, W, H); c.restore(); }
      else { c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(0, 0, W, H); c.font = MONO(500, 40); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(`${name} ${f}`, W / 2, H / 2); }
      // warm sunset wash over the lower frame + violet in the top corners (painted grade)
      let g = c.createLinearGradient(0, H * 0.55, 0, H); g.addColorStop(0, 'rgba(255,140,90,0)'); g.addColorStop(1, 'rgba(120,40,110,0.35)'); c.fillStyle = g; c.fillRect(0, H * 0.55, W, H * 0.45);
      sunGlow(c, name, k, true); motes(c, t, name === 'climb' ? 0 : 36);
      if (name === 'ignite' && t > IGN) speedLines(c, t, W / 2, 1250, clamp((t - IGN) * 2) * 0.8, '255,230,190');
      if (name === 'climb') speedLines(c, t, W / 2, 700, 0.9);
      c.restore();
      // impact frames at ignition (two-tone inverted flash, then white)
      if (name === 'ignite') { const d = t - IGN; if (d >= 0 && d < 2 / 24) { c.save(); c.globalCompositeOperation = 'difference'; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.restore(); c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.restore(); }
        else if (d >= 2 / 24 && d < 0.4) { c.fillStyle = `rgba(255,248,230,${0.85 * (1 - (d - 2 / 24) / 0.32)})`; c.fillRect(0, 0, W, H); } }
      // cuts: quick white wipes between shots, fade in at the start
      const dip = Math.max(t < 0.6 ? 1 - t / 0.6 : 0, prog(t, b - 0.12, b) * (b === 26 ? 1 : 0.7)); if (dip > 0) { c.fillStyle = b === 26 && t > b - 0.12 ? `rgba(255,255,255,${dip})` : `rgba(10,6,24,${dip})`; c.fillRect(0, 0, W, H); }
    }
    caption(c, t); title(c, t);
    // light film texture + vignette
    const fr = Math.round(t * FPS); c.save(); c.globalAlpha = 0.05; for (let i = 0; i < 260; i++) { c.fillStyle = hash(i, fr) > 0.5 ? '#fff' : '#000'; c.fillRect(hash(i, fr, 1) * W, hash(i, fr, 2) * H, 2, 2); } c.restore();
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,5,25,0.45)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
  }

  window.FILM = { W, H, FPS, DUR, renderAt, ready: document.fonts.ready.then(() => Promise.all([document.fonts.load(F(800, 50)), document.fonts.load(MONO(600, 30)), document.fonts.load('italic ' + F(900, 100))])) };
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = async () => { await renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
