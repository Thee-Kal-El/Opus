// Score for the ANAHEIM PRANCING PUPS promo (20s; the 15s design timeline is slowed for reading time) — bright, bouncy 120 BPM groove in A major (A–E–F#m–D), synthesized in code.
// Crest reveal 0.75 · headline slams + paw stamps 1.5–2.9 · bus drive-in + horn 4.0–4.6 · service cards 6.55/7.05 with scissor snips ·
// pups + 07+ badge 9.5–10.8 · end card 12.0, button tap 13.6. Bubble "bloops" throughout.
//   node pp/synth.mjs  ->  out/prancing_pups_score.wav
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000, DUR = 20, N = SR * DUR, TAU = Math.PI * 2, BT = 0.5;
const L = new Float32Array(N), Rr = new Float32Array(N), revL = new Float32Array(N), revR = new Float32Array(N), dlyL = new Float32Array(N), dlyR = new Float32Array(N);
let seed = 2019;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const at = (t) => Math.round(t * SR);
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4) * Math.SQRT2, Math.sin((p + 1) * Math.PI / 4) * Math.SQRT2];
function put(i, l, r, rev = 0, dly = 0) { if (i < 0 || i >= N) return; L[i] += l; Rr[i] += r; if (rev) { revL[i] += l * rev; revR[i] += r * rev; } if (dly) { dlyL[i] += l * dly; dlyR[i] += r * dly; } }

// ---- harmony ----
const CH = { A: [45, [0, 4, 7, 11]], E: [40, [0, 4, 7, 9]], Fsm: [42, [0, 3, 7, 10]], D: [38, [0, 4, 7, 9]] };
const BARS = ['A', 'E', 'Fsm', 'D'];
const chordAt = (t) => CH[BARS[Math.floor(t / 2) % 4]];
const KICKS = [];
const duck = (t) => { let g = 1; for (const k of KICKS) { const d = t - k; if (d >= 0 && d < 0.35) g = Math.min(g, 1 - 0.55 * Math.exp(-d * 11)); } return g; };

