// Thee_Kal_El cartoon host: an original flat-vector character drawn from his photo
// (backwards gray snapback, rectangular glasses, mustache + goatee, black tee with a light-blue QR print, wood watch).
// Animatable: talking mouth, blinks, brows, pointing arm, head tilt.
import React from 'react';
import QR from './qr.json';   // https://youtube.com/@thee_kal_el (29×29, ECC M)

const SKIN = '#E3A884', SKIN_D = '#C98A66', HAIR = '#2A1D15', CAP = '#8D9197', CAP_D = '#3A3E45', TEE = '#16171B', PRINT = '#A4DCEA', FRAME = '#1C1E23';

// QR modules as one path: 29 modules + 2-module quiet zone each side, inside the 174 px print
const QS = 174 / (QR.length + 4);
const QR_PATH = (QR as string[]).flatMap((row, y) => [...row].map((c, x) => (c === '1' ? `M${213 + (x + 2) * QS} ${514 + (y + 2) * QS}h${QS + 0.3}v${QS + 0.3}h${-QS - 0.3}z` : ''))).join('');

export type AvatarPose = {
  mouth: number;    // 0 closed smile … 1 wide open
  blink: number;    // 0 open … 1 shut
  brow: number;     // -1 frown … 0 neutral … 1 raised (surprise)
  arm: number;      // shoulder rotation in degrees: 172 = resting, ~20 = pointing up-right
  tilt: number;     // head tilt in degrees
};

export const KalAvatar: React.FC<{pose: AvatarPose; width?: number; style?: React.CSSProperties}> = ({pose, width = 560, style}) => {
  const {mouth, blink, brow, arm, tilt} = pose;
  const eyeY = 268, by = 232 - brow * 10;
  const lip = 352 + mouth * 34;                     // lower lip depth
  return (
    <svg viewBox="0 0 600 760" width={width} style={{overflow: 'visible', ...style}}>
      {/* pointing arm (behind the torso when resting) */}
      <g transform={`translate(452 500) rotate(${arm})`}>
        <rect x={-36} y={-96} width={72} height={110} rx={30} fill={TEE} />
        <rect x={-25} y={-232} width={50} height={160} rx={24} fill={SKIN} />
        <rect x={-28} y={-222} width={56} height={18} rx={6} fill="#8A5A3B" />
        <circle cx={0} cy={-213} r={11} fill="#E9E1D2" stroke="#6E452C" strokeWidth={3} />
        <circle cx={0} cy={-250} r={33} fill={SKIN} />
        <rect x={-9} y={-326} width={19} height={70} rx={9.5} fill={SKIN} />
        <path d="M-28 -246 q14 10 30 2" stroke={SKIN_D} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
      {/* torso + tee */}
      <path d="M86 780 L106 548 Q118 470 214 450 L386 450 Q482 470 494 548 L514 780 Z" fill={TEE} />
      <rect x={258} y={392} width={84} height={80} rx={20} fill={SKIN_D} />
      <path d="M244 452 Q300 500 356 452" fill={SKIN_D} />
      {/* shirt print: a real, scannable QR code for youtube.com/@thee_kal_el */}
      <rect x={213} y={514} width={174} height={174} rx={4} fill={PRINT} />
      <path d={QR_PATH} fill={TEE} />
      {/* mic clip */}
      <rect x={282} y={474} width={36} height={44} rx={8} fill="#0B0B0D" />
      {/* head */}
      <g transform={`rotate(${tilt} 300 330)`}>
        <ellipse cx={182} cy={276} rx={19} ry={30} fill={SKIN_D} />
        <ellipse cx={418} cy={276} rx={19} ry={30} fill={SKIN_D} />
        <ellipse cx={300} cy={262} rx={120} ry={140} fill={SKIN} />
        {/* sideburns */}
        <path d="M184 230 L198 230 L196 292 Q186 280 184 262 Z M416 230 L402 230 L404 292 Q414 280 416 262 Z" fill={HAIR} />
        {/* backwards snapback */}
        <path d="M176 236 Q172 104 300 96 Q428 104 424 236 Q300 206 176 236 Z" fill={CAP} />
        <path d="M206 140 Q300 108 394 140" stroke="#7B7F85" strokeWidth={6} fill="none" />
        <path d="M180 232 Q300 200 420 232" stroke={CAP_D} strokeWidth={24} fill="none" strokeLinecap="round" />
        <rect x={262} y={186} width={76} height={30} rx={12} fill="#24272D" />
        <path d="M270 210 Q300 196 330 210" stroke={HAIR} strokeWidth={10} fill="none" strokeLinecap="round" />
        {/* brows */}
        <path d={`M232 ${by + 4} Q260 ${by - 8} 288 ${by + 2}`} stroke={HAIR} strokeWidth={9} fill="none" strokeLinecap="round" />
        <path d={`M312 ${by + 2} Q340 ${by - 8} 368 ${by + 4}`} stroke={HAIR} strokeWidth={9} fill="none" strokeLinecap="round" />
        {/* eyes (blink by squashing) */}
        <g transform={`translate(0 ${eyeY}) scale(1 ${1 - 0.9 * blink}) translate(0 ${-eyeY})`}>
          <circle cx={262} cy={eyeY} r={8.5} fill="#1E1A17" />
          <circle cx={338} cy={eyeY} r={8.5} fill="#1E1A17" />
          <circle cx={265} cy={eyeY - 3} r={2.6} fill="#fff" />
          <circle cx={341} cy={eyeY - 3} r={2.6} fill="#fff" />
        </g>
        {/* glasses */}
        <rect x={226} y={244} width={66} height={48} rx={10} fill="rgba(120,190,255,0.16)" stroke={FRAME} strokeWidth={7} />
        <rect x={308} y={244} width={66} height={48} rx={10} fill="rgba(120,190,255,0.16)" stroke={FRAME} strokeWidth={7} />
        <path d="M292 262 Q300 256 308 262 M226 258 L186 252 M374 258 L414 252" stroke={FRAME} strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d="M236 252 L250 252 M318 252 L332 252" stroke="#fff" strokeWidth={4} opacity={0.6} strokeLinecap="round" />
        {/* nose */}
        <path d="M300 286 Q292 314 304 318" stroke={SKIN_D} strokeWidth={6} fill="none" strokeLinecap="round" />
        {/* mouth: dark opening + teeth, depth follows `mouth` */}
        <path d={`M262 344 Q300 ${lip} 338 344 Q300 352 262 344 Z`} fill="#5B1F22" />
        <path d={`M268 346 Q300 ${352 + Math.min(mouth, 0.4) * 22} 332 346 Q300 351 268 346 Z`} fill="#fff" />
        {/* mustache + goatee */}
        <path d="M246 340 Q272 318 300 330 Q328 318 354 340 Q330 334 300 340 Q270 334 246 340 Z" fill={HAIR} />
        <path d={`M276 ${lip + 14} Q300 ${lip + 52} 324 ${lip + 14} Q300 ${lip + 26} 276 ${lip + 14} Z`} fill={HAIR} />
        <path d={`M292 ${lip + 4} L308 ${lip + 4} L304 ${lip + 14} L296 ${lip + 14} Z`} fill={HAIR} />
      </g>
    </svg>
  );
};
