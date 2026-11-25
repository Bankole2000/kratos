#!/usr/bin/env bash
# Lists unfilled template placeholders (text wrapped in double curly braces).
# GitHub Actions expressions (dollar sign followed by braces) are ignored, and so is
# docs/reviews/ (review files quote placeholders on purpose) and templates/ (starting
# files that keep their placeholders until copied into apps/). Bruno variables are
# ignored too: Bruno writes them in double braces on purpose, in collections (bruno/
# folders), in scripts/bruno-check.mjs and as {{process.env.NAME}} in docs. Vue single-file
# components (*.vue) are skipped because their templates use double braces for
# interpolation, and so are build caches (.nuxt, .output, src-tauri/gen).
# Exits 1 if any placeholders remain, so it can run in CI.
set -euo pipefail
cd "$(dirname "$0")/.."

matches=$(grep -rnE '(^|[^$])\{\{' . \
  --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.venv \
  --exclude-dir=dist --exclude-dir=build --exclude-dir=coverage --exclude-dir=target \
  --exclude-dir=reviews --exclude-dir=templates --exclude-dir=bruno \
  --exclude-dir=.nuxt --exclude-dir=.output --exclude-dir=gen \
  --exclude=check-placeholders.sh --exclude=bruno-check.mjs --exclude='*.vue' \
  | grep -vF '{{process.env.' || true)

if [ -n "$matches" ]; then
  echo "Unfilled placeholders:"
  echo "$matches"
  echo
  echo "$(echo "$matches" | wc -l | tr -d ' ') placeholder line(s) remain."
  exit 1
fi

echo "No placeholders remain."
