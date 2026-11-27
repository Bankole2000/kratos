#!/usr/bin/env bash
# Sets up GitHub for this repository from docs/GITHUB.md and docs/ROADMAP.md: labels,
# milestones, the branch ruleset and the GitHub Project (or labels in its place). Safe to
# re-run: what exists is updated or skipped, and a summary lists what is left for a human.
#
# Usual use:
#   bash scripts/setup-github.sh --all --apps web,api --project 5 --approvals 0 --dry-run
#   bash scripts/setup-github.sh --all --apps web,api --project 5 --approvals 0
#   bash scripts/setup-github.sh --required-check ci-ok,risk-gate   # once both have run on a PR
#
# Steps (with none given, labels and milestones run):
#   --all                 Every step below except --required-check
#   --labels              Labels; with no Project, also the status:*, human:* and ai:ready
#                         labels that stand in for Project fields (docs/GITHUB.md)
#   --milestones          Milestones from the Milestones table in docs/ROADMAP.md, with
#                         their outcome and journeys as the description (rows that still
#                         hold placeholders are skipped; descriptions are kept in step)
#   --ruleset             "main-guard" ruleset on the default branch: no deletion, no
#                         force-push, pull requests with --approvals approvals
#   --repo-settings       Repository settings the agent workflow relies on: allow
#                         auto-merge, delete head branches after merge (docs/GITHUB.md)
#   --remove-default-labels  Delete GitHub's default labels (bug, enhancement, …) that no
#                         issue or pull request uses; the type:* labels replace them
#   --required-check A,B  Also require these status checks, comma-separated (implies
#                         --ruleset). Add each only once it has run on a pull request, or
#                         every PR waits forever.
# Options:
#   --repo owner/name     Default: this folder's GitHub repository
#   --apps a,b            One app:<name> label per app (default: the folders in apps/)
#   --approvals N         Required approvals: 0 for a solo owner, 1 or more for a team
#                         (default: keep the ruleset's current count, or 1 for a new one)
#   --project N           Use GitHub Project N: link the repository to it and create its
#                         custom fields, including Journey (the journeys in docs/FEATURES.md
#                         plus Platform)
#   --project-from N      Copy Project N (a template Project with the fields, Status options
#                         and views already set up) as a new Project for this repository,
#                         then use it as --project
#   --dry-run             Show what would change; change nothing
#
# Needs the GitHub CLI (gh), signed in with the repo scope, plus the project scope for
# --project or --project-from. The script checks this first and prints the command to fix
# it. Failed GitHub calls are retried twice.
set -euo pipefail
cd "$(dirname "$0")/.."

usage() { awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"; }

REPO="" PROJECT="" PROJECT_FROM="" APPS="" APPROVALS="" REQUIRED_CHECK="" DRY=""
DO_LABELS="" DO_MILESTONES="" DO_RULESET="" DO_REMOVE_DEFAULTS="" DO_REPO_SETTINGS="" ANY_STEP=""
while [ $# -gt 0 ]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --apps) APPS="$2"; shift 2 ;;
    --approvals) APPROVALS="$2"; shift 2 ;;
    --project) PROJECT="$2"; shift 2 ;;
    --project-from) PROJECT_FROM="$2"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    --all) DO_LABELS=1; DO_MILESTONES=1; DO_RULESET=1; DO_REMOVE_DEFAULTS=1; DO_REPO_SETTINGS=1; ANY_STEP=1; shift ;;
    --repo-settings) DO_REPO_SETTINGS=1; ANY_STEP=1; shift ;;
    --labels) DO_LABELS=1; ANY_STEP=1; shift ;;
    --milestones) DO_MILESTONES=1; ANY_STEP=1; shift ;;
    --ruleset) DO_RULESET=1; ANY_STEP=1; shift ;;
    --remove-default-labels) DO_REMOVE_DEFAULTS=1; ANY_STEP=1; shift ;;
    --required-check) REQUIRED_CHECK="$2"; DO_RULESET=1; ANY_STEP=1; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1 (see --help)" >&2; exit 2 ;;
  esac
done
[ -n "$ANY_STEP" ] || { DO_LABELS=1; DO_MILESTONES=1; }
[ -z "$APPROVALS" ] || [[ "$APPROVALS" =~ ^[0-9]+$ ]] || { echo "--approvals must be a number" >&2; exit 2; }
[ -z "$PROJECT" ] || [ -z "$PROJECT_FROM" ] || { echo "Use --project or --project-from, not both." >&2; exit 2; }

