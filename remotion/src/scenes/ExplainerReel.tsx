// Character explainer reel (1080×1920): Kal's cartoon host + word-by-word captions with italic-serif accents + animated props.
// Story: "I built my own Cyberpunk server, and Claude made the banner. In ten minutes."
import React from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MONO, SANS, SERIF, WIDE} from '../fonts';
import {KalAvatar} from '../character/KalAvatar';
import {Pop, SPRINGS, TypeOn, Wipe} from '../kit/motion';

const PAPER = '#F3EFE6', INK = '#1B1B1F', ACCENT = '#C2502E', MUTED = '#9A958A', YL = '#F3DF00';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Word = {w: string; at: number; accent?: boolean; br?: boolean};
const BEATS: {from: number; to: number; tag: string; words: Word[]}[] = [
  {from: 0, to: 4.3, tag: '01 · the setup', words: [{w: 'I', at: 0.25}, {w: 'built', at: 0.4}, {w: 'my', at: 0.58}, {w: 'own', at: 0.75, accent: true}, {w: 'Cyberpunk', at: 1.05, br: true}, {w: 'server,', at: 1.45}]},
  {from: 4.3, to: 9.0, tag: '02 · the trick', words: [{w: 'and', at: 4.5}, {w: 'Claude', at: 4.7, accent: true}, {w: 'made', at: 5.05, br: true}, {w: 'the', at: 5.25}, {w: 'banner.', at: 5.45, accent: true}]},
  {from: 9.0, to: 14.0, tag: '03 · the result', words: [{w: 'In', at: 9.2}, {w: 'ten', at: 9.4, accent: true}, {w: 'minutes.', at: 9.65, accent: true}]},
];
const TALK: [number, number][] = [[0.2, 2.1], [4.45, 6.2], [9.15, 10.6], [12.2, 13.3]];

const useT = () => useCurrentFrame() / useVideoConfig().fps;
const sp = (t: number, at: number, fps: number, cfg: keyof typeof SPRINGS = 'snappy') => spring({frame: Math.round((t - at) * fps), fps, config: SPRINGS[cfg]});

