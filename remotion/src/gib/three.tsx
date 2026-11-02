// 3D pieces for the Gibwork explainer (three.js via @remotion/three): voxel logo, USDC-style coin, coin burst, reward vault.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {random, spring, useVideoConfig} from 'remotion';

export const PUR = '#8151FD', PUR2 = '#A98BFF', DEEP = '#1E0B5C', GRN = '#139A6B', GRN2 = '#1FD18E', USDC = '#2775CA';
// Gibwork's pixel "W" glyph as rects [x, y, w, h] on a 6 × 7.5 grid (y down)
export const GLYPH: [number, number, number, number][] = [[0, 0, 1, 7.5], [5, 0, 1, 7.5], [2.5, 3.0, 1, 3.5], [1, 6.5, 4, 1]]; // one connected W: two side bars + middle stem, joined by a bottom bar

// voxelise the glyph into unit-ish cubes
const VOXELS = (() => {
  const v: {x: number; y: number; h: number; w: number}[] = [];
  for (const [gx, gy, gw, gh] of GLYPH) for (let cx = 0; cx < gw - 0.01; cx += 1) for (let cy = 0; cy < gh - 0.01; cy += 1) {
    const w = Math.min(1, gw - cx), h = Math.min(1, gh - cy);
    v.push({x: gx + cx + w / 2 - 3, y: -(gy + cy + h / 2 - 3.75), w, h});
  }
  return v;
})();

/** Voxel logo: cubes drop in one after another (bottom row first), land with a small bounce and lock together. `t` = local seconds. */
const ORDER = VOXELS.map((v, i) => ({v, i})).sort((a, b) => a.v.y - b.v.y || a.v.x - b.v.x);
export const VoxelLogo: React.FC<{t: number; start?: number; color?: string; scale?: number}> = ({t, start = 0, color = '#FFFFFF', scale = 1}) => {
  const {fps} = useVideoConfig();
  return (
    <group scale={scale}>
      {ORDER.map(({v, i}, n) => {
        const at = start + n * 0.045;
        const k = spring({frame: Math.round((t - at) * fps), fps, config: {damping: 14, stiffness: 170, mass: 0.7}});
        if (k <= 0.001) return null;
        const s = Math.min(1, k * 1.4);
        return (
          <mesh key={i} position={[v.x, v.y + (1 - k) * 4.5, 0]} scale={[v.w * 1.002 * s, v.h * 1.002 * s, s]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} emissive={PUR} emissiveIntensity={0.08} />
          </mesh>
        );
      })}
    </group>
  );
};

// coin face texture: blue disc, white ring, "$"
const useCoinTexture = () => useMemo(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(200, 180, 40, 256, 256, 280); g.addColorStop(0, '#4C97F0'); g.addColorStop(1, USDC);
  c.fillStyle = g; c.beginPath(); c.arc(256, 256, 256, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 30; c.beginPath(); c.arc(256, 256, 175, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#fff'; c.font = '800 250px Geist, "Inter Tight", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', 256, 268);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx;
}, []);

/** A single coin. Faces the camera at rotation 0; spin = rotation around its vertical axis. */
export const Coin: React.FC<{position?: [number, number, number]; spin?: number; tilt?: number; scale?: number}> = ({position = [0, 0, 0], spin = 0, tilt = 0, scale = 1}) => {
  const tex = useCoinTexture();
  const rim = useMemo(() => new THREE.MeshStandardMaterial({color: '#1E5FA8', metalness: 0.6, roughness: 0.3}), []);
  const face = useMemo(() => new THREE.MeshStandardMaterial({map: tex, metalness: 0.25, roughness: 0.35}), [tex]);
  return (
    <group position={position} rotation={[tilt, spin, 0]} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={rim}><cylinderGeometry args={[1, 1, 0.16, 64, 1, true]} /></mesh>
      <mesh position={[0, 0, 0.081]} material={face}><circleGeometry args={[1, 64]} /></mesh>
      <mesh position={[0, 0, -0.081]} rotation={[0, Math.PI, 0]} material={face}><circleGeometry args={[1, 64]} /></mesh>
    </group>
  );
};

export const CoinBurst: React.FC<{t: number; at: number; count?: number; origin?: [number, number, number]; seed?: string; power?: number}> = ({t, at, count = 18, origin = [0, 0, 0], seed = 'cb', power = 1}) => {
  const dt = t - at; if (dt < 0) return null;
  return (
    <group>
      {Array.from({length: count}, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2, up = 4 + random(`${seed}u${i}`) * 5, out = (2 + random(`${seed}o${i}`) * 3) * power;
        const x = origin[0] + Math.cos(a) * out * dt, y = origin[1] + up * dt - 6 * dt * dt, z = origin[2] + Math.sin(a) * out * dt * 0.6 + 1;
        return <Coin key={i} position={[x, y, z]} spin={dt * (6 + random(`${seed}s${i}`) * 6)} tilt={dt * 3 * (random(`${seed}t${i}`) - 0.5)} scale={0.38 + random(`${seed}z${i}`) * 0.18} />;
      })}
    </group>
  );
};

