// Score for ESCAPE VELOCITY · Episode 01 "The Threshold" — 60s cinematic score + sound design, synthesized entirely in code.
// D minor. Earth: sub drone, choir-like pad, glass motif · Debris: low-string ostinato, metal ticks, impact + braam + ear-ring at 17.5 ·
// City: heartbeat, sirens, war booms synced to the visual bursts (same hash) · Pad: building theme, lift to F major at 45, radio blips on
// crew cards, countdown clock from 44 · Breach 50.6: siren + war drums · Ignition 54.6: roar → hard cut 56.6 → title chord 57.
//   node esc/synth.mjs  ->  out/escape_velocity_ep01_score.wav
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000, DUR = 60, N = SR * DUR, TAU = Math.PI * 2;
const L = new Float32Array(N), Rr = new Float32Array(N), revL = new Float32Array(N), revR = new Float32Array(N);
let seed = 2147; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12), at = (t) => Math.round(t * SR);
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4) * Math.SQRT2, Math.sin((p + 1) * Math.PI / 4) * Math.SQRT2];
const hash = (a, b = 0, c = 0) => { let n = Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791); n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n ^= n >>> 12; return (n >>> 0) / 4294967296; };
function put(i, l, r, rev = 0) { if (i < 0 || i >= N) return; L[i] += l; Rr[i] += r; if (rev) { revL[i] += l * rev; revR[i] += r * rev; } }
const env = (t, dur, a, r) => Math.min(1, t / a) * Math.min(1, Math.max(0, (dur - t) / r));

// ---------- instruments ----------
// sub drone (sine + soft octave)
function sub(t0, dur, m, g = 1) { let ph = 0; const f = mtof(m); for (let n = 0; n < dur * SR; n++) { const t = n / SR; ph += TAU * f / SR; const v = (Math.sin(ph) + 0.25 * Math.sin(ph * 2)) * env(t, dur, 1.5, 1.5) * g * 0.22; put(at(t0) + n, v, v, 0.2); } }
// choir-ish pad: detuned saws through two formant band-passes ("aah"), slow vibrato
function choir(t0, dur, notes, g = 1, atk = 2, rel = 2) { notes.forEach((m, k) => { const f0 = mtof(m), [a, b] = pan((k / Math.max(1, notes.length - 1)) * 1.2 - 0.6); let p1 = rnd(), p2 = rnd(), b1 = 0, b2 = 0, c1 = 0, c2 = 0;
  const F1 = 2 * Math.sin(Math.PI * 720 / SR), F2 = 2 * Math.sin(Math.PI * 1150 / SR);
  for (let n = 0; n < dur * SR; n++) { const t = n / SR, vib = 1 + 0.004 * Math.sin(TAU * 5.2 * t + k); p1 = (p1 + f0 * vib * 0.997 / SR) % 1; p2 = (p2 + f0 * vib * 1.003 / SR) % 1; const x = (2 * p1 - 1) + (2 * p2 - 1);
    b1 += F1 * (x - b2 - 0.25 * b1); b2 += F1 * b1; c1 += F2 * (x - c2 - 0.3 * c1); c2 += F2 * c1; const v = (b1 * 0.7 + c1 * 0.35) * env(t, dur, atk, rel) * g * 0.018; put(at(t0) + n, v * a, v * b, 0.6); } }); }
// brass "braam": low detuned saws, filter sweeps open then closes
function braam(t0, dur, notes, g = 1) { notes.forEach((m, k) => { const f = mtof(m); let p1 = rnd(), p2 = rnd(), lp = 0, lp2 = 0; for (let n = 0; n < dur * SR; n++) { const t = n / SR; p1 = (p1 + f * 0.995 / SR) % 1; p2 = (p2 + f * 1.006 / SR) % 1; const x = (2 * p1 - 1) + (2 * p2 - 1), cut = 0.006 + 0.07 * Math.exp(-t * 1.6) * Math.min(1, t * 8); lp += cut * (x - lp); lp2 += cut * (lp - lp2);
  const v = Math.tanh(lp2 * 2.2) * env(t, dur, 0.04, 0.8) * g * 0.16; put(at(t0) + n, v * (k % 2 ? 0.9 : 1), v * (k % 2 ? 1 : 0.9), 0.45); } }); }
