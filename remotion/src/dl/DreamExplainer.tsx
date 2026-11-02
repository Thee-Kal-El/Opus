// DREAM LABS explainer, 25 s vertical (1080×1920 @ 30). Built only from what dreamlabs' site says (Dream-1, Robot Playground,
// real robots + simulation, built-in & custom bodies, Dream API). 2D motion graphics in the site's look + 3D robot arms.
import React from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Blob} from '../scenes/DreamBG';
import {DLights, fk, Mug, Pose, poseAt, RobotArm} from './arm';

const INK = '#151515', CREAM = '#FFF7E0', YEL = '#FFD43B', ORANGE = '#FFB070', MUTE = '#7A7466';
const SANS = (w: number): React.CSSProperties => ({fontFamily: 'Geist', fontWeight: w, letterSpacing: '-0.025em'});
const MONO: React.CSSProperties = {fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.1em'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const W = 1080, H = 1920;
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const useSp = () => { const f = useCurrentFrame(), {fps} = useVideoConfig(); return (at: number, kind: 'snap' | 'pop' | 'soft' = 'snap') => spring({frame: f - Math.round(at * fps), fps, config: kind === 'pop' ? {damping: 10, stiffness: 170, mass: 0.7} : kind === 'soft' ? {damping: 22, stiffness: 100} : {damping: 16, stiffness: 210, mass: 0.6}}); };

const LookAt: React.FC<{target: [number, number, number]}> = ({target}) => { const camera = useThree((s) => s.camera); camera.lookAt(...target); return null; };
const Paper: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const t = useT();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFF3D4 0%, #FFF7E0 55%, #FDE7A0 100%)'}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(150,110,30,0.13) 2.2px, transparent 2.6px)', backgroundSize: '34px 34px', backgroundPosition: `0 ${t * 14}px`}} />
      {children}
    </AbsoluteFill>
  );
};
const Logo: React.FC<{width: number}> = ({width}) => <Img src={staticFile('dreamlabs_logo_black.png')} style={{width}} />;
const Label: React.FC<{text: string; delay?: number}> = ({text, delay = 0}) => { const k = useSp()(delay); return <div style={{...MONO, fontSize: 30, color: MUTE, opacity: k, transform: `translateY(${(1 - k) * 20}px)`}}>{text}</div>; };
// word-by-word headline, with optional highlighted words (the site's yellow marker)
const Head: React.FC<{words: string; mark?: string[]; delay?: number; size?: number; color?: string}> = ({words, mark = [], delay = 0, size = 104, color = INK}) => {
  const sp = useSp();
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', columnGap: size * 0.26, rowGap: 4}}>
      {words.split(' ').map((w, i) => { const k = sp(delay + i * 0.07, 'pop'), hi = mark.includes(w.replace(/[.,]/g, ''));
        return <span key={i} style={{...SANS(600), fontSize: size, lineHeight: 1.06, color, display: 'inline-block', transform: `translateY(${(1 - k) * 50}px)`, opacity: Math.min(1, k * 1.5),
          background: hi ? `linear-gradient(transparent 58%, ${YEL} 58%, ${YEL} 92%, transparent 92%)` : undefined, backgroundSize: hi ? `${100 * Math.min(1, Math.max(0, (k - 0.5) * 2))}% 100%` : undefined, backgroundRepeat: 'no-repeat'}}>{w}</span>; })}
    </div>
  );
};
const Wipe: React.FC<{at: number}> = ({at}) => {
  const t = useT(), k = interpolate(t, [at - 0.28, at + 0.28], [0, 1], clamp);
  if (k <= 0 || k >= 1) return null;
  const x = interpolate(k, [0, 1], [W + 200, -W - 900]);
  return <AbsoluteFill style={{pointerEvents: 'none'}}><div style={{position: 'absolute', top: -100, height: H + 200, left: x, width: W + 700, background: YEL, borderRadius: 400}} /></AbsoluteFill>;
};

