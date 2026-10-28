/**
 * Builds runtime assets in public/assets from source files in references/.
 * Sources are never modified. Each job is listed explicitly; nothing is auto-discovered.
 *
 * Usage: npm run assets:build
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { decodePng, encodePng, type RgbaImage } from './png.ts';

type Rgb = readonly [number, number, number];

type AssetJob =
  | { readonly kind: 'copy'; readonly source: string; readonly output: string }
  | {
      readonly kind: 'spritesheet';
      readonly source: string;
      readonly output: string;
      /** Opaque background color in the source to make transparent. */
      readonly colorKey: Rgb;
      /** Pad (transparent) to this size so the frame grid divides evenly. */
      readonly padTo: { readonly width: number; readonly height: number };
      /** Exact source color -> output color. Colors not listed are kept unchanged. */
      readonly palette?: readonly (readonly [Rgb, Rgb])[];
    };

/**
 * Infected recolor of the Cynthia sheet: sickly green skin, ashen hair, bruised purple-gray
 * coat, a red eye, and the white accents (under-eye shine, coat buttons) turned into blood.
 * Skin is the only green so it stays readable against the grass of the map.
 */
const CYNTHIA_ZOMBIE_PALETTE: readonly (readonly [Rgb, Rgb])[] = [
  [
    [248, 208, 184],
    [176, 216, 144],
  ], // skin
  [
    [216, 152, 112],
    [120, 168, 96],
  ], // skin shade
  [
    [120, 64, 64],
    [72, 104, 56],
  ], // skin darkest
  [
    [56, 112, 192],
    [232, 32, 32],
  ], // eye iris
  [
    [168, 160, 200],
    [224, 216, 128],
  ], // eye white
  [
    [232, 232, 248],
    [168, 24, 32],
  ], // white accents
  [
    [248, 248, 192],
    [224, 220, 196],
  ], // hair highlight
  [
    [240, 208, 120],
    [192, 184, 152],
  ], // hair
  [
    [184, 152, 88],
    [140, 132, 108],
  ], // hair shade
  [
    [120, 96, 72],
    [88, 80, 72],
  ], // hair darkest
  [
    [120, 120, 144],
    [112, 96, 120],
  ], // coat highlight
  [
    [80, 80, 96],
    [72, 60, 80],
  ], // coat
  [
    [40, 40, 48],
    [36, 28, 40],
  ], // coat dark
];

const JOBS: readonly AssetJob[] = [
  {
    // 93x127 source, 32x32 grid, 3 columns x 4 rows; see references/README.md.
    kind: 'spritesheet',
    source: 'references/cynthia_sprite.png',
    output: 'public/assets/characters/survivor-cynthia.png',
    colorKey: [56, 128, 56],
    padTo: { width: 96, height: 128 },
  },
  {
    // Same source and frame layout as the survivor sheet, recolored.
    kind: 'spritesheet',
    source: 'references/cynthia_sprite.png',
    output: 'public/assets/characters/zombie-cynthia.png',
    colorKey: [56, 128, 56],
    padTo: { width: 96, height: 128 },
    palette: CYNTHIA_ZOMBIE_PALETTE,
  },
  {
    kind: 'copy',
    source: 'references/map_1.png',
    output: 'public/assets/environment/map-1.png',
  },
];

const ROOT = resolve(import.meta.dirname, '..', '..');

function rgbKey(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

function recolor(image: RgbaImage, palette: readonly (readonly [Rgb, Rgb])[]): RgbaImage {
  const map = new Map(palette.map(([from, to]) => [rgbKey(...from), to]));
  const data = Uint8Array.from(image.data);
  for (let i = 0; i < data.length; i += 4) {
    const to = map.get(rgbKey(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0));
    if (to) data.set(to, i);
  }
  return { width: image.width, height: image.height, data };
}

function keyAndPad(image: RgbaImage, colorKey: Rgb, width: number, height: number): RgbaImage {
  if (image.width > width || image.height > height) {
    throw new Error(
      `Source ${image.width}x${image.height} is larger than padTo ${width}x${height}`,
    );
  }
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const src = (y * image.width + x) * 4;
      const r = image.data[src] ?? 0;
      const g = image.data[src + 1] ?? 0;
      const b = image.data[src + 2] ?? 0;
      if (r === colorKey[0] && g === colorKey[1] && b === colorKey[2]) continue;
      data.set(image.data.subarray(src, src + 4), (y * width + x) * 4);
    }
  }
  return { width, height, data };
}

function run(job: AssetJob): void {
  const source = resolve(ROOT, job.source);
  const output = resolve(ROOT, job.output);
  mkdirSync(dirname(output), { recursive: true });

  if (job.kind === 'copy') {
    copyFileSync(source, output);
  } else {
    const image = decodePng(readFileSync(source));
    const keyed = keyAndPad(image, job.colorKey, job.padTo.width, job.padTo.height);
    const processed = job.palette ? recolor(keyed, job.palette) : keyed;
    writeFileSync(output, encodePng(processed));
  }
  console.info(`[assets] ${job.kind.padEnd(11)} ${job.source} -> ${job.output}`);
}

let failures = 0;
for (const job of JOBS) {
  try {
    run(job);
  } catch (error) {
    failures++;
    console.error(`[assets] FAILED ${job.source}:`, error instanceof Error ? error.message : error);
  }
}
if (failures > 0) {
  process.exitCode = 1;
}
