import { describe, expect, it } from 'vitest';
import { facingFromAngle } from './facing';

describe('facingFromAngle', () => {
  it.each([
    [0, 'right'],
    [Math.PI / 2, 'down'],
    [Math.PI, 'left'],
    [-Math.PI, 'left'],
    [-Math.PI / 2, 'up'],
    [Math.PI / 5, 'right'],
    [(3 * Math.PI) / 5, 'down'],
    [2 * Math.PI + 0.1, 'right'],
  ] as const)('maps %d rad to %s', (angle, expected) => {
    expect(facingFromAngle(angle)).toBe(expected);
  });
});