// ---------- S1 intro (0–3.2): 3D arm rises and waves, logo + promise ----------
const Intro: React.FC = () => {
  const t = useT(), sp = useSp(), rise = sp(0.1, 'soft'), logo = sp(1.2, 'pop');
  const wave = t > 1.0 ? Math.sin((t - 1.0) * 7) * 0.35 * Math.min(1, (t - 1.0) * 2) : 0;
  const pose: Pose = {yaw: 0.9 + wave * 0.4, a1: 0.15 * rise, a2: 0.35 + wave * 0.5, a3: 0.3 - wave * 0.6, grip: 0.3 + 0.3 * Math.sin(t * 6)};
  return (
    <Paper>
      <AbsoluteFill style={{top: 120}}>
        <ThreeCanvas width={W} height={1150} camera={{position: [4.5, 3.2, 8.6], fov: 34}}>
          <LookAt target={[0, 2.1, 0]} /><DLights />
          <group position={[0, -3 * (1 - rise), 0]}><RobotArm pose={pose} /></group>
        </ThreeCanvas>
      </AbsoluteFill>
      <Blob x={140} y={330} s={52} color="#7ED9A0" kind={1} phase={0} /><Blob x={950} y={420} s={44} color="#8EC5FF" kind={2} phase={1.2} /><Blob x={900} y={1180} s={50} color={ORANGE} kind={0} phase={2.2} eyes="#fff" />
      <div style={{position: 'absolute', top: 1330, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
        <div style={{transform: `scale(${logo})`}}><Logo width={760} /></div>
        <Head words="Robotics within reach." mark={['reach']} delay={1.55} size={84} />
      </div>
    </Paper>
  );
};

// ---------- S2 meet Dream-1 (3.2–6.4) ----------
const MeetDream: React.FC = () => {
  const sp = useSp(), card = sp(0.05, 'soft');
  const chips: [string, string][] = [['ZERO-SHOT', '#7ED9A0'], ['INTERFACE', '#8EC5FF'], ['BUILT-IN & CUSTOM BODIES', ORANGE]];
  return (
    <Paper>
      <div style={{position: 'absolute', left: 80, right: 80, top: 230}}>
        <Label text="MEET" />
        <div style={{...SANS(700), fontSize: 230, color: INK, lineHeight: 1, marginTop: 10, transform: `scale(${0.7 + 0.3 * card})`, transformOrigin: 'left center', opacity: card}}>Dream-1</div>
        <div style={{marginTop: 50}}><Head words="Everyday capabilities for everyday robots." mark={['everyday']} delay={0.45} size={88} /></div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 24, marginTop: 70}}>
          {chips.map(([c, col], i) => { const k = sp(1.3 + i * 0.16, 'pop');
            return <div key={c} style={{alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 18, background: '#fff', borderRadius: 999, padding: '18px 32px', boxShadow: '0 12px 30px rgba(120,80,10,0.14)', transform: `scale(${k}) translateX(${(1 - k) * -80}px)`, transformOrigin: 'left center'}}>
              <div style={{width: 26, height: 26, borderRadius: 13, background: col}} /><span style={{...MONO, fontSize: 32, color: INK}}>{c}</span></div>; })}
        </div>
      </div>
      <Blob x={930} y={1660} s={70} color={YEL} kind={2} phase={0.5} /><Blob x={790} y={1760} s={44} color="#FF9AA8" kind={1} phase={1.8} />
    </Paper>
  );
};

