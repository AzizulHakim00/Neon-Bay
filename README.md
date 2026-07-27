# Neon Bay v1.8 — Empire Expansion

**Neon Bay** is an original browser-based 3D open-city action game built with Three.js and Vite. Version 1.8 expands the verified v1.7 Living City release with persistent properties, passive income, replayable contracts, Chapter Three operations, collectible Data Shards, a personal vehicle fleet and save schema v6.

All characters, districts, missions, dialogue, branding, music and procedural artwork are original. The project is inspired by the open-city action genre without copying proprietary maps, characters, assets or story content.

## v1.8 Empire Expansion

- Five purchasable properties across Ocean Drive, Vice Point, Harbor, Downtown and Little Bay
- Passive property income, banked revenue and Empire Command collection controls
- Eight replayable timed contracts covering driving, combat, wanted pursuits, exploration and survival
- Five Chapter Three operations: Signal Break, Glass Harbor, The Neon Ledger, Skyline Siege and Empire State
- Eighteen collectible Data Shards placed across the city
- Persistent personal fleet with vehicle purchase plus engine, armor and nitro upgrades
- Empire Command dashboard available from the HUD, phone, pause menu and `O` shortcut
- Contract objective HUD, rewards, progression and autosave integration
- Save schema v6 with three slots, per-slot backups and migration from v5/v4/v3/v2/v1 data

## Living City systems retained

- Adaptive enemy AI with sight, hearing, search, cover, flanking, suppression, morale and retreat behavior
- Five-star wanted escalation with officers, tactical units, cruisers and roadblocks
- Weapon recoil, range falloff, headshots, hit feedback and weapon upgrade tracks
- Combat, driving and street skill trees
- Nitro driving, vehicle damage and performance-aware world simulation
- Dynamic city events, businesses, reputation, territory, interiors and radio
- Ten connected story missions across the original two chapters

## Controls

| Action | Control |
|---|---|
| Move / drive | `W A S D` |
| Look / aim | Mouse |
| Sprint / nitro boost | `Shift` |
| Jump / handbrake | `Space` |
| Enter, exit or interact | `E` |
| Shoot | Left mouse button |
| Reload | `R` |
| Select pistol / shotgun / SMG | `1` / `2` / `3` |
| Cycle weapon | `Q` |
| Change radio | `X` |
| Open phone | `P` |
| Open Empire Command | `O` |
| Pause | `Esc` |

Touch controls support movement, camera look, fire, jump, interaction and weapon swapping.

## Run locally

Node.js 22 is recommended.

```bash
npm ci
npm run dev
```

## Build and validate v1.8

```bash
npm ci
npm run build:release
npm run test:v17
npm run test:v18
node scripts/package-v18-release.mjs --verify-only dist
node scripts/test-v18-recovery.mjs dist
```

The release pipeline validates:

- deterministic reconstruction of all source overlays through v1.8
- JavaScript syntax and v1.7/v1.8 gameplay wiring
- five properties, eight contracts, five Chapter Three operations and eighteen Data Shards
- save schema v6, multi-slot backup recovery and legacy migration
- local-only cache-busted `v1.8.0` JavaScript and CSS assets
- recovery-console reset behavior for v6 and supported legacy saves
- rendered Chromium/WebGL startup, menu, gameplay, phone, pause, skills, Empire Command, contract and save flows
- browser console errors, page exceptions, failed requests, CSS parsing and viewport layout

## Deployment

The verified production build is copied into `vercel-static/` only after source, packaging, recovery and rendered browser tests pass. Vercel serves that committed static directory without rebuilding the game remotely. Pushes merged into `main` trigger the production deployment.

See [RELEASE_NOTES_v1.8.md](RELEASE_NOTES_v1.8.md) for the detailed release changes.

## Legal and scope

Neon Bay is an original browser-game vertical slice, not a commercial GTA-sized production. The project prioritizes a dense reactive city, maintainable systems and reproducible releases over copied content or an impractically large empty map.
