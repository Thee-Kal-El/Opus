// Follow pop-up, split layout: profile + Follow button on the LEFT of the presenter's head, platform icons on the RIGHT,
// both in the empty band between the Dream Labs card and the shoulders. Transparent; ~2.5 s.
import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sparks} from '../kit/motion';

const INK = '#151515';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Icon: React.FC<{kind: 'yt' | 'x' | 'ig'; size: number}> = ({kind, size}) => {
  const r = size * 0.26;
  if (kind === 'yt') return <svg width={size} height={size} viewBox="0 0 100 100"><rect width={100} height={100} rx={26} fill="#fff" /><rect x={14} y={27} width={72} height={46} rx={13} fill="#FF0033" /><path d="M43 39 L61 50 L43 61 Z" fill="#fff" /></svg>;
  if (kind === 'x') return <svg width={size} height={size} viewBox="0 0 100 100"><rect width={100} height={100} rx={26} fill="#111" /><path d="M28 26 H42 L74 74 H60 Z" fill="#fff" /><path d="M70 26 L53 45.5 L50 41.5 L64 26 Z M30 74 L47 54.5 L50 58.5 L36 74 Z" fill="#fff" /></svg>;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#FEDA75" /><stop offset="0.35" stopColor="#FA7E1E" /><stop offset="0.6" stopColor="#D62976" /><stop offset="1" stopColor="#4F5BD5" /></linearGradient></defs>
      <rect width={100} height={100} rx={26} fill="url(#igg)" /><rect x={24} y={24} width={52} height={52} rx={16} fill="none" stroke="#fff" strokeWidth={7} /><circle cx={50} cy={50} r={12} fill="none" stroke="#fff" strokeWidth={7} /><circle cx={66} cy={34} r={4} fill="#fff" />
    </svg>
  );
};

export const FollowSplit: React.FC<{cursorAt?: number; click?: number; exitAt?: number; top?: number}> = ({cursorAt = 0.45, click = 1.0, exitAt = 2.05, top = 690}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), t = f / fps;
  const sp = (at: number, damping = 13, stiffness = 170) => spring({frame: f - Math.round(at * fps), fps, config: {damping, stiffness, mass: 0.7}});
  const exit = interpolate(t, [exitAt, exitAt + 0.4], [0, 1], clamp);
  const L = sp(0), done = t >= click, press = interpolate(t, [click - 0.08, click, click + 0.14], [1, 0.9, 1], clamp), flip = sp(click, 10, 220);
  const cur = sp(cursorAt, 20, 140), cx = interpolate(cur, [0, 1], [-60, 250]), cy = interpolate(cur, [0, 1], [top + 520, top + 330]);
  const curOp = interpolate(t, [cursorAt - 0.05, cursorAt + 0.1, click + 0.6, click + 0.85], [0, 1, 1, 0], clamp);
  const ring = interpolate(t, [click, click + 0.55], [0, 1], clamp);
  const icons: ['yt' | 'x' | 'ig', string][] = [['yt', 'YouTube'], ['x', 'X'], ['ig', 'Instagram']];
  return (
    <AbsoluteFill>
      {/* LEFT: profile + Follow */}
      <div style={{position: 'absolute', left: 40, top, width: 330, transform: `translateX(${(1 - L) * -380 - exit * 380}px) rotate(${(1 - L) * -6}deg)`, opacity: 1 - exit}}>
        <div style={{background: '#FFFCF4', borderRadius: 36, padding: '28px 24px 30px', boxShadow: '0 24px 50px rgba(120,70,10,0.25)', border: '4px solid #fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
          <div style={{width: 132, height: 132, borderRadius: 66, overflow: 'hidden', border: '6px solid #fff', boxShadow: '0 8px 18px rgba(120,70,10,0.25)'}}><Img src={staticFile('kal_head.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} /></div>
          <div style={{fontFamily: 'Geist', fontWeight: 700, fontSize: 44, color: INK, letterSpacing: '-0.02em'}}>Thee_Kal_El</div>
          <div style={{fontFamily: 'JetBrains Mono', fontWeight: 500, fontSize: 24, color: '#8A8476', marginTop: -6}}>@thee_kal_el</div>
          <div style={{position: 'relative', marginTop: 8}}>
            <div style={{position: 'absolute', inset: -8, borderRadius: 999, border: '6px solid #FFB070', opacity: ring > 0 && ring < 1 ? 1 - ring : 0, transform: `scale(${1 + ring * 0.45})`}} />
            <div style={{transform: `scale(${press * (done ? 0.94 + 0.06 * flip : 1)})`, background: done ? '#2FB86B' : INK, color: '#fff', borderRadius: 999, padding: '16px 34px', fontFamily: 'Geist', fontWeight: 700, fontSize: 34, whiteSpace: 'nowrap', minWidth: 190, textAlign: 'center'}}>{done ? 'Following ✓' : 'Follow'}</div>
          </div>
        </div>
        <Sparks at={click} x={165} y={330} colors={['#FFB070', '#7ED9A0', '#8EC5FF', '#FF9AA8', '#FFD43B']} count={30} speed={650} seed="spl" />
      </div>
      {/* RIGHT: platform icons */}
      <div style={{position: 'absolute', right: 50, top: top + 10, display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'flex-end'}}>
        {icons.map(([k, label], i) => {
          const s = sp(0.15 + i * 0.12, 11, 200);
          return (
            <div key={k} style={{display: 'flex', alignItems: 'center', gap: 16, transform: `translateX(${(1 - s) * 360 + exit * 380}px) scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 1.5) * (1 - exit)}}>
              <div style={{fontFamily: 'Geist', fontWeight: 700, fontSize: 30, color: INK, background: '#FFFCF4', padding: '8px 18px', borderRadius: 999, boxShadow: '0 8px 18px rgba(120,70,10,0.18)'}}>{label}</div>
              <div style={{filter: 'drop-shadow(0 10px 18px rgba(120,70,10,0.3))'}}><Icon kind={k} size={112} /></div>
            </div>
          );
        })}
      </div>
      <svg width={70} height={70} viewBox="0 0 24 24" style={{position: 'absolute', left: cx, top: cy, opacity: curOp * (1 - exit), transform: `scale(${press})`, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.3))'}}>
        <path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.8 L11.6 14 L18 14 Z" fill="#fff" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
