.PHONY: dev site check verify release release-intel
dev:
	bun run dev:app
site:
	bun run dev:site
check:
	bun run check
verify:
	bun run verify
release:
	bash scripts/release.sh aarch64-apple-darwin
release-intel:
	bash scripts/release.sh x86_64-apple-darwin
