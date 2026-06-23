import { type ReactElement } from 'react';

export function MemberProfileIdentityToolbar(props: {
  onEditPhoto: () => void;
  onEditStatus: () => void;
  onOpenFullEditor: () => void;
}): ReactElement {
  return (
    <div className="member-profile-identity-toolbar panel" role="toolbar" aria-label="Profile identity actions">
      <div className="member-profile-identity-toolbar-copy">
        <span className="mini-badge">Your profile</span>
        <p>Update how testers see you in chats, guilds, and global rooms.</p>
      </div>
      <div className="member-profile-identity-toolbar-actions">
        <button
          className="nami-surface-button is-primary-surface-button"
          onClick={props.onEditPhoto}
          type="button"
        >
          Change photo
        </button>
        <button className="nami-surface-button" onClick={props.onEditStatus} type="button">
          Update status
        </button>
        <button className="profile-secondary-link" onClick={props.onOpenFullEditor} type="button">
          Full profile editor
        </button>
      </div>
    </div>
  );
}