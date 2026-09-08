#!/usr/bin/env bash
# The rotli sequence: signed app -> notarize/staple app -> tar + headless DMG
# -> sign/notarize/staple DMG -> validate. This script never publishes.
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

die() { echo "Honu release: $*" >&2; exit 1; }
[[ "$(uname -s)" == Darwin ]] || die "macOS and Xcode are required"
TARGET="${1:-$(rustc -vV | awk '/^host:/{print $2}')}"
case "$TARGET" in
  aarch64-apple-darwin) ARCH=aarch64 ;;
  x86_64-apple-darwin) ARCH=x86_64 ;;
  *) die "use aarch64-apple-darwin or x86_64-apple-darwin" ;;
esac
[[ $# -le 1 ]] || die "usage: scripts/release.sh [target]"
[[ -z "$(git status --porcelain --untracked-files=normal)" ]] || die "release from a clean, committed source tree"
SOURCE_COMMIT="$(git rev-parse HEAD)"
[[ -n "${APPLE_SIGNING_IDENTITY:-}" ]] || die "APPLE_SIGNING_IDENTITY is required"
[[ "$APPLE_SIGNING_IDENTITY" == 'Developer ID Application:'* ]] || die "a Developer ID Application identity is required"
[[ "$(bun --version)" == "$(tr -d '[:space:]' < .bun-version)" ]] || die "install the Bun version in .bun-version"
bun scripts/check-versions.ts
VERSION="$(bun -p 'require("./package.json").version')"

# Local builds may reuse a preconfigured Keychain notary profile. CI uses the
# three Apple account secrets; no credentials are stored in the repository.
NOTARY_ARGS=()
if [[ -n "${HONU_NOTARY_PROFILE:-}" ]]; then
  NOTARY_ARGS=(--keychain-profile "$HONU_NOTARY_PROFILE")
else
  [[ -n "${APPLE_ID:-}" && -n "${APPLE_PASSWORD:-}" && -n "${APPLE_TEAM_ID:-}" ]] || die "set APPLE_ID, APPLE_PASSWORD, APPLE_TEAM_ID (or HONU_NOTARY_PROFILE)"
  NOTARY_ARGS=(--apple-id "$APPLE_ID" --password "$APPLE_PASSWORD" --team-id "$APPLE_TEAM_ID")
fi

WORK="$(mktemp -d "${TMPDIR:-/tmp}/honu-release.XXXXXX")"
KEYCHAIN=""
PREVIOUS_KEYCHAINS=()
cleanup() {
  if [[ -n "$KEYCHAIN" ]]; then
    security list-keychains -d user -s "${PREVIOUS_KEYCHAINS[@]}" || true
    security delete-keychain "$KEYCHAIN" || true
  fi
  rm -rf "$WORK"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Import the CI .p12 into an isolated, temporary Keychain. Restore the search
# list on every exit; never modify the login Keychain or write secrets to logs.
if [[ -n "${APPLE_CERTIFICATE:-}" ]]; then
  [[ -n "${APPLE_CERTIFICATE_PASSWORD:-}" ]] || die "APPLE_CERTIFICATE_PASSWORD is required"
  while IFS= read -r entry; do
    PREVIOUS_KEYCHAINS+=("$entry")
  done < <(security list-keychains -d user | sed 's/^[[:space:]]*"//;s/"[[:space:]]*$//')
  KEYCHAIN="$WORK/signing.keychain-db"
  KEYCHAIN_PASSWORD="$(openssl rand -hex 24)"
  (umask 077; printf '%s' "$APPLE_CERTIFICATE" | base64 --decode > "$WORK/certificate.p12")
  security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN"
  security set-keychain-settings -lut 21600 "$KEYCHAIN"
  security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN"
  security import "$WORK/certificate.p12" -k "$KEYCHAIN" -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign -T /usr/bin/security >/dev/null
  security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN" >/dev/null
  security list-keychains -d user -s "$KEYCHAIN" "${PREVIOUS_KEYCHAINS[@]}"
  rm -f "$WORK/certificate.p12"
fi

bun run check
rustup target add "$TARGET"
# Explicit notarization below is shared by local and CI releases. Remove the
# auto-notary variables for this child only, keeping Developer ID signing on.
env -u APPLE_ID -u APPLE_PASSWORD -u APPLE_TEAM_ID -u APPLE_CERTIFICATE -u APPLE_CERTIFICATE_PASSWORD \
  CI=true bun run tauri build --target "$TARGET" --bundles app -- --locked

APP="$(pwd)/src-tauri/target/$TARGET/release/bundle/macos/Honu.app"
OUT="$(pwd)/dist-release/$TARGET"
mkdir -p "$OUT"
[[ -d "$APP" ]] || die "missing built Honu.app"
codesign --verify --deep --strict --verbose=2 "$APP"

notarize() {
  local artifact="$1" record="$2"
  echo "Notarizing $(basename "$artifact")…"
  xcrun notarytool submit "$artifact" "${NOTARY_ARGS[@]}" --wait --timeout 45m --output-format json > "$record"
  bun -e 'const r=await Bun.file(process.argv[1]).json(); if(r.status!=="Accepted") { console.error("Notarization failed:",r.status,"submission:",r.id);process.exit(1); }' "$record"
}

ditto -c -k --keepParent "$APP" "$WORK/Honu.zip"
notarize "$WORK/Honu.zip" "$OUT/notary-app-$ARCH.json"
xcrun stapler staple "$APP"
xcrun stapler validate "$APP"
spctl --assess --type execute --verbose=2 "$APP"

# Archive only the FINAL stapled app; no updater plugin/key/manifest is needed.
TARBALL="$OUT/Honu_$ARCH.app.tar.gz"
(cd "$(dirname "$APP")" && COPYFILE_DISABLE=1 tar -czf "$TARBALL" Honu.app)
mkdir "$WORK/extracted"
tar -xzf "$TARBALL" -C "$WORK/extracted"
codesign --verify --deep --strict "$WORK/extracted/Honu.app"
xcrun stapler validate "$WORK/extracted/Honu.app"

mkdir "$WORK/dmg"
ditto "$APP" "$WORK/dmg/Honu.app"
ln -s /Applications "$WORK/dmg/Applications"
DMG="$OUT/Honu_$ARCH.dmg"
hdiutil create -volname "Honu $VERSION" -srcfolder "$WORK/dmg" -ov -format UDZO "$DMG"
codesign --force --timestamp --sign "$APPLE_SIGNING_IDENTITY" "$DMG"
notarize "$DMG" "$OUT/notary-dmg-$ARCH.json"
xcrun stapler staple "$DMG"
xcrun stapler validate "$DMG"
codesign --verify --strict "$DMG"
spctl --assess --type open --context context:primary-signature --verbose=2 "$DMG"
(cd "$OUT" && shasum -a 256 "Honu_$ARCH.dmg" "Honu_$ARCH.app.tar.gz" > "SHA256SUMS-$ARCH.txt")
export SOURCE_COMMIT VERSION TARGET
bun -e 'await Bun.write(process.argv[1], JSON.stringify({ version: process.env.VERSION, commit: process.env.SOURCE_COMMIT, target: process.env.TARGET, builtAt: new Date().toISOString(), ciRun: process.env.GITHUB_RUN_ID ?? null }, null, 2) + "\n")' "$OUT/evidence-$ARCH.json"
echo "Signed, notarized, stapled, and validated: $OUT"
