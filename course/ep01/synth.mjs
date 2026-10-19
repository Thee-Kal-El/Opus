// Score for BLOCKCHAIN 101 · EP01 — 180s of dark electric phonk, synthesized entirely in code (no samples).
// F# phrygian, 120 BPM (bar = 2s, matches the film's grid). Detuned 808-ratio cowbell riffs, distorted sliding 808s, crunchy
// claps, rolling hats, dark detuned drone. Arrangement follows the picture: lo-fi boot 0–6 · drop 6 · groove A 12–30 ·
// full groove under the key sectors 30–78 · lighter groove B under the history cards 78–122 · half-time "gatekeeper" tension 122–129.6 →
// shatter → rebuild → drop 134 · careers 146–168 · outro 168–180. Every bullet / card / block has its own SFX.
//   node course/ep01/synth.mjs  ->  out/blockchain101_ep01_score.wav
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000, DUR = 180, N = SR * DUR, TAU = Math.PI * 2, BT = 0.5;
const L = new Float32Array(N), Rr = new Float32Array(N), revL = new Float32Array(N), revR = new Float32Array(N), dlyL = new Float32Array(N), dlyR = new Float32Array(N);
let seed = 2008;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const at = (t) => Math.round(t * SR);
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4) * Math.SQRT2, Math.sin((p + 1) * Math.PI / 4) * Math.SQRT2];
function put(i, l, r, rev = 0, dly = 0) { if (i < 0 || i >= N) return; L[i] += l; Rr[i] += r; if (rev) { revL[i] += l * rev; revR[i] += r * rev; } if (dly) { dlyL[i] += l * dly; dlyR[i] += r * dly; } }
const KICKS = [];
const duck = (t) => { let g = 1; for (const k of KICKS) { const d = t - k; if (d >= 0 && d < 0.3) g = Math.min(g, 1 - 0.6 * Math.exp(-d * 12)); } return g; };

