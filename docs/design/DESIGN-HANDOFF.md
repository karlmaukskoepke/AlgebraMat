# The Mat: design handoff

*For starting a design chat. Paste this whole file as the first message (and attach the two printed notes PDFs, `Integers_Notes_WORKED.pdf` and `Expressions_Equations_Notes_WORKED_1.pdf`). The chat can't see the code, so everything it needs is here. When the design is settled it hands back specs (see §8), and I turn each one into a build.*

---

## 0. Paste this to begin

> You are my design partner for **The Mat**, an algebra practice site I (Karl, a middle/high school math teacher) am building with Claude Code. This file is the full context. **Your job is design, not code**: help me turn a teaching idea into a precise, buildable spec. Lead with clarifying questions, one small group at a time. Be critical rather than flattering: tell me where an idea will confuse a struggling student, where it breaks the model we already use, or where I'm missing a case. Don't draft the spec until I say the vision is clear; then write it in the format in §8. I have limited coding knowledge: explain anything technical in a sentence. Keep replies brief, prose for nuance and bullets for lists.
>
> **What I want to design now:** *(fill in, e.g. "Multi-step equations", "the start-of-year checklist", "Value it Level 5")*

---

## 1. What The Mat is

A free, static website (no server, no accounts of its own) where students practice integer arithmetic and algebra with **one consistent visual model**: boxes that hide an unknown number, counters (+ and −) inside and beside them, and a border (the equals sign) that things cross. It is built to match my printed class notes, so what students see on screen is what they draw on paper.

- **Live:** karlmaukskoepke.github.io/AlgebraMat. **Code:** github.com/karlmaukskoepke/AlgebraMat (Vite + plain JavaScript, hosted on GitHub Pages).
- **Who uses it:** my own students on school Chromebooks, phones (including home-screen installs) and laptops. Many are struggling learners; the goal is that no one is stuck without a next step.
- **Progress** lives in the browser (localStorage) with a **save code** (like `MAT-E…`) to move it between devices, and, for my classes, an anonymous sync to a Google Sheet so I can see where each student is. **Nothing identifying goes to the sheet** (scrambled ids only; names live in a private file). This is a hard rule from the district.

## 2. The model and our words (use these, don't invent new ones)

From the printed notes. The notes' framing for struggling learners is "the = sign is a border between friendly nations; both sides must hold the same amount to keep the peace." That metaphor isn't required on screen, but the *vocabulary* is:

- **Box** = an unknown amount (x). A box with a minus (**opposite box**, `−x`) holds the opposite of what x is.
- **Counters**: `+` and `−` marks. A positive and a negative **cancel as a pair**. **Party!** = same signs add up; **Battle!** = opposite signs fight, the bigger side wins.
- **Border**: the equals sign. **Only things you can draw can cross it; when they cross, they switch teams** (+4 becomes −4).
- **Moving Counters** has two moves: **A · Switch sides** (drag it across; it flips) and **B · Add the same to both sides** (add the opposite, then **cancel the pairs**). **We never say "take away from both sides"**: we add the opposite so students *see* negatives cancel positives.
- **Sharing among boxes**: the number in front of x says how many boxes; share the other side evenly, one share per box. (`2x = −10`: two boxes, −5 in each.)
- **Fractions**: `(2/3)x` = split the box into 3 equal parts, take 2. `x/5` means one fifth of x.
- **Check**: put your answer back in for x. Does it balance?
- Subtraction is **add the opposite**. Group It = groups of counters; the minus in front of a group is the **opposite of the group**.

## 3. What exists now (three sections, each a set of "cards" with levels)

**Count it** (integers)
- Combine it (5 levels): adding integers; positive + negative → three or more numbers → big numbers.
- Flip It (5): subtracting integers by flipping to add the opposite.
- Group It (7): groups of counters, opposite of a group, unit fractions and fractions of a group.

**Build it** (expressions)
- Boxes & Circles (6): combining like terms; box the x terms, circle the numbers, cancel pairs.
- Groups of Terms (8): the distributive property with groups of terms, fractions of a group.
- Distribute, then combine (5): `A + B(Cx + D)`, the invisible 1, subtracting a group.
- Value it (4): evaluate an expression for a value of x (`2x + 6, x = 4`), negative values, fractions of x.

**Solve it** (equations)
- One-step equations (5): `x + a = b`, `x − a = b`, `ax = b`, `x/a = b`, mixed. Positive answers so far.
- Switch sides (6): drag the number across the border and it switches teams; one-step, x on the right, two-step, negatives.
- Two-step equations (7): `ax + b = c`, `ax − b = c`, `b + ax = c`, x on the right, `b − ax = c` (e.g. `5 − 2x = −3`), negative answers, mixed. **Undo the constant first; if they divide first, they must divide every term on both sides.**
- Multi-step equations: **not built** (see §7).

The home screen is always three big panels plus a top menu. Hovering (0.2 s) or clicking a section title rolls down that section's full cards with a diagnostic button; moving the mouse off rolls it back up. Nothing is left open or remembered.

## 4. How a card plays (the pattern every card follows)

"**Light mode**": the student **types the answer first** (the pad: digits, ±, and for algebra x, + and −). **Check** judges it.

