# Signing and releases

Latest public release: [Honu 0.2.0](https://github.com/SethMed7/honu-releases/releases/tag/v0.2.0).
Both apps and DMGs were signed and notarized locally using the existing
Developer ID certificate and `rotli-notary` Keychain profile. Both Railway DMG
downloads passed Gatekeeper; all four downloads matched their release hashes.

Honu follows `~/rotli/scripts/release.sh`: Developer ID signing with the hardened
runtime, notarize/staple the `.app`, archive the stapled app, build a DMG using
headless `hdiutil`, then sign/notarize/staple/validate that DMG. Honu adds a
two-target GitHub Actions matrix and publishes only after both builds succeed.

Honu has no updater plugin. The `.app.tar.gz` files contain the signed, stapled
app for direct distribution. They are not an updater feed and require no
updater signing secret. This deliberately omits rotli's `.sig`/`latest.json`.

## GitHub setup

Source lives in private `SethMed7/honu`; public installers live in
`SethMed7/honu-releases` and on Railway. Configure these secrets in the source
repository before running a signed Actions release:

| Actions secret | Value |
| --- | --- |
| `APPLE_CERTIFICATE` | Base64 Developer ID Application `.p12`, including private key |
| `APPLE_CERTIFICATE_PASSWORD` | Password protecting that `.p12` |
| `APPLE_SIGNING_IDENTITY` | Full `Developer ID Application: … (TEAMID)` identity |
| `APPLE_ID` | Developer account email |
| `APPLE_PASSWORD` | Apple **app-specific password**, not account login password |
| `APPLE_TEAM_ID` | Developer team identifier |

Encode the certificate outside the repository:

```sh
openssl base64 -A -in /secure/path/developer-id.p12 -out /secure/path/certificate-base64.txt
```

The script imports into a temporary Keychain with a random password, restores
the prior search list, and deletes the Keychain and `.p12` on exit. No seventh
Keychain-password secret is needed. Verification runs without signing secrets;
only the final publication job gets `contents: write`. Actions use immutable SHAs.

## Cut a release

1. Match versions in `package.json`, `src-tauri/tauri.conf.json`, and
   `src-tauri/Cargo.toml`; run `cargo check --manifest-path src-tauri/Cargo.toml`
   to update Honu's version in `Cargo.lock`.
2. Run `bun run verify`, commit the reviewed source, and push it.
3. Create and push its matching tag, such as `v0.1.0`. This triggers
   `.github/workflows/release.yml`. Manual dispatch also requires a version tag.

The workflow verifies the exact tagged source, then builds
`aarch64-apple-darwin` and `x86_64-apple-darwin` in separate macOS jobs (Intel is
cross-compiled). Both call `scripts/release.sh`. One release is created only
after both jobs succeed. Existing releases are not overwritten automatically.

Artifacts per architecture:

```text
Honu_aarch64.dmg              Honu_x86_64.dmg
Honu_aarch64.app.tar.gz       Honu_x86_64.app.tar.gz
SHA256SUMS-aarch64.txt        SHA256SUMS-x86_64.txt
notary-app-aarch64.json       notary-app-x86_64.json
notary-dmg-aarch64.json       notary-dmg-x86_64.json
evidence-aarch64.json         evidence-x86_64.json
```

Stable filenames support `/releases/latest/download/Honu_aarch64.dmg` without
rebuilding the site each release. Version identity comes from the tag and app
metadata. Publication rechecks hashes. Evidence records the source commit,
version, target, timestamp, and CI run; Apple's JSON records submission status.

## Local signing and notarization

With a Developer ID Application certificate installed in Keychain:

```sh
export APPLE_SIGNING_IDENTITY='Developer ID Application: Your Name (TEAMID)'
export HONU_NOTARY_PROFILE='honu-notary'
make release            # Apple Silicon
make release-intel      # Intel
```

If needed, create the profile interactively using
`xcrun notarytool store-credentials honu-notary`. Alternatively set `APPLE_ID`,
`APPLE_PASSWORD`, and `APPLE_TEAM_ID` in the environment. Supplying the
certificate/password environment variables uses CI's temporary import flow.
Never put secrets in tracked files or release logs.

The source must be clean and committed. Artifacts go to
`dist-release/<target>/`, separate from Tauri's embedded `dist/`. This follows
rotli's protection against bundling previous release artifacts into the app.
The local script **never publishes**.

The script requires a notary status of `Accepted`, validates stapling and
signatures, and runs Gatekeeper assessments. It also extracts the tar and
validates that app. Apple service errors stop publication; inspect the retained
submission ID with `notarytool log` using the same credentials. Do not bypass
a rejected submission.

Version 0.1.0 was signed locally using the installed Developer ID certificate
and existing `rotli-notary` Keychain profile on 2026-09-08. Apple accepted both
architecture apps and DMGs; stapling, code signing, extracted tar validation,
and Gatekeeper checks passed. The installers are published in the public
[release](https://github.com/SethMed7/honu-releases/releases/tag/v0.1.0) and
served by [Railway](https://honu.up.railway.app/). Both DMGs downloaded back
from Railway passed stapler and Gatekeeper checks, and all four downloads
matched their published checksums.

Signing credentials were not copied into GitHub. The first signed Actions
run, clean-Mac installation, and native UI checks remain separate validation.
Test Intel on Intel hardware, including Spaces and multiple displays. See
[Railway deployment](railway.md) for public distribution and redeployment.

References: [Tauri signing](https://v2.tauri.app/distribute/sign/macos/),
[Tauri window customization](https://v2.tauri.app/learn/window-customization/),
[Apple notarization](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution).
