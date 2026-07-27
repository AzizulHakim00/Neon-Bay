# Neon Bay v1.8.2 — Playability & Performance Release

This release focuses on real gameplay responsiveness instead of adding more content.

## Runtime fixes

- Replaced the linear world-collision scan with a spatial collision grid.
- Removed per-frame camera and movement `Vector3` allocation churn.
- Added swept movement substeps to reduce wall snagging and tunnelling.
- Reduced camera collision probes and smoothed camera recovery.
- Switched AI distance culling to squared-distance checks.
- Moved AI simulation to a fixed 30 Hz tick, or 20 Hz on Low quality.
- Throttled interaction scans to 10 Hz while preserving immediate input response.
- Added Medium-to-Low automatic fallback for sustained slow frames.

## Rendering fixes

- Rebuilt road markings and vegetation with instanced rendering.
- Reduced the v1.8.1 world-polish layer from roughly 190 individual draw calls to three instanced draw calls.
- Removed temporary vector allocations from the graphics lighting/headlight update.
- Reduced menu and paused-state rendering to 20 FPS.

## Validation gates

- Deterministic source reconstruction
- JavaScript syntax validation
- v1.8 compatibility tests
- New v1.8.2 performance/playability regression checks
- Production Vite build
- Package and recovery verification
- Chromium/WebGL gameplay diagnostics
- Verified `vercel-static/` regeneration before merge