# --- Summary ---
CREATED=() UPDATED=() SKIPPED=() MANUAL=()
summary() {
  echo
  echo "Summary${DRY:+ (dry run: nothing was changed)}"
  local label list
  for label in Created Updated Skipped "Left for a human"; do
    case "$label" in
      Created) list=(${CREATED[@]+"${CREATED[@]}"}) ;;
      Updated) list=(${UPDATED[@]+"${UPDATED[@]}"}) ;;
      Skipped) list=(${SKIPPED[@]+"${SKIPPED[@]}"}) ;;
      *) list=(${MANUAL[@]+"${MANUAL[@]}"}) ;;
    esac
    [ ${#list[@]} -gt 0 ] || continue
    echo "  $label (${#list[@]}):"
    printf '    - %s\n' "${list[@]}"
  done
}

# gh with two retries; GitHub's API sometimes fails for a moment.
gh_retry() {
  local n=0
  until gh "$@"; do
    n=$((n + 1))
    [ $n -lt 3 ] || return 1
    echo "  (retrying: gh $1 $2 …)" >&2
    sleep $((n * 2))
  done
}
# A change: printed in a dry run, made (with retries) otherwise.
change() { if [ -n "$DRY" ]; then return 0; fi; gh_retry "$@" >/dev/null; }

# --- Preflight: everything is checked before anything changes ---
command -v gh >/dev/null || { echo "The GitHub CLI (gh) is required: https://cli.github.com" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Sign in first: gh auth login" >&2; exit 1; }
[ -n "$REPO" ] || REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null) || {
  echo "No GitHub repository found for this folder. Add a remote, or pass --repo owner/name." >&2; exit 1; }
OWNER="${REPO%%/*}"
SCOPES=$(gh_retry api -i user 2>/dev/null | tr -d '\r' | awk -F': ' 'tolower($1) == "x-oauth-scopes" { print $2 }')
need_scope() {
  # Fine-grained tokens and GitHub App tokens send no scope list; let GitHub decide then.
  [ -z "$SCOPES" ] && return 0
  grep -qw "$1" <<< "$SCOPES" || {
    echo "Your gh login lacks the '$1' scope. Run: gh auth refresh -h github.com -s $1" >&2; exit 1; }
}
need_scope repo
[ -z "$PROJECT$PROJECT_FROM" ] || need_scope project
REPO_INFO=$(gh_retry api "repos/$REPO" --jq '"\(.permissions.admin) \(.default_branch)"') || {
  echo "Can't read $REPO. Check the name and your access." >&2; exit 1; }
IS_ADMIN="${REPO_INFO%% *}"
BRANCH="${REPO_INFO#* }"
if [ -n "$DO_RULESET$DO_REPO_SETTINGS" ] && [ "$IS_ADMIN" != "true" ]; then
  echo "The ruleset and repository settings need admin rights on $REPO, which this login doesn't have." >&2; exit 1
fi
if [ -n "$REQUIRED_CHECK" ]; then
  IFS=',' read -ra CHECKS <<< "$REQUIRED_CHECK"
  for c in "${CHECKS[@]}"; do
    [[ "$c" =~ ^[A-Za-z0-9_.:/\ -]+$ ]] || { echo "Invalid check name: '$c'" >&2; exit 2; }
  done
fi

# Journeys from docs/FEATURES.md (J-01, …), for the Journey field or journey:* labels.
JOURNEY_IDS=""
[ -f docs/FEATURES.md ] && JOURNEY_IDS=$(awk -F'|' '
  /^## /{ inside = ($0 ~ /^## Journeys/); next }
  inside && /^\| J-[0-9]+ / { id = $2; gsub(/^[ \t]+|[ \t]+$/, "", id); print id }
' docs/FEATURES.md | paste -sd, -)
echo "Repository: $REPO (default branch $BRANCH)${DRY:+ — dry run, nothing will change}"

# --- Project: copy a template Project if asked, then link the repository ---
if [ -n "$PROJECT_FROM" ]; then
  TITLE="${REPO#*/}"
  if [ -n "$DRY" ]; then
    CREATED+=("Project \"$TITLE\" (copy of Project $PROJECT_FROM)"); PROJECT="(new)"
  else
    PROJECT=$(gh_retry project copy "$PROJECT_FROM" --source-owner "$OWNER" --target-owner "$OWNER" --title "$TITLE" --format json --jq .number)
    CREATED+=("Project #$PROJECT \"$TITLE\" (copy of Project $PROJECT_FROM)")
  fi
fi
if [ -n "$PROJECT" ] && [ "$PROJECT" != "(new)" ]; then
  LINKED=$(gh_retry api graphql -f query='query($o:String!,$n:Int!){repositoryOwner(login:$o){... on ProjectV2Owner{projectV2(number:$n){repositories(first:100){nodes{nameWithOwner}}}}}}' \
    -f o="$OWNER" -F n="$PROJECT" --jq '.data.repositoryOwner.projectV2.repositories.nodes[].nameWithOwner' 2>/dev/null || true)
  # Case-insensitive match in bash: grep -i -F can crash in Git Bash on Windows.
  if [[ $'
'"${LINKED,,}"$'
' == *$'
'"${REPO,,}"$'
'* ]]; then
    SKIPPED+=("Project #$PROJECT already linked to $REPO")
  else
    change project link "$PROJECT" --owner "$OWNER" --repo "$REPO"
    CREATED+=("Link from Project #$PROJECT to $REPO")
  fi
elif [ "$PROJECT" = "(new)" ]; then
  CREATED+=("Link from the new Project to $REPO")
fi

# --- Labels ---
if [ -n "$DO_LABELS" ]; then
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
  [ ${#APP_LABELS[@]} -gt 0 ] || MANUAL+=("No apps given (--apps) and no folders in apps/: re-run with --apps to create app:<name> labels")

  # name|color|description
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
    "app:packages|5319e7|Shared code (packages/)"
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
    "risk:high|b60205|Set by the risk gate: a human approves the merge"
    "risk:medium|fbca04|Set by the risk gate: may merge after an independent agent review"
    "risk:low|0e8a16|Set by the risk gate: may merge after an agent review"
    "human:merge-ok|0e8a16|Only a human adds this: approves merging the head commit"
    "agent:reviewed|c5def5|An agent reviewed the head commit (re-runs the risk gate)"
  )
  [ ${#APP_LABELS[@]} -gt 0 ] && LABELS+=("${APP_LABELS[@]}")
  # Without a Project, workflow state lives in labels (docs/GITHUB.md, "Without a Project").
  if [ -z "$PROJECT$PROJECT_FROM" ]; then
    LABELS+=(
      "status:todo|ededed|Ready to be picked up once approved"
      "status:in-progress|fbca04|Being worked on"
      "status:in-review|0e8a16|PR open for review"
      "status:blocked|b60205|Waiting on something; see the latest comment"
      "human:approved|0e8a16|A human approved this issue for work"
      "human:changes-requested|d93f0b|A human asked for changes"
      "ai:ready|c5def5|Specified well enough for an agent to start"
      "journey:Platform|bfdadc|Work outside any journey (setup, chores, cross-cutting)"
    )
    IFS=',' read -ra JIDS <<< "$JOURNEY_IDS"
    for j in ${JIDS[@]+"${JIDS[@]}"}; do LABELS+=("journey:$j|bfdadc|Part of journey $j (docs/FEATURES.md)"); done
  fi
  EXISTING=$(gh_retry label list --repo "$REPO" --limit 500 --json name,color,description --jq '.[] | "\(.name)|\(.color)|\(.description)"')
  for entry in "${LABELS[@]}"; do
    IFS='|' read -r name color desc <<< "$entry"
    current=""
    while IFS= read -r line; do
      if [ "${line%%|*}" = "$name" ] || [ "${line%%|*}" = "${name,,}" ]; then current="$line"; break; fi
    done <<< "$EXISTING"
    if [ -z "$current" ]; then
      change label create "$name" --repo "$REPO" --color "$color" --description "$desc"
      CREATED+=("label $name")
    elif [ "${current,,}" != "${entry,,}" ]; then
      change label create "$name" --repo "$REPO" --color "$color" --description "$desc" --force
      UPDATED+=("label $name")
    else
      SKIPPED+=("label $name")
    fi
  done
fi

# --- GitHub's default labels ---
if [ -n "$DO_REMOVE_DEFAULTS" ]; then
  DEFAULTS=("bug" "documentation" "duplicate" "enhancement" "good first issue" "help wanted" "invalid" "question" "wontfix" "accessibility")
  HAVE=$(gh_retry label list --repo "$REPO" --limit 500 --json name --jq '.[].name')
  for name in "${DEFAULTS[@]}"; do
    grep -qxF "$name" <<< "$HAVE" || continue
    used=$(gh_retry api -X GET "repos/$REPO/issues" -f labels="$name" -f state=all -f per_page=1 --jq length)
    if [ "$used" != "0" ]; then
      SKIPPED+=("default label \"$name\" (used by issues or pull requests; relabel them, then delete it)")
    else
      change label delete "$name" --repo "$REPO" --yes
      UPDATED+=("removed default label \"$name\"")
    fi
  done
fi

# --- Milestones: the Milestones table in docs/ROADMAP.md ---
# Each milestone's description is its outcome plus the journeys it delivers (Journeys
# column), named from docs/FEATURES.md, so the GitHub milestone page shows what it covers.
if [ -n "$DO_MILESTONES" ]; then
  # title<TAB>outcome<TAB>journeys, one line per milestone row.
  MS_ROWS=$(awk -F'|' '
    /^## /{ inside = ($0 ~ /^## Milestones/); header = 0; next }
    !inside || !/^\|/ { next }
    !header { for (i = 2; i < NF; i++) { h = $i; gsub(/^[ \t]+|[ \t]+$/, "", h); col[h] = i } header = 1; next }
    { t = $2; gsub(/^[ \t]+|[ \t]+$/, "", t); if (t !~ /^M[0-9]+ - /) next
      o = ("Outcome" in col) ? $(col["Outcome"]) : ""; j = ("Journeys" in col) ? $(col["Journeys"]) : ""
      gsub(/^[ \t]+|[ \t]+$/, "", o); gsub(/^[ \t]+|[ \t]+$/, "", j)
      print t "\t" o "\t" j }
  ' docs/ROADMAP.md)
  # J-01<TAB>Name, from the Journeys table in docs/FEATURES.md.
  JOURNEY_NAMES=""
  [ -f docs/FEATURES.md ] && JOURNEY_NAMES=$(awk -F'|' '
    /^## /{ inside = ($0 ~ /^## Journeys/); next }
    inside && /^\| J-[0-9]+ / { id = $2; n = $3; gsub(/^[ \t]+|[ \t]+$/, "", id); gsub(/^[ \t]+|[ \t]+$/, "", n); print id "\t" n }
  ' docs/FEATURES.md)
  journey_name() { awk -F'\t' -v id="$1" '$1 == id { print $2; exit }' <<< "$JOURNEY_NAMES"; }

  [ -n "$MS_ROWS" ] || MANUAL+=("No milestones found in docs/ROADMAP.md")
  HAVE_MS=$(gh_retry api "repos/$REPO/milestones?state=all&per_page=100" --paginate --jq '.[] | "\(.number)\t\(.title)\t\(.description // "")"')
  while IFS=$'\t' read -r title outcome journeys; do
    [ -n "$title" ] || continue
    if [[ "$title" == *\{\{* ]]; then MANUAL+=("Milestone not created, its name is still a placeholder: $title"); continue; fi
    desc="$outcome"
    [[ "$desc" == *\{\{* || "$desc" == "—" ]] && desc=""
    if [[ -n "$journeys" && "$journeys" != *\{\{* && "$journeys" != "—" ]]; then
      list=""
      for id in $(grep -oE 'J-[0-9]+' <<< "$journeys"); do
        n=$(journey_name "$id"); list="${list:+$list, }$id${n:+ $n}"
      done
      [ -n "$list" ] && desc="${desc:+$desc. }Journeys: $list."
    fi
    existing=$(awk -F'\t' -v t="$title" '$2 == t { print; exit }' <<< "$HAVE_MS")
    if [ -z "$existing" ]; then
      change api -X POST "repos/$REPO/milestones" -f title="$title" -f description="$desc"
      CREATED+=("milestone $title")
    elif [ "$(cut -f3- <<< "$existing")" != "$desc" ]; then
      change api -X PATCH "repos/$REPO/milestones/$(cut -f1 <<< "$existing")" -f description="$desc"
      UPDATED+=("milestone $title (description: ${desc:-empty})")
    else
      SKIPPED+=("milestone $title")
    fi
  done <<< "$MS_ROWS"
  # Milestones on GitHub that ROADMAP.md no longer lists (renamed or removed there).
  while IFS=$'\t' read -r num title _; do
    [ -n "$title" ] || continue
    cut -f1 <<< "$MS_ROWS" | grep -qxF "$title" && continue
    MANUAL+=("Milestone \"$title\" (#$num) isn't in docs/ROADMAP.md: move its issues to the right milestone, then close or delete it")
  done <<< "$HAVE_MS"
fi

# --- Project fields ---
if [ -n "$PROJECT$PROJECT_FROM" ]; then
  FIELDS=(
    "Priority|Critical,High,Medium,Low"
    "Complexity|Small,Medium,Large"
    "Human Review|Required,Approved,Changes Requested"
    "AI Ready|No,Yes"
    "Journey|${JOURNEY_IDS:+$JOURNEY_IDS,}Platform"
  )
  if [ "$PROJECT" = "(new)" ]; then
    SKIPPED+=("Project fields: checked after the copy is made (a copy keeps the template Project's fields)")
  else
    HAVE_FIELDS=$(gh_retry project field-list "$PROJECT" --owner "$OWNER" --format json --jq '.fields[].name')
    for entry in "${FIELDS[@]}"; do
      IFS='|' read -r name options <<< "$entry"
      if grep -qxF "$name" <<< "$HAVE_FIELDS"; then
        HAVE_OPTS=$(gh_retry project field-list "$PROJECT" --owner "$OWNER" --format json --jq ".fields[] | select(.name == \"$name\") | .options[].name")
        MISSING_OPTS=()
        IFS=',' read -ra WANT_OPTS <<< "$options"
        for o in "${WANT_OPTS[@]}"; do grep -qxF "$o" <<< "$HAVE_OPTS" || MISSING_OPTS+=("$o"); done
        if [ ${#MISSING_OPTS[@]} -gt 0 ]; then
          # Replacing a field's options through the API clears them on existing items.
          MANUAL+=("Project #$PROJECT: add the option(s) ${MISSING_OPTS[*]} to the $name field (Project settings → $name)")
        else
          SKIPPED+=("Project field $name")
        fi
      else
        change project field-create "$PROJECT" --owner "$OWNER" --name "$name" --data-type SINGLE_SELECT --single-select-options "$options"
        CREATED+=("Project field $name")
      fi
    done
    # Approval: a text field scripts/agent writes ("<journey> <hash> <by>"), so checking
    # approvals takes one query instead of reading every issue's comments.
    if grep -qxF "Approval" <<< "$HAVE_FIELDS"; then
      SKIPPED+=("Project field Approval")
    else
      change project field-create "$PROJECT" --owner "$OWNER" --name "Approval" --data-type TEXT
      CREATED+=("Project field Approval")
    fi
    # Status needs Todo, In Progress, In Review, Blocked and Done (docs/GITHUB.md). The API
    # replaces the whole option list, which would clear the Status of existing items, so
    # missing options are added only while the Project has no items.
    STATUS_INFO=$(gh_retry project field-list "$PROJECT" --owner "$OWNER" --format json --jq '.fields[] | select(.name == "Status") | .id, (.options[].name)')
    STATUS_ID=$(head -n1 <<< "$STATUS_INFO")
    STATUS_OPTIONS=$(tail -n +2 <<< "$STATUS_INFO")
    MISSING=()
    for opt in "In Review" "Blocked"; do grep -qxF "$opt" <<< "$STATUS_OPTIONS" || MISSING+=("$opt"); done
    if [ ${#MISSING[@]} -gt 0 ]; then
      ITEMS=$(gh_retry project view "$PROJECT" --owner "$OWNER" --format json --jq '.items.totalCount')
      if [ "$ITEMS" = "0" ] && [ -n "$STATUS_ID" ]; then
        OPTS='{name:"Todo",color:GRAY,description:"Ready to be picked up once approved"},{name:"In Progress",color:YELLOW,description:"Being worked on"},{name:"In Review",color:BLUE,description:"PR open for review"},{name:"Blocked",color:RED,description:"Waiting on something; see the latest comment"},{name:"Done",color:GREEN,description:"Merged or closed"}'
        change api graphql -f query="mutation(\$f:ID!){updateProjectV2Field(input:{fieldId:\$f,singleSelectOptions:[$OPTS]}){projectV2Field{... on ProjectV2SingleSelectField{id}}}}" -f f="$STATUS_ID"
        UPDATED+=("Project #$PROJECT Status options: Todo, In Progress, In Review, Blocked, Done")
      else
        for opt in "${MISSING[@]}"; do
          MANUAL+=("Project #$PROJECT: add the \"$opt\" option to the Status field (Project settings → Status); not done automatically because the Project already has items")
        done
      fi
    else
      SKIPPED+=("Project #$PROJECT Status options")
    fi
  fi
fi

# --- Branch ruleset ---
if [ -n "$DO_RULESET" ]; then
  ID=$(gh_retry api "repos/$REPO/rulesets" --jq '.[] | select(.name=="main-guard") | .id')
  if [ -z "$APPROVALS" ]; then
    APPROVALS=1
    if [ -n "$ID" ]; then
      KEEP=$(gh_retry api "repos/$REPO/rulesets/$ID" --jq '.rules[] | select(.type=="pull_request") | .parameters.required_approving_review_count')
      [ -n "$KEEP" ] && APPROVALS="$KEEP"
    fi
  fi
  # Keep whoever may bypass an existing ruleset (e.g. the owner); a new one has no bypass list.
  BYPASS="[]"
  [ -z "$ID" ] || BYPASS=$(gh_retry api "repos/$REPO/rulesets/$ID" --jq '.bypass_actors // [] | tojson')
  CHECK_RULE=""
  if [ -n "$REQUIRED_CHECK" ]; then
    CONTEXTS=""
    for c in "${CHECKS[@]}"; do CONTEXTS="${CONTEXTS:+$CONTEXTS,}{\"context\":\"$c\"}"; done
    CHECK_RULE=$(printf ',{"type":"required_status_checks","parameters":{"strict_required_status_checks_policy":false,"required_status_checks":[%s]}}' "$CONTEXTS")
  fi
  BODY=$(printf '{"name":"main-guard","target":"branch","enforcement":"active","bypass_actors":%s,"conditions":{"ref_name":{"include":["refs/heads/%s"],"exclude":[]}},"rules":[{"type":"deletion"},{"type":"non_fast_forward"},{"type":"pull_request","parameters":{"required_approving_review_count":%s,"dismiss_stale_reviews_on_push":false,"require_code_owner_review":false,"require_last_push_approval":false,"required_review_thread_resolution":false}}%s]}' "$BYPASS" "$BRANCH" "$APPROVALS" "$CHECK_RULE")
  WHAT="ruleset main-guard on $BRANCH ($APPROVALS approvals${REQUIRED_CHECK:+, requires $REQUIRED_CHECK})"
  if [ -n "$ID" ]; then
    [ -n "$DRY" ] || gh_retry api -X PUT "repos/$REPO/rulesets/$ID" --input - <<< "$BODY" >/dev/null
    UPDATED+=("$WHAT")
  else
    [ -n "$DRY" ] || gh_retry api -X POST "repos/$REPO/rulesets" --input - <<< "$BODY" >/dev/null
    CREATED+=("$WHAT")
  fi
  [ -n "$REQUIRED_CHECK" ] || MANUAL+=("Once CI and the risk gate have run on a pull request: bash scripts/setup-github.sh --required-check ci-ok,risk-gate")
fi

# --- Repository settings: auto-merge allowed, head branches deleted after merge ---
if [ -n "$DO_REPO_SETTINGS" ]; then
  HAVE_SETTINGS=$(gh_retry api "repos/$REPO" --jq '"\(.allow_auto_merge) \(.delete_branch_on_merge)"')
  if [ "$HAVE_SETTINGS" = "true true" ]; then
    SKIPPED+=("repository settings (auto-merge allowed, head branches deleted)")
  else
    change repo edit "$REPO" --enable-auto-merge --delete-branch-on-merge
    UPDATED+=("repository settings: allow auto-merge, delete head branches after merge")
  fi
fi
if [ -n "$PROJECT$PROJECT_FROM" ]; then
  MANUAL+=("Project #${PROJECT}: turn on the built-in workflows (Auto-add to project with is:pr is:open, Item closed → Done, Pull request merged → Done, Item added → Todo) in Project → Workflows")
  MANUAL+=("Project #${PROJECT}: add the \"Needs me\" and \"Awaiting approval\" views (docs/GITHUB.md, \"Needs me\" view)")
fi

MANUAL+=("Project \"New issue default\" values (docs/GITHUB.md) aren't enforced by GitHub; agents set them when creating issues")
summary
