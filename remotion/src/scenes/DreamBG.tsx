// DreamLabs-style backgrounds for Kal's vertical edits (1080×1920).
//  · DreamBG: seamless 10 s loop: cream → yellow, drifting dot grid, the site's pixel sunset panning in a rounded card,
//    blob mascots floating at the edges (the centre stays calm for the cut-out presenter)
//  · DreamCloudWipe: 1.2 s transition: a Dream Labs cloud puffs up to fill the screen, then opens to reveal (rendered with alpha)
import React from 'react';
import {AbsoluteFill, Img, interpolate, Loop, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FollowCard} from './FollowCard';
import {FollowSplit} from './FollowSplit';

const TAU = Math.PI * 2;
const useT = () => useCurrentFrame() / useVideoConfig().fps;

const Blob: React.FC<{x: number; y: number; s: number; color: string; kind: number; phase: number; eyes?: string}> = ({x, y, s, color, kind, phase, eyes = '#1a1a1a'}) => {
  const t = useT(), L = 10; // loop length
  const bob = Math.sin((t / L) * TAU * 2 + phase) * 16, sway = Math.sin((t / L) * TAU + phase) * 10, rot = Math.sin((t / L) * TAU * 2 + phase * 1.7) * 6;
  const blink = ((t + phase) % 3.33) < 0.12 ? 0.15 : 1;
  const body = kind === 0
    ? 'M -1.35 0 C -1.35 -0.5 -0.95 -0.85 -0.55 -0.85 C -0.4 -1.15 0.05 -1.2 0.3 -0.95 C 0.75 -1.1 1.15 -0.75 1.1 -0.4 C 1.45 -0.2 1.45 0.55 1.0 0.75 C 0.5 0.95 -0.6 0.95 -1.0 0.75 C -1.3 0.6 -1.35 0.3 -1.35 0 Z'
    : kind === 1
      ? 'M 0 -1 C 0.35 -1.25 0.85 -0.95 0.75 -0.55 C 1.2 -0.45 1.25 0.15 0.85 0.35 C 1.0 0.85 0.45 1.15 0.1 0.85 C -0.25 1.2 -0.85 0.95 -0.75 0.5 C -1.2 0.35 -1.2 -0.25 -0.8 -0.4 C -0.95 -0.9 -0.35 -1.25 0 -1 Z'
      : 'M 0 -1.15 C 0.3 -1.15 0.45 -0.9 0.38 -0.7 C 0.8 -0.55 0.85 0.1 0.8 0.45 C 0.7 0.95 -0.7 0.95 -0.8 0.45 C -0.85 0.1 -0.8 -0.55 -0.38 -0.7 C -0.45 -0.9 -0.3 -1.15 0 -1.15 Z';
  return (
    <svg style={{position: 'absolute', left: x - s * 1.6 + sway, top: y - s * 1.6 + bob, overflow: 'visible'}} width={s * 3.2} height={s * 3.2} viewBox="-1.6 -1.6 3.2 3.2">
      <g transform={`rotate(${rot})`} style={{filter: 'drop-shadow(0 0.08px 0.12px rgba(80,50,0,0.2))'}}>
        <path d={body} fill={color} />
        <ellipse cx={-0.28} cy={0} rx={0.15} ry={0.15 * blink} fill={eyes} /><ellipse cx={0.28} cy={0} rx={0.15} ry={0.15 * blink} fill={eyes} />
      </g>
    </svg>
  );
};

export const DreamBG: React.FC<{sideBlobsLow?: boolean}> = ({sideBlobsLow = false}) => {
  const t = useT(), L = 10, p = (t / L) * TAU;
  // the sunset art pans across and back once per loop (seamless)
  const SUN_W = 1780, SUN_H = 252, cardW = 1000, cardH = 470, sc = cardH / SUN_H, artW = SUN_W * sc;
  const panX = -((artW - cardW) / 2) * (1 + Math.sin(p));
  const glow = 0.5 + 0.5 * Math.sin(p);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFF3D4 0%, #FFF7E0 50%, #FDE7A0 100%)'}}>
      {/* drifting dot grid (moves one cell per loop → seamless) */}
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(150,110,30,0.14) 2.2px, transparent 2.6px)', backgroundSize: '34px 34px', backgroundPosition: `${(t / L) * 34}px ${(t / L) * 34 * 2}px`}} />
      {/* soft warm glow behind the presenter */}
      <AbsoluteFill style={{background: `radial-gradient(60% 40% at 50% 66%, rgba(255,190,110,${0.28 + 0.1 * glow}) 0%, rgba(255,190,110,0) 70%)`}} />
      {/* pixel sunset card */}
      <div style={{position: 'absolute', left: 40, top: 150, width: cardW, height: cardH, borderRadius: 44, overflow: 'hidden', boxShadow: '0 30px 60px rgba(120,60,20,0.25)', background: '#F8B98A'}}>
        <Img src={staticFile('dl_sunset_wide.png')} style={{position: 'absolute', left: panX, top: 0, width: artW, height: cardH, imageRendering: 'auto'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,230,190,0) 55%, rgba(255,214,150,0.5) 100%)'}} />
        {/* the Dream Labs logo + tagline, floating gently (2 bobs per loop → seamless) */}
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, transform: `translateY(${Math.sin(p * 2) * 6}px)`, filter: 'drop-shadow(0 0 18px rgba(255,240,215,0.75))'}}>
          <Img src={staticFile('dreamlabs_logo_black.png')} style={{width: 720}} />
          <div style={{fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 30, letterSpacing: '0.1em', color: '#111'}}>ROBOTICS WITHIN REACH</div>
        </div>
      </div>
      {/* blob mascots at the edges */}
      <Blob x={130} y={sideBlobsLow ? 1560 : 760} s={54} color="#7ED9A0" kind={1} phase={0} />
      <Blob x={960} y={sideBlobsLow ? 1460 : 720} s={46} color="#8EC5FF" kind={2} phase={1.3} />
      <Blob x={95} y={1330} s={58} color="#FFB070" kind={0} phase={2.4} eyes="#fff" />
      <Blob x={985} y={1240} s={40} color="#FF9AA8" kind={1} phase={3.1} />
      <Blob x={940} y={1700} s={52} color="#FFD43B" kind={2} phase={4.2} />
      <Blob x={150} y={1780} s={36} color="#C7A6FF" kind={1} phase={5.0} />
    </AbsoluteFill>
  );
};

