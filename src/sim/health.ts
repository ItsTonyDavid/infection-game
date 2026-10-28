export interface Health {
  readonly current: number;
  readonly max: number;
}

export function createHealth(max: number): Health {
  if (!Number.isFinite(max) || max <= 0) {
    throw new Error(`Invalid max health: ${max}`);
  }
  return { current: max, max };
}

/** Applies non-negative damage; health never drops below zero. */
export function applyDamage(health: Health, amount: number): Health {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Invalid damage amount: ${amount}`);
  }
  return { ...health, current: Math.max(0, health.current - amount) };
}

export function isDead(health: Health): boolean {
  return health.current <= 0;
}
