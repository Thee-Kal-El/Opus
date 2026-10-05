// Synthesizes the 15s soundtrack (120 BPM, A minor) to out/soundtrack.wav.
// Every event writes into a circular buffer, and the delay/reverb run two laps,
// so tails that cross 15s wrap back to 0s and the loop point is inaudible.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000, DUR = 15, N = SR * DUR, BEAT = 0.5, TAU = Math.PI * 2;
const L = new Float32Array(N), Rt = new Float32Array(N);
const sendL = new Float32Array(N), sendR = new Float32Array(N); // reverb send
const dlyL = new Float32Array(N), dlyR = new Float32Array(N);   // delay send

let seed = 7;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const idx = (t) => ((Math.round(t * SR) % N) + N) % N;
function put(i, l, r, rev = 0, dly = 0) {
  i = ((i % N) + N) % N;
  L[i] += l; Rt[i] += r;
  if (rev) { sendL[i] += l * rev; sendR[i] += r * rev; }
  if (dly) { dlyL[i] += l * dly; dlyR[i] += r * dly; }
}
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];

const CUTS = [1, 3.5, 6.5, 9.5, 12.5];
// chord per section: [root midi, triad intervals]
const CHORDS = [[0, 3.5, 45, [0, 3, 7]], [3.5, 6.5, 41, [0, 4, 7]], [6.5, 9.5, 48, [0, 4, 7]], [9.5, 12.5, 43, [0, 4, 7]], [12.5, 15, 45, [0, 3, 7]]];
const chordAt = (t) => CHORDS.find(([a, b]) => t >= a && t < b) || CHORDS[0];
// sidechain: duck on every kick
const kickOn = (t) => !(t >= 14.0 && t < 15.0);
const duck = (t) => { const ph = (t % BEAT); return kickOn(t - ph) ? 1 - 0.75 * Math.exp(-ph * 14) : 1; };

