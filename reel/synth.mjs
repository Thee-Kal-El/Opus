// Score for THE BLOCKCHAIN RUSH — composed and synthesized entirely in code (oscillators, noise, filters).
// No samples, no audio files, no instruments. 96 BPM, F minor, 8 bars = exactly 20.000s.
// Same grid as reel/reel.js: every event is placed with T(bar, beat), so every hit lands on a visual cut.
//   node reel/synth.mjs  ->  out/the_blockchain_rush_score.wav
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000, DUR = 20, N = SR * DUR, TAU = Math.PI * 2;
const BPM = 96, BT = 60 / BPM;
const T = (bar, beat = 0) => (bar * 4 + beat) * BT;
const L = new Float32Array(N), Rr = new Float32Array(N);
const revL = new Float32Array(N), revR = new Float32Array(N), dlyL = new Float32Array(N), dlyR = new Float32Array(N);

let seed = 128;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const at = (t) => Math.round(t * SR);
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4) * Math.SQRT2, Math.sin((p + 1) * Math.PI / 4) * Math.SQRT2];
function put(i, l, r, rev = 0, dly = 0) {
  if (i < 0 || i >= N) return;
  L[i] += l; Rr[i] += r;
  if (rev) { revL[i] += l * rev; revR[i] += r * rev; }
  if (dly) { dlyL[i] += l * dly; dlyR[i] += r * dly; }
}

// ---- harmony: i–VI–III–VII in F minor ----
const CH = { Fm: [41, [0, 3, 7]], Db: [37, [0, 4, 7]], Ab: [44, [0, 4, 7]], Eb: [39, [0, 4, 7]] };
const BAR_CHORD = ['Fm', 'Fm', 'Db', 'Ab', 'Eb', 'Fm', 'Db', 'Fm'];
const HOOK_CHORDS = ['Fm', 'Ab', 'Db', 'Eb'];        // one per hook beat (1849 / 1995 / NOW / DON'T BE LATE)
const chordAt = (t) => CH[BAR_CHORD[Math.min(7, Math.floor(t / (BT * 4)))]];

// sidechain: duck everything melodic on each kick
const KICKS = [];
const duck = (t) => { let g = 1; for (const k of KICKS) { const d = t - k; if (d >= 0 && d < 0.3) g = Math.min(g, 1 - 0.8 * Math.exp(-d * 13)); } return g; };