// ---------- instruments ----------
function kick(t0, g = 1) {
  KICKS.push(t0); let ph = 0;
  for (let n = 0; n < 0.4 * SR; n++) { const t = n / SR; ph += TAU * (48 + 110 * Math.exp(-t * 30)) / SR; const v = Math.tanh(Math.sin(ph) * Math.exp(-t * 7.5) * 1.3) * 0.62 * g; put(at(t0) + n, v, v); }
}
function clap(t0, g = 1) {
  let b1 = 0, b2 = 0;
  for (let n = 0; n < 0.26 * SR; n++) { const t = n / SR, f = 2 * Math.sin(Math.PI * 1700 / SR); b1 += f * (noise() - b2 - 0.5 * b1); b2 += f * b1; const env = (t < 0.022 ? Math.exp(-((t * 130) % 1) * 3) : 1) * Math.exp(-t * 16); const v = b1 * 1.1 * env * g; put(at(t0) + n, v * 0.9, v, 0.45); }
}
function hat(t0, g, open = false, p = 0) {
  let hp = 0, prev = 0; const [a, b] = pan(p);
  for (let n = 0; n < (open ? 0.2 : 0.045) * SR; n++) { const x = noise(); hp = 0.94 * (hp + x - prev); prev = x; const v = hp * Math.exp(-n / SR * (open ? 20 : 85)) * g; put(at(t0) + n, v * a, v * b, 0.1); }
}
function bassNote(t0, dur, m, g = 1, rel = 120) {
  let ph = 0, sp = 0, lp = 0, lp2 = 0; const f = mtof(m);
  for (let n = 0; n < (dur + Math.min(2, 4 / rel)) * SR; n++) {
    const t = n / SR; ph = (ph + f / SR) % 1; sp += TAU * f / SR;
    const env = Math.min(1, t / 0.006) * (t < dur ? 1 : Math.exp(-(t - dur) * rel));
    const cut = 0.02 + 0.08 * Math.exp(-t * 10); lp += cut * ((2 * ph - 1) - lp); lp2 += cut * (lp - lp2);
    const v = (Math.tanh(lp2 * 2) * 0.35 + Math.sin(sp) * 0.7) * env * g * 0.36 * duck(t0 + t);
    put(at(t0) + n, v, v);
  }
}
function pad(t0, dur, chord, g = 1, o = {}) {
  const [root, iv] = chord, notes = iv.map((i) => root + 24 + i), phs = notes.flatMap(() => [rnd(), rnd()]);
  let lpL = 0, lpR = 0;
  for (let n = 0; n < dur * SR; n++) {
    const t = n / SR; let sl = 0, sr = 0;
    notes.forEach((m, i) => { for (const [k, d] of [[0, -0.07], [1, 0.07]]) { const j = i * 2 + k; phs[j] = (phs[j] + mtof(m + d) / SR) % 1; const v = 2 * phs[j] - 1; if (k) sr += v; else sl += v; } });
    const cut = o.cut ?? 0.035; lpL += cut * (sl - lpL); lpR += cut * (sr - lpR);
    const env = Math.min(1, t / (o.atk ?? 0.25)) * Math.min(1, (dur - t) / (o.rel ?? 0.25));
    const gg = env * g * 0.034 * duck(t0 + t);
    put(at(t0) + n, lpL * gg, lpR * gg, 0.5);
  }
}
// FM bell for the logo moments
function bell(t0, m, g = 1, p = 0, len = 2.4) {
  const f = mtof(m), [a, b] = pan(p);
  for (let n = 0; n < len * SR; n++) { const t = n / SR; const mod = Math.sin(TAU * f * 3.5 * t) * 1.6 * Math.exp(-t * 4); const v = Math.sin(TAU * f * t + mod) * Math.exp(-t * 2.2) * g * 0.12; put(at(t0) + n, v * a, v * b, 0.45, 0.25); }
}
// warm pluck (melody)
function pluck(t0, m, g = 1, p = 0) {
  let ph = 0, lp = 0; const f = mtof(m), [a, b] = pan(p);
  for (let n = 0; n < 0.35 * SR; n++) { const t = n / SR; ph = (ph + f / SR) % 1; const x = Math.sin(TAU * ph) * 0.7 + (2 * ph - 1) * 0.3; lp += (0.06 + 0.4 * Math.exp(-t * 30)) * (x - lp); const v = lp * Math.exp(-t * 9) * g * 0.13 * duck(t0 + t); put(at(t0) + n, v * a, v * b, 0.25, 0.35); }
}
// ---- sound effects (kept well under the music) ----
function whoosh(t0, dur, g = 1, up = true) {
  let b1 = 0, b2 = 0;
  for (let n = 0; n < dur * SR; n++) { const k = n / (dur * SR), fc = up ? 300 + 3500 * k * k : 3800 - 3400 * k, f = 2 * Math.sin(Math.PI * fc / SR); b1 += f * (noise() - b2 - 0.5 * b1); b2 += f * b1; const v = b1 * Math.sin(Math.PI * k) ** 1.5 * g * 0.16; put(at(t0) + n, v * (1 - 0.5 * k), v * (0.5 + 0.5 * k), 0.3); }
}
function click(t0, g = 1, f = 2400) {
  for (let n = 0; n < 0.03 * SR; n++) { const t = n / SR; const v = (Math.sin(TAU * f * t) * 0.6 + noise() * 0.4) * Math.exp(-t * 260) * g * 0.08; put(at(t0) + n, v, v, 0.05); }
}
function blip(t0, m, g = 1, p = 0) {
  const f = mtof(m), [a, b] = pan(p);
  for (let n = 0; n < 0.12 * SR; n++) { const t = n / SR; const v = Math.sin(TAU * f * t) * Math.exp(-t * 35) * g * 0.07; put(at(t0) + n, v * a, v * b, 0.2); }
}
function softImpact(t0, g = 1) {
  let ph = 0, lp = 0;
  for (let n = 0; n < 1.6 * SR; n++) { const t = n / SR; ph += TAU * (38 + 40 * Math.exp(-t * 9)) / SR; lp += 0.08 * (noise() - lp); const v = (Math.sin(ph) * Math.exp(-t * 3) * 0.55 + lp * Math.exp(-t * 4) * 0.18) * g; put(at(t0) + n, v, v, 0.3); }
}
function riser(t0, dur, g = 1) {
  let b1 = 0, b2 = 0;
  for (let n = 0; n < dur * SR; n++) { const k = n / (dur * SR), f = 2 * Math.sin(Math.PI * (400 + 6000 * k * k) / SR); b1 += f * (noise() - b2 - 0.4 * b1); b2 += f * b1; const v = b1 * k * k * g * 0.12; put(at(t0) + n, v, v, 0.35); }
}
function swell(tEnd, dur, g = 1) {
  let lp = 0;
  for (let n = 0; n < dur * SR; n++) { const k = n / (dur * SR); lp += (0.02 + 0.2 * k) * (noise() - lp); const v = lp * k ** 3 * g * 0.3; put(at(tEnd - dur) + n, v, v, 0.5); }
}


