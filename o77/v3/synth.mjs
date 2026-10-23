// Score for the OPEN//77 trailer v3 (40 s cut), rebuilt on the user's "Game Loop" reference: ~123 BPM, C phrygian,
// sustained gliding 808 (C → C# → F), glide synth lead, dark pads, half-time → full drops, glitch stutters, metal hits; no bells.
//   node o77/v3/synth.mjs  ->  out/o77_trailer_v3_score.wav
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000, S = 1, DUR = 40, N = SR * DUR, TAU = Math.PI * 2, BT = 0.5;
const L = new Float32Array(N), Rr = new Float32Array(N), revL = new Float32Array(N), revR = new Float32Array(N), dlyL = new Float32Array(N), dlyR = new Float32Array(N);
let seed = 2077;
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

// cinematic SFX — soft, low, never "UI-cute"
function dtick(t0, g = 1, f = 1400) { let lp = 0; for (let n = 0; n < 0.05 * SR; n++) { const t = n / SR, x = Math.sin(TAU * f * t) * Math.exp(-t * 90) + noise() * 0.3 * Math.exp(-t * 300); lp += 0.35 * (x - lp); const v = lp * g * 0.07; put(at(t0) + n, v, v, 0.25, 0.15); } }
function impact(t0, g = 1) { boom(t0, 0.9 * g); air(t0 - 0.9, 1.0, 0.7 * g); let lp = 0; for (let n = 0; n < 2.5 * SR; n++) { const t = n / SR; lp += 0.01 * (noise() - lp); const v = lp * Math.exp(-t * 1.6) * g * 1.2; put(at(t0) + n, v, v, 0.6); } }
function swell(t0, dur, chord, g = 1) { drone(t0, dur, chord, g, 0.02); }

