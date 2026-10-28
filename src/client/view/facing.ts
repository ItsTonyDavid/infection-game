import type { Facing } from '../assets/manifest';

const QUARTER = Math.PI / 4;

/** Four-direction facing from an aim angle (radians, +y down). */
export function facingFromAngle(angle: number): Facing {
  const a = Math.atan2(Math.sin(angle), Math.cos(angle));
  if (a > -QUARTER && a <= QUARTER) return 'right';
  if (a > QUARTER && a <= 3 * QUARTER) return 'down';
  if (a > -3 * QUARTER && a <= -QUARTER) return 'up';
  return 'left';
}
