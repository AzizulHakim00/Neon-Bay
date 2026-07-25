# Neon Bay v1.6.1 — Stable Cinematic Hotfix

**Neon Bay** is an original browser-based 3D open-city action game built with Three.js and Vite. Version 1.6.1 stabilizes the cinematic v1.6 release with a self-contained browser bundle, startup recovery tools and cache-busted static assets while preserving save schema v4 and the complete ten-mission Vice Coast experience.

The release takes inspiration from the atmosphere of classic tropical open-world games, but all branding, characters, districts, missions, music, dialogue and low-poly artwork are original. It does not copy GTA: Vice City maps, characters, logos, music, scripts or proprietary assets.

## Download v1.6.1

- [Complete source package](release-v1.6.1/Neon_Bay_v1.6.1_Complete_Source.zip)
- [Standalone static deployment](release-v1.6.1/Neon_Bay_v1.6.1_Standalone_Static.zip)
- [SHA-256 checksums](release-v1.6.1/Neon_Bay_v1.6.1_SHA256.txt)

## v1.6.1 stable cinematic hotfix

- Replaced runtime fragment fetching, source patching and Blob-module reconstruction with a normal bundled engine entry point
- Bundled Three.js and every dynamic post-processing chunk locally
- Removed CDN and Google Fonts runtime dependencies
- Added cache-busted v1.6.1 JavaScript and CSS filenames
- Added startup diagnostics and a twelve-second stalled-startup detector
- Added automatic one-time Safe Graphics recovery
- Added manual Safe Graphics, Retry Startup and Reset Save and Retry actions
- Preserved Vercel's no-install, no-build deployment from `vercel-static/`
- Added reproducible release ZIP generation and SHA-256 manifests

## v1.6 cinematic city overhaul

- Procedural textured roads and façades with cracks, wear, bump detail and gradual wetness
- Living windows with fake rooms and time-based office, hotel and residential lighting
- Moving sunlight, quality-scaled soft shadows and grounded contact shadows
- SSAO, FXAA, cinematic color grading, vignette, grain and cutscene focus treatment
- Crosswalks, manholes, drains, skid marks, wet shoreline sand and footprints
- Dynamic clouds, storm lightning and local rain ripples
- Vehicle reverse lights, indicators, dashboard glow, exhaust and tire effects
- Animated chapter and mission title cards across all ten jobs

## v1.5 visual overhaul

- Ultra graphics preset with higher effect density
- Clearcoat vehicle paint, improved glass and dynamic night headlights
- Rain-responsive puddles, neon reflections and adaptive weather fog
- Animated beach foam, atmospheric particles and denser street props
- Bullet tracers, muzzle flashes, impact sparks and camera shake
- Cinematic exposure, vignette and subtle film-grain presentation

## v1.4 Vice Coast foundation

- Unreal Bloom post-processing on supported devices
- Animated shader ocean with waves, foam, reflections and rain response
- Gradient sunset/night sky with stars and a moving sun disc
- Wet-road material response during rain
- Stronger neon signs, nightlife lighting and retro screen treatment
- New Starfall Nightclub exterior and playable interior
- New Harbor District with warehouses, cargo containers, floodlights and crane
- Expanded Downtown skyline and Vice Point resort area
- New palm-lined boardwalk along the beach
- Higher-density traffic with fourteen active route vehicles
- Four additional vehicle classes: exotic, muscle, limousine and turbo coupe

## Vice Coast systems

- Ten connected story missions across two chapters
- Three original procedural radio stations:
  - Flashwave 86
  - Sunset FM
  - Nightdrive
- In-game phone with city map, district, business, reputation and story information
- Three purchasable businesses with periodic income:
  - Starfall Nightclub
  - Coastline Cabs
  - Vice Coast Customs
- VICE SMG weapon with separate ammunition and ownership state
- Five usable interiors: apartment, gun shop, garage, police station and nightclub
- Five districts: Ocean Drive, Vice Point, Harbor District, Downtown and Little Bay
- Persistent save schema v4 for businesses, radio, weapons, territory, story and career data

## Story missions

### Chapter One

1. **First Ride**
2. **Beach Exchange**
3. **Hot Delivery**
4. **Warehouse Trouble**
5. **District Boss**

### Chapter Two

6. **Aftermath** — defend Starfall Nightclub from retaliation.
7. **Inside Job** — steal evidence from the police station and escape the search.
8. **Harbor Run** — move a timed shipment across the city under police pressure.
9. **Double Cross** — survive an ambush and expose the traitor.
10. **Neon Crown** — defeat the rival factions and escape the final lockdown.

## Controls

| Action | Control |
|---|---|
| Move / drive | `W A S D` |
| Look / aim | Mouse |
| Sprint / vehicle boost | `Shift` |
| Jump / handbrake | `Space` |
| Enter, exit or interact | `E` |
| Shoot | Left mouse button |
| Reload | `R` |
| Pistol / shotgun / SMG | `1` / `2` / `3` |
| Cycle weapon | `Q` |
| Change radio station | `X` |
| Open phone and city map | `P` |
| Pause | `Esc` |

Touch controls include movement, camera look, fire, jump, interaction and weapon swapping.

## Run locally

Node.js 22 is recommended.

```bash
npm install
npm run dev
```

## Build and validate v1.6.1

```bash
npm install
npm run build:hotfix
node scripts/test-v161-recovery.mjs dist
```

The v1.6.1 release workflow validates:

- JavaScript syntax across every emitted bundle and dynamic chunk
- HTML, CSS and JavaScript file references
- Absence of external runtime dependencies
- Cache-busted engine and stylesheet names
- Safe Graphics and Reset Save recovery behavior
- Local HTTP `200` responses for the complete static directory
- Complete-source and standalone-static SHA-256 checksums

Vercel serves the committed browser-ready release from `vercel-static/` without installing dependencies or running a remote build.

## Performance

Low, Medium, High and Ultra presets scale shadows, SSAO, FXAA, wetness, clouds, rain ripples, living windows, vehicle effects and cinematic post-processing. Expensive effects are reduced or disabled on lower presets, while unsupported post-processing falls back to direct rendering.

## Deployment

- Vercel: `vercel.json`
- GitHub Pages: `.github/workflows/deploy-pages.yml`
- Netlify: `netlify.toml`
- Windows desktop package: `.github/workflows/build-windows.yml`

## Legal and scope

All game content in this repository is original. Neon Bay is an ambitious browser-game project, not a full commercial GTA-sized production. Version 1.6.1 focuses on stable startup, a self-contained browser release, scalable cinematic graphics and strong game systems rather than copying another game's content.
