// Character explainer reel (1080×1920): Kal's cartoon host + word-by-word captions with italic-serif accents + animated props.
// Story: "I built my own Cyberpunk server, and Claude made the banner. In 10 minutes my Cyberpunk Game Server was up and running! Try it out today!"
import React from 'react';
import {AbsoluteFill, Freeze, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MONO, SANS, SERIF, WIDE} from '../fonts';
import {KalAvatar} from '../character/KalAvatar';
import {Pop, SPRINGS, TypeOn, Wipe} from '../kit/motion';
import {P2Connect, P2Download, P2Game, P2LoadIn, P2Scan, P2Servers, P2Title} from './Part2Props';

const PAPER = '#F3EFE6', INK = '#1B1B1F', ACCENT = '#C2502E', MUTED = '#9A958A', YL = '#F3DF00';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Word = {w: string; at: number; accent?: boolean; br?: boolean};
const BEATS: {from: number; to: number; tag: string; words: Word[]; count?: string}[] = [
  {from: 0, to: 4.3, tag: '01 · the setup', words: [{w: 'I', at: 0.25}, {w: 'built', at: 0.4}, {w: 'my', at: 0.58}, {w: 'own', at: 0.75, accent: true}, {w: 'Cyberpunk', at: 1.05, br: true}, {w: 'server,', at: 1.45}]},
  {from: 4.3, to: 9.0, tag: '02 · the trick', words: [{w: 'and', at: 4.5}, {w: 'Claude', at: 4.7, accent: true}, {w: 'made', at: 5.05, br: true}, {w: 'the', at: 5.25}, {w: 'banner.', at: 5.45, accent: true}]},
  {from: 9.0, to: 14.2, tag: '03 · the result', words: [{w: 'In', at: 9.2}, {w: '10', at: 9.35, accent: true}, {w: 'minutes', at: 9.55, accent: true}, {w: 'my', at: 9.9, br: true}, {w: 'Cyberpunk', at: 10.05}, {w: 'Game', at: 10.4, br: true}, {w: 'Server', at: 10.55}, {w: 'was', at: 10.85}, {w: 'up', at: 11.05, accent: true, br: true}, {w: 'and', at: 11.2, accent: true}, {w: 'running!', at: 11.35, accent: true}]},
  {from: 14.2, to: 18.7, tag: '04 · your turn', words: [{w: 'Try', at: 14.4}, {w: 'it', at: 14.55}, {w: 'out', at: 14.7}, {w: 'today!', at: 14.95, accent: true}]},
];
// Part 2 (18.7–33.7 s): "*word*" = accent, "|" = line break; words land 0.13 s apart
const words = (from: number, text: string): Word[] => {
  const out: Word[] = []; let i = 0;
  text.split('|').forEach((line, li) => line.trim().split(/\s+/).forEach((w, wi) => {
    const accent = w.startsWith('*'); out.push({w: w.replace(/\*/g, ''), at: from + 0.15 + i++ * 0.13, accent, br: li > 0 && wi === 0});
  }));
  return out;
};
const P2_START = 18.7, P2_TITLE = 1.5, P2_STEP = 2.25;
const P2_STEPS = ['Own a *licensed* | copy of | Cyberpunk 2077', 'Download | *OPEN//77* | at open2077.net', 'Open it. It *finds* | & *verifies* | your game', 'Pick your server… | *MINE!*', 'Hit *CONNECT* | & grab any *mods*', 'Load in & | enjoy *MILITECH!*'];
const P2_PROPS = [P2Game, P2Download, P2Scan, P2Servers, P2Connect, P2LoadIn];
const stepFrom = (i: number) => P2_START + P2_TITLE + i * P2_STEP;
BEATS.push({from: P2_START, to: P2_START + P2_TITLE, tag: 'part 2 · how to join', count: 'PART 2', words: words(P2_START, 'Part *2:* | how to *join* | my server')});
P2_STEPS.forEach((txt, i) => BEATS.push({from: stepFrom(i), to: stepFrom(i) + P2_STEP, tag: `part 2 · step ${i + 1}`, count: `STEP ${i + 1}/6`, words: words(stepFrom(i), txt)}));

