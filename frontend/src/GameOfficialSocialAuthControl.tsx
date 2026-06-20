import type { ReactElement } from 'react';

import type { GameOfficialSocialPlatform } from './game-onboarding-draft.js';
import { OfficialSocialAuthControl } from './OfficialSocialAuthControl.js';

export function GameOfficialSocialAuthControl(props: {
  gameTitle: string;
  platform: GameOfficialSocialPlatform;
}): ReactElement {
  return (
    <OfficialSocialAuthControl
      mockHandleSeed={props.gameTitle}
      platform={props.platform}
      required
      scope="game"
    />
  );
}