import type * as Phaser from 'phaser';
import { DISPLAY_CONFIG } from '../../config/display';
import { isDead } from '../../sim/health';
import type { DummyState } from '../../sim/world';
import { CHARACTER_FRAMES, CHARACTER_ORIGIN_Y, TEXTURE_KEYS } from '../assets/manifest';

const BAR_WIDTH = 16;
const BAR_OFFSET_Y = 18;

/** Zombie training dummy (static zombie Cynthia frame) with a health bar and hit flash. */
export class DummyView {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly bar: Phaser.GameObjects.Graphics;
  private flashRemainingMs = 0;
  private lastHealth = -1;
  private lastDown = false;

  constructor(scene: Phaser.Scene, dummy: DummyState) {
    this.scene = scene;
    const { x, y } = dummy.position;
    this.sprite = scene.add
      .image(x, y, TEXTURE_KEYS.zombie, CHARACTER_FRAMES.down.stand)
      .setOrigin(0.5, CHARACTER_ORIGIN_Y)
      .setDepth(y);
    this.bar = scene.add.graphics().setDepth(y + 1);
  }

  flash(): void {
    this.flashRemainingMs = DISPLAY_CONFIG.hitFlashMs;
    this.sprite.setTintFill(0xffffff);
  }

  respawn(): void {
    this.sprite.setAlpha(0);
    this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 200 });
  }

  sync(dummy: DummyState, deltaMs: number): void {
    if (this.flashRemainingMs > 0) {
      this.flashRemainingMs -= deltaMs;
      if (this.flashRemainingMs <= 0) this.sprite.clearTint();
    }

    const down = isDead(dummy.health);
    if (down !== this.lastDown) {
      this.lastDown = down;
      this.sprite.setAngle(down ? 90 : 0).setAlpha(down ? 0.45 : 1);
    }

    if (dummy.health.current === this.lastHealth) return;
    this.lastHealth = dummy.health.current;
    this.drawBar(dummy);
  }

  private drawBar(dummy: DummyState): void {
    const { x, y } = dummy.position;
    const ratio = dummy.health.current / dummy.health.max;
    const left = Math.round(x - BAR_WIDTH / 2);
    const top = Math.round(y - BAR_OFFSET_Y);
    this.bar.clear();
    if (ratio <= 0) return;
    this.bar.fillStyle(0x000000, 0.7).fillRect(left - 1, top - 1, BAR_WIDTH + 2, 4);
    this.bar.fillStyle(0xd94a3d).fillRect(left, top, Math.max(1, Math.round(BAR_WIDTH * ratio)), 2);
  }
}