// ---------- sci-fi instruments ----------
function bigKick(t0, g = 1) { KICKS.push(t0); let ph = 0; for (let n = 0; n < 0.45 * SR; n++) { const t = n / SR; ph += TAU * (42 + 210 * Math.exp(-t * 42)) / SR; const v = Math.tanh((Math.sin(ph) * Math.exp(-t * 6.5) + (n < 160 ? noise() * 0.8 * (1 - n / 160) : 0)) * 3) * 0.62 * g; put(at(t0) + n, v, v); } }
function snap(t0, g = 1) { let b1 = 0, b2 = 0; for (let n = 0; n < 0.28 * SR; n++) { const t = n / SR, f = 2 * Math.sin(Math.PI * 1900 / SR); b1 += f * (noise() - b2 - 0.4 * b1); b2 += f * b1; const v = (Math.tanh(b1 * 2.2) * Math.exp(-t * 13) + Math.sin(TAU * 230 * t) * 0.4 * Math.exp(-t * 35)) * g * 0.5; put(at(t0) + n, v, v, 0.35); } }
function reese(t0, dur, m, g = 1) { const f = mtof(m); let p1 = 0, p2 = 0, lp = 0, lp2 = 0; for (let n = 0; n < dur * SR; n++) { const t = n / SR; p1 = (p1 + f * 0.996 / SR) % 1; p2 = (p2 + f * 1.004 / SR) % 1; const x = (2 * p1 - 1) + (2 * p2 - 1); const cut = 0.025 + 0.02 * (0.5 + 0.5 * Math.sin(TAU * t * 2)); lp += cut * (x - lp); lp2 += cut * (lp - lp2); const env = Math.min(1, t / 0.005) * Math.min(1, (dur - t) / 0.02); const v = (Math.tanh(lp2 * 2) * 0.55 + Math.sin(TAU * f * t) * 0.5) * env * g * 0.42 * duck(t0 + t); put(at(t0) + n, v, v); } }
function laser(t0, g = 1, p = 0, f0 = 2400, f1 = 200) { const [a, b] = pan(p); let ph = 0; for (let n = 0; n < 0.22 * SR; n++) { const t = n / SR, k = t / 0.22, f = f0 * Math.pow(f1 / f0, k); ph += TAU * f / SR; const v = Math.sign(Math.sin(ph)) * 0.5 * Math.exp(-t * 14) * g * 0.08; put(at(t0) + n, v * a, v * b, 0.3, 0.4); } }
function arpSaw(t0, m, g = 1, p = 0) { const f = mtof(m), [a, b] = pan(p); let ph = 0, lp = 0; for (let n = 0; n < 0.14 * SR; n++) { const t = n / SR; ph = (ph + f / SR) % 1; lp += (0.08 + 0.5 * Math.exp(-t * 30)) * ((2 * ph - 1) - lp); const v = lp * Math.exp(-t * 16) * g * 0.1 * duck(t0 + t); put(at(t0) + n, v * a, v * b, 0.3, 0.45); } }
function braam(t0, dur, chord, g = 1) { const [root, iv] = chord; [root - 12, root, root + iv[1], root + iv[2]].forEach((m, k) => { const f = mtof(m); let ph = 0, lp = 0; for (let n = 0; n < dur * SR; n++) { const t = n / SR; ph = (ph + f / SR) % 1; lp += (0.01 + 0.15 * Math.exp(-t * 3)) * ((2 * ph - 1) - lp); const v = Math.tanh(lp * 3) * Math.exp(-t * 1.5) * g * 0.07 * Math.min(1, (dur - t) / 0.3); put(at(t0) + n, v, v, 0.5); } }); }
function zapRise(t0, dur, g = 1) { let ph = 0; for (let n = 0; n < dur * SR; n++) { const t = n / SR, k = t / dur; ph += TAU * (120 + 2000 * k * k) / SR; const v = (Math.sin(ph) + 0.3 * Math.sign(Math.sin(ph * 2.01))) * k * k * g * 0.06; put(at(t0) + n, v, v, 0.4); } }