// ---------- S3 prompt a robot (6.4–13.4): prompt types, 3D arm hangs the mug ----------
const IDLE: Pose = {yaw: 1.57, a1: 0.25, a2: 0.55, a3: 0.5, grip: 0};
const ABOVE: Pose = {yaw: 2.15, a1: 0.82, a2: 1.12, a3: 1.0, grip: 0};
const REACH: Pose = {yaw: 2.15, a1: 1.0, a2: 1.1, a3: 0.95, grip: 0};
const GRAB: Pose = {...REACH, grip: 1};
const LIFT: Pose = {yaw: 2.15, a1: 0.6, a2: 1.0, a3: 1.2, grip: 1};
const TURN: Pose = {yaw: 0.95, a1: 0.6, a2: 1.0, a3: 1.2, grip: 1};
const PLACE: Pose = {yaw: 0.95, a1: 0.8, a2: 1.0, a3: 1.05, grip: 1};
const DROP: Pose = {...PLACE, grip: 0};
const KEYS: [number, Pose][] = [[0, IDLE], [2.0, IDLE], [2.7, ABOVE], [3.05, REACH], [3.3, GRAB], [3.75, LIFT], [4.6, TURN], [5.05, PLACE], [5.3, DROP], [6.0, {...IDLE, yaw: 1.4}]];
const MUG_OFF = 0.24, T_GRAB = 3.3, T_DROP = 5.3;
const sub = (a: [number, number, number], dy: number): [number, number, number] => [a[0], a[1] - dy, a[2]];
const MUG0 = sub(fk(REACH), MUG_OFF), HANG = sub(fk(PLACE), MUG_OFF), TABLE_Y = MUG0[1] - 0.25;
const PromptRobot: React.FC = () => {
  const t = useT(), sp = useSp();
  const prompt = 'Hang the mug on the mug hook', n = Math.floor(interpolate(t, [0.45, 1.5], [0, prompt.length], clamp));
  const press = interpolate(t, [1.75, 1.85, 2.0], [1, 0.9, 1], clamp), running = t > 1.85;
  const pose = poseAt(KEYS, t), mug = t < T_GRAB ? MUG0 : t < T_DROP ? sub(fk(pose), MUG_OFF) : HANG;
  const done = sp(5.5, 'pop'), card = sp(0, 'soft');
  const hx = HANG[0] * 1.32, hz = HANG[2] * 1.32;
  return (
    <Paper>
      <div style={{position: 'absolute', left: 80, right: 80, top: 150}}>
        <Label text="ROBOT PLAYGROUND" />
        <div style={{marginTop: 14}}><Head words="Prompt a robot." mark={['robot']} size={110} /></div>
      </div>
      {/* prompt box */}
      <div style={{position: 'absolute', left: 70, right: 70, top: 420, transform: `translateY(${(1 - card) * 120}px)`, opacity: card}}>
        <div style={{background: '#fff', borderRadius: 36, padding: '26px 30px', display: 'flex', alignItems: 'center', gap: 22, boxShadow: '0 20px 50px rgba(120,80,10,0.16)', border: `4px solid ${running ? '#fff' : YEL}`}}>
          <div style={{flex: 1, ...SANS(500), fontSize: 44, color: INK, minHeight: 54}}>{prompt.slice(0, n)}{!running && <span style={{display: 'inline-block', width: 4, height: 48, background: INK, verticalAlign: 'middle', marginLeft: 4, opacity: Math.floor(t * 4) % 2 ? 0 : 1}} />}</div>
          <div style={{transform: `scale(${press})`, background: running ? ORANGE : INK, color: running ? INK : '#fff', borderRadius: 999, padding: '18px 30px', ...SANS(700), fontSize: 36, whiteSpace: 'nowrap'}}>{running ? 'Running…' : 'Take a turn →'}</div>
        </div>
      </div>
      {/* 3D */}
      <AbsoluteFill style={{top: 600}}>
        <ThreeCanvas width={W} height={1320} camera={{position: [0.2, 4.6, 7.4], fov: 38}}>
          <LookAt target={[0, 1.15, -1.3]} /><DLights />
          <mesh position={[0, TABLE_Y - 0.12, -1.2]}><boxGeometry args={[8, 0.24, 6.5]} /><meshStandardMaterial color="#FDEFB4" roughness={0.8} /></mesh>
          <RobotArm pose={pose} />
          <Mug position={mug} />
          {/* mug hook stand */}
          <mesh position={[hx, (TABLE_Y + HANG[1] + 0.55) / 2, hz]}><cylinderGeometry args={[0.07, 0.07, HANG[1] + 0.55 - TABLE_Y, 16]} /><meshStandardMaterial color="#8A5A3B" /></mesh>
          <mesh position={[hx, TABLE_Y + 0.05, hz]}><cylinderGeometry args={[0.38, 0.42, 0.1, 24]} /><meshStandardMaterial color="#8A5A3B" /></mesh>
          <mesh position={[(hx + HANG[0]) / 2, HANG[1] + 0.3, (hz + HANG[2]) / 2]} rotation={[0, -Math.atan2(HANG[2] - hz, HANG[0] - hx), Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, Math.hypot(HANG[0] - hx, HANG[2] - hz), 12]} /><meshStandardMaterial color="#8A5A3B" /></mesh>
        </ThreeCanvas>
      </AbsoluteFill>
      <div style={{position: 'absolute', bottom: 150, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{transform: `scale(${done})`, background: INK, color: '#fff', borderRadius: 999, padding: '22px 40px', ...SANS(700), fontSize: 44}}>✓ Mug hung. Task done.</div>
      </div>
    </Paper>
  );
};

// ---------- S4 real robots or simulation (13.4–17.4) ----------
const RealOrSim: React.FC = () => {
  const t = useT(), sp = useSp(), l = sp(0.35, 'soft'), r = sp(0.55, 'soft');
  const simPose: Pose = {yaw: t * 0.8, a1: 0.5 + Math.sin(t * 2) * 0.25, a2: 0.8 + Math.sin(t * 2.4) * 0.3, a3: 0.7, grip: 0.5 + 0.5 * Math.sin(t * 5)};
  return (
    <Paper>
      <div style={{position: 'absolute', left: 80, right: 80, top: 150}}><Label text="REAL ROBOTS + SIMULATION" /><div style={{marginTop: 14}}><Head words="Real robots, or the simulator." mark={['simulator']} size={96} /></div></div>
      <div style={{position: 'absolute', left: 60, right: 60, top: 560, display: 'flex', flexDirection: 'column', gap: 40}}>
        <div style={{transform: `translateX(${(1 - l) * -900}px)`}}>
          <div style={{...MONO, fontSize: 28, color: INK, marginBottom: 14}}>REAL ROBOTS</div>
          <div style={{height: 470, borderRadius: 36, overflow: 'hidden', position: 'relative', boxShadow: '0 24px 50px rgba(120,60,20,0.25)'}}>
            <Img src={staticFile('dl_sunset_wide.png')} style={{position: 'absolute', height: '100%', left: -interpolate(t, [0, 4], [0, 400])}} />
            <Img src={staticFile('robot_arms.png')} style={{position: 'absolute', right: 30, bottom: 20, height: 330, borderRadius: 20, border: '6px solid #fff'}} />
            <div style={{position: 'absolute', left: 30, bottom: 30, background: INK, color: '#fff', borderRadius: 999, padding: '16px 28px', ...SANS(700), fontSize: 34}}>Take a turn →</div>
          </div>
        </div>
        <div style={{transform: `translateX(${(1 - r) * 900}px)`}}>
          <div style={{...MONO, fontSize: 28, color: INK, marginBottom: 14}}>SIMULATION</div>
          <div style={{height: 470, borderRadius: 36, overflow: 'hidden', position: 'relative', background: 'radial-gradient(90% 90% at 50% 40%, #3A3328, #15130F)', boxShadow: '0 24px 50px rgba(40,30,10,0.35)'}}>
            <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,212,59,0.12) 2px, transparent 2px), linear-gradient(90deg, rgba(255,212,59,0.12) 2px, transparent 2px)', backgroundSize: '48px 48px'}} />
            <ThreeCanvas width={960} height={470} camera={{position: [4.5, 3.4, 6], fov: 36}}><LookAt target={[0, 1.6, 0]} /><DLights /><RobotArm pose={simPose} body={YEL} joint="#FFE58A" accent="#fff" wire eyes={false} /></ThreeCanvas>
            <div style={{position: 'absolute', right: 30, bottom: 30, background: ORANGE, color: INK, borderRadius: 999, padding: '16px 28px', ...SANS(700), fontSize: 34}}>Open Sandbox →</div>
          </div>
        </div>
      </div>
    </Paper>
  );
};

