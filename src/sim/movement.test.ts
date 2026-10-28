import { describe, expect, it } from 'vitest';
import { clampToBounds, intentToVelocity, stepPosition } from './movement';
import { length } from './vector';

const SPEED = 100;
const BOUNDS = { x: 0, y: 0, width: 200, height: 100 };

describe('intentToVelocity', () => {
  it('moves at full speed on a cardinal axis', () => {
    expect(intentToVelocity({ x: 1, y: 0 }, SPEED)).toEqual({ x: 100, y: 0 });
    expect(intentToVelocity({ x: 0, y: -1 }, SPEED)).toEqual({ x: 0, y: -100 });
  });

  it('normalizes diagonal input so it is not faster than cardinal input', () => {
    const v = intentToVelocity({ x: 1, y: 1 }, SPEED);
    expect(length(v)).toBeCloseTo(SPEED, 10);
    expect(v.x).toBeCloseTo(v.y, 10);
  });

  it('keeps analog input below full magnitude unchanged in direction and scale', () => {
    expect(intentToVelocity({ x: 0.5, y: 0 }, SPEED)).toEqual({ x: 50, y: 0 });
  });

  it('caps oversized input at full speed', () => {
    expect(length(intentToVelocity({ x: 50, y: 0 }, SPEED))).toBeCloseTo(SPEED, 10);
  });

  it('returns zero velocity for no input or invalid input', () => {
    expect(intentToVelocity({ x: 0, y: 0 }, SPEED)).toEqual({ x: 0, y: 0 });
    expect(intentToVelocity({ x: Number.NaN, y: 1 }, SPEED)).toEqual({ x: 0, y: 0 });
    expect(intentToVelocity({ x: Infinity, y: 0 }, SPEED)).toEqual({ x: 0, y: 0 });
  });
});

describe('stepPosition', () => {
  it('integrates velocity over delta time in milliseconds', () => {
    const next = stepPosition({ x: 50, y: 50 }, { x: 100, y: -20 }, 500, BOUNDS, 0);
    expect(next).toEqual({ x: 100, y: 40 });
  });

  it('keeps a circle of the given radius inside the bounds', () => {
    const next = stepPosition({ x: 190, y: 50 }, { x: 1000, y: 0 }, 1000, BOUNDS, 6);
    expect(next).toEqual({ x: 194, y: 50 });
  });
});

describe('clampToBounds', () => {
  it('clamps on every edge', () => {
    expect(clampToBounds({ x: -10, y: -10 }, BOUNDS, 5)).toEqual({ x: 5, y: 5 });
    expect(clampToBounds({ x: 999, y: 999 }, BOUNDS, 5)).toEqual({ x: 195, y: 95 });
  });
});