// ---------- instruments ----------
function kick(t0, g = 1) {
  KICKS.push(t0);
  let ph = 0;
  for (let n = 0; n < 0.42 * SR; n++) {
    const t = n / SR; ph += TAU * (44 + 150 * Math.exp(-t * 34)) / SR;
    const v = Math.tanh((Math.sin(ph) * Math.exp(-t * 7) + (n < 240 ? noise() * 0.5 * (1 - n / 240) : 0)) * 1.6) * 0.8 * g;
    put(at(t0) + n, v, v);
  }
}
function clap(t0, g = 1) {
  let b1 = 0, b2 = 0;
  for (let n = 0; n < 0.3 * SR; n++) {
    const t = n / SR, f = 2 * Math.sin(Math.PI * 1500 / SR), x = noise();
    b1 += f * (x - b2 - 0.5 * b1); b2 += f * b1;
    const env = (t < 0.025 ? Math.exp(-((t * 120) % 1) * 3) : 1) * Math.exp(-t * 14);
    const v = b1 * 1.6 * env * g;
    put(at(t0) + n, v * 0.95, v, 0.4);
  }
}
function snare(t0, g = 1) {
  let hp = 0, prev = 0;
  for (let n = 0; n < 0.2 * SR; n++) {
    const t = n / SR, x = noise(); hp = 0.85 * (hp + x - prev); prev = x;
    const v = (hp * 0.8 * Math.exp(-t * 22) + Math.sin(TAU * 210 * t) * 0.5 * Math.exp(-t * 35)) * g;
    put(at(t0) + n, v, v, 0.25);
  }
}
function hat(t0, g, open = false, p = 0) {
  let hp = 0, prev = 0; const [a, b] = pan(p);
  for (let n = 0; n < (open ? 0.22 : 0.05) * SR; n++) {
    const x = noise(); hp = 0.93 * (hp + x - prev); prev = x;
    const v = hp * Math.exp(-n / SR * (open ? 18 : 80)) * g;
    put(at(t0) + n, v * a, v * b, 0.1);
  }
}
function tom(t0, f0, g = 1) {
  let ph = 0;
  for (let n = 0; n < 0.45 * SR; n++) {
    const t = n / SR; ph += TAU * (f0 * (1 + 1.2 * Math.exp(-t * 18))) / SR;
    const v = Math.sin(ph) * Math.exp(-t * 7) * 0.7 * g;
    put(at(t0) + n, v, v, 0.3);
  }
}
function impact(t0, g = 1) {
  let ph = 0, lp = 0;
  for (let n = 0; n < 2.2 * SR; n++) {
    const t = n / SR; ph += TAU * (32 + 70 * Math.exp(-t * 10)) / SR;
    lp += 0.2 * (noise() - lp);
    const boom = Math.sin(ph) * Math.exp(-t * 2.2) * 0.9, crash = lp * Math.exp(-t * 3) * 0.35;
    const v = Math.tanh((boom + crash) * 1.3) * g;
    put(at(t0) + n, v + crash * 0.2 * g, v - crash * 0.2 * g, 0.35);
  }
}
function crash(t0, g = 1) {
  let hp = 0, prev = 0;
  for (let n = 0; n < 1.6 * SR; n++) {
    const t = n / SR, x = noise(); hp = 0.96 * (hp + x - prev); prev = x;
    const shimmer = Math.sin(TAU * 5400 * t + Math.sin(TAU * 7900 * t) * 2) * 0.25;
    const v = (hp + shimmer * hp) * Math.exp(-t * 2.4) * 0.28 * g;
    put(at(t0) + n, v * 1.05, v * 0.95, 0.3);
  }
}
function riser(t0, dur, g = 1) {
  let b1 = 0, b2 = 0, ph = 0;
  for (let n = 0; n < dur * SR; n++) {
    const k = n / (dur * SR), fc = 300 + 9000 * k * k, f = 2 * Math.sin(Math.PI * Math.min(fc, 12000) / SR);
    b1 += f * (noise() - b2 - 0.3 * b1); b2 += f * b1;
    ph += TAU * (200 + 1400 * k * k * k) / SR;
    const v = (b1 * 0.5 + Math.sin(ph) * 0.18 * k) * g * k * k;
    const w = Math.sin(n / SR * TAU * (2 + 10 * k));
    put(at(t0) + n, v * (1 + 0.4 * w), v * (1 - 0.4 * w), 0.25);
  }
}
function reverseSwell(tEnd, dur, g = 1) {
  let lp = 0;
  for (let n = 0; n < dur * SR; n++) {
    const k = n / (dur * SR); lp += (0.02 + 0.3 * k) * (noise() - lp);
    const v = lp * Math.pow(k, 3) * g;
    put(at(tEnd - dur) + n, v, v, 0.5);
  }
}
function whoosh(t0, dur, g = 1, dir = 1) {
  let b1 = 0, b2 = 0;
  for (let n = 0; n < dur * SR; n++) {
    const k = n / (dur * SR), f = 2 * Math.sin(Math.PI * (dir > 0 ? 400 + 5000 * k : 5400 - 5000 * k) / SR);
    b1 += f * (noise() - b2 - 0.4 * b1); b2 += f * b1;
    const v = b1 * Math.sin(Math.PI * k) * g * 0.6;
    put(at(t0) + n, v * (1 - k), v * k, 0.3);
  }
}
// supersaw chord: 7 detuned saws per note, filter envelope, sidechained
function supersaw(t0, dur, chord, g = 1, o = {}) {
  const [root, iv] = chord, notes = [...iv.map((i) => root + 24 + i), root + 36, root + 12];
  const det = [-0.11, -0.07, -0.03, 0, 0.03, 0.07, 0.11];
  const phs = notes.map(() => det.map(() => rnd()));
  let lpL = 0, lpR = 0, lp2L = 0, lp2R = 0;
  const len = (dur + (o.rel || 0.15)) * SR;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    let sl = 0, sr = 0;
    notes.forEach((m, ni) => det.forEach((d, di) => {
      const f = mtof(m + d); phs[ni][di] = (phs[ni][di] + f / SR) % 1;
      const v = 2 * phs[ni][di] - 1; if (di % 2) sl += v; else sr += v; if (di === 3) { sl += v * 0.5; sr += v * 0.5; }
    }));
    const env = t < 0.005 ? t / 0.005 : t < dur ? Math.exp(-(t - 0.005) * (o.decay ?? 1.2)) : Math.exp(-(dur - 0.005) * (o.decay ?? 1.2)) * Math.exp(-(t - dur) * 30);
    const cut = 0.05 + (o.bright ?? 0.35) * Math.exp(-t * (o.fdecay ?? 4));
    lpL += cut * (sl - lpL); lp2L += cut * (lpL - lp2L); lpR += cut * (sr - lpR); lp2R += cut * (lpR - lp2R);
    const gg = env * g * 0.028 * (o.duck === false ? 1 : duck(t0 + t));
    put(at(t0) + n, lp2L * gg, lp2R * gg, 0.3, o.dly || 0);
  }
}
function pluck(t0, m, g = 1, p = 0) {
  let ph = 0, lp = 0; const f = mtof(m), [a, b] = pan(p);
  for (let n = 0; n < 0.2 * SR; n++) {
    const t = n / SR; ph = (ph + f / SR) % 1;
    const x = (ph < 0.5 ? 1 : -1) * 0.5 + (2 * ph - 1) * 0.5;
    lp += (0.05 + 0.5 * Math.exp(-t * 40)) * (x - lp);
    const v = lp * Math.exp(-t * 16) * g * 0.16 * duck(t0 + t);
    put(at(t0) + n, v * a, v * b, 0.2, 0.45);
  }
}
function bassNote(t0, dur, m, g = 1) {
  let ph = 0, sp = 0, lp = 0, lp2 = 0; const f = mtof(m);
  for (let n = 0; n < (dur + 0.02) * SR; n++) {
    const t = n / SR; ph = (ph + f / SR) % 1; sp += TAU * f / SR;
    const env = Math.min(1, t / 0.004) * (t < dur ? 1 : Math.exp(-(t - dur) * 200));
    const cut = 0.03 + 0.18 * Math.exp(-t * 14);
    lp += cut * ((2 * ph - 1) - lp); lp2 += cut * (lp - lp2);
    const v = (Math.tanh(lp2 * 2.5) * 0.5 + Math.sin(sp) * 0.6) * env * g * 0.42 * duck(t0 + t);
    put(at(t0) + n, v, v);
  }
}
function pad(t0, dur, chord, g = 1) {
  const [root, iv] = chord, notes = iv.map((i) => root + 12 + i);
  const phs = notes.flatMap(() => [rnd(), rnd()]);
  let lpL = 0, lpR = 0;
  for (let n = 0; n < dur * SR; n++) {
    const t = n / SR; let sl = 0, sr = 0;
    notes.forEach((m, i) => {
      for (const [k, d] of [[0, -0.08], [1, 0.08]]) { const j = i * 2 + k; phs[j] = (phs[j] + mtof(m + d) / SR) % 1; const v = 2 * phs[j] - 1; if (k) sr += v; else sl += v; }
    });
    lpL += 0.03 * (sl - lpL); lpR += 0.03 * (sr - lpR);
    const env = Math.min(1, t / 0.15) * Math.min(1, (dur - t) / 0.1);
    const gg = env * g * 0.05 * duck(t0 + t);
    put(at(t0) + n, lpL * gg, lpR * gg, 0.5);
  }
}
function blip(t0, f, g = 1, p = 0) {
  const [a, b] = pan(p);
  for (let n = 0; n < 0.06 * SR; n++) { const t = n / SR; const v = Math.sin(TAU * f * t) * Math.exp(-t * 60) * g * 0.25; put(at(t0) + n, v * a, v * b, 0.15, 0.3); }
}