// ---------------- instruments ----------------
function kick(t0, g = 1) {
  KICKS.push(t0); let ph = 0;
  for (let n = 0; n < 0.35 * SR; n++) { const t = n / SR; ph += TAU * (50 + 170 * Math.exp(-t * 38)) / SR; const click = n < 120 ? noise() * (1 - n / 120) * 0.6 : 0; const v = Math.tanh((Math.sin(ph) * Math.exp(-t * 9) + click) * 2.4) * 0.6 * g; put(at(t0) + n, v, v); }
}
// phonk clap/snare: layered noise bursts, crunchy
function clap(t0, g = 1) {
  let b1 = 0, b2 = 0;
  for (let n = 0; n < 0.3 * SR; n++) { const t = n / SR, f = 2 * Math.sin(Math.PI * 1300 / SR); b1 += f * (noise() - b2 - 0.45 * b1); b2 += f * b1; const env = (t < 0.03 ? Math.exp(-((t * 100) % 1) * 2.5) : 1) * Math.exp(-t * 11); const tone = Math.sin(TAU * 180 * t) * Math.exp(-t * 25) * 0.6; const v = Math.tanh((b1 * 1.6 + tone) * env * 2) * g * 0.42; put(at(t0) + n, v * 0.95, v, 0.35); }
}
function hat(t0, g, open = false, p = 0) {
  let hp = 0, prev = 0; const [a, b] = pan(p);
  for (let n = 0; n < (open ? 0.18 : 0.04) * SR; n++) { const x = noise(); hp = 0.95 * (hp + x - prev); prev = x; const v = hp * Math.exp(-n / SR * (open ? 16 : 95)) * g; put(at(t0) + n, v * a, v * b, 0.06); }
}
// the phonk cowbell: two detuned pulse waves (808-style ratio), band-limited, waveshaped
function cowbell(t0, m, g = 1, p = 0, dec = 13) {
  const f = mtof(m), [a, b] = pan(p); let ph1 = 0, ph2 = 0, lp = 0, hp = 0, prev = 0;
  for (let n = 0; n < 0.32 * SR; n++) {
    const t = n / SR; ph1 = (ph1 + f / SR) % 1; ph2 = (ph2 + f * 1.4836 / SR) % 1;
    const x = (ph1 < 0.5 ? 1 : -1) * 0.6 + (ph2 < 0.5 ? 1 : -1) * 0.4;
    lp += 0.35 * (x - lp); hp = 0.97 * (hp + lp - prev); prev = lp;
    const env = Math.exp(-t * dec) * (t < 0.002 ? t / 0.002 : 1);
    const v = Math.tanh(hp * env * 2.6) * g * 0.13 * (0.6 + 0.4 * duck(t0 + t));
    put(at(t0) + n, v * a, v * b, 0.22, 0.3);
  }
}
// distorted 808 with slide
function e808(t0, dur, m, g = 1, slideTo = null) {
  let ph = 0; const f0 = mtof(m), f1 = slideTo != null ? mtof(slideTo) : f0;
  for (let n = 0; n < (dur + 0.06) * SR; n++) {
    const t = n / SR, sk = slideTo != null ? Math.min(1, Math.max(0, (t - dur * 0.45) / (dur * 0.4))) : 0;
    const f = (f0 + (f1 - f0) * sk * sk * (3 - 2 * sk)) * (1 + 1.6 * Math.exp(-t * 45)); ph += TAU * f / SR;
    const env = Math.min(1, t / 0.003) * (t < dur ? Math.exp(-t * 1.6) : Math.exp(-dur * 1.6) * Math.exp(-(t - dur) * 50));
    const v = Math.tanh(Math.sin(ph) * 3.2) * 0.85 * env * g * 0.42;
    put(at(t0) + n, v, v);
  }
}
// dark drone pad (detuned saws, very dark filter)
function drone(t0, dur, notes, g = 1, cut = 0.012) {
  const phs = notes.flatMap(() => [rnd(), rnd(), rnd()]); let lpL = 0, lpR = 0, lp2L = 0, lp2R = 0;
  for (let n = 0; n < dur * SR; n++) {
    const t = n / SR; let sl = 0, sr = 0;
    notes.forEach((m, i) => [-0.1, 0, 0.1].forEach((d, k) => { const j = i * 3 + k; phs[j] = (phs[j] + mtof(m + d) / SR) % 1; const v = 2 * phs[j] - 1; if (k === 0) sl += v; else if (k === 2) sr += v; else { sl += v * 0.5; sr += v * 0.5; } }));
    lpL += cut * (sl - lpL); lp2L += cut * (lpL - lp2L); lpR += cut * (sr - lpR); lp2R += cut * (lpR - lp2R);
    const env = Math.min(1, t / 0.4) * Math.min(1, (dur - t) / 0.3);
    put(at(t0) + n, lp2L * env * g * 0.09 * duck(t0 + t), lp2R * env * g * 0.09 * duck(t0 + t), 0.45);
  }
}
// vinyl crackle for the lo-fi intro
function crackle(t0, dur, g = 1) { for (let k = 0; k < dur * 60; k++) { const tt = t0 + rnd() * dur, a = (rnd() * 0.6 + 0.4) * g * 0.07; for (let n = 0; n < 40; n++) { const v = noise() * a * (1 - n / 40); put(at(tt) + n, v, v); } } }
function shatter(t0, g = 1) {
  let hp = 0, prev = 0;
  for (let n = 0; n < 0.8 * SR; n++) { const t = n / SR, x = noise(); hp = 0.97 * (hp + x - prev); prev = x; const v = hp * Math.exp(-t * 8) * g * 0.4; put(at(t0) + n, v, v * 0.9, 0.35); }
  for (let k = 0; k < 24; k++) { const tt = t0 + 0.02 + rnd() * 0.7, f = 3000 + rnd() * 5000, [a, b] = pan(rnd() * 2 - 1); for (let n = 0; n < 0.1 * SR; n++) { const t = n / SR, v = Math.sin(TAU * f * t) * Math.exp(-t * 50) * g * 0.06; put(at(tt) + n, v * a, v * b, 0.35); } }
}
function boom(t0, g = 1) { let ph = 0; for (let n = 0; n < 1.6 * SR; n++) { const t = n / SR; ph += TAU * (34 + 50 * Math.exp(-t * 8)) / SR; const v = Math.tanh(Math.sin(ph) * 2) * Math.exp(-t * 2.4) * g * 0.5; put(at(t0) + n, v, v, 0.25); } }
function whoosh(t0, dur, g = 1, up = true) { let b1 = 0, b2 = 0; for (let n = 0; n < dur * SR; n++) { const k = n / (dur * SR), fc = up ? 300 + 3800 * k * k : 4000 - 3600 * k, f = 2 * Math.sin(Math.PI * fc / SR); b1 += f * (noise() - b2 - 0.5 * b1); b2 += f * b1; const v = b1 * Math.sin(Math.PI * k) ** 1.5 * g * 0.13; put(at(t0) + n, v * (1 - 0.5 * k), v * (0.5 + 0.5 * k), 0.3); } }
function riser(t0, dur, g = 1) { let b1 = 0, b2 = 0, ph = 0; for (let n = 0; n < dur * SR; n++) { const k = n / (dur * SR), f = 2 * Math.sin(Math.PI * (300 + 6000 * k * k) / SR); b1 += f * (noise() - b2 - 0.4 * b1); b2 += f * b1; ph += TAU * (80 + 500 * k * k) / SR; const v = (b1 * 0.8 + Math.sin(ph) * 0.3 * k) * k * k * g * 0.12; put(at(t0) + n, v, v, 0.35); } }
function click(t0, g = 1, f = 1500) { for (let n = 0; n < 0.03 * SR; n++) { const t = n / SR, v = (Math.sin(TAU * f * t) * 0.6 + noise() * 0.4) * Math.exp(-t * 260) * g * 0.1; put(at(t0) + n, v, v, 0.05); } }
function bell(t0, m, g = 1, p = 0, len = 1.6) { const f = mtof(m), [a, b] = pan(p); for (let n = 0; n < len * SR; n++) { const t = n / SR, mod = Math.sin(TAU * f * 3.5 * t) * 1.5 * Math.exp(-t * 4), v = Math.sin(TAU * f * t + mod) * Math.exp(-t * 2.6) * g * 0.1; put(at(t0) + n, v * a, v * b, 0.4, 0.2); } }
function pop(t0, m, g = 1, p = 0) { const f = mtof(m), [a, b] = pan(p); for (let n = 0; n < 0.1 * SR; n++) { const t = n / SR, v = Math.sin(TAU * f * t * (1 + 2 * Math.exp(-t * 60))) * Math.exp(-t * 40) * g * 0.09; put(at(t0) + n, v * a, v * b, 0.15); } }


