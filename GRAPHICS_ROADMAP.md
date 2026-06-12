# Monkey Swing Graphics Roadmap

The current web prototype is still primitive because it is built mostly from procedural geometry, canvas effects, and simple materials. The final game should move toward a proper stylized-realistic 3D asset pipeline.

## Visual Target

The game should look like a premium first-person jungle traversal game:

- Warm cinematic jungle sunlight
- Deep green canopy
- Misty valley depth
- Waterfalls and river drops below
- Temple ruins and ancient stone landmarks
- Real hanging vines with texture and thickness variation
- Furry monkey arms/hands in first person
- Clean premium mobile HUD

## Immediate Browser Prototype Graphics Improvements

These can be improved while staying in the hosted web prototype:

1. Better procedural jungle composition
2. Stronger color grading and lighting overlays
3. Better route framing so the path feels intentional
4. More believable foreground leaves and speed streaks
5. More distinctive named zones
6. Better UI and start/game-over presentation
7. Fake material texture overlays
8. Better monkey arm silhouettes

## Real Asset Upgrade Path

These are the actual upgrades needed to make it look close to the concept image:

### 1. Monkey Arms

Replace capsule/sphere placeholder arms with real first-person monkey arms:

- Low-poly or mid-poly stylized monkey arms
- Fur material with baked texture
- Hand grab pose
- Reach pose
- Release pose
- Simple animation blending

### 2. Vines

Replace procedural tube vines with authored vine assets:

- Twisted vine mesh
- Bark/vine texture
- Small hanging leaves
- Sway animation
- Clear grab zone indicator that still feels natural

### 3. Jungle Foliage

Use optimized mobile foliage assets:

- Palm leaves
- Broad tropical leaves
- Canopy clusters
- Tree trunks
- Hanging moss
- Bush clusters
- Cliff vegetation

### 4. Terrain and Valley

Replace floating procedural pieces with a believable vertical jungle route:

- Canyon walls
- Valley floor far below
- River path
- Waterfall drops
- Cliff ledges
- Background mountain silhouettes

### 5. Ruins and Landmarks

Add recurring landmarks:

- Stone archways
- Broken temple bridges
- Ancient statues
- Overgrown columns
- Mossy stairs
- Jungle shrines

### 6. Lighting and Post-Processing

In Unity, use URP with:

- Baked lighting where possible
- Warm directional sun
- Volumetric-style fog approximation
- Bloom
- Ambient occlusion
- Color grading
- Motion blur or speed-line substitute
- Vignette

## Best Production Plan

The browser prototype should keep improving gameplay feel and visual direction, but the final visual leap requires a Unity asset pass.

Recommended next steps:

1. Continue improving browser prototype feel and structure.
2. Lock the best gameplay loop.
3. Create or buy mobile-optimized jungle assets.
4. Replace placeholder arms/vines/foliage in Unity.
5. Build a proper vertical slice.
6. Use TestFlight or cloud build for iPhone testing.

## Current Honest Status

The prototype is useful for testing:

- Swing feel
- Mobile controls
- Scoring loop
- UI direction
- Visual mood
- Route readability

It is not yet representative of final production graphics.
