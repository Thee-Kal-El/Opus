// 3D pieces for the Gibwork explainer (three.js via @remotion/three): voxel logo, USDC-style coin, coin burst, reward vault.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {random, spring, useVideoConfig} from 'remotion';

export const PUR = '#8151FD', PUR2 = '#A98BFF', DEEP = '#1E0B5C', GRN = '#139A6B', GRN2 = '#1FD18E', USDC = '#2775CA';
// Gibwork's pixel "W" glyph as rects [x, y, w, h] on a 6 × 7.5 grid (y down)
export const GLYPH: [number, number, number, number][] = [[0, 0, 1, 6.5], [5, 0, 1, 6.5], [2.5, 3.3, 1, 2.3], [2, 5.6, 2, 0.9], [1, 6.5, 1, 1], [4, 6.5, 1, 1]];

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
          <mesh key={i} position={[v.x, v.y + (1 - k) * 4.5, 0]} scale={[v.w * 0.96 * s, v.h * 0.96 * s, 0.96 * s]}>
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
