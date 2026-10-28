import { describe, expect, it } from 'vitest';
import { GAMEPLAY_CONFIG } from '../config/gameplay';
import {
  createWeaponState,
  pelletAngles,
  startReload,
  tickWeapon,
  tryFire,
  validateWeaponConfig,
  type WeaponConfig,
} from './weapons';

const NO_JITTER = () => 0.5;

const TEST_WEAPON: WeaponConfig = {
  id: 'pistol',
  displayName: 'Test',
  damagePerPellet: 10,
  pellets: 1,
  spreadRadians: 0.1,
  spreadJitter: 1,
  maxRange: 100,
  falloffStart: 50,
  minDamageMultiplier: 0.5,
  cooldownMs: 200,
  magazineSize: 3,
  reloadMs: 1000,
};

describe('weapon configuration', () => {
  it('accepts the provisional gameplay weapons', () => {
    expect(() => {
      validateWeaponConfig(GAMEPLAY_CONFIG.weapons.pistol);
    }).not.toThrow();
    expect(() => {
      validateWeaponConfig(GAMEPLAY_CONFIG.weapons.shotgun);
    }).not.toThrow();
  });

  it('keeps the intended pistol/shotgun relationship', () => {
    const { pistol, shotgun } = GAMEPLAY_CONFIG.weapons;
    expect(pistol.maxRange).toBeGreaterThan(shotgun.maxRange);
    expect(shotgun.damagePerPellet * shotgun.pellets).toBeGreaterThan(pistol.damagePerPellet);
  });

  it.each<[string, Partial<WeaponConfig>]>([
    ['zero damage', { damagePerPellet: 0 }],
    ['fractional pellets', { pellets: 1.5 }],
    ['empty magazine', { magazineSize: 0 }],
    ['falloff beyond range', { falloffStart: 200 }],
    ['multiplier above 1', { minDamageMultiplier: 1.5 }],
    ['negative cooldown', { cooldownMs: -1 }],
    ['NaN range', { maxRange: Number.NaN }],
  ])('rejects %s', (_label, override) => {
    expect(() => {
      validateWeaponConfig({ ...TEST_WEAPON, ...override });
    }).toThrow(/Invalid weapon config/);
  });
});

describe('firing and cooldown', () => {
  it('fires, consumes ammo and starts the cooldown', () => {
    const result = tryFire(createWeaponState(TEST_WEAPON), TEST_WEAPON);
    expect(result.ok).toBe(true);
    expect(result.state).toEqual({ ammo: 2, cooldownMs: 200, reloadMs: 0 });
  });

  it('rejects firing during the cooldown', () => {
    const fired = tryFire(createWeaponState(TEST_WEAPON), TEST_WEAPON).state;
    const again = tryFire(tickWeapon(fired, TEST_WEAPON, 199), TEST_WEAPON);
    expect(again).toMatchObject({ ok: false, reason: 'COOLDOWN' });
  });

  it('fires again once the cooldown has elapsed', () => {
    const fired = tryFire(createWeaponState(TEST_WEAPON), TEST_WEAPON).state;
    expect(tryFire(tickWeapon(fired, TEST_WEAPON, 200), TEST_WEAPON).ok).toBe(true);
  });

  it('starts a reload automatically after the last round', () => {
    let state = createWeaponState(TEST_WEAPON);
    for (let i = 0; i < TEST_WEAPON.magazineSize; i++) {
      state = tickWeapon(tryFire(state, TEST_WEAPON).state, TEST_WEAPON, TEST_WEAPON.cooldownMs);
    }
    expect(state.ammo).toBe(0);
    expect(state.reloadMs).toBeGreaterThan(0);
    expect(tryFire(state, TEST_WEAPON)).toMatchObject({ ok: false, reason: 'RELOADING' });
  });

  it('refills the magazine when the reload completes', () => {
    const reloading = { ammo: 0, cooldownMs: 0, reloadMs: 1000 };
    expect(tickWeapon(reloading, TEST_WEAPON, 999).ammo).toBe(0);
    expect(tickWeapon(reloading, TEST_WEAPON, 1000)).toEqual({
      ammo: 3,
      cooldownMs: 0,
      reloadMs: 0,
    });
  });

  it('starts a reload when trying to fire an empty, idle weapon', () => {
    const result = tryFire({ ammo: 0, cooldownMs: 0, reloadMs: 0 }, TEST_WEAPON);
    expect(result).toMatchObject({ ok: false, reason: 'EMPTY' });
    expect(result.state.reloadMs).toBe(TEST_WEAPON.reloadMs);
  });

  it('ignores manual reload when full or already reloading', () => {
    const full = createWeaponState(TEST_WEAPON);
    expect(startReload(full, TEST_WEAPON)).toBe(full);
    const reloading = { ammo: 1, cooldownMs: 0, reloadMs: 300 };
    expect(startReload(reloading, TEST_WEAPON)).toBe(reloading);
  });
});

describe('pelletAngles', () => {
  it('fires a single pellet straight when jitter is neutral', () => {
    expect(pelletAngles(1, TEST_WEAPON, NO_JITTER)).toEqual([1]);
  });

  it('spreads multiple pellets evenly across the cone', () => {
    const shotgun = { ...TEST_WEAPON, pellets: 5, spreadRadians: 0.4 };
    const angles = pelletAngles(0, shotgun, NO_JITTER);
    expect(angles).toHaveLength(5);
    expect(angles[0]).toBeCloseTo(-0.2, 10);
    expect(angles[2]).toBeCloseTo(0, 10);
    expect(angles[4]).toBeCloseTo(0.2, 10);
  });

  it('keeps jittered pellets within half a step of their slot', () => {
    const shotgun = { ...TEST_WEAPON, pellets: 3, spreadRadians: 0.4, spreadJitter: 1 };
    const angles = pelletAngles(0, shotgun, () => 0.999);
    expect(angles[1]).toBeLessThan(0.1);
    expect(angles[1]).toBeGreaterThan(0);
  });
});