function air(t0, dur, g = 1) { let lp = 0; for (let n = 0; n < dur * SR; n++) { const k = n / (dur * SR); lp += 0.02 * (noise() - lp); const v = lp * Math.sin(Math.PI * k) ** 2 * g * 0.5; put(at(t0) + n, v * (1 - 0.4 * k), v * (0.6 + 0.4 * k), 0.4); } }
// UI SFX — regular and deeper ones alternate so repeated bullets never sound identical
function tick(t0, g = 1, f = 2200) { for (let n = 0; n < 0.03 * SR; n++) { const t = n / SR, v = Math.sin(TAU * f * t) * Math.exp(-t * 200) * g * 0.1; put(at(t0) + n, v, v, 0.08); } }
function lowPop(t0, g = 1, f = 95) { let ph = 0; for (let n = 0; n < 0.25 * SR; n++) { const t = n / SR; ph += TAU * f * (1 + 1.4 * Math.exp(-t * 40)) / SR; const v = (Math.tanh(Math.sin(ph) * 2) * Math.exp(-t * 14) + (n < 80 ? noise() * 0.4 * (1 - n / 80) : 0)) * g * 0.3; put(at(t0) + n, v, v, 0.12); } }
function key(t0, g = 1, f = 3000) { for (let n = 0; n < 0.03 * SR; n++) { const t = n / SR, v = (Math.sin(TAU * f * t) * 0.4 + noise() * 0.6) * Math.exp(-t * 180) * g * 0.12; put(at(t0) + n, v, v, 0.04); } }
function glitch(t0, g = 1) { for (let k = 0; k < 10; k++) { const tt = t0 + k * 0.028, f = 200 + rnd() * 3000, [a, b] = pan(rnd() * 2 - 1); for (let n = 0; n < 0.026 * SR; n++) { const t = n / SR, v = Math.sign(Math.sin(TAU * f * t)) * (1 - n / (0.026 * SR)) * g * 0.07; put(at(tt) + n, v * a, v * b, 0.1); } } }
function zap(t0, g = 1, f0 = 2400, f1 = 120, dur = 0.3) { let ph = 0; for (let n = 0; n < dur * SR; n++) { const t = n / SR, k = t / dur; ph += TAU * f0 * Math.pow(f1 / f0, k) / SR; const v = Math.sign(Math.sin(ph)) * Math.exp(-t * 9) * g * 0.07; put(at(t0) + n, v, v, 0.3, 0.3); } }
function alarm(t0, dur, g = 1) { let ph = 0; for (let n = 0; n < dur * SR; n++) { const t = n / SR, f = 520 + 180 * Math.sign(Math.sin(TAU * 3 * t)); ph += TAU * f / SR; const v = Math.tanh(Math.sin(ph) * 3) * g * 0.045 * Math.min(1, (dur - t) / 0.05); put(at(t0) + n, v, v, 0.25); } }

