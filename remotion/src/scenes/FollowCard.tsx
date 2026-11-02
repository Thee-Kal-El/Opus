// 5 s "follow" pop-up in the DreamLabs look (transparent): a profile card springs in, a cursor clicks Follow → Following ✓,
// little blobs + sparks burst, then the card slides away. Used inside DreamBG20 (7.5–12.5 s) and exported on its own.
import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sparks} from '../kit/motion';

const INK = '#151515', CLICK = 2.2;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const FollowCard: React.FC<{top?: number}> = ({top = 210}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), t = f / fps;
  const sp = (at: number, damping = 14, stiffness = 170) => spring({frame: f - Math.round(at * fps), fps, config: {damping, stiffness, mass: 0.7}});
  const enter = sp(0, 13, 140), exit = interpolate(t, [4.55, 4.95], [0, 1], clamp);
  const done = t >= CLICK, press = interpolate(t, [CLICK - 0.08, CLICK, CLICK + 0.14], [1, 0.9, 1], clamp), flip = sp(CLICK, 10, 220);
  const cur = sp(1.15, 20, 110);                                        // cursor glide
  const cx = interpolate(cur, [0, 1], [1080, 742]), cy = interpolate(cur, [0, 1], [top + 520, top + 268]);
  const curOp = interpolate(t, [1.1, 1.25, 3.2, 3.5], [0, 1, 1, 0], clamp);
  const ring = interpolate(t, [CLICK, CLICK + 0.55], [0, 1], clamp);
  const plat = (label: string, bg: string, fg: string, i: number) => {
    const k = sp(0.45 + i * 0.1, 11, 200);
    return <div key={label} style={{transform: `scale(${k})`, background: bg, color: fg, borderRadius: 999, padding: '10px 22px', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 24, letterSpacing: '0.04em'}}>{label}</div>;
  };
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 70, top, width: 940, transform: `translateY(${(1 - enter) * -260 + exit * -320}px) scale(${0.9 + 0.1 * enter}) rotate(${(1 - enter) * -4}deg)`, opacity: Math.min(1, enter * 2) * (1 - exit)}}>
        <div style={{background: '#FFFCF4', borderRadius: 44, padding: '38px 42px', boxShadow: '0 30px 70px rgba(120,70,10,0.28)', border: '4px solid #fff'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
            <div style={{width: 168, height: 168, borderRadius: 84, overflow: 'hidden', background: 'linear-gradient(160deg,#FFD9A8,#FFB070)', border: '6px solid #fff', boxShadow: '0 8px 20px rgba(120,70,10,0.25)', flexShrink: 0}}>
              <Img src={staticFile('kal_head.png')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%'}} />
            </div>
            <div style={{flex: 1}}>
              <div style={{fontFamily: 'Geist', fontWeight: 700, fontSize: 60, color: INK, letterSpacing: '-0.02em', lineHeight: 1.05}}>Thee_Kal_El</div>
              <div style={{fontFamily: 'JetBrains Mono', fontWeight: 500, fontSize: 28, color: '#8A8476', marginTop: 8}}>@thee_kal_el</div>
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 30}}>
            <div style={{display: 'flex', gap: 12}}>{plat('YOUTUBE', '#FF3B30', '#fff', 0)}{plat('KICK', '#111', '#53FC18', 1)}{plat('TWITCH', '#9146FF', '#fff', 2)}</div>
            <div style={{position: 'relative'}}>
              <div style={{position: 'absolute', inset: -8, borderRadius: 999, border: '6px solid #FFB070', opacity: ring > 0 && ring < 1 ? 1 - ring : 0, transform: `scale(${1 + ring * 0.45})`}} />
              <div style={{transform: `scale(${press * (done ? 0.94 + 0.06 * flip : 1)})`, background: done ? '#2FB86B' : INK, color: '#fff', borderRadius: 999, padding: '20px 40px', fontFamily: 'Geist', fontWeight: 700, fontSize: 38, minWidth: 210, textAlign: 'center', whiteSpace: 'nowrap'}}>
                {done ? 'Following ✓' : 'Follow'}
              </div>
            </div>
          </div>
        </div>
        <Sparks at={CLICK} x={760} y={290} colors={['#FFB070', '#7ED9A0', '#8EC5FF', '#FF9AA8', '#FFD43B']} count={36} speed={760} seed="fol" />
      </div>
      {/* cursor */}
      <svg width={70} height={70} viewBox="0 0 24 24" style={{position: 'absolute', left: cx, top: cy, opacity: curOp * (1 - exit), transform: `scale(${press})`, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.3))'}}>
        <path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.8 L11.6 14 L18 14 Z" fill="#fff" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
