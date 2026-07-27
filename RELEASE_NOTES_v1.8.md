# Neon Bay v1.8.0 — Empire Expansion

## Release summary

Version 1.8 turns Living City progression into a persistent empire loop. Players can purchase properties, collect passive income, complete replayable contracts, unlock Chapter Three operations, recover Data Shards and upgrade a personal vehicle fleet.

## New gameplay

- Five purchasable properties with world markers and district-specific themes
- Passive income bank and manual income collection
- Eight replayable timed contracts
- Five Chapter Three operations
- Eighteen collectible Data Shards
- Persistent vehicle fleet with engine, armor and nitro upgrade tracks
- Empire Command dashboard and contract HUD
- `O` shortcut plus phone, pause-menu and HUD access

## Persistence

- Save schema v6
- Three selectable save slots
- Per-slot backup recovery
- Migration from v5 multi-slot saves and v4/v3/v2/v1 legacy saves
- Persistent properties, income, contracts, operations, collectibles and fleet upgrades

## Build and reliability

- Transparent, reviewable v1.8 JavaScript overlay and source patcher
- Cache-busted `v1.8.0` engine, chunks and stylesheet names
- Self-contained static Vite output
- Recovery console resets v6 and all supported legacy keys
- Deterministic BUILD_INFO metadata
- Source audit, package verification, recovery execution and Chromium/WebGL gameplay smoke tests
- Verified static publication occurs only after every release check passes
