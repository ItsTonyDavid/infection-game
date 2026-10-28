import { add, dot, scale, sub, type Vec2 } from './vector';
import type { WeaponConfig } from './weapons';

export interface CircleTarget {
  readonly id: string;
  readonly position: Vec2;
  readonly radius: number;
}

export interface PelletHit {
  readonly targetId: string;
  readonly distance: number;
  readonly point: Vec2;
}

/**
 * Distance along a ray (unit `direction`) to the first intersection with a circle,
 * or null if the ray misses. Returns 0 when the origin is inside the circle.
 */
export function rayCircleDistance(
  origin: Vec2,
  direction: Vec2,
  center: Vec2,
  radius: number,
): number | null {
  const toCenter = sub(center, origin);
  const c = dot(toCenter, toCenter) - radius * radius;
  if (c <= 0) return 0;
  const b = dot(toCenter, direction);
  if (b <= 0) return null;
  const discriminant = b * b - c;
  if (discriminant < 0) return null;
  return b - Math.sqrt(discriminant);
}

/** Rounded damage of one pellet at `distance`; 0 beyond `maxRange`. */
export function damageAtDistance(config: WeaponConfig, distance: number): number {
  if (distance > config.maxRange) return 0;
  if (distance <= config.falloffStart) return config.damagePerPellet;
  const span = config.maxRange - config.falloffStart;
  const t = span === 0 ? 1 : (distance - config.falloffStart) / span;
  const multiplier = 1 - (1 - config.minDamageMultiplier) * t;
  return Math.round(config.damagePerPellet * multiplier);
}

/** Nearest target hit by a hitscan pellet within `maxRange`, or null. */
export function resolvePellet(
  origin: Vec2,
  direction: Vec2,
  maxRange: number,
  targets: readonly CircleTarget[],
): PelletHit | null {
  let best: PelletHit | null = null;
  for (const target of targets) {
    const d = rayCircleDistance(origin, direction, target.position, target.radius);
    if (d === null || d > maxRange) continue;
    if (best === null || d < best.distance) {
      best = { targetId: target.id, distance: d, point: add(origin, scale(direction, d)) };
    }
  }
  return best;
}
