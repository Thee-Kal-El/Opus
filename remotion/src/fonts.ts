// Brand fonts from ../fonts (copied into public/). Loaded once; rendering waits until they're ready.
import {continueRender, delayRender, staticFile} from 'remotion';

const FACES: [string, string, FontFaceDescriptors][] = [
  ['Archivo Wide', 'ArchivoWdth-italic.woff2', {style: 'italic', weight: '100 900', stretch: '62% 125%'}],
  ['Archivo Wide', 'ArchivoWdth-normal.woff2', {style: 'normal', weight: '100 900', stretch: '62% 125%'}],
  ['JetBrains Mono', 'JetBrainsMono.woff2', {weight: '100 800'}],
  ['Geist', 'Geist.woff2', {weight: '100 900'}],
];

let started = false;
export const loadFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender('Loading brand fonts');
  Promise.all(FACES.map(([family, file, desc]) => new FontFace(family, `url(${staticFile(file)}) format('woff2')`, desc).load().then((f) => document.fonts.add(f))))
    .then(() => continueRender(handle))
    .catch((e) => { console.error(e); continueRender(handle); });
};

// Wide heavy italic headline type (the OPEN//77 / thumbnail look)
export const WIDE: React.CSSProperties = {fontFamily: 'Archivo Wide', fontStyle: 'italic', fontWeight: 900, fontStretch: '125%', textTransform: 'uppercase'};
export const MONO: React.CSSProperties = {fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase'};
