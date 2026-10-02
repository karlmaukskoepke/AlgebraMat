# The Mat: just-in-time supports, diagnostics and streaks (notes, 2026-10-02; not an approved spec yet)

*Karl's idea (from Pam Harris's "just in time", applied to scaffolds instead of vocabulary): students practice with as little friction as possible, and every support (the party-or-battle question, drawing the + and −, Rewrite, circling) arrives only when a student's mistake calls for it, then fades. This file holds what's agreed so far and the open questions. Builds on SPEC-ROADMAP.md's "refinements to circle back to."*

## Agreed so far

- **Light baseline:** a level runs "light" (type the answer). A wrong answer drops that problem into the existing step-by-step walk; the next problem goes back to light.
- **Triggers:** the first wrong answer, and an **"I'm stuck"** button that's always there.
- **Fade:** a support retires after about three correct problems without it (to be tuned in class).
- **Levels stay content difficulty; support is a separate dial.** Skip-ahead is allowed; a **streak** counts correct answers in a row within a level, resets on a wrong answer, and the best streak is saved per level.
- **Diagnostic:** about five typed questions the first time a card opens, mixing its levels; it sets the starting level and which supports start on. Skippable and retakeable.
- **Build order:** (1) the mixed party-or-battle round in Combine it, (2) a pilot of the scaffold engine on Combine it, (3) the diagnostic, (4) skip-ahead and streaks, (5) the teacher report.
- **Data:** the app records small anonymous events locally (problem done, tries, support used, mistake detected). Sending them anywhere comes last. Plan for later: students enter a period and a teacher-given student number; each teacher uses a template Google Sheet with an Apps Script endpoint in their own account (the site stays static; no central database). To be checked with the district. Nothing identifying is ever collected.

## What Karl sees in class (the misconception catalog)

*Mistakes are recognized from what the student types, so each one has a "signature" the engine can check. The research lines up (Vlassis on the three jobs of a minus sign; Bofferding on absolute-value thinking; Booth et al. on combining unlike terms and distributing signs), but these come from Karl's classroom.*

| # | Mistake | What it looks like | Signature in a typed answer | Support that answers it (already built) |
|---|---|---|---|---|
| I1 | **Addition makes bigger, subtraction makes smaller** | `5 − (−3) = 2`; `−4 + (−2) = −2` | magnitude from the wrong operation; a subtraction answered smaller than the start | Rewrite (adding the opposite), then counters |
| I2 | **The three jobs of a minus sign** (subtract, negative, opposite) | `5 − (−3)` read as `5 − 3`; the double negative dropped | answer equals the result of reading the second minus as only a subtraction | Rewrite: flip both signs |
| I3 | **The sign is a "tag," not part of the number** | the party-or-battle call is right, the size is right, the **sign is left off** (says "five," not "negative five") | right magnitude, missing or wrong sign | the Sign step (Level 4 has it), a "say it" support: the word **negative** shown or spoken |
| A1 | **Combining unlike terms** | `3x + 2 = 5x` | one term where there should be two kinds | Box & Circle |
| A2 | **`− x` read as "minus x" (an operation), not a negative x term** | `4x − 3 + x` → `4x − x + 3` (the minus separates numbers instead of belonging to the next term) | x coefficient 3 and number +3 (should be 5x − 3) | circling each term with its sign |
| D1 | **Not distributing to both terms** | `2(3x − 4)` → `6x − 4` | one product is the original term, usually the second | the deal-out (Fill), then the arrows |
| D2 | **The invisible 1** | `5 − (3x − 4)` | sign of the second term not flipped | write the 1; − groups and Flip |
| D3 | **The minus isn't connected to the value being distributed** | `5 − 2(3x − 4)` → `5 − 6x − 8` | the second term's sign wrong, the first right | Rewrite as adding the opposite (the magenta note) |
| D4 | **The outside number is added or subtracted, not "how many groups"** | `2(3x − 4)` → `3x − 4 + 2` | the outside number appears as a loose term | Group It's groups, the lasso |

## Skeleton (to be filled in)

1. Principles (the agreed list above).
2. The catalog, with exact signatures (this table, tightened) and what counts as "unknown."
3. The support engine: per student and per skill, which supports are on, the trigger, the fade rule, "I'm stuck."
4. Combine it: the mixed party-or-battle round, then the pilot.
5. The diagnostic: questions chosen to separate the mistakes above.
6. Skip-ahead and streaks: the unlock rules, what saves where (the save code needs room).
7. Events and the teacher report (design only; shipping the data comes last).

## Open questions

- **"Say the word":** for the sign "tag" problem (I3), do we show the word on the Mat ("negative five"), speak it aloud (the browser can do this offline, which matters on Chromebooks), or both?
- **Streaks and supports:** does needing a support break a streak, or only a wrong final answer?
- **Unknown mistakes:** when a wrong answer matches no signature, what's the default support?
