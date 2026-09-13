// Import generated atlases into independent, nearest-neighbour game sprites.
// Originals are kept intact; no whole-room bitmap is used by the app.
import sharp from 'sharp';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [furnitureSource, robotSource] = process.argv.slice(2);
if (!furnitureSource || !robotSource) throw new Error('Pass the furniture and robot atlas paths.');
const output = path.resolve('public/office');
await mkdir(output, { recursive: true });
await mkdir('design/office', { recursive: true });
await copyFile(furnitureSource, 'design/office/furniture-source.png');
await copyFile(robotSource, 'design/office/robot-source.png');
const objects = [
  ['desk', 44, 94, 268, 180, 104], ['monitor', 352, 72, 188, 207, 38],
  ['keyboard', 587, 140, 250, 126, 44], ['chair', 902, 59, 172, 231, 32],
  ['cabinet', 1188, 65, 146, 218, 32], ['bookshelf', 56, 297, 220, 273, 48],
  ['printer', 347, 321, 199, 240, 38], ['water', 645, 296, 136, 273, 28],
  ['whiteboard', 851, 345, 276, 187, 80], ['plant', 1152, 298, 228, 268, 42],
  ['lamp', 57, 580, 202, 243, 26], ['window', 308, 580, 270, 236, 88],
  ['door', 615, 577, 201, 245, 43], ['server', 901, 569, 204, 253, 39],
  ['inbox', 1148, 612, 222, 186, 39], ['phone', 29, 884, 251, 164, 39],
  ['map', 298, 849, 326, 201, 104], ['clock', 655, 863, 181, 181, 24],
];
const manifest = {};
for (const [name, left, top, width, height, targetWidth] of objects) {
  const cutout = await sharp(furnitureSource).extract({ left, top, width, height }).toBuffer();
  const pixels = await sharp(cutout).trim({ threshold: 30 }).resize({ width: targetWidth, kernel: 'nearest' }).png({ palette: true, colours: 64 }).toBuffer();
  await writeFile(path.join(output, `${name}.png`), pixels);
  const meta = await sharp(pixels).metadata();
  manifest[name] = { width: meta.width, height: meta.height };
}
for (const [name, rect, width, height] of [
  ['floor', { left: 900, top: 852, width: 196, height: 192 }, 64, 64],
  ['wall', { left: 1170, top: 851, width: 177, height: 186 }, 64, 64],
]) {
  await sharp(furnitureSource).extract(rect).resize(width, height, { kernel: 'nearest' }).png({ palette: true, colours: 32 }).toFile(path.join(output, `${name}.png`));
  manifest[name] = { width, height };
}

// Normalize every generated pose to the same 32x40 cell and a shared foot line.
const robotFrames = [];
const columns = [235, 447, 660, 872];
const rows = [0, 157, 313, 467, 625, 782, 936, 1083];
for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 4; col++) {
    // The last west-facing generated frame faces east: reuse west's second step.
    const sourceCol = row === 3 && col === 3 ? 1 : col;
    const cutout = await sharp(robotSource).extract({ left: columns[sourceCol], top: rows[row], width: 137, height: row === 7 ? 166 : 148 }).toBuffer();
    const crop = await sharp(cutout).trim({ threshold: 40 }).toBuffer();
    const sprite = await sharp(crop).resize({ height: row === 7 && col === 3 ? 39 : 35, width: 31, fit: 'inside', kernel: 'nearest' }).png().toBuffer();
    const meta = await sharp(sprite).metadata();
    robotFrames.push({ input: sprite, left: col * 32 + Math.floor((32 - meta.width) / 2), top: row * 40 + 40 - meta.height });
  }
}
await sharp({ create: { width: 128, height: 320, channels: 4, background: '#00000000' } }).composite(robotFrames).png({ palette: true, colours: 64 }).toFile(path.join(output, 'robot.png'));

// Tiny effects are code-native bitmap sprites, matching the atlas palette.
const effects = {
  pin: ['...cc...', '..cCCc..', '.cCCCCc.', '.cCCCCc.', '..cCCc..', '...cc...', '...cc...', '........'],
  sparkle: ['...a....', '...a....', '..aAa...', 'aaAAAaa.', '..aAa...', '...a....', '...a....', '........'],
  warning: ['...rr...', '..rAAr..', '..rAAr..', '.rAAAAr.', '.rArRAr.', 'rAArrAAr', 'rAAAAAAr', '.rrrrrr.'],
  mail: ['........', '.cccccc.', '.cCccCc.', '.ccCCcc.', '.cCccCc.', '.cccccc.', '........', '........'],
  terminal: ['cccc....', 'cc......', 'ccccc...', 'ccc.....', '......c.', '........', '........', '........'],
  beam: ['cccccccc', '.CCCCCC.', '........', '........', '........', '........', '........', '........'],
};
const palette = { c: [53, 161, 177, 210], C: [113, 233, 230, 255], a: [207, 142, 47, 220], A: [255, 211, 129, 255], r: [105, 38, 46, 255], R: [255, 107, 122, 255], '.': [0, 0, 0, 0] };
for (const [name, rows] of Object.entries(effects)) {
  const pixels = Buffer.from(rows.join('').split('').flatMap((pixel) => palette[pixel]));
  await sharp(pixels, { raw: { width: 8, height: 8, channels: 4 } }).png().toFile(path.join(output, `${name}.png`));
}
await writeFile(path.join(output, 'assets.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Prepared 20 independent office sprites, 32 robot frames and 6 pixel effects.');
