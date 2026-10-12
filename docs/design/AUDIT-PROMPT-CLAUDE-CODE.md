# Project audit and map for The Mat: steps, model choice, and the prompt for Claude Code  (2026-10-12)

## Part 1. Steps for Karl

1. **Put the design documents in the repo** (a `docs/design/` folder) so Claude Code can read them: `SPEC-SOLVE-IT-LOOP.md` (rev 1.1), `SPEC-ADD-TO-BOTH-SIDES.md`, `SPEC-DIVIDE-IT.md` (rev 2.1), `SPEC-FLIP-IT.md`, `BUILD-BRIEF-DIVIDE-IT-2026-10-12-a.md`, `DECISION-LOG.md`, the Mat handoff, and the printed-notes PDFs if you have them. Also save **this file** there. (Ask Claude Code to do it if you'd rather not move files yourself.)
2. **Make sure everything built so far is saved (committed).** The prompt tells Claude Code to work on a separate branch called `audit`, so the live site is never touched.
3. **Start a fresh Claude Code session on the strongest model** (see Part 2). Don't reuse the long-running session; the whole point is a clean read.
4. **Paste the prompt in Part 3.** Phases 0 to 6 only read and write notes inside `docs/audit/`. No app code changes.
5. **Answer the check-in questions.** Claude Code will ask in small batches (five at most), with a recommended answer each. These are its inferences about how the project is meant to be structured; your answers are what the map is built on.
6. **Read three things before approving Phase 7:** `03-conformance.md` (what's built versus the specs), `05-alignment.md` (the Count it / Build it / Solve it suggestions), and the **draft** `CLAUDE.md`.
7. **Approve Phase 7.** Claude Code writes the real `CLAUDE.md` at the repo root and commits it on the branch.
8. **Start another fresh session, on a mid-tier model,** and run the **Divide it fixes** (the build brief) on top of the shared components the map identified. Then the Add to both sides update, then the next card.
9. **From now on, follow the session rules in the `CLAUDE.md` working agreements** (Part 3). Claude Code will tell you when to start fresh and when a different model is worth it.

**Expect the audit to be long.** Claude Code is told to write progress to `docs/audit/PROGRESS.md` as it goes, so if the session runs out of room you can start a fresh one and say "resume the audit from PROGRESS.md."

## Part 2. Which model

- **For this audit: the strongest model in your Claude Code model picker.** That is **Claude Fable 5.1** if it appears there, otherwise **Claude Opus 5.5**. (I can't see which models your plan includes, so check the picker; Opus 5.5 is a good result.) The job is reading the whole project, holding the design docs in mind, and spotting where the code has drifted from them, which is where a stronger model earns its cost.
- **For building a card from a finished spec, or fixes from a brief: Claude Sonnet 5.5.**
- **For mechanical edits (copy changes, renames, formatting) and re-running checklists: Claude Haiku 5.5.**
- Strongest models use more of your allowance, so keep the audit to reading and writing notes, and do the implementation on cheaper models afterward.

## Part 3. The prompt to paste into Claude Code

**BEGIN PROMPT**

You are auditing **The Mat (AlgebraMat)**, a free static algebra practice site for my students (Vite + vanilla JS, GitHub Pages, localStorage save codes, anonymous Google Sheet sync). I'm a middle school math teacher with limited coding knowledge: explain only as much as I need, briefly. Be critical, not flattering.

**Goals.** (1) A map of the project that every future session reads first. (2) A conformance report against my design documents. (3) Your inferences about how the project is meant to be structured, which I confirm. (4) Suggestions to align the three sections (**Count it, Build it, Solve it**) in formatting, structure and presentation. (5) A refactor plan to pull reusable parts into shared components.

**Ground rules**
- Work on a new branch named `audit`. Do not touch the main branch or the live site. Phases 0 to 6 are **read-only for app code**: the only files you may create are in `docs/audit/`. No behavior changes, no renames, no deletions.
- Label every claim **observed** (cite file and line) or **inferred** (say why). Never invent a component, path or behavior. If you can't find something, say so.
- Authority order: `SPEC-SOLVE-IT-LOOP.md` > the card spec > build briefs > `DECISION-LOG.md` (history only; it contains lines that were later reversed). Where code and specs disagree, report it; don't fix it yet.
- Hard rules to check and never break: scrambled ids only to the class sheet (district rule); save codes hold one bit per level, so level counts are fixed; whole-number typed answers; printables are low-ink; every generated problem is verified by substitution in code.
- Write findings to files as you go and keep `docs/audit/PROGRESS.md` current (done / in progress / what to read next), so a fresh session can resume.
- Ask me in **small batches** (five questions at most), multiple choice, recommended option first, each with the evidence behind it. Don't ask what you can find in the repo or the docs.

**Phase 0: read.** Everything in `docs/design/` (the loop first, including its conformance checklist; then the card specs, the build brief, the handoff docs; the decision log last). If something I mention is missing, ask me once.

**Phase 1: inventory** (`01-inventory.md`). The sections, cards and levels; entry points; how a card is configured; the save-code format and versions; generators and verifiers; the sheet sync; deployment; tests; dead or duplicated code; size and complexity hotspots.

**Phase 2: shared-components registry** (`02-registry.md`). For each reusable piece: where it lives, what it does, who uses it, and **every place the same thing is re-implemented**. Look specifically for: the choice prompt, the work-stack row builder, the substitution renderer, the operation colour (blue), the line (coloured box), the help row, the Move / Why? panel, the number pad, the seesaw, the counters tray and dealing, the **group diagram** (fraction of a group, from Count it / Group It), Check / Next / Go highlighting, generators and their verification, slip tagging, save-code encode and decode, and the anonymous sync.

**Phase 3: conformance report** (`03-conformance.md`). For every Solve it card that is built (Add to both sides, Divide it, and any old One-step or Switch sides content still live), run the loop's **conformance checklist** (lines 1 to 12) and the card spec's rules. Give a table of pass / fail / unknown with evidence, plus a separate list of **where the code has drifted from the spec**. Also trace the **progress-loss-after-site-updates** problem through the save and load logic and report the likely causes. Do not fix anything.

**Phase 4: inferences** (`04-inferences.md`). What you infer about the intended structure from the documents and the code (for example: the shape of a card configuration, where the shared loop should live, how Count it and Build it relate to Solve it). Each is a question with a recommended answer. Ask me in batches and record my answers.

**Phase 5: alignment suggestions** (`05-alignment.md`) across **Count it, Build it and Solve it.** Compare: screen layout; headers and level dots; the prompt line; help affordances; colour and typography; naming and wording; numeric or introductory levels; feedback after an answer; level and save structure; accessibility (colour never the only signal); Chromebook sizing and fit; low-ink printables; the tone of messages. For each difference give the current state per section, a suggested common convention, the cost (small / medium / large), the risk to students' saved progress, and your recommendation. Say which differences look **deliberate pedagogy** and which look **accidental drift**, and ask me when unsure. Propose a one-page section style guide. Do not apply it.

**Phase 6: refactor plan** (`06-refactor-plan.md`). An ordered list of small steps, each written as its own build brief (goal, files, acceptance test, risk to save codes and progress). Highest value first: the shared prompt, row builder, substitution renderer, operation colour and diagram component, with the tests that would have caught the recent Divide it regressions (the prompt changing between states, missing work rows, a wrong substitution, a scaffold that blanked the screen).

**Phase 7: only after I approve.** Write `CLAUDE.md` at the repo root (two pages at most) from the registry and the working agreements below, **verbatim**. Commit it on the branch and stop. Show me a draft first at `docs/audit/CLAUDE.md.draft`.

**What `CLAUDE.md` must contain**
1. What the project is, in a few lines.
2. The authority order above.
3. Where things live (folders, entry points, save code, sync, deploy).
4. **The shared-components registry**: each piece, its file, one line on what it does.
5. The hard rules above.
6. **Reuse before you build:** before writing anything for a card, search the registry and the repo; if you create a reusable piece, add it to the registry in the same change.
7. The working agreements below, verbatim.

**Working agreements (copy this section into `CLAUDE.md` exactly)**

> ## Working agreements: sessions and models
>
> **Start of every session:** read this file, `docs/design/SPEC-SOLVE-IT-LOOP.md` and its conformance checklist, the card spec and the brief being worked on, and `docs/handoff/NEXT.md` if it exists. Check the registry before writing anything.
>
> **Definition of done:** the conformance checklist has been run and its results reported; the registry is updated; this file is updated if the structure changed; a handoff note is written.
>
> **Tell Karl to start a fresh session.** Say so plainly at the end of your reply, and say what to paste, when: a card or brief is finished and reported; the kind of task is changing (audit or refactor, card build, bug fix); you have re-read the same files more than once or your work is drifting from the specs; earlier context is being summarised away; or a new section or card is starting. Don't wait to be asked.
>
> **Before ending a session,** write `docs/handoff/NEXT.md`: what is done, what is in progress, decisions made, files touched, what to read first, open questions.
>
> **Model guidance. Tell Karl when a change of model is worth it.** Strongest available (Claude Fable 5.1 or Claude Opus 5.5): audits, refactors that touch shared components, changes to the loop or the architecture, bugs that cross cards, anything where a wrong structural choice is expensive. Mid-tier (Claude Sonnet 5.5): building a card from a finished spec, fixes from a brief. Light (Claude Haiku 5.5): mechanical edits (copy changes, renames, formatting) and re-running checklists. When unsure, say which tier you would choose and why. Keep this list current as models change.
>
> **Reuse before you build.** If something you are about to build might already exist, stop and search the registry and the repo first.

**END PROMPT**

## Part 4. A reminder for this design chat's project

This design chat has no repo to hold a `CLAUDE.md`, so the equivalent reminder would go in the project's instructions on claude.ai. If you want one, paste something like this there:

> Remind Karl to start a fresh design chat when: a card spec is finished and handed off; the chat has become long enough that early decisions are being re-asked or contradicted; or the work is switching between kinds of task (designing a new card, reviewing a build, writing a brief). When you do, offer a one-paragraph handoff he can paste into the new chat, and name the files to attach. Also say when a stronger model is worth switching to (cross-card structure, auditing several specs against each other) and when a lighter one is enough (copy edits, formatting a finished spec).
