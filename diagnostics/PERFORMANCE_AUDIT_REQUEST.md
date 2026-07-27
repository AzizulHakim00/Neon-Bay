# Neon Bay v1.8 performance and deployment audit

This branch exists to reproduce the reported gameplay lag and failed production deployment against the current `main` release.

Audit targets:
- generated `src/main.js` render loop and frame budget
- post-processing, shadows, pixel ratio, particles and world simulation cost
- v1.8 Empire systems per-frame work
- static output completeness and cache behavior
- deployability of `vercel-static/`
