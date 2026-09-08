import { cp, mkdir } from 'node:fs/promises';

await mkdir('public/excalidraw-assets', { recursive: true });
await cp('node_modules/@excalidraw/excalidraw/dist/prod/fonts', 'public/excalidraw-assets/fonts', { recursive: true });
await mkdir('site/public/excalidraw-assets', { recursive: true });
await cp('public/excalidraw-assets/fonts', 'site/public/excalidraw-assets/fonts', { recursive: true });
