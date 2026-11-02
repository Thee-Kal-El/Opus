// GIBWORK explainer, 25 s vertical (1080×1920 @ 30): how to EARN USDC with bounties, and how to POST them.
// 2D motion graphics (springs, kinetic type, UI mockups) + 3D (voxel logo, coins, reward vault) via @remotion/three.
import React from 'react';
import {AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig, random} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Coin, CoinBurst, DEEP, GLYPH, GRN, GRN2, Lights, PUR, PUR2, USDC, Vault, VoxelLogo} from './three';

const INK = '#111114', MUTE = '#6E6E78', PAPER = '#F6F4FF';
const D: React.CSSProperties = {fontFamily: 'Inter Tight', fontWeight: 900, letterSpacing: '-0.035em'};
const G = (w: number): React.CSSProperties => ({fontFamily: 'Geist', fontWeight: w, letterSpacing: '-0.02em'});
const MONO: React.CSSProperties = {fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.08em'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const W = 1080, H = 1920;

const useT = () => useCurrentFrame() / useVideoConfig().fps;
const useSp = () => { const f = useCurrentFrame(), {fps} = useVideoConfig(); return (at: number, cfg: 'snap' | 'pop' | 'soft' = 'snap') => spring({frame: f - Math.round(at * fps), fps, config: cfg === 'pop' ? {damping: 10, stiffness: 180, mass: 0.7} : cfg === 'soft' ? {damping: 22, stiffness: 110} : {damping: 16, stiffness: 220, mass: 0.6}}); };

// ---------- shared bits ----------
const Glyph: React.FC<{size: number; color?: string}> = ({size, color = '#fff'}) => (
  <svg width={size} height={size * 1.25} viewBox="-0.2 -0.2 6.4 7.9">{GLYPH.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={color} />)}</svg>
);
const LogoDisc: React.FC<{size: number}> = ({size}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, background: PUR, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Glyph size={size * 0.42} /></div>
);
const CoinIcon: React.FC<{size: number}> = ({size}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, background: USDC, border: `${size * 0.08}px solid #fff`, boxShadow: `inset 0 0 0 ${size * 0.06}px ${USDC}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...G(800), fontSize: size * 0.56, color: '#fff'}}>$</div>
);
const DotGrid: React.FC<{color?: string}> = ({color = 'rgba(129,81,253,0.13)'}) => {
  const t = useT();
  return <AbsoluteFill style={{backgroundImage: `radial-gradient(${color} 2.4px, transparent 2.8px)`, backgroundSize: '36px 36px', backgroundPosition: `0 ${t * 18}px`}} />;
};
// step header: "EARN · 01  Find a bounty"
const StepHead: React.FC<{mode: 'EARN' | 'POST'; n: number; title: string}> = ({mode, n, title}) => {
  const sp = useSp(), a = sp(0), b = sp(0.08, 'pop');
  const col = mode === 'EARN' ? GRN : PUR;
  return (
    <div style={{position: 'absolute', left: 80, top: 150, right: 80}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, transform: `translateX(${(1 - a) * -120}px)`, opacity: a}}>
        <div style={{...MONO, fontSize: 30, color: '#fff', background: col, padding: '10px 22px', borderRadius: 999}}>{mode}</div>
        <div style={{...MONO, fontSize: 30, color: col}}>STEP 0{n} / 03</div>
      </div>
      <div style={{...D, fontSize: 112, lineHeight: 1.0, color: INK, marginTop: 26, transform: `translateY(${(1 - b) * 60}px)`, opacity: b}}>{title}</div>
    </div>
  );
};
// purple swoosh wipe used between sections
const Swoosh: React.FC<{at: number; color?: string}> = ({at, color = PUR}) => {
  const t = useT(); const k = interpolate(t, [at - 0.3, at, at + 0.3], [0, 0.5, 1], clamp);
  if (k <= 0 || k >= 1) return null;
  const y = interpolate(k, [0, 1], [H + 400, -H - 400]);
  return <AbsoluteFill style={{pointerEvents: 'none'}}><div style={{position: 'absolute', left: -300, width: W + 600, height: H + 200, top: y, background: color, transform: 'skewY(-12deg)'}} /></AbsoluteFill>;
};

// ---------- S1 intro (0–3.2): 3D voxel logo assembles, camera swings, wordmark + promise ----------
const Intro: React.FC = () => {
  const t = useT(), sp = useSp();
  const cam = interpolate(t, [0, 2.4], [0.35, 0], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)});
  const word = sp(1.35), line = sp(1.75, 'pop');
  return (
    <AbsoluteFill style={{background: `radial-gradient(80% 60% at 50% 40%, #9B73FF 0%, ${PUR} 40%, ${DEEP} 100%)`}}>
      <DotGrid color="rgba(255,255,255,0.10)" />
      <AbsoluteFill style={{top: 150}}>
        <ThreeCanvas width={W} height={1000} camera={{position: [Math.sin(cam) * 16, 1.2, Math.cos(cam) * 16], fov: 34}}>
          <Lights />
          <group rotation={[0, Math.sin(t * 1.1) * 0.18 - cam * 0.5, 0]} position={[0, 0.5, 0]}><VoxelLogo t={t} start={0.05} /></group>
        </ThreeCanvas>
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 1180, width: '100%', textAlign: 'center'}}>
        <div style={{...G(700), fontSize: 190, color: '#fff', transform: `translateY(${(1 - word) * 80}px)`, opacity: word}}>gibwork</div>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 22, marginTop: 30, background: '#fff', padding: '18px 38px', borderRadius: 999, transform: `scale(${line})`}}>
          <CoinIcon size={64} /><span style={{...G(700), fontSize: 54, color: INK}}>Get paid in USDC</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- S2 two ways (3.2–5.2) ----------
