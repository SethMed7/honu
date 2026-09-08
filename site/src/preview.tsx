import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import App from '../../src/App';

export function mountPreview(root: HTMLElement) {
  const toggle = document.querySelector<HTMLButtonElement>('#toggle-preview')!;
  const label = document.querySelector('#toggle-label')!;
  const status = document.querySelector('#preview-status')!;
  const { width, height } = root.getBoundingClientRect();
  const small = width <= 680;
  const elements = convertToExcalidrawElements([
    { type: 'ellipse', x: width * (small ? 0.21 : 0.4), y: height * (small ? 0.27 : 0.4), width: width * 0.3, height: height * 0.14,
      strokeColor: '#ffad42', strokeWidth: 3, backgroundColor: 'transparent', roughness: 1.5 },
    { type: 'arrow', x: width * 0.79, y: height * 0.56, width: -width * 0.17, height: -height * 0.12,
      points: [[0, 0], [-width * 0.17, -height * 0.12]], strokeColor: '#ffad42', strokeWidth: 3, endArrowhead: 'arrow' },
  ]);

  function Preview() {
    const [visible, setVisible] = useState(true);
    const hide = useCallback(() => { setVisible(false); toggle.focus(); }, []);
    const notice = useCallback((message: string) => { status.textContent = message === 'Board cleared' ? 'A clean slate. Your tool and color stay.' : message; }, []);
    useEffect(() => {
      const onToggle = () => setVisible(value => !value);
      const onKey = (event: KeyboardEvent) => {
        if (!(event.target instanceof Element) || !event.target.closest('.preview-section')) return;
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'KeyD') {
          event.preventDefault(); setVisible(value => !value);
        }
      };
      toggle.disabled = false;
      toggle.addEventListener('click', onToggle);
      document.addEventListener('keydown', onKey);
      return () => { toggle.removeEventListener('click', onToggle); document.removeEventListener('keydown', onKey); };
    }, []);
    useEffect(() => {
      toggle.setAttribute('aria-pressed', String(visible));
      label.textContent = visible ? 'Overlay on' : 'Overlay off';
      status.textContent = visible ? 'Pick a tool, pick a color. Make your point.' : 'Out of the way. Toggle on to draw again.';
    }, [visible]);
    return <App embedded visible={visible} onHide={hide} onNotice={notice} initialElements={elements} />;
  }
  createRoot(root).render(<Preview />);
}