// ---------- arrangement ----------
// BAR 0 — hook: a hit on every beat (1849 / 1995 / NOW / DON'T BE LATE)
for (let b = 0; b < 4; b++) {
  const t = T(0, b);
  kick(t, 1.1); impact(t, b === 3 ? 0.9 : 0.6);
  supersaw(t, b === 3 ? 0.42 : 0.3, CH[HOOK_CHORDS[b]], b === 3 ? 1.3 : 1.0, { decay: 3, bright: 0.45, duck: false });
  if (b === 3) crash(t, 0.8);
}
reverseSwell(T(1), BT * 0.9, 0.35);

// BARS 1–5 — groove
for (let bar = 1; bar <= 5; bar++) {
  for (let b = 0; b < 4; b++) {
    const t = T(bar, b);
    kick(t);
    if (b % 2 === 1) clap(t, 0.55);
    hat(t + BT / 2, 0.24, b === 3, 0.25);                             // offbeat hat
    if (bar >= 3) { hat(t + BT / 4, 0.09, false, -0.3); hat(t + BT * 0.75, 0.09, false, 0.3); }
  }
  const [root] = chordAt(T(bar));
  for (let e = 0; e < 8; e++) {
    const t = T(bar) + e * BT / 2;
    if (bar === 3) bassNote(t, BT / 2 * 0.8, root - 12 + (e % 2 ? 12 : 0), 0.9); // driving 8ths under the word montage
    else if (e % 2 === 1) bassNote(t, BT / 2 * 0.85, root - 12, 1);         // house offbeat bass
  }
  pad(T(bar), BT * 4, chordAt(T(bar)), bar === 1 ? 0.7 : 1);
  crash(T(bar), bar === 1 ? 0.9 : 0.5);
  impact(T(bar), 0.45);
}
// bar 3: a chord stab on every 8th — one per word on screen
for (let e = 0; e < 8; e++) supersaw(T(3) + e * BT / 2, BT / 2 * 0.6, CH.Ab, 0.75, { decay: 6, bright: 0.4, fdecay: 9 });
// arps (16ths) through the meet / everyone / learn bars
for (const bar of [2, 4, 5]) {
  const [root, iv] = chordAt(T(bar)), seq = [0, 1, 2, 3, 2, 1, 4, 2];
  for (let s = 0; s < 16; s++) {
    const k = seq[s % 8], m = root + 24 + (k >= 3 ? 12 + iv[k - 3] : iv[k]);
    pluck(T(bar) + s * BT / 4, m, bar === 5 ? 1.1 : 0.9, s % 2 ? 0.4 : -0.4);
  }
}
// meet: rising sweep into the name on beat 1; scale blips on the chips (beats 2, 2.5, 3)
whoosh(T(2) - BT, BT, 0.5, 1);
[[2, 2], [2, 2.5], [2, 3]].forEach(([bar, b], i) => blip(T(bar, b), [1046, 1318, 1568][i], 1, (i - 1) * 0.5));
// learn: "Not years." accent on beat 2
supersaw(T(5, 2), 0.3, CH.Fm, 0.8, { decay: 4, bright: 0.5 });
whoosh(T(5) - BT / 2, BT / 2, 0.45, -1);

