export function memberProfileShareUrl(memberId: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('member', memberId);
  return url.toString();
}

export async function shareMemberProfile(member: {
  id: string;
  name: string;
}): Promise<{ ok: boolean; message: string }> {
  const url = memberProfileShareUrl(member.id);
  const shareTitle = member.name + ' on Nami';
  const shareText = 'Check out ' + member.name + "'s Nami passport and profile.";

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url,
      });

      return { ok: true, message: 'Passport link shared.' };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { ok: false, message: 'Share cancelled.' };
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return { ok: true, message: 'Passport link copied to clipboard.' };
  } catch {
    return { ok: false, message: 'Could not copy the passport link.' };
  }
}

export function readMemberIdFromShareUrl(): string | null {
  try {
    const memberId = new URL(window.location.href).searchParams.get('member');

    return memberId && memberId.trim().length > 0 ? memberId.trim() : null;
  } catch {
    return null;
  }
}