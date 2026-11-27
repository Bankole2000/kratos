# GitHub Management Specification

Status: In review | Owner: @Bankole2000 | Version: 1.3 | Last updated: 2026-11-27
<!-- review:focus "Approved documents approve", "Medium risk", "auto-merge", "Running agents", "Milestone plans" -->

## Configuration
- Repository: Bankole2000/kratos (public)
- Project: #3 "Kratos" (owned by @Bankole2000), with the fields below
- Default branch: main
- Configure branch protection: require PRs, require the `ci-ok` status check only (it summarizes the per-app CI jobs, which are skipped when their app is unchanged), and require review from code owners (`.github/CODEOWNERS`). Use least-privilege credentials. Never store tokens in this file.
- `bash scripts/setup-github.sh --project 3 --milestones` keeps the Project fields and the milestones (with their journeys as descriptions) in step with this document and ROADMAP.md; `--labels --apps api,web,app` does the labels, and `--dry-run` shows what would change. Run it after milestones change in ROADMAP.md.

## Project fields
| Field | Values | New issue default |
|---|---|---|
| Status | Todo, In Progress, In Review, Blocked, Done | Todo |
| Priority | Critical, High, Medium, Low | Medium |
| Complexity | Small, Medium, Large | Set by planner |
| Human Review | Required, Approved, Changes Requested | Required |
| AI Ready | No, Yes | No |
| Journey | J-01 … (docs/FEATURES.md, Journeys), Platform | Set by planner (`scripts/agent plan`) |
| Approval | Text: `<journey> <fingerprint> <owner or docs>`, written by `scripts/agent` | Empty |

