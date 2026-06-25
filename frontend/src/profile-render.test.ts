// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';
import { PassportDisplayNameEditor } from './PassportDisplayNameControls.js';
import { MemberPreferenceStrip } from './MemberPreferenceStrip.js';
import { members } from './uiMockData.js';

async function renderToContainer(element: React.ReactElement): Promise<HTMLDivElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(element);
  });

  return container;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('profile render smoke', () => {
  it('renders horizontal passport card', async () => {
    const container = await renderToContainer(
      React.createElement(TcgFoilPassportCard, { layout: 'horizontal', member: members[0]! })
    );

    expect(container.querySelector('.tcg-foil-passport-shell')).toBeTruthy();
    expect(container.textContent?.length ?? 0).toBeGreaterThan(20);
    expect(container.querySelector('.passport-player-star-row')).toBeTruthy();
    expect(container.querySelectorAll('.player-star-score-star').length).toBe(5);
  });

  it('renders vertical passport card', async () => {
    const container = await renderToContainer(
      React.createElement(TcgFoilPassportCard, { layout: 'vertical', member: members[0]! })
    );

    expect(container.querySelector('.tcg-foil-passport-shell')).toBeTruthy();
    expect(container.querySelector('.passport-player-star-row')).toBeTruthy();
    expect(container.querySelectorAll('.player-star-score-star').length).toBe(5);
  });

  it('renders display name editor for self member', async () => {
    const selfMember = members.find((member) => member.id === 'm1')!;

    const container = await renderToContainer(
      React.createElement(PassportDisplayNameEditor, {
        fallbackName: selfMember.name,
        member: selfMember,
      })
    );

    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it('renders member preference strip for visitors with seeded prefs', async () => {
    const container = await renderToContainer(
      React.createElement(MemberPreferenceStrip, {
        member: members[1]!,
        variant: 'passport-horizontal',
      })
    );

    expect(container.querySelector('.member-preference-strip')).toBeTruthy();
  });
});