/** Cloud wipe transition: puff in (0–0.55 s) → hold → open (0.65–1.2 s). Transparent background. */
export const DreamCloudWipe: React.FC = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), t = f / fps;
  const inS = spring({frame: f, fps, config: {damping: 14, stiffness: 110, mass: 0.8}});
  const out = interpolate(t, [0.65, 1.15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scale = interpolate(inS, [0, 1], [0.05, 15]);
  const hole = out * 2600;                                   // reveal: a growing round hole through the cloud fill
  const puffs = [[0, 0, 1], [-0.62, 0.18, 0.62], [0.6, 0.2, 0.66], [-0.28, -0.42, 0.6], [0.3, -0.5, 0.55]];
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <mask id="m"><rect width={1080} height={1920} fill="#fff" /><circle cx={540} cy={960} r={hole} fill="#000" /></mask>
        </defs>
        <g mask="url(#m)">
          <g transform={`translate(540 960) scale(${scale * 100}) rotate(${(1 - inS) * -20})`}>
            {puffs.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? '#FFF3D4' : '#FFE9B0'} />)}
            <rect x={-1.1} y={0.05} width={2.2} height={0.7} rx={0.35} fill="#FFF3D4" />
          </g>
          {/* the Dream Labs logo (cloud mark + wordmark) in the middle while covered */}
          {(() => {
            const o = interpolate(t, [0.28, 0.42, 0.66, 0.8], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            const pop = spring({frame: f - Math.round(0.28 * fps), fps, config: {damping: 11, stiffness: 180, mass: 0.6}});
            return (
              <g opacity={o} transform={`translate(540 960) scale(${0.8 + 0.2 * pop})`}>
                <image href={staticFile('dreamlabs_logo_black.png')} x={-380} y={-41} width={760} height={81} />
              </g>
            );
          })()}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** 20 s DreamLabs background with the 5 s follow pop-up halfway through (7.5–12.5 s). */
export const DreamBG20: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      <Loop durationInFrames={10 * fps}><DreamBG /></Loop>
      <Sequence from={Math.round(7.5 * fps)} durationInFrames={5 * fps}><FollowCard /></Sequence>
    </AbsoluteFill>
  );
};

/** 5 s clip: the DreamLabs poster (slow push-in) with the follow pop-up from 2.5 s, finishing by 5 s. */
export const PosterFollow: React.FC = () => {
  const f = useCurrentFrame(), {fps, durationInFrames} = useVideoConfig();
  const z = interpolate(f, [0, durationInFrames], [1, 1.06]);
  return (
    <AbsoluteFill style={{background: '#FFF3D4'}}>
      <Img src={staticFile('dreamlabs_poster.png')} style={{width: 1080, height: 1920, transform: `scale(${z})`, transformOrigin: '50% 40%'}} />
      <Sequence from={Math.round(2.5 * fps)} durationInFrames={Math.round(2.5 * fps)}><FollowCard top={250} cursorAt={0.45} click={1.0} exitAt={2.05} /></Sequence>
    </AbsoluteFill>
  );
};

/** 5 s moving DreamLabs background with the follow pop-up from 2.5 s, finishing by 5 s. */
export const DreamBG5Follow: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      <DreamBG />
      <Sequence from={Math.round(2.5 * fps)} durationInFrames={Math.round(2.5 * fps)}><FollowCard cursorAt={0.45} click={1.0} exitAt={2.05} /></Sequence>
    </AbsoluteFill>
  );
};

/** Version B: 5 s, follow profile on the left of the head and platform icons on the right, from 2.5 s. */
export const DreamBG5FollowSides: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      <DreamBG sideBlobsLow />
      <Sequence from={Math.round(2.5 * fps)} durationInFrames={Math.round(2.5 * fps)}><FollowSplit /></Sequence>
    </AbsoluteFill>
  );
};