// ---------- S5 pick your arm (17.4–21.0): the arm types listed on the site, all in the same tabletop setup ----------
const ARMS = ['arm_yam.png', 'arm_rebot.png', 'arm_so101.png', 'arm_widowx.png'];
const AnyBody: React.FC = () => {
  const t = useT(), sp = useSp();
  return (
    <Paper>
      <div style={{position: 'absolute', left: 80, right: 80, top: 150}}><Label text="BUILT-IN AND CUSTOM BODIES" /><div style={{marginTop: 14}}><Head words="Pick your arm. Same tasks." mark={['arm']} size={100} /></div></div>
      <div style={{position: 'absolute', left: 40, right: 40, top: 470, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24}}>
        {ARMS.map((src, i) => { const k = sp(0.2 + i * 0.14, 'pop'), bob = Math.sin(t * 2 + i) * 5;
          return (
            <div key={src} style={{transform: `translateY(${(1 - k) * 160 + bob}px) scale(${0.85 + 0.15 * k})`, opacity: Math.min(1, k * 1.5), borderRadius: 30, overflow: 'hidden', background: '#FCEEB2', boxShadow: '0 18px 40px rgba(120,80,10,0.2)', border: '5px solid #fff'}}>
              <Img src={staticFile(src)} style={{width: '100%', height: 470, objectFit: 'cover', objectPosition: '50% 60%', display: 'block'}} />
            </div>
          ); })}
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, bottom: 170}}><Head words="Built-in robots, or bring your own." mark={['own']} delay={1.0} size={66} /></div>
    </Paper>
  );
};

