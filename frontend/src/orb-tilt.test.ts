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
  it('sets tilt and glare vars while tilting', () => {
    const element = mockOrbButton();

    applyOrbTilt(element, 36, 12);

    expect(element.classList.contains('is-orb-tilting')).toBe(true);
    expect(element.style.getPropertyValue('--orb-tilt-x')).toBe('2.25deg');
    expect(element.style.getPropertyValue('--orb-tilt-y')).toBe('2.00deg');
    expect(element.style.getPropertyValue('--orb-glare-opacity')).toBe('0.92');

    resetOrbTilt(element);

    expect(element.classList.contains('is-orb-tilting')).toBe(false);
    expect(element.style.getPropertyValue('--orb-glare-opacity')).toBe('0');
  });
});