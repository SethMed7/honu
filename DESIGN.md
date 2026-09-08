---
name: Honu
description: A quiet macOS annotation HUD and its public landing page
colors:
  bg: "#0a0a0a"
  surface: "#1d1d1d"
  ink: "#f2f2f2"
  muted: "#a8a8a8"
  accent: "#faab3f"
  line: "#3a3a3a"
  on-accent: "#0b0b0b"
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
literal drawing colors. Main text/background contrast is 17.62:1,
secondary text is 8.28:1, and primary button text is
10.26:1. Named rule: readable secondary copy.

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
