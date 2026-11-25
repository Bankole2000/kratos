#!/usr/bin/env bash
# Creates the labels and milestones from docs/GITHUB.md and docs/ROADMAP.md, and
# optionally the custom GitHub Project fields. Safe to re-run: existing labels are
# updated, existing milestones and fields are skipped.
#
# Usage:
#   bash scripts/setup-github.sh                      # labels + milestones for the current repo
#   bash scripts/setup-github.sh --apps web,api       # app labels (default: folders in apps/)
#   bash scripts/setup-github.sh --project <number>   # also create Project fields
#   bash scripts/setup-github.sh --repo owner/name    # target another repo
#
# One app:<name> label is created per app: from --apps if given, otherwise from the
# folders in apps/. Before apps/ exists (setup runs before M0), pass --apps; the
# project setup review (docs/reviews/*-project-setup.md) prints the exact command.
#
# Requires the GitHub CLI (gh), authenticated. Project fields also need the project
# scope: gh auth refresh -s project
#
# Keep the lists below in sync with docs/GITHUB.md (labels, fields) and
# docs/ROADMAP.md (milestones).
set -euo pipefail
cd "$(dirname "$0")/.."

REPO=""
PROJECT=""
APPS=""
while [ $# -gt 0 ]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --project) PROJECT="$2"; shift 2 ;;
    --apps) APPS="$2"; shift 2 ;;
    -h|--help) sed -n '2,22p' "$0"; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

command -v gh >/dev/null || { echo "GitHub CLI (gh) is required." >&2; exit 1; }
[ -n "$REPO" ] || REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
OWNER="${REPO%%/*}"
echo "Repository: $REPO"

# --- Apps: from --apps, else the folders in apps/ ---
if [ -z "$APPS" ] && [ -d apps ]; then
  for d in apps/*/; do [ -d "$d" ] && APPS="${APPS:+$APPS,}$(basename "$d")"; done
fi
APP_LABELS=()
IFS=',' read -ra APP_LIST <<< "$APPS"
for a in ${APP_LIST[@]+"${APP_LIST[@]}"}; do
  a="${a// /}"
  [ -z "$a" ] && continue
  if [[ ! "$a" =~ ^[a-z][a-z0-9-]{0,29}$ ]]; then echo "Invalid app name: $a (use lowercase letters, digits, hyphens)" >&2; exit 2; fi
  APP_LABELS+=("app:$a|5319e7|Work in apps/$a")
done
if [ ${#APP_LABELS[@]} -eq 0 ]; then
  echo "Warning: no apps found (no --apps and no folders in apps/). Skipping app:<name> labels." >&2
fi

# --- Labels: name|color|description ---
LABELS=(
  "type:feature|1d76db|New capability"
  "type:bug|d73a4a|Incorrect behavior"
  "type:enhancement|1d76db|Improve existing behavior"
  "type:refactor|1d76db|Internal restructuring"
  "type:documentation|1d76db|Documentation"
  "type:test|1d76db|Tests"
  "type:chore|1d76db|Maintenance"
  "type:research|1d76db|Investigation"
  "type:design|1d76db|Design work"
  "type:security|b60205|Security work"
  "type:performance|1d76db|Performance work"
  # Per-app labels are added from APP_LABELS below.
  "app:packages|5319e7|Shared code (packages/)"
  "app:sdks|5319e7|Published SDKs (sdks/)"
  "app:infra|5319e7|Infrastructure-as-code (infra/)"
  "app:repo|5319e7|Repository-wide: CI, tooling, docs"
  "area:frontend|0e8a16|Frontend"
  "area:backend|0e8a16|Backend"
  "area:mobile|0e8a16|Mobile"
  "area:desktop|0e8a16|Desktop"
  "area:database|0e8a16|Database"
  "area:api|0e8a16|API"
  "area:auth|0e8a16|Authentication and authorization"
  "area:integrations|0e8a16|External integrations"
  "area:infrastructure|0e8a16|Infrastructure"
  "area:devops|0e8a16|CI/CD and tooling"
  "ai:planned|c5def5|Created by planning agent"
  "needs:human-input|fbca04|Agent is waiting on a human answer"
  "needs:specification|fbca04|Missing requirements"
  "needs:decision|fbca04|Unresolved decision"
  "review:security|d93f0b|Security review required"
  "review:privacy|d93f0b|Privacy review required"
  "review:legal|d93f0b|Legal review required"
  "review:medical|d93f0b|Medical review required"
  "review:financial|d93f0b|Financial review required"
  "impact:breaking|b60205|Compatibility impact"
)
[ ${#APP_LABELS[@]} -gt 0 ] && LABELS+=("${APP_LABELS[@]}")

echo "Labels:"
for entry in "${LABELS[@]}"; do
  IFS='|' read -r name color desc <<< "$entry"
  gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" --force >/dev/null
  echo "  ok  $name"
done

# --- Milestones (must match docs/ROADMAP.md exactly) ---
MILESTONES=(
  "M0 - Foundation"
  "M1 - Core registry"
  "M2 - Reference data"
  "M3 - Metrics"
  "M4 - Costs and Dart SDK"
  "M5 - Hardening and launch"
  "v2 - Post-launch"
)

echo "Milestones:"
existing=$(gh api "repos/$REPO/milestones?state=all&per_page=100" --paginate --jq '.[].title')
for title in "${MILESTONES[@]}"; do
  if grep -qxF "$title" <<< "$existing"; then
    echo "  skip $title (exists)"
  else
    gh api -X POST "repos/$REPO/milestones" -f title="$title" >/dev/null
    echo "  ok   $title"
  fi
done

# --- Project fields (optional) ---
if [ -n "$PROJECT" ]; then
  FIELDS=(
    "Priority|Critical,High,Medium,Low"
    "Complexity|Small,Medium,Large"
    "Human Review|Required,Approved,Changes Requested"
    "AI Ready|No,Yes"
  )
  echo "Project $PROJECT fields:"
  existing=$(gh project field-list "$PROJECT" --owner "$OWNER" --format json --jq '.fields[].name')
  for entry in "${FIELDS[@]}"; do
    IFS='|' read -r name options <<< "$entry"
    if grep -qxF "$name" <<< "$existing"; then
      echo "  skip $name (exists; check its options match: $options)"
    else
      gh project field-create "$PROJECT" --owner "$OWNER" --name "$name" \
        --data-type SINGLE_SELECT --single-select-options "$options" >/dev/null
      echo "  ok   $name"
    fi
  done
fi

cat <<'MANUAL'

Manual steps remaining:
  - Project Status field: add the "In Review" and "Blocked" options (the CLI cannot edit built-in Status options).
  - Project "New issue default" values (docs/GITHUB.md) are not enforced by GitHub; agents set them when creating issues.
  - Consider deleting GitHub's default labels (bug, enhancement, documentation, ...) to avoid duplicates of type:* labels.
  - Branch protection: require PRs, required status checks and Code Owner review (see docs/GITHUB.md).
MANUAL
