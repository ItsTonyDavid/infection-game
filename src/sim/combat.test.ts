import { describe, expect, it } from 'vitest';
import { damageAtDistance, rayCircleDistance, resolvePellet } from './combat';
import type { WeaponConfig } from './weapons';

const RIGHT = { x: 1, y: 0 };
const ORIGIN = { x: 0, y: 0 };

const WEAPON: WeaponConfig = {
  id: 'pistol',
  displayName: 'Test',
  damagePerPellet: 20,
  pellets: 1,
  spreadRadians: 0,
  spreadJitter: 0,
  maxRange: 200,
  falloffStart: 100,
  minDamageMultiplier: 0.5,
  cooldownMs: 100,
  magazineSize: 10,
  reloadMs: 1000,
};

describe('rayCircleDistance', () => {
  it('returns the distance to the near edge of a circle ahead', () => {
    expect(rayCircleDistance(ORIGIN, RIGHT, { x: 50, y: 0 }, 10)).toBeCloseTo(40, 10);
  });

  it('misses a circle beside the ray', () => {
    expect(rayCircleDistance(ORIGIN, RIGHT, { x: 50, y: 11 }, 10)).toBeNull();
  });

  it('grazes a circle tangent to the ray', () => {
    expect(rayCircleDistance(ORIGIN, RIGHT, { x: 50, y: 10 }, 10)).toBeCloseTo(50, 10);
  });

  it('ignores circles behind the origin', () => {
    expect(rayCircleDistance(ORIGIN, RIGHT, { x: -50, y: 0 }, 10)).toBeNull();
  });

  it('returns 0 when the origin is inside the circle', () => {
    expect(rayCircleDistance(ORIGIN, RIGHT, { x: 3, y: 0 }, 10)).toBe(0);
  });
});

describe('damageAtDistance', () => {
  it('deals full damage up to the falloff start', () => {
    expect(damageAtDistance(WEAPON, 0)).toBe(20);
    expect(damageAtDistance(WEAPON, 100)).toBe(20);
  });

  it('falls off linearly to the minimum multiplier at max range', () => {
    expect(damageAtDistance(WEAPON, 150)).toBe(15);
    expect(damageAtDistance(WEAPON, 200)).toBe(10);
  });

  it('deals no damage beyond max range', () => {
    expect(damageAtDistance(WEAPON, 200.01)).toBe(0);
  });
});

describe('resolvePellet', () => {
  const targets = [
    { id: 'far', position: { x: 150, y: 0 }, radius: 10 },
    { id: 'near', position: { x: 60, y: 0 }, radius: 10 },
    { id: 'off-axis', position: { x: 30, y: 40 }, radius: 10 },
  ];

  it('hits the nearest target on the ray', () => {
    const hit = resolvePellet(ORIGIN, RIGHT, 300, targets);
    expect(hit?.targetId).toBe('near');
    expect(hit?.distance).toBeCloseTo(50, 10);
    expect(hit?.point.x).toBeCloseTo(50, 10);
  });

  it('does not hit targets beyond max range', () => {
    expect(resolvePellet(ORIGIN, RIGHT, 49, targets)).toBeNull();
  });

  it('returns null when nothing is on the ray', () => {
    expect(resolvePellet(ORIGIN, { x: 0, y: -1 }, 300, targets)).toBeNull();
  });
});
