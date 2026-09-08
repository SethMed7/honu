import { readFile, writeFile, mkdir } from 'node:fs/promises';

// Derive documentation and contrast from the canonical CSS; no duplicate
// hand-maintained palette. OKLCH -> linear sRGB -> display sRGB.
const css = await readFile('site/src/styles.css', 'utf8');
const colors: Record<string, string> = {};
const luminance: Record<string, number> = {};
for (const [, name, l, c, h] of css.matchAll(/--([\w-]+): oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/g)) {
  const L = +l, a = +c * Math.cos(+h * Math.PI / 180), b = +c * Math.sin(+h * Math.PI / 180);
  const x = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const y = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const z = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621*x-3.3077115913*y+0.2309699292*z,
    -1.2684380046*x+2.6097574011*y-0.3413193965*z,
    -0.0041960863*x-0.7034186147*y+1.707614701*z].map(v => Math.max(0, Math.min(1, v)));
  luminance[name] = rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
  colors[name] = '#' + rgb.map(v => Math.round(255*(v <= 0.0031308 ? 12.92*v : 1.055*v**(1/2.4)-0.055)).toString(16).padStart(2,'0')).join('');
}
const contrast = (a: string, b: string) => ((Math.max(luminance[a],luminance[b])+0.05)/(Math.min(luminance[a],luminance[b])+0.05));
for (const [a,b] of [['ink','bg'],['muted','bg'],['on-accent','accent']]) {
  if (contrast(a,b) < 4.5) throw Error(`Insufficient contrast: ${a}/${b}`);
}
const doc = `---
name: Honu
description: A quiet macOS annotation HUD and its public landing page
colors:
${Object.entries(colors).map(([name,value]) => `  ${name}: "${value}"`).join('\n')}
typography:
  body: Manrope Variable
  native: System UI
rounded:
  button: 8px
  preview: 12px
  hud: 999px
spacing:
  pageMax: 1120px
  pageGutter: 40px
components:
  primaryButton:
    background: "{colors.accent}"
    foreground: "{colors.on-accent}"
  secondaryButton:
    foreground: "{colors.ink}"
    border: "{colors.line}"
---

<!-- Generated from site/src/styles.css, src/canvas.css, and the user brief.
Canonical CSS wins conflicts. REGENERATE with bun scripts/document-design.ts;
never hand-edit this generated file. Hex values are converted from OKLCH. -->

## Overview

Honu is a lightweight macOS screen annotation companion. A developer at a dim
desk moves between a call and an editor; the charcoal page matches that setting
while warm orange identifies actions. The portfolio’s Aetheria render appears
in grayscale behind the hero and simulated desktop. The desktop HUD keeps the actual screen
visible. The public page demonstrates the same transient drawing interaction.

## Colors

Orange is the action color; black and white surfaces stay neutral. Pen swatches are
literal drawing colors. Main text/background contrast is ${contrast('ink','bg').toFixed(2)}:1,
secondary text is ${contrast('muted','bg').toFixed(2)}:1, and primary button text is
${contrast('on-accent','accent').toFixed(2)}:1. Named rule: readable secondary copy.

## Typography

Self-hosted Manrope gives the landing page a friendly, rounded mechanical feel.
System UI keeps the native controls compact. Code uses the platform monospace.
Body copy is 16px; headings balance their lines with at most -0.038em tracking.
Small type is reserved for secondary metadata and the simulated desktop.

## Elevation

Depth comes from the real overlay relationship, not decorative shadows.
The shared drawing HUD uses a 12px backdrop blur, backed by near-opaque charcoal
for readability over arbitrary screens. Corners: 8px buttons, 12px preview,
14px drawing toolbar, pill-shaped action HUD.

## Components

The landing page uses a header, centered hero, live drawable desktop preview,
an open feature list, shortcut table, architecture download links, and footer.
The native app and website share the same Excalidraw canvas, top-right action
pill, and working tool, color, and stroke controls. Selection can recolor
existing shapes. On small canvases, the full toolbar docks at the bottom.
Named rule: ephemeral by default. Drawing, color, tool, and weight stay in memory.
Clear also erases history. File import/export and remote calls have no UI path.

Responsive changes at 900px and 600px collapse the content into one column.
The mock editor drops its sidebar on small screens. Only the hero has a short
entrance translation; reduced motion disables transitions and animations.

## Do's and Don'ts

Do use visible keyboard focus, semantic controls, and literal shortcut labels.
Do keep display-wide sharing guidance in the documentation. Do preserve
meaningful pen settings while wiping. Don't claim measured memory or size
advantages without a benchmark. Don't add decorative card grids, analytics,
accounts, saved preferences, or cloud sync. The turtle mark and mock screen
annotations are purposeful exceptions to generic illustration restrictions.
`;
await writeFile('DESIGN.md', doc);
await mkdir('.impeccable', { recursive: true });
await writeFile('.impeccable/design.json', JSON.stringify({
  schemaVersion: 2, sources: ['site/src/styles.css','src/canvas.css'],
  colors, motion: { transitionMs: 160, heroMs: 650, reducedMotion: 'none' },
  breakpoints: { compact: 600, medium: 900 },
  components: ['brand','button-primary','button-secondary','preview-hud','drawing-tools','shortcuts'],
}, null, 2) + '\n');
console.log('Generated DESIGN.md; contrast:', Object.fromEntries([['ink','bg'],['muted','bg'],['on-accent','accent']].map(([a,b]) => [`${a}/${b}`,contrast(a,b).toFixed(2)])));