// ---------------- the score, rebuilt on the "Game Loop" reference (measured with earshot + librosa) ----------------
// reference: ~123 BPM, C phrygian, long held distorted 808 cycling C → C# → F with glides, a sustained glide lead around
// G4–G#4–A#4–C5, warm mids, very dark top, ~4 hits/s; quiet melodic build → bass enters → hit → huge low drop.
const Q = 60 / 123, BAR = 4 * Q;
const PROG = [36, 37, 41, 41];                                         // C | C# | F | F  (808 roots, octave 2)
// sustained 808: one continuous voice, retriggered punches, glides between notes, saturated so its harmonics fill the mids
function sus808(ev, end, g = 1, drive = 2.4) {        // ev: [time, midi, punch(0/1)]
  let ph = 0, k = 0, f = mtof(ev[0][1]), env = 0, tp = ev[0][0];
  for (let n = at(ev[0][0]); n < at(end) + 0.03 * SR && n < N; n++) {
    const t = n / SR; while (k + 1 < ev.length && t >= ev[k + 1][0]) { k++; if (ev[k][2]) { env = 1; tp = t; } }
    if (k === 0 && t - ev[0][0] < 1 / SR + 1e-9) { env = 1; tp = t; }
    const ft = mtof(ev[k][1]); f += (ft - f) * Math.min(1, 1 / (0.06 * SR)) * 1;        // ~60 ms glide
    const d = t - tp; const fp = f * (1 + 0.9 * Math.exp(-d * 55)); ph += TAU * fp / SR;
    const amp = (0.62 + 0.38 * Math.exp(-d * 2.2)) * Math.min(1, d / 0.004 + (d > 0.004 ? 1 : 0)) * Math.min(1, (end + 0.03 - t) / 0.03);
    const x = Math.sin(ph) + 0.25 * Math.sin(ph * 2);
    const v = (Math.tanh(x * drive) * 0.62 + Math.sin(ph) * 0.5) * amp * g * 0.34; put(n, v, v); }
}
// glide lead: detuned saws + sub, dark 2-pole filter, legato portamento, late vibrato, ducked by the kick
function lead(ev, end, g = 1, cutHz = 1800, oct = 0, p = 0) {     // ev: [time, midi]
  const ph = [0, 0.33, 0.66, 0.1], det = [-0.09, 0, 0.09]; let k = 0, m = ev[0][1] + oct, lp = 0, lp2 = 0, held = 0, f0 = 0;
  const c = 1 - Math.exp(-TAU * cutHz / SR), t0 = ev[0][0], [pa, pb] = pan(p);
  for (let n = at(t0); n < at(end) && n < N; n++) {
    const t = n / SR; while (k + 1 < ev.length && t >= ev[k + 1][0]) { k++; held = t; }
    if (n === at(t0)) held = t;
    m += (ev[k][1] + oct - m) * (1 / (0.08 * SR)) * 3;
    const vib = 0.14 * Math.sin(TAU * 5.2 * t) * Math.min(1, Math.max(0, (t - held - 0.35) / 0.4));
    let sl = 0, sr = 0;
    for (let i = 0; i < 3; i++) { ph[i] = (ph[i] + mtof(m + vib + det[i]) / SR) % 1; const v = 2 * ph[i] - 1; if (i === 0) sl += v; else if (i === 2) sr += v; else { sl += 0.6 * v; sr += 0.6 * v; } }
    ph[3] = (ph[3] + mtof(m - 12) / SR) % 1; const sub = (ph[3] < 0.5 ? 1 : -1) * 0.35;
    const x = (sl + sr) * 0.5 + sub; lp += c * (x - lp); lp2 += c * (lp - lp2);
    const env = Math.min(1, (t - t0) / 0.06) * Math.min(1, (end - t) / 0.25);
    const y = Math.tanh(lp2 * 1.8) * env * g * 0.3 * (0.55 + 0.45 * duck(t)); const w = (sl - sr) * 0.04 * env * g * (0.55 + 0.45 * duck(t));
    put(n, (y + w) * pa, (y - w) * pb, 0.38, 0.22); }
}
function metal(t0, g = 1, f = 220) { for (let n = 0; n < 1.2 * SR; n++) { const t = n / SR, mm = Math.sin(TAU * f * 2.71 * t) * 4 * Math.exp(-t * 4), v = Math.sin(TAU * f * t + mm) * Math.exp(-t * 5) * g * 0.1; put(at(t0) + n, v, v * 0.9, 0.5); } }
function stutter(t0, dur, g = 1) { let k = 0; for (let t = t0; t < t0 + dur; k++) { const step = Q / 4 * Math.pow(0.82, k), f = 70 + (k % 4) * 30; for (let n = 0; n < step * 0.6 * SR; n++) { const tt = n / SR, v = (Math.tanh(Math.sin(TAU * f * tt) * 4) * 0.6 + noise() * 0.25) * g * 0.13 * (1 - tt / (step * 0.6)); put(at(t) + n, v, v, 0.1); } t += Math.max(0.03, step); } }
function subdrop(t0, g = 1) { let ph = 0; for (let n = 0; n < 1.8 * SR; n++) { const t = n / SR; ph += TAU * (85 * Math.exp(-t * 1.6) + 30) / SR; const v = Math.tanh(Math.sin(ph) * 1.6) * Math.exp(-t * 1.3) * g * 0.55; put(at(t0) + n, v, v); } }
function dhat(t0, g, p = 0) { let lp = 0, hp = 0, prev = 0; const [a, b] = pan(p); for (let n = 0; n < 0.05 * SR; n++) { const x = noise(); lp += 0.45 * (x - lp); hp = 0.9 * (hp + lp - prev); prev = lp; const v = hp * Math.exp(-n / SR * 80) * g; put(at(t0) + n, v * a, v * b, 0.08); } }

// melody (beats within a 4-bar phrase) — phrase A from the reference, phrase B the higher answer
const MEL_A = [[0, 67], [4, 68], [6, 70], [8, 72], [10, 67], [14, 68], [15, 67]];
const MEL_B = [[0, 72], [4, 73], [6, 75], [8, 72], [10, 70], [12, 68], [14, 67]];
const melody = (t0, t1, phr) => { const ev = []; for (let b0 = t0, i = 0; b0 < t1 - 0.05; b0 += 4 * BAR, i++) (Array.isArray(phr[0][0]) ? phr[i % phr.length] : phr).forEach(([bt, m]) => { const t = b0 + bt * Q; if (t < t1 - 0.1) ev.push([t, m]); }); return ev; };
// 808 lines: held roots (build) · drop rhythm (punch on 1 and the "and" of 3) · rolling variation with octave jumps
function line808(t0, t1, oct, style) { const ev = []; for (let b = t0, i = 0; b < t1 - 0.05; b += BAR, i++) { const r = PROG[i % 4] + oct, nx = PROG[(i + 1) % 4] + oct;
    const hits = style === 'hold' ? [[0, r, 1]] : style === 'drop' ? [[0, r, 1], [2.5, r, 1], [3.5, nx, 0]] : [[0, r, 1], [1.5, r + 12, 1], [2, r, 1], [2.75, r, 1], [3.5, i % 2 ? r + 7 : nx, 1]];
    hits.forEach(([bt, m, pu]) => { const t = b + bt * Q; if (t < t1 - 0.05) ev.push([t, m, pu]); }); } return ev; }
