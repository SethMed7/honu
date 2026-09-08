# Railway deployment

Production URL: **https://honu.up.railway.app/**

Current release: **0.2.0**, deployment `d34342cb-0153-4d61-9724-e0dd575e3146`
(2026-09-08). The demo shares the app's real Excalidraw tools, colors, and
stroke settings. Its Aetheria background is the portfolio render in grayscale;
the site and icons use black, white, and orange. The page, all icon files, and
all four 0.2.0 downloads were verified on the live URL. Browser interactions
passed at 1440, 1024, and 390px without errors or failed requests.

Initial production deployment `533f3c8e-aa83-4190-89a7-e1a48997fae1` succeeded
on 2026-09-08. Version 0.1.0 is also available in the public
[GitHub release](https://github.com/SethMed7/honu-releases/releases/tag/v0.1.0).

Railway project `honu`, service `site`, environment `production`, in Seth
Medina's personal workspace. Public target IDs are in `deploy/target.json`;
Railway CLI credentials stay in the CLI's existing authenticated session.

The site is a static Nginx container. It serves the landing page, self-hosted
fonts, favicons, and both architecture installers. There is no database or
volume. Downloads support HTTP ranges for resuming and carry attachment headers.
The Docker upload includes only built public files and verified distribution
artifacts. It excludes application source and signing credentials.

## Rebuild and redeploy

1. Build the signed/notarized installers using `scripts/release.sh` for both
   architectures, as described in [release.md](release.md).
2. Run `bun run verify`.
3. Run `bash scripts/deploy-railway.sh` from an authenticated Railway CLI.
   This builds at `/`, packages the site and installers, and uploads them.
4. Check the reported deployment until `SUCCESS`, then verify `/health`,
   `/favicon.ico`, and both `/downloads/Honu_<arch>.dmg` routes.

Packaging checks Apple's `Accepted` records and installer SHA-256 hashes
before anything is uploaded, and requires matching versions and source commits
for both installers. The public GitHub mirror is
`SethMed7/honu-releases`; source stays in private `SethMed7/honu`.
The site's download buttons use same-origin Railway URLs. GitHub buttons lead
to the public installer repository. The existing Actions release workflow
publishes into the source repository by default; publishing into a different
repository from CI requires a separately scoped credential. The initial public
release uses the authenticated local CLI, without copying its token into CI.

## DNS later

Add the desired custom domain to Railway's `site` service and use the DNS
records Railway returns. Then set `HONU_SITE_ORIGIN=https://your-domain`
when running the deploy script so canonical/Open Graph URLs match it.
No custom domain or DNS records were changed during Railway setup.

To use the original `sethmedina.com/honu/` path instead, build with
`bun run build:site` (default base `/honu/`) and serve the output under that
path, including the `downloads/` directory. DNS alone cannot route a subpath.

## Favicons

`bun run favicons` regenerates the shared turtle identity as SVG, a 16/32/48px
ICO, 16/32px PNGs, a 180px Apple touch icon, 192/512px manifest icons, and a
monochrome Safari pinned-tab icon. All URLs respect Vite's configured base.
No remote icon/font request or service worker is required.
