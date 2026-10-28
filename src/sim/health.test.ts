import { describe, expect, it } from 'vitest';
import { applyDamage, createHealth, isDead } from './health';

describe('health', () => {
  it('starts full and alive', () => {
    const health = createHealth(100);
    expect(health).toEqual({ current: 100, max: 100 });
    expect(isDead(health)).toBe(false);
  });

  it('subtracts damage', () => {
    expect(applyDamage(createHealth(100), 30).current).toBe(70);
  });

  it('never drops below zero and reports death at zero', () => {
    const health = applyDamage(createHealth(50), 80);
    expect(health.current).toBe(0);
    expect(isDead(health)).toBe(true);
  });

  it('dies exactly at zero', () => {
    expect(isDead(applyDamage(createHealth(50), 50))).toBe(true);
  });

  it('rejects negative or non-finite damage', () => {
    const health = createHealth(100);
    expect(() => applyDamage(health, -5)).toThrow();
    expect(() => applyDamage(health, Number.NaN)).toThrow();
    expect(() => applyDamage(health, Infinity)).toThrow();
  });

  it('rejects invalid max health', () => {
    expect(() => createHealth(0)).toThrow();
    expect(() => createHealth(Number.NaN)).toThrow();
  });
});
