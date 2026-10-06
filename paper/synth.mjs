// Score + paper foley for the ArcTown.app origami story — synthesized entirely in code (no samples).
// 120 BPM, D major (D – A – Bm – G), 10 bars = 20.000s. Story beats: plane invite 1.4s, map unfold 2.6–3.4s,
// route + stamp 3.8–4.5s, flight 5.5s, page turn + drop 7.0s, OWN LAND 10.75s, HANG OUT 14.0s, end card 17.2s.
//   node paper/synth.mjs  ->  out/arctown_paper_score.wav
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000, DUR = 20, N = SR * DUR, TAU = Math.PI * 2, BT = 0.5;
const L = new Float32Array(N), Rr = new Float32Array(N), revL = new Float32Array(N), revR = new Float32Array(N), dlyL = new Float32Array(N), dlyR = new Float32Array(N);
let seed = 1207;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const at = (t) => Math.round(t * SR);
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4) * Math.SQRT2, Math.sin((p + 1) * Math.PI / 4) * Math.SQRT2];
function put(i, l, r, rev = 0, dly = 0) { if (i < 0 || i >= N) return; L[i] += l; Rr[i] += r; if (rev) { revL[i] += l * rev; revR[i] += r * rev; } if (dly) { dlyL[i] += l * dly; dlyR[i] += r * dly; } }

