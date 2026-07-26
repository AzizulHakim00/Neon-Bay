# Neon Bay runtime stability fixes

This follow-up was validated in a rendered headless Chromium session using SwiftShader WebGL 2.

## Confirmed root causes and fixes

- Corrected the Google Fonts import-removal expression that was truncating the compiled stylesheet at semicolons inside the font URL.
- Removed all remaining external font declarations and replaced them with local system-font stacks.
- Enabled `premultipliedAlpha` for cinematic materials using Three.js `MultiplyBlending`, eliminating repeated WebGL state errors.
- Added rendered browser validation for startup, loading-to-menu transition, parsed CSS layout, settings, New Game, HUD, phone, pause, save-v4 and return-to-menu behavior.
- Added console-error, page-exception, failed-request, viewport and stylesheet-rule assertions.
- Made `BUILD_INFO.json` deterministic so identical source builds do not create timestamp-only commits or publishing loops.
- Restricted committed `vercel-static/` updates to builds that pass the rendered runtime test.

## Verified runtime state

- WebGL 2 context created successfully.
- Recovery console remained hidden during normal startup.
- Main menu reached successfully.
- Production stylesheet parsed and applied without page scrolling.
- New Game entered the first mission with a visible HUD and active canvas.
- Phone, pause, save-v4 and main-menu return flows completed successfully.
- No browser console errors, page exceptions or failed runtime requests were reported.
