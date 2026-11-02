// 3D robot arm (three.js) for the DreamLabs explainer: yaw base + 3-joint planar chain + 2-finger gripper, with forward kinematics
// so held objects follow the gripper exactly.
import React from 'react';

export type Pose = {yaw: number; a1: number; a2: number; a3: number; grip: number}; // grip 0 open … 1 closed
export const ARM = {baseH: 0.7, L1: 1.7, L2: 1.45, L3: 0.55};
export const lerpPose = (a: Pose, b: Pose, k: number): Pose => ({yaw: a.yaw + (b.yaw - a.yaw) * k, a1: a.a1 + (b.a1 - a.a1) * k, a2: a.a2 + (b.a2 - a.a2) * k, a3: a.a3 + (b.a3 - a.a3) * k, grip: a.grip + (b.grip - a.grip) * k});
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** keyframes [time, pose]; returns the eased pose at t */
export const poseAt = (keys: [number, Pose][], t: number): Pose => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) { const [t0, p0] = keys[i], [t1, p1] = keys[i + 1]; if (t <= t1) return lerpPose(p0, p1, ease((t - t0) / (t1 - t0))); }
  return keys[keys.length - 1][1];
};
/** world position of the fingertip centre */
export const fk = (p: Pose): [number, number, number] => {
  const {baseH, L1, L2, L3} = ARM, s1 = p.a1, s2 = p.a1 + p.a2, s3 = s2 + p.a3;
  const r = L1 * Math.sin(s1) + L2 * Math.sin(s2) + L3 * Math.sin(s3), y = baseH + L1 * Math.cos(s1) + L2 * Math.cos(s2) + L3 * Math.cos(s3);
  return [r * Math.cos(p.yaw), y, -r * Math.sin(p.yaw)];
};

export const RobotArm: React.FC<{pose: Pose; body?: string; joint?: string; accent?: string; wire?: boolean; eyes?: boolean}> = ({pose, body = '#F4EFE3', joint = '#2A2A2E', accent = '#FFD43B', wire = false, eyes = true}) => {
  const {baseH, L1, L2, L3} = ARM;
  const M = (c: string, rough = 0.45) => <meshStandardMaterial color={c} roughness={rough} metalness={0.15} wireframe={wire} />;
  const fingerX = 0.08 + 0.14 * (1 - pose.grip);
  return (
    <group>
      <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.85, 0.95, 0.24, 48]} />{M(joint, 0.6)}</mesh>
      <group rotation={[0, pose.yaw, 0]}>
        <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.55, 0.65, 0.5, 40]} />{M(body)}</mesh>
        {eyes && !wire && <group position={[0.56, 0.47, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-0.13, 0, 0]}><sphereGeometry args={[0.06, 16, 16]} /><meshStandardMaterial color="#151515" /></mesh>
          <mesh position={[0.13, 0, 0]}><sphereGeometry args={[0.06, 16, 16]} /><meshStandardMaterial color="#151515" /></mesh>
        </group>}
        <group position={[0, baseH, 0]} rotation={[0, 0, -pose.a1]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.3, 0.3, 0.62, 32]} />{M(joint, 0.5)}</mesh>
          <mesh position={[0, L1 / 2, 0]}><boxGeometry args={[0.36, L1, 0.36]} />{M(body)}</mesh>
          <mesh position={[0, L1 / 2, 0.19]}><boxGeometry args={[0.12, L1 * 0.7, 0.02]} />{M(accent, 0.3)}</mesh>
          <group position={[0, L1, 0]} rotation={[0, 0, -pose.a2]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.25, 0.25, 0.54, 32]} />{M(joint, 0.5)}</mesh>
            <mesh position={[0, L2 / 2, 0]}><boxGeometry args={[0.3, L2, 0.3]} />{M(body)}</mesh>
            <group position={[0, L2, 0]} rotation={[0, 0, -pose.a3]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.19, 0.19, 0.44, 32]} />{M(joint, 0.5)}</mesh>
              <mesh position={[0, 0.16, 0]}><boxGeometry args={[0.46, 0.14, 0.26]} />{M(accent, 0.35)}</mesh>
              <mesh position={[-fingerX, 0.38, 0]}><boxGeometry args={[0.07, 0.36, 0.2]} />{M(joint, 0.5)}</mesh>
              <mesh position={[fingerX, 0.38, 0]}><boxGeometry args={[0.07, 0.36, 0.2]} />{M(joint, 0.5)}</mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

/** coffee mug (upright) */
export const Mug: React.FC<{position: [number, number, number]; color?: string; rotY?: number}> = ({position, color = '#FF9AA8', rotY = 0}) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <mesh><cylinderGeometry args={[0.26, 0.23, 0.5, 32]} /><meshStandardMaterial color={color} roughness={0.35} /></mesh>
    <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.2, 0.035, 12, 32]} /><meshStandardMaterial color="#5A3A2A" /></mesh>
    <mesh position={[0.3, 0, 0]}><torusGeometry args={[0.12, 0.04, 12, 24]} /><meshStandardMaterial color={color} roughness={0.35} /></mesh>
  </group>
);

export const DLights: React.FC = () => (
  <>
    <ambientLight intensity={0.75} />
    <directionalLight position={[5, 8, 6]} intensity={2.2} color="#FFF4DD" />
    <directionalLight position={[-6, 3, 4]} intensity={0.8} color="#FFC08A" />
  </>
);
