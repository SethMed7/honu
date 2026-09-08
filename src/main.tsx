import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@excalidraw/excalidraw/index.css';
import './styles.css';

// Set before importing App/Excalidraw. Every font ships in the app; no CDN.
window.EXCALIDRAW_ASSET_PATH = '/excalidraw-assets/';
const { default: App } = await import('./App');
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