// ── pacing: the story above runs 33.7 s; the reel plays it over 50 s ──
// Each beat plays its animations at normal speed, then HOLDS once everything has settled (so there's time to read),
// and only plays its last TAIL seconds (the exit) at the end of the stretched beat. The final beat is lengthened instead.
export const REEL_SECONDS = 50;
const K = REEL_SECONDS / stepFrom(6), TAIL = 0.35;
BEATS[BEATS.length - 1].to = BEATS[BEATS.length - 1].from + P2_STEP * K;
const LAST_LEN = P2_STEP * K;
const SEGS = (() => { let acc = 0; return BEATS.map((b, i) => { const R = i === BEATS.length - 1 ? b.to - b.from : (b.to - b.from) * K; const seg = {r0: acc, r1: acc + R, b}; acc += R; return seg; }); })();
const storyAt = (t: number) => {
  const seg = SEGS.find((x) => t < x.r1) ?? SEGS[SEGS.length - 1];
  const local = t - seg.r0, D = seg.b.to - seg.b.from, R = seg.r1 - seg.r0;
  if (Math.abs(R - D) < 1e-6) return seg.b.from + Math.min(local, D - 0.001);
  const hold = D - TAIL;
  return seg.b.from + (local < hold ? local : local < R - TAIL ? hold : hold + (local - (R - TAIL)));
};
const TALK: [number, number][] = [[0.2, 2.1], [4.45, 6.2], [9.15, 11.9], [14.35, 15.6], [18.8, 19.9], ...[0, 1, 2, 3, 4, 5].map((i): [number, number] => [20.3 + i * 2.25, 21.4 + i * 2.25])];

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
      {items.map((it, i) => (
        <Pop key={it} delay={11.7 - 9.0 + i * 0.35} cfg="snappy" style={{transformOrigin: 'left center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 18, padding: '18px 28px', boxShadow: '0 12px 30px rgba(40,30,10,0.12)'}}>
            <div style={{width: 46, height: 46, borderRadius: 23, background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...SANS, fontSize: 30}}>✓</div>
            <div style={{...SANS, fontSize: 40, color: INK, fontWeight: 500}}>{it}</div>
          </div>
        </Pop>
      ))}
    </div>
  );
};

// beat 4 prop: server card + cursor that clicks CONNECT, then a ripple and "open2077.net"
const ConnectClick: React.FC = () => {
  const t = useT(), {fps} = useVideoConfig();
  const m = sp(t, 1.0, fps, 'smooth');                       // cursor travel
  const press = interpolate(t, [1.75, 1.85, 2.0], [1, 0.9, 1], clamp);
  const ring = interpolate(t, [1.85, 2.5], [0, 1], clamp);
  return (
    <div style={{position: 'relative'}}>
      <ServerCard />
      <div style={{position: 'absolute', right: 30, bottom: 32, width: 190, height: 70, borderRadius: 8, border: `6px solid ${YL}`, opacity: ring > 0 && ring < 1 ? 1 - ring : 0, transform: `scale(${1 + ring * 0.5}) skewX(-12deg)`}} />
      <svg width={64} height={64} viewBox="0 0 24 24" style={{position: 'absolute', left: interpolate(m, [0, 1], [120, 610]), top: interpolate(m, [0, 1], [520, 330]), transform: `scale(${press})`, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))'}}>
        <path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.8 L11.6 14 L18 14 Z" fill="#fff" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
      <div style={{...MONO, fontSize: 34, color: INK, textAlign: 'center', marginTop: 44, letterSpacing: '0.06em', textTransform: 'none', opacity: interpolate(t, [2.1, 2.4], [0, 1], clamp)}}>open2077.net</div>
    </div>
  );
};

// a prop enters with a spring, and leaves quickly just before its beat ends
const PropSlot: React.FC<{len: number; top?: number; children: React.ReactNode}> = ({len, top = 540, children}) => {
  const t = useT(), {fps} = useVideoConfig();
  const s = sp(t, 0.15, fps, 'heavy');
  const out = interpolate(t, [len - 0.28, len], [0, 1], clamp);
  return <AbsoluteFill style={{alignItems: 'center', top, opacity: 1 - out, transform: `translateY(${(1 - s) * 260 + out * -60}px) scale(${0.85 + 0.15 * s})`}}>{children}</AbsoluteFill>;
};