// ---------- S6 end (21–25) ----------
const End: React.FC = () => {
  const t = useT(), sp = useSp(), logo = sp(0.1, 'pop'), b1 = sp(1.3, 'pop'), b2 = sp(1.45, 'pop'), fade = interpolate(t, [3.55, 4.0], [0, 1], clamp);
  return (
    <Paper>
      <div style={{position: 'absolute', left: 40, right: 40, top: 150, height: 560, borderRadius: 44, overflow: 'hidden', boxShadow: '0 30px 60px rgba(120,60,20,0.25)'}}>
        <Img src={staticFile('dl_sunset_wide.png')} style={{position: 'absolute', height: '100%', left: -interpolate(t, [0, 4], [200, 700])}} />
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}><div style={{transform: `scale(${logo})`, filter: 'drop-shadow(0 0 18px rgba(255,240,215,0.8))'}}><Logo width={820} /></div></AbsoluteFill>
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 820}}><Head words="Prompt a robot. Make your dreams come true." mark={['dreams']} delay={0.45} size={100} /></div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 1420, display: 'flex', flexDirection: 'column', gap: 26}}>
        <div style={{transform: `scale(${b1})`, transformOrigin: 'left center', alignSelf: 'flex-start', background: ORANGE, color: INK, borderRadius: 999, padding: '26px 46px', ...SANS(700), fontSize: 48}}>Try out Dream API</div>
        <div style={{transform: `scale(${b2})`, transformOrigin: 'left center', alignSelf: 'flex-start', background: INK, color: '#fff', borderRadius: 999, padding: '26px 46px', ...SANS(700), fontSize: 48}}>Open Robot Playground</div>
      </div>
      <Blob x={900} y={1500} s={60} color="#7ED9A0" kind={1} phase={0.3} /><Blob x={960} y={1720} s={46} color="#8EC5FF" kind={2} phase={1.5} /><Blob x={760} y={1780} s={52} color={ORANGE} kind={0} phase={2.6} eyes="#fff" />
      <AbsoluteFill style={{background: CREAM, opacity: fade}} />
    </Paper>
  );
};

export const DL_SCENES: [React.FC, number, number][] = [[Intro, 0, 3.2], [MeetDream, 3.2, 6.4], [PromptRobot, 6.4, 13.4], [RealOrSim, 13.4, 17.4], [AnyBody, 17.4, 21.0], [End, 21.0, 25.0]];
export const DreamExplainer: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: CREAM}}>
      {DL_SCENES.map(([S, a, b], i) => <Sequence key={i} from={Math.round(a * fps)} durationInFrames={Math.round((b - a) * fps)}><S /></Sequence>)}
      {[3.2, 6.4, 13.4, 17.4, 21.0].map((a) => <Wipe key={a} at={a} />)}
    </AbsoluteFill>
  );
};
