import { CaptureUpdateAction, newElementWith } from '@excalidraw/excalidraw';
import type { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

export type PenState = Pick<AppState, 'activeTool' | 'currentItemStrokeColor' | 'currentItemStrokeWidth'>;

export function updateStroke(api: ExcalidrawImperativeAPI, { color, width }: { color?: string; width?: number }) {
  const { selectedElementIds, currentItemStrokeColor, currentItemStrokeWidth } = api.getAppState();
  const changes = { ...(color !== undefined && { strokeColor: color }), ...(width !== undefined && { strokeWidth: width }) };
  api.updateScene({
    elements: api.getSceneElements().map(element => selectedElementIds[element.id] ? newElementWith(element, changes) : element),
    appState: {
      currentItemStrokeColor: color ?? currentItemStrokeColor,
      currentItemStrokeWidth: width ?? currentItemStrokeWidth,
    },
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
}

export function clearBoard(api: ExcalidrawImperativeAPI) {
  const { activeTool, currentItemStrokeColor, currentItemStrokeWidth } = api.getAppState();
  // resetScene also releases image files and the in-progress editor. Preserve
  // the pen separately; resetScene's resetLoadingState option is not persistence.
  api.resetScene();
  api.updateScene({
    elements: [],
    appState: {
      viewBackgroundColor: 'transparent', currentItemBackgroundColor: 'transparent',
      currentItemStrokeColor, currentItemStrokeWidth,
    },
    captureUpdate: CaptureUpdateAction.NEVER,
  });
  api.setActiveTool(activeTool.type === 'custom'
    ? { type: 'custom', customType: activeTool.customType, locked: activeTool.locked }
    : { type: activeTool.type, locked: activeTool.locked });
  // A wiped board must not come back through Cmd+Z.
  api.history.clear();
}
