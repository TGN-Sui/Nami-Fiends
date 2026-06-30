// @vitest-environment happy-dom

import { cleanup, fireEvent, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TutorialReplaySettingsCard } from './TutorialReplaySettingsCard.js';

const replayTutorialFromSettings = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('./tutorial-queue.js', () => ({
  replayTutorialFromSettings,
}));

describe('TutorialReplaySettingsCard', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders nothing without a wallet owner', () => {
    const view = render(createElement(TutorialReplaySettingsCard, { owner: null }));

    expect(view.queryByRole('button', { name: /Replay realm guide/i })).toBeNull();
  });

  it('replays the tutorial and navigates to hub', async () => {
    const onNavigateHub = vi.fn();

    const view = render(
      createElement(TutorialReplaySettingsCard, {
        owner: '0xabc',
        onNavigateHub,
      }),
    );

    fireEvent.click(view.getByRole('button', { name: /Replay realm guide/i }));

    await vi.waitFor(() => {
      expect(replayTutorialFromSettings).toHaveBeenCalledWith('0xabc', onNavigateHub);
    });
  });
});