// glass bell (FM)
function bell(t0, m, g = 1, p = 0, len = 3) { const f = mtof(m), [a, b] = pan(p); for (let n = 0; n < len * SR; n++) { const t = n / SR, mod = Math.sin(TAU * f * 2.76 * t) * 1.3 * Math.exp(-t * 2.5), v = Math.sin(TAU * f * t + mod) * Math.exp(-t * 1.6) * g * 0.07; put(at(t0) + n, v * a, v * b, 0.7); } }
// low string ostinato note (bowed saw, short)
function bow(t0, dur, m, g = 1) { let p = rnd(), lp = 0; const f = mtof(m); for (let n = 0; n < (dur + 0.1) * SR; n++) { const t = n / SR; p = (p + f / SR) % 1; lp += 0.05 * ((2 * p - 1) - lp); const v = lp * env(t, dur + 0.1, 0.02, 0.12) * g * 0.22; put(at(t0) + n, v, v, 0.3); } }
function boom(t0, g = 1, f0 = 36) { let ph = 0; for (let n = 0; n < 2.4 * SR; n++) { const t = n / SR; ph += TAU * (f0 + 60 * Math.exp(-t * 7)) / SR; const v = Math.tanh(Math.sin(ph) * 2) * Math.exp(-t * 1.8) * g * 0.55; put(at(t0) + n, v, v, 0.3); } }
function distant(t0, g = 1) { let lp = 0, lp2 = 0, ph = 0; for (let n = 0; n < 2.5 * SR; n++) { const t = n / SR; lp += 0.02 * (noise() - lp); lp2 += 0.02 * (lp - lp2); ph += TAU * (40 + 20 * Math.exp(-t * 5)) / SR; const v = (lp2 * 8 + Math.sin(ph) * 0.4) * Math.exp(-t * 1.6) * Math.min(1, t * 60) * g * 0.35; put(at(t0) + n, v, v * 0.9, 0.6); } }
function crunch(t0, g = 1) { for (let n = 0; n < 1.2 * SR; n++) { const t = n / SR, v = noise() * Math.exp(-t * 7) * g * 0.45 * (0.6 + 0.4 * Math.sign(Math.sin(TAU * 90 * t))); put(at(t0) + n, v, v, 0.4); } for (let k = 0; k < 40; k++) { const tt = t0 + rnd() * 1.4, f = 1500 + rnd() * 5000, [a, b] = pan(rnd() * 2 - 1); for (let n = 0; n < 0.12 * SR; n++) { const t = n / SR, v = Math.sin(TAU * f * t) * Math.exp(-t * 40) * g * 0.06; put(at(tt) + n, v * a, v * b, 0.5); } } }
function ring(t0, dur, f, g = 1) { for (let n = 0; n < dur * SR; n++) { const t = n / SR, v = Math.sin(TAU * f * t) * env(t, dur, 0.05, dur * 0.8) * g * 0.025; put(at(t0) + n, v, v); } }
function tink(t0, g = 1, p = 0) { const f = 2500 + rnd() * 4000, [a, b] = pan(p); for (let n = 0; n < 0.15 * SR; n++) { const t = n / SR, v = (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 1.51 * t)) * Math.exp(-t * 30) * g * 0.03; put(at(t0) + n, v * a, v * b, 0.6); } }
function heart(t0, g = 1) { [0, 0.22].forEach((d, k) => { let ph = 0; for (let n = 0; n < 0.25 * SR; n++) { const t = n / SR; ph += TAU * (48 + 30 * Math.exp(-t * 30)) / SR; const v = Math.sin(ph) * Math.exp(-t * 16) * g * (k ? 0.5 : 0.7); put(at(t0 + d) + n, v, v, 0.1); } }); }
function siren(t0, dur, g = 1, far = 0) { let ph = 0, lp = 0; for (let n = 0; n < dur * SR; n++) { const t = n / SR, f = 620 + 260 * Math.sin(TAU * 0.35 * t - 1.5); ph += TAU * f / SR; const x = Math.sin(ph) + 0.3 * Math.sin(ph * 2); lp += (far ? 0.05 : 0.4) * (x - lp); const v = lp * env(t, dur, 0.4, 0.6) * g * 0.05; put(at(t0) + n, v * 0.8, v, far ? 0.8 : 0.4); } }
function alarm(t0, dur, g = 1) { let ph = 0; for (let n = 0; n < dur * SR; n++) { const t = n / SR, f = (Math.floor(t * 2.5) % 2) ? 880 : 660; ph += TAU * f / SR; const v = Math.tanh(Math.sin(ph) * 2) * env(t, dur, 0.02, 0.2) * g * 0.04; put(at(t0) + n, v, v * 0.85, 0.3); } }
function beep(t0, f = 1000, g = 1, d = 0.08) { for (let n = 0; n < d * SR; n++) { const t = n / SR, v = Math.sin(TAU * f * t) * env(t, d, 0.003, 0.02) * g * 0.07; put(at(t0) + n, v, v, 0.15); } }
function radio(t0, dur, g = 1) { let b1 = 0, b2 = 0; const F = 2 * Math.sin(Math.PI * 1800 / SR); for (let n = 0; n < dur * SR; n++) { const t = n / SR; b1 += F * (noise() - b2 - 0.5 * b1); b2 += F * b1; const chop = 0.5 + 0.5 * Math.sign(Math.sin(TAU * (6 + 4 * Math.sin(t * 3)) * t)); const v = b1 * chop * env(t, dur, 0.01, 0.05) * g * 0.08; put(at(t0) + n, v, v, 0.1); } }
function drum(t0, g = 1, f = 70) { let ph = 0; for (let n = 0; n < 0.9 * SR; n++) { const t = n / SR; ph += TAU * f * (1 + 0.8 * Math.exp(-t * 25)) / SR; const v = (Math.tanh(Math.sin(ph) * 2.5) * Math.exp(-t * 5) + (n < 300 ? noise() * 0.5 * (1 - n / 300) : 0)) * g * 0.5; put(at(t0) + n, v, v, 0.35); } }
function riser(t0, dur, g = 1) { let b1 = 0, b2 = 0; for (let n = 0; n < dur * SR; n++) { const k = n / (dur * SR), F = 2 * Math.sin(Math.PI * (200 + 5000 * k * k) / SR); b1 += F * (noise() - b2 - 0.4 * b1); b2 += F * b1; const v = b1 * k * k * g * 0.12; put(at(t0) + n, v, v, 0.4); } }
function air(t0, dur, g = 1) { let lp = 0; for (let n = 0; n < dur * SR; n++) { const k = n / (dur * SR); lp += 0.015 * (noise() - lp); const v = lp * Math.sin(Math.PI * k) ** 2 * g * 0.6; put(at(t0) + n, v * (1 - 0.4 * k), v * (0.6 + 0.4 * k), 0.5); } }
function roar(t0, dur, g = 1) { let lp = 0, lp2 = 0, ph = 0; for (let n = 0; n < dur * SR; n++) { const t = n / SR, k = Math.min(1, t / 1.4), cut = 0.01 + 0.12 * k; lp += cut * (noise() - lp); lp2 += cut * (lp - lp2); ph += TAU * (30 + 6 * Math.sin(t * 9)) / SR; const v = (lp2 * 3 + Math.sin(ph) * 0.5 * k) * k * g * 0.6 * (1 + 0.15 * noise()); put(at(t0) + n, v, v * 0.97, 0.25); } }

