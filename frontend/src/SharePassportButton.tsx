import { useState, type ReactElement } from 'react';

import { shareMemberProfile } from './profile-share.js';

export function SharePassportButton(props: {
  member: { id: string; name: string };
  className?: string;
}): ReactElement {
  const [notice, setNotice] = useState('');

  async function handleShare(): Promise<void> {
    const result = await shareMemberProfile(props.member);

    setNotice(result.message);

    window.setTimeout(() => {
      setNotice('');
    }, 3200);
  }

  return (
    <span className="share-passport-button-wrap">
      <button
        aria-label={'Share passport link for ' + props.member.name}
        className={
          'nami-surface-button share-passport-button' + (props.className ? ' ' + props.className : '')
        }
        onClick={() => {
          void handleShare();
        }}
        type="button"
      >
        Share Passport
      </button>
      {notice ? (
        <span aria-live="polite" className="share-passport-notice" role="status">
          {notice}
        </span>
      ) : null}
    </span>
  );
}