function popS(t0, g = 1, f = 900) { let ph = 0; for (let n = 0; n < 0.09 * SR; n++) { const t = n / SR; ph += TAU * (f * (1 + 2.5 * Math.exp(-t * 60))) / SR; const v = Math.sin(ph) * Math.exp(-t * 38) * g * 0.16; put(at(t0) + n, v, v, 0.15); } }
function lowPop(t0, g = 1, f = 110) { let ph = 0; for (let n = 0; n < 0.22 * SR; n++) { const t = n / SR; ph += TAU * f * (1 + 1.2 * Math.exp(-t * 40)) / SR; const v = (Math.tanh(Math.sin(ph) * 1.8) * Math.exp(-t * 16) + (n < 90 ? noise() * 0.4 * (1 - n / 90) : 0)) * g * 0.34; put(at(t0) + n, v, v, 0.12); } }
function tomHit(t0, g = 1, f = 150) { let ph = 0; for (let n = 0; n < 0.35 * SR; n++) { const t = n / SR; ph += TAU * f * (1 + 0.7 * Math.exp(-t * 22)) / SR; const v = Math.tanh(Math.sin(ph) * 2.2) * Math.exp(-t * 9) * g * 0.26; put(at(t0) + n, v * 0.9, v, 0.25); } }
function clangS(t0, g = 1, base = 55) { const parts = [[1, 1, 3], [2.76, 0.5, 5], [5.4, 0.28, 7], [1.5, 0.3, 4]];
  for (let n = 0; n < 1.1 * SR; n++) { const t = n / SR; let v = 0; for (const [r, a, d] of parts) v += Math.sin(TAU * base * 2 * r * t + 0.7 * Math.sin(TAU * base * r * 3.01 * t) * Math.exp(-t * 7)) * a * Math.exp(-t * d);
    v = Math.tanh(v * 1.5) * 0.13 * g; const sb = Math.sin(TAU * base * (1 + 1.5 * Math.exp(-t * 20)) * t) * Math.exp(-t * 7) * 0.24 * g; put(at(t0) + n, v + sb, v * 0.95 + sb, 0.35, 0.08); } }
