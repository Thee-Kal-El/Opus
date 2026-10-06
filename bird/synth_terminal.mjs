// Score for the BIRDEYE TERMINAL film (26s) — strong sci-fi beats, synthesized entirely in code (no samples).
// 120 BPM, C minor. Dot laser 0s, windows on beats 2.0–3.5, drop on 4.0, a laser/braam hit on every camera
// whip (6, 8, 10, 12, 14, 16s), double-time 16–22s, logo slam on 22.0s.
//   node bird/synth_terminal.mjs  ->  out/birdeye_terminal_score.wav
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000, DUR = 26, N = SR * DUR, TAU = Math.PI * 2, BT = 0.5;
const L = new Float32Array(N), Rr = new Float32Array(N), revL = new Float32Array(N), revR = new Float32Array(N), dlyL = new Float32Array(N), dlyR = new Float32Array(N);
let seed = 1207;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const at = (t) => Math.round(t * SR);
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4) * Math.SQRT2, Math.sin((p + 1) * Math.PI / 4) * Math.SQRT2];
function put(i, l, r, rev = 0, dly = 0) { if (i < 0 || i >= N) return; L[i] += l; Rr[i] += r; if (rev) { revL[i] += l * rev; revR[i] += r * rev; } if (dly) { dlyL[i] += l * dly; dlyR[i] += r * dly; } }

// ---- harmony ----
const CH = { Cm: [36, [0, 3, 7, 10]], Ab: [32, [0, 4, 7, 11]], Eb: [39, [0, 4, 7, 11]], Bb: [34, [0, 4, 7, 9]] };
const BARS = ['Cm', 'Ab', 'Eb', 'Bb'];
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

// ---------- arrangement (26s, 120 BPM; picture events on the beat) ----------
// BT = 0.5 (from the header)
// 0–0.9 the dot: a laser blip + sub swell
laser(0.05, 1.2, 0, 3200, 800); swell(0.9, 0.85, 0.7); boomish(0.9);
function boomish(t0) { softImpact(t0, 0.9); }
// 0.9–4: windows pop in, a tight build
[2.0, 2.5, 3.0, 3.5].forEach((t, i) => { laser(t, 1, (i - 1.5) * 0.5, 2600 - i * 300, 300); bigKick(t, 0.75); });
for (let s = 0; s < 12; s++) { const t = 1.0 + s * 0.25, [root, iv] = chordAt(t); arpSaw(t, root + 36 + iv[s % 4], 0.6 + s * 0.03, s % 2 ? 0.4 : -0.4); }
zapRise(2.5, 1.5, 1); for (let k = 0; k < 8; k++) snap(3.5 + k * 0.0625, 0.12 + k * 0.05);
// 4.0: THE DROP — full sci-fi groove until the end card
braam(4.0, 2.2, CH.Cm, 1.3); softImpact(4.0, 1.1);
const SEQ = [0, 2, 1, 3, 2, 0, 3, 1];
for (let t = 4.0; t < 22.0; t += BT) {
  const b = Math.round(t / BT), [root] = chordAt(t);
  bigKick(t, 1); if (b % 4 === 2) snap(t, 0.85);
  hat(t + BT / 2, 0.12, b % 4 === 3, 0.25); hat(t + BT / 4, 0.05, false, -0.3); hat(t + BT * 0.75, 0.06, false, 0.3);
  reese(t + BT / 2, BT * 0.45, root - 12, 1);
}
for (let s = 0; s < (22 - 4) / 0.125; s++) { const t = 4 + s * 0.125, [root, iv] = chordAt(t); if (s % 2 === 0 || t >= 16) arpSaw(t, root + 36 + iv[SEQ[(s >> (t >= 16 ? 0 : 1)) % 8]] + (s % 16 >= 12 ? 12 : 0), t >= 16 ? 0.9 : 0.75, s % 2 ? 0.45 : -0.45); }
// section hits: a laser + braam on every whip arrival (6, 8, 10, 12, 14, 16)
[6, 8, 10, 12, 14, 16].forEach((t, i) => { laser(t - 0.3, 0.9, i % 2 ? 0.6 : -0.6, 300, 2600); softImpact(t, 0.6); braam(t, 1.6, chordAt(t), 0.8); });
// 16–22: EVERY CHAIN — double-time hats, rising energy into the logo
for (let t = 16; t < 21.5; t += 0.125) hat(t, 0.07, false, Math.sin(t * 9) * 0.5);
zapRise(20.5, 1.5, 1.2); for (let k = 0; k < 12; k++) snap(21.25 + k * 0.0625, 0.1 + k * 0.05);
// 22.0: logo slam — big impact, braam, the groove resolves and rings out
softImpact(22.0, 1.3); braam(22.0, 3.6, CH.Cm, 1.4); bigKick(22.0, 1.2); laser(22.0, 1, 0, 3000, 120);
[60, 63, 67, 72, 75].forEach((m, i) => bell(22.05 + i * 0.012, m, 0.55, (i - 2) * 0.3, 3.2));
pad(22.0, 4.0, CH.Cm, 1.1, { atk: 0.05, rel: 2.0 });

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
writeFileSync(resolve(out, 'birdeye_terminal_score.wav'), pcm);
console.log(`wrote out/birdeye_terminal_score.wav  ${DUR}s, 120 BPM, ${KICKS.length} kicks`);