const TwoWays: React.FC = () => {
  const t = useT(), sp = useSp();
  const head = sp(0), e = sp(0.45, 'pop'), p = sp(0.62, 'pop');
  const split = sp(0.3, 'soft');
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <DotGrid />
      <div style={{position: 'absolute', top: 260, width: '100%', textAlign: 'center', ...D, fontSize: 120, color: INK, lineHeight: 1.0, transform: `translateY(${(1 - head) * 50}px)`, opacity: head}}>Two ways<br />to use it</div>
      <div style={{position: 'absolute', left: 0, top: 700, width: W, height: 1220}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: W / 2, height: '100%', background: GRN, clipPath: `polygon(0 0, ${100 * split}% 0, ${100 * split - 12}% 100%, 0 100%)`}} />
        <div style={{position: 'absolute', right: 0, top: 0, width: W / 2 + 70, height: '100%', background: PUR, clipPath: `polygon(${100 - 100 * split + 12}% 0, 100% 0, 100% 100%, ${100 - 100 * split}% 100%)`}} />
        <div style={{position: 'absolute', left: 60, top: 300, transform: `scale(${e}) rotate(${(1 - e) * -10}deg)`, color: '#fff'}}>
          <div style={{...D, fontSize: 150}}>EARN</div><div style={{...G(600), fontSize: 44, opacity: 0.9}}>complete bounties</div>
        </div>
        <div style={{position: 'absolute', right: 60, top: 640, textAlign: 'right', transform: `scale(${p}) rotate(${(1 - p) * 10}deg)`, color: '#fff'}}>
          <div style={{...D, fontSize: 150}}>POST</div><div style={{...G(600), fontSize: 44, opacity: 0.9}}>hire the internet</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- EARN 1: find a bounty (perspective board) ----------
