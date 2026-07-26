# Neon Bay v1.7 — Living City

**Neon Bay** is an original browser-based 3D open-city action game built with Three.js and Vite. Version 1.7 extends the stable cinematic v1.6.2 runtime with deeper combat, smarter AI, five-star police escalation, dynamic city events, progression upgrades, multi-slot saves and production browser validation.

All characters, districts, missions, dialogue, branding, music and procedural artwork are original. The project is inspired by the open-city action genre without copying proprietary maps, characters, assets or story content.

## v1.7 Living City highlights

- Enemy sight, hearing, last-known-position search, cover, flanking, suppression, morale and retreat behavior
- Adaptive AI Director that adjusts reaction time, accuracy, damage and pressure from player performance
- Five wanted levels with tactical officers, cruisers, roadblocks and city-lockdown response
- Weapon recoil, spread, range, damage falloff, headshots and normal/headshot hit markers
- Damage, accuracy and reload upgrade tracks for pistol, shotgun and VICE SMG
- Nine unlockable combat, driving and street skills
- Nitro boost with regeneration and vehicle-durability progression
- Five free-roam dynamic event templates with cash, reputation and skill-point rewards
- Performance-aware update throttling for distant enemies, civilians and traffic
- Save schema v5 with three selectable slots, per-slot backups and v1–v4 migration
- Expanded HUD, phone and pause-menu access to skills, upgrades, events and save slots

## Existing world and story

The complete Vice Coast experience remains available:

- Ten connected story missions across two chapters
- Ocean Drive, Vice Point, Harbor District, Downtown and Little Bay
- Five usable interiors: apartment, gun shop, garage, police station and nightclub
- Three purchasable businesses with periodic income
- Three original procedural radio stations
- Vehicle damage, upgrades, taxi jobs, street races, territory and career progression
- Dynamic time, weather and scalable cinematic graphics

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
| Pistol / shotgun / SMG | `1` / `2` / `3` |
| Cycle weapon | `Q` |
| Change radio station | `X` |
| Open phone | `P` |
| Pause | `Esc` |

Touch controls support movement, camera look, fire, jump, interaction and weapon swapping.

## Run locally

Node.js 22 is recommended.

```bash
npm install
npm run dev
```

## Build and validate v1.7

```bash
npm ci
npm run build:release
npm run test:v17
node scripts/package-v17-release.mjs --verify-only dist
node scripts/test-v17-recovery.mjs dist
```

The release pipeline validates:

- deterministic reconstruction of the v1.3–v1.7 source overlays
- JavaScript syntax and v1.7 system wiring
- five-star wanted profiles, skills, weapon upgrades and dynamic events
- save schema v5, legacy migration and backup recovery
- local-only cache-busted v1.7 JavaScript and CSS assets
- startup recovery and complete save reset behavior
- rendered Chromium/WebGL menu, settings, gameplay, HUD, phone, skills, pause and save flow
- browser console errors, page exceptions, failed requests, CSS parsing and viewport layout

## Deployment

The verified production build is copied to `vercel-static/` only after the full source, packaging, recovery and browser smoke tests pass. Vercel serves that committed static directory without remote compilation. GitHub Pages, Netlify and Windows packaging configurations remain included.

See [RELEASE_NOTES_v1.7.md](RELEASE_NOTES_v1.7.md) for the detailed release changes.

## Legal and scope

Neon Bay is an ambitious original browser-game vertical slice, not a commercial GTA-sized production. The project prioritizes a dense, reactive city, maintainable systems and reproducible releases over copied content or an impractically large map.
