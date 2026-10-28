import type { Vec2 } from './vector';

/**
 * What a player wants to do this step. This is the shape a client will send to the
 * authoritative server in Milestone 2; it carries intent only, never outcomes.
 */
export interface PlayerIntent {
  /** Desired movement direction. Each axis in [-1, 1]; the simulation normalizes it. */
  readonly move: Vec2;
  /** Aim direction in radians, world space (0 = +x, clockwise because +y is down). */
  readonly aimAngle: number;
  /** Edge-triggered: one shot of the active weapon per click. Holding does not repeat. */
  readonly fire: boolean;
  /** Edge-triggered: cycle to the next weapon. Applied before `fire` in the same step. */
  readonly switchWeapon: boolean;
  /** Edge-triggered: true only on the step the reload key was pressed. */
  readonly reload: boolean;
}

export const IDLE_INTENT: PlayerIntent = {
  move: { x: 0, y: 0 },
  aimAngle: 0,
  fire: false,
  switchWeapon: false,
  reload: false,
};
