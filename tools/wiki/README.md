# tools/wiki

`extract.ts` — the wiki's data spine. Run via `npm run wiki:extract` (also runs on `predev`/`prebuild`).

## What it does

Imports the game submodule's real TypeScript constants (`../../game/src/**`) and reads its JSON assets (`../../game/public/assets/**`), then runs the game's own functions to derive every stat and expected value. Outputs:

- `src/data/generated/*.json` — the typed snapshot the site renders (gitignored).
- `public/game-assets/all/*` — only the icons actually referenced by the data, flattened and copied out of the submodule (gitignored).
- `src/data/generated/meta.json` — the pinned game commit + build time, stamped on every page.

## The one rule

**Import the game's constants; never re-parse them.** Half of what the wiki publishes lives in `game/src/**` TypeScript (mutation bits, lineup bands, veterancy, loot brackets, pity floors, sell values, `ACTIVE_THEMES`), not JSON. Importing the real modules means the snapshot physically can't drift from the game. The game uses no path aliases, so `../../game/src/**` imports resolve directly under `tsx`.

EV numbers (net gold, brains/win, expected wins for a rare zombie, loot-tier probabilities) are computed by calling the game's own roll functions — Monte-Carlo where a pity floor makes a closed form awkward, with a fixed PRNG seed so builds are reproducible.
