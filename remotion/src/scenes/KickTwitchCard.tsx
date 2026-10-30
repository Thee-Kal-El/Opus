// Vertical "WATCH LIVE ON KICK & TWITCH!" end card, rebuilt on the motion kit (1080×1920, 6 s).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {WIDE, MONO} from '../fonts';
import {Flash, Float, Outro, Pop, Shake, SkewBar, SlamIn, Sparks, StaggerText, TypeOn} from '../kit/motion';

const KICK = '#53FC18', TWI = '#9146FF', TWI_L = '#A970FF';

const Tile: React.FC<{src: string; bg: string; ring: string; delay: number; phase: number}> = ({src, bg, ring, delay, phase}) => (
  <Pop delay={delay} spin={-12}>
    <Float amp={10} speed={0.5} phase={phase}>
      <div style={{width: 250, height: 250, borderRadius: 48, background: bg, border: `8px solid ${ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 20px 60px ${ring}55`}}>
        <Img src={staticFile(src)} style={{width: 150, height: 150, objectFit: 'contain'}} />
      </div>
    </Float>
  </Pop>
);

export const KickTwitchCard: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(120% 70% at 50% 60%, #1B1430 0%, #08070D 70%)'}}>
    <Outro at={5.55}>
      <Shake hits={[0.62]} amp={22}>
        <AbsoluteFill style={{top: 610}}>
          <SkewBar delay={0.55} width={1300} height={26} color={KICK} style={{position: 'absolute', left: -200, top: 0}} />
          <SkewBar delay={0.6} width={1300} height={26} color={TWI} origin="right" style={{position: 'absolute', left: 0, top: 560}} />
        </AbsoluteFill>
        <AbsoluteFill style={{alignItems: 'center', top: 700}}>
          <StaggerText text="WATCH LIVE ON" delay={0.08} stagger={0.03} cfg="snappy" style={{...WIDE, fontSize: 84, color: '#fff'}} />
          <SlamIn delay={0.62} style={{marginTop: 18}}>
            <div style={{...WIDE, fontSize: 100, fontStretch: '112%', lineHeight: 1, whiteSpace: 'nowrap', textShadow: '0 10px 40px rgba(0,0,0,0.6)'}}>
              <span style={{color: KICK}}>KICK </span><span style={{color: '#fff'}}>& </span><span style={{color: TWI_L}}>TWITCH!</span>
            </div>
          </SlamIn>
          <div style={{display: 'flex', gap: 90, marginTop: 120}}>
            <Tile src="kick_k.png" bg="#000" ring={KICK} delay={1.0} phase={0} />
            <Tile src="twitch_glitch.png" bg={TWI} ring="#C9A8FF" delay={1.14} phase={0.5} />
          </div>
          <div style={{marginTop: 90}}>
            <TypeOn text="@THEE_KAL_EL" delay={1.6} cps={20} style={{...MONO, fontSize: 52, color: '#fff'}} cursor={KICK} />
          </div>
        </AbsoluteFill>
        <Sparks at={0.62} x={540} y={930} colors={[KICK, TWI_L, '#fff']} count={40} seed="kt" />
      </Shake>
      <Flash hits={[0.62]} strength={0.55} />
    </Outro>
  </AbsoluteFill>
);