/** Reward vault: a chunky purple box with a hinged lid; a coin drops in, the lid shuts, the lock light goes green. */
export const Vault: React.FC<{t: number}> = ({t}) => {
  const {fps} = useVideoConfig();
  const drop = Math.min(1, Math.max(0, (t - 0.55) / 0.55)), coinY = 4.2 - drop * drop * 4.9;
  const close = spring({frame: Math.round((t - 1.2) * fps), fps, config: {damping: 12, stiffness: 140}});
  const lid = -1.25 * (1 - close);
  const locked = t > 1.45;
  const body = <meshStandardMaterial color={PUR} roughness={0.35} metalness={0.35} />;
  return (
    <group rotation={[0.38, -0.55, 0]}>
      {/* walls + floor (open top) */}
      <mesh position={[0, -1.15, 0]}><boxGeometry args={[3.2, 0.3, 3.2]} />{body}</mesh>
      <mesh position={[0, 0, 1.45]}><boxGeometry args={[3.2, 2.3, 0.3]} />{body}</mesh>
      <mesh position={[0, 0, -1.45]}><boxGeometry args={[3.2, 2.3, 0.3]} />{body}</mesh>
      <mesh position={[1.45, 0, 0]}><boxGeometry args={[0.3, 2.3, 3.2]} />{body}</mesh>
      <mesh position={[-1.45, 0, 0]}><boxGeometry args={[0.3, 2.3, 3.2]} />{body}</mesh>
      {/* lid hinged at the back edge */}
      <group position={[0, 1.15, -1.6]} rotation={[lid, 0, 0]}>
        <mesh position={[0, 0.15, 1.6]}><boxGeometry args={[3.4, 0.3, 3.4]} /><meshStandardMaterial color={PUR2} roughness={0.3} metalness={0.4} /></mesh>
      </group>
      {/* lock light on the front */}
      <mesh position={[0, 0.15, 1.62]}><boxGeometry args={[0.9, 0.55, 0.06]} /><meshStandardMaterial color={locked ? GRN2 : '#2A1F55'} emissive={locked ? GRN2 : '#000'} emissiveIntensity={locked ? 0.9 : 0} /></mesh>
      {drop < 1 && <Coin position={[0, coinY, 0]} spin={t * 7} scale={0.7} />}
    </group>
  );
};

export const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.55} />
    <directionalLight position={[4, 6, 7]} intensity={2.2} />
    <directionalLight position={[-6, -2, 4]} intensity={0.8} color={PUR2} />
    <pointLight position={[0, 0, 6]} intensity={12} distance={20} color="#ffffff" />
  </>
);

/** 3D wallet: a soft-cornered purple bifold with a flap and a clasp. */
export const Wallet3D: React.FC<{open?: number}> = ({open = 0}) => (
  <group>
    <mesh><boxGeometry args={[2.6, 1.8, 0.7]} /><meshStandardMaterial color={PUR} roughness={0.5} metalness={0.15} /></mesh>
    <mesh position={[0, 0.98 + open * 0.15, -0.05]} rotation={[-0.25 - open * 0.5, 0, 0]}><boxGeometry args={[2.6, 0.4, 0.62]} /><meshStandardMaterial color={PUR2} roughness={0.5} /></mesh>
    <mesh position={[1.15, 0.1, 0.36]}><boxGeometry args={[0.7, 0.55, 0.06]} /><meshStandardMaterial color={DEEP} roughness={0.4} /></mesh>
    <mesh position={[1.15, 0.1, 0.4]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12, 0.12, 0.05, 24]} /><meshStandardMaterial color="#FFD43B" metalness={0.6} roughness={0.3} /></mesh>
  </group>
);

/** 3D smart contract: a tall slab with code lines and a lock badge that turns green once funded. */
export const Contract3D: React.FC<{funded: number}> = ({funded}) => {
  const lines = [0.9, 0.62, 0.78, 0.5, 0.7, 0.4];
  return (
    <group>
      <mesh><boxGeometry args={[2.3, 3.0, 0.35]} /><meshStandardMaterial color="#F7F5FF" roughness={0.4} /></mesh>
      <mesh position={[0, 1.32, 0.18]}><boxGeometry args={[2.3, 0.36, 0.03]} /><meshStandardMaterial color={DEEP} /></mesh>
      {lines.map((w, i) => <mesh key={i} position={[-0.95 + (w * 1.9) / 2, 0.85 - i * 0.28, 0.18]}><boxGeometry args={[w * 1.9, 0.09, 0.02]} /><meshStandardMaterial color={i % 2 ? PUR2 : '#B9B4CF'} /></mesh>)}
      <group position={[0, -1.0, 0.22]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.42, 0.42, 0.08, 40]} /><meshStandardMaterial color={funded > 0.5 ? GRN2 : '#CFCBE0'} emissive={funded > 0.5 ? GRN2 : '#000'} emissiveIntensity={0.5 * funded} /></mesh>
        <mesh position={[0, -0.05, 0.06]}><boxGeometry args={[0.36, 0.28, 0.05]} /><meshStandardMaterial color="#fff" /></mesh>
        <mesh position={[0, 0.09 - 0.05 * funded, 0.06]}><torusGeometry args={[0.12, 0.035, 10, 24, Math.PI]} /><meshStandardMaterial color="#fff" /></mesh>
      </group>
    </group>
  );
};

/** coins arc from the wallet into the contract, one after another. */
export const CoinTransfer: React.FC<{t: number; from: [number, number, number]; to: [number, number, number]; starts: number[]; dur?: number}> = ({t, from, to, starts, dur = 0.6}) => (
  <group>
    {starts.map((s, i) => { const k = (t - s) / dur; if (k <= 0 || k >= 1) return null; const e = k * k * (3 - 2 * k);
      const x = from[0] + (to[0] - from[0]) * e, y = from[1] + (to[1] - from[1]) * e + Math.sin(Math.PI * e) * 1.8, z = from[2] + (to[2] - from[2]) * e + Math.sin(Math.PI * e) * 0.8;
      return <Coin key={i} position={[x, y, z]} spin={k * 9} scale={0.42 * (1 - 0.3 * Math.max(0, (k - 0.8) / 0.2))} />; })}
  </group>
);