// ---- kick ----
function kick(t0, gain = 1) {
  const len = 0.5 * SR; let ph = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR, f = 46 + 130 * Math.exp(-t * 32);
    ph += TAU * f / SR;
    const v = (Math.sin(ph) * Math.exp(-t * 6.5) + (n < 200 ? noise() * 0.4 * (1 - n / 200) : 0)) * 0.75 * gain;
    const s = Math.tanh(v * 1.4);
    put(idx(t0) + n, s, s);
  }
}
// ---- hats / claps ----
function hat(t0, gain, open = false, p = 0) {
  const len = (open ? 0.18 : 0.045) * SR; let hp = 0, prev = 0; const [a, b] = pan(p);
  for (let n = 0; n < len; n++) {
    const x = noise(); hp = 0.92 * (hp + x - prev); prev = x;
    const v = hp * Math.exp(-n / SR * (open ? 22 : 90)) * gain;
    put(idx(t0) + n, v * a, v * b, 0.15);
  }
}
function clap(t0, gain) {
  const len = 0.25 * SR; let bp1 = 0, bp2 = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const env = (t < 0.03 ? (Math.exp(-((t * 100) % 1) * 4)) : 1) * Math.exp(-t * 16);
    // state-variable bandpass ~1.4kHz
    const f = 2 * Math.sin(Math.PI * 1400 / SR); const x = noise();
    bp1 += f * (x - bp2 - 0.6 * bp1); bp2 += f * bp1;
    const tone = Math.sin(TAU * 190 * t) * Math.exp(-t * 30) * 0.4;
    const v = (bp1 * 1.8 + tone) * env * gain;
    put(idx(t0) + n, v * 0.9, v, 0.45);
  }
}
// ---- impact: sub boom + noise crash ----
function impact(t0, gain = 1) {
  const len = 1.6 * SR; let lp = 0, ph = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    ph += TAU * (34 + 60 * Math.exp(-t * 12)) / SR;
    const boom = Math.sin(ph) * Math.exp(-t * 2.4) * 0.8;
    lp += 0.25 * (noise() - lp);
    const crash = lp * Math.exp(-t * 4) * 0.18;
    const v = Math.tanh((boom + crash) * gain * 1.2);
    put(idx(t0) + n, v + crash * 0.2, v - crash * 0.2, 0.35);
  }
}
// ---- riser: filtered noise sweep + rising tone ----
function riser(t0, dur, gain) {
  const len = dur * SR; let b1 = 0, b2 = 0, ph = 0;
  for (let n = 0; n < len; n++) {
    const k = n / len, t = n / SR;
    const fc = 300 + 7000 * k * k;
    const f = 2 * Math.sin(Math.PI * Math.min(fc, 12000) / SR);
    b1 += f * (noise() - b2 - 0.35 * b1); b2 += f * b1;
    ph += TAU * (180 + 900 * k * k) / SR;
    const v = (b1 * 0.6 + Math.sin(ph) * 0.12 * k) * gain * k * k;
    const w = Math.sin(t * TAU * 3) * 0.5;
    put(idx(t0) + n, v * (1 + w * 0.4), v * (1 - w * 0.4), 0.3);
  }
}
// ---- downlifter whoosh ----
function whoosh(t0, dur, gain) {
  const len = dur * SR; let b1 = 0, b2 = 0;
  for (let n = 0; n < len; n++) {
    const k = n / len;
    const f = 2 * Math.sin(Math.PI * (6000 * (1 - k) + 200) / SR);
    b1 += f * (noise() - b2 - 0.4 * b1); b2 += f * b1;
    const v = b1 * gain * (1 - k) * Math.min(1, k * 20);
    put(idx(t0) + n, v * (1 - k), v * k + v * 0.3, 0.3);
  }
}
// ---- bass: 16th rolling saw through a one-pole lowpass, sidechained ----
function bass() {
  let lp = 0, lp2 = 0, ph = 0;
  for (let n = 0; n < N; n++) {
    const t = n / SR; const [, , root] = chordAt(t);
    const step = Math.floor(t / 0.125), st = t - step * 0.125;
    const oct = step % 4 === 2 ? 12 : 0;
    const f = mtof(root - 12 + oct);
    ph = (ph + f / SR) % 1;
    const saw = 2 * ph - 1;
    const env = Math.exp(-st * 18);
    const cut = 0.04 + 0.12 * env;
    lp += cut * (saw - lp); lp2 += cut * (lp - lp2);
    const build = t >= 14 ? 1 - (t - 14) * 0.7 : 1;
    const v = Math.tanh(lp2 * 2.2) * 0.24 * duck(t) * build * (t < 1 ? 0.5 : 1);
    L[n] += v; Rt[n] += v;
  }
}
// ---- pad: detuned saws, slow filter, sidechained ----
function pad() {
  const phs = new Float64Array(18).fill(0).map(() => rnd());
  let lpL = 0, lpR = 0;
  for (let n = 0; n < N; n++) {
    const t = n / SR; const [, , root, iv] = chordAt(t);
    let sl = 0, sr = 0, k = 0;
    for (const o of [12, 24]) for (const i of iv) for (const d of [-0.12, 0.12, 0]) {
      const f = mtof(root + o + i + d);
      phs[k] = (phs[k] + f / SR) % 1;
      const v = 2 * phs[k] - 1;
      if (d < 0) sl += v; else if (d > 0) sr += v; else { sl += v * 0.5; sr += v * 0.5; }
      k++;
    }
    const cut = 0.025 + 0.02 * Math.sin(TAU * t / DUR * 2) ** 2;
    lpL += cut * (sl - lpL); lpR += cut * (sr - lpR);
    const g = 0.09 * duck(t) * (t < 1 ? 0.6 : 1);
    put(n, lpL * g, lpR * g, 0.4);
  }
}
// ---- arp: 16th plucks across the chord, ping-pong delay ----
function arp() {
  for (let step = 0; step < DUR / 0.125; step++) {
    const t0 = step * 0.125;
    if (t0 < 3.5 || t0 >= 14.0) continue;
    const [, , root, iv] = chordAt(t0);
    const seq = [0, 1, 2, 3, 2, 1, 4, 2];
    const s = seq[step % 8]; const note = root + 24 + (s >= 3 ? 12 + iv[s - 3] : iv[s]);
    const f = mtof(note), len = 0.12 * SR; let ph = 0, lp = 0;
    const [a, b] = pan(step % 2 ? 0.45 : -0.45);
    const gain = (t0 >= 9.5 && t0 < 12.5 ? 0.6 : 0.45);
    for (let n = 0; n < len; n++) {
      const t = n / SR; ph = (ph + f / SR) % 1;
      const sq = Math.sin(TAU * ph) + 0.25 * Math.sin(TAU * ph * 3) * Math.exp(-t * 40);
      lp += (0.08 + 0.4 * Math.exp(-t * 30)) * (sq - lp);
      const v = lp * Math.exp(-t * 14) * gain;
      put(idx(t0) + n, v * a, v * b, 0.25, 0.5);
    }
  }
}
// ---- scanner sweep tone ----
function scanner() {
  const t0 = 7.0, len = 1.0 * SR; let ph = 0;
  for (let n = 0; n < len; n++) {
    const k = n / len; ph += TAU * (400 + 1200 * k) / SR;
    const v = Math.sin(ph) * Math.sin(ph * 0.5) * 0.05 * Math.sin(Math.PI * k);
    put(idx(t0) + n, v * (1 - k), v * k, 0.3);
  }
}

