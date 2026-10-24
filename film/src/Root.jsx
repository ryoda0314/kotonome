import React from 'react';
import { Composition } from 'remotion';
import { Video, DURATION } from './Video';
import { Test } from './Test';

export const Root = () => (
  <>
    <Composition id="Hangul" component={Video} durationInFrames={DURATION} fps={30} width={1920} height={1080} />
    <Composition id="Test" component={Test} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
