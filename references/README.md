# references/

Source material for art and visual direction. Files here are **inputs**, not runtime assets.

## Rules

- Never overwrite, rename, or edit files in this folder. Add new versions under new names.
- The game never loads anything from `references/` directly.
- Runtime assets are generated into `public/assets/` by explicit jobs in
  `tools/assets/build-assets.ts` (`npm run assets:build`). Nothing is auto-discovered.
- Code refers to runtime assets only through keys in `src/client/assets/manifest.ts`.
- Before using a new file, inspect it: dimensions, transparency, background color, frame grid,
  and what it actually depicts. Record the findings in the inventory below.
- A map image is a visual reference unless it ships with collision/navigation data.
- An illustration is not a sprite sheet. Real-time animation needs consistent, in-game-size frames.

## Naming

`<subject>_<kind>[_<variant>].png`, lowercase with underscores, for example:

| Kind        | Meaning                                         |
| ----------- | ----------------------------------------------- |
| `sprite`    | In-game-size sprite or sprite sheet             |
| `fullbody`  | Large character illustration (reference only)   |
| `portrait`  | Face/bust art for UI                            |
| `tileset`   | Tiles on a fixed grid                           |
| `map`       | Map concept or full-map screenshot              |
| `fx`        | Effects (muzzle flash, impact, blood, etc.)     |

Runtime outputs use kebab-case and gameplay role, e.g. `public/assets/characters/survivor-cynthia.png`.

## Adding an asset

1. Drop the source file here with a descriptive name.
2. Inspect it and add an inventory entry.
3. Add a job to `tools/assets/build-assets.ts` (copy, or color-key + pad for sheets).
4. Run `npm run assets:build`.
5. Add a key and frame data to `src/client/assets/manifest.ts`.

## Inventory

### `cynthia_sprite.png` — used (survivor and zombie placeholders)

- 93 x 127 px, RGBA, but the background is **opaque** green `rgb(56,128,56)`, not transparent.
- Overworld walk sheet on a **32 x 32 grid, 3 columns x 4 rows** (the last 3 px column and 1 px
  row are cut off; no sprite pixels are lost). Visible character is about 16 x 26 px.
- Not one row per direction. Frame indices (`row * 3 + col`), measured by comparing frames and
  their horizontal mirrors:

  | Facing | Stand | Steps   |
  | ------ | ----- | ------- |
  | up     | 0     | 2, 10   |
  | down   | 5     | 8, 11   |
  | left   | 6     | 3, 9    |
  | right  | 1     | 4, 7    |

- Build job: color-key the green to transparent and pad to 96 x 128 so a 32 x 32 grid divides
  evenly → `public/assets/characters/survivor-cynthia.png`.
- The sheet has exactly 14 colors. A second job applies the same key/pad plus an exact
  14-color palette swap (green skin, ashen hair, purple-gray coat, red eye, white accents
  turned to blood) → `public/assets/characters/zombie-cynthia.png`. Same frame layout.
- Only 4 directions; aiming in 8+ directions maps to the nearest of the 4.

### `cynthia_fullbody_sprite.png` — reference only

- 1024 x 1536 px, RGB, single full-body pixel-art-style illustration on a dark background.
- Not usable for real-time animation (one pose, wrong scale). Possible future use: UI portrait
  or style reference.

### `map_1.png` — used (temporary arena background)

- 1031 x 788 px, RGB. Top-down town map concept; characters on it are drawn at roughly the same
  pixel scale as `cynthia_sprite.png`.
- Contains baked-in NPCs and props. **No collision or navigation data.**
- Build job: copied unchanged → `public/assets/environment/map-1.png`.
- The walkable arena is a hand-measured rectangle in `src/config/gameplay.ts`; buildings,
  trees, fences and baked NPCs are not solid.

## Licensing note

`cynthia_sprite.png` and `map_1.png` appear to be derived from Nintendo/Game Freak Pokémon
artwork. They are fine as local placeholders for a learning prototype but must be replaced with
original or properly licensed art before any public deployment (Milestone 7).