// ---------------- the track ----------------
const R0 = 54; // F#3
const PROG = [0, 0, -4, -2];                    // i · i · VI · VII (phrygian-dark)
const RIFF_A = [0, null, 0, null, 3, null, 0, 1, 7, null, 5, null, 3, null, 1, null];
const RIFF_B = [0, null, 0, null, 3, null, 0, 1, 8, null, 7, null, 5, null, 3, 1];
const RIFF_H = [12, null, null, 7, null, null, 10, null, 8, null, null, 7, null, 5, 3, null];
function groove(t0, t1, o = {}) {
  for (let b0 = t0; b0 < t1 - 1e-6; b0 += 2) {
    const bar = Math.round(b0 / 2), tr = PROG[bar % 4], last = b0 + 2 >= t1 - 1e-6;
    // drums
    const kicks = o.half ? [0, 2.75] : [0, 1.5, 2.75, 3.5];
    for (const kb of kicks) kick(b0 + kb * BT, o.kick ?? 1);
    if (!o.noClap) for (const cb of (o.half ? [2] : [1, 3])) clap(b0 + cb * BT, o.clap ?? 1);
    for (let s = 0; s < 8; s++) hat(b0 + s * BT / 2, (s % 2 ? 0.07 : 0.11) * (o.hat ?? 1), false, 0.2);
    if (bar % 2 === 1 || o.rolls) for (let r = 0; r < 6; r++) hat(b0 + 1.5 + r * (BT / 6), (0.05 + r * 0.012) * (o.hat ?? 1), false, -0.2);
    hat(b0 + 1.75, 0.08 * (o.hat ?? 1), true, 0.3);
    // 808 with slides
    const b8 = o.half ? [[0, 1.6, 0, -5]] : [[0, 0.7, 0], [1.5, 0.45, 0], [2.75, 0.6, 0, -2], [3.5, 0.4, 0]];
    for (const [b, d, oo, sl] of b8) e808(b0 + b * BT, d, R0 - 24 + tr + oo, o.b808 ?? 1, sl != null ? R0 - 24 + tr + sl : null);
    // cowbell lead
    if (!o.noCow) { const riff = o.riff === 'H' ? RIFF_H : (bar % 2 ? RIFF_B : RIFF_A); riff.forEach((d, i) => { if (d != null) cowbell(b0 + i * 0.125, R0 + d + tr, o.cow ?? 1, (i % 2 ? 0.35 : -0.35), o.cowDec ?? 13); }); }
    drone(b0, 2.0, [R0 - 24 + tr, R0 - 17 + tr, R0 - 12 + tr], o.drone ?? 0.8, 0.014);
    if (last && o.fill) for (let k = 0; k < 8; k++) clap(b0 + 3 * BT + k * BT / 8, 0.15 + k * 0.09);
  }
}

