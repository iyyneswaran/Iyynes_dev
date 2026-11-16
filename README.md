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
- **Speaker:** opt in to synthesized chiptune interaction sounds, footfalls, and occasional birdsong. Sound starts only after user interaction.
- **Home:** return to the village square.
- Mobile has a touch direction pad as well as tap-to-walk.

The six destinations contain About, Projects, Skills, Experience, Achievements, and Contact. Discovered places persist in browser local storage; the app also works when storage is unavailable. Native dialogs provide keyboard focus containment and Escape dismissal.

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

The artwork follows the supplied references' top-down village composition using original sprites. It is not an extraction or exact copy of the Pokémon maps. No backend, account, API key, CDN framework, or remote font service is required. All fonts are bundled locally through npm packages. Aseprite isn't required to run or edit the project; sprite generation is kept in source so assets remain editable without proprietary tooling.

Deploy `dist/` to any static host. Nothing is automatically published.
