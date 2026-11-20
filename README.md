# Neon Shore — GTA-style Cover Art Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/bangpateng/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/bangpateng/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Invite](https://img.shields.io/badge/invite-0h2zmzc4-2de2e6)](https://make.fun/r/0h2zmzc4)

Turn your photo and a caption into a multi-panel poster in the style of GTA 6's
covers — a Vice City sunset or neon grade, bold Anton title lettering with a
Pacifico script subtitle, a slit sun and palm silhouettes — and export it as a
PNG to share. Everything is original: no Rockstar logo, artwork, character or
font. The lettering is Anton and Pacifico, both under the SIL Open Font License
(see `app/fonts/OFL.txt`).

## What it does

- **Any photo:** load up to 4 photos from your machine (nothing is uploaded).
  Fill several panels with one photo, or spread photos across the panels.
- **Crop & position each panel:** click a panel in the live preview, then pick
  its photo, zoom and pan with sliders.
- **Six layouts:** Hero Grid, Nine Panel, Tilted Snaps, Sunset Strip, Duo Split
  and Full Bleed — the multi-panel poster look at any post size.
- **Five colour grades:** Vice Sunset, Neon Night, Golden Hour, Miami Noir and
  Candy Pop, plus sun & palms, film grain, vignette and a badge ribbon.
- **Fast:** three steps from photo to PNG — add photos, pick a layout, export.
- **Post sizes:** 1080 x 1080, 1080 x 1350 and 1920 x 1080, one button each or
  all three at once.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. The app is plain static
files under `app/` and works offline — every script, font and sample photo it
loads is a file under `app/`.

## Build the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.

## Screenshots

- `1-cover.jpg` — a wide 1920 x 1080 cover the app exported
- `2-editor.jpg` — the editor with sample photos loaded
- `3-cover-portrait.jpg` — a portrait 1080 x 1350 cover the app exported
- `4-cover-square.jpg` — a square 1080 x 1080 cover the app exported

The sample photos under `app/samples/` were made with an image model for
make.fun and are free to use.

## License

MIT — see `LICENSE`.
