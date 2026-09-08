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
provides selection, pen, arrow, rectangle, ellipse, text, eraser, colors, and
stroke weight. Ordinary Excalidraw tool and undo shortcuts remain available.

## Project structure

```text
honu/
├── src/
│   ├── App.tsx                 # Excalidraw, floating HUD, memory-only pen
│   ├── scene.ts                # Clear scene/files/history; retain pen
│   ├── shortcuts.ts            # Keyboard policy, including text inputs
│   ├── styles.css              # Transparent canvas and compact controls
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
│   ├── src/{main.ts,styles.css}# Drawable preview, Tailwind, local fonts
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
directory. No server, React runtime, external font request, or analytics is
required. `site/index.html` is also a source template for an existing Tailwind
site; keep the stylesheet and small preview script with it.

Links assume the public repository/release destination is
`https://github.com/SethMed7/honu`. Change `site/index.html` if using a separate
releases repository. Architecture-specific download URLs become available
after the first release publishes `Honu_aarch64.dmg` and `Honu_x86_64.dmg`.
A local build does not deploy the site or publish a GitHub release.

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
drawing/toggling, and widths from 320px to 1440px. Native window/tray/Spaces
behavior requires [macOS checks](docs/native-validation.md).

Vite reports large chunks in upstream Excalidraw drawing/font/diagram code.
Those dependencies are bundled; Honu adds no Electron/browser runtime. No
unmeasured app-size or memory-footprint claims are made.

See [release setup](docs/release.md) for GitHub secrets and local signed builds.
