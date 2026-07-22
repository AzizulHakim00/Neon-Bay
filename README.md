# Neon Bay v1.6 — Cinematic City Overhaul

**Neon Bay** is an original browser-based 3D open-city action game built with Three.js and Vite. Version 1.6 turns the ten-mission Vice Coast release into a more cinematic, materially detailed city with improved lighting, roads, vehicles, weather, windows, shoreline effects and mission presentation while preserving save schema v4.

The release takes inspiration from the atmosphere of classic tropical open-world games, but all branding, characters, districts, missions, music, dialogue and low-poly artwork are original. It does not copy GTA: Vice City maps, characters, logos, music, scripts or proprietary assets.


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

## Validate and build

```bash
npm test
```

The automated suite validates:

- JavaScript syntax
- Seven character animation clips
- Five playable interiors
- Vehicle damage and repair
- Living-city traffic, wanted and progression systems
- Vice Coast businesses, districts, radio stations and Chapter Two definitions
- Save v4, SMG purchase, nightclub purchase, phone, radio and pause/resume smoke flows
- All ten story mission flows
- Mission checkpoint collision reachability
- Production Vite build

The source build generates `dist/`. Vercel serves the verified browser-ready release from `vercel-static/` without running a remote build.

## Performance

Low, Medium, High and Ultra presets scale shadows, SSAO, FXAA, wetness, clouds, rain ripples, living windows, vehicle effects and cinematic post-processing. Expensive effects are reduced or disabled on lower presets, while unsupported post-processing falls back to direct rendering.

## Deployment

- Vercel: `vercel.json`
- GitHub Pages: `.github/workflows/deploy-pages.yml`
- Netlify: `netlify.toml`
- Windows desktop package: `.github/workflows/build-windows.yml`

## Legal and scope

All game content in this repository is original. Neon Bay is an ambitious browser-game project, not a full commercial GTA-sized production. Version 1.6 focuses on an original cinematic tropical city, scalable browser graphics and strong game systems rather than copying another game's content.
