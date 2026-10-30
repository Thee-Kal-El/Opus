// Contact sheet of every motion-kit primitive, each looping in its own tile (1920×1080).
import React from 'react';
import {AbsoluteFill, Loop, useVideoConfig} from 'remotion';
import {WIDE, MONO} from '../fonts';
import {CountUp, Float, Pop, SkewBar, SlamIn, SlideIn, Sparks, StaggerText, TypeOn, Wipe} from '../kit/motion';

const YL = '#FCEE09', CY = '#22D8F0', PK = '#FF1F5A';
const W = 580, H = 236;

const demos: [string, string, React.ReactNode][] = [
  ['SlamIn', 'hard spring drop-in', <SlamIn><div style={{...WIDE, fontSize: 64, color: YL}}>KILLED</div></SlamIn>],
  ['StaggerText', 'letters rise in, one by one', <StaggerText text="NIGHT CITY" style={{...WIDE, fontSize: 52, color: '#fff'}} />],
  ['Pop', 'scale-up with overshoot + spin', <Pop spin={-20}><div style={{width: 120, height: 120, borderRadius: 28, background: PK}} /></Pop>],
  ['Wipe', 'moving-edge reveal', <Wipe><div style={{...WIDE, fontSize: 56, color: CY}}>REVEAL</div></Wipe>],
  ['CountUp', 'spring number roll', <CountUp to={12500} suffix=" FOLLOWERS" style={{...WIDE, fontSize: 44, color: '#fff'}} />],
  ['SkewBar', 'brand bar shoots out', <SkewBar width={420} height={22} color={YL} />],
  ['TypeOn', 'typewriter + block cursor', <TypeOn text="JACK IN //" style={{...MONO, fontSize: 40, color: CY}} />],
  ['SlideIn', 'spring slide from offset', <SlideIn x={-300}><div style={{...WIDE, fontSize: 56, color: PK}}>INCOMING</div></SlideIn>],
  ['Sparks + Float', 'hit burst · idle bob', <><Sparks at={0.2} x={W / 2} y={H / 2} colors={[YL, PK, CY]} /><Float amp={10}><div style={{...WIDE, fontSize: 56, color: '#fff'}}>BOOM</div></Float></>],
];

export const KitShowcase: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#07080D', padding: '56px 60px', boxSizing: 'border-box'}}>
      <div style={{...WIDE, fontSize: 40, color: '#fff'}}>MOTION KIT <span style={{color: YL}}>//</span> REMOTION</div>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(3, ${W}px)`, gap: 26, marginTop: 28}}>
        {demos.map(([name, desc, node]) => (
          <div key={name} style={{width: W, height: H + 60}}>
            <div style={{position: 'relative', width: W, height: H, background: '#11131C', border: '2px solid #23263A', borderRadius: 14, overflow: 'hidden'}}>
              <Loop durationInFrames={Math.round(2.4 * fps)}>
                <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>{node}</AbsoluteFill>
              </Loop>
            </div>
            <div style={{...MONO, fontSize: 20, color: YL, marginTop: 12}}>{name} <span style={{color: '#7B8094', letterSpacing: '0.04em', textTransform: 'none', fontWeight: 400}}>· {desc}</span></div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
