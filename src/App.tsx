import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import type { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { exit } from '@tauri-apps/plugin-process';
import { ArrowUpRight, Circle, Eraser, MousePointer2, Pencil, Square, Type } from 'lucide-react';
import { actionForKey, isEditingTarget } from './shortcuts';
import { clearBoard, type PenState } from './scene';

const tools = [
  { type: 'selection', label: 'Select (V)', Icon: MousePointer2 },
  { type: 'freedraw', label: 'Pen (P)', Icon: Pencil },
  { type: 'arrow', label: 'Arrow (A)', Icon: ArrowUpRight },
  { type: 'rectangle', label: 'Rectangle (R)', Icon: Square },
  { type: 'ellipse', label: 'Ellipse (O)', Icon: Circle },
  { type: 'text', label: 'Text (T)', Icon: Type },
  { type: 'eraser', label: 'Eraser (E)', Icon: Eraser },
] as const;
const colors = [
  ['#1e90ff', 'Ocean blue'], ['#63e6be', 'Seafoam'], ['#ff6b6b', 'Coral'],
  ['#ffd43b', 'Sunshine'], ['#ffffff', 'White'], ['#212529', 'Ink'],
] as const;
const initialState = {
  viewBackgroundColor: 'transparent', currentItemBackgroundColor: 'transparent',
  currentItemStrokeColor: '#1e90ff', currentItemStrokeWidth: 2,
  activeTool: { type: 'freedraw', locked: true, lastActiveTool: null, customType: null },
  showWelcomeScreen: false, gridModeEnabled: false,
} as const;

async function hideWindow() {
  if (isTauri()) await getCurrentWebviewWindow().hide();
}
async function quitApp() {
  if (isTauri()) await exit(0);
}

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="canvas-error" role="alert">The canvas couldn’t load. Hide Honu and reopen the app to try again.</div> : this.props.children;
  }
}

export default function App() {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [pen, setPen] = useState({ color: '#1e90ff', width: 2, tool: 'freedraw' });
  const active = useRef<PenState | null>(null);
  const [notice, setNotice] = useState('');
  const [browserHidden, setBrowserHidden] = useState(false);
  const clear = useCallback(() => {
    if (api) clearBoard(api);
    setNotice('Board cleared');
  }, [api]);
  const dismiss = useCallback(async () => {
    clear();
    try { await hideWindow(); if (!isTauri()) setBrowserHidden(true); }
    catch { setNotice('Couldn’t hide Honu. Try the menu bar icon.'); }
  }, [clear]);
  const quit = useCallback(async () => {
    clear();
    try { await quitApp(); if (!isTauri()) setNotice('Quit is available in the macOS app.'); }
    catch { setNotice('Couldn’t quit Honu. Use Quit Honu in the menu bar.'); }
  }, [clear]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const action = actionForKey(event, isEditingTarget(event.target));
      if (!action) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (action === 'clear') clear();
      if (action === 'dismiss') void dismiss();
      if (action === 'quit') void quit();
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [clear, dismiss, quit]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const onChange = useCallback((_elements: unknown, state: AppState) => {
    // Only pen changes rerender the HUD. Pointer movements/strokes stay inside
    // Excalidraw. Neither the scene nor preferences ever enter storage.
    const previous = active.current;
    if (previous?.activeTool.type === state.activeTool.type &&
        previous.currentItemStrokeColor === state.currentItemStrokeColor &&
        previous.currentItemStrokeWidth === state.currentItemStrokeWidth) return;
    active.current = {
      activeTool: state.activeTool, currentItemStrokeColor: state.currentItemStrokeColor,
      currentItemStrokeWidth: state.currentItemStrokeWidth,
    };
    setPen({ color: state.currentItemStrokeColor, width: state.currentItemStrokeWidth, tool: state.activeTool.type });
  }, []);

  return <main className={`overlay ${browserHidden ? 'browser-hidden' : ''}`} aria-label="Honu annotation canvas"
    onContextMenuCapture={event => event.preventDefault()}
    onDropCapture={event => { event.preventDefault(); event.stopPropagation(); }}
    onDragOverCapture={event => event.preventDefault()}>
    <CanvasBoundary><Excalidraw excalidrawAPI={setApi} initialData={{ elements: [], appState: initialState }}
      onChange={onChange} theme="light" zenModeEnabled autoFocus aiEnabled={false}
      onLinkOpen={(_element, event) => event.preventDefault()}
      onPaste={() => false}
      UIOptions={{ canvasActions: { changeViewBackgroundColor: false, clearCanvas: false, export: false,
        loadScene: false, saveToActiveFile: false, saveAsImage: false, toggleTheme: false }, tools: { image: false } }}>
      <MainMenu />
    </Excalidraw></CanvasBoundary>
    <div className="hud" aria-label="Honu controls">
      <span className="hud-brand"><img src="/turtle.svg" alt="" /> Honu</span>
      <span className="hud-divider" />
      <button onClick={clear}>Clear <kbd>C</kbd></button>
      <button onClick={() => void dismiss()}>Hide <kbd>Esc</kbd></button>
      <button className="quit" onClick={() => void quit()}>Quit <kbd>⌘Q</kbd></button>
    </div>
    <div className="drawing-tools" aria-label="Drawing tools">
      <div className="tool-row" role="group" aria-label="Tools">{tools.map(({ type, label, Icon }) =>
        <button key={type} title={label} aria-label={label} aria-pressed={pen.tool === type} disabled={!api}
          onClick={() => api?.setActiveTool({ type, locked: true })}><Icon size={19} strokeWidth={1.7} /></button>)}</div>
      <div className="tool-row colors" role="group" aria-label="Pen color">{colors.map(([color, label]) =>
        <button key={color} aria-label={label} title={label} aria-pressed={pen.color === color} disabled={!api}
          onClick={() => api?.updateScene({ appState: { currentItemStrokeColor: color } })}>
          <span style={{ backgroundColor: color }} />
        </button>)}</div>
      <div className="tool-row widths" role="group" aria-label="Stroke width">{[1, 2, 4].map(width =>
        <button key={width} aria-label={`${width}px stroke`} title={`${width}px stroke`} aria-pressed={pen.width === width} disabled={!api}
          onClick={() => api?.updateScene({ appState: { currentItemStrokeWidth: width } })}>
          <span style={{ height: width }} />
        </button>)}</div>
    </div>
    <div className="notice" role="status">{notice}</div>
    {!isTauri() && browserHidden && <button className="reopen" onClick={() => setBrowserHidden(false)}>Show Honu preview</button>}
  </main>;
}
