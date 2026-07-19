# Neon Bay

**Neon Bay** is an original browser-based 3D open-city action game built with Three.js, JavaScript and Vite. It takes inspiration from the broad open-world action genre while using original characters, missions, city design, branding, procedural artwork and synthesized audio.

## Playable Chapter One

The included campaign is a complete five-job vertical slice:

1. **First Ride** — meet a contact, take the Sunset GT and deliver it to a garage.
2. **Beach Exchange** — survive an ambush, gain police attention and escape to the marina.
3. **Hot Delivery** — collect a package, secure a vehicle and beat a timed police pursuit.
4. **Warehouse Trouble** — clear a warehouse yard, recover a ledger and return it safely.
5. **District Boss** — defeat the district boss and guards, then escape across the pier.

## Included systems

- Procedural coastal city with roads, buildings, beach, ocean, pier, palms, streetlights and neon signs
- Third-person walking, sprinting, jumping and camera control
- Three enterable vehicles with acceleration, steering, reverse, boost, handbrake, collision damage and repair
- Ambient traffic and pedestrians
- Pistol shooting, magazine/reload logic, ammunition purchases and hit detection
- Enemy AI with pursuit, ranged attacks, health and boss behavior
- Five-star wanted system, police officers, police cruisers, pursuit and escape logic
- Health, armor, stamina, money, shops, clinic and garage services
- Dynamic day/night lighting, rain and overcast weather
- Mission HUD, objective markers, notifications, minimap, speedometer, pause, game-over and mission-complete screens
- Local browser save/continue system and automatic saves
- High, medium and low graphics settings
- Keyboard/mouse and touch/mobile controls
- Procedurally synthesized sound effects and ambient music; no copyrighted audio assets

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
| Pause | `Esc` |

## Run locally

Requirements: Node.js 20 or newer. Node.js 22 is recommended.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Validate and build

```bash
npm test
```

This runs JavaScript syntax validation, menu/save/pause smoke tests, all five mission-flow tests, collision reachability tests, and the production Vite build. The deployable site is generated in `dist/`.

To preview it:

```bash
npm run preview
```

## Deploy

### Vercel

Import this repository into Vercel. The included `vercel.json` runs `npm run build` and publishes `dist`. Every future push to `main` can redeploy automatically.

### GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, select **GitHub Actions**.
3. Push a commit or run the included workflow manually.

The workflow installs dependencies, executes the full test suite, builds the game and deploys `dist`.

### Netlify

Import the repository into Netlify. The included `netlify.toml` supplies the build command, publish directory and Node version.

## Project structure

```text
Neon-Bay/
├── .github/workflows/deploy-pages.yml
├── public/
│   └── favicon.svg
├── scripts/
│   ├── assemble-main.mjs
│   ├── mission-test.mjs
│   └── smoke-test.mjs
├── source/
│   ├── main.part-00.jsfrag
│   ├── ...
│   └── main.part-06.jsfrag
├── src/
│   └── styles.css
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── netlify.toml
```

## Repository source assembly

The game logic is stored as ordered text fragments under `source/`. `npm run dev`, `npm run build`, and `npm test` automatically assemble them into `src/main.js`. The generated file is intentionally ignored by Git.

## Scope

This is a complete browser-game chapter and reusable foundation, not a GTA-sized commercial production. A commercial-scale open world would require a larger team, dedicated 3D assets, animation capture, voice acting, extensive QA and significantly more development time. The foundation can be extended with additional districts, missions, vehicles, weapons and NPC systems.