// 0–6 · lo-fi boot: crackle, drone, filtered cowbell, typing keys, riser
crackle(0, 6.2, 1); drone(0, 6.2, [R0 - 24, R0 - 17, R0 - 12], 1.1, 0.008);
for (let b0 = 2; b0 < 6; b0 += 2) RIFF_A.forEach((d, i) => { if (d != null) cowbell(b0 + i * 0.125, R0 + d, 0.4, (i % 2 ? 0.3 : -0.3), 18); });
kick(2, 0.5); kick(4, 0.6);
const BOOTLEN = [31, 36, 36, 36, 46]; BOOTLEN.forEach((n, i) => { const T0 = 0.4 + i * 0.75; for (let k = 0; k < n; k += 2) key(T0 + (k / n) * 0.5, 0.5 + (k % 3) * 0.1, 2600 + (k % 4) * 250); });
riser(4.2, 1.8, 1.1); for (let k = 0; k < 8; k++) clap(5.0 + k * 0.125, 0.06 + k * 0.05);
// 6 · DROP — title
shatter(6.0, 1.2); boom(6.0, 1.0); zap(6.02, 0.8, 3000, 80, 0.6);
groove(6, 12, { fill: true }); boom(8, 0.4); boom(10, 0.4); [8.8, 9.0, 9.2].forEach((t, i) => lowPop(t, 0.7, 100 + i * 20));
// 12 · WHAT IS A BLOCKCHAIN
glitch(11.95, 1); boom(12, 0.8); groove(12, 30, { fill: true });
[14, 14.75, 15.5, 16.25].forEach((t, i) => { lowPop(t, 0.9, 85 + i * 8); tick(t + 0.03, 0.5, 1800 + i * 200); });
[14.5, 17.5, 20.5, 24.8].forEach((t, i) => (i % 2 ? lowPop(t, 0.8, 110) : tick(t, 0.9, 2000)));
alarm(21.2, 1.4, 1); zap(21.2, 0.9, 1800, 90, 0.5); bell(24.2, R0 + 19, 0.7, 0.2, 1.4); bell(24.35, R0 + 24, 0.5, -0.2, 1.4);
// 30 · KEY SECTORS — full groove, harder
glitch(29.95, 1); boom(30, 1); shatter(30, 0.6);
for (let k = 0; k < 8; k++) { const t = 32.2 + k * 0.18; (k % 2 ? lowPop : tick)(t, 0.8, k % 2 ? 100 + k * 6 : 2200 + k * 90); }
groove(30, 78, { rolls: true, fill: true });
for (let i = 0; i < 8; i++) { const T0 = 36 + i * 42 / 8; air(T0 - 0.12, 0.6, 0.9); zap(T0, 0.35, 2600, 300, 0.25); for (let j = 0; j < 3; j++) (j % 2 ? lowPop : tick)(T0 + 0.6 + j * 0.75, 0.7, j % 2 ? 105 : 2100); }
// 78 · HISTORY — groove B, lighter so the cards read
glitch(77.95, 1); boom(78, 0.9); air(78.2, 1.6, 0.8);
groove(78, 122, { cow: 0.7, kick: 0.85, hat: 0.8, drone: 0.9, fill: true });
for (let i = 0; i < 9; i++) { const t = 80 + i * 42 / 9; air(t - 0.15, 0.8, 0.9); lowPop(t, 0.8, 80 + (i % 3) * 15); bell(t + 0.05, R0 + 12 + [0, 3, 7][i % 3], 0.25, i % 2 ? 0.4 : -0.4, 1.0); }
// opener tunnels whoosh through
[12, 30, 78, 122, 146].forEach((T) => { whoosh(T + 0.05, 1.6, 0.9, true); });
// 122 · POWER — gatekeeper tension: half-time, alarm, long 808s, no cowbell
glitch(121.95, 1); boom(122, 1);
groove(122, 128, { half: true, noCow: true, hat: 0.6, drone: 1.2 }); alarm(124.6, 0.8, 0.6); alarm(126.6, 0.8, 0.6);
riser(127.6, 2.0, 1.2); for (let k = 0; k < 12; k++) clap(128.5 + k * 0.09, 0.05 + k * 0.04);
shatter(129.6, 1.3); boom(129.6, 1.2); zap(129.62, 0.8, 3200, 60, 0.7);
drone(129.6, 4.6, [R0 - 24, R0 - 12, R0 - 5], 1.2, 0.02); crackle(129.6, 4.4, 0.6);
RIFF_H.forEach((d, i) => { if (d != null) for (let rep = 0; rep < 2; rep++) cowbell(130 + rep * 2 + i * 0.125, R0 + d, 0.5 + rep * 0.2, i % 2 ? 0.4 : -0.4, 16); });
riser(132.4, 1.6, 1.1);
// 134 · DROP — power to the people
boom(134, 1.1); shatter(134, 0.7); groove(134, 146, { riff: 'H', rolls: true, fill: true });
[134.6, 136.4, 138.2, 140.0].forEach((t, i) => (i % 2 ? lowPop(t, 0.8, 100) : tick(t, 0.9, 2100))); boom(142, 0.7); bell(142.05, R0 + 24, 0.5, 0, 1.6);
// 146 · CAREERS
glitch(145.95, 1); boom(146, 0.9); groove(146, 168, { fill: true });
boom(148.2, 0.6); boom(149.2, 0.6); zap(149.2, 0.4, 600, 2400, 0.4);
for (let i = 0; i < 10; i++) (i % 2 ? lowPop : tick)(153.6 + i * 0.3, 0.75, i % 2 ? 100 + i * 4 : 2000 + i * 60);
for (let i = 0; i < 4; i++) { const T0 = 159.8 + i * 1.6; zap(T0 + 0.3, 0.3, 900, 120, 0.25); tick(T0 + 0.5, 0.9, 2300); }
// 168 · OUTRO
glitch(167.95, 1); boom(168.2, 1.1); shatter(168.2, 0.6);
groove(168, 176, { cow: 0.9 });
boom(176, 0.9); kick(176, 1); e808(176, 1.6, R0 - 24, 1, R0 - 36);
RIFF_A.forEach((d, i) => { if (d != null) cowbell(176 + i * 0.125, R0 + d, 0.8 * (1 - i / 18), i % 2 ? 0.4 : -0.4); });
drone(176, 4, [R0 - 24, R0 - 17, R0 - 12], 1, 0.01); crackle(176, 4, 0.8);
// ---------------- FX + master ----------------
function delay(time, fb, mix) { const d = Math.round(time * SR), bL = new Float32Array(N), bR = new Float32Array(N); for (let n = 0; n < N; n++) { bL[n] = dlyL[n] + (n >= d ? bR[n - d] * fb : 0); bR[n] = n >= d ? bL[n - d] * fb : 0; } for (let n = 0; n < N; n++) { L[n] += (bL[n] - dlyL[n]) * mix; Rr[n] += bR[n] * mix; } }
function reverb(mix) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356], aps = [225, 556, 441];
  const run = (inp, sp) => { const o = new Float32Array(N); for (const c0 of combs) { const c = Math.round((c0 + sp) * SR / 44100 * 1.7), buf = new Float32Array(c); let p = 0, lp = 0; for (let n = 0; n < N; n++) { const y = buf[p]; lp = y * 0.55 + lp * 0.45; buf[p] = inp[n] + lp * 0.85; p = (p + 1) % c; o[n] += y / combs.length; } } for (const a0 of aps) { const a = Math.round((a0 + sp) * SR / 44100), buf = new Float32Array(a); let p = 0; for (let n = 0; n < N; n++) { const b = buf[p], x = o[n]; buf[p] = x + b * 0.5; o[n] = -x + b; p = (p + 1) % a; } } return o; };
  const oL = run(revL, 0), oR = run(revR, 23); for (let n = 0; n < N; n++) { L[n] += oL[n] * mix; Rr[n] += oR[n] * mix; }
}
delay(BT * 0.75, 0.35, 0.4); reverb(0.3);
delay(BT * 0.75, 0.35, 0.4); reverb(0.28);
let lpL = 0, lpR = 0, hL = 0, hR = 0, pL = 0, pR = 0, peak = 0;
for (let n = 0; n < N; n++) {
  const t = n / SR, lofi = t < 6 ? 0.18 + 0.82 * Math.pow(t / 6, 3) : t > 176 ? 1 - 0.7 * (t - 176) / 4 : 1;
  lpL += lofi * (L[n] - lpL); lpR += lofi * (Rr[n] - lpR);
  hL = 0.9995 * (hL + lpL - pL); pL = lpL; hR = 0.9995 * (hR + lpR - pR); pR = lpR;
  const fade = Math.min(1, (N - n) / (1.5 * SR));
  L[n] = Math.tanh(hL * 1.35) * fade; Rr[n] = Math.tanh(hR * 1.35) * fade; peak = Math.max(peak, Math.abs(L[n]), Math.abs(Rr[n]));
}
const g = 0.8 / peak, pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) { pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4); pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rr[n] * g)) * 32767), 46 + n * 4); }
const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'out'); mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'blockchain101_ep01_score.wav'), pcm);
console.log(`wrote out/blockchain101_ep01_score.wav  ${DUR}s, 120 BPM, ${KICKS.length} kicks`);
