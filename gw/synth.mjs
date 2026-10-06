// Score for the GIBWORK promo (15s) — bright, punchy 120 BPM groove in F major (F–C–Dm–Bb), synthesized entirely in code.
// Pixel-logo snap 0.75 · headline slams 1.5 · task slot-machine ticks 2.0–2.95 · bounty counter 3.25 · board 4.0 ·
// phone taps 7.05/8.05, typing 7.5, payout coin cascade 8.55 · earners 9.5 · category cuts 11.5–12.5 · end card 12.75.
//   node gw/synth.mjs  ->  out/gibwork_score.wav
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000, DUR = 15, N = SR * DUR, TAU = Math.PI * 2, BT = 0.5;
const L = new Float32Array(N), Rr = new Float32Array(N), revL = new Float32Array(N), revR = new Float32Array(N), dlyL = new Float32Array(N), dlyR = new Float32Array(N);
let seed = 777;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const at = (t) => Math.round(t * SR);
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4) * Math.SQRT2, Math.sin((p + 1) * Math.PI / 4) * Math.SQRT2];
function put(i, l, r, rev = 0, dly = 0) { if (i < 0 || i >= N) return; L[i] += l; Rr[i] += r; if (rev) { revL[i] += l * rev; revR[i] += r * rev; } if (dly) { dlyL[i] += l * dly; dlyR[i] += r * dly; } }