// BAR 6 — build: "THE RUSH IS ON." then 3·2·1 on beats 1–3
kick(T(6)); impact(T(6), 0.6); crash(T(6), 0.6);
supersaw(T(6), 0.35, CH.Db, 1.0, { decay: 3, bright: 0.45 });
pad(T(6), BT * 4, CH.Db, 0.8);
for (let b = 1; b <= 3; b++) { kick(T(6, b), 0.9); tom(T(6, b), [98, 123, 147][b - 1], 1); supersaw(T(6, b), 0.18, CH.Eb, 0.6 + b * 0.15, { decay: 8, bright: 0.5 }); }
for (let s = 0; s < 16; s++) {
  const t = T(6) + s * BT / 4;
  snare(t, 0.12 + 0.5 * (s / 16) ** 2);
  if (s >= 8) snare(t + BT / 8, 0.1 + 0.4 * ((s - 8) / 8) ** 2);       // roll doubles to 32nds in the last two beats
}
riser(T(6), BT * 4, 0.6);
reverseSwell(T(7), BT * 1.5, 0.55);

// BAR 7 — the drop: JOIN NOW
impact(T(7), 1.3); crash(T(7), 1.1);
for (let b = 0; b < 4; b++) {
  const t = T(7, b);
  kick(t, 1.05);
  if (b % 2 === 1) clap(t, 0.65);
  hat(t + BT / 2, 0.26, true, 0.25); hat(t + BT / 4, 0.1, false, -0.3); hat(t + BT * 0.75, 0.1, false, 0.3);
  supersaw(t, BT * 0.9, CH.Fm, 1.15, { decay: 1.5, bright: 0.5, fdecay: 3, dly: 0.2 });
  for (const e of [0.5]) bassNote(t + e * BT, BT / 2 * 0.85, CH.Fm[0] - 12, 1.1);
  bassNote(t, BT * 0.3, CH.Fm[0] - 24 + 12, 0.6);
}
[[0, 'Fm'], [1, 'Fm'], [2, 'Fm'], [3, 'Fm']].forEach(([b]) => { const [root, iv] = CH.Fm; [0, 1, 2, 3].forEach((s) => pluck(T(7, b) + s * BT / 4, root + 36 + [0, 7, 12, 3][s], 0.9, s % 2 ? 0.5 : -0.5)); });