// ---------- arrange ----------
for (let b = 0; b < DUR / BEAT; b++) {
  const t = b * BEAT;
  if (kickOn(t)) kick(t, t === 0 ? 1.15 : 1);
  if (t >= 1) hat(t + 0.25, 0.22, b % 4 === 3, 0.2);
  if (t >= 3.5 && b % 2 === 1 && t < 14) clap(t, 0.3);
}
for (let s = 0; s < DUR / 0.125; s++) {
  const t = s * 0.125;
  if (t >= 6.5 && t < 12.5 && s % 2 === 0 && s % 4 !== 2) hat(t, 0.1, false, -0.3);
  if (t >= 6.5 && t < 14 && s % 4 === 3) hat(t, 0.13, false, 0.35);
  if (t >= 14 && t < 15) hat(t, 0.06 + 0.12 * (t - 14), false, Math.sin(s) * 0.5); // snare-roll-ish build
}
// build roll into the drop
for (let k = 0; k < 12; k++) clap(14 + (k < 4 ? k * 0.125 : 0.5 + (k - 4) * 0.0625), 0.08 + k * 0.025);
impact(0, 1.25);
for (const T of CUTS) impact(T, T === 9.5 || T === 12.5 ? 0.8 : 0.55);
riser(13.9, 1.1, 0.55);
riser(8.6, 0.9, 0.35);
riser(0.55, 0.45, 0.25);
whoosh(3.3, 0.5, 0.4); whoosh(6.3, 0.45, 0.35); whoosh(12.25, 0.5, 0.45);
scanner();
bass(); pad(); arp();

// ---------- circular FX ----------
function circularDelay(inL, inR, time, fb, mix) {
  const d = Math.round(time * SR), bL = new Float32Array(N), bR = new Float32Array(N);
  for (let lap = 0; lap < 3; lap++) for (let n = 0; n < N; n++) {
    const j = (n - d + N) % N;
    bL[n] = inL[n] + bR[j] * fb; bR[n] = inR[n] * 0.3 + bL[j] * fb; // ping-pong
  }
  for (let n = 0; n < N; n++) { L[n] += (bL[n] - inL[n]) * mix; Rt[n] += (bR[n] - inR[n] * 0.3) * mix; }
}
function circularReverb(inL, inR, mix) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356], aps = [225, 556, 441];
  const run = (inp, spread) => {
    const out = new Float32Array(N);
    for (const c0 of combs) {
      const c = Math.round((c0 + spread) * SR / 44100 * 1.6), buf = new Float32Array(c); let p = 0, lp = 0;
      for (let lap = 0; lap < 2; lap++) for (let n = 0; n < N; n++) {
        const y = buf[p]; lp = y * 0.7 + lp * 0.3; buf[p] = inp[n] + lp * 0.86; p = (p + 1) % c;
        if (lap === 1) out[n] += y / combs.length;
      }
    }
    for (const a0 of aps) {
      const a = Math.round((a0 + spread) * SR / 44100), buf = new Float32Array(a); let p = 0;
      for (let n = 0; n < N; n++) { const b = buf[p], x = out[n]; const y = -x + b; buf[p] = x + b * 0.5; out[n] = y; p = (p + 1) % a; }
    }
    return out;
  };
  const oL = run(inL, 0), oR = run(inR, 23);
  for (let n = 0; n < N; n++) { L[n] += oL[n] * mix; Rt[n] += oR[n] * mix; }
}
circularDelay(dlyL, dlyR, 0.375, 0.42, 1.0);
circularReverb(sendL, sendR, 0.3);

// ---------- master ----------
let hpL = 0, hpR = 0, pl = 0, pr = 0, peak = 0;
for (let n = 0; n < N; n++) { // gentle DC/rumble cut
  hpL = 0.9995 * (hpL + L[n] - pl); pl = L[n]; L[n] = hpL;
  hpR = 0.9995 * (hpR + Rt[n] - pr); pr = Rt[n]; Rt[n] = hpR;
}
for (let n = 0; n < N; n++) { L[n] = Math.tanh(L[n] * 1.1); Rt[n] = Math.tanh(Rt[n] * 1.1); peak = Math.max(peak, Math.abs(L[n]), Math.abs(Rt[n])); }
const g = 0.75 / peak;
const pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12);
pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22); pcm.writeUInt32LE(SR, 24);
pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4);
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rt[n] * g)) * 32767), 46 + n * 4);
}
const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'out');
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'soundtrack.wav'), pcm);
console.log('wrote out/soundtrack.wav', (N / SR).toFixed(2) + 's', 'peak gain', g.toFixed(2));
