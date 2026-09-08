#!/usr/bin/env bash
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="$(bun -p 'require("./deploy/target.json").project')"
SERVICE="$(bun -p 'require("./deploy/target.json").service')"
ORIGIN="${HONU_SITE_ORIGIN:-$(bun -p 'require("./deploy/target.json").url')}"
HONU_SITE_BASE=/ HONU_SITE_ORIGIN="$ORIGIN" bun run build:site
bun run package:railway
# --no-gitignore is scoped to this generated allowlist-only Docker context.
# Never upload the full checkout, native build directories, or credentials.
railway up .deploy/railway --path-as-root --no-gitignore \
  --project "$PROJECT" --service "$SERVICE" --environment production --ci
railway deployment list --project "$PROJECT" --service "$SERVICE" --environment production --limit 1 --json
