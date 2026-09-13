# Command Centre pixel assets

Original source artwork generated with the built-in image generator. No flattened office background is used at runtime. Each furniture object and every robot animation frame is extracted into a separate sprite or normalized sheet.

## Files and regeneration

- `furniture-source.png`: original furniture atlas.
- `robot-source.png`: original 32-frame character atlas.
- `public/office/`: runtime assets, relative to the project root.
- `scripts/prepare-office-assets.mjs` extracts, trims and nearest-neighbour resizes these originals; tiny effects are native pixel bitmaps.
- `src/lib/office-world.ts` owns object layout, depth and collision-checked waypoint routes.
- `src/lib/office-state.ts` maps real stored job data to display states. Preview mode cannot activate a scan.

From the project root:

```sh
node scripts/prepare-office-assets.mjs design/office/furniture-source.png design/office/robot-source.png
npm run office:check
```

No runtime image-generation service, game engine, 3D library or external sprite dependency is required. Art generation can produce inconsistent frames: the extraction script reuses a correctly facing west frame where the source's last west frame faced east.

## Furniture generation prompt

Use case: stylized-concept. Asset type: ONE production game sprite atlas for a modular top-down 2D pixel office. Create a 1280 x 1024 RGBA sprite atlas, exact 5 columns by 4 rows of 256 x 256 cells, no grid lines or labels. Transparent background in every cell. Each object isolated, centered, with at least 16px empty margin. One consistent genuinely hand-pixelled 16-bit RPG office tileset, orthographic top-down with a small visible front surface as in classic Pokemon interiors, NEVER isometric, no diagonal perspective. Crisp blocky pixel clusters on a 4px pixel grid (320x256 native artwork scaled 4x), no antialiasing, no gradients, no soft drop shadows. 2 native pixel dark ink outlines, top-left highlights. Rich warm walnut wood, muted sage beige trim, midnight navy equipment, restrained cyan and amber pixels. These sprites will be extracted into separate transparent files, NOT displayed as a single background.
Exactly these objects in reading order:
Row 1: 1 wide EMPTY wooden desk with walnut drawers and a richly grained top (no computer or chair on it); 2 standalone chunky vintage CRT computer monitor with cyan terminal screen (no desk); 3 standalone charcoal keyboard and mouse; 4 upholstered dark swivel office chair, facing north toward a desk; 5 two-drawer metal filing cabinet.
Row 2: 1 tall wooden bookshelf with books and ring binders; 2 office printer/copier with paper tray; 3 blue-bottle water dispenser; 4 framed whiteboard with small diagram notes; 5 lush broad-leaf office plant in stone planter.
Row 3: 1 small amber articulated desk lamp; 2 wall window with white blinds showing midnight blue sky (flat horizontal-facing upper wall); 3 dark wooden office doorway with frame; 4 compact navy server rack with tiny cyan and amber LEDs; 5 wooden lead inbox tray with two stacked ivory document folders.
Row 4: 1 desk telephone and upright small green approval display; 2 wide wall-mounted framed Malaysia map screen, include separate recognizable Malay peninsula and Borneo silhouettes on midnight navy with cyan location pins; 3 small wall clock with cream face; 4 single seamless square warm wood floorboard texture tile, tile fills central 192x192 px area; 5 horizontal beige-grey wall and dark wooden baseboard tile, central 192x192 px area.
Every sprite from the same polished cohesive office game. Readable construction details, pleasing limited palette. No robot or people here, no room composition, no text, no logos, no emoji, no smooth vector shapes. Transparent alpha, do not paint checkerboard.

## Robot generation prompt

Use case: stylized-concept. Asset type: ONE game animation sprite sheet. Transparent RGBA, exactly 1024 x 1024, 4 columns by 8 rows, cells exactly 256 x 128. One identical robot character in ALL 32 cells. Center character at each cell's horizontal center, feet aligned 16px above cell bottom. Entire robot INCLUDING antenna fits within 88px height and 64px width per frame so it will be 22x16 native pixels. Pixel art on strict 4px grid, crisp nearest-neighbour 4x scale, no antialiasing, no text, no grid lines, no backdrop. Original compact efficient office robot: square cream-metal CRT face frame, navy blue face screen, two cyan square eye pixels, single amber antenna, dark midnight/navy body, cyan chest light, small articulated stubby metal legs and arms, chunky pixel outline. Not a humanoid android, not a toy with big head. Palette matches warm wood, navy and cyan 16-bit top-down RPG office sprites; orthographic top-down classic RPG facing views, no isometric angles.
Exactly rows and frames:
Row 1: south-facing idle, four subtle breathing/blinking frames.
Row 2: four north-facing walking cycle frames, show back of same robot head/body.
Row 3: four south-facing walking cycle frames.
Row 4: four west-facing walking cycle frames.
Row 5: four east-facing walking cycle frames.
Row 6: north-facing typing at a computer, four arms-working frames, NO computer or desk in sheet.
Row 7: same robot walking east carrying a small cream folder with amber tab, four walking cycle frames.
Row 8: frame 1 same robot pointing at a map (do not draw map); frame 2 calm scan-completed pose holding a single file; frame 3 quiet happy completed pose with cyan eyes; frame 4 failed/attention pose with amber eye lights and a tiny red warning indicator above antenna.
Each cell isolated and transparent. Do not redesign character between rows. Do not paint a checkerboard or shadows outside character. This is for real CSS sprite animation, accurate equal cells and aligned feet required.
