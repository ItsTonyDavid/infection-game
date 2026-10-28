import type { Rng } from './rng';

export type WeaponId = 'pistol' | 'shotgun';

export interface WeaponConfig {
  readonly id: WeaponId;
  readonly displayName: string;
  /** Damage per pellet at or below `falloffStart`. */
  readonly damagePerPellet: number;
  readonly pellets: number;
  /** Total cone angle in radians. Pellets are spread evenly across it, plus jitter. */
  readonly spreadRadians: number;
  /** Fraction of the gap between pellets used as random jitter, in [0, 1]. */
  readonly spreadJitter: number;
  /** World pixels. Pellets travel this far at most. */
  readonly maxRange: number;
  /** World pixels. Damage starts falling off linearly after this distance. */
  readonly falloffStart: number;
  /** Damage multiplier reached at `maxRange`, in [0, 1]. */
  readonly minDamageMultiplier: number;
  readonly cooldownMs: number;
  readonly magazineSize: number;
  readonly reloadMs: number;
}

export interface WeaponState {
  readonly ammo: number;
  /** Time until the weapon can fire again. */
  readonly cooldownMs: number;
  /** Time until the reload completes; 0 means not reloading. */
  readonly reloadMs: number;
}

export type FireRejection = 'COOLDOWN' | 'RELOADING' | 'EMPTY';

export type FireResult =
  | { readonly ok: true; readonly state: WeaponState }
  | { readonly ok: false; readonly reason: FireRejection; readonly state: WeaponState };

export function validateWeaponConfig(config: WeaponConfig): void {
  const problems: string[] = [];
  const positive = (name: string, value: number) => {
    if (!Number.isFinite(value) || value <= 0) problems.push(`${name} must be > 0`);
  };
  positive('damagePerPellet', config.damagePerPellet);
  positive('maxRange', config.maxRange);
  positive('cooldownMs', config.cooldownMs);
  positive('reloadMs', config.reloadMs);
  if (!Number.isInteger(config.pellets) || config.pellets < 1) {
    problems.push('pellets must be an integer >= 1');
  }
  if (!Number.isInteger(config.magazineSize) || config.magazineSize < 1) {
    problems.push('magazineSize must be an integer >= 1');
  }
  if (!(config.spreadRadians >= 0 && config.spreadRadians < Math.PI)) {
    problems.push('spreadRadians must be in [0, PI)');
  }
  if (!(config.spreadJitter >= 0 && config.spreadJitter <= 1)) {
    problems.push('spreadJitter must be in [0, 1]');
  }
  if (!(config.falloffStart >= 0 && config.falloffStart <= config.maxRange)) {
    problems.push('falloffStart must be in [0, maxRange]');
  }
  if (!(config.minDamageMultiplier >= 0 && config.minDamageMultiplier <= 1)) {
    problems.push('minDamageMultiplier must be in [0, 1]');
  }
  if (problems.length > 0) {
    throw new Error(`Invalid weapon config "${config.id}": ${problems.join('; ')}`);
  }
}

export function createWeaponState(config: WeaponConfig): WeaponState {
  return { ammo: config.magazineSize, cooldownMs: 0, reloadMs: 0 };
}

export function isReloading(state: WeaponState): boolean {
  return state.reloadMs > 0;
}

/** Advances cooldown and reload timers. */
export function tickWeapon(state: WeaponState, config: WeaponConfig, dtMs: number): WeaponState {
  const cooldownMs = Math.max(0, state.cooldownMs - dtMs);
  if (!isReloading(state)) {
    return { ...state, cooldownMs };
  }
  const reloadMs = state.reloadMs - dtMs;
  return reloadMs <= 0
    ? { ammo: config.magazineSize, cooldownMs, reloadMs: 0 }
    : { ...state, cooldownMs, reloadMs };
}

/** Starts a reload unless already reloading or the magazine is full. */
export function startReload(state: WeaponState, config: WeaponConfig): WeaponState {
  if (isReloading(state) || state.ammo >= config.magazineSize) return state;
  return { ...state, reloadMs: config.reloadMs };
}

/**
 * Consumes one round if the weapon can fire. Trying to fire an empty weapon starts a
 * reload; firing the last round also starts one automatically.
 */
export function tryFire(state: WeaponState, config: WeaponConfig): FireResult {
  if (isReloading(state)) return { ok: false, reason: 'RELOADING', state };
  if (state.cooldownMs > 0) return { ok: false, reason: 'COOLDOWN', state };
  if (state.ammo <= 0) {
    return { ok: false, reason: 'EMPTY', state: startReload(state, config) };
  }
  const fired: WeaponState = { ...state, ammo: state.ammo - 1, cooldownMs: config.cooldownMs };
  return { ok: true, state: fired.ammo === 0 ? startReload(fired, config) : fired };
}

/** Angles (radians) of each pellet for a shot aimed at `aimAngle`. */
export function pelletAngles(aimAngle: number, config: WeaponConfig, rng: Rng): number[] {
  const { pellets, spreadRadians, spreadJitter } = config;
  if (pellets === 1) {
    return [aimAngle + (rng() - 0.5) * spreadRadians * spreadJitter];
  }
  const step = spreadRadians / (pellets - 1);
  const start = aimAngle - spreadRadians / 2;
  const angles: number[] = [];
  for (let i = 0; i < pellets; i++) {
    angles.push(start + i * step + (rng() - 0.5) * step * spreadJitter);
  }
  return angles;
}
