# Audit progress

**Read this first if you are a fresh session resuming the audit.** Then read the file named under "Read next".

Branch: `claude/friendly-faraday-xzolrt` (the branch this session was assigned; Karl asked for `audit`; see question Q1 in `04-inferences.md`). Main and the live site are untouched. Only `docs/audit/` has been written.

Baseline when the audit started (commit `17835f7`): `npm test` 63 files, 931 tests, all pass; `npm run build` succeeds.

## Status

| Phase | File | State |
|---|---|---|
| 0 Read the design docs | (notes in 01) | Done. Note: there is no `docs/design/` or `docs/handoff/`; every spec is at the repo root. |
| 1 Inventory | `01-inventory.md` | Done (first pass) |
| 2 Shared-components registry | `02-registry.md` | Done (first pass) |
| 3 Conformance report + progress-loss trace | `03-conformance.md` | Done (first pass) |
| 4 Inferences | `04-inferences.md` | Batch 1 answered (with follow-ups); batch 2 asked in chat |
| 5 Alignment suggestions | `05-alignment.md` | Draft; recommendations may change with the Phase 4 answers |
| 6 Refactor plan | `06-refactor-plan.md` | Draft; same caveat |
| 7 CLAUDE.md | `CLAUDE.md.draft` | Not started; needs Karl's approval of 02 and 06 first |

## Reminder for Claude
At the end of this chat, remind Karl to paste this file (`docs/audit/PROGRESS.md`) as the first message of the new chat.

## New request from Karl (2026-10-12)
Prompt sign-in at every visit, before play; on sign-in the more advanced progress wins, never less over more. "Not now" allowed but nudged; returning students signed in silently. Folded into R1 in `06-refactor-plan.md`.

## Read next
1. `04-inferences.md`: the open questions. If Karl has answered, record the answers there, then revise 05 and 06 to match.
2. `03-conformance.md`: the findings most likely to matter to students now.

## Not covered yet (honest gaps)
- Count it and Build it card internals were surveyed (structure, entry points, screenshots), not read line by line.
- The fit test was run on first-state screens only (scripts in the session scratchpad, not committed). The 9-row worst case on Divide it was not driven by script.
- The Google side of the sync (the deployed Apps Script and the real sheet) cannot be seen from the repo.
- The printed notes PDFs are not in the repo.