// ---- harmony ----
const CH = { F: [41, [0, 4, 7, 11]], C: [36, [0, 4, 7, 9]], Dm: [38, [0, 3, 7, 10]], Bb: [34, [0, 4, 7, 9]] };
const BARS = ['F', 'C', 'Dm', 'Bb'];
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
// 0–1.5 pixel logo: blocks ticking in over a riser, the snap, the wordmark, the iris
riser(0, 0.75, 1.0); zapRise(0.4, 0.35, 0.9); for (let i = 0; i < 22; i++) tick(0.08 + i * 0.03 + (i % 3) * 0.006, 0.35 + i * 0.02, 1400 + i * 90);
bigKick(0.75, 1.1); softImpact(0.75, 1.3); braam(0.75, 1.2, CH.F, 1.1); clangS(0.75, 0.9, 49); laser(0.75, 0.5, 0, 2600, 300);
for (let i = 0; i < 7; i++) (i % 2 ? popS : lowPop)(1.0 + i * 0.03, 0.55, i % 2 ? 900 + i * 40 : 120); bell(1.25, 77, 0.35, 0.2, 1.0); whoosh(1.28, 0.24, 1.2, true);
// 1.5–4.0 hero
softImpact(1.5, 1.0); groove(1.5, 3.75, { dbl: true });
lowPop(1.5, 1, 110); tomHit(1.62, 0.9, 140); clangS(1.75, 0.8, 55); [1.92, 1.98, 2.04, 2.1].forEach((t, i) => bell(t, 84 + [0, 4, 7, 12][i], 0.18, i % 2 ? 0.4 : -0.4, 0.6));
for (let k = 1; k <= 6; k++) { const x = -Math.log2(1 - k / 6.0001) / 10; key(2.0 + x * 0.95, 0.8, 2600 - k * 120); }
metal(2.95, 0.8); lowPop(2.98, 0.8, 115); popS(3.06, 0.7, 850); lowPop(3.14, 0.8, 105); popS(3.22, 0.9, 1000); tomHit(3.34, 0.9, 130);
for (let i = 0; i < 14; i++) tick(3.25 + 0.45 * (1 - Math.pow(1 - i / 14, 2)), 0.5, 2400 + i * 60); riser(3.45, 0.55, 1.1); zapRise(3.7, 0.3, 1.0); whoosh(3.72, 0.28, 1.3, true);
// 4.0–6.5 bounty board
bigKick(4.0, 1.1); softImpact(4.0, 1.3); braam(4.0, 0.9, CH.Dm, 1.0); groove(4.0, 6.0, { bass: 1.1 });
for (let r = 0; r < 12; r++) (r % 2 ? popS : lowPop)(4.0 + r * 0.04, 0.4, r % 2 ? 800 + r * 30 : 120); [4.25, 4.5].forEach((t) => tomHit(t, 0.8, 140));
whoosh(5.95, 0.4, 1.2, true); zapRise(6.15, 0.35, 1.0); riser(6.0, 0.5, 0.9);
// 6.5–9.5 phone flow
bigKick(6.5, 1.1); softImpact(6.5, 1.2); clangS(6.5, 0.9, 52); groove(6.5, 9.25, { saw: 0.7 });
click(7.05, 1.6, 1300); lowPop(7.05, 0.9, 100); whoosh(7.27, 0.2, 1.0, false); tomHit(7.35, 1, 120); clangS(7.41, 0.6, 60);
for (let i = 0; i < 13; i++) key(7.5 + i * 0.4 / 13, 0.7, 2600 + (i % 3) * 300); click(8.05, 1.6, 1500); clangS(8.05, 0.8, 58);
whoosh(8.25, 0.2, 1.0, true); tomHit(8.35, 1, 110); softImpact(8.35, 0.9);
for (let i = 0; i < 16; i++) { const t = 8.55 + i * 0.032; (i % 3 === 2 ? lowPop : popS)(t, 0.5, i % 3 === 2 ? 130 : 1100 + i * 50); } [79, 84, 88, 91].forEach((m, i) => bell(8.55 + i * 0.06, m, 0.28, i % 2 ? 0.5 : -0.5, 1.0)); clangS(9.05, 0.9, 49); bell(9.05, 96, 0.25, 0, 1.2);
riser(9.0, 0.5, 0.8);
// 9.5–11.5 earners
bigKick(9.5, 1.0); softImpact(9.5, 1.0); groove(9.5, 11.25, { kick: 0.8, saw: 0.6, arp: 0.55 });
for (let i = 0; i < 9; i++) popS(9.6 + i * 0.04, 0.35, 900 + i * 60); for (let i = 0; i < 8; i++) (i % 2 ? popS : lowPop)(9.75 + i * 0.07, 0.65, i % 2 ? 950 : 115);
riser(11.0, 0.5, 1.0); whoosh(11.22, 0.28, 1.4, true);
// 11.5–12.75 category beat cuts
[11.5, 11.75, 12.0, 12.25, 12.5].forEach((t, i) => { bigKick(t, 1.0); [() => clangS(t, 0.8, 55), () => tomHit(t, 1, 120), () => metal(t, 0.9), () => lowPop(t, 1, 100), () => clangS(t, 0.8, 49)][i](); laser(t, 0.35, i % 2 ? 0.5 : -0.5, 2000 + i * 300, 300); });
groove(11.5, 12.5, { dbl: true, kick: 0 }); roll(12.5, 12.75, 1);
// 12.75–15 end card
bigKick(12.75, 1.15); softImpact(12.75, 1.5); braam(12.75, 2.2, CH.F, 1.3); clangS(12.75, 0.9, 44); pad(12.75, 2.25, CH.F, 1.0, { atk: 0.05, rel: 1.5 });
for (let i = 0; i < 16; i++) tick(12.78 + i * 0.022, 0.4, 1800 + i * 80); for (let i = 0; i < 7; i++) (i % 2 ? popS : lowPop)(12.95 + i * 0.035, 0.55, i % 2 ? 900 : 115);
bell(13.3, 77, 0.3, 0, 1.2); popS(13.55, 0.8, 900); lowPop(13.65, 0.8, 110); bell(13.85, 84, 0.3, 0.3, 1.0);
groove(13.25, 14.5, { kick: 0.55, bass: 0.6, saw: 0.4, arp: 0.4 });

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
writeFileSync(resolve(out, 'gibwork_score.wav'), pcm);
console.log(`wrote out/gibwork_score.wav  ${DUR}s, 120 BPM, ${KICKS.length} kicks`);