// everything except the host, driven by (warped) story time
const Story: React.FC = () => {
  const t = useT(), {fps} = useVideoConfig();
  const beat = BEATS.find((b) => t >= b.from && t < b.to) ?? BEATS[BEATS.length - 1];
  const tagOp = interpolate(t, [beat.from, beat.from + 0.25], [0, 1], clamp);
  return (
    <AbsoluteFill>
      {/* header */}
      <div style={{position: 'absolute', top: 92, left: 84, right: 84, display: 'flex', justifyContent: 'space-between', ...MONO, fontSize: 22, color: MUTED, letterSpacing: '0.08em', textTransform: 'none', fontWeight: 500}}>
        <span style={{opacity: tagOp}}>// {beat.tag}</span><span>{beat.count ?? `OPEN//77 · ${BEATS.indexOf(beat) + 1}/4`}</span>
      </div>
      {/* caption */}
      <div style={{position: 'absolute', top: 190, left: 84}}><Caption words={beat.words} /></div>
      {/* props */}
      <Sequence from={0} durationInFrames={Math.round(4.3 * fps)}><PropSlot len={4.3}><ServerCard /></PropSlot></Sequence>
      <Sequence from={Math.round(4.3 * fps)} durationInFrames={Math.round(4.7 * fps)}><PropSlot len={4.7}><Terminal /></PropSlot></Sequence>
      <Sequence from={Math.round(9.0 * fps)} durationInFrames={Math.round(5.2 * fps)}><AbsoluteFill style={{left: 84}}><PropSlot len={5.2} top={700}><div style={{alignSelf: 'flex-start'}}><Checklist /></div></PropSlot></AbsoluteFill></Sequence>
      <Sequence from={Math.round(14.2 * fps)} durationInFrames={Math.round(4.5 * fps)}><PropSlot len={4.8} top={440}><ConnectClick /></PropSlot></Sequence>
      <Sequence from={Math.round(P2_START * fps)} durationInFrames={Math.round(P2_TITLE * fps)}><PropSlot len={P2_TITLE} top={640}><P2Title /></PropSlot></Sequence>
      {P2_PROPS.map((Prop, i) => { const len = i === 5 ? LAST_LEN + 1 : P2_STEP; return <Sequence key={i} from={Math.round(stepFrom(i) * fps)} durationInFrames={Math.round(len * fps)}><PropSlot len={len} top={600}><Prop /></PropSlot></Sequence>; })}
    </AbsoluteFill>
  );
};

export const ExplainerReel: React.FC = () => {
  const real = useT(), {fps} = useVideoConfig();
  const t = storyAt(real);                        // choreography follows story time; idle motion follows real time
  // host animation
  const talking = TALK.some(([a, b]) => t >= a && t <= b) && t - storyAt(Math.max(0, real - 0.1)) > 0.01;
  const mouth = talking ? 0.25 + 0.75 * Math.abs(Math.sin(real * 13.5)) * (0.6 + 0.4 * Math.abs(Math.sin(real * 5.1))) : 0;
  const bt = real % 3.2, blink = bt > 3.05 ? Math.sin(((bt - 3.05) / 0.15) * Math.PI) : 0;
  const ARM: [number, number][] = [[1.3, 14], [3.6, 172], [7.0, 26], [8.5, 172], [9.4, 6], [12.6, 172], [14.6, 18], [17.6, 172], [27.1, 10], [28.6, 172], [31.6, 16]];
  let arm = 172, prev = 172;
  for (const [at, to] of ARM) { arm += (to - prev) * sp(t, at, fps, 'bouncy'); prev = to; }
  const brow = 0.9 * sp(t, 6.75, fps, 'bouncy') * (1 - sp(t, 8.2, fps, 'smooth')) + 0.5 * sp(t, 9.3, fps, 'bouncy') * (1 - sp(t, 12.4, fps, 'smooth')) + 0.8 * sp(t, 16.2, fps, 'bouncy') * (1 - sp(t, 18.2, fps, 'smooth')) + 0.8 * sp(t, 27.2, fps, 'bouncy') * (1 - sp(t, 28.8, fps, 'smooth')) + 0.7 * sp(t, 32.0, fps, 'bouncy');
  const tilt = Math.sin(real * 1.7) * 2.5 + (talking ? Math.sin(real * 4.2) * 1.5 : 0);
  const bob = Math.sin(real * 2.2) * 6;
  const enter = sp(real, 0, fps, 'heavy');

  return (
    <AbsoluteFill style={{background: PAPER}}>
      {/* paper grain */}
      <AbsoluteFill style={{opacity: 0.09}}>
        <svg width="100%" height="100%"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#g)" /></svg>
      </AbsoluteFill>
      <Freeze frame={Math.round(t * fps)}><Story /></Freeze>
      {/* host, peeking up from the bottom right */}
      <div style={{position: 'absolute', right: -10, bottom: -40, transform: `translateY(${(1 - enter) * 500 + bob}px)`}}>
        <KalAvatar width={760} pose={{mouth, blink, brow, arm, tilt}} />
      </div>
      {/* end tag */}
      <div style={{position: 'absolute', left: 84, bottom: 130, ...MONO, fontSize: 26, color: INK, letterSpacing: '0.06em', textTransform: 'none', opacity: interpolate(t, [16.6, 16.9, 18.4, 18.7], [0, 1, 1, 0], clamp)}}>follow for part 2 →</div>
    </AbsoluteFill>
  );
};
