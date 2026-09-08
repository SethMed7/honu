export type HonuAction = 'clear' | 'dismiss' | 'quit' | 'block-file-action';

type Key = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'isComposing' | 'repeat'>;

export function actionForKey(event: Key, editing: boolean): HonuAction | null {
  if (event.isComposing) return null;
  const key = event.key.toLowerCase();
  const command = event.metaKey || event.ctrlKey;
  if (command && !event.altKey && key === 'q') return 'quit';
  // Excalidraw's export/import shortcuts can otherwise bypass hidden menus.
  if (command && ['s', 'o'].includes(key)) return 'block-file-action';
  if (key === 'escape') return 'dismiss';
  if (!editing && !event.repeat && !command && !event.altKey && !event.shiftKey && key === 'c') return 'clear';
  return null;
}

export function isEditingTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'));
}