// ---------- arrangement ----------
const D2 = 38, D3 = 50, F3 = 53, A3 = 57;
// 0–3: near-silence, faint static
radio(0.3, 0.5, 0.25); sub(0.8, 12, D2 - 12, 0.9);
// 3–12 EARTH
choir(2.6, 9.8, [D3, F3, A3, D3 + 12], 1, 3, 2);
[[4.2, 81], [5.4, 77], [6.6, 74], [8.4, 81], [9.2, 84], [10.4, 79]].forEach(([t, m], i) => bell(t, m, 0.9, i % 2 ? 0.4 : -0.4));
air(7, 4, 0.7); bell(9.0, 69, 0.6, 0, 4);
// 12–21 DEBRIS: ostinato on 8ths (120 BPM), metal tinkles, impact
sub(12, 9.5, D2 - 12, 0.8);
for (let t = 12.2, i = 0; t < 21; t += 0.25, i++) bow(t, 0.18, [D2, D2, D2 + 12, D2, D2 + 3, D2, D2 + 12, D2 + 1][i % 8], 0.75 + 0.25 * (t > 15.5 ? 1 : 0));
for (let i = 0; i < 40; i++) tink(12.5 + hash(i, 4) * 8.5, 0.8, hash(i, 5) * 2 - 1);
riser(15.6, 1.9, 1.0);
crunch(17.5, 1.2); boom(17.5, 1.2, 32); braam(17.5, 3.2, [D2, D2 + 7, D3], 1.2); ring(17.7, 3.2, 4100, 1);
choir(18, 3.3, [D3 - 2, F3, A3 - 2], 0.7, 0.5, 1.5);
// 21–33 CITY: heartbeat, sirens, war booms synced to visual bursts
sub(21, 12.5, D2 - 12, 1); choir(21, 6, [D3 - 12, F3 - 12, A3 - 12], 0.8, 1.5, 1.5);
for (let t = 21.4; t < 33; t += 1.0) heart(t, 0.9);
siren(21.5, 6, 0.6, 1); siren(25.5, 7, 0.5, 1);
for (let i = 0; i < 10; i++) { const T = 26.2 + i * 0.68 + hash(i, 3) * 0.3; distant(T + 0.15, 0.6 + 0.3 * hash(i, 2)); }
braam(26.3, 3.6, [D2 - 2, D2 + 5, D3 - 2], 0.9); braam(30.2, 3.0, [D2 - 5, D2 + 2, D3 - 5], 1.0);
radio(28.2, 0.8, 0.5); for (let k = 0; k < 6; k++) beep(28.3 + k * 0.12, 1200 - k * 40, 0.4, 0.05);
// 33–50 PAD: rising theme, crew radio blips, countdown clock
boom(33.1, 0.6, 40); sub(33.1, 18, D2 - 12, 0.9);
choir(33.2, 12, [D3, F3, A3, D3 + 12], 0.9, 4, 1.5);
for (let t = 36, i = 0; t < 50.6; t += 0.25, i++) bow(t, 0.18, [D2, D2 + 12, D2, D2 + 7][i % 4] + (t >= 45 ? 3 : 0), 0.4 + 0.5 * Math.min(1, (t - 36) / 10));
for (let i = 0; i < 6; i++) { const T = 38.4 + i * 1.05; radio(T, 0.18, 0.5); beep(T + 0.2, 1500, 0.5, 0.05); }
choir(45, 6, [F3, A3, F3 + 12 - 12 + 7 + 5, F3 + 12], 1.1, 0.8, 1.2); braam(45, 3, [D2 + 3, D2 + 10, D3 + 3], 0.7); bell(45.1, 77, 0.8, 0, 4); bell(45.6, 81, 0.6, 0.3, 4);
for (let s = 12; s >= 1; s--) { const T = 56 - s; if (T >= 44) beep(T, s <= 3 ? 1320 : 1000, 0.8, 0.07); }
// 50.6 BREACH: blast, siren, war drums
boom(50.6, 1.2, 34); distant(50.65, 1.2); alarm(50.8, 3.8, 1); siren(50.9, 3.8, 1.0, 0);
for (let t = 51, i = 0; t < 54.6; t += 0.5, i++) { drum(t, 0.9, i % 2 ? 62 : 74); if (i % 2) drum(t + 0.25, 0.5, 90); }
riser(52.6, 2.0, 1.2); braam(52.6, 2.2, [D2, D2 + 7, D3 + 7], 0.8);
// 54.6 IGNITION → hard cut at 56.6
roar(54.6, 2.0, 1.4); boom(54.6, 1.3, 30); choir(54.4, 2.2, [D3, A3, D3 + 12, F3 + 12], 1.2, 0.3, 0.05);
// 57 TITLE
boom(57.05, 1.0, 34); braam(57.05, 3.0, [D2, D2 + 7, D3, F3], 0.8); choir(57.1, 2.9, [D3, F3, A3], 0.9, 0.6, 1.6); bell(57.3, 74, 0.9, 0, 3);

