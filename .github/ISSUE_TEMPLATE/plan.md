---
name: Journey plan
about: The parent issue for one journey's tasks in a milestone, holding its wave contract (written by scripts/agent plan)
title: "[Plan] M_ J-__: "
labels: "ai:planned"
---
## Journey and milestone
<!-- J-__ <name> (docs/FEATURES.md, Journeys), or Platform; and the milestone, e.g. M1 -->

## Outcome
<!-- What the user can do when every task here is done: the journey's goal -->

## Features and requirements
<!-- The FT and FR IDs this plan covers, and any of the journey's features left for later, with the reason -->

## Tasks
<!-- By wave: "- Wave 1 (in parallel): #123 TASK-___ <title> (app); …". They are sub-issues of this issue. -->

## Wave contract
<!-- The shared interfaces several tasks build on (API endpoints and fields, events, shared components), agreed before the tasks start (docs/ROADMAP.md). "None" if the tasks don't share one. -->

## Open questions
<!-- Decisions the owner must make before the work starts, or "None". Anything here makes the journey wait for the owner's approval. -->

## Approval
Approved documents approve the journey's tasks when it has no open questions; otherwise the owner runs `scripts/agent approve-journey J-__` (docs/GITHUB.md, Journey approval). Approval is recorded on each task, not in this body.
