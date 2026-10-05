// Score for VISIT ARCTOWN — synthwave, synthesized entirely in code (oscillators, noise, filters).
// No samples or audio files. 120 BPM, A minor (Am – F – C – G – Am), 5 bars = 10.000s.
// The breakout lands on bar 2 (2.0s), the fly-through on bar 3 (4.0s), the end card on bar 5 (8.0s).
//   node arc/synth.mjs  ->  out/visit_arctown_score.wav
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000, DUR = 10, N = SR * DUR, TAU = Math.PI * 2, BT = 0.5;
const L = new Float32Array(N), Rr = new Float32Array(N), revL = new Float32Array(N), revR = new Float32Array(N), dlyL = new Float32Array(N), dlyR = new Float32Array(N);
let seed = 1207;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const at = (t) => Math.round(t * SR);
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4) * Math.SQRT2, Math.sin((p + 1) * Math.PI / 4) * Math.SQRT2];
function put(i, l, r, rev = 0, dly = 0) { if (i < 0 || i >= N) return; L[i] += l; Rr[i] += r; if (rev) { revL[i] += l * rev; revR[i] += r * rev; } if (dly) { dlyL[i] += l * dly; dlyR[i] += r * dly; } }

// ---- harmony ----
const CH = { Am: [33, [0, 3, 7, 12]], F: [29, [0, 4, 7, 12]], C: [36, [0, 4, 7, 11]], G: [31, [0, 4, 7, 10]] };
const BARS = ['Am', 'F', 'C', 'G', 'Am'];
const chordAt = (t) => CH[BARS[Math.min(4, Math.floor(t / 2))]];
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

// ---------- arrangement ----------
// synthwave snare: noise + tone through a big gated room
function snare(t0, g = 1) {
  let hp = 0, prev = 0;
  for (let n = 0; n < 0.32 * SR; n++) { const t = n / SR, x = noise(); hp = 0.8 * (hp + x - prev); prev = x; const gate = t < 0.22 ? 1 : Math.exp(-(t - 0.22) * 60); const v = (hp * 0.6 * Math.exp(-t * 6) + Math.sin(TAU * 185 * t) * 0.5 * Math.exp(-t * 28)) * gate * g * 0.55; put(at(t0) + n, v, v, 0.5); }
}
// zap: neon flicker / electric buzz
function zap(t0, dur, g = 1) {
  for (let n = 0; n < dur * SR; n++) { const t = n / SR; const saw = 2 * ((t * 120) % 1) - 1; const v = (saw * 0.5 + noise() * 0.5) * Math.exp(-t * 18) * g * 0.08; put(at(t0) + n, v, v, 0.15); }
}
function arp(t0, m, g = 1, p = 0) {
  let ph = 0, lp = 0; const f = mtof(m), [a, b] = pan(p);
  for (let n = 0; n < 0.14 * SR; n++) { const t = n / SR; ph = (ph + f / SR) % 1; const x = 2 * ph - 1; lp += (0.05 + 0.35 * Math.exp(-t * 25)) * (x - lp); const v = lp * Math.exp(-t * 14) * g * 0.11 * duck(t0 + t); put(at(t0) + n, v * a, v * b, 0.3, 0.5); }
}
// pads all the way through
for (let b = 0; b < 5; b++) pad(b * 2, 2.0, CH[BARS[b]], b === 0 ? 0.8 : 1.1, { atk: b === 0 ? 0.6 : 0.08, cut: b === 0 ? 0.02 : 0.04 });
// 0–2: the poster. filtered 16th arp, heartbeat kick on 1 & 3, riser into the breakout
for (let s = 0; s < 64; s++) {
  const t = s * 0.125; if (t >= 9.0) break;
  const [root, iv] = chordAt(t), seq = [0, 1, 2, 3, 2, 1, 2, 3];
  arp(t, root + 36 + iv[seq[s % 8]], t < 2 ? 0.55 + 0.25 * (t / 2) : 0.9, s % 2 ? 0.4 : -0.4);
}
kick(0, 0.6); kick(1.0, 0.6);
riser(0.9, 1.1, 1.0); zap(1.95, 0.12, 1); zap(2.15, 0.08, 0.7);
// 2.0: BREAKOUT — impact, crash, full groove
softImpact(2.0, 1.1); [0, 0.03].forEach((d) => whoosh(2.0 + d, 0.7, 1.0, false));
for (let t = 2.0; t < 8.0; t += BT) {
  kick(t, 1);
  if (Math.round(t / BT) % 2 === 1) snare(t, 1);
  hat(t + BT / 2, 0.12, false, 0.25); hat(t + BT / 4, 0.05, false, -0.3); hat(t + BT * 0.75, 0.05, false, 0.3);
  const [root] = chordAt(t);
  bassNote(t, BT * 0.42, root, 1); bassNote(t + BT / 2, BT * 0.42, root + 12, 0.8);   // synthwave octave bass
}
// cubes fly past, title lifts
[2.35, 2.6, 2.85, 3.1].forEach((t, i) => whoosh(t, 0.45, 0.55, i % 2 === 0));
[69, 72, 76, 81].forEach((m, i) => bell(2.6 + i * 0.06, m, 0.4, (i - 1.5) * 0.4, 1.4));
// 4.0: through the frame — big whoosh + swell
swell(4.0, 0.6, 0.6); whoosh(4.0, 1.4, 1.1, true); softImpact(4.0, 0.5);
[5.3, 6.4, 7.4].forEach((t) => whoosh(t, 0.5, 0.45, false));       // banners overhead
riser(7.2, 0.8, 0.8);
// 8.0: end card — sign ignites, final chord rings out
softImpact(8.0, 0.9); zap(8.0, 0.1, 1.2); zap(8.12, 0.08, 1); zap(8.24, 0.1, 0.9);
for (let t = 8.0; t < 9.5; t += BT) { kick(t, 0.85); if (Math.round(t / BT) % 2 === 1) snare(t, 0.8); bassNote(t, BT * 0.45, 33, 0.9); }
[57, 60, 64, 69, 72].forEach((m, i) => bell(8.0 + i * 0.012, m, 0.6, (i - 2) * 0.3, 2.0));
blip(9.0, 84, 1.0); blip(9.06, 88, 0.8);
pad(8.0, 2.0, CH.Am, 1.2, { atk: 0.05, rel: 0.9 });

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
  const fade = Math.min(1, (N - n) / (0.6 * SR)), fin = Math.min(1, n / (0.004 * SR));
  L[n] = Math.tanh(hL * 1.1) * fade * fin; Rr[n] = Math.tanh(hR * 1.1) * fade * fin; peak = Math.max(peak, Math.abs(L[n]), Math.abs(Rr[n]));
}
const g = 0.8 / peak, pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) { pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4); pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rr[n] * g)) * 32767), 46 + n * 4); }
const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'out'); mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'visit_arctown_score.wav'), pcm);
console.log(`wrote out/visit_arctown_score.wav  ${DUR}s, 120 BPM, ${KICKS.length} kicks`);
