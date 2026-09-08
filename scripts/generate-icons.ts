import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';

const turtle = await readFile('public/turtle.svg', 'utf8');
await mkdir('src-tauri/icons', { recursive: true });
const app = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect x="72" y="72" width="880" height="880" rx="190" fill="#161616"/><g transform="translate(230 220) scale(8.8)">${turtle.replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;
await sharp(Buffer.from(app)).png().toFile('src-tauri/icons/app.png');
// Template status icon: transparent monochrome silhouette; macOS supplies ink.
const tray = turtle.replaceAll('#ffad42', '#000000').replaceAll('#161616', '#000000');
await sharp(Buffer.from(tray)).resize(44, 44).png().toFile('src-tauri/icons/tray.png');
