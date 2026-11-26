#!/usr/bin/env bash
# Lists unfilled template placeholders (text wrapped in double curly braces).
# GitHub Actions expressions (dollar sign followed by braces) are ignored, and so is
# docs/reviews/ (review files quote placeholders on purpose) and templates/ (starting
# files that keep their placeholders until copied into apps/).
#
# Other tools use double braces too, so these are skipped as well:
# - binary files (-I), and build and dependency folders of common stacks;
# - component templates that interpolate with double braces (*.vue, *.svelte, *.hbs,
#   *.handlebars, *.mustache, *.njk, *.liquid, *.jinja, *.j2);
# - api client collections (bruno/ folders), and Bruno environment references written
#   as {{process.env.NAME}} anywhere.
# Add a project's own exclusions below rather than renaming its files.
# Exits 1 if any placeholders remain, so it can run in CI.
set -euo pipefail
cd "$(dirname "$0")/.."

matches=$(grep -rnIE '(^|[^$])\{\{' . \
  --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.venv --exclude-dir=venv \
  --exclude-dir=dist --exclude-dir=build --exclude-dir=coverage --exclude-dir=target \
  --exclude-dir=.next --exclude-dir=.nuxt --exclude-dir=.output --exclude-dir=.svelte-kit \
  --exclude-dir=.dart_tool --exclude-dir=.gradle --exclude-dir=Pods --exclude-dir=gen \
  --exclude-dir=reviews --exclude-dir=templates --exclude-dir=bruno \
  --exclude='*.vue' --exclude='*.svelte' --exclude='*.hbs' --exclude='*.handlebars' \
  --exclude='*.mustache' --exclude='*.njk' --exclude='*.liquid' --exclude='*.jinja' --exclude='*.j2' \
  --exclude=check-placeholders.sh --exclude=bruno-check.mjs \
  | grep -vF '{{process.env.' || true)

if [ -n "$matches" ]; then
  echo "Unfilled placeholders:"
  echo "$matches"
  echo
  echo "$(echo "$matches" | wc -l | tr -d ' ') placeholder line(s) remain."
  exit 1
fi

echo "No placeholders remain."
