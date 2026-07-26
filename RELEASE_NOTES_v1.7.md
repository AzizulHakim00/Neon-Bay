# Neon Bay v1.7 — Living City Release Notes

## Gameplay systems

Version 1.7 adds a new `LivingCityV17` director module and integrates it into the generated game engine. Enemy behavior now uses sight, sound, last-known position, cover selection, flanking, suppression, morale and retreat decisions. The director tracks player performance and adjusts enemy reaction, accuracy, damage and pressure without changing story mission objectives.

The police system now supports five wanted levels. Higher levels add larger officer and cruiser limits, tactical officers and additional roadblocks. The wanted HUD displays five stars and save data preserves the current progression state through save schema v5.

## Combat and progression

Weapons now have recoil, spread, effective range and distance falloff. Headshots receive a separate multiplier and the HUD shows normal and headshot hit markers. Each weapon includes damage, accuracy and reload upgrade tracks.

Nine skills are available across combat, driving and street tracks. Skills improve recoil, headshots, reload speed, nitro capacity, vehicle durability, heat decay, event rewards, business income and low-health adaptive assistance.

## Living-city events

Five event templates can appear while the player is free-roaming and not wanted. Events include combat encounters, timed destination objectives and vehicle deliveries. Successful events award cash and reputation; every second successful event awards a skill point.

## Vehicles and performance

Holding `Shift` while driving consumes nitro and increases maximum speed. Nitro regenerates when boost is released. The simulation reduces update frequency for distant AI and traffic, with stronger throttling on lower graphics presets.

## Saves and recovery

Save schema v5 introduces three selectable slots and one backup per slot. Existing v1–v4 saves migrate into the selected v5 slot after a successful load. Corrupted slot data attempts one backup recovery without recursive retry loops. The startup recovery console can remove all v1–v5 save and backup keys.

## Production validation

The release workflow performs source-system tests, a deterministic Vite production build, self-contained asset verification, recovery tests and a rendered Chromium/WebGL smoke test. The browser test checks the menu, settings, save-slot selection, New Game, HUD, phone, pause menu, skills panel, save-v5 data and return to the main menu. The verified `dist/` output is copied to `vercel-static/` only after all checks pass.
