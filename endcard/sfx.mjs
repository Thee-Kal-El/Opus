// End-card SFX (mono 44.1k WAV, local time 0 = card start): impact hits on the two text slams, bubbly pops on the logo tiles,
// soft typing ticks on the handle.  node endcard/sfx.mjs out.wav
import { writeFileSync } from 'node:fs';
const SR = 44100, LEN = 5.5, N = Math.round(SR * LEN), b = new Float32Array(N), TAU = Math.PI * 2; let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const add = (t0, dur, f) => { const s = Math.round(t0 * SR); for (let n = 0; n < dur * SR && s + n < N; n++) b[s + n] += f(n / SR); };
const hit = (t0, g) => { let ph = 0; add(t0, 0.6, (t) => { ph += TAU * (45 + 140 * Math.exp(-t * 25)) / SR; return (Math.tanh(Math.sin(ph) * 3) * Math.exp(-t * 7) + rnd() * Math.exp(-t * 30) * 0.5) * g; }); };
const whoosh = (t0, d, g) => { let lp = 0; add(t0, d, (t) => { const k = t / d; lp += (0.02 + 0.25 * k) * (rnd() - lp); return lp * Math.sin(Math.PI * k) * g * 2; }); };
const pop = (t0, f0, g) => add(t0, 0.25, (t) => Math.sin(TAU * f0 * (1 + 2.5 * Math.exp(-t * 40)) * t) * Math.exp(-t * 18) * g);
const tick = (t0, g) => add(t0, 0.03, (t) => (rnd() * 0.6 + Math.sin(TAU * 2400 * t)) * Math.exp(-t * 250) * g);
whoosh(0.0, 0.18, 0.5); hit(0.15, 0.9); whoosh(0.3, 0.18, 0.5); hit(0.45, 1.0);
pop(0.85, 520, 0.7); pop(1.0, 660, 0.7); for (let i = 0; i < 11; i++) tick(1.3 + i * 0.055, 0.35);
let pk = 0; for (const v of b) pk = Math.max(pk, Math.abs(v)); const g = 0.9 / pk, pcm = Buffer.alloc(44 + N * 2);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 2, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(N * 2, 40);
for (let n = 0; n < N; n++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, b[n] * g)) * 32767), 44 + n * 2);
writeFileSync(process.argv[2], pcm);
