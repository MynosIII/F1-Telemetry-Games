# F1 Telemetry Games

Production: https://f1-telemetry-games.vercel.app

Four Formula 1 games and seven arcade minigames, with Spanish/English controls and a shared Telemetry 1 theme.

## Deployments

The existing Vercel project `f1-telemetry-games` is connected to `MynosIII/F1-Telemetry-Games`. Pushes to `main` deploy production automatically. This is a static site; Vercel serves the repository root without a build command. The deployed games do not depend on a local server.

Telemetry 1 embeds these production URLs. Predestinato's career game is maintained separately at https://github.com/MynosIII/Predestinato.

## Shared assets

- `shared/game-language.js` preserves game state while switching languages.
- `shared/translations.js` contains English/Spanish strings.
- `shared/game-theme.css` contains common presentation and mobile fixes.
- `shared/game-images.js` normalizes local image paths and supplies fallbacks.
- `shared/driver_images.json` maps driver names to portrait URLs.
- `shared/cached-images` contains 282 verified remote portraits cached locally; `shared/image-sources.json` records their original sources and audit outcomes.

The original 24 local portrait references resolve from the site root. Remaining remote portraits may be rate-limited. Portraits use containment to avoid additional cropping by their containers; this does not undo cropping in the source image.

## Local preview

Serve this directory with a static HTTP server. Pages use root-relative shared asset paths, so opening an HTML file directly from disk is not supported.

Keyboard controls are available for driver search, circuit guessing, Higher or Lower, Bingo grid selection, and Four-in-line. Color-based gameplay such as Stroop retains its distinct colors.