// ---------- master ----------
function reverb(mix) { const combs = [1557, 1617, 1491, 1422, 1277, 1356], aps = [225, 556, 441];
  const run = (inp, sp) => { const o = new Float32Array(N); for (const c0 of combs) { const c = Math.round((c0 + sp) * SR / 44100 * 2.4), buf = new Float32Array(c); let p = 0, lp = 0; for (let n = 0; n < N; n++) { const y = buf[p]; lp = y * 0.5 + lp * 0.5; buf[p] = inp[n] + lp * 0.88; p = (p + 1) % c; o[n] += y / combs.length; } } for (const a0 of aps) { const a = Math.round((a0 + sp) * SR / 44100), buf = new Float32Array(a); let p = 0; for (let n = 0; n < N; n++) { const b = buf[p], x = o[n]; buf[p] = x + b * 0.5; o[n] = -x + b; p = (p + 1) % a; } } return o; };
  const oL = run(revL, 0), oR = run(revR, 23); for (let n = 0; n < N; n++) { L[n] += oL[n] * mix; Rr[n] += oR[n] * mix; } }
reverb(0.42);
// hard cut to silence at the ignition flash (56.6–57.0), then the title
const c0 = at(56.6), c1 = at(57.0); for (let n = c0; n < c1; n++) { const k = Math.max(0, 1 - (n - c0) / (0.03 * SR)); L[n] *= k; Rr[n] *= k; }
let hL = 0, hR = 0, pL = 0, pR = 0, peak = 0;
for (let n = 0; n < N; n++) { hL = 0.9996 * (hL + L[n] - pL); pL = L[n]; hR = 0.9996 * (hR + Rr[n] - pR); pR = Rr[n]; const fade = Math.min(1, (N - n) / (0.8 * SR)), fin = Math.min(1, n / (0.01 * SR)); L[n] = Math.tanh(hL * 1.2) * fade * fin; Rr[n] = Math.tanh(hR * 1.2) * fade * fin; peak = Math.max(peak, Math.abs(L[n]), Math.abs(Rr[n])); }
const g = 0.86 / peak, pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) { pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4); pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rr[n] * g)) * 32767), 46 + n * 4); }
const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'out'); mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'escape_velocity_ep01_score.wav'), pcm); console.log('wrote out/escape_velocity_ep01_score.wav  60s');
