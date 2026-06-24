import { config } from '../config.js';

export type TransferInviteEmailInput = {
  toEmail: string;
  gameTitle: string;
  channelHandle: string;
  transferId: string;
};

export type TransferInviteEmailResult =
  | { ok: true; sentAtMs: number }
  | { ok: false; error: string };

export async function sendChannelTransferInviteEmail(
  input: TransferInviteEmailInput
): Promise<TransferInviteEmailResult> {
  const toEmail = input.toEmail.trim().toLowerCase();

  if (!toEmail.includes('@')) {
    return { ok: false, error: 'invalid_recipient_email' };
  }

  if (!config.resendApiKey) {
    return { ok: false, error: 'resend_not_configured' };
  }

  if (!config.transferEmailFrom) {
    return { ok: false, error: 'transfer_email_from_not_configured' };
  }

  const acceptUrl =
    config.transferPortalUrl + '/?transfer=' + encodeURIComponent(input.transferId);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + config.resendApiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: config.transferEmailFrom,
      to: [toEmail],
      subject: "You've been invited to own " + input.gameTitle + ' on Nami',
      html:
        '<p>You have been invited to take ownership of <strong>' +
        escapeHtml(input.gameTitle) +
        '</strong> (@' +
        escapeHtml(input.channelHandle) +
        ') on Nami.</p>' +
        '<p>Sign in with the email address this message was sent to, then accept the transfer:</p>' +
        '<p><a href="' +
        escapeHtml(acceptUrl) +
        '">' +
        escapeHtml(acceptUrl) +
        '</a></p>' +
        '<p>This invite is private — only you can accept it.</p>',
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');

    return {
      ok: false,
      error: 'resend_failed:' + response.status + (detail ? ':' + detail.slice(0, 200) : ''),
    };
  }

  return { ok: true, sentAtMs: Date.now() };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}