const BOUNTIES: [string, string, string, string][] = [
  ['Write a launch thread', 'Writing', '$50', '#E84393'], ['Test the mobile app', 'Testing', '$20', '#FF7A1A'], ['Edit a UGC video', 'Video', '$120', '#E53935'],
  ['Design 3 social posts', 'Design', '$75', PUR], ['Find 15 sales leads', 'Research', '$60', '#2A9D8F'], ['Build a landing page', 'Development', '$300', INK],
];
const BountyCard: React.FC<{b: [string, string, string, string]; hi?: number}> = ({b: [title, tag, price, col], hi = 0}) => (
  <div style={{width: 860, height: 168, borderRadius: 28, background: '#fff', display: 'flex', alignItems: 'center', gap: 28, padding: '0 34px', boxSizing: 'border-box',
    border: `${3 + hi * 3}px solid ${hi > 0.05 ? GRN2 : '#E4E2EE'}`, boxShadow: hi > 0.05 ? `0 0 ${60 * hi}px rgba(31,209,142,${0.6 * hi})` : '0 18px 36px rgba(40,20,90,0.12)'}}>
    <div style={{width: 92, height: 92, borderRadius: 46, background: col, flexShrink: 0}} />
    <div style={{flex: 1}}>
      <div style={{...G(700), fontSize: 40, color: INK}}>{title}</div>
      <div style={{display: 'inline-block', marginTop: 10, ...G(600), fontSize: 26, color: INK, border: '2px solid #DADAE0', borderRadius: 999, padding: '4px 16px'}}>{tag}</div>
    </div>
    <div style={{display: 'flex', alignItems: 'center', gap: 12}}><CoinIcon size={44} /><span style={{...G(800), fontSize: 52, color: INK}}>{price}</span></div>
  </div>
);
const EarnFind: React.FC = () => {
  const t = useT(), sp = useSp();
  const scroll = interpolate(t, [0, 1.5], [0, 8 * 198 - 420], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)}), pick = sp(1.55, 'soft');
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <DotGrid /><StepHead mode="EARN" n={1} title="Find a bounty" />
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, height: 1360, perspective: 1600, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 110, top: 0, transform: `rotateX(${24 * (1 - pick)}deg) rotateZ(${-8 * (1 - pick)}deg) translateY(${-scroll}px)`, transformOrigin: '50% 30%'}}>
          {[...BOUNTIES, ...BOUNTIES].map((b, i) => {
            const isHi = i === 8, k = sp(0.05 + i * 0.05, 'snap');
            return (
              <div key={i} style={{marginBottom: 30, transform: `translateX(${(1 - k) * 500}px) scale(${isHi ? 1 + 0.1 * pick : 1}) translateZ(${isHi ? pick * 120 : 0}px)`, opacity: (isHi ? 1 : 1 - 0.65 * pick) * Math.min(1, k * 2)}}>
                <BountyCard b={b} hi={isHi ? pick : 0} />
              </div>
            );
          })}
        </div>
      </div>
      {/* tap */}
      {t > 1.45 && <div style={{position: 'absolute', left: 820 - 40, top: 560 + 420 + 44, width: 80, height: 80, borderRadius: 40, border: `6px solid ${GRN2}`, opacity: interpolate(t, [1.45, 2.0], [1, 0], clamp), transform: `scale(${interpolate(t, [1.45, 2.0], [0.4, 1.8], clamp)})`}} />}
    </AbsoluteFill>
  );
};