function saws(t0, dur, chord, g = 1, wob = 0) { const [root, iv] = chord; const notes = [root + 12, root + 12 + iv[1], root + 12 + iv[2], root + 24, root + 24 + iv[1]]; const ph = notes.flatMap(() => [rnd(), rnd(), rnd()]); let lpL = 0, lpR = 0;
  for (let n = 0; n < dur * SR; n++) { const t = n / SR; let l = 0, r = 0; notes.forEach((m, i) => { [-0.12, 0, 0.12].forEach((d, k) => { const j = i * 3 + k; ph[j] = (ph[j] + mtof(m + d) / SR) % 1; const v = 2 * ph[j] - 1; if (k === 0) l += v; else if (k === 2) r += v; else { l += v * 0.5; r += v * 0.5; } }); });
    const cut = 0.06 + 0.05 * (wob ? 0.5 + 0.5 * Math.sin(TAU * wob * t) : 1); lpL += cut * (l - lpL); lpR += cut * (r - lpR);
    const env = Math.min(1, t / 0.008) * Math.min(1, (dur - t) / 0.03) * (0.55 + 0.45 * Math.min(1, t / 0.2)); const gg = env * g * 0.022 * duck(t0 + t); put(at(t0) + n, lpL * gg, lpR * gg, 0.3); } }
function tick(t0, g = 1, f = 2000) { for (let n = 0; n < 0.03 * SR; n++) { const t = n / SR, v = Math.sin(TAU * f * t) * Math.exp(-t * 200) * g * 0.12; put(at(t0) + n, v, v, 0.05); } }
function key(t0, g = 1, f = 3200) { for (let n = 0; n < 0.035 * SR; n++) { const t = n / SR, v = (Math.sin(TAU * f * t) * 0.4 + noise() * 0.6) * Math.exp(-t * 180) * g * 0.16; put(at(t0) + n, v, v, 0.05); } }
function metal(t0, g = 1) { snap(t0, 0.9 * g); for (let n = 0; n < 0.18 * SR; n++) { const t = n / SR, v = (Math.sin(TAU * 1730 * t) * 0.5 + Math.sin(TAU * 2410 * t) * 0.4 + Math.sign(Math.sin(TAU * 410 * t)) * 0.3) * Math.exp(-t * 22) * g * 0.07; put(at(t0) + n, v, v, 0.3); } }
function gated(t0, dur, chord, g = 1) { const [root, iv] = chord; const notes = [root + 12, root + 12 + iv[1], root + 12 + iv[2], root + 24], ph = notes.map(() => 0); let lp = 0;
  for (let n = 0; n < dur * SR; n++) { const t = n / SR; let x = 0; notes.forEach((m, i) => { ph[i] = (ph[i] + mtof(m) * (1 + (i % 2 ? 0.004 : -0.004)) / SR) % 1; x += 2 * ph[i] - 1; });
    lp += 0.12 * (Math.tanh(x * 0.9) - lp); const gate = ((t * 8) % 1) < 0.55 ? 1 : 0.08, env = Math.min(1, t / 0.01) * Math.min(1, (dur - t) / 0.03); const v = lp * gate * env * g * 0.07 * duck(t0 + t); put(at(t0) + n, v * 0.9, v, 0.25, 0.2); } }
