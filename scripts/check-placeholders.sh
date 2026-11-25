#!/usr/bin/env bash
# Lists unfilled template placeholders (text wrapped in double curly braces).
# GitHub Actions expressions (dollar sign followed by braces) are ignored, and so is
# docs/reviews/ (review files quote placeholders on purpose) and templates/ (starting
# files that keep their placeholders until copied into apps/).
# Exits 1 if any placeholders remain, so it can run in CI.
set -euo pipefail
cd "$(dirname "$0")/.."

matches=$(grep -rnE '(^|[^$])\{\{' . \
  --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.venv \
  --exclude-dir=dist --exclude-dir=build --exclude-dir=coverage \
  --exclude-dir=reviews --exclude-dir=templates \
  --exclude=check-placeholders.sh || true)

if [ -n "$matches" ]; then
  echo "Unfilled placeholders:"
  echo "$matches"
  echo
  echo "$(echo "$matches" | wc -l | tr -d ' ') placeholder line(s) remain."
  exit 1
fi

echo "No placeholders remain."