// ---------- EARN 2: do the work & submit ----------
const EarnSubmit: React.FC = () => {
  const t = useT(), sp = useSp();
  const card = sp(0.05, 'soft'), up = interpolate(t, [0.5, 1.5], [0, 1], clamp), press = interpolate(t, [1.75, 1.85, 2.0], [1, 0.9, 1], clamp), done = t > 1.85, flip = sp(1.85, 'pop');
  const files = ['final_cut_v2.mp4', 'thumbnail.png'];
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <DotGrid /><StepHead mode="EARN" n={2} title={'Do the work.\nSubmit it.'.split('\n')[0]} />
      <div style={{position: 'absolute', left: 80, top: 405, ...D, fontSize: 112, color: GRN}}>Submit it.</div>
      <div style={{position: 'absolute', left: 90, top: 640, width: 900, transform: `translateY(${(1 - card) * 300}px) rotate(${(1 - card) * 4}deg)`, opacity: card}}>
        <div style={{background: '#fff', borderRadius: 40, padding: 46, boxShadow: '0 40px 80px rgba(40,20,90,0.18)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 20}}><div style={{width: 70, height: 70, borderRadius: 35, background: '#E53935'}} /><div style={{...G(700), fontSize: 46, color: INK}}>Edit a UGC video</div></div>
          <div style={{...MONO, fontSize: 24, color: MUTE, marginTop: 34}}>YOUR SUBMISSION</div>
          {files.map((f, i) => {
            const k = sp(0.35 + i * 0.2, 'pop'), p = Math.min(1, Math.max(0, up * 1.6 - i * 0.6));
            return (
              <div key={f} style={{marginTop: 22, background: '#F3F2F8', borderRadius: 22, padding: '22px 26px', transform: `scale(${k})`, transformOrigin: 'left center'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', ...G(600), fontSize: 34, color: INK}}><span>📎 {f}</span><span style={{color: p >= 1 ? GRN : MUTE}}>{p >= 1 ? '✓' : `${Math.round(p * 100)}%`}</span></div>
                <div style={{height: 12, borderRadius: 6, background: '#E1DEEC', marginTop: 16, overflow: 'hidden'}}><div style={{height: '100%', width: `${p * 100}%`, background: p >= 1 ? GRN2 : PUR}} /></div>
              </div>
            );
          })}
          <div style={{marginTop: 40, height: 120, borderRadius: 60, background: done ? GRN : INK, display: 'flex', alignItems: 'center', justifyContent: 'center', ...G(700), fontSize: 48, color: '#fff', transform: `scale(${press * (done ? 0.96 + 0.04 * flip : 1)})`}}>{done ? 'Submitted ✓' : 'Submit work'}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- EARN 3: get paid in USDC (3D coin burst into wallet) ----------
const EarnPaid: React.FC = () => {
  const t = useT(), sp = useSp();
  const wallet = sp(0.1, 'soft'), amt = 120 * Math.min(1, Math.max(0, (t - 0.9) / 1.0)) ** 0.6, hit = sp(0.9, 'pop');
  return (
    <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 55%, #2BDF9C 0%, ${GRN} 55%, #0A4D37 100%)`}}>
      <DotGrid color="rgba(255,255,255,0.12)" />
      <AbsoluteFill>
        <ThreeCanvas width={W} height={H} camera={{position: [0, 0, 14], fov: 40}}>
          <Lights />
          <Coin position={[0, -0.2 + Math.sin(t * 2) * 0.15, -1]} spin={t * 3.2} scale={1.55 * Math.min(1, sp(0, 'pop') * 1.0)} />
          <CoinBurst t={t} at={0.85} count={20} origin={[0, -0.2, -2]} seed="earn" power={0.9} />
        </ThreeCanvas>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 80, top: 150}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}><div style={{...MONO, fontSize: 30, color: GRN, background: '#fff', padding: '10px 22px', borderRadius: 999}}>EARN</div><div style={{...MONO, fontSize: 30, color: '#fff'}}>STEP 03 / 03</div></div>
        <div style={{...D, fontSize: 112, lineHeight: 1.0, color: '#fff', marginTop: 26}}>Get paid<br />in USDC</div>
      </div>
      <div style={{position: 'absolute', left: 90, right: 90, bottom: 170, transform: `translateY(${(1 - wallet) * 400}px)`}}>
        <div style={{background: '#fff', borderRadius: 40, padding: '38px 46px', boxShadow: '0 40px 80px rgba(0,40,20,0.3)', transform: `scale(${1 + 0.04 * (hit > 0 && hit < 1 ? 1 - hit : 0)})`}}>
          <div style={{...MONO, fontSize: 26, color: MUTE}}>WALLET</div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 6}}><span style={{...D, fontSize: 150, color: GRN, fontVariantNumeric: 'tabular-nums'}}>${amt.toFixed(2)}</span><span style={{...G(700), fontSize: 48, color: MUTE}}>USDC</span></div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 14, ...G(600), fontSize: 34, color: INK, opacity: interpolate(t, [1.9, 2.2], [0, 1], clamp)}}><span>✓ Bounty reward</span><span style={{color: GRN}}>+$120.00</span></div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- POST 1: post a task (form types itself) ----------
const PostForm: React.FC = () => {
  const t = useT(), sp = useSp();
  const title = 'Design a logo for my brand', n = Math.floor(interpolate(t, [0.4, 1.3], [0, title.length], clamp));
  const reward = Math.round(interpolate(t, [1.45, 2.0], [0, 150], clamp)), card = sp(0.05, 'soft');
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <DotGrid /><StepHead mode="POST" n={1} title="Post a task" />
      <div style={{position: 'absolute', left: 90, top: 560, width: 900, transform: `translateY(${(1 - card) * 300}px)`, opacity: card}}>
        <div style={{background: '#fff', borderRadius: 40, padding: 46, boxShadow: '0 40px 80px rgba(40,20,90,0.18)'}}>
          <div style={{...MONO, fontSize: 24, color: MUTE}}>TASK TITLE</div>
          <div style={{marginTop: 14, border: `4px solid ${t < 1.4 ? PUR : '#E4E2EE'}`, borderRadius: 22, padding: '24px 26px', ...G(600), fontSize: 44, color: INK, minHeight: 56}}>
            {title.slice(0, n)}{t < 1.4 && <span style={{display: 'inline-block', width: 4, height: 50, background: PUR, verticalAlign: 'middle', marginLeft: 4, opacity: Math.floor(t * 4) % 2 ? 0 : 1}} />}
          </div>
          <div style={{...MONO, fontSize: 24, color: MUTE, marginTop: 34}}>CATEGORY</div>
          <div style={{display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap'}}>
            {['Design', 'Writing', 'Video', 'Development'].map((c, i) => { const on = i === 0 && t > 1.1, k = sp(0.25 + i * 0.08, 'pop');
              return <div key={c} style={{transform: `scale(${k})`, ...G(600), fontSize: 34, padding: '12px 26px', borderRadius: 999, background: on ? PUR : '#F1F0F6', color: on ? '#fff' : INK}}>{c}</div>; })}
          </div>
          <div style={{...MONO, fontSize: 24, color: MUTE, marginTop: 34}}>REWARD</div>
          <div style={{marginTop: 14, display: 'flex', alignItems: 'center', gap: 20, border: `4px solid ${t >= 1.4 && t < 2.1 ? PUR : '#E4E2EE'}`, borderRadius: 22, padding: '20px 26px'}}>
            <CoinIcon size={70} /><span style={{...D, fontSize: 84, color: INK, fontVariantNumeric: 'tabular-nums'}}>{reward}</span><span style={{...G(700), fontSize: 44, color: MUTE}}>USDC</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- POST 2: fund the reward (3D vault) ----------
const PostFund: React.FC = () => {
  const t = useT(), sp = useSp(), badge = sp(1.5, 'pop');
  return (
    <AbsoluteFill style={{background: `radial-gradient(80% 60% at 50% 55%, #A07CFF 0%, ${PUR} 50%, ${DEEP} 100%)`}}>
      <DotGrid color="rgba(255,255,255,0.10)" />
      <div style={{position: 'absolute', left: 80, top: 150}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}><div style={{...MONO, fontSize: 30, color: PUR, background: '#fff', padding: '10px 22px', borderRadius: 999}}>POST</div><div style={{...MONO, fontSize: 30, color: '#fff'}}>STEP 02 / 03</div></div>
        <div style={{...D, fontSize: 112, lineHeight: 1.0, color: '#fff', marginTop: 26}}>Fund the<br />reward</div>
      </div>
      <AbsoluteFill style={{top: 520}}>
        <ThreeCanvas width={W} height={1100} camera={{position: [0, 0.6, 11], fov: 38}}>
          <Lights />
          <group position={[0, -0.6, 0]} rotation={[0, Math.sin(t * 0.8) * 0.12, 0]}><Vault t={t} /></group>
        </ThreeCanvas>
      </AbsoluteFill>
      <div style={{position: 'absolute', bottom: 190, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{transform: `scale(${badge})`, display: 'flex', alignItems: 'center', gap: 18, background: '#fff', padding: '20px 40px', borderRadius: 999}}>
          <div style={{width: 26, height: 26, borderRadius: 13, background: GRN2}} /><span style={{...G(700), fontSize: 48, color: INK}}>150 USDC reward funded</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- POST 3: pick winners → pay them all (split the reward) ----------
const PostPick: React.FC = () => {
  const t = useT(), sp = useSp();
  const subs: [string, string, string, number][] = [['Maya', 'Bold monogram', '#FF7A1A', 0], ['Leo', 'Pixel mascot', '#2A9D8F', 100], ['Ana', 'Minimal wordmark', '#E84393', 50]];
  const pick1 = sp(0.75, 'soft'), pick2 = sp(1.05, 'soft'), pk1 = sp(1.55, 'pop'), pk2 = sp(1.7, 'pop');
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <DotGrid />
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <ThreeCanvas width={W} height={H} camera={{position: [0, 0, 14], fov: 40}}>
          <Lights />
          <CoinBurst t={t} at={1.55} count={12} origin={[2.2, -1.2, -3]} seed="pick1" power={0.7} />
          <CoinBurst t={t} at={1.7} count={10} origin={[2.2, -3.6, -3]} seed="pick2" power={0.7} />
        </ThreeCanvas>
      </AbsoluteFill>
      <StepHead mode="POST" n={3} title="Pick winners." />
      <div style={{position: 'absolute', left: 80, top: 405, ...D, fontSize: 112, color: PUR}}>Pay them all.</div>
      <div style={{position: 'absolute', left: 90, top: 640, width: 900, display: 'flex', flexDirection: 'column', gap: 30}}>
        {subs.map(([who, what, col, amt], i) => {
          const k = sp(0.1 + i * 0.12), win = amt > 0, p = i === 1 ? pick1 : i === 2 ? pick2 : 0, pk = i === 1 ? pk1 : pk2;
          const dim = win ? 0 : Math.max(pick1, pick2);
          return (
            <div key={who} style={{transform: `translateX(${(1 - k) * 700}px) scale(${win ? 1 + 0.04 * p : 1 - 0.04 * dim})`, opacity: 1 - 0.5 * dim}}>
              <div style={{background: '#fff', borderRadius: 32, padding: '30px 34px', display: 'flex', alignItems: 'center', gap: 26, border: `${3 + 4 * p}px solid ${p > 0.05 ? GRN2 : '#E4E2EE'}`, boxShadow: win ? `0 0 ${60 * p}px rgba(31,209,142,${0.45 * p})` : '0 18px 36px rgba(40,20,90,0.1)'}}>
                <div style={{width: 150, height: 150, borderRadius: 24, background: `linear-gradient(135deg, ${col}, #fff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...D, fontSize: 70, color: '#fff'}}>{who[0]}</div>
                <div style={{flex: 1}}><div style={{...G(700), fontSize: 44, color: INK}}>{who}</div><div style={{...G(500), fontSize: 32, color: MUTE, marginTop: 6}}>{what}</div></div>
                {win && <div style={{transform: `scale(${pk})`, background: GRN, color: '#fff', ...G(700), fontSize: 34, padding: '16px 26px', borderRadius: 999, whiteSpace: 'nowrap'}}>+{amt} USDC ✓</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', bottom: 150, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{transform: `scale(${sp(1.9, 'pop')})`, background: INK, color: '#fff', borderRadius: 999, padding: '20px 38px', ...G(700), fontSize: 40}}>Reward one winner — or many</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- S5 end (21–25) ----------
const EndCard: React.FC = () => {
  const t = useT(), sp = useSp();
  const a = sp(0.5), b = sp(0.75, 'pop'), c = sp(1.05, 'pop'), fade = interpolate(t, [3.55, 4.0], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: `radial-gradient(80% 60% at 50% 40%, #9B73FF 0%, ${PUR} 40%, ${DEEP} 100%)`}}>
      <DotGrid color="rgba(255,255,255,0.10)" />
      <AbsoluteFill style={{top: 120}}>
        <ThreeCanvas width={W} height={900} camera={{position: [0, 0, 16], fov: 34}}>
          <Lights />
          <group rotation={[0, Math.sin(t * 1.3) * 0.35, 0]} position={[-1.6, 0, 0]}><VoxelLogo t={t} start={0} scale={0.82} /></group>
          <Coin position={[3.6, 0.2 + Math.sin(t * 2.2) * 0.25, 0.5]} spin={t * 3} scale={1.7 * sp(0.3, 'pop')} />
        </ThreeCanvas>
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 1040, width: '100%', textAlign: 'center', color: '#fff'}}>
        <div style={{...D, fontSize: 132, lineHeight: 1.02, transform: `translateY(${(1 - a) * 60}px)`, opacity: a}}>Earn it.</div>
        <div style={{...D, fontSize: 132, lineHeight: 1.02, color: GRN2, transform: `scale(${b})`}}>Or hire it.</div>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, marginTop: 70, background: INK, padding: '24px 50px', borderRadius: 999, transform: `scale(${c})`}}>
          <div style={{width: 22, height: 22, borderRadius: 11, background: GRN2}} /><span style={{...MONO, fontSize: 56, color: '#fff'}}>gib.work</span>
        </div>
        <div style={{...G(600), fontSize: 40, opacity: 0.85 * c, marginTop: 34}}>Bounties paid in USDC</div>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
    </AbsoluteFill>
  );
};

// ---------- timeline ----------
export const GIB_SCENES: [React.FC, number, number][] = [
  [Intro, 0, 3.2], [TwoWays, 3.2, 5.2],
  [EarnFind, 5.2, 7.9], [EarnSubmit, 7.9, 10.6], [EarnPaid, 10.6, 13.6],
  [PostForm, 13.6, 16.1], [PostFund, 16.1, 18.6], [PostPick, 18.6, 21.0],
  [EndCard, 21.0, 25.0],
];
export const GibExplainer: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {GIB_SCENES.map(([S, a, b], i) => <Sequence key={i} from={Math.round(a * fps)} durationInFrames={Math.round((b - a) * fps)}><S /></Sequence>)}
      <Swoosh at={3.2} /><Swoosh at={5.2} color={GRN} /><Swoosh at={13.6} color={PUR} /><Swoosh at={21.0} />
    </AbsoluteFill>
  );
};
