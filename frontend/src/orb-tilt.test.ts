import { describe, expect, it } from 'vitest';

import { applyOrbTilt, resetOrbTilt } from './orb-tilt.js';

function mockOrbButton(): HTMLElement {
  const classes = new Set<string>();
  const styleValues = new Map<string, string>();

  return {
    classList: {
      add: (value: string) => classes.add(value),
      remove: (value: string) => classes.delete(value),
      contains: (value: string) => classes.has(value),
    },
    style: {
      setProperty: (name: string, value: string) => styleValues.set(name, value),
      getPropertyValue: (name: string) => styleValues.get(name) ?? '',
    },
    getBoundingClientRect: () =>
      ({
        left: 0,
        top: 0,
        width: 48,
        height: 48,
        right: 48,
        bottom: 48,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect,
  } as HTMLElement;
}

describe('orb-tilt', () => {
  it('sets glare vars while hovering', () => {
    const element = mockOrbButton();

    applyOrbTilt(element, 36, 12);

    expect(element.classList.contains('is-orb-tilting')).toBe(true);
    expect(element.style.getPropertyValue('--orb-glare-x')).toBe('75.00%');
    expect(element.style.getPropertyValue('--orb-glare-y')).toBe('25.00%');
    expect(element.style.getPropertyValue('--orb-glare-opacity')).toBe('0.84');

    resetOrbTilt(element);

    expect(element.classList.contains('is-orb-tilting')).toBe(false);
    expect(element.style.getPropertyValue('--orb-glare-opacity')).toBe('0');
  });
});