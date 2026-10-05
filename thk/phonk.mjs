// Dark phonk scores for the THEE_KAL_EL breakout — synthesized entirely in code (oscillators, noise, filters,
// waveshaping). No samples, no audio files. Two different tracks on the same 120 BPM grid as the film:
//   node thk/phonk.mjs shorts   -> out/thee_kal_el_breakout_shorts_score.wav   (C# phrygian, 16th cowbell riff)
//   node thk/phonk.mjs classic  -> out/thee_kal_el_breakout_classic_score.wav  (F minor, triplet cowbell riff)
// Grid hits: glass shatter + drop at 2.0s, card whooshes on 8ths from 2.5s, Shorts 4.0s, chips 4.5s,
// Subscribe 6.0s, click + bell 7.0s, outro 8.0s.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VARIANT = process.argv[2] === 'classic' ? 'classic' : 'shorts';
const SR = 48000, DUR = 10, N = SR * DUR, TAU = Math.PI * 2, BT = 0.5;
const L = new Float32Array(N), Rr = new Float32Array(N), revL = new Float32Array(N), revR = new Float32Array(N), dlyL = new Float32Array(N), dlyR = new Float32Array(N);
let seed = VARIANT === 'classic' ? 666 : 1312;
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

// ---------------- the two tracks ----------------
const SPEC = {
  // C# phrygian: riff on straight 16ths, the classic drift-phonk bounce
  shorts: { root: 49, bars: [0, 0, -3, -5, 0], riffA: [0, null, 0, null, 3, null, 0, 1, 7, null, 5, null, 3, null, 1, null], riffB: [0, null, 0, null, 3, null, 0, 1, 8, null, 7, null, 5, null, 3, 1],
    kicks: [0, 1.5, 2.75, 3.5], clap: [1, 3], b808: [[0, 0.7, 0], [1.5, 0.45, 0], [2.75, 0.6, 0, -2], [3.5, 0.4, 0]] },
  // F minor: triplet-feel cowbell (on a 12-step grid per bar), heavier 808 slides
  classic: { root: 53, bars: [0, 0, -4, -2, 0], riffA: [0, null, 3, 0, null, 5, 7, null, 5, 3, null, 2], riffB: [0, null, 3, 0, null, 7, 8, null, 7, 5, null, 3], triplet: true,
    kicks: [0, 1.25, 2, 3.25], clap: [1, 3], b808: [[0, 0.95, 0, -5], [2, 0.55, 0], [3.25, 0.6, 0, 3]] },
}[VARIANT];
const R0 = SPEC.root;

// 0–2: lo-fi dark intro — crackle, drone, filtered cowbell riff, riser into the breakout
crackle(0, 2.0, 1);
drone(0, 2.2, [R0 - 24, R0 - 17, R0 - 12], 1.1, 0.008);
{
  const steps = SPEC.triplet ? 12 : 16, dt = 2 / steps;
  SPEC.riffA.forEach((d, i) => { if (d != null) cowbell(i * dt, R0 + d, 0.45, (i % 2 ? 0.3 : -0.3), 18); });
}
kick(0, 0.7); boom(0, 0.5);
for (let k = 0; k < 8; k++) clap(1.0 + k * 0.125, 0.08 + k * 0.05);
riser(1.0, 1.0, 1.0);

