import * as Phaser from 'phaser';
import { DISPLAY_CONFIG } from '../../config/display';
import {
  FACINGS,
  IMAGE_ASSETS,
  SPRITESHEET_ASSETS,
  CHARACTER_FRAMES,
  TEXTURE_KEYS,
  walkAnimationKey,
} from '../assets/manifest';
import type { Hud } from '../hud/hud';
import { GAME_SCENE_KEY } from './GameScene';

export const BOOT_SCENE_KEY = 'boot';

/** Loads assets from the manifest, defines animations and generated placeholders. */
export class BootScene extends Phaser.Scene {
  private readonly hud: Hud;

  constructor(hud: Hud) {
    super(BOOT_SCENE_KEY);
    this.hud = hud;
  }

  preload(): void {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.error(`[boot] Failed to load asset "${file.key}" from ${file.src}`);
      this.hud.showError(`Missing asset: ${file.key}. Run "npm run assets:build".`);
    });

    for (const asset of IMAGE_ASSETS) {
      this.load.image(asset.key, asset.url);
    }
    for (const sheet of SPRITESHEET_ASSETS) {
      this.load.spritesheet(sheet.key, sheet.url, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }
  }

  create(): void {
    this.createSurvivorAnimations();
    this.scene.start(GAME_SCENE_KEY);
  }

  private createSurvivorAnimations(): void {
    for (const facing of FACINGS) {
      const frames = CHARACTER_FRAMES[facing];
      const [stepA, stepB] = frames.steps;
      this.anims.create({
        key: walkAnimationKey(facing),
        frames: this.anims.generateFrameNumbers(TEXTURE_KEYS.survivor, {
          frames: [stepA, frames.stand, stepB, frames.stand],
        }),
        frameRate: DISPLAY_CONFIG.walkFrameRate,
        repeat: -1,
      });
    }
  }
}
