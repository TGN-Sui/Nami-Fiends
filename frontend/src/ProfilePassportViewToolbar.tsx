import type { ReactElement } from 'react';

import type { ProfileCardLayout } from './profile-card-layout.js';

type ProfilePassportViewToolbarProps = {
  profileCardLayout: ProfileCardLayout;
  onLayoutChange: (layout: ProfileCardLayout) => void;
  activeSlide: 'passport' | 'badges';
  onSlideChange: (slide: 'passport' | 'badges') => void;
};

export function ProfilePassportViewToolbar(props: ProfilePassportViewToolbarProps): ReactElement {
  return (
    <div className="profile-passport-view-toolbar nami-profile-view-toolbar-stable">
      <div
        aria-label="Passport layout"
        className="nami-profile-layout-switch nami-profile-stable-layout-switch profile-passport-view-toolbar-layout"
        role="group"
      >
        {(['vertical', 'horizontal'] as ProfileCardLayout[]).map((layout) => (
          <button
            aria-pressed={props.profileCardLayout === layout}
            className={props.profileCardLayout === layout ? 'is-selected-profile-layout' : ''}
            key={layout}
            onClick={() => props.onLayoutChange(layout)}
            type="button"
          >
            {layout === 'vertical' ? 'Vertical' : 'Horizontal'}
          </button>
        ))}
      </div>

      <div
        className="profile-passport-carousel-actions profile-passport-view-toolbar-tabs"
        role="tablist"
        aria-label="Passport card views"
      >
        <button
          aria-selected={props.activeSlide === 'passport'}
          className={
            'nami-surface-button profile-passport-view-tab' +
            (props.activeSlide === 'passport' ? ' is-active-view' : '')
          }
          onClick={() => props.onSlideChange('passport')}
          role="tab"
          type="button"
        >
          Passport
        </button>
        <button
          aria-selected={props.activeSlide === 'badges'}
          className={
            'nami-surface-button profile-passport-view-tab' +
            (props.activeSlide === 'badges' ? ' is-active-view' : '')
          }
          onClick={() => props.onSlideChange('badges')}
          role="tab"
          type="button"
        >
          Badge Book
        </button>
      </div>
    </div>
  );
}