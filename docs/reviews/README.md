# Document reviews

Review files written by `tools/doc-reviewer.html`, one per reviewed document per review, named `YYYY-MM-DD-<DOCUMENT>.md` (a `-2`, `-3` suffix is added for repeat reviews on the same day).

`YYYY-MM-DD-project-setup.md` holds the project facts (repository, owners, apps, conventions) and lists every file they must be applied to; the agent applies it before the document reviews.

Each document review records the reviewer, date, verdict, placeholder values and every decision, keyed by the document's own IDs (e.g. `FR-003`). Its "Review status" moves Open → Applied (or Partially applied) as the agent applies it; see AGENTS.md, "Applying doc reviews". Keep these files: they are the record of who approved what.

`scripts/check-placeholders.sh` skips this folder, because review files quote placeholders on purpose.
