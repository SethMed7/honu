import './styles.css';

// Fonts are self-hosted, and the real drawing editor loads only near the demo.
window.EXCALIDRAW_ASSET_PATH = `${import.meta.env.BASE_URL}excalidraw-assets/`;
const root = document.querySelector<HTMLElement>('#annotation-layer')!;
const status = document.querySelector('#preview-status')!;
let loading = false;
async function loadPreview() {
  if (loading) return;
  loading = true;
  try {
    const { mountPreview } = await import('./preview');
    mountPreview(root);
  } catch {
    loading = false;
    root.replaceChildren();
    const retry = document.createElement('button');
    retry.className = 'preview-loading';
    retry.textContent = 'Couldn’t load the canvas. Click to retry.';
    retry.addEventListener('click', () => void loadPreview(), { once: true });
    root.append(retry);
    status.textContent = 'Downloads are still available below.';
  }
}
const observer = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); void loadPreview(); }
}, { rootMargin: '300px' });
observer.observe(root);
document.querySelector('#year')!.textContent = String(new Date().getFullYear());
