// Thee_Kal_El motion kit: spring-driven building blocks for every scene.
// Springs, not fixed easing, so things land with weight and settle naturally.
import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const SPRINGS = {
  snappy: {damping: 18, stiffness: 220, mass: 0.6}, // UI-fast, tiny settle
  bouncy: {damping: 9, stiffness: 160, mass: 0.7},  // playful overshoot
  smooth: {damping: 26, stiffness: 120, mass: 1},   // calm, no overshoot
  heavy: {damping: 14, stiffness: 90, mass: 1.6},   // big things with weight
  slam: {damping: 12, stiffness: 320, mass: 0.9},   // hard hit, quick wobble
} as const;
export type SpringName = keyof typeof SPRINGS;

/** 0 → 1 spring that starts `delay` seconds in. */
export const useSpring = (delay = 0, cfg: SpringName = 'snappy') => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - Math.round(delay * fps), fps, config: SPRINGS[cfg]});
};
const useT = () => { const frame = useCurrentFrame(); const {fps} = useVideoConfig(); return frame / fps; };
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Box = {delay?: number; style?: React.CSSProperties; children?: React.ReactNode};

/** Drops in from big to size with a hard spring (titles, "KILLED" text, logos). */
export const SlamIn: React.FC<Box & {from?: number}> = ({delay = 0, from = 1.8, style, children}) => {
  const s = useSpring(delay, 'slam'), t = useT();
  const op = interpolate(t, [delay, delay + 0.05], [0, 1], clamp);
  return <div style={{transform: `scale(${interpolate(s, [0, 1], [from, 1])})`, opacity: op, ...style}}>{children}</div>;
};

/** Scales up from nothing with overshoot (badges, icons, tiles). */
export const Pop: React.FC<Box & {cfg?: SpringName; spin?: number}> = ({delay = 0, cfg = 'bouncy', spin = 0, style, children}) => {
  const s = useSpring(delay, cfg);
  return <div style={{transform: `scale(${s}) rotate(${(1 - s) * spin}deg)`, ...style}}>{children}</div>;
};

/** Slides in from an offset (px) with a spring. */
export const SlideIn: React.FC<Box & {x?: number; y?: number; cfg?: SpringName}> = ({delay = 0, x = 0, y = 0, cfg = 'snappy', style, children}) => {
  const s = useSpring(delay, cfg);
  return <div style={{transform: `translate(${(1 - s) * x}px, ${(1 - s) * y}px)`, opacity: Math.min(1, s * 2), ...style}}>{children}</div>;
};

