// "THEE_KAL_EL" 4-second logo sting (1920×1080) — intro/outro bumper for videos and streams.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {WIDE, MONO} from '../fonts';
import {Flash, Outro, Shake, SkewBar, StaggerText, TypeOn} from '../kit/motion';

const YL = '#FCEE09', CY = '#22D8F0', PK = '#FF1F5A';

export const LogoSting: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(90% 90% at 50% 50%, #12162A 0%, #05060B 75%)'}}>
    <Outro at={3.55}>
      <Shake hits={[0.42]} amp={10}>
        <SkewBar delay={0} width={2400} height={10} color={PK} style={{position: 'absolute', left: -240, top: 360}} />
        <SkewBar delay={0.06} width={2400} height={6} color={CY} origin="right" style={{position: 'absolute', left: -240, top: 720}} />
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <StaggerText text="THEE_KAL_EL" delay={0.2} stagger={0.028} cfg="bouncy" style={{...WIDE, fontSize: 168, color: '#fff'}} />
          <SkewBar delay={0.65} width={980} height={16} color={YL} style={{marginTop: 18}} />
          <div style={{marginTop: 40}}>
            <TypeOn text="GAMING · BLOCKCHAIN · LIVE" delay={0.9} cps={34} style={{...MONO, fontSize: 34, color: CY}} />
          </div>
        </AbsoluteFill>
      </Shake>
      <Flash hits={[0.42]} strength={0.35} />
    </Outro>
  </AbsoluteFill>
);
