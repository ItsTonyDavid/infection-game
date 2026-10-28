# Infection

Top-down 2D multiplayer infection-survival browser game (learning project).
Product requirements: `PROJECT.md`. Current status: `STATE.md`. Decisions: `DECISIONS.md`.

## Requirements

- Node.js 24+ (the asset tool runs TypeScript directly with Node's type stripping)
- npm

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

Controls: **WASD** move · **mouse** aim · **left click** fire (one shot per click) ·
**Q** switch weapon · **R** reload · **Enter** restart.

## Scripts

| Script                 | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Dev server with hot reload                               |
| `npm run build`        | Type check + production build into `dist/`               |
| `npm run preview`      | Serve the production build                               |
| `npm test`             | Unit tests (Vitest)                                      |
| `npm run typecheck`    | TypeScript for app (`src/`) and tools (`tools/`)         |
| `npm run lint`         | ESLint (typescript-eslint strict, type-checked)          |
| `npm run format`       | Prettier write (`format:check` to verify)                |
| `npm run check`        | typecheck + lint + format check + tests                  |
| `npm run assets:build` | Regenerate `public/assets/` from `references/`           |

## Layout

```text
src/sim/          Pure game rules (no Phaser). Will move under server authority.
src/config/       Gameplay tuning (PROVISIONAL values) and display settings.
src/client/       Phaser scenes, input bindings, views/effects, DOM HUD, asset manifest.
tools/assets/     Asset build script (references/ -> public/assets/).
references/       Source art. Read-only. See references/README.md.
public/assets/    Generated runtime assets (committed so `npm run dev` works immediately).
```
