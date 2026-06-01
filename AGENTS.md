# Agent instructions (tennis-club-crm)

This repository defines **one primary standard** for AI-assisted development. All agents (Cursor, Claude Code, etc.) should follow it by default.

## Primary rule (always on)

| Asset | Path | Role |
|-------|------|------|
| **Cursor rule** | [`.cursor/rules/00-primary-guidelines.mdc`](.cursor/rules/00-primary-guidelines.mdc) | `alwaysApply: true` — loaded every session |
| **Project skill** | [`.cursor/skills/karpathy-guidelines/SKILL.md`](.cursor/skills/karpathy-guidelines/SKILL.md) | Same principles; shared with the team via git |

The `00-` prefix keeps this rule first among project rules.

## Four principles (summary)

1. **Think before coding** — State assumptions; ask when ambiguous; push back if a simpler path exists.
2. **Simplicity first** — Minimum code for the request; no speculative abstractions or features.
3. **Surgical changes** — Only touch what the task requires; match existing style; don't drive-by refactor.
4. **Goal-driven execution** — Define verifiable success (tests, checks); plan steps with explicit verification.

Full text lives in the rule and skill files above.

## Precedence

1. User's explicit instruction for the current task  
2. **This document + `00-primary-guidelines.mdc`**  
3. Other project rules (if added later)  
4. Generic model defaults  

## Source & updates

Based on [andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills). When updating principles, keep **AGENTS.md**, **00-primary-guidelines.mdc**, and **karpathy-guidelines/SKILL.md** in sync.

## For contributors

- Open this repo in Cursor → confirm **Settings → Rules** shows `00-primary-guidelines`.
- Do not add a second `alwaysApply: true` rule for the same guidelines (duplicates waste context).
- Optional personal copy under `~/.cursor/skills/` is redundant if you work only in this repo.