Human Review and AI Ready are separate: AI Ready indicates sufficient detail; Human Review says the work is approved, by the owner or by documents the owner approved (see [Journey approval](#journey-approval)). The Approval field records which approval holds, so the scripts check every issue in one query. Material scope changes invalidate approval. Do not use labels that duplicate these fields.

### Without a Project
If the repository has no GitHub Project, the same states are kept in labels, which `setup-github.sh` creates when it runs without `--project`. Every rule in this document and AGENTS.md then reads as follows, and Priority and Complexity go in the issue body.

| Project field | Label instead |
|---|---|
| Status Todo, In Progress, In Review, Blocked | `status:todo`, `status:in-progress`, `status:in-review`, `status:blocked` (exactly one; Done = issue closed) |
| Human Review Approved, Changes Requested | `human:approved`, `human:changes-requested` (only a human adds these; none = Required) |
| AI Ready Yes | `ai:ready` (none = No) |
| Journey | `journey:J-01` …, `journey:Platform` (exactly one) |

### Priority
PRD requirements use MoSCoW (Must, Should, Could, Won't) to define scope. Issue Priority orders the work. Default mapping, which the planner may adjust with a stated reason:

| PRD | Issue Priority |
|---|---|
| Must | High (Critical if it blocks other work or users) |
| Should | Medium |
| Could | Low |
| Won't | Not planned; stays out of scope |

## Milestones
Milestones are defined in [ROADMAP.md](ROADMAP.md#milestones). GitHub milestone titles must match them exactly.

## Labels
Use exactly one `type:` label, the `app:` label of each app the issue changes (normally one; see [Multi-app work](#multi-app-work)), `area:` labels where relevant, and optional flags. `app:` says which deployable changes; `area:` says which concern within it. Add project-specific areas only when needed. Labels never duplicate Project fields.

### Type
- `type:feature` — New capability
- `type:bug` — Incorrect behavior
- `type:enhancement` — Improve existing behavior
- `type:refactor` — Internal restructuring
- `type:documentation` — Documentation
- `type:test` — Tests
- `type:chore` — Maintenance
- `type:research` — Investigation
- `type:design` — Design work
- `type:security` — Security work
- `type:performance` — Performance work

### App
One per app in `apps/`, plus labels for shared code, SDKs, infrastructure and repository-wide work. Names match the folder names. `apps/mcp` gets `app:mcp` when it is created in v2.
- `app:api`, `app:web`, `app:app` — Work in that app. Changes to `openapi/` belong to `app:api`, which generates it.
- `app:packages` — Shared code in `packages/`
- `app:sdks` — Published SDKs in `sdks/`; name the SDK in the issue title, e.g. `[Task] TASK-040: sdk-ts batching`
- `app:infra` — Infrastructure-as-code in `infra/`
- `app:repo` — Repository-wide work (CI, tooling, docs)

### Area
- `area:frontend`, `area:backend`, `area:mobile`, `area:desktop`, `area:database`, `area:api`, `area:auth`, `area:integrations`, `area:infrastructure`, `area:devops`

### Flags
- `ai:planned` — Created by planning agent
- `needs:human-input` — Agent is waiting on a human answer
- `needs:specification` — Missing requirements
- `needs:decision` — Unresolved decision
- `review:security`, `review:privacy`, `review:legal`, `review:medical`, `review:financial` — Specialist review required before approval or merge
- `impact:breaking` — Compatibility impact

### Merge state
- `risk:high`, `risk:medium`, `risk:low` — Set by the risk gate on every run, never by hand
- `human:merge-ok` — Only a human adds it: approves merging the head commit. The risk gate removes it when new commits are pushed
- `agent:reviewed` — Added by `scripts/agent review` after it posts a review; adding it re-runs the risk gate. Removed when new commits are pushed


## Issue CRUD and planning
- Read approved specs and existing issues first; use stable task keys to prevent duplicates.
- Create or update only authorized issues; preserve human comments and history. Use native parent/sub-issue and dependency relationships where available, otherwise link issue numbers in the body.
- Create and update issues with `scripts/agent plan --file <plan.json>` (see [Agent workflow](#agent-workflow)). It checks the whole plan before writing anything, then sets milestone and labels, adds each issue to the Project, sets Todo, Human Review Required, Journey, Priority and Complexity, and sets AI Ready from the definition-of-ready check. It also links parents (sub-issues) and dependencies (GitHub issue dependencies, "blocked by"). Re-running a plan updates issues by task key instead of duplicating them. Report any failed step; do not claim success on partial writes.
- Each task belongs to one journey: the journey of its features in docs/FEATURES.md. Work that belongs to no journey (repository tooling, infrastructure, cross-cutting work) is **Platform** work in its milestone; repo and infra tasks without features write "Platform" in place of the FT, FR and TC IDs. A task whose features span journeys is split.
- Approval never comes from the planner: approved documents or the owner approve (see [Journey approval](#journey-approval)).

### Milestone plans
Plan a whole milestone in one file, so its tasks can start together:

```json
{ "milestone": "M1",
  "journeys": { "J-12": { "outcome": "…", "contract": "Endpoints and fields other tasks rely on", "questions": "None",
                          "deferred": { "FT-031": "why it waits" } },
                "Platform": { "outcome": "…", "contract": "None", "questions": "None" } },
  "tasks": [ { "key": "TASK-010", "title": "…", "body": "<task template>", "priority": "High",
               "complexity": "Small", "blockedBy": ["TASK-009", 42], "labels": ["type:feature", "app:api"] } ] }
```

`scripts/agent plan --file m1.json --dry-run` checks it and writes nothing: every task against the template and the spec documents, every approved feature of each journey covered by a task or deferred with a reason, dependencies known and without cycles, and the milestone's ROADMAP.md journeys all present (a warning). It prints the **waves**: wave 1 has no dependencies inside the plan, wave 2 depends only on wave 1, and so on; a wave's tasks run in parallel. Without `--dry-run` it creates or updates the tasks and one plan issue per journey, `[Plan] M1 J-12: <name>` (`.github/ISSUE_TEMPLATE/plan.md`), holding the outcome, the tasks by wave, the **wave contract** (ROADMAP.md) and open questions; the tasks become its sub-issues. Then it approves what the approved documents cover and says which journeys wait for the owner. A bare list of tasks still works, without plan issues.
- Close duplicates with a reference only when authorized; prefer closing over deletion. Never delete without explicit authorization.

## Multi-app work
- A feature that needs changes in more than one app gets a parent issue (the user-facing outcome, linked to its FT and FR IDs) with one sub-issue per app. Each sub-issue has a single `app:` label and its own acceptance criteria, and is delivered in its own PR.
- Order sub-issues with dependencies: infrastructure (`app:infra`) first, then the api (`app:api`, which regenerates the contract in `openapi/`), then shared packages (`app:packages`), then SDKs (`app:sdks`) and clients (`app:web`, `app:app`). Clients may merge behind a feature flag before the api change is released.
- The parent issue is Done when all sub-issues are Done and the end-to-end acceptance test passes.

## Journey approval
Work is approved one journey at a time, never issue by issue, in one of two ways.

**Approved documents approve scope.** While `docs/FEATURES.md` and `docs/ROADMAP.md` both have Status Approved, `scripts/agent` approves a task by itself when it uses only approved features of one journey, ROADMAP.md delivers that journey in the task's milestone, it passes the definition-of-ready check, and its journey plan has no open questions. Approving those documents in the doc reviewer is the owner's approval of the work they describe. `plan`, `ready`, `next`, `claim` and `work` apply the rule; the comment on the issue says which document versions approved it. The rule is `approval.fromApprovedDocs` in `.github/risk-rules.json`; set it to false to approve every journey by hand.

**The owner approves the rest** with `scripts/agent approve-journey J-12`, or `scripts/agent approve-journey Platform --milestone M1` for a milestone's Platform work, which the documents don't cover. `scripts/agent approve-milestone M1` does it for every journey in M1 and for its Platform work. `digest` lists what waits, with the command for each.

Either way, approving:
- approves the journey's open tasks that pass the definition-of-ready check (Human Review = Approved, AI Ready = Yes), and lists the ones it skipped and why;
- records the approval on each issue, as a comment and in the Approval field, with a fingerprint of the issue body. Ticking acceptance criteria keeps the approval; any other change to the body undoes it as soon as `next`, `claim`, `ready` or `plan` sees it. A task the documents covered is then approved again by them if it still fits the rule; otherwise it waits for the owner;
- covers only the tasks open at that moment.

`approve-journey` and `approve-milestone` are human actions: they refuse to run inside an agent session and the guard rails block them, so the owner runs them in their own terminal. `--dry-run` shows what would be approved.

## Execution lifecycle
Todo + Approved + AI Ready Yes + completed dependencies → In Progress → In Review → Done (after the merge: by a human, or through the risk gate for low-risk PRs). Early start (AGENTS.md, Execution rules 2): a task whose dependency is an open PR may go In Progress for the parts that don't need it; its PR stays a draft until the dependency is Done. Blocked can interrupt any active stage; return to Todo or In Progress as appropriate after resolution. Changes Requested returns the issue to In Progress (see AGENTS.md). Re-review material changes.

## Definition of ready
Clear objective, approved feature IDs (FEATURES.md) and requirement IDs, linked acceptance tests (TC IDs), bounded scope, testable acceptance criteria, known dependencies and resolved decisions.

## PR rules
Use the template, link the issue, report actual validation, identify risks. Use closing keywords only when the PR fully resolves the issue and targets the default branch. Open it with `scripts/agent pr`, which also reports its risk. Who merges depends on the risk (next section); verify issue closure and Project Done afterward.

## Merging and the risk gate
The `risk-gate` workflow (`.github/workflows/risk-gate.yml`) judges every pull request against `.github/risk-rules.json` and reports a `risk-gate` status on its head commit. There are three levels:
- **High risk:** the workflow and its rules (`.github/`, `.claude/`, `scripts/`, AGENTS.md and CLAUDE.md files), `infra/`, the spec documents (`docs/*.md`), money and secrets (an `apps/` path with payment, payout, refund, wallet, billing or secret in it), a migration that edits an existing file or has destructive SQL (DROP, TRUNCATE, RENAME, DELETE FROM, UPDATE … SET, ALTER COLUMN, SET NOT NULL), a breaking API contract change (removed path, operation, schema or property; newly required field or parameter), or a `review:*` or `impact:breaking` label. It passes only once a human adds `human:merge-ok`, or the human merges it themselves.
- **Medium risk:** auth, sessions, roles, permissions, passwords and tokens under `apps/`, shared `packages/` and `sdks/`, dependency manifests and lock files, `.env.example`, docker-compose, new additive migrations and additive contract changes. It passes once an agent review of the head commit says `Verdict: Approve`, written by a **different agent session** than the PR's author (`scripts/agent pr` records the author's name, `scripts/agent review` the reviewer's; set `AGENT_NAME`), with a "Scope and risk" section.
- **Low risk:** everything else. It passes once any agent review of the head commit says `Verdict: Approve`.

New commits remove `human:merge-ok` and `agent:reviewed`, so an approval never carries over to code nobody looked at. Drafts are pending.

**Auto-merge.** `scripts/agent pr` turns on auto-merge for every ready PR, but only once the default branch requires both `ci-ok` and `risk-gate` (`requiredChecks` in risk-rules.json); until then it says so and the owner merges. With both required, low- and medium-risk PRs merge by themselves when CI passes and their review approves, and a high-risk PR merges as soon as the owner adds `human:merge-ok`. Turn it on once: `bash scripts/setup-github.sh --required-check ci-ok,risk-gate`, after CI and the risk gate have each run on a pull request.

The workflow runs on `pull_request_target`: it uses the rules and code of the default branch, so a pull request can't change what judges it, and it never checks out or runs the pull request's code (it reads changed files, migrations, contracts and reviews through the API). Changing the rules is itself high risk.

## Agent workflow
Agents use `scripts/agent` (`node scripts/agent.mjs`; see the README Commands) instead of editing issue fields by hand:
- `next`: the next tasks, which are Todo, approved and unchanged since, AI Ready, unassigned and not blocked by an open issue; ordered by Priority, milestone, then age.
- `claim <issue>`: checks the same conditions, then creates the branch `<issue>-<title>` on GitHub with a push that fails if the branch already exists, then assigns the issue, comments who claimed it and sets In Progress. Agents share the owner's login, so the branch is the lock: of two agents claiming the same task, one gets it. The branch is checked out in its own worktree, `.worktrees/<branch>` (gitignored), so several agents can work in one repository at once; `--here` uses the current checkout instead. Set `AGENT_NAME` to name the agent.
- `work`: claims the best workable task (the next one if another agent wins it) and prints its brief: where to work, what to read, how to finish.
- `pr`, `block`, `ask`: open the PR (In Review unless it's a draft; auto-merge once the checks are required); set Blocked with `needs:human-input` and the reason; ask the owner a question on the issue.
- `ready`: re-runs the definition-of-ready check, sets AI Ready, approves what the approved documents cover and undoes approvals of changed issues.
- `review-next`: takes the oldest low- or medium-risk PR without a review of its head commit that this agent didn't write, locks it (an `agent-lock/review-…` branch, so two reviewers don't take the same commit), checks it out in `.worktrees/review-…` and prints the review brief.
- `review <pr> --body-file <file>`: posts a review in the Review output format (AGENTS.md) as a comment review (GitHub doesn't let a PR's author approve it, and agents post as the owner), adds the reviewer's name and `agent:reviewed` to re-run the risk gate, and releases the lock. It refuses a review by the PR's author.
- `cleanup`: removes worktrees and review locks of merged or closed work.
- `risk`: the current branch's risk, as the gate will judge it.
- `digest`: what needs the owner (next section).

## Running agents
One agent session per task keeps each session's context small, and a separate session reviews it:
- `scripts/agent loop --role work --name worker-1` repeats: claim the next task in its worktree, start a fresh agent session there with the task brief, and check that it ended with a PR or a reason (otherwise it marks the task Blocked so it isn't lost). `--role review --name reviewer-1` does the same with `review-next`. `--max N` stops after N jobs; `--wait S` keeps polling every S seconds instead of stopping when there is nothing to do.
- `scripts/agent swarm --workers 2 --reviewers 1 --wait 120` starts several loops at once. Each gets its own name, so reviewers never review their own work.
- The agent command is `claude -p --permission-mode acceptEdits` by default, with the prompt on standard input; set `--cmd` or `AGENT_CMD` for another (for example `codex exec -`). Sessions start in the worktree, so `.claude/settings.json` and its guard hook apply to them. Commands the settings don't allow are refused in a non-interactive session; add the project's build and test commands to the allow list.
- Parallel work comes from the plan's waves: tasks in one wave don't depend on each other, and the wave contract fixes the interfaces between them.

## "Needs me" view
Two Project views (Project → **+ New view** → Table; double-click the tab to rename it, type the filter, then **Save**):
- **Needs me**: `is:open label:needs:human-input,risk:high`, which shows questions, blocked tasks and high-risk PRs. A comma means either value. Different qualifiers combine with AND, so one view can't also catch a field value such as Human Review "Changes Requested". Add a third view filtered by `human-review:"Changes Requested"` if you want those listed too.
- **Awaiting approval**: `is:open is:issue human-review:Required ai-ready:Yes`, grouped by Journey (view menu ▾ → Group by → Journey). Field names in filters are lower-case with hyphens; the filter bar autocompletes them.

PRs appear in a view only if they are in the Project. Turn on the built-in **Auto-add to project** workflow with the filter `is:pr is:open`, or high-risk PRs won't show in Needs me.

`scripts/agent digest` prints the same in the terminal: PRs waiting for the owner's merge or `human:merge-ok`, questions and blocked tasks, journeys waiting for approval with the command to approve each, and work in progress.

Turn on the Project's built-in workflows (Project → Workflows): Auto-add to project (`is:pr is:open`), Item added to project → Todo, Item closed → Done, Pull request merged → Done. They keep Status right when work is closed or merged outside `scripts/agent`.

## Guard rails
Agents run in the owner's terminal with the owner's GitHub login and keys, so GitHub can't tell them apart from the owner. Human-only actions are therefore stopped locally and checked again on GitHub:
- `.claude/settings.json` denies them (merging, approving PRs, approving journeys and milestones, editing Project fields or approval records by hand, pushing to the default branch, force-pushing, tags and releases, triggering workflows, `tofu apply`/`import`/`destroy`, reading or editing `.env` files). Its pre-command hook (`.claude/hooks/guard.mjs`, rules in `scripts/lib/guard.mjs`) blocks the same actions however the command is written, and also adding `human:*` labels and running `setup-github.sh` without `--dry-run`.
- On GitHub: the ruleset (pull requests only, no force-push), the required `ci-ok` and `risk-gate` checks, and the removal of `human:merge-ok` and `agent:reviewed` on new commits.

These stop mistakes. They don't stop someone determined to get round them, who could run the same commands outside Claude Code with the same login. Treat them as safety rails, not access control. A team that needs real separation gives agents their own GitHub identity (a GitHub App or machine user) without merge rights.

## Setup verification
Confirm actual field names/options and IDs, milestone names, labels, permissions, branch rules and automation behavior before agents write. Project fields may require separate API permissions (`gh auth refresh -s project`). This document is a specification, not live GitHub configuration.

## Approval
Approved by @Bankole2000 on 2026-11-25, revision 1.0, to start building. Approved as drafted without an item-by-item review; sections are revisited when the milestone that needs them is planned, and open TBDs stay open decisions. Revision 1.2 records Project #3, feature IDs in the definition of ready and parent issues, and the setup script's current usage; it is in review. Revision 1.3 adds the agent workflow from the starter template (scripts/agent, milestone plans, approval by approved documents, the risk gate with three levels, auto-merge, parallel agents); it is in review.
