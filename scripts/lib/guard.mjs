// Human-only actions that agents must not take (AGENTS.md, Boundaries; docs/GITHUB.md,
// "Guard rails"). Used by the Claude Code pre-tool hook (.claude/hooks/guard.mjs).
//
// Agents run with the owner's GitHub login and keys, so GitHub can't tell them apart from
// the owner. These rules stop mistakes; they don't stop someone determined to get round them.

/** [pattern, reason] for shell commands. Each is tested against every command in a chain. */
const COMMAND_RULES = [
  [
    /\bgh\b.*\spr\s+merge\b/,
    'merging is a human decision (low-risk PRs merge through the risk gate)',
  ],
  [/\bgh\s+api\b.*\/pulls\/\d+\/merge\b/, 'merging is a human decision'],
  [
    /\bgh\b.*\spr\s+review\b.*(\s--approve\b|\s-a\b)/,
    'approving a PR is a human action; post a comment review with "Verdict: …"',
  ],
  [
    /\bgh\s+(issue|pr)\s+(create|edit)\b.*(--add-label|--label|-l)[\s=]+["']?[^"'\s]*\bhuman:/,
    'human:* labels are added only by a human',
  ],
  [/\bgh\s+api\b.*\/labels\b.*\bhuman:/, 'human:* labels are added only by a human'],
  [
    /\bscripts[\\/]agent(\.mjs)?["']?\s+approve-(journey|milestone)\b/,
    'approving journeys and milestones is a human action',
  ],
  [
    /\bgit\s+push\b.*(\s|:|\/)(main|master)(\s|$)/,
    'never push to the default branch; open a pull request',
  ],
  [
    /\bgit\s+push\b.*\s(--force(-with-lease)?(=\S*)?|-f|--mirror|--delete|-d)(\s|$)/,
    'never force-push or delete remote branches',
  ],
  [/\bgit\s+push\b.*\s\+\S/, 'never force-push'],
  [/\bgit\s+push\b.*\s--tags\b/, 'tags are pushed by a human release step'],
  [/\bgit\s+tag\b(?!\s+(-l|--list)\b)\s+\S/, 'tags are created by a human release step'],
  [/\bgh\s+release\s+(create|delete|edit|upload)\b/, 'releases are a human step'],
  [/\bgh\s+workflow\s+run\b/, 'workflows are triggered by a human (releases, deployments)'],
  [
    /\b(tofu|terraform)\b.*\s(apply|import|destroy)\b/,
    'infrastructure changes need explicit human authorization',
  ],
  [
    /\bgh\s+project\s+item-edit\b/,
    'Project fields (Status, Human Review, Approval) are set by scripts/agent, not by hand',
  ],
  [
    /\bgh\s+api\s+graphql\b.*updateProjectV2ItemFieldValue/,
    'Project fields are set by scripts/agent, not by hand',
  ],
  [
    /\bgh\s+(issue|pr)\s+comment\b.*agent:approval/,
    'approval records are written only by scripts/agent (approve-journey, or the approved-documents rule)',
  ],
  // Running it (the command starts with it, or with bash/sh and it), not naming it in grep or git diff.
  [
    /^(\S*=\S*\s+)*((ba)?sh\s+)?\S*setup-github\.sh\b(?!.*--dry-run)/,
    'setup-github.sh changes GitHub; run it with --dry-run, or ask the owner',
  ],
  [
    /(^|[\s'"=\/\\<>])\.env(\.(?!example\b)[\w.-]+)?(?=$|[\s'"|;&)<>])/,
    'secrets: .env files are not read or written by agents (.env.example is fine)',
  ],
]

/** Splits a shell line into its commands (&&, ||, ;, |, newlines), keeping quoted text intact enough for matching. */
export function commands(line) {
  return line
    .split(/\r?\n|&&|\|\||;|\|/)
    .map((c) => c.trim())
    .filter(Boolean)
}

/** Why a shell command is blocked, or null. */
export function checkCommand(line) {
  for (const cmd of commands(line ?? '')) {
    for (const [re, why] of COMMAND_RULES)
      if (re.test(cmd)) return `${why} (blocked: ${cmd.slice(0, 120)})`
  }
  return null
}

/** Why opening a file is blocked, or null: .env files other than .env.example. */
export function checkPath(path) {
  const base = (path ?? '').split(/[\\/]/).pop()
  return /^\.env(\..+)?$/.test(base) && base !== '.env.example'
    ? `secrets: ${base} is not read or written by agents`
    : null
}

/** Decision for a Claude Code tool call: a reason to block it, or null to let it run. */
export function checkToolCall(toolName, input = {}) {
  if (toolName === 'Bash' || toolName === 'PowerShell') return checkCommand(input.command)
  if (['Read', 'Edit', 'Write', 'NotebookEdit'].includes(toolName))
    return checkPath(input.file_path ?? input.notebook_path)
  return null
}