function e808(t0, dur, m, g = 1) { let ph = 0; for (let n = 0; n < dur * SR; n++) { const t = n / SR, f = mtof(m) * (1 + 1.5 * Math.exp(-t * 30)); ph += TAU * f / SR; const v = Math.tanh(Math.sin(ph) * 2.2) * Math.min(1, t / 0.004) * Math.min(1, (dur - t) / 0.05) * g * 0.5 * duck(t0 + t + 0.02); put(at(t0) + n, v, v); } }
function roll(t0, t1, g = 1) { const n = Math.round((t1 - t0) / 0.0625); for (let k = 0; k < n; k++) snap(t0 + k * 0.0625, (0.1 + 0.6 * k / n) * g); }
// ---------- arrangement (15s, 120 BPM) ----------
const bassOf = (root) => 24 + ((root % 12) + 12) % 12;
const SEQ = [0, 2, 1, 3, 2, 0, 3, 1];
function groove(t0, t1, o = {}) {
  for (let t = t0; t < t1 - 1e-6; t += BT) { const b = Math.round(t / BT), [root] = chordAt(t);
    bigKick(t, o.kick ?? 1); if (b % 2 === 1) { clap(t, 0.6); snap(t, 0.35); } hat(t + BT / 2, 0.11, b % 4 === 3, 0.2); hat(t + BT / 4, 0.05, false, -0.3); hat(t + BT * 0.75, 0.06, false, 0.3);
    bassNote(t + BT / 2, BT * 0.42, bassOf(root) + 12, o.bass ?? 1, 50); }
  for (let t = t0; t < t1 - 1e-6; t += 1) [0, 0.375, 0.75].forEach((d) => { if (t + d < t1) saws(t + d, 0.2, chordAt(t + d), o.saw ?? 0.85); });
  for (let s = 0; s < (t1 - t0) / 0.125 - 1e-6; s++) { const t = t0 + s * 0.125, [root, iv] = chordAt(t); if (s % 2 === 0 || o.dbl) arpSaw(t, root + 24 + iv[SEQ[s % 8]] + (s % 16 >= 12 ? 12 : 0), o.arp ?? 0.6, s % 2 ? 0.5 : -0.5); }
}
// soap-bubble bloop: quick upward sine chirp
function bloop(t0, g = 1, f = 500, p = 0) { const [a, b] = pan(p); let ph = 0; for (let n = 0; n < 0.12 * SR; n++) { const t = n / SR; ph += TAU * f * (1 + 2.2 * (1 - Math.exp(-t * 40))) / SR; const v = Math.sin(ph) * Math.min(1, t / 0.003) * Math.exp(-t * 30) * g * 0.13; put(at(t0) + n, v * a, v * b, 0.3, 0.2); } }
// scissor snip: two bright metallic ticks
function snip(t0, g = 1) { for (const [d, f] of [[0, 5200], [0.045, 4300]]) for (let n = 0; n < 0.04 * SR; n++) { const t = n / SR, v = (Math.sin(TAU * f * t) * 0.5 + noise() * 0.5) * Math.exp(-t * 150) * g * 0.14; put(at(t0 + d) + n, v, v, 0.15); } }
// friendly bus horn: two bright, light tones (major third, ~C5/E5) with a little air so it cuts through the groove
function honk(t0, dur, g = 1) { let lp = 0, p1 = 0, p2 = 0; for (let n = 0; n < dur * SR; n++) { const t = n / SR; p1 = (p1 + 523 / SR) % 1; p2 = (p2 + 659 / SR) % 1; const x = (p1 < 0.5 ? 1 : -1) * 0.7 + (p2 < 0.5 ? 1 : -1) * 0.7 + Math.sin(TAU * 1046 * t) * 0.3; lp += 0.22 * (x - lp); const v = Math.tanh(lp * 1.3) * Math.min(1, t / 0.008) * Math.min(1, (dur - t) / 0.03) * g * 0.16; put(at(t0) + n, v, v * 0.95, 0.2); } }
// ---- 20s cut: the 15s design timeline plays slower (more reading time). Design time d → real time F(d); knots shared with pp.js.
// Grooves stay on the real 120 BPM grid; every hit sits at F(its picture cue). Scene boundaries land on beats.
const KN = [[0, 0], [1.5, 2], [4, 5.5], [6.5, 8.5], [9.5, 13], [12, 16.5], [15, 20]];
const F = (d) => { for (let i = 0; i < KN.length - 1; i++) { const [d0, r0] = KN[i], [d1, r1] = KN[i + 1]; if (d <= d1 || i === KN.length - 2) return r0 + (d - d0) * (r1 - r0) / (d1 - d0); } return d; };
const span = (a, b) => F(b) - F(a);
// crest (real 0–2): rising shimmer, the reveal, eye glints
riser(0, F(0.75), 1.0); swell(F(0.75), 0.9, 0.7); for (let i = 0; i < 10; i++) bloop(F(0.05 + i * 0.07), 0.4, 400 + i * 50, (i % 2 ? 0.5 : -0.5));
bigKick(F(0.75), 1.1); softImpact(F(0.75), 1.3); braam(F(0.75), 1.1, CH.A, 1.0); clangS(F(0.75), 0.8, 55); bell(F(0.77), 81, 0.35, 0, 1.6);
bell(F(1.05), 88, 0.25, -0.4, 1.0); bell(F(1.1), 93, 0.22, 0.4, 1.0); whoosh(F(1.25), span(1.25, 1.55), 1.3, true);
// headline (real 2–5.5): word slams, paw stamps, big paw
softImpact(2.0, 1.0); groove(2.0, 5.25, { dbl: true });
[1.55, 1.64, 1.73, 1.82].map(F).forEach((t, i) => (i % 2 ? tomHit : lowPop)(t, 0.85, i % 2 ? 140 : 110)); [2.3, 2.39, 2.48].map(F).forEach((t, i) => (i % 2 ? popS : lowPop)(t, 0.85, i % 2 ? 900 : 105));
for (let i = 0; i < 8; i++) lowPop(F(1.6 + i * 0.25), 0.35, 160 + i * 8); tomHit(F(2.85), 1, 120); clangS(F(2.85), 0.6, 60);
for (let i = 0; i < 6; i++) bloop(F(3.0 + i * 0.09), 0.5, 600 + i * 70, i % 2 ? 0.4 : -0.4); riser(F(3.5), span(3.5, 4.0), 1.0); whoosh(F(3.8), span(3.8, 4.1), 1.4, true);
// the bus (real 5.5–8.5)
bigKick(5.5, 1.1); softImpact(5.5, 1.2); groove(5.5, 8.25, { bass: 1.1 }); whoosh(5.5, span(4.0, 4.55), 1.4, false); tomHit(F(4.55), 1, 90);
honk(F(4.62), 0.18, 1); honk(F(4.84), 0.34, 1); popS(F(4.5), 0.7, 900); [4.75, 4.95].map(F).forEach((t) => lowPop(t, 0.8, 110));
for (let i = 0; i < 4; i++) (i % 2 ? popS : bloop)(F(5.3 + i * 0.12), 0.7, i % 2 ? 950 : 520); riser(F(6.0), span(6.0, 6.5), 0.9); whoosh(F(6.3), span(6.3, 6.6), 1.3, true);
// services (real 8.5–13)
bigKick(8.5, 1.0); softImpact(8.5, 1.0); groove(8.5, 12.75, { saw: 0.7 });
[6.55, 7.05].forEach((T0, i) => { whoosh(F(T0), 0.4, 1.0, i === 0); lowPop(F(T0 + 0.3), 0.9, 100); clangS(F(T0 + 0.3), 0.6, 58 + i * 6); snip(F(T0 + 0.7), 1.0); snip(F(T0 + 0.82), 0.8); for (let j = 0; j < 4; j++) bloop(F(T0 + 0.7 + j * 0.1), 0.4, 700 + j * 60, i ? 0.4 : -0.4); popS(F(T0 + 1.15), 0.7, 950); });
click(F(8.75), 1.6, 1400); click(F(8.87), 1.4, 1500); lowPop(F(8.75), 0.8, 120); whoosh(F(9.2), span(9.2, 9.55), 1.3, true);
// happy pups + 07+ years (real 13–16.5)
bigKick(13.0, 1.0); softImpact(13.0, 1.0); groove(13.0, 16.25, { kick: 0.85, saw: 0.6, arp: 0.55 });
[9.55, 9.7, 9.85].map(F).forEach((t, i) => (i % 2 ? popS : lowPop)(t, 0.8, i % 2 ? 900 : 115)); clangS(F(10.0), 0.9, 52);
for (let i = 1; i <= 7; i++) tick(F(10.1 + 0.7 * (1 - Math.pow(1 - i / 7, 1 / 3)) * 0.98), 0.7, 2000 + i * 120);
[10.4, 10.65, 10.9].map(F).forEach((t, i) => bell(t, 88 + i * 3, 0.22, i % 2 ? 0.5 : -0.5, 0.9)); riser(F(11.4), span(11.4, 12.0), 1.0); whoosh(F(11.75), span(11.75, 12.1), 1.4, true);
// end card (real 16.5–20)
bigKick(16.5, 1.15); softImpact(16.5, 1.4); braam(16.5, 2.6, CH.A, 1.2); clangS(16.5, 0.9, 49); pad(16.5, 3.5, CH.A, 1.0, { atk: 0.05, rel: 1.8 });
[12.35, 12.5].map(F).forEach((t, i) => (i ? tomHit : lowPop)(t, 0.8, i ? 130 : 110)); popS(F(12.9), 0.8, 900); bloop(F(13.2), 0.5, 600); lowPop(F(13.35), 0.8, 115);
click(F(13.6), 1.6, 1400); bell(F(13.62), 85, 0.3, 0, 1.2); bloop(F(13.7), 0.6, 700, 0.3);
groove(17.0, 19.5, { kick: 0.6, bass: 0.6, saw: 0.45, arp: 0.45 });

