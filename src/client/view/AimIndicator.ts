import type * as Phaser from 'phaser';
import { DISPLAY_CONFIG } from '../../config/display';
import { add, fromAngle, scale, type Vec2 } from '../../sim/vector';

/**
 * Aim line from the player, a reticle at the cursor and a faint circle showing the
 * active weapon's max range. Final aiming visuals are still undecided (PROJECT.md §2.4).
 */
export class AimIndicator {
  private readonly graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(DISPLAY_CONFIG.depth.aim);
  }

  draw(origin: Vec2, aimAngle: number, cursor: Vec2, weaponRange: number): void {
    const g = this.graphics;
    const tip = add(origin, scale(fromAngle(aimAngle), DISPLAY_CONFIG.aimLineLength));
    g.clear();
    g.lineStyle(1, 0xffffff, 0.12).strokeCircle(origin.x, origin.y, weaponRange);
    g.lineStyle(2, 0xffffff, 0.85).lineBetween(origin.x, origin.y, tip.x, tip.y);
    g.lineStyle(1, 0xff4d4d, 1).strokeCircle(cursor.x, cursor.y, DISPLAY_CONFIG.reticleRadius);
    g.fillStyle(0xff4d4d, 1).fillRect(cursor.x - 0.5, cursor.y - 0.5, 1, 1);
  }
}
