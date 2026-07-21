# Neon Bay v1.4 — Vice Coast

**Neon Bay** is an original browser-based 3D open-city action game built with Three.js and Vite. Version 1.4 expands the project into a ten-mission, 1980s-inspired coastal crime adventure with a denser city, stronger graphics, businesses, radio stations, a phone/map interface and a second story chapter.

The release takes inspiration from the atmosphere of classic tropical open-world games, but all branding, characters, districts, missions, music, dialogue and low-poly artwork are original. It does not copy GTA: Vice City maps, characters, logos, music, scripts or proprietary assets.

## v1.4 graphics upgrade

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
- Three original procedural radio stations: Flashwave 86, Sunset FM and Nightdrive
- In-game phone with city map, district, business, reputation and story information
- Three purchasable businesses with periodic income
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

The automated suite validates JavaScript syntax, seven character animation clips, five playable interiors, vehicle damage, living-city systems, Vice Coast businesses and radio, save v4, all ten mission flows, collision reachability and the production Vite build.

## Performance

Graphics presets adjust pixel density, shadows and bloom strength. Low mode disables post-processing. Bloom modules are dynamically loaded, so unsupported browsers fall back to direct rendering.

## Deployment

- Vercel: `vercel.json`
- GitHub Pages: `.github/workflows/deploy-pages.yml`
- Netlify: `netlify.toml`
- Windows desktop package: `.github/workflows/build-windows.yml`

## Legal and scope

All game content in this repository is original. Neon Bay is an ambitious browser-game project, not a full commercial GTA-sized production. Version 1.4 focuses on a dense, playable tropical city and strong game systems rather than copying another game's content.