- Right: Yes!, with a clean streak if no help was used.
- Wrong, or **I'm stuck**: the next **support** appears, **one rung at a time**, and the message **names the specific slip** ("you used only the top number", "the number crossed but didn't switch teams"). Wrong answers are *tagged* by recognizing which mistake produces that exact answer.
- **Teach me step-by-step** jumps straight to the last rung (the full worked picture).
- Supports are pictures on the **Mat** (an SVG): typically (1) the problem rewritten or the answer put back in, (2) the box-and-counter model, (3) the worked steps. Higher levels get *fewer* supports; the last rung is always available.
- Five problems per level, no repeated answers; finishing a level opens the next. A **diagnostic** per section (a few problems, nothing marked until the end) opens the levels a student is ready for.
- Slips come from real classroom errors. **The most valuable thing you can give me is a card's list of "what a wrong answer looks like."**

## 5. Design principles I've already decided

1. **One model, everywhere.** A new card must reuse boxes, counters, the border and our words. If it needs a new visual, tell me why the old one fails.
2. **The student does the thinking.** Prefer an action (drag it, type it) to watching. Supports show *after* an attempt.
3. **Name the slip, not just "wrong."** Each wrong answer gets a message that says what happened and what to try.
4. **Positive first, then negatives, then fractions**, each in its own level. Negatives should arrive reasonably soon, not last.
5. **Constants first** in equations (undo/switch the number, then share among the boxes).
6. **No skip-ahead or test-out levels** (decided against). A diagnostic *opens* levels; students still play them.
7. **Phones matter:** every tap target ≥ 44 px, pictures must fit a 390 px-wide screen, drag always has a tap alternative.
8. **Anonymity** of anything sent to the class sheet. No names, emails or real IDs.
9. **Printables** (worksheets, slips) must be low-ink: no large black-filled heading boxes with white text; elegant, light designs.
10. **Slides/documents** I make from this: large, bold text that fills the space; ask me the destination (Google Slides, PowerPoint, PDF) first.

## 6. Constraints the design must respect (so specs are buildable)

- **Static site, no backend.** Everything runs in the browser; the only server piece is a Google Apps Script that writes anonymous rows to a Google Sheet.
- **Whole numbers only for typed answers** (one integer pad). Fractions appear in the *problem and picture*, with answers chosen to be whole (e.g. `(3/4)x` with x a multiple of 4). If you want a fractional *answer*, say so explicitly: it needs a new input.
- **Drawable limits:** a picture holds roughly up to 36 counters on a side and 5 boxes. Numbers must be chosen so the model stays readable.
- **Typed answers only (for now):** the pad types a number (or an expression like `2x + 3` on algebra cards). Multiple choice, free text and multi-part answers are *possible* but are new builds; flag them.
- **Save codes** hold one on/off bit per level, so a card should have a **fixed number of levels** (room can be reserved for later ones).
- **Level count and order matter:** a level opens only after the one before it (or via the diagnostic).

## 7. The design queue (rough priority)

1. **Multi-step equations** (the last Solve it card). From my notes ("Expressions & Equations": *Fraction Equations*, *Two-Step*, *Distribute, then Solve*). Questions to settle together: order (variables on both sides, then distribute-then-solve, then fractions?); how a student *moves a variable term* across the border (it switches teams like a number); what the picture looks like with boxes on both sides; how fractions of x fit the "split the box, take parts" model; the slips (the big ones: distributing a negative, forgetting a term on one side, moving a term without flipping it).
2. **Start-of-year checklist** (only after all builds). A diagnostic-like readiness view for a new class. Needs: what it covers, how it reads for a student vs. for me, whether it prints.
3. **Value it Level 5** (an expression over a fraction): needs a "simplify the fraction" step and its own visual. Parked until simplifying fractions has one.
4. **Diagnostic coverage** for Switch sides and Multi-step; a **teacher report** from the class sheet; a **class high-score list** from the 60-second fluency challenges.
5. Later ideas: negatives and fractions in One-step as their own levels; word problems; a "teach back" step.

## 8. How to hand specs back to me

One spec per card or feature, as a markdown document. Please use this skeleton so it drops straight into the repo (`SPEC-<NAME>.md`). **Fill every heading; write "n/a" rather than skipping one.**

```
# <Card name>: <one-line purpose>  (Karl, <date>; status: designed / approved)
Section: Count it / Build it / Solve it.   Prerequisite card(s):

## 1. The task
One example problem, what the student sees, what they type.

## 2. Levels (number them; room for later ones noted)
For each: the exact forms (e.g. `ax + b = c`), number ranges, signs allowed,
what's new vs. the level before, and how many problems must show each form.

## 3. The model / picture
What is drawn for each form (boxes, counters, border, groups). What the student
can drag or tap. What's drawn at each support rung. Sketch or describe positions.

## 4. Supports (the ladder)
Rung 0, 1, 2, 3...: what appears, when (wrong answer / I'm stuck / Teach me),
and what the message says.

## 5. What a wrong answer looks like (the slips)
A table: the slip | the exact wrong answer it gives for an example | the
message the student sees | which rung it triggers.

## 6. Words
Any new vocabulary (and how it matches the printed notes).

## 7. Edge cases and limits
Numbers that must be excluded, too-big pictures, zero, repeats, negatives.

## 8. Diagnostic
Which levels to sample (an easier and a harder one), and what each result opens.

## 9. Not decided / open questions
Anything you want me to confirm before building.
```

Also hand back a short **decision log** (bullets: *decision, why, date*) so I can keep SPEC-ROADMAP.md up to date.

## 9. Things to ask me about, not assume

My classroom habits and wording (how I actually say each step aloud), which errors I see most in real student work, how long a level should take, and anything that would make you want to change a principle in §5.
