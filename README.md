# Iyynes' World

A frontend-only, playable pixel-art portfolio for Iyyneswaran P, built with **React 19, TypeScript, Vite, and Phaser 3**. All application and game source is TypeScript/TSX. React owns the interface and accessible portfolio dialogs; Phaser owns the world, animations, camera, and Arcade Physics.

## Run locally

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. `npm run build` runs strict TypeScript checks and creates the static production site in `dist/`. `npm run preview` serves that build. `npm test` checks navigation and door-access rules.

## Explore

- **WASD / arrow keys:** move. **Shift:** run.
- **Click / tap open ground:** automatically walk there, routing around obstacles.
- **E / Enter / click a nearby building:** open that destination's portfolio panel. You must reach its front door, including on return visits.
- **Destination buttons:** track a building with a gold marker; they don't bypass the proximity requirement.
- **M:** expand the minimap. **Esc:** close a panel or expanded map.
- **Speaker:** sound is ON by default, with synthesized interaction sounds, footsteps, and seasonal ambience. Browser autoplay rules defer playback until the first click, tap, or key press; use the speaker button to mute or unmute.
- **Home:** return to the village square.
- Mobile has a touch direction pad as well as tap-to-walk.

The six destinations contain About, Projects, Skills, Experience, Achievements, and Contact. Discovered places persist in browser local storage; the app also works when storage is unavailable. Native dialogs provide keyboard focus containment and Escape dismissal.

## Seasons and village time

The **Season** dropdown changes the village in place without resetting your position, tracked destination, discoveries, or clock. Summer is the default.

| Season | Environment                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------- |
| Summer | Original sunny village, butterflies, chickens, and birds.                                                                 |
| Spring | Fresh leaves, pink cherry trees, tulips and daffodils, drifting petals, nests, returning birds, rabbits, and hedgehogs.   |
| Rainy  | Animated rain and splashes, puddles, lush foliage, mushrooms, ducks, and frogs.                                           |
| Autumn | Amber foliage, drifting and fallen leaves, pumpkins, squirrels, and hedgehogs.                                            |
| Winter | Snow-covered ground, trees, roofs, and fences; snowfall; frozen water with ice cracks; hares, cardinals, and a snowy owl. |

Time starts at **10:00** and runs automatically: **8 real minutes = 24 village hours**. Dawn (05:00–08:00) and dusk (17:00–20:00) ease between daylight and night. The cycle continues while portfolio panels are open, and season changes do not restart it. Background tabs catch up to elapsed time when revisited.

Streetlights and the character's carried torch switch on automatically as darkness builds, then turn off after sunrise. The torch moves with the character and adds light ahead of the direction they face. Lamps cast warm pools of light and house windows glow. Daytime wildlife retreats at night; an owl and seasonal fireflies become visible. The minimap keeps readable daytime colors while reflecting the selected season.

Frozen water is walkable in winter. Thawing restores water collisions and navigation rules; a character on the ice is moved to the nearest open bank before movement resumes. Interaction proximity checks continue to apply in every season.

When sound is enabled, rainy weather adds soft rain ambience, winter adds wind, and nighttime replaces daytime bird calls with quiet nocturnal sounds. Reduced-motion preferences reduce weather speed; lighting and the clock remain functional.

## Add your next project

Edit the typed `projects` array in `src/content.tsx`. The Projects panel renders every entry automatically. Optional `url` fields add project links. The first project, AgriAssist, and all biographical details come from the supplied resume. No additional projects, job dates, or proficiency percentages have been invented. The downloadable resume is in `public/Iyyneswaran-Resume.pdf`.

## World and art

- `src/art.ts`: original pixel sprites and world art, rendered once into Canvas textures. Trees, roofs, gardens, flowers, riverbanks, bridge planks, and the character are drawn at native pixel resolution, with nearest-neighbor rendering.
- `src/GameWorld.ts`: collision bodies, character animation, animal and bird movement, camera, interactions, and minimap art.
- `src/pathfinding.ts`: grid navigation around expanded collision bounds.
- `src/interactions.ts`: position-based entry rule.
- `src/App.tsx`: React interface, tracking, sound controls, touch input, and portfolio dialogs.
- `src/content.tsx`: portfolio content and typed project data.
- `src/audio.ts`: original Web Audio sound effects; no external audio requests.
- `src/seasons.ts`: typed season settings and the deterministic eight-minute daylight model.
- `src/seasonalArt.ts`: cached seasonal sprite and terrain variants, plus seasonal wildlife sprites.
- `src/ClimateController.ts`: weather, day/night lighting, torch, streetlights, wildlife, and seasonal minimap updates. Lighting and weather use a low-resolution, non-interactive overlay canvas rather than uploading a full-screen texture to the GPU every frame.
- `src/worldGeometry.ts`: shared lamp positions, water geometry, and seasonal collision grids.

The artwork follows the supplied references' top-down village composition using original sprites. It is not an extraction or exact copy of the Pokémon maps. No backend, account, API key, CDN framework, or remote font service is required. All fonts are bundled locally through npm packages. Aseprite isn't required to run or edit the project; sprite generation is kept in source so assets remain editable without proprietary tooling.

Deploy `dist/` to any static host. Nothing is automatically published.
