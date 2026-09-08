# Honu

A small macOS menu bar companion for ephemeral screen annotations. Built with
Tauri v2, React, and Excalidraw. No account, database, autosave, telemetry, or cloud.

## Run locally

Requires macOS 12+, Xcode Command Line Tools, Rust via rustup, and Bun 1.4.0.
The Rust toolchain and both dependency lockfiles are pinned.

```sh
bun install --frozen-lockfile
bun run dev:app
```

Honu starts **hidden**. Click the turtle in the menu bar or press `⌘⇧D`.
Right-click the turtle for Toggle / Quit. The overlay follows the display
containing the pointer. Toggle off to interact with the application underneath.

| Shortcut | Action |
| --- | --- |
| `⌘⇧D` | Show / hide, preserving board and pen |
| `C` | Wipe board and undo history, keep pen |
| `Esc` | Wipe and hide, keep pen |
| `⌘Q` / `Ctrl+Q` | Quit and release the session |

`C` does not clear while typing text. Keyboard actions do not interrupt IME
composition. `Esc` otherwise wipes even during text editing. The left HUD
provides selection, pen, arrow, rectangle, ellipse, diamond, line, text, eraser, colors, and
stroke weight. Select a shape to change its color or weight. Ordinary Excalidraw tool and undo shortcuts remain available.

## Project structure

```text
honu/
├── src/
│   ├── App.tsx                 # Excalidraw, floating HUD, memory-only pen
│   ├── scene.ts                # Clear scene/files/history; retain pen
│   ├── shortcuts.ts            # Keyboard policy, including text inputs
│   ├── canvas.css              # Shared responsive drawing controls
│   ├── styles.css              # Native transparent document
│   ├── env.d.ts
│   └── main.tsx
├── src-tauri/
│   ├── src/{lib.rs,main.rs}    # Tray, global shortcut, AppKit overlay
│   ├── capabilities/main.json # Only hide-window and process-exit permissions
│   ├── icons/                 # Turtle icon and monochrome tray template
│   ├── Cargo.toml
│   ├── Cargo.lock
│   ├── build.rs
│   ├── tauri.conf.json
│   ├── entitlements.plist
│   └── Info.plist              # LSUIElement; no Dock icon
├── site/
│   ├── index.html             # Semantic marketing page
│   ├── src/preview.tsx         # Real shared Excalidraw demo
│   ├── src/{main.ts,styles.css}# Lazy loading, Tailwind, local fonts
│   ├── src/assets/            # Portfolio Aetheria background
│   ├── public/turtle.svg
│   └── vite.config.ts         # Static output with /honu/ asset base
├── scripts/
│   ├── release.sh             # Shared local/CI signing and notarization
│   ├── check-versions.ts
│   ├── copy-assets.ts         # Bundle Excalidraw fonts for offline use
│   ├── generate-icons.ts
│   └── document-design.ts     # Derive design reference/contrast from CSS
├── .github/workflows/{ci.yml,release.yml}
├── tests/shortcuts.test.ts
├── e2e/honu.spec.ts
├── docs/{release.md,native-validation.md}
├── public/turtle.svg
├── Makefile
├── DESIGN.md
├── .impeccable/design.json
├── .bun-version
├── .gitignore
├── package.json
├── bun.lock
├── rust-toolchain.toml
├── playwright.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Native overlay and persistence boundary

The requested window flags, including `fullscreen: true`, live in
`tauri.conf.json`. `create: false` lets Rust construct the one window safely.
On macOS the builder overrides native fullscreen with a borderless,
monitor-sized window: native fullscreen creates another Space and would hide
the desktop being annotated. AppKit makes it nonopaque, removes its shadow,
sets the status window level, and joins Spaces as a fullscreen auxiliary window.
The config's `transparent` flag and Tauri's `macos-private-api` feature clear
WKWebView's backing background. CSS transparency alone is insufficient.

The hardened-runtime entitlement dictionary is deliberately empty, matching
rotli. Transparency has **no special entitlement**; it requires
`app.macOSPrivateApi` and the Rust feature. This app is for direct distribution,
not the Mac App Store. Honu does not read screen pixels and needs no screen
recording permission. To show annotations on a call, share the entire display:
a share of one application window may exclude Honu's separate overlay.

WKWebView uses `incognito: true`, a nonpersistent website data store.
The app never serializes drawings or preferences. Hiding keeps the mounted
React/Excalidraw session; clearing resets elements, embedded files, and history;
quitting drops it all. No filesystem, store, HTTP, clipboard, or database
plugins are installed. File menus, import/export shortcuts, paste/import,
drag/drop, and webview downloads are disabled. Fonts ship locally and the
production CSP disallows remote connections. OS bookkeeping and build outputs
are outside the drawing-state contract.

## Landing page

```sh
bun run dev:site        # http://127.0.0.1:1421/honu/
bun run build:site      # static output in site/dist/
```

Copy the **contents** of `site/dist/` into the existing site's public `honu/`
directory. The marketing page is static HTML; its drawing area lazy-loads the
same React/Excalidraw component as the app. Keep all generated assets and local
fonts with it. There are no external font requests or analytics. The palette
is black and white with orange controls; Seth’s portfolio Aetheria render is
displayed in grayscale behind the page and mock desktop.

The Railway site is **https://honu.up.railway.app/** and serves installers from
its own `downloads/` directory. The public GitHub mirror is
`SethMed7/honu-releases`; source is private in `SethMed7/honu`.
See [Railway setup](docs/railway.md) for rebuilding, deploying, and adding DNS.
A normal local build does not deploy or publish; use the explicit deploy script.

## Validate and build

```sh
bunx playwright install chromium
bun run verify
bun run tauri build --debug --bundles app -- --locked
```

`verify` runs TypeScript, shortcut tests, script/version checks, both production
frontend builds, production browser interactions, Rust formatting, Clippy, and Cargo's
test harness. Browser coverage checks transparent pixels, erase/undo behavior,
pen retention and reload reset, text editing, no browser storage writes, preview
shape/arrow drawing, selected-object recoloring, every toolbar control, toggling, and widths from 320px to 1440px. Native window/tray/Spaces
behavior requires [macOS checks](docs/native-validation.md).

Vite reports large chunks in upstream Excalidraw drawing/font/diagram code.
Those dependencies are bundled; Honu adds no Electron/browser runtime. No
unmeasured app-size or memory-footprint claims are made.

See [release setup](docs/release.md) for GitHub secrets and local signed builds.