function drums(t0, t1, style, g = 1) { const ok = (t) => t < t1 - 0.04;
  for (let b = t0, i = 0; b < t1 - 0.05; b += BAR, i++) {
    const kicks = style === 'build' ? [0, 2.5] : style === 'drop' ? [0, 1.75, 2.5] : [0, 0.75, 1.75, 2.5, 3.25];
    kicks.forEach((k) => ok(b + k * Q) && kick(b + k * Q, 1.05 * g));
    (style === 'build' ? [2] : [1, 3]).forEach((c) => ok(b + c * Q) && clap(b + c * Q, 0.9 * g));
    for (let s = 0; s < 8; s++) ok(b + s * Q / 2) && dhat(b + s * Q / 2, (s % 2 ? 0.05 : 0.09) * g, s % 2 ? 0.3 : -0.3);
    if (style !== 'build' && i % 2 === 1) for (let r = 0; r < 6; r++) ok(b + 3 * Q + r * Q / 6) && dhat(b + 3 * Q + r * Q / 6, (0.04 + r * 0.012) * g, 0.2);
    if (i % 4 === 3 && style !== 'build' && ok(b + 3.25 * Q)) stutter(b + 3.25 * Q, 0.7 * Q, 0.8 * g); } }
const pads = (t0, t1, g) => { for (let b = t0, i = 0; b < t1 - 0.05; b += BAR, i++) { const r = PROG[i % 4] + 12; drone(b, Math.min(BAR, t1 - b), [r, r + 7, r + 15], g * 1.4, 0.035); } };

