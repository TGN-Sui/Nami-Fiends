import type { ReactElement } from 'react';

import { hubDestinationItems, type HubDestinationPage } from './domain/hub-destinations.js';
import { navItems } from './domain/navigation.js';
import { isGameChannelOwner } from './channel-owner-access.js';
import { ownerAssetNavSlotId } from './nami-owner-assets-store.js';
import { OwnerEditableImage } from './OwnerEditableImage.js';
import { saveIgniteRadioEnabled, useIgniteRadioEnabled } from './ignite-radio-store.js';
import type { NamiPage } from './uiMockData.js';

function isGuildNavPage(page: NamiPage): boolean {
  return page === 'guilds' || page === 'guildDetail' || page === 'squadDetail';
}

export function MobileBottomNav(props: {
  activePage: NamiPage;
  guildEventUnreadCount: number;
  messageUnreadCount: number;
  onNavigate: (page: NamiPage) => void;
  onOpenOwnedChannel?: () => void;
  onNavigateHubDestination: (page: HubDestinationPage) => void;
}): ReactElement {
  const igniteRadioEnabled = useIgniteRadioEnabled();
  const secondaryItems = navItems.filter((item) => item.page !== 'hub');

  return (
    <nav aria-label="Main navigation" className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-scroll">
        {hubDestinationItems.map((destination) => (
          <button
            aria-current={props.activePage === destination.page ? 'page' : undefined}
            aria-label={destination.label}
            className={
              'mobile-bottom-nav-item' +
              (props.activePage === destination.page ? ' is-active' : '')
            }
            key={destination.page}
            onClick={() => props.onNavigateHubDestination(destination.page)}
            type="button"
          >
            <OwnerEditableImage
              className="mobile-bottom-nav-icon nav-icon"
              fallback={<span aria-hidden="true">{destination.fallbackGlyph}</span>}
              label={destination.label + ' nav icon'}
              nested
              slotId={destination.assetSlotId}
            />
            <span className="mobile-bottom-nav-label">{destination.shortLabel}</span>
          </button>
        ))}

        {secondaryItems.map((item) => {
          const isProfileNavActive =
            item.page === 'userProfile' &&
            (props.activePage === 'userProfile' ||
              (isGameChannelOwner() && props.activePage === 'channelProfile'));
          const isNavActive =
            item.page === 'guilds'
              ? isGuildNavPage(props.activePage)
              : isProfileNavActive || props.activePage === item.page;

          return (
            <button
              aria-current={isNavActive ? 'page' : undefined}
              aria-label={item.label}
              className={'mobile-bottom-nav-item' + (isNavActive ? ' is-active' : '')}
              key={item.page}
              onClick={() => {
                if (item.page === 'userProfile' && isGameChannelOwner()) {
                  props.onOpenOwnedChannel?.();
                  return;
                }

                props.onNavigate(item.page);
              }}
              type="button"
            >
              <OwnerEditableImage
                className="mobile-bottom-nav-icon nav-icon"
                fallback={<span aria-hidden="true">{item.shortLabel.slice(0, 1)}</span>}
                label={item.shortLabel + ' nav icon'}
                nested
                slotId={ownerAssetNavSlotId(item.page)}
              />
              <span className="mobile-bottom-nav-label">{item.shortLabel}</span>
              {item.page === 'guilds' && props.guildEventUnreadCount > 0 ? (
                <span
                  aria-label={props.guildEventUnreadCount + ' new guild events'}
                  className="mobile-bottom-nav-badge"
                >
                  {props.guildEventUnreadCount > 9 ? '9+' : props.guildEventUnreadCount}
                </span>
              ) : null}
              {item.page === 'messages' && props.messageUnreadCount > 0 ? (
                <span
                  aria-label={props.messageUnreadCount + ' unread messages'}
                  className="mobile-bottom-nav-badge"
                >
                  {props.messageUnreadCount > 9 ? '9+' : props.messageUnreadCount}
                </span>
              ) : null}
            </button>
          );
        })}

        <button
          aria-label={igniteRadioEnabled ? 'Radio on' : 'Ignite Radio'}
          aria-pressed={igniteRadioEnabled}
          className={
            'mobile-bottom-nav-item mobile-bottom-nav-radio' +
            (igniteRadioEnabled ? ' is-active is-active-sidebar-radio' : '')
          }
          onClick={() => saveIgniteRadioEnabled(!igniteRadioEnabled)}
          type="button"
        >
          <OwnerEditableImage
            className="mobile-bottom-nav-icon nav-icon"
            fallback={<span aria-hidden="true">♫</span>}
            label="Ignite Radio nav icon"
            nested
            slotId="sidebar-nav-radio"
          />
          <span className="mobile-bottom-nav-label">
            {igniteRadioEnabled ? 'Radio' : 'Radio'}
          </span>
        </button>
      </div>
    </nav>
  );
}