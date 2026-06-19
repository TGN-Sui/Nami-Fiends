export type ChannelProfileOwnerFocus =
  | 'partner-carousel'
  | 'super-banner'
  | 'hub-featured'
  | null;

const OWNER_FOCUS_TARGETS: Record<Exclude<ChannelProfileOwnerFocus, null>, string> = {
  'partner-carousel': 'channel-owner-partner-carousel',
  'super-banner': 'channel-owner-super-banner',
  'hub-featured': 'channel-owner-hub-featured',
};

export function channelOwnerFocusTargetId(focus: Exclude<ChannelProfileOwnerFocus, null>): string {
  return OWNER_FOCUS_TARGETS[focus];
}

export function scrollToChannelOwnerFocus(focus: ChannelProfileOwnerFocus, behavior: ScrollBehavior = 'smooth'): void {
  if (!focus) {
    return;
  }

  window.requestAnimationFrame(() => {
    const target = document.getElementById(channelOwnerFocusTargetId(focus));

    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior, block: 'start' });
    target.classList.add('is-owner-focus-highlight');

    window.setTimeout(() => {
      target.classList.remove('is-owner-focus-highlight');
    }, 1800);
  });
}