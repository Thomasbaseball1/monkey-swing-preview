# Monkey Swing Preview

Playable mobile web preview for **Monkey Swing**.

Open the GitHub Pages URL on iPhone:

`https://thomasbaseball1.github.io/monkey-swing-preview/`

## Controls

- Hold near a vine lock ring = grab/swing
- Release = launch forward
- Drag left/right = steer
- Collect bananas
- Avoid hazards

## Graphics roadmap

A production graphics plan has been added in [`GRAPHICS_ROADMAP.md`](GRAPHICS_ROADMAP.md). The current web prototype is useful for gameplay feel and art direction, but final-quality visuals will require real 3D assets for monkey arms, vines, foliage, terrain, waterfalls, ruins, and lighting.

## v0.9 changes

- Fixed the core vine grab logic so it checks the lower visible grab point instead of the top vine anchor
- Made grab zones much stricter so tapping far away should no longer instantly pull you into a swing
- Moved the lock ring to the actual lower vine grab point
- Added dynamic vine deformation so the vine bends/moves with the player while attached
- Wired Better Grip into actual core grab-range logic, not just visual effects
- Wired Launch Power and Banana Sense into core release/collection behavior

## v0.8 changes

- Added `effects.js` and `effects.css` for unlock feedback during runs
- Better Grip now improves the visual lock-ring feedback
- Launch Power now adds launch ripple, haptics, and bonus feedback
- Banana Sense now adds a tracking-style banana sense bar and collection feedback
- Golden Fur now adds premium golden UI presentation markers
- Added active unlock badges during play

## v0.7 changes

- Added `progression.js` and `progression.css` for the first long-term game loop layer
- Added current mission tracking with progress bar and banana rewards
- Added run grades based on distance, bananas, and combo
- Added saved best distance and banana stash using local storage
- Added early unlock markers for Better Grip, Launch Power, Banana Sense, and Golden Fur
- Added an unlocks panel and post-run summary feedback

## v0.6 changes

- Added `graphics.js` and `graphics.css` for a dedicated graphics-direction layer
- Added procedural valley depth and distant jungle silhouettes
- Added animated god rays, moving mist, and cloud bands
- Added soft texture/noise overlays so the scene feels less flat
- Added canopy silhouette sprites and cinematic color wash
- Added `GRAPHICS_ROADMAP.md` for the real asset upgrade path

## v0.5 changes

- Added `route.js` and `route.css` for route/readability systems
- Added named jungle zones such as Canopy Run, Waterfall Gap, Temple Approach, and Ruin Sprint
- Added a swing-chain meter to reward cleaner swing sequences
- Added 100m milestone feedback during runs
- Added danger-edge feedback when speed and combo drop
- Added cinematic foreground framing with side trunks, canopy silhouettes, and route-like jungle tunnel motion

## v0.4 changes

- Added `polish.js` and `polish.css` for a separate cinematic screen-effects layer
- Added wind-rush audio after the first tap
- Added speed streaks, drifting pollen, and foreground leaf flybys
- Added banana sparkle bursts and pickup audio feedback
- Added stronger warm grading, edge blur/vignette, and jungle shadow overlays
- Improved menu polish and reticle pulse feedback

## v0.3 changes

- Split the prototype into cleaner `index.html`, `styles.css`, and `app.js`
- Denser jungle composition with canopy curtains, cliffs, ruins, water, mist, and birds
- More detailed vines with leaf clusters and target rings
- More atmospheric sky, sun glow, fog, and light shafts
- Improved monkey hands/arms and first-person camera feedback
- Visual flash on perfect release

## v0.2 changes

- Better swing momentum and release boost
- Green target-lock ring on grabbable vines
- Perfect-release feedback
- Improved camera speed, roll, and shake
- More cinematic jungle lighting, fog, ruins, water, and sun shafts
- Speed meter and cleaner HUD feedback

This is a browser preview, not the final Unity/App Store build.