/** Letters spring in one after another, masked so they rise out of a line. */
export const StaggerText: React.FC<{text: string; delay?: number; stagger?: number; cfg?: SpringName; from?: 'up' | 'down'; style?: React.CSSProperties}> = ({text, delay = 0, stagger = 0.035, cfg = 'bouncy', from = 'up', style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dir = from === 'up' ? 1 : -1;
  return (
    <span style={{display: 'inline-flex', whiteSpace: 'pre', ...style}}>
      {[...text].map((ch, i) => {
        const s = spring({frame: frame - Math.round((delay + i * stagger) * fps), fps, config: SPRINGS[cfg]});
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingRight: '0.04em'}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - s) * dir * 105}%) rotate(${(1 - s) * dir * 8}deg)`}}>{ch}</span>
          </span>
        );
      })}
    </span>
  );
};

/** Reveals content with a moving edge (dir = where the reveal travels to). */
export const Wipe: React.FC<Box & {dir?: 'right' | 'left' | 'up' | 'down'; cfg?: SpringName}> = ({delay = 0, dir = 'right', cfg = 'smooth', style, children}) => {
  const p = (1 - useSpring(delay, cfg)) * 100;
  const inset = {right: `0 ${p}% 0 0`, left: `0 0 0 ${p}%`, up: `${p}% 0 0 0`, down: `0 0 ${p}% 0`}[dir];
  return <div style={{clipPath: `inset(${inset})`, ...style}}>{children}</div>;
};

/** Brand skewed bar that shoots out from one side. */
export const SkewBar: React.FC<{delay?: number; width: number; height: number; color: string; origin?: 'left' | 'right'; skew?: number; style?: React.CSSProperties}> = ({delay = 0, width, height, color, origin = 'left', skew = -20, style}) => {
  const s = useSpring(delay, 'snappy');
  return <div style={{width, height, background: color, transform: `skewX(${skew}deg) scaleX(${s})`, transformOrigin: origin, ...style}} />;
};

/** Typewriter with a blinking block cursor. */
export const TypeOn: React.FC<{text: string; delay?: number; cps?: number; style?: React.CSSProperties; cursor?: string}> = ({text, delay = 0, cps = 28, style, cursor = '#FCEE09'}) => {
  const t = useT();
  const n = Math.max(0, Math.min(text.length, Math.floor((t - delay) * cps)));
  const on = t < delay ? false : n < text.length || Math.floor(t * 2.5) % 2 === 0;
  return <span style={{whiteSpace: 'pre', ...style}}>{text.slice(0, n)}<span style={{display: 'inline-block', width: '0.6em', height: '1em', verticalAlign: '-0.12em', marginLeft: '0.08em', background: on ? cursor : 'transparent'}} /></span>;
};

/** Counts a number up with a spring (followers, kills, prices). */
export const CountUp: React.FC<{to: number; from?: number; delay?: number; prefix?: string; suffix?: string; style?: React.CSSProperties}> = ({to, from = 0, delay = 0, prefix = '', suffix = '', style}) => {
  const s = useSpring(delay, 'smooth');
  return <span style={{fontVariantNumeric: 'tabular-nums', ...style}}>{prefix}{Math.round(from + (to - from) * s).toLocaleString('en-US')}{suffix}</span>;
};

/** Camera shake that decays after each hit time (seconds). Wrap a whole scene. */
export const Shake: React.FC<{hits: number[]; amp?: number; children: React.ReactNode}> = ({hits, amp = 18, children}) => {
  const frame = useCurrentFrame();
  const t = useT();
  let x = 0, y = 0, r = 0;
  for (const h of hits) {
    const d = t - h;
    if (d >= 0 && d < 0.6) { const k = Math.exp(-d * 9) * amp; x += (random(`x${h}-${frame}`) - 0.5) * 2 * k; y += (random(`y${h}-${frame}`) - 0.5) * 2 * k; r += (random(`r${h}-${frame}`) - 0.5) * k * 0.06; }
  }
  return <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) rotate(${r}deg)`}}>{children}</AbsoluteFill>;
};

/** Quick light flash on hits. */
export const Flash: React.FC<{hits: number[]; color?: string; strength?: number}> = ({hits, color = '#FFFFFF', strength = 0.7}) => {
  const t = useT();
  const a = Math.max(0, ...hits.map((h) => (t >= h ? Math.exp(-(t - h) * 14) * strength : 0)));
  return <AbsoluteFill style={{background: color, opacity: a, pointerEvents: 'none'}} />;
};

/** Burst of sparks flying out from a point at time `at`, with gravity. */
export const Sparks: React.FC<{at: number; x: number; y: number; colors: string[]; count?: number; speed?: number; seed?: string}> = ({at, x, y, colors, count = 28, speed = 900, seed = 's'}) => {
  const t = useT() - at;
  if (t < 0 || t > 1.4) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: count}, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2, v = speed * (0.35 + random(`${seed}v${i}`) * 0.65), sz = 6 + random(`${seed}z${i}`) * 12;
        const px = x + Math.cos(a) * v * t, py = y + Math.sin(a) * v * t + 900 * t * t, life = Math.max(0, 1 - t / (0.7 + random(`${seed}l${i}`) * 0.7));
        return <div key={i} style={{position: 'absolute', left: px, top: py, width: sz, height: sz * 0.45, background: colors[i % colors.length], opacity: life, transform: `translate(-50%,-50%) rotate(${(a * 180) / Math.PI + t * 600}deg) skewX(-20deg)`}} />;
      })}
    </AbsoluteFill>
  );
};

/** Gentle idle bob so held frames never look frozen. */
export const Float: React.FC<Box & {amp?: number; speed?: number; phase?: number}> = ({amp = 8, speed = 0.6, phase = 0, style, children}) => {
  const t = useT();
  return <div style={{transform: `translateY(${Math.sin((t * speed + phase) * Math.PI * 2) * amp}px)`, ...style}}>{children}</div>;
};

/** Fades + shrinks everything out at the end (put around a scene). */
export const Outro: React.FC<{at: number; dur?: number; children: React.ReactNode}> = ({at, dur = 0.35, children}) => {
  const t = useT();
  const k = interpolate(t, [at, at + dur], [0, 1], clamp);
  return <AbsoluteFill style={{opacity: 1 - k, transform: `scale(${1 - 0.06 * k})`}}>{children}</AbsoluteFill>;
};