// ---------- FX + master ----------
function delay(time, fb, mix) { const d = Math.round(time * SR), bL = new Float32Array(N), bR = new Float32Array(N); for (let n = 0; n < N; n++) { bL[n] = dlyL[n] + (n >= d ? bR[n - d] * fb : 0); bR[n] = n >= d ? bL[n - d] * fb : 0; } for (let n = 0; n < N; n++) { L[n] += (bL[n] - dlyL[n]) * mix; Rr[n] += bR[n] * mix; } }
function reverb(mix) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356], aps = [225, 556, 441];
  const run = (inp, sp) => { const o = new Float32Array(N); for (const c0 of combs) { const c = Math.round((c0 + sp) * SR / 44100 * 1.6), buf = new Float32Array(c); let p = 0, lp = 0; for (let n = 0; n < N; n++) { const y = buf[p]; lp = y * 0.6 + lp * 0.4; buf[p] = inp[n] + lp * 0.86; p = (p + 1) % c; o[n] += y / combs.length; } } for (const a0 of aps) { const a = Math.round((a0 + sp) * SR / 44100), buf = new Float32Array(a); let p = 0; for (let n = 0; n < N; n++) { const b = buf[p], x = o[n]; buf[p] = x + b * 0.5; o[n] = -x + b; p = (p + 1) % a; } } return o; };
  const oL = run(revL, 0), oR = run(revR, 23); for (let n = 0; n < N; n++) { L[n] += oL[n] * mix; Rr[n] += oR[n] * mix; }
}
delay(0.375, 0.35, 0.45); reverb(0.3);
let hL = 0, hR = 0, pL = 0, pR = 0, peak = 0;
for (let n = 0; n < N; n++) {
  hL = 0.9996 * (hL + L[n] - pL); pL = L[n]; hR = 0.9996 * (hR + Rr[n] - pR); pR = Rr[n];
  const fade = Math.min(1, (N - n) / (0.9 * SR)), fin = Math.min(1, n / (0.004 * SR));
  L[n] = Math.tanh(hL * 1.1) * fade * fin; Rr[n] = Math.tanh(hR * 1.1) * fade * fin; peak = Math.max(peak, Math.abs(L[n]), Math.abs(Rr[n]));
}
const g = 0.88 / peak, pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) { pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4); pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rr[n] * g)) * 32767), 46 + n * 4); }
const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'out'); mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'prancing_pups_score.wav'), pcm);
console.log(`wrote out/prancing_pups_score.wav  ${DUR}s, 120 BPM, ${KICKS.length} kicks`);