// ---- harmony ----
const CH = { D: [38, [0, 4, 7, 11]], Bm: [35, [0, 3, 7, 10]], G: [31, [0, 4, 7, 11]], A: [33, [0, 4, 7, 9]] };
const BARS = ['D', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'G', 'D', 'D'];
const chordAt = (t) => CH[BARS[Math.min(9, Math.floor(t / 2))]];
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
// paper foley
function fold(t0, g = 1) {               // quick "thwip" of a paper fold
  let b1 = 0, b2 = 0;
  for (let n = 0; n < 0.16 * SR; n++) { const k = n / (0.16 * SR), f = 2 * Math.sin(Math.PI * (900 + 5000 * k) / SR); b1 += f * (noise() - b2 - 0.35 * b1); b2 += f * b1; const v = b1 * Math.sin(Math.PI * k) * g * 0.22; put(at(t0) + n, v, v * 0.9, 0.15); }
}
function rustle(t0, dur, g = 1) {        // crinkly paper movement
  let hp = 0, prev = 0;
  for (let n = 0; n < dur * SR; n++) { const t = n / SR, x = noise(); hp = 0.9 * (hp + x - prev); prev = x; const grit = hash01(Math.floor(t * 180)) > 0.6 ? 1 : 0.25; const v = hp * grit * Math.sin(Math.PI * t / dur) * g * 0.08; put(at(t0) + n, v, v, 0.1); }
}
function hash01(n) { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; }
function scribble(t0, dur, g = 1) {      // marker on paper
  for (let n = 0; n < dur * SR; n++) { const t = n / SR, f = 2400 + 1200 * Math.sin(t * 40), v = Math.sin(TAU * f * t) * noise() * 0.5 * (0.5 + 0.5 * Math.sin(t * 55)) * g * 0.05; put(at(t0) + n, v, v, 0.05); }
}
function pok(t0, m, g = 1, p = 0) {      // soft woody pop for pop-up cards
  const f = mtof(m), [a, b] = pan(p);
  for (let n = 0; n < 0.12 * SR; n++) { const t = n / SR, v = Math.sin(TAU * f * t * (1 + 0.6 * Math.exp(-t * 50))) * Math.exp(-t * 32) * g * 0.12; put(at(t0) + n, v * a, v * b, 0.2); }
}
// marimba-ish pluck for the melody
function mallet(t0, m, g = 1, p = 0) {
  const f = mtof(m), [a, b] = pan(p);
  for (let n = 0; n < 0.5 * SR; n++) { const t = n / SR, v = (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 4 * t) * Math.exp(-t * 30)) * Math.exp(-t * 7) * g * 0.13 * duck(t0 + t); put(at(t0) + n, v * a, v * b, 0.3, 0.3); }
}
// pads under everything
for (let b = 0; b < 10; b++) pad(b * 2, 2.0, CH[BARS[b]], b < 3 ? 0.8 : 1, { atk: b === 0 ? 0.6 : 0.15 });
// 0–3: the lonely avatar — gentle mallet arps
const ARP = [0, 2, 1, 3, 2, 1, 0, 2];
for (let s = 0; s < 24; s++) { const t = s * 0.25, [root, iv] = chordAt(t); mallet(t, root + 36 + iv[ARP[s % 8]], 0.7, s % 2 ? 0.3 : -0.3); }
[62, 66, 69].forEach((m, i) => bell(0.55 + i * 0.05, m + 12, 0.35, (i - 1) * 0.3, 1.2));     // title sparkle
whoosh(1.4, 1.0, 0.6, true); rustle(1.5, 0.8, 0.8);                                          // the paper plane
pok(2.35, 76, 1.2); fold(2.6, 1); fold(3.0, 1.1); fold(3.4, 1.1);                           // catch + unfolds
// 3–7: map + flight — pulse enters, route scribble, stamp, riser into the page turn
for (let t = 3.0; t < 7.0; t += BT) { kick(t, 0.75); hat(t + BT / 2, 0.09, false, 0.2); }
for (let s = 0; s < 16; s++) { const t = 3.0 + s * 0.25, [root, iv] = chordAt(t); mallet(t, root + 36 + iv[ARP[s % 8]], 0.75, s % 2 ? 0.3 : -0.3); }
scribble(3.8, 0.7, 1); pok(4.5, 64, 1.4); softImpact(4.5, 0.5); clap(4.5, 0.4);
fold(5.15, 1.1); fold(5.3, 0.9); whoosh(5.5, 1.2, 0.8, true);
riser(5.6, 1.4, 1.0);
for (let k = 0; k < 8; k++) clap(6.5 + k * 0.0625, 0.12 + k * 0.03);
// 7.0: page turn — big paper whoosh, impact, full groove to the end card
rustle(6.6, 0.5, 1.6); whoosh(6.6, 0.5, 1.0, false); softImpact(7.0, 0.9);
const MEL = [7, 9, 11, 14, 11, 9, 7, 4, 7, 9, 11, 9, 7, 4, 2, 4];
for (let t = 7.0; t < 17.0; t += BT) {
  kick(t, 1);
  if (Math.round(t / BT) % 2 === 1) clap(t, 0.5);
  hat(t + BT / 2, 0.13, Math.round(t / BT) % 4 === 3, 0.25); hat(t + BT / 4, 0.05, false, -0.3); hat(t + BT * 0.75, 0.05, false, 0.3);
  const [root] = chordAt(t); bassNote(t + BT / 2, BT * 0.42, root, 1); bassNote(t, BT * 0.25, root, 0.5);
}
for (let s = 0; s < 40; s++) { const t = 7.0 + s * 0.25, [root, iv] = chordAt(t); mallet(t, root + 36 + iv[ARP[s % 8]], 0.55, s % 2 ? 0.35 : -0.35); }
for (let s = 0; s < 20; s++) { const t = 7.0 + s * 0.5; if (t >= 17) break; pluck(t, 62 + MEL[s % 16], 1.0, (s % 2 ? 0.3 : -0.3)); }
for (let t = 7.25; t < 10.5; t += 0.25) pok(t, 70 + ((t * 4) % 5) * 2, 0.55, ((t * 4) % 2 ? 0.4 : -0.4));   // pop-up cards
// OWN LAND
fold(11.25, 1.2); rustle(11.25, 0.3, 1); fold(11.75, 1.3); softImpact(11.75, 0.5);
[74, 78, 81, 86].forEach((m, i) => bell(12.0 + i * 0.06, m, 0.45, (i - 1.5) * 0.4, 1.0));     // confetti
// HANG OUT
[14.0, 14.25, 14.5, 14.75].forEach((t, i) => pok(t, 67 + i * 3, 0.9, (i - 1.5) * 0.4));
[14.5, 14.75, 15.0, 15.25].forEach((t, i) => pok(t + 0.02, 79 + i * 2, 0.6, (i - 1.5) * 0.4));
[15.0, 15.5, 16.0].forEach((t) => { const [root, iv] = chordAt(t); iv.slice(0, 3).forEach((i) => pluck(t, root + 48 + i, 0.7, 0)); });
// 16.5: tilt up to the sky, end card, outro
whoosh(16.5, 0.9, 0.8, true); rustle(16.7, 2.0, 0.5);
softImpact(17.2, 0.8); [62, 66, 69, 74, 78].forEach((m, i) => bell(17.2 + i * 0.015, m, 0.6, (i - 2) * 0.3, 2.4));
scribble(17.75, 0.5, 0.8); scribble(18.4, 0.5, 0.8);
for (let t = 17.0; t < 19.0; t += BT) { kick(t, 0.7); if (Math.round(t / BT) % 2 === 1) clap(t, 0.35); hat(t + BT / 2, 0.08, false, 0.25); }
for (let s = 0; s < 12; s++) { const t = 17.0 + s * 0.25, [root, iv] = chordAt(t); mallet(t, root + 36 + iv[ARP[s % 8]], 0.6 * (1 - s / 14), s % 2 ? 0.3 : -0.3); }
pad(17.0, 3.0, CH.D, 1.2, { atk: 0.1, rel: 1.4 });

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
const g = 0.92 / peak, pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) { pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4); pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rr[n] * g)) * 32767), 46 + n * 4); }
const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'out'); mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'arctown_paper_score.wav'), pcm);
console.log(`wrote out/arctown_paper_score.wav  ${DUR}s, 120 BPM, ${KICKS.length} kicks`);