// 2.0: the drop — shatter + full phonk groove through bar 4
shatter(2.0, 1.1); boom(2.0, 0.9);
for (let bar = 1; bar < 4 + 1 && bar * 2 < 8; bar++) {
  const b0 = bar * 2, tr = SPEC.bars[bar];
  for (const kb of SPEC.kicks) kick(b0 + kb * BT, 1);
  for (const cb of SPEC.clap) clap(b0 + cb * BT, 1);
  // rolling hats: 8ths with triplet rolls at the end of each bar
  for (let s = 0; s < 8; s++) hat(b0 + s * BT / 2, s % 2 ? 0.07 : 0.11, false, 0.2);
  for (let r = 0; r < 6; r++) hat(b0 + 1.5 + r * (BT / 6), 0.05 + r * 0.012, false, -0.2);
  hat(b0 + 1.75, 0.08, true, 0.3);
  for (const [b, d, o, slide] of SPEC.b808) e808(b0 + b * BT, d, R0 - 24 + tr + o, 1, slide != null ? R0 - 24 + tr + slide : null);
  const riff = bar % 2 ? SPEC.riffA : SPEC.riffB, steps = riff.length, dt = 2 / steps;
  riff.forEach((d, i) => { if (d != null) cowbell(b0 + i * dt, R0 + d + tr, 1, (i % 2 ? 0.35 : -0.35)); });
  drone(b0, 2.0, [R0 - 24 + tr, R0 - 17 + tr, R0 - 12 + tr], 0.8, 0.014);
}
// film accents — kept cinematic and quiet so the beat carries the motion (no game-style pops, blips or dings)
function air(t0, dur, g = 1) { let lp = 0; for (let n = 0; n < dur * SR; n++) { const k = n / (dur * SR); lp += 0.02 * (noise() - lp); const v = lp * Math.sin(Math.PI * k) ** 2 * g * 0.5; put(at(t0) + n, v * (1 - 0.4 * k), v * (0.6 + 0.4 * k), 0.4); } }
air(2.35, 1.6, 0.8);                          // thumbnails leaving the poster: one soft air sweep, not a whoosh per card
if (VARIANT === 'shorts') air(3.95, 1.0, 0.6);
boom(6.0, 0.35);                              // subscribe button lands as a low thud
click(7.0, 0.7, 900);                         // muted press
// 8.0: outro — drums cut, 808 dives, cowbell echoes out
boom(8.0, 0.8); kick(8.0, 1); clap(8.5, 0.6);
e808(8.0, 1.3, R0 - 24, 1, R0 - 36);
{ const riff = SPEC.riffA, dt = 2 / riff.length; riff.forEach((d, i) => { if (d != null && i * dt < 1.6) cowbell(8.0 + i * dt, R0 + d, 0.8 * (1 - i * dt / 1.8), (i % 2 ? 0.4 : -0.4)); }); }
drone(8.0, 2.0, [R0 - 24, R0 - 17, R0 - 12], 1, 0.01);
crackle(8.0, 2.0, 0.8);

// ---------------- FX + master ----------------
function delay(time, fb, mix) { const d = Math.round(time * SR), bL = new Float32Array(N), bR = new Float32Array(N); for (let n = 0; n < N; n++) { bL[n] = dlyL[n] + (n >= d ? bR[n - d] * fb : 0); bR[n] = n >= d ? bL[n - d] * fb : 0; } for (let n = 0; n < N; n++) { L[n] += (bL[n] - dlyL[n]) * mix; Rr[n] += bR[n] * mix; } }
function reverb(mix) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356], aps = [225, 556, 441];
  const run = (inp, sp) => { const o = new Float32Array(N); for (const c0 of combs) { const c = Math.round((c0 + sp) * SR / 44100 * 1.7), buf = new Float32Array(c); let p = 0, lp = 0; for (let n = 0; n < N; n++) { const y = buf[p]; lp = y * 0.55 + lp * 0.45; buf[p] = inp[n] + lp * 0.85; p = (p + 1) % c; o[n] += y / combs.length; } } for (const a0 of aps) { const a = Math.round((a0 + sp) * SR / 44100), buf = new Float32Array(a); let p = 0; for (let n = 0; n < N; n++) { const b = buf[p], x = o[n]; buf[p] = x + b * 0.5; o[n] = -x + b; p = (p + 1) % a; } } return o; };
  const oL = run(revL, 0), oR = run(revR, 23); for (let n = 0; n < N; n++) { L[n] += oL[n] * mix; Rr[n] += oR[n] * mix; }
}
delay(BT * 0.75, 0.35, 0.4); reverb(0.3);
// lo-fi band-limit on the intro + outro tails (dark phonk "tape" feel), then saturate and limit
let lpL = 0, lpR = 0, hL = 0, hR = 0, pL = 0, pR = 0, peak = 0;
for (let n = 0; n < N; n++) {
  const t = n / SR, lofi = t < 2 ? 0.22 + 0.78 * Math.pow(t / 2, 2) : 1;
  lpL += lofi * (L[n] - lpL); lpR += lofi * (Rr[n] - lpR);
  hL = 0.9995 * (hL + lpL - pL); pL = lpL; hR = 0.9995 * (hR + lpR - pR); pR = lpR;
  const fade = Math.min(1, (N - n) / (0.6 * SR));
  L[n] = Math.tanh(hL * 1.35) * fade; Rr[n] = Math.tanh(hR * 1.35) * fade; peak = Math.max(peak, Math.abs(L[n]), Math.abs(Rr[n]));
}
const g = 0.72 / peak, pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) { pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4); pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rr[n] * g)) * 32767), 46 + n * 4); }
const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'out'); mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, `thee_kal_el_breakout_${VARIANT}_score.wav`), pcm);
console.log(`wrote out/thee_kal_el_breakout_${VARIANT}_score.wav  ${DUR}s, 120 BPM, ${KICKS.length} kicks`);
