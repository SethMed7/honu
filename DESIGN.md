---
name: Honu
description: A quiet macOS annotation HUD and its public landing page
colors:
  bg: "#101513"
  surface: "#191e1c"
  ink: "#eef3f1"
  muted: "#9faba5"
  accent: "#82eab9"
  line: "#343d39"
  on-accent: "#0c1f17"
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

<!-- Generated from site/src/styles.css, src/styles.css, and the user brief.
Canonical CSS wins conflicts. REGENERATE with bun scripts/document-design.ts;
never hand-edit this generated file. Hex values are converted from OKLCH. -->

## Overview

Honu is a lightweight macOS screen annotation companion. A developer at a dim
desk moves between a call and an editor; the charcoal page matches that setting
while seafoam identifies actions. The desktop HUD keeps the actual screen
visible. The public page demonstrates the same transient drawing interaction.

## Colors

Seafoam is the action color; charcoal surfaces stay quiet. Pen swatches are
literal drawing colors. Main text/background contrast is 16.44:1,
secondary text is 7.76:1, and primary button text is
11.75:1. Named rule: readable secondary copy.

## Typography

Self-hosted Manrope gives the landing page a friendly, rounded mechanical feel.
System UI keeps the native controls compact. Code uses the platform monospace.
Body copy is 16px; headings balance their lines with at most -0.038em tracking.
Small type is reserved for secondary metadata and the simulated desktop.

## Elevation

Depth comes from the real overlay relationship, not decorative shadows.
Only the native HUD uses a 12px backdrop blur, backed by near-opaque charcoal
for readability over arbitrary screens. Corners: 8px buttons, 12px preview,
14px drawing toolbar, pill-shaped action HUD.

## Components

The landing page uses a header, centered hero, live drawable desktop preview,
an open feature list, shortcut table, architecture download links, and footer.
The native surface uses a top-right action pill and a separate left toolbar.
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
