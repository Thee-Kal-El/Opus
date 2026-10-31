// Part 2 props: how to join Kal's OPEN//77 server, one animated prop per step (times are local to each step).
import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MONO, SANS, WIDE} from '../fonts';
import {Pop, SPRINGS, Sparks, TypeOn} from '../kit/motion';

const INK = '#1B1B1F', ACCENT = '#C2502E', YL = '#F3DF00', CY = '#22D8F0', OK = '#2FB86B';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const card: React.CSSProperties = {borderRadius: 22, background: '#14161C', boxShadow: '0 40px 80px rgba(40,30,10,0.28)', overflow: 'hidden'};
const mono = (size: number, color = '#EDEAE2'): React.CSSProperties => ({...MONO, fontSize: size, color, letterSpacing: '0.03em', textTransform: 'none', fontWeight: 500});

const Window: React.FC<{title: string; width?: number; children: React.ReactNode}> = ({title, width = 860, children}) => (
  <div style={{...card, width}}>
    <div style={{display: 'flex', gap: 12, padding: '18px 24px', background: '#1E2028', alignItems: 'center'}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
      <div style={{...mono(18, '#7D8190'), marginLeft: 14}}>{title}</div>
    </div>
    <div style={{padding: '30px 34px 36px'}}>{children}</div>
  </div>
);
const Bar: React.FC<{p: number; color?: string}> = ({p, color = YL}) => (
  <div style={{height: 16, borderRadius: 8, background: '#2A2D36', overflow: 'hidden'}}><div style={{height: '100%', width: `${p * 100}%`, background: color, borderRadius: 8}} /></div>
);
const Check: React.FC<{text: string; delay: number; color?: string}> = ({text, delay, color = OK}) => (
  <Pop delay={delay} cfg="bouncy" style={{transformOrigin: 'left center', display: 'inline-flex'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16, background: color, borderRadius: 14, padding: '12px 22px'}}>
      <span style={{...SANS, fontSize: 34, color: '#fff'}}>✓</span><span style={{...SANS, fontSize: 32, color: '#fff', fontWeight: 600}}>{text}</span>
    </div>
  </Pop>
);

/** Title: the six steps preview */
export const P2Title: React.FC = () => (
  <div style={{display: 'flex', gap: 22}}>
    {[1, 2, 3, 4, 5, 6].map((n, i) => (
      <Pop key={n} delay={0.35 + i * 0.09} cfg="bouncy">
        <div style={{width: 120, height: 120, borderRadius: 60, background: i === 3 ? YL : '#fff', boxShadow: '0 14px 30px rgba(40,30,10,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...WIDE, fontSize: 52, color: INK}}>{n}</div>
      </Pop>
    ))}
  </div>
);

/** 1 — licensed copy */
export const P2Game: React.FC = () => (
  <div style={{...card, width: 820, display: 'flex', alignItems: 'center', gap: 30, padding: 30}}>
    <div style={{width: 190, height: 250, borderRadius: 14, background: `linear-gradient(160deg, ${YL} 0%, #E9B800 45%, ${CY} 100%)`, display: 'flex', alignItems: 'flex-end', padding: 16, boxSizing: 'border-box'}}>
      <div style={{...WIDE, fontSize: 44, color: INK, lineHeight: 0.9}}>2077</div>
    </div>
    <div style={{flex: 1}}>
      <div style={{...mono(20, '#7D8190')}}>YOUR LIBRARY</div>
      <div style={{...WIDE, fontSize: 46, color: '#fff', marginTop: 10, lineHeight: 1.05}}>CYBERPUNK 2077</div>
      <div style={{marginTop: 24}}><Check text="Licensed copy" delay={0.9} /></div>
    </div>
  </div>
);

/** 2 — download from open2077.net */
export const P2Download: React.FC = () => {
  const t = useT();
  const p = interpolate(t, [1.1, 1.9], [0, 1], clamp);
  return (
    <Window title="browser">
      <div style={{background: '#22252E', borderRadius: 12, padding: '16px 22px'}}><TypeOn text="open2077.net" delay={0.25} cps={22} cursor={ACCENT} style={mono(30)} /></div>
      <div style={{display: 'flex', alignItems: 'center', gap: 26, marginTop: 30}}>
        <Pop delay={0.75} cfg="snappy"><div style={{...WIDE, fontSize: 30, color: INK, background: YL, padding: '18px 30px', transform: 'skewX(-12deg)'}}>DOWNLOAD LAUNCHER</div></Pop>
        <div style={{flex: 1}}><Bar p={p} /><div style={{...mono(20, '#9AA0B0'), marginTop: 10}}>{p < 1 ? `downloading… ${Math.round(p * 100)}%` : 'done ✓'}</div></div>
      </div>
    </Window>
  );
};

/** 3 — finds + verifies the game */
export const P2Scan: React.FC = () => {
  const t = useT();
  const p = interpolate(t, [0.35, 1.25], [0, 1], clamp);
  return (
    <Window title="OPEN//77 launcher">
      <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <div style={{width: 40, height: 40, borderRadius: 20, border: `6px solid #2A2D36`, borderTopColor: CY, transform: `rotate(${t * 540}deg)`, opacity: p < 1 ? 1 : 0}} />
        <div style={mono(28)}>{p < 1 ? 'searching for Cyberpunk 2077…' : 'Cyberpunk2077.exe'}</div>
      </div>
      <div style={{marginTop: 24}}><Bar p={p} color={CY} /></div>
      <div style={{marginTop: 28, display: 'flex', gap: 16, flexWrap: 'wrap'}}><Check text="Game found" delay={1.3} /><Check text="Verified" delay={1.5} /></div>
    </Window>
  );
};

/** 4 — server list, MILITECH (mine) gets picked */
export const P2Servers: React.FC = () => {
  const t = useT(), {fps} = useVideoConfig();
  const pick = spring({frame: Math.round((t - 0.9) * fps), fps, config: SPRINGS.snappy});
  const rows: [string, string, string][] = [['Night City Freeroam', 'FREEROAM', '12/64'], ['MILITECH', 'ROLEPLAY', 'MINE'], ['Badlands Racing', 'RACING', '4/32']];
  return (
    <Window title="OPEN//77 · servers">
      <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
        {rows.map(([name, tag, right], i) => {
          const mine = i === 1;
          return (
            <div key={name} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px', borderRadius: 12, background: mine ? `rgba(243,223,0,${0.14 * pick})` : '#1B1D24', border: `3px solid ${mine ? `rgba(243,223,0,${pick})` : '#262933'}`, transform: mine ? `scale(${1 + 0.04 * pick})` : undefined}}>
              {mine ? <Img src={staticFile('militech_icon_256.png')} style={{width: 56, height: 56, borderRadius: 8}} /> : <div style={{width: 56, height: 56, borderRadius: 8, background: '#2A2D36'}} />}
              <div style={{flex: 1}}><div style={{...WIDE, fontSize: 26, color: '#fff'}}>{name}</div><div style={mono(16, '#8A90A0')}>{tag}</div></div>
              {mine ? <Pop delay={1.05} cfg="bouncy"><div style={{...WIDE, fontSize: 24, color: INK, background: YL, padding: '8px 16px', transform: 'skewX(-12deg)'}}>MINE!</div></Pop> : <div style={mono(20, '#8A90A0')}>{right}</div>}
            </div>
          );
        })}
      </div>
    </Window>
  );
};

/** 5 — connect + mods download */
export const P2Connect: React.FC = () => {
  const t = useT();
  const press = interpolate(t, [0.45, 0.55, 0.7], [1, 0.9, 1], clamp);
  const mods: [string, number][] = [['server resources', 0.75], ['maps & props', 0.95], ['vehicle pack', 1.15]];
  return (
    <Window title="OPEN//77 · MILITECH">
      <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
        <Img src={staticFile('militech_icon_256.png')} style={{width: 84, height: 84, borderRadius: 10}} />
        <div style={{flex: 1, ...WIDE, fontSize: 40, color: '#fff'}}>MILITECH</div>
        <div style={{...WIDE, fontSize: 30, color: INK, background: YL, padding: '16px 28px', transform: `skewX(-12deg) scale(${press})`}}>CONNECT</div>
      </div>
      <div style={{marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16}}>
        {mods.map(([m, d]) => {
          const p = interpolate(t, [d, d + 0.6], [0, 1], clamp);
          return <div key={m} style={{opacity: interpolate(t, [d - 0.1, d], [0, 1], clamp)}}><div style={{display: 'flex', justifyContent: 'space-between', ...mono(20, '#B9BECC'), marginBottom: 8}}><span>{m}</span><span>{p < 1 ? `${Math.round(p * 100)}%` : '✓'}</span></div><Bar p={p} color={p < 1 ? CY : OK} /></div>;
        })}
      </div>
    </Window>
  );
};

/** 6 — loaded in: welcome to MILITECH */
export const P2LoadIn: React.FC = () => {
  const t = useT();
  const p = interpolate(t, [0.2, 0.9], [0, 1], clamp);
  return (
    <div style={{position: 'relative', width: 880}}>
      <div style={{...card, width: 880}}>
        <Img src={staticFile('militech_banner_1200x400.jpg')} style={{width: 880, display: 'block'}} />
        <div style={{padding: '24px 30px 30px'}}>
          <div style={{...mono(20, '#9AA0B0'), marginBottom: 10}}>{p < 1 ? 'loading into server…' : 'connected ✓'}</div>
          <Bar p={p} />
        </div>
      </div>
      <Pop delay={1.0} cfg="slam" style={{marginTop: 34, textAlign: 'center'}}>
        <div style={{...WIDE, fontSize: 52, color: INK}}>WELCOME TO <span style={{background: YL, padding: '0 14px'}}>MILITECH</span></div>
      </Pop>
      <Sparks at={1.0} x={440} y={420} colors={[YL, ACCENT, CY]} count={34} seed="mt" />
    </div>
  );
};