// ---------- FX buses ----------
function delay(time, fb, mix) {
  const d = Math.round(time * SR), bL = new Float32Array(N), bR = new Float32Array(N);
  for (let n = 0; n < N; n++) { bL[n] = dlyL[n] + (n >= d ? bR[n - d] * fb : 0); bR[n] = (n >= d ? bL[n - d] * fb : 0); }
  for (let n = 0; n < N; n++) { L[n] += (bL[n] - dlyL[n]) * mix; Rr[n] += bR[n] * mix; }
}
function reverb(mix) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356], aps = [225, 556, 441];
  const run = (inp, spread) => {
    const out = new Float32Array(N);
    for (const c0 of combs) {
      const c = Math.round((c0 + spread) * SR / 44100 * 1.5), buf = new Float32Array(c); let p = 0, lp = 0;
      for (let n = 0; n < N; n++) { const y = buf[p]; lp = y * 0.65 + lp * 0.35; buf[p] = inp[n] + lp * 0.84; p = (p + 1) % c; out[n] += y / combs.length; }
    }
    for (const a0 of aps) {
      const a = Math.round((a0 + spread) * SR / 44100), buf = new Float32Array(a); let p = 0;
      for (let n = 0; n < N; n++) { const b = buf[p], x = out[n]; buf[p] = x + b * 0.5; out[n] = -x + b; p = (p + 1) % a; }
    }
    return out;
  };
  const oL = run(revL, 0), oR = run(revR, 23);
  for (let n = 0; n < N; n++) { L[n] += oL[n] * mix; Rr[n] += oR[n] * mix; }
}
delay(BT * 0.75, 0.38, 0.5);
reverb(0.28);

// ---------- master: DC cut, glue, limiter, fade on the last 8th ----------
let hL = 0, hR = 0, pL = 0, pR = 0, peak = 0;
for (let n = 0; n < N; n++) {
  hL = 0.9996 * (hL + L[n] - pL); pL = L[n]; hR = 0.9996 * (hR + Rr[n] - pR); pR = Rr[n];
  const fade = Math.min(1, (N - n) / (BT / 2 * SR));
  L[n] = Math.tanh(hL * 1.15) * fade; Rr[n] = Math.tanh(hR * 1.15) * fade;
  peak = Math.max(peak, Math.abs(L[n]), Math.abs(Rr[n]));
}
const g = 0.84 / peak;
const pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12);
pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22); pcm.writeUInt32LE(SR, 24);
pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4);
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rr[n] * g)) * 32767), 46 + n * 4);
}
const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'out');
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'the_blockchain_rush_score.wav'), pcm);
console.log(`wrote out/the_blockchain_rush_score.wav  ${DUR}s @ ${BPM} BPM, ${KICKS.length} kicks`);