// cuts (40 s film): 2.67 · 5.33 · 8 · 9.67 · 11.33 · 13 silence · 13.33 DROP · 17.33 · 21.33 · 25.33 · 29.33 · 34 silence · 34.67 end
// 0–2.67  intro: the lead alone, filtered, over a dark pad, rising
lead([[0.1, 67], [1.3, 68]], 2.62, 0.5, 900); drone(0, 2.62, [48, 55, 60], 0.5, 0.012); riser(0.9, 1.75, 0.9); air(0.6, 2.0, 0.8); stutter(2.25, 0.4, 0.6);
// 2.67–13  build: bass enters (808 an octave up, held, gliding), half-time drums, lead phrase A
impact(2.67, 0.8); boom(2.67, 0.6);
sus808(line808(2.67, 12.95, 12, 'hold'), 12.95, 0.45, 2.0); drums(2.67, 12.95, 'build', 0.55); lead(melody(2.67, 12.95, MEL_A), 12.95, 0.6, 1700); pads(2.67, 12.95, 0.4);
[5.33, 8, 9.67, 11.33].forEach((t) => whoosh(t - 0.3, 0.3, 0.5)); riser(11.3, 1.65, 1.1); stutter(12.45, 0.5, 0.9);
// 13 silence → 13.33 DROP: 808 drops an octave, full drums, lead opens up and doubles
impact(13.33, 1.6); subdrop(13.33, 1.0); shatter(13.33, 0.25);
sus808(line808(13.33, 21.3, 0, 'drop'), 21.3, 1.15, 2.8); drums(13.33, 21.3, 'drop', 1.05); lead(melody(13.33, 21.3, MEL_A), 21.3, 0.95, 2400); lead(melody(13.33, 21.3, MEL_A), 21.3, 0.35, 1400, -12, 0.2); pads(13.33, 21.3, 0.55);
metal(17.33, 0.8, 150); whoosh(17.03, 0.3, 0.6);
// 21.33–29.33  DROP 2 switch-up: rolling 808 with octave jumps, busier kicks, the higher answer phrase B
impact(21.33, 1.1); sus808(line808(21.33, 29.3, 0, 'roll'), 29.3, 1.15, 3.0); drums(21.33, 29.3, 'roll', 1.05);
lead(melody(21.33, 29.3, [MEL_B, MEL_A]), 29.3, 0.95, 2600); lead(melody(21.33, 29.3, [MEL_B, MEL_A]), 29.3, 0.3, 1400, -12, -0.2); pads(21.33, 29.3, 0.55); metal(25.33, 0.8, 260); whoosh(25.03, 0.3, 0.6);
// 29.33–34  breakdown: drums out, held 808 + lead + pad, then riser and clap roll into the silence
impact(29.33, 0.7); sus808(line808(29.33, 33.95, 12, 'hold'), 33.95, 0.6, 1.8); lead(melody(29.33, 33.95, MEL_B), 33.95, 0.85, 1200); pads(29.33, 33.95, 0.75);
riser(32.0, 1.95, 1.3); for (let i = 0; i < 16; i++) clap(32.0 + i * 0.12 * Math.pow(0.97, i), 0.2 + i * 0.045); stutter(33.5, 0.45, 1.0);
// 34 silence → 34.67 FINAL DROP, then the 808 dives and the lead rings out
impact(34.67, 1.7); subdrop(34.67, 1.1); shatter(34.67, 0.25);
sus808(line808(34.67, 38.3, 0, 'drop'), 38.3, 1.2, 3.0); drums(34.67, 38.3, 'drop', 1.1); lead(melody(34.67, 39.6, MEL_A), 39.6, 0.95, 2600); lead(melody(34.67, 38.3, MEL_A), 38.3, 0.35, 1400, -12, 0.2); pads(34.67, 38.3, 0.55);
sus808([[38.36, 36, 1], [38.9, 24, 0]], 39.7, 1.1, 2.6); metal(38.36, 0.9, 130);
// ---------------- FX + master ----------------
function delay(time, fb, mix) { const d = Math.round(time * SR), bL = new Float32Array(N), bR = new Float32Array(N); for (let n = 0; n < N; n++) { bL[n] = dlyL[n] + (n >= d ? bR[n - d] * fb : 0); bR[n] = n >= d ? bL[n - d] * fb : 0; } for (let n = 0; n < N; n++) { L[n] += (bL[n] - dlyL[n]) * mix; Rr[n] += bR[n] * mix; } }
function reverb(mix) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356], aps = [225, 556, 441];
  const run = (inp, sp) => { const o = new Float32Array(N); for (const c0 of combs) { const c = Math.round((c0 + sp) * SR / 44100 * 1.7), buf = new Float32Array(c); let p = 0, lp = 0; for (let n = 0; n < N; n++) { const y = buf[p]; lp = y * 0.55 + lp * 0.45; buf[p] = inp[n] + lp * 0.85; p = (p + 1) % c; o[n] += y / combs.length; } } for (const a0 of aps) { const a = Math.round((a0 + sp) * SR / 44100), buf = new Float32Array(a); let p = 0; for (let n = 0; n < N; n++) { const b = buf[p], x = o[n]; buf[p] = x + b * 0.5; o[n] = -x + b; p = (p + 1) % a; } } return o; };
  const oL = run(revL, 0), oR = run(revR, 23); for (let n = 0; n < N; n++) { L[n] += oL[n] * mix; Rr[n] += oR[n] * mix; }
}
delay(Q * 0.75, 0.3, 0.35); reverb(0.28);
let dkL = 0, dkR = 0, lpL = 0, lpR = 0, hL = 0, hR = 0, pL = 0, pR = 0, peak = 0;
for (let n = 0; n < N; n++) {
  const t = n / SR, lofi = t < 2.67 ? 0.25 + 0.75 * Math.pow(t / 2.67, 2) : 1;
  lpL += lofi * (L[n] - lpL); lpR += lofi * (Rr[n] - lpR);
  dkL += 0.55 * (lpL - dkL); dkR += 0.55 * (lpR - dkR);
  hL = 0.9995 * (hL + dkL - pL); pL = dkL; hR = 0.9995 * (hR + dkR - pR); pR = dkR;
  const fade = Math.min(1, (N - n) / (0.4 * SR));
  L[n] = Math.tanh(hL * 1.15) * fade; Rr[n] = Math.tanh(hR * 1.15) * fade; peak = Math.max(peak, Math.abs(L[n]), Math.abs(Rr[n]));
}
const g = 0.8 / peak, pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) { pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4); pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rr[n] * g)) * 32767), 46 + n * 4); }
const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'out'); mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'o77_trailer_v3_score.wav'), pcm);
console.log(`wrote out/o77_trailer_v3_score.wav  ${DUR}s, 123 BPM, ${KICKS.length} kicks`);
