// Score for the DreamLabs explainer (25 s): warm, dreamy lo-fi pop at 96 BPM in D major — soft kick/snap, brushed hats,
// Rhodes-like keys, round bass, soft whooshes on the wipes, little servo chirps when the arm moves, sparkle on "done".
//   node story/dreamlabs/synth.mjs  ->  out/dreamlabs_explainer_score.wav
import { writeFileSync } from 'node:fs';
const SR = 48000, DUR = 25, N = SR * DUR, TAU = Math.PI * 2, Q = 60 / 96;
const L = new Float32Array(N), R = new Float32Array(N), RV = new Float32Array(N);
let seed = 11; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296), noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * 2 ** ((m - 69) / 12), at = (t) => Math.round(t * SR);
const put = (i, l, r, rv = 0) => { if (i < 0 || i >= N) return; L[i] += l; R[i] += r; RV[i] += (l + r) * 0.5 * rv; };
function kick(t0, g = 1) { let ph = 0; for (let n = 0; n < 0.35 * SR; n++) { const t = n / SR; ph += TAU * (46 + 90 * Math.exp(-t * 30)) / SR; const v = Math.sin(ph) * Math.exp(-t * 7) * 0.5 * g; put(at(t0) + n, v, v); } }
function snap(t0, g = 1) { let b = 0; for (let n = 0; n < 0.15 * SR; n++) { const t = n / SR, x = noise(); b += 0.35 * (x - b); const v = (x - b) * Math.exp(-t * 28) * 0.22 * g; put(at(t0) + n, v, v * 0.9, 0.3); } }
function hat(t0, g, p = 0) { let hp = 0, pv = 0; for (let n = 0; n < 0.07 * SR; n++) { const x = noise(); hp = 0.9 * (hp + x - pv); pv = x; const v = hp * Math.exp(-n / SR * 55) * g; put(at(t0) + n, v * (1 - p), v * (1 + p)); } }
function keys(t0, notes, d = 1.2, g = 1) { for (const m of notes) { const f = mtof(m); for (let n = 0; n < d * SR; n++) { const t = n / SR, trem = 1 + 0.12 * Math.sin(TAU * 5 * t), env = Math.min(1, t / 0.01) * Math.exp(-t * 2.2) * Math.min(1, (d - t) / 0.1);
  const v = (Math.sin(TAU * f * t + 0.8 * Math.sin(TAU * f * t) * Math.exp(-t * 6)) + 0.2 * Math.sin(TAU * f * 2 * t)) * env * trem * 0.045 * g; put(at(t0) + n, v * 0.95, v * 1.05, 0.45); } } }
function bass(t0, d, m, g = 1) { const f = mtof(m); for (let n = 0; n < d * SR; n++) { const t = n / SR, env = Math.min(1, t / 0.008) * Math.exp(-t * 1.5) * Math.min(1, (d - t) / 0.05), v = (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * f * 2 * t)) * env * 0.2 * g; put(at(t0) + n, v, v); } }
function chirp(t0, f0, f1, d = 0.18, g = 1) { let ph = 0; for (let n = 0; n < d * SR; n++) { const t = n / SR, k = t / d; ph += TAU * (f0 + (f1 - f0) * k) / SR; const v = Math.sin(ph) * Math.sin(Math.PI * k) * 0.05 * g; put(at(t0) + n, v, v, 0.3); } }
function sparkle(t0, base, g = 1) { [0, 4, 7, 12, 16].forEach((s, i) => { const f = mtof(base + s); for (let n = 0; n < 0.7 * SR; n++) { const t = n / SR, v = Math.sin(TAU * f * t) * Math.exp(-t * 6) * 0.06 * g; put(at(t0 + i * 0.07) + n, v, v, 0.6); } }); }
function whoosh(t0, d, g = 1) { let b1 = 0, b2 = 0; for (let n = 0; n < d * SR; n++) { const k = n / (d * SR), f = 2 * Math.sin(Math.PI * (300 + 3500 * k) / SR); b1 += f * (noise() - b2 - 0.6 * b1); b2 += f * b1; const v = b2 * Math.sin(Math.PI * k) * 0.16 * g; put(at(t0) + n, v * (1 - k), v * k, 0.4); } }
// D – Bm – G – A
const CH = [[50, [62, 66, 69, 73]], [47, [59, 62, 66, 69]], [43, [59, 62, 67, 71]], [45, [61, 64, 69, 73]]];
for (let t = 0, bar = 0; t < 24.0; t += 4 * Q, bar++) {
  const [root, ch] = CH[bar % 4], drums = t > 3.0;
  keys(t, ch, 4 * Q * 0.95, 1); keys(t + 2.5 * Q, ch.slice(1), 1.4 * Q, 0.6);
  bass(t, 2 * Q, root - 12 + 12); bass(t + 2 * Q, 2 * Q, root - 12 + 12 + (bar % 2 ? 7 : 0));
  if (drums && t < 21) { kick(t); kick(t + 2.5 * Q, 0.8); snap(t + Q); snap(t + 3 * Q); for (let s = 0; s < 8; s++) hat(t + s * Q / 2 + (s % 2 ? 0.03 : 0), s % 2 ? 0.03 : 0.055, s % 2 ? 0.3 : -0.3); }
}
[3.2, 6.4, 13.4, 17.4, 21.0].forEach((t) => whoosh(t - 0.35, 0.6, 1));
sparkle(1.3, 74, 0.9);                                        // logo
[8.4, 9.1, 9.45, 10.2, 11.0, 11.45].forEach((t, i) => chirp(6.4 + (t - 6.4), 600 + i * 80, 900 + i * 60, 0.22, 0.9)); // arm moves
sparkle(11.9, 78, 1);                                         // task done
sparkle(21.2, 74, 1); keys(21.0, [62, 66, 69, 74, 78], 3.5, 1.2); bass(21.0, 3.5, 38, 1.1);
const rev = new Float32Array(N); for (const [d, fb] of [[0.037, 0.6], [0.053, 0.55], [0.071, 0.5], [0.097, 0.45]]) { const D = at(d), b = new Float32Array(N); for (let n = 0; n < N; n++) { b[n] = RV[n] + (n >= D ? b[n - D] * fb : 0); rev[n] += b[n] * 0.25; } }
let peak = 0; for (let n = 0; n < N; n++) { const t = n / SR, fade = Math.min(1, t / 0.15, (DUR - t) / 0.8); L[n] = Math.tanh((L[n] + rev[n] * 0.6) * 1.15) * fade; R[n] = Math.tanh((R[n] + rev[n] * 0.6) * 1.15) * fade; peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n])); }
const g = 0.89 / peak, buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[n] * g)) * 32767), 46 + n * 4); }
writeFileSync(new URL('../../out/dreamlabs_explainer_score.wav', import.meta.url), buf); console.log('wrote out/dreamlabs_explainer_score.wav');
