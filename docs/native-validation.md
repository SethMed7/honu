# Native acceptance checks

Version 0.2.0 evidence (2026-09-08): six shortcut tests and six production
browser tests passed, covering shape/arrow geometry, selected-object
recoloring, stroke widths, toggles, wipe behavior, and full touch targets from
320–1440px. Frontend builds, TypeScript, rustfmt, Clippy, and Cargo tests passed.
Both architecture apps were built from `c439a039dbfa46b8b56a954d92e27cf82fd27279`,
signed, accepted by Apple, stapled, and validated. Both public DMGs downloaded
from Railway passed stapler and Gatekeeper checks; all four public archives
matched their release hashes. The later website-only commit adds tablet touch
target rules. Native window/tray/Spaces interaction checks below still require
an interactive Mac session.

Implementation-session evidence (2026-09-08): six shortcut tests and three
production browser tests passed; both frontend builds passed; Rust checking
passed for Apple Silicon and Intel; Clippy and formatting passed. A development
Honu.app was built and launched, then stopped. Native UI automation was blocked
by pending Computer Use permissions, so the visual/tray/Spaces checks below
remain unverified.

Release-session evidence (2026-09-08): both architecture apps and DMGs were
signed, accepted by Apple notarization, stapled, and validated. Extracted tar
apps passed signature and Gatekeeper assessment. Both DMGs downloaded from
the live Railway URL passed stapler and Gatekeeper checks; all four public
installer/archive downloads matched their local release checksums. This
does not replace the native interaction and clean-Mac checks below.

Browser checks cannot prove AppKit compositing, global hotkeys, tray events,
Spaces, or Gatekeeper. Run these against each shipping architecture:

1. Launch: turtle in menu bar, no canvas or Dock icon.
2. With another app focused, press `⌘⇧D`. Its content stays visible; the current
   Space stays put. Draw a line and arrow.
3. Set color, weight, and tool. Toggle via hotkey and tray. Drawings and pen
   settings survive; no additional Honu windows appear.
4. Press `C`: strokes vanish, overlay stays, pen stays. `⌘Z` cannot restore the
   board. Type a word containing C with Text; it must remain text.
5. Press `Esc`, including during text editing: wipe and hide. Reopen: blank
   board, previous pen. Verify the Hide button does the same.
6. Right-click turtle: Toggle, separator, Quit. Left-click toggles directly.
7. Quit through HUD, `⌘Q`, and tray in separate launches. The turtle and hotkey
   disappear. Relaunch starts with the default pen.
8. Move pointer between Retina/non-Retina displays, including one left/above
   the main display. Toggle covers the pointer display. Repeat over fullscreen
   Keynote, another Space, and after reconnecting a display.
9. Share the entire display in the intended call app and verify annotations
   appear. Single-window shares can exclude separate overlay windows.
10. Open the browser-downloaded signed DMG on a clean Mac, also offline after
    downloading. Test the extracted tar app too. Stapled tickets should allow
    Gatekeeper assessment without an Apple network lookup.

No screen recording permission is needed: Honu does not read screen pixels.
An opaque white native window is a failure even when browser canvas pixels
are transparent; CSS, Excalidraw background state, WKWebView, and NSWindow must
all agree on transparency.
