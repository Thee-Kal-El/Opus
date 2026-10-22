// OPEN//77 — 30 s product showcase, 1920×1080 @ 60 fps. Original procedural visuals (no game art); facts from public coverage.
// v2 look: cinematic and restrained — steel / bone / one signal-red accent, eased (no bounce) motion, light glitches, letterbox.
// 0 cold open "Night City was built for one" · 2.5 OPEN//77 logo slam · 6 server browser → JOIN · 12 server types (roleplay/racing/
// combat/freeroam) · 17 host your own, Lua 5.4 · 22 how to get in (Discord /alpha apply, requirements) · 26.5 end card.
(() => {
  'use strict';
  const W = 1920, H = 1080, FPS = 60, DUR = 30, TAU = Math.PI * 2;
  const cv = document.getElementById('c'), c = cv.getContext('2d');
  const BG = '#050607', CY = '#9DB3C4', MG = '#E0362B', YL = '#E9E3D3', TX = '#ECEAE4', TX2 = '#7E8389';
  const D = (s) => `900 ${s}px "Inter Tight", sans-serif`, F = (w, s) => `${w} ${s}px "Inter Tight", sans-serif`, M = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), prog = (t, a, b) => clamp((t - a) / (b - a));
  const out3 = (p) => 1 - Math.pow(1 - p, 3), outBack = (p) => 1 - Math.pow(1 - p, 4), ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const hash = (a, b = 0, d = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(d | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const rr = (x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  function txt(s, x, y, font, col, align = 'left', ls = 0, base = 'middle') { c.font = font; c.fillStyle = col; c.textAlign = align; c.textBaseline = base; c.letterSpacing = ls + 'px'; c.fillText(s, x, y); c.letterSpacing = '0px'; }
  const tw = (s, font, ls = 0) => { c.font = font; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.letterSpacing = '0px'; return w; };
  const typed = (s, t, t0, cps = 30) => s.slice(0, Math.max(0, Math.floor((t - t0) * cps)));

  // ---------- city backdrop (cached layers, parallax) ----------
  let CITY = null;
  function buildCity() {
    CITY = [0, 1, 2].map((layer) => {
      const cvs = document.createElement('canvas'); cvs.width = W * 2; cvs.height = H; const g = cvs.getContext('2d');
      const base = [0.62, 0.5, 0.38][layer], col = ['#161C22', '#0E1216', '#06080A'][layer];
      for (let x = 0, i = 0; x < W * 2; i++) {
        const w = 60 + hash(i, layer, 1) * 140, h = H * (1 - base) + hash(i, layer, 2) * H * (0.25 + layer * 0.12) + (layer === 2 && hash(i, 9) > 0.85 ? 220 : 0), y = H - h;
        g.fillStyle = col; g.fillRect(x, y, w, h);
        for (let wy = y + 14; wy < H - 10; wy += 16 + layer * 4) for (let wx = x + 8; wx < x + w - 8; wx += 12 + layer * 4) {
          const r = hash(Math.round(wx), Math.round(wy), layer); if (r > 0.82 - layer * 0.05) { g.fillStyle = r > 0.985 ? rgba(MG, 0.8) : r > 0.95 ? rgba('#CFE3F0', 0.5) : rgba('#FFD9A0', 0.38 - layer * 0.1); g.fillRect(wx, wy, 4 + layer, 6 + layer); }
        }
        if (layer === 2 && hash(i, 4) > 0.88) { g.fillStyle = rgba(MG, 0.85); g.shadowColor = g.fillStyle; g.shadowBlur = 18; g.fillRect(x + w * 0.2, y + 30 + hash(i, 6) * 120, 8, 60 + hash(i, 7) * 90); g.shadowBlur = 0; }
        x += w + 4 + hash(i, layer, 3) * 18;
      }
      return cvs;
    });
  }
  function city(t, dim = 1) {
    let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#050608'); g.addColorStop(0.55, '#0B1015'); g.addColorStop(0.85, '#151A20'); g.addColorStop(1, '#07090B'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    CITY.forEach((cvs, i) => { const sp = [12, 26, 48][i], x = -((t * sp) % W); c.drawImage(cvs, x, 0); c.drawImage(cvs, x + W * 2, 0); });
    g = c.createLinearGradient(0, H * 0.55, 0, H); g.addColorStop(0, 'rgba(224,54,43,0)'); g.addColorStop(1, 'rgba(224,54,43,0.07)'); c.fillStyle = g; c.fillRect(0, H * 0.55, W, H * 0.45);
    // rain
    c.strokeStyle = 'rgba(200,215,230,0.12)'; c.lineWidth = 1.3; c.beginPath(); const fr = Math.floor(t * FPS);
    for (let i = 0; i < 260; i++) { const x = (hash(i, 1) * W + fr * 3) % W, y = (hash(i, 2) * H + fr * 38 * (0.7 + hash(i, 3) * 0.6)) % H; c.moveTo(x, y); c.lineTo(x - 6, y + 34); } c.stroke();
    if (dim < 1) { c.fillStyle = `rgba(7,6,13,${1 - dim})`; c.fillRect(0, 0, W, H); }
  }
  // chromatic glitch slice burst used on cuts
  function glitch(t, t0, len = 0.25, amt = 1) {
    const k = 1 - prog(t, t0, t0 + len); if (t < t0 || k <= 0) return; const fr = Math.floor(t * FPS);
    const snap = c.getImageData(0, 0, W, H);
    for (let i = 0; i < 9; i++) { const y = hash(i, fr) * H, h = 8 + hash(i, fr, 2) * 70, dx = (hash(i, fr, 3) - 0.5) * 50 * k * amt; c.putImageData(snap, dx, 0, 0, y, W, h); }
    c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.08 * k; c.fillStyle = '#FFFFFF'; c.fillRect(0, hash(fr, 8) * H, W, 4 + hash(fr, 9) * 30); c.restore();
  }
  // logo wordmark with RGB split
  function logo(x, y, size, a = 1, split = 0) {
    c.save(); c.globalAlpha = a; c.font = D(size); c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '-2px';
    if (split > 0) { split *= 0.35; c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(224,54,43,0.5)'; c.fillText('OPEN//77', x - split, y); c.fillStyle = 'rgba(157,179,196,0.5)'; c.fillText('OPEN//77', x + split, y); c.globalCompositeOperation = 'source-over'; }
    c.fillStyle = TX; c.fillText('OPEN', x - tw('//77', D(size), -2) / 2 - 2, y);
    const wOpen = tw('OPEN', D(size), -2), wAll = tw('OPEN//77', D(size), -2); c.textAlign = 'left';
    c.fillStyle = MG; c.fillText('//', x - wAll / 2 + wOpen, y); c.fillStyle = TX; c.fillText('77', x - wAll / 2 + wOpen + tw('//', D(size), -2), y);
    c.restore();
  }
  function kicker(s, x, y, col = CY, a = 1, align = 'center') { c.save(); c.globalAlpha = a; txt(s, x, y, M(600, 26), col, align, 8); c.restore(); }
  function caption(s, t, a, b, y = H - 110) { if (t < a || t > b) return; const k = prog(t, a, a + 0.3) * (1 - prog(t, b - 0.3, b)); c.save(); c.globalAlpha = k; txt(s, W / 2, y + (1 - k) * 12, F(400, 36), TX, 'center', 1); c.restore(); }

  // ---------- scenes ----------
  function coldOpen(t) {
    c.fillStyle = BG; c.fillRect(0, 0, W, H);
    const a = typed('NIGHT CITY WAS BUILT FOR ONE.', t, 0.2, 26), cur = Math.floor(t * 4) % 2 ? '_' : ' ';
    if (t < 1.75) txt(a + (a.length < 29 ? cur : ''), W / 2, H / 2, M(600, 46), TX, 'center', 4);
    else { const k = outBack(prog(t, 1.75, 1.95)); c.save(); c.translate(W / 2, H / 2); c.scale(k, k); txt('NOT ANYMORE.', 0, 0, F(800, 120), MG, 'center', 6); c.restore(); }
  }
  function logoScene(t) {
    city(t, 0.8);
    const lt = t - 2.5, k = out3(prog(lt, 0, 0.35)), sc = 1.35 - 0.35 * k, split = 26 * (1 - prog(lt, 0, 0.6)) + 4 * (Math.floor(t * 12) % 7 === 0 ? 1 : 0);
    c.save(); c.translate(W / 2, H / 2 - 40); c.scale(sc, sc); logo(0, 0, 230, k, split); c.restore();
    c.save(); c.globalAlpha = prog(lt, 0.5, 0.9); c.fillStyle = MG; c.fillRect(W / 2 - 330, H / 2 + 92, 660 * out3(prog(lt, 0.5, 1)), 4); c.restore();
    kicker('CYBERPUNK 2077 MULTIPLAYER', W / 2, H / 2 + 140, CY, prog(lt, 0.7, 1.1));
    c.save(); c.globalAlpha = prog(lt, 1.3, 1.7); txt('Community-run · Dedicated servers · Your rules', W / 2, H / 2 + 200, F(500, 32), TX2, 'center'); c.restore();
  }
  const SERVERS = [['KABUKI AFTER DARK', 'ROLEPLAY', MG, 'NA-EAST', 32], ['BADLANDS DRIFT CLUB', 'RACING', CY, 'EU-WEST', 41], ['WATSON WARZONE', 'COMBAT', MG, 'NA-WEST', 28], ['PACIFICA CRUISE', 'FREEROAM', YL, 'EU-CENTRAL', 55], ['JAPANTOWN STORIES', 'ROLEPLAY', MG, 'ASIA', 63], ['CORPO PLAZA GP', 'RACING', CY, 'NA-EAST', 37]];
  function browserScene(t) {
    city(t, 0.6); const lt = t - 6, k = out3(prog(lt, 0, 0.4));
    const px = 300, py = 110 + (1 - k) * 60, pw = 1320, ph = 790;
    c.save(); c.globalAlpha = k; rr(px, py, pw, ph, 18); c.fillStyle = 'rgba(8,10,12,0.9)'; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(236,234,228,0.18)'; c.stroke();
    txt('SERVER BROWSER', px + 40, py + 52, M(700, 28), CY, 'left', 6); logo(px + pw - 150, py + 52, 40, 1, 0);
    const chips = ['ALL', 'ROLEPLAY', 'RACING', 'COMBAT', 'FREEROAM'], active = lt < 3.2 ? Math.min(4, Math.floor(lt / 0.55)) : 0; let cx = px + 40;
    chips.forEach((s, i) => { const w = tw(s, M(600, 20), 3) + 36; rr(cx, py + 92, w, 42, 4); c.fillStyle = i === active ? TX : 'rgba(255,255,255,0.05)'; c.fill(); txt(s, cx + 18, py + 114, M(600, 20), i === active ? BG : TX2, 'left', 3); cx += w + 12; });
    txt('SERVER', px + 40, py + 172, M(600, 18), TX2, 'left', 3); txt('TYPE', px + 700, py + 172, M(600, 18), TX2, 'left', 3); txt('REGION', px + 860, py + 172, M(600, 18), TX2, 'left', 3); txt('PING', px + 1040, py + 172, M(600, 18), TX2, 'left', 3);
    const sel = lt > 2.2 ? 0 : -1;
    SERVERS.forEach(([name, type, col, reg, ping], i) => {
      const ry = py + 200 + i * 78, a = prog(lt, 0.25 + i * 0.08, 0.5 + i * 0.08); if (a <= 0) return;
      c.save(); c.globalAlpha = a; c.translate((1 - a) * 40, 0);
      rr(px + 24, ry, pw - 48, 66, 10); c.fillStyle = i === sel ? rgba(CY, 0.16) : 'rgba(255,255,255,0.03)'; c.fill(); if (i === sel) { c.lineWidth = 2; c.strokeStyle = CY; c.stroke(); }
      txt(name, px + 40, ry + 33, F(700, 30), TX); rr(px + 700, ry + 16, tw(type, M(700, 18), 2) + 24, 34, 6); c.fillStyle = rgba(col, 0.18); c.fill(); txt(type, px + 712, ry + 34, M(700, 18), col, 'left', 2);
      txt(reg, px + 860, ry + 33, M(500, 20), TX2); txt(ping + ' ms', px + 1040, ry + 33, M(500, 20), ping < 45 ? TX : TX2);
      if (i === sel) { const jp = outBack(prog(lt, 3.2, 3.45)); c.save(); c.translate(px + pw - 120, ry + 33); c.scale(jp, jp); rr(-70, -24, 140, 48, 10); c.fillStyle = lt > 4.4 ? TX : MG; c.fill(); txt(lt > 4.4 ? 'JOINED' : 'JOIN', 0, 2, M(800, 22), lt > 4.4 ? BG : '#fff', 'center', 3); c.restore(); }
      c.restore();
    });
    // cursor
    const cxp = [[0, px + 900, py + 600], [2.0, px + 600, py + 237], [3.6, px + pw - 120, py + 237], [6, px + pw - 120, py + 237]];
    let p0 = cxp[0], p1 = cxp[1]; for (let i = 0; i < cxp.length - 1; i++) if (lt >= cxp[i][0]) { p0 = cxp[i]; p1 = cxp[i + 1]; }
    const e = ease(prog(lt, p0[0], p0[0] + 0.9 * (p1[0] - p0[0]))), mx = p0[1] + (p1[1] - p0[1]) * e, my = p0[2] + (p1[2] - p0[2]) * e;
    if (lt > 0.4) { c.save(); c.translate(mx, my); const pr = lt > 3.9 && lt < 4.1 ? 0.85 : 1; c.scale(pr, pr); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 38); c.lineTo(10, 28); c.lineTo(18, 46); c.lineTo(25, 43); c.lineTo(17, 26); c.lineTo(30, 26); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#000'; c.stroke(); c.restore(); }
    // connecting bar
    if (lt > 4.0) { const bp = prog(lt, 4.0, 5.6); rr(px + 40, py + ph - 52, pw - 80, 10, 5); c.fillStyle = 'rgba(255,255,255,0.08)'; c.fill(); rr(px + 40, py + ph - 52, (pw - 80) * bp, 10, 5); c.fillStyle = CY; c.fill(); txt(bp < 1 ? 'CONNECTING TO KABUKI AFTER DARK…' : 'CONNECTED · WELCOME TO NIGHT CITY', px + 40, py + ph - 76, M(600, 18), bp < 1 ? TX2 : CY, 'left', 3); }
    c.restore();
    caption('Browse community servers. Pick one. Jump in.', t, 6.6, 11.8, H - 70);
  }
  const MODES = [['ROLEPLAY', 'Live a life in Night City — jobs, crews, stories.', MG, 'contours'], ['RACING', 'Street races and custom tracks against real drivers.', YL, 'speedLines'], ['COMBAT', 'Squad up and fight other players, not just NPCs.', '#FF6A3D', 'moire'], ['FREEROAM', 'Just cruise the city together. No rules required.', CY, 'flowLines']];
  function modeScene(t) {
    const lt = t - 12, i = Math.min(3, Math.floor(lt / 1.25)), mt = lt - i * 1.25, [name, line, col, bgk] = MODES[i];
    const pal = { bg: '#050607', fg: '#3A434C', accent: '#6D7A86', dim: '#1A1F24', paper: '#14181C' };
    window.MOTIONBG.BG[bgk](c, t, W, H, pal); c.fillStyle = 'rgba(5,6,7,0.6)'; c.fillRect(0, 0, W, H);
    kicker(`SERVER TYPE 0${i + 1} / 04`, W / 2, H / 2 - 170, TX2, prog(mt, 0, 0.2));
    const k = outBack(prog(mt, 0.02, 0.28)); c.save(); c.translate(W / 2, H / 2 - 30); c.scale(k, k); c.font = F(800, 170); c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '24px'; c.fillStyle = TX; c.fillText(name, 12, 0); c.letterSpacing = '0px'; c.restore();
    c.save(); c.globalAlpha = prog(mt, 0.25, 0.5); txt(line, W / 2, H / 2 + 110, F(400, 38), TX2, 'center'); c.restore();
    // pips
    for (let j = 0; j < 4; j++) { rr(W / 2 - 110 + j * 60, H / 2 + 200, 40, 3, 1); c.fillStyle = j === i ? MG : 'rgba(255,255,255,0.18)'; c.fill(); }
  }
  const LUA = ['-- my_server.lua   ·   Lua 5.4', '', 'local server = {', '  name  = "Kabuki After Dark",', '  mode  = "roleplay",', '  rules = { pvp = false },', '}', '', 'print("Welcome to " .. server.name)'];
  function hostScene(t) {
    city(t, 0.6); const lt = t - 17, k = out3(prog(lt, 0, 0.4));
    c.save(); c.globalAlpha = k; kicker('HOST YOUR OWN SERVER', 140, 250, YL, 1, 'left');
    txt('YOUR CITY.', 140, 360, F(800, 96), TX, 'left', 4); txt('YOUR RULES.', 140, 480, F(800, 96), MG, 'left', 4);
    txt('Script your server with Lua 5.4 —', 140, 590, F(500, 36), TX2); txt('game modes, rules, events, whole worlds.', 140, 640, F(500, 36), TX2); c.restore();
    const ex = 1010, ey = 200 + (1 - k) * 50, ew = 790, eh = 560;
    c.save(); c.globalAlpha = k; rr(ex, ey, ew, eh, 16); c.fillStyle = 'rgba(8,10,12,0.94)'; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(236,234,228,0.18)'; c.stroke();
    ['#3A3F45', '#3A3F45', '#3A3F45'].forEach((cc, i) => { c.fillStyle = cc; c.beginPath(); c.arc(ex + 32 + i * 26, ey + 30, 7, 0, TAU); c.fill(); }); txt('my_server.lua', ex + 120, ey + 31, M(500, 18), TX2);
    let chars = Math.floor(Math.max(0, lt - 0.5) * 55);
    LUA.forEach((ln, i) => { const y = ey + 90 + i * 46; txt(String(i + 1).padStart(2, ' '), ex + 26, y, M(500, 20), '#4A4766'); const s = ln.slice(0, Math.max(0, chars)); chars -= ln.length + 4;
      const col = ln.startsWith('--') ? '#5A6068' : ln.includes('"') ? '#D9C9A3' : ln.startsWith('local') || ln.startsWith('print') ? CY : TX; txt(s, ex + 70, y, M(500, 24), col);
      if (chars < 0 && chars > -(ln.length + 4) && Math.floor(t * 3) % 2) { c.fillStyle = TX; c.fillRect(ex + 70 + tw(s, M(500, 24)), y - 14, 3, 28); } });
    if (lt > 3.6) { const p = out3(prog(lt, 3.6, 3.9)); rr(ex + 30, ey + eh - 70, ew - 60, 46, 8); c.fillStyle = `rgba(157,179,196,${0.08 * p})`; c.fill(); txt('> Welcome to Kabuki After Dark', ex + 50, ey + eh - 46, M(600, 22), CY); }
    c.restore();
  }
  function getInScene(t) {
    city(t, 0.6); const lt = t - 22;
    kicker('GET INTO THE ALPHA', W / 2, 190, YL, prog(lt, 0, 0.3));
    const steps = [['01', 'JOIN THE DISCORD', 'Official OPEN//77 server'], ['02', 'TYPE  /alpha apply', 'Request alpha access'], ['03', 'PICK A SERVER & PLAY', 'Or host and script your own']];
    steps.forEach(([n, a, b], i) => { const p = outBack(prog(lt, 0.25 + i * 0.35, 0.55 + i * 0.35)); if (p <= 0) return; const x = 190 + i * 530, y = 300;
      c.save(); c.translate(x + 240, y + 180); c.scale(p, p); c.translate(-240, -180);
      rr(0, 0, 480, 360, 20); c.fillStyle = 'rgba(8,10,12,0.9)'; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(236,234,228,0.18)'; c.stroke(); c.fillStyle = MG; c.fillRect(0, 0, 4, 360);
      txt(n, 36, 70, M(300, 64), TX2, 'left', 2); txt(a, 36, 200, i === 1 ? M(800, 36) : F(800, 40), TX, 'left', i === 1 ? 1 : 0); txt(b, 36, 262, F(500, 28), TX2); c.restore(); });
    c.save(); c.globalAlpha = prog(lt, 1.6, 2.0); txt('Requires Cyberpunk 2077 v2.31 + Phantom Liberty  ·  Windows 10 / 11 (64-bit)', W / 2, 760, M(500, 24), TX2, 'center', 1); c.restore();
  }
  function endScene(t) {
    city(t, 0.8); const lt = t - 26.5, k = out3(prog(lt, 0, 0.35));
    c.save(); c.translate(W / 2, H / 2 - 80); const sc = 1.2 - 0.2 * k; c.scale(sc, sc); logo(0, 0, 210, k, 18 * (1 - prog(lt, 0, 0.5))); c.restore();
    const cp = outBack(prog(lt, 0.4, 0.65)); c.save(); c.translate(W / 2, H / 2 + 70); c.scale(cp, cp); c.strokeStyle = MG; c.lineWidth = 2; c.strokeRect(-170, -30, 340, 60); c.fillStyle = MG; c.beginPath(); c.arc(-136, 0, 6, 0, TAU); c.fill(); txt('NOW IN ALPHA', 14, 2, M(600, 24), TX, 'center', 8); c.restore();
    c.save(); c.globalAlpha = prog(lt, 0.8, 1.2); txt('OPEN2077.NET', W / 2, H / 2 + 170, F(600, 46), TX, 'center', 14); c.restore();
    c.save(); c.globalAlpha = prog(lt, 1.3, 1.8) * 0.8; txt('Unofficial community project · Not affiliated with CD PROJEKT RED', W / 2, H - 70, M(500, 20), TX2, 'center', 1); c.restore();
    const fo = prog(t, 29.5, 30); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  }

  let GRAIN = null;
  function renderAt(t) {
    if (!CITY) buildCity();
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
    if (t < 2.5) coldOpen(t); else if (t < 6) logoScene(t); else if (t < 12) browserScene(t); else if (t < 17) modeScene(t); else if (t < 22) hostScene(t); else if (t < 26.5) getInScene(t); else endScene(t);
    [2.5, 26.5].forEach((t0) => glitch(t, t0, 0.16));
    if (t > 1.75 && t < 1.95) { c.fillStyle = `rgba(236,234,228,${0.12 * (1 - prog(t, 1.75, 1.95))})`; c.fillRect(0, 0, W, H); }
    // grade: cool shadows, grain, vignette, thin letterbox
    c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(40,70,95,0.35)'; c.fillRect(0, 0, W, H); c.restore();
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = hash(i, 5) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 14; } g.putImageData(d, 0, 0); }
    const fr = Math.floor(t * FPS); c.save(); c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-(hash(fr, 1) * 256 | 0), -(hash(fr, 2) * 256 | 0)); c.fillRect(0, 0, W + 256, H + 256); c.restore();
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.0); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    c.fillStyle = '#000'; c.fillRect(0, 0, W, 54); c.fillRect(0, H - 54, W, 54);
  }
  window.FILM = { W, H, FPS, DUR, renderAt, ready: document.fonts.ready.then(() => Promise.all([document.fonts.load(D(100)), document.fonts.load(M(600, 20)), document.fonts.load(F(500, 20))])) };
  if (!/[?&]render\b/.test(location.search)) window.FILM.ready.then(() => { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); });
})();
