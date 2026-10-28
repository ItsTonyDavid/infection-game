import type * as Phaser from 'phaser';
import { DISPLAY_CONFIG } from '../../config/display';
import type { Vec2 } from '../../sim/vector';
import type { WeaponId } from '../../sim/weapons';
import type { PelletTrace } from '../../sim/world';

const TRACER_COLOR: Readonly<Record<WeaponId, number>> = {
  pistol: 0xfff1a8,
  shotgun: 0xffa64d,
};

const MUZZLE_FLASH_MS = 50;

interface Tracer {
  readonly from: Vec2;
  readonly to: Vec2;
  readonly color: number;
  remainingMs: number;
}

interface Burst {
  readonly at: Vec2;
  remainingMs: number;
}

/**
 * Short-lived combat visuals: tracers, muzzle flashes, impact sparks, damage numbers.
 * Tracers, flashes and impacts share one Graphics object redrawn each frame instead of
 * creating and destroying game objects per shot.
 */
export class CombatEffects {
  private readonly scene: Phaser.Scene;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private tracers: Tracer[] = [];
  private flashes: Burst[] = [];
  private impacts: Burst[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(DISPLAY_CONFIG.depth.effects);
  }

  shot(weapon: WeaponId, muzzle: Vec2, pellets: readonly PelletTrace[]): void {
    this.flashes.push({ at: muzzle, remainingMs: MUZZLE_FLASH_MS });
    for (const pellet of pellets) {
      this.tracers.push({
        from: muzzle,
        to: pellet.end,
        color: TRACER_COLOR[weapon],
        remainingMs: DISPLAY_CONFIG.tracerLifetimeMs,
      });
      if (pellet.hit) {
        this.impacts.push({ at: pellet.end, remainingMs: DISPLAY_CONFIG.impactLifetimeMs });
      }
    }
  }

  damageNumber(at: Vec2, amount: number): void {
    const text = this.scene.add
      .text(at.x, at.y - 10, String(amount), {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffe066',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(DISPLAY_CONFIG.depth.floatingText);
    this.scene.tweens.add({
      targets: text,
      y: at.y - 24,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        text.destroy();
      },
    });
  }

  update(deltaMs: number): void {
    const alive = (item: { remainingMs: number }) => (item.remainingMs -= deltaMs) > 0;
    this.tracers = this.tracers.filter(alive);
    this.flashes = this.flashes.filter(alive);
    this.impacts = this.impacts.filter(alive);

    const g = this.graphics;
    g.clear();
    for (const t of this.tracers) {
      const alpha = t.remainingMs / DISPLAY_CONFIG.tracerLifetimeMs;
      g.lineStyle(1, t.color, alpha).lineBetween(t.from.x, t.from.y, t.to.x, t.to.y);
    }
    for (const f of this.flashes) {
      g.fillStyle(0xffffff, f.remainingMs / MUZZLE_FLASH_MS).fillCircle(f.at.x, f.at.y, 3);
    }
    for (const i of this.impacts) {
      const life = i.remainingMs / DISPLAY_CONFIG.impactLifetimeMs;
      g.fillStyle(0xffffff, life).fillRect(i.at.x - 1, i.at.y - 1, 3, 3);
      g.lineStyle(1, 0xffe066, life).strokeCircle(i.at.x, i.at.y, 2 + (1 - life) * 5);
    }
  }
}
