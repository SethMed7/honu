import './styles.css';

const canvas = document.querySelector<HTMLCanvasElement>('#drawing-canvas')!;
const context = canvas.getContext('2d')!;
const desktop = document.querySelector<HTMLElement>('#desktop')!;
const layer = document.querySelector<HTMLElement>('#annotation-layer')!;
const samples = document.querySelector<SVGElement>('#sample-annotations')!;
const toggle = document.querySelector<HTMLButtonElement>('#toggle-preview')!;
const label = document.querySelector('#toggle-label')!;
const status = document.querySelector('#preview-status')!;
type Point = { x: number; y: number };
const strokes: Point[][] = [];
let drawing: Point[] | null = null;
let activePointer: number | null = null;
let visible = true;

function render() {
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = desktop.getBoundingClientRect();
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.strokeStyle = '#83e6bc';
  context.lineWidth = 3;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    context.beginPath();
    context.moveTo(stroke[0].x * width, stroke[0].y * height);
    for (const point of stroke.slice(1)) context.lineTo(point.x * width, point.y * height);
    if (stroke.length === 1) context.lineTo(stroke[0].x * width + 0.1, stroke[0].y * height);
    context.stroke();
  }
}
function clear() {
  drawing = null;
  activePointer = null;
  strokes.length = 0;
  samples.style.display = 'none';
  render();
  status.textContent = 'A clean slate. Nothing saved.';
}
function setVisible(next: boolean) {
  drawing = null;
  activePointer = null;
  visible = next;
  layer.hidden = !next;
  toggle.setAttribute('aria-pressed', String(next));
  label.textContent = next ? 'Overlay on' : 'Overlay off';
  status.textContent = next ? 'Go ahead. Draw something.' : 'Out of the way. Toggle on to draw again.';
}
function point(event: PointerEvent): Point {
  const bounds = canvas.getBoundingClientRect();
  return { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height };
}
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || activePointer !== null) return;
  activePointer = event.pointerId;
  canvas.setPointerCapture(event.pointerId);
  drawing = [point(event)];
  strokes.push(drawing);
  render();
});
canvas.addEventListener('pointermove', event => {
  if (!drawing || event.pointerId !== activePointer) return;
  drawing.push(point(event));
  render();
});
function finish(event: PointerEvent) {
  if (event.pointerId === activePointer) { drawing = null; activePointer = null; }
}
canvas.addEventListener('pointerup', finish);
canvas.addEventListener('pointercancel', finish);
canvas.addEventListener('lostpointercapture', finish);
document.querySelector('#clear-preview')!.addEventListener('click', clear);
document.querySelector('#hide-preview')!.addEventListener('click', () => { clear(); setVisible(false); toggle.focus(); });
toggle.addEventListener('click', () => setVisible(!visible));
// Only claim keys while interacting with the preview; never hijack browser Quit.
document.addEventListener('keydown', event => {
  if (!(event.target instanceof Element) || !event.target.closest('.preview-section') || event.isComposing) return;
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'KeyD') {
    event.preventDefault(); setVisible(!visible);
  } else if (event.key === 'Escape') {
    clear(); setVisible(false); toggle.focus();
  } else if (event.key === 'c' && !event.metaKey && !event.ctrlKey && !event.altKey) clear();
});
canvas.tabIndex = 0;
new ResizeObserver(render).observe(desktop);
document.querySelector('#year')!.textContent = String(new Date().getFullYear());
