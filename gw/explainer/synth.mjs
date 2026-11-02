// Score for the Gibwork explainer (25 s): bright 120 BPM pop-electronic in F major: kick/clap/hats, bass, chord stabs,
// whooshes on the section wipes, coin chimes on the payouts (10.6 s wallet, 20.3 s pay-out), riser into the end card.
//   node gw/explainer/synth.mjs  ->  out/gibwork_explainer_score.wav
import { writeFileSync } from 'node:fs';
const SR = 48000, DUR = 25, N = SR * DUR, TAU = Math.PI * 2, Q = 0.5;
const L = new Float32Array(N), R = new Float32Array(N), RV = new Float32Array(N);
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296), noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * 2 ** ((m - 69) / 12), at = (t) => Math.round(t * SR);
const put = (i, l, r, rv = 0) => { if (i < 0 || i >= N) return; L[i] += l; R[i] += r; RV[i] += (l + r) * 0.5 * rv; };
const KICKS = [];
const duck = (t) => { let g = 1; for (const k of KICKS) { const d = t - k; if (d >= 0 && d < 0.25) g = Math.min(g, 0.45 + 0.55 * (d / 0.25)); } return g; };
function kick(t0, g = 1) { KICKS.push(t0); let ph = 0; for (let n = 0; n < 0.3 * SR; n++) { const t = n / SR; ph += TAU * (48 + 130 * Math.exp(-t * 35)) / SR; const v = Math.tanh(Math.sin(ph) * Math.exp(-t * 8) * 2) * 0.55 * g; put(at(t0) + n, v, v); } }
function clap(t0, g = 1) { let b = 0; for (let n = 0; n < 0.22 * SR; n++) { const t = n / SR, x = noise(); b += 0.5 * (x - b); const env = (t < 0.025 ? Math.exp(-((t * 120) % 1) * 3) : 1) * Math.exp(-t * 14); const v = (x - b) * env * 0.28 * g; put(at(t0) + n, v * 0.9, v, 0.2); } }
function hat(t0, g, p = 0) { let hp = 0, pv = 0; for (let n = 0; n < 0.05 * SR; n++) { const x = noise(); hp = 0.94 * (hp + x - pv); pv = x; const v = hp * Math.exp(-n / SR * 80) * g; put(at(t0) + n, v * (1 - p), v * (1 + p)); } }
function bass(t0, d, m, g = 1) { let ph = 0, lp = 0; const f = mtof(m); for (let n = 0; n < d * SR; n++) { const t = n / SR; ph = (ph + f / SR) % 1; lp += 0.08 * ((2 * ph - 1) - lp); const env = Math.min(1, t / 0.005) * Math.min(1, (d - t) / 0.03); const v = (Math.tanh(lp * 2.5) * 0.6 + Math.sin(TAU * ph) * 0.5) * env * 0.26 * g * duck(t0 + t); put(at(t0) + n, v, v); } }
function stab(t0, notes, g = 1, d = 0.22) { for (const m of notes) { const f = mtof(m); let p1 = rnd(), p2 = rnd(), lp = 0; for (let n = 0; n < d * SR; n++) { const t = n / SR; p1 = (p1 + f * 1.004 / SR) % 1; p2 = (p2 + f * 0.996 / SR) % 1; lp += 0.12 * ((p1 + p2 - 1) - lp); const env = Math.exp(-t * 9) * Math.min(1, t / 0.004); const v = lp * env * 0.07 * g * duck(t0 + t); put(at(t0) + n, v * 0.9, v * 1.1, 0.35); } } }
function chime(t0, m, g = 1) { const f = mtof(m); for (let n = 0; n < 0.9 * SR; n++) { const t = n / SR, v = (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 8)) * Math.exp(-t * 5) * 0.09 * g; put(at(t0) + n, v, v, 0.5); } }
function whoosh(t0, d, g = 1) { let b1 = 0, b2 = 0; for (let n = 0; n < d * SR; n++) { const k = n / (d * SR), fc = 300 + 5000 * k * k, f = 2 * Math.sin(Math.PI * fc / SR); b1 += f * (noise() - b2 - 0.5 * b1); b2 += f * b1; const v = b2 * Math.sin(Math.PI * k) * 0.22 * g; put(at(t0) + n, v * (1 - k), v * k, 0.3); } }
function riser(t0, d, g = 1) { let b1 = 0, b2 = 0; for (let n = 0; n < d * SR; n++) { const k = n / (d * SR), f = 2 * Math.sin(Math.PI * (400 + 6000 * k * k) / SR); b1 += f * (noise() - b2 - 0.35 * b1); b2 += f * b1; const v = b2 * k * k * 0.25 * g; put(at(t0) + n, v, v, 0.3); } }
function boom(t0, g = 1) { let ph = 0; for (let n = 0; n < 1.2 * SR; n++) { const t = n / SR; ph += TAU * (40 + 60 * Math.exp(-t * 10)) / SR; const v = Math.sin(ph) * Math.exp(-t * 3) * 0.5 * g; put(at(t0) + n, v, v); } }
// F major: I – V – vi – IV  (F, C, Dm, Bb)
const CH = [[53, [65, 69, 72]], [48, [64, 67, 72]], [50, [62, 65, 69]], [46, [62, 65, 70]]];
// intro (0–3.2): soft stabs + riser, logo lands ~1.3
for (let b = 0; b < 3; b++) stab(0.2 + b * 1.0, CH[0][1], 0.6, 0.5); boom(1.3, 0.8); chime(1.35, 77, 0.8); chime(1.5, 81, 0.6); riser(2.2, 1.0, 0.8);
// groove 3.2–21
for (let t = 3.2, bar = 0; t < 21.0 - 0.01; t += 4 * Q, bar++) {
  const [root, ch] = CH[bar % 4];
  for (let k = 0; k < 4; k++) kick(t + k * Q, 1);
  [1, 3].forEach((k) => clap(t + k * Q, 0.9));
  for (let s = 0; s < 8; s++) hat(t + s * Q / 2, s % 2 ? 0.05 : 0.09, s % 2 ? 0.3 : -0.3);
  [0, 1.5, 2, 3, 3.5].forEach((b8) => { if (t + b8 * Q < 21) bass(t + b8 * Q, 0.22, root - 12 + (b8 === 3.5 ? 12 : 0)); });
  [0.5, 1.5, 2.5, 3.25].forEach((b8) => { if (t + b8 * Q < 21) stab(t + b8 * Q, ch, 0.8); });
}
[3.2, 5.2, 13.6].forEach((t) => { whoosh(t - 0.35, 0.45, 1); boom(t, 0.5); });
[7.95, 9.7].forEach((t) => chime(t, 84, 0.5));                    // taps / submitted
[11.5, 11.62, 11.74, 11.9, 12.05].forEach((t, i) => chime(t, [77, 81, 84, 89, 93][i], 0.9));   // wallet fills
[17.65].forEach((t) => { boom(t, 0.7); chime(t, 72, 0.7); });          // vault locks
[20.3, 20.42, 20.54, 20.7].forEach((t, i) => chime(t, [81, 84, 89, 93][i], 0.9));      // pay out
riser(19.6, 1.4, 1); whoosh(20.65, 0.45, 1);
// end (21–25): big hit, held chord, chimes, fade
boom(21.0, 1.1); for (let b = 0; b < 4; b++) stab(21.0 + b * 0.5, [65, 69, 72, 77], 1 - b * 0.15, 0.6); bass(21.0, 2.2, 41, 1.1); chime(21.6, 89, 0.7); chime(22.0, 93, 0.6);
// reverb + master
const rev = new Float32Array(N); for (const [d, fb] of [[0.031, 0.55], [0.047, 0.5], [0.061, 0.45], [0.083, 0.4]]) { const D = at(d), buf = new Float32Array(N); for (let n = 0; n < N; n++) { buf[n] = RV[n] + (n >= D ? buf[n - D] * fb : 0); rev[n] += buf[n] * 0.25; } }
let peak = 0; for (let n = 0; n < N; n++) { const t = n / SR, fade = Math.min(1, (DUR - t) / 0.6); L[n] = Math.tanh((L[n] + rev[n] * 0.5) * 1.1) * fade; R[n] = Math.tanh((R[n] + rev[n] * 0.5) * 1.1) * fade; peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n])); }
const g = 0.89 / peak, buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[n] * g)) * 32767), 46 + n * 4); }
writeFileSync(new URL('../../out/gibwork_explainer_score.wav', import.meta.url), buf); console.log('wrote out/gibwork_explainer_score.wav');