const Caption: React.FC<{words: Word[]}> = ({words}) => {
  const t = useT(), {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 22, maxWidth: 900}}>
      {words.map((w, i) => {
        const s = sp(t, w.at, fps, 'bouncy');
        const st = w.accent ? {...SERIF, fontSize: 104, color: ACCENT} : {...SANS, fontSize: 86, color: INK};
        return (
          <React.Fragment key={i}>
            {w.br && <div style={{flexBasis: '100%', height: 0}} />}
            <span style={{...st, display: 'inline-block', lineHeight: 1.12, opacity: Math.min(1, s * 1.6), transform: `translateY(${(1 - s) * 40}px)`}}>{w.w}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Launcher-style server card using the real Militech banner
const ServerCard: React.FC = () => (
  <div style={{width: 760, borderRadius: 22, overflow: 'hidden', background: '#0D0F14', boxShadow: '0 40px 80px rgba(40,30,10,0.28)', transform: 'rotate(-2deg)'}}>
    <Img src={staticFile('militech_banner_1200x400.jpg')} style={{width: 760, display: 'block'}} />
    <div style={{padding: '26px 30px 30px', display: 'flex', alignItems: 'center', gap: 22}}>
      <Img src={staticFile('militech_icon_256.png')} style={{width: 96, height: 96, borderRadius: 12}} />
      <div style={{flex: 1}}>
        <div style={{...MONO, fontSize: 20, color: '#0D0F14', background: YL, display: 'inline-block', padding: '4px 12px'}}>ROLEPLAY</div>
        <div style={{...WIDE, fontSize: 46, color: '#fff', marginTop: 8}}>MILITECH</div>
      </div>
      <div style={{...WIDE, fontSize: 30, color: '#0D0F14', background: YL, padding: '18px 28px', transform: 'skewX(-12deg)'}}>CONNECT</div>
    </div>
  </div>
);

const Terminal: React.FC = () => (
  <div style={{width: 860, borderRadius: 20, background: '#17181D', boxShadow: '0 40px 80px rgba(40,30,10,0.28)', overflow: 'hidden'}}>
    <div style={{display: 'flex', gap: 12, padding: '20px 24px', background: '#202229'}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />)}
      <div style={{...MONO, fontSize: 18, color: '#7D8190', marginLeft: 16, letterSpacing: '0.04em', textTransform: 'none'}}>claude — open77</div>
    </div>
    <div style={{padding: '28px 32px 34px'}}>
      <TypeOn text="> make me a militech banner + icon" delay={4.75 - 4.3} cps={24} cursor={ACCENT} style={{...MONO, fontSize: 30, color: '#EDEAE2', letterSpacing: '0.01em', textTransform: 'none', fontWeight: 500}} />
      <Wipe delay={6.6 - 4.3} dir="down" cfg="smooth" style={{marginTop: 28}}>
        <Img src={staticFile('militech_banner_1200x400.jpg')} style={{width: 796, display: 'block', borderRadius: 10}} />
      </Wipe>
    </div>
  </div>
);

const Checklist: React.FC = () => {
  const items = ['banner · 1200×400', 'icon · 256×256', 'under the 378 KiB limit'];
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'flex-start'}}>
      <Pop delay={10.0 - 9.0} spin={-10}><Img src={staticFile('militech_icon_256.png')} style={{width: 220, height: 220, borderRadius: 26, boxShadow: '0 30px 60px rgba(40,30,10,0.25)'}} /></Pop>
      {items.map((it, i) => (
        <Pop key={it} delay={10.5 - 9.0 + i * 0.35} cfg="snappy" style={{transformOrigin: 'left center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 18, padding: '18px 28px', boxShadow: '0 12px 30px rgba(40,30,10,0.12)'}}>
            <div style={{width: 46, height: 46, borderRadius: 23, background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...SANS, fontSize: 30}}>✓</div>
            <div style={{...SANS, fontSize: 40, color: INK, fontWeight: 500}}>{it}</div>
          </div>
        </Pop>
      ))}
    </div>
  );
};

// a prop enters with a spring, and leaves quickly just before its beat ends
const PropSlot: React.FC<{len: number; children: React.ReactNode}> = ({len, children}) => {
  const t = useT(), {fps} = useVideoConfig();
  const s = sp(t, 0.15, fps, 'heavy');
  const out = interpolate(t, [len - 0.28, len], [0, 1], clamp);
  return <AbsoluteFill style={{alignItems: 'center', top: 640, opacity: 1 - out, transform: `translateY(${(1 - s) * 260 + out * -60}px) scale(${0.85 + 0.15 * s})`}}>{children}</AbsoluteFill>;
};

export const ExplainerReel: React.FC = () => {
  const t = useT(), {fps} = useVideoConfig();
  const beat = BEATS.find((b) => t >= b.from && t < b.to) ?? BEATS[BEATS.length - 1];
  // host animation
  const talking = TALK.some(([a, b]) => t >= a && t <= b);
  const mouth = talking ? 0.25 + 0.75 * Math.abs(Math.sin(t * 13.5)) * (0.6 + 0.4 * Math.abs(Math.sin(t * 5.1))) : 0;
  const bt = t % 3.2, blink = bt > 3.05 ? Math.sin(((bt - 3.05) / 0.15) * Math.PI) : 0;
  const ARM: [number, number][] = [[1.3, 14], [3.6, 172], [7.0, 26], [8.5, 172], [9.4, 6]];
  let arm = 172, prev = 172;
  for (const [at, to] of ARM) { arm += (to - prev) * sp(t, at, fps, 'bouncy'); prev = to; }
  const brow = 0.9 * sp(t, 6.75, fps, 'bouncy') * (1 - sp(t, 8.2, fps, 'smooth')) + 0.5 * sp(t, 9.3, fps, 'bouncy');
  const tilt = Math.sin(t * 1.7) * 2.5 + (talking ? Math.sin(t * 4.2) * 1.5 : 0);
  const bob = Math.sin(t * 2.2) * 6;
  const enter = sp(t, 0, fps, 'heavy');
  const tagOp = interpolate(t, [beat.from, beat.from + 0.25], [0, 1], clamp);

  return (
    <AbsoluteFill style={{background: PAPER}}>
      {/* paper grain */}
      <AbsoluteFill style={{opacity: 0.09}}>
        <svg width="100%" height="100%"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#g)" /></svg>
      </AbsoluteFill>
      {/* header */}
      <div style={{position: 'absolute', top: 92, left: 84, right: 84, display: 'flex', justifyContent: 'space-between', ...MONO, fontSize: 22, color: MUTED, letterSpacing: '0.08em', textTransform: 'none', fontWeight: 500}}>
        <span style={{opacity: tagOp}}>// {beat.tag}</span><span>OPEN//77 · {BEATS.indexOf(beat) + 1}/3</span>
      </div>
      {/* caption */}
      <div style={{position: 'absolute', top: 190, left: 84}}><Caption words={beat.words} /></div>
      {/* props */}
      <Sequence from={0} durationInFrames={Math.round(4.3 * fps)}><PropSlot len={4.3}><ServerCard /></PropSlot></Sequence>
      <Sequence from={Math.round(4.3 * fps)} durationInFrames={Math.round(4.7 * fps)}><PropSlot len={4.7}><Terminal /></PropSlot></Sequence>
      <Sequence from={Math.round(9.0 * fps)} durationInFrames={Math.round(5.0 * fps)}><AbsoluteFill style={{left: 84}}><PropSlot len={5.2}><div style={{alignSelf: 'flex-start'}}><Checklist /></div></PropSlot></AbsoluteFill></Sequence>
      {/* host, peeking up from the bottom right */}
      <div style={{position: 'absolute', right: -10, bottom: -330, transform: `translateY(${(1 - enter) * 500 + bob}px)`}}>
        <KalAvatar width={820} pose={{mouth, blink, brow, arm, tilt}} />
      </div>
      {/* end tag */}
      <div style={{position: 'absolute', left: 84, bottom: 130, ...MONO, fontSize: 26, color: INK, letterSpacing: '0.06em', textTransform: 'none', opacity: interpolate(t, [12.2, 12.5], [0, 1], clamp)}}>follow for part 2 →</div>
    </AbsoluteFill>
  );
};
