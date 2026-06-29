export type ProfileCardLayout = 'vertical' | 'horizontal';

export function readProfileCardLayout(): ProfileCardLayout {
  try {
    const savedLayout = window.localStorage.getItem('nami-profile-card-layout');

    return savedLayout === 'horizontal' ? 'horizontal' : 'vertical';
  } catch {
    return 'vertical';
  }
}

export function saveProfileCardLayout(layout: ProfileCardLayout): void {
  window.localStorage.setItem('nami-profile-card-layout', layout);
}