#!/usr/bin/env node
// Claude Code PreToolUse hook: blocks human-only actions (rules in scripts/lib/guard.mjs).
// Reads the tool call as JSON on stdin; exit code 2 blocks it and shows the reason to the agent.
import { checkToolCall } from '../../scripts/lib/guard.mjs'

let raw = ''
for await (const chunk of process.stdin) raw += chunk
let call
try {
  call = JSON.parse(raw || '{}')
} catch {
  process.exit(0) // Not a tool call we understand; Claude Code's own permissions still apply.
}
const reason = checkToolCall(call.tool_name, call.tool_input ?? {})
if (reason) {
  process.stderr.write(
    `Blocked by .claude/hooks/guard.mjs: ${reason}. This is a human-only action; ask the owner.\n`,
  )
  process.exit(2)
}
