import type { ReactElement } from 'react';

import {
  MEMBER_SETTINGS_GROUPS,
  OWNER_CONSOLE_GROUP,
  type SettingsNavGroup,
  type SettingsNavId,
} from './settings-navigation.js';

export function SettingsSidebar(props: {
  activeNav: SettingsNavId;
  showOwnerConsole: boolean;
  onSelect: (navId: SettingsNavId) => void;
  pendingTicketCount?: number;
}): ReactElement {
  return (
    <nav aria-label="Settings navigation" className="settings-sidebar">
      <div className="settings-sidebar-rail" aria-hidden="true" />

      {MEMBER_SETTINGS_GROUPS.map((group) => (
        <SettingsSidebarGroup
          activeNav={props.activeNav}
          group={group}
          key={group.id}
          onSelect={props.onSelect}
        />
      ))}

      {props.showOwnerConsole ? (
        <SettingsSidebarGroup
          activeNav={props.activeNav}
          group={OWNER_CONSOLE_GROUP}
          onSelect={props.onSelect}
          variant="owner"
          {...(props.pendingTicketCount && props.pendingTicketCount > 0
            ? { badgeCount: props.pendingTicketCount }
            : {})}
        />
      ) : null}
    </nav>
  );
}

function SettingsSidebarGroup(props: {
  group: SettingsNavGroup;
  activeNav: SettingsNavId;
  onSelect: (navId: SettingsNavId) => void;
  badgeCount?: number;
  variant?: 'member' | 'owner';
}): ReactElement {
  return (
    <section
      className={
        'settings-sidebar-group' +
        (props.variant === 'owner' ? ' settings-sidebar-group-owner' : '')
      }
    >
      <h2>{props.group.label}</h2>
      <ul className="settings-sidebar-list">
        {props.group.items.map((item) => (
          <li key={item.id}>
            <button
              aria-current={props.activeNav === item.id ? 'page' : undefined}
              className={
                'settings-sidebar-item' +
                (props.activeNav === item.id ? ' is-active-settings-nav' : '') +
                (item.id === 'owner-border-art' ? ' is-featured-owner-nav' : '')
              }
              onClick={() => props.onSelect(item.id)}
              type="button"
            >
              <span className="settings-sidebar-item-label">{item.label}</span>
              <span className="settings-sidebar-item-hint">{item.hint}</span>
              {item.id === 'owner-submissions' && props.badgeCount && props.badgeCount > 0 ? (
                <span className="settings-sidebar-badge">{props.badgeCount}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}