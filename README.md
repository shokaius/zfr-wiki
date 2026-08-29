# ZF2R Wiki

An auto-generated reference wiki for **[Zombie Farm 2 Reforged](https://github.com/actualdoctornerd-ai/Zombie-Farm-2-Reforged)** — a fan preservation of The Playforge's mobile game, reverse-engineered from the iOS binary.

Every number is computed from the game's own code: the extractor **imports** the game's TypeScript constants and reads its JSON assets, then runs them through the game's real functions. Nothing is hand-transcribed, so a balance patch shows up here as a diff rather than drift. Derived values expand on the page to reveal their formula and link to the exact source symbol.

## How it works

```
game/                     # the ZF2R repo, pinned as a shallow submodule (source of truth)
tools/wiki/extract.ts     # imports game/src/**, reads game/public/assets/**, runs the game's own
                          #   functions → writes src/data/generated/*.json + copies referenced icons
src/                      # Vite + React + TypeScript + Tailwind site that renders the snapshot
```

The extractor is the single architectural bet: it reads the same symbols the game reads, so the wiki can't disagree with it. Regenerating against a newer game build is just bumping the submodule pin (`git -C game checkout <sha>`).

## Develop

```bash
git clone --recurse-submodules <this repo>   # or: git submodule update --init --depth 1
npm install
npm run dev        # predev runs the extractor, then Vite
```

Scripts: `wiki:extract` (regenerate the snapshot + icons), `dev`, `build`, `preview`, `typecheck`.

Generated data (`src/data/generated/`) and copied icons (`public/game-assets/`) are gitignored — they're rebuilt from the submodule on every `dev`/`build`.

## Deploy

Pushing to `main` builds and deploys to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) (checks out submodules, runs the extractor, publishes `dist/`). Asset URLs are relative, so it works from a project subpath or a domain root. Enable Pages → "GitHub Actions" in the repo settings.

## Scope

Included: every entity (crops, zombies, enemies, placeables, boosts, mutations, abilities, epic bosses), raid loot and **expected values** (net gold, brains/win, expected wins for a rare zombie), combat formulas, combining, economy, and a level-by-level unlock timeline.

Deferred: interactive simulators (mutation, combine, battle) and per-hour / per-tap throughput.

## Provenance

Zombie Farm is © The Playforge; ZF2R is a non-commercial preservation project and this wiki is a fan reference over it.
