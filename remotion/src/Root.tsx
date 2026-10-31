import React from 'react';
import {Composition} from 'remotion';
import {loadFonts} from './fonts';
import {KickTwitchCard} from './scenes/KickTwitchCard';
import {LogoSting} from './scenes/LogoSting';
import {KitShowcase} from './scenes/KitShowcase';
import {ExplainerReel} from './scenes/ExplainerReel';

export const Root: React.FC = () => {
  loadFonts();
  return (
    <>
      <Composition id="KickTwitchCard" component={KickTwitchCard} width={1080} height={1920} fps={60} durationInFrames={360} />
      <Composition id="LogoSting" component={LogoSting} width={1920} height={1080} fps={60} durationInFrames={240} />
      <Composition id="KitShowcase" component={KitShowcase} width={1920} height={1080} fps={60} durationInFrames={480} />
      <Composition id="ExplainerReel" component={ExplainerReel} width={1080} height={1920} fps={30} durationInFrames={420} />
    </>
  );
};
