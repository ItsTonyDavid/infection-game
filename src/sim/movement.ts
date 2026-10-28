import { clamp, isFiniteVec, length, type Rect, scale, type Vec2, ZERO } from './vector';

/**
 * Converts a raw movement intent into a velocity in pixels per second.
 * Diagonal input is normalized so it is not faster than cardinal input.
 * Invalid input (NaN, Infinity) yields no movement.
 */
export function intentToVelocity(move: Vec2, speed: number): Vec2 {
  if (!isFiniteVec(move)) return ZERO;
  const magnitude = length(move);
  if (magnitude === 0) return ZERO;
  const factor = magnitude > 1 ? speed / magnitude : speed;
  return scale(move, factor);
}

/** Integrates position and keeps a circle of `radius` fully inside `bounds`. */
export function stepPosition(
  position: Vec2,
  velocity: Vec2,
  dtMs: number,
  bounds: Rect,
  radius: number,
): Vec2 {
  const dtSeconds = dtMs / 1000;
  return clampToBounds(
    { x: position.x + velocity.x * dtSeconds, y: position.y + velocity.y * dtSeconds },
    bounds,
    radius,
  );
}

export function clampToBounds(position: Vec2, bounds: Rect, radius: number): Vec2 {
  return {
    x: clamp(position.x, bounds.x + radius, bounds.x + bounds.width - radius),
    y: clamp(position.y, bounds.y + radius, bounds.y + bounds.height - radius),
  };
}
