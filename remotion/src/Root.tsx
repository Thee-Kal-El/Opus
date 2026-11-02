import React from 'react';
import {Composition} from 'remotion';
import {loadFonts} from './fonts';
import {KickTwitchCard} from './scenes/KickTwitchCard';
import {LogoSting} from './scenes/LogoSting';
import {KitShowcase} from './scenes/KitShowcase';
import {ExplainerReel, REEL_SECONDS} from './scenes/ExplainerReel';
import {DreamBG, DreamBG20, DreamCloudWipe, PosterFollow, DreamBG5Follow, DreamBG5FollowSides} from './scenes/DreamBG';
import {FollowCard} from './scenes/FollowCard';
import {GibExplainer} from './gib/GibExplainer';

export const Root: React.FC = () => {
  loadFonts();
  return (
    <>
      <Composition id="KickTwitchCard" component={KickTwitchCard} width={1080} height={1920} fps={60} durationInFrames={360} />
      <Composition id="LogoSting" component={LogoSting} width={1920} height={1080} fps={60} durationInFrames={240} />
      <Composition id="KitShowcase" component={KitShowcase} width={1920} height={1080} fps={60} durationInFrames={480} />
      <Composition id="ExplainerReel" component={ExplainerReel} width={1080} height={1920} fps={30} durationInFrames={REEL_SECONDS * 30} />
      <Composition id="DreamBG" component={DreamBG} width={1080} height={1920} fps={30} durationInFrames={300} />
      <Composition id="DreamBG20" component={DreamBG20} width={1080} height={1920} fps={30} durationInFrames={600} />
      <Composition id="FollowCard" component={FollowCard} width={1080} height={1920} fps={30} durationInFrames={150} />
      <Composition id="PosterFollow" component={PosterFollow} width={1080} height={1920} fps={30} durationInFrames={150} />
      <Composition id="DreamBG5Follow" component={DreamBG5Follow} width={1080} height={1920} fps={30} durationInFrames={240} />
      <Composition id="DreamBG5FollowSides" component={DreamBG5FollowSides} width={1080} height={1920} fps={30} durationInFrames={240} />
      <Composition id="GibExplainer" component={GibExplainer} width={1080} height={1920} fps={30} durationInFrames={750} />
      <Composition id="DreamCloudWipe" component={DreamCloudWipe} width={1080} height={1920} fps={30} durationInFrames={36} />
    </>
  );
};
