import sharp from 'sharp';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const destination = 'site/public';
await mkdir(destination, { recursive: true });
const turtle = await readFile('public/turtle.svg', 'utf8');
const inner = turtle.replace(/<\/?svg[^>]*>/g, '');
// A solid dark field gives the small orange silhouette contrast in either
// browser theme. Touch/manifest icons use full opaque squares for OS masking.
const icon = (radius: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="${radius}" fill="#161616"/><g transform="translate(16 16)">${inner}</g></svg>`;
await writeFile(`${destination}/favicon.svg`, icon(20));
await writeFile(`${destination}/safari-pinned-tab.svg`, turtle.replaceAll('#ffad42', '#000000').replaceAll('#161616', '#000000'));
for (const [size, name] of [[16, 'favicon-16x16.png'], [32, 'favicon-32x32.png'], [48, 'favicon-48x48.png'], [96, 'favicon-96x96.png'], [192, 'favicon.png'], [180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']] as const) {
  await sharp(Buffer.from(icon(size < 100 ? 20 : 0))).resize(size, size).png().toFile(`${destination}/${name}`);
}
// Include browser/task-switcher sizes and a high-resolution fallback frame.
const sizes = [16, 32, 48, 64, 128, 256];
const frames = await Promise.all(sizes.map(size => sharp(Buffer.from(icon(20))).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + frames.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((frame, index) => {
  const entry = 6 + index * 16;
  header[entry] = header[entry + 1] = sizes[index] === 256 ? 0 : sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frame.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await writeFile(`${destination}/favicon.ico`, Buffer.concat([header, ...frames]));
// Conventional paths support dev tabs, T3's workspace discovery, bookmark
// clients, and crawlers that request a filename without parsing the page.
await cp(`${destination}/apple-touch-icon.png`, `${destination}/apple-touch-icon-precomposed.png`);
await mkdir('public', { recursive: true });
for (const name of ['favicon.svg', 'favicon.ico', 'favicon.png', 'apple-touch-icon.png']) {
  await cp(`${destination}/${name}`, `public/${name}`);
}
await writeFile(`${destination}/site.webmanifest`, JSON.stringify({
  id: './', name: 'Honu — Screen annotations', short_name: 'Honu', start_url: './', scope: './',
  display: 'browser', background_color: '#0a0a0a', theme_color: '#161616',
  icons: [192, 512].map(size => ({ src: `icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any maskable' })),
}, null, 2) + '\n');
console.log('Generated Honu SVG, multi-size ICO, PNG, touch, pinned-tab and manifest icons.');
