# The Mat: the scaffold engine, piloted on Combine it (approved 2026-10-02; built 2026-10-02)

*Builds on SPEC-JIT.md (Karl's decisions and the misconception catalog), SPEC-COMBINE.md and SPEC-ROADMAP.md. Only what's new is written here. This is step 2 of Karl's build order: the pilot. The diagnostic, skip-ahead with streaks, and the teacher report come after.*

## 1. What the pilot does

Combine it **Levels 1 to 3** (the two-term levels) run **light**: the problem shows, the student types the answer. Supports (the party-or-battle question, the sign cloze, the counters) appear only when the answer or an "I'm stuck" calls for them, and a support stays on for the next few problems until the student shows they don't need it. Levels 4 and 5 stay as they are for now.

**Success looks like:** a student who gets a problem right takes fewer steps than today (one typed answer instead of Draw, Party or Battle, Cancel, Answer), and a student who makes one of Karl's mistakes gets the support that answers *that* mistake.

## 1b. The first time on a device: a spotlight tour (Karl, 2026-10-02)

The first light problem on a new device opens with a short **guided tour** that spotlights the features, rather than throwing the student at a bare "type the answer." The screen dims and each feature lights up in turn with one line and a **Next** button:

1. **The problem:** "Here's what you're adding."
2. **The pad:** "Type the answer. ± makes it negative."
3. **Check:** "Press Check when you're ready."
4. **I'm stuck:** "Not sure? Press this anytime. No penalty." The tour then **requires the student to press it once** (Karl: so they have the memory of pressing it, not just a click past the feature), so they meet the first support (the party-or-battle question) and see counters when they go on to the full walk. That's the "show off the features" part: they see help is real before they need it.
5. **Back to the problem:** the student finishes it themselves.

The tour can be skipped (**Skip tour**) and replayed from a small **?** button on the light screen. It's remembered per device (`mat.tour.v1`). It spotlights real controls (not a picture of them), so it can't drift out of date.

## 2. A problem, start to finish

1. **Light.** The expression, `−5 + 3 = ?`, the pad (± and digits), **Check**, and **I'm stuck**.
2. **Right on the first try:** done. It counts as a clean answer.
3. **Wrong, or I'm stuck:** a support (§4). No penalty, no timer, and the problem is not lost.
4. **After a support, the student types the answer themselves.** A support never gives the answer, and the sign has to come out of the student's own hands.
5. **Right after a support:** done, but it isn't a clean answer. **Wrong again:** the next rung of the ladder (§4).

## 3. What a wrong answer tells us: signatures

`classify(problem, typed)` is a pure function that compares what was typed with the problem and returns a **tag**. For a two-term problem `a + b` with answer `r`:

| Tag | Mistake (SPEC-JIT.md) | Signature | First support |
|---|---|---|---|
| `sign-dropped` | I3, the sign is a "tag" | typed = \|r\| and r < 0 | the cloze |
| `wrong-winner` | I3 / I5, right size, wrong sign | typed = −r | the cloze |
| `battle-as-party` | I1, adding makes bigger | a battle, typed = \|a\| + \|b\| (either sign) | the party-or-battle question |
| `party-as-battle` | I1 | a party, typed = \|\|a\| − \|b\|\| (either sign) | the party-or-battle question |
| `unmatched` | none of these | anything else | the full walk (SPEC-JIT.md decision) |

Tags only choose a support; they're never shown to the student. Every wrong answer is logged with its tag (§6), so the `unmatched` pile is where new mistakes show up.

## 4. Supports and the ladder

**The party-or-battle question** is the existing step: *Same signs or different signs?* A right answer shows the word (party or battle) and returns to typing.

**The cloze (new).** A sentence with a blank and four choices, one of them right:

- *Battle:* "The battle of −5 and 3 leaves ____ standing." Choices: **negative 2**, **positive 2**, **negative 8**, **positive 8**.
- *Party:* "The party of −4 and −6 has ____ in all." Choices: **negative 10**, **positive 10**, **negative 2**, **positive 2**.

The choices are written with the **words** "negative" and "positive" (the digits stay digits), so the student has to say the sign, and the wrong choices are the common mistakes (wrong sign, sizes added or subtracted the wrong way). A choice reads the **whole sentence aloud** ("The battle of negative five and three leaves negative two standing"), only *after* it's chosen, so the audio never gives the answer away. A right choice draws the leftover counters on the Mat. A wrong choice says what's off and lets the student try again, with no penalty.

**The full walk** is today's step-by-step: Draw, Party or Battle, Cancel, Answer, on the same problem.

**The ladder:** a tagged mistake gets its first support. If the answer is wrong again, or the student presses **I'm stuck** again, the next rung is the **full walk**. **I'm stuck** with no wrong answer yet starts at the smallest support (the party-or-battle question). An `unmatched` mistake goes straight to the full walk.

## 5. Support that stays on, and fades

After a mistake, the support that answered it is **on** for the next problems, shown *before* the student types:

- `battle-as-party`, `party-as-battle`: the party-or-battle question first.
- `sign-dropped`, `wrong-winner`: the typed answer is **read back in words** as it's typed ("negative 2"). *(Changed in the build: the cloze shown before typing would hand over the answer, so the cloze stays the support right after the mistake and the read-back is what stays on.)*

While a support is on, a problem answered **right on the first try** counts as a **clean** one. **Three clean** answers in a row turn the support off; a wrong first answer resets the count to three. (Three is a guess to tune in class.) A student who has never made a mistake never sees a support, except by pressing **I'm stuck**.

State is kept per device in `localStorage` under its own key (`mat.skills.v1`): `{ partyBattle: n, sign: n }`, the clean answers still needed. The tour's "seen" flag is `mat.tour.v1`. It is **not** in the save code, so a new device starts light. Okay for a pilot; a decision for the teacher-report step.

## 6. The event log (anonymous)

Every problem appends events to a small ring buffer in `localStorage` (`mat.events.v1`, newest 500, nothing identifying):

One record per finished problem (a refinement of one event per move): `{ t, pack, level, problem, answers: [{ typed, tag }], supports: [kind], stuck, clean, on: { partyBattle, sign } }`, where `answers` are the wrong answers typed.

This is what SPEC-JIT.md's pattern-finding and the teacher report will read; the pilot only writes it. The app never sends it anywhere.

## 7. Where it plugs in

- `engine/scaffold.js`: `classify`, the cloze builder (sentence, four choices, which is right, the spoken text), and the support ladder.
- `engine/scaffoldSession.js`: a pure reducer like the others. It runs light mode itself and hands the full walk to the existing Combine it session (as Distribute's session does).
- `engine/skills.js`, `engine/events.js`: the on/off counts and the log, with `localStorage` kept out of the pure parts.
- `play/lightPlay.js`, `view/lightControls.js`, `view/clozeMat.js`: the adapter, the palette (± pad, Check, I'm stuck), and the cloze on the Mat.
- Spoken sentences use the browser's built-in speech (`speechSynthesis`), which works offline; a student can turn the sound off, and nothing breaks without it.
- `combineit` Levels 1 to 3 use the light adapter; the old step-by-step adapter stays as the full walk.

## 8. Build steps (one per Go)

1. **Signatures and the cloze** (**built**): `classify`, the cloze builder and the ladder, with tests of every row of §3 (including numbers that fit two signatures at once).
2. **Light mode** (**built**, behind `?light=1` until step 6): the session, the palette, the Mat, **I'm stuck**, and the hand-off to the full walk. The party-or-battle question is the only support so far; the cloze is step 3.
3. **The cloze on the Mat** (**built**): choices, the spoken sentence, the leftover counters, and a Sound on/off button.
4. **Support that stays on, fading, and the event log** (**built**).
5. **The spotlight tour** (§1b), skippable and replayable (**built**).
6. **Light mode on by default** for Combine it Levels 1 to 3 (`?light=0` for the old walk), the touch audit and real-browser runs, docs (**built**: the pilot is done).

## 9. Decisions (Karl, 2026-10-02)

- A spotlight tour on a new device's first problem, with a **required** press of **I'm stuck** (§1b).
- On/off counts and the tour flag are **per device** for the pilot (§5).
- The cloze has **four choices and no "not sure"** (§4).

## 10. Light mode on every card, and streaks (Karl, 2026-10-03; built)

**Light mode is the default nearly everywhere** (`?light=0` still plays the old step-by-step walks):

| Card | Light mode |
|---|---|
| Combine it L1–3 | Pilot (§1–§9): party-or-battle question, cloze, full walk |
| Flip It L1–4 | The same two-term light mode on subtractions. Typing the numbers' sum with the minus kept (`5 − (−3) = 2`) is its own signature, `minus-as-minus`, answered by the party-or-battle question, which first shows the subtraction as the addition it becomes. The full walk is Flip It's, starting at Rewrite. |
| Combine it L4–5, Flip It L5, Group It, Boxes & Circles, Groups of Terms, Distribute then combine R1–3 | **Type first, full walk as the answer to a miss.** A wrong answer or **I'm stuck** hands the same problem to the card's own walk. No targeted support yet; each wrong answer is logged with a tag (`engine/lightCards.js`: `uncombined`, `sign-flipped`, `sign-dropped`, `wrong-winner`, `n-off`, `x-off`, `unmatched`) so the log says which supports to build next. |
| Distribute R4–5 | Already typed; unchanged. |

- Number cards use the ± pad; terms cards (Boxes, Groups of Terms, Distribute) type with digits, **x**, **+**, **−**.
- The **tour** (§1b) still runs once per device, on the first light problem anywhere; its pad step names whichever pad is lit. A card whose pad brings **new controls** (x, +, −) gets a **one-step tip** the first time, once per device (`mat.tips.v1`), unless the tour already showed that pad.
- Code: `engine/walkLight.js` (reducer around a card's walk), `engine/lightCards.js` (per-card problem text, answer check, mistake tag), `play/walkLightPlay.js` (the adapters), `view/walkLightControls.js` and `view/walkLightFeedback.js`.

### Streaks and keep practicing

- A **streak** is problems in a row with no wrong typed answer (a *clean* answer: right the first time). **I'm stuck does not break it**; a wrong typed answer does. Finishing the walk after a miss is not a clean answer.
- The header shows **Streak n · Best m**. The **best streak per card and level** is kept on the device (`mat.streaks.v1`). The five dots stay for a level's first pass.
- When a level's five are done, the panel says the next level is open and offers **Next level →**, **Keep practicing** and the pack map.
- **Keep practicing** plays the same level endlessly in fresh sets of five; the dots give way to the streak, and a **Next level →** button stays in the header the whole time.
- Not built (parked): a diagnostic before each card's first round, skip-ahead to later levels, the teacher report.

## 11. Karl's first round of play-test changes (2026-10-03; built)

**Combine it**
- A sign mistake (`sign-dropped`, `wrong-winner`) now gets **circle the numbers** first: the Boxes & Circles drag, each number with its sign in front, checked as soon as every number has a circle. Then back to typing, with the numbers kept in circles on the Mat. A second miss gets the cloze; a third the full walk (`circle → cloze → fullWalk`).
- **Party! and Battle! sit on the Mat**, each under the words that call for it: *Same signs?* above Party!, *Different signs?* above Battle!. They are gone from the palette (keys P and B still work).

**Flip It**
- Any wrong answer on a subtraction goes **straight to rewriting**: tap the minus to turn it into a plus, then tap the number's sign. This includes a smaller number minus a larger (`3 − 8`: the 8 becomes −8). The rewritten line (magenta) stays on the Mat while the student types again. A second miss opens the counters walk with the rewrite already done.

**Group It**
- The − groups button says **opposite** under the −; the words are "positive groups, or opposite (negative) groups". Groups of Terms got the button too.
- The hidden 1: an empty dashed gap with an arrow and the label **how many groups?** (no "?" in the box).
- Fractions: the add button reads **Add part of group**; denominators now include **eighths** (halves to 16, thirds 18, fourths 24, fifths 30, sixths 24, eighths 24) and a bar can have eight parts.
- Misconception **whole group put in every part** (½ × 2 with two counters in each part): a bracket labelled *whole group: 2* and "Share the 2 between the 2 parts: don't put 2 in each part."
- Misconception **taking away instead of taking** (⅓ of 12 answered 8): "That's what's left in the parts you didn't take…"; logged as `removed-part` for typed answers.
- A sign mistake gets a **closed passage** first: "−1/2(−4) means ____" with four choices (the opposite of 1/2 of −4, 1/2 of −4, and the two with the inside sign changed). Each wrong choice says what is off.

**Everywhere**
- **Teach me step-by-step** (next to I'm stuck): the full walk at once, on every card. It counts as help.
- Text on the Mat can't be selected by dragging or double-clicking.
- **Streaks:** *I'm stuck* and *Teach me* leave the streak where it is (neither add nor break); only a wrong typed answer breaks it. (The first build reset it on I'm stuck; fixed.)



## 12. The Uber diagnostic and the fluency challenges (Karl, 2026-10-03; built)

**The diagnostic** (`engine/diagnostic.js`, `view/diagnostic.js`, `diagStore.js`)
- A button across the top of the pack map: *Take the diagnostic to find your levels* (then *Continue the diagnostic (n of 12 done)*, then *See my diagnostic results*).
- **Twelve problems, two per card**, adding and subtracting first, then groups, then the algebra cards (Combine it L2 and L4, Flip It L2 and L5, Group It L2 and L5, Boxes & Circles L2 and L4, Groups of Terms L2 and L5, Distribute then combine L1 and L3). Typed with the same pad as light mode; **nothing says right or wrong** until the end; *I don't know* skips.
- **Stopping part way saves the place** (`mat.diag.v1`: the seed and the answers) but it isn't done until the twelfth.
- **The readout** gives each card a standing and a level to start at: both right → *Strong*, start the level after the harder one; the easier right → *Getting there*, start after it; otherwise *Start here*, Level 1. Each problem shows what was typed and the right answer.
- **It recommends AND opens**: the recommended level and all before it open on that card (`packs[id].open` in the saved progress; not marked done, and not part of a save code yet). A retake can only open more.

**Fluency challenges** (`engine/fluency.js`, `engine/highscores.js`, `view/fluency.js`, `fluencyStore.js`)
- Each card's last item is a row of challenges on the pack map: Combine it: Adding; Flip It: Subtracting, Add & subtract; Group It: Multiplying (concepts), Big multiplying; Distribute then combine: Everything (all of them mixed).
- **60 seconds**, type the answer and Check (Enter). **A wrong answer flashes the right one and pauses typing for 2.5 seconds while the clock keeps running**: it costs time, not points.
- **Difficulty climbs with the number correct, a step every 5.** Add and subtract: numbers up to 9, 15, 25, 40, 60, and a third number from step 4. Multiplying (concepts): positive multipliers → **negative multipliers after 5** → **unit fractions after 10** → **other fractions, either sign, after 15**, with small numbers. Big multiplying: the same ramp with multipliers 2 to 12 (leaning 6 to 12) and fractions with denominators up to 8 of numbers up to 36. Easier kinds stay in the mix.
- **High scores**: this month, this school year (September 1 to September 1) and all time, tabs on the start and end screens, kept on this device (`mat.fluency.v1`, newest 300 runs). A shared list (a spreadsheet, teachers with accounts and sign-in codes for their students) is a later build.

## 13. Boxes & Circles in light mode, and the lasso (Karl, 2026-10-03; built)

**Every problem starts with typing the answer** (`engine/boxLight.js`, `view/boxLightControls.js`, `play/boxLightPlay.js`). Two supports are buttons to ask for at any time (they count as help: no streak, but nothing is wrong), and a wrong answer brings the first one in:

| | |
|---|---|
| **Draw boxes & circles** | The walk's own Box & Circle step (box tool for x terms, circle tool for numbers, Check), then back to typing with the shapes kept on the Mat. |
| **Rewrite subtractions** | Tap the − in front and the number's sign, for as many subtractions as you like (`− 3` and `− (−3)` alike), then **Done rewriting**. A half-flipped term can't be finished (*flip both*); a dashed magenta line shows the − and the number being flipped. Rewritten terms stay rewritten in the walk. |
| **First wrong answer** | Draw boxes and circles first, then try again. |
| **Second wrong answer** (or I'm stuck after that) | The walk, from where the student is: the counters above (Draw), Cancel, Answer. If the boxes and circles were already drawn, a wrong answer goes straight to the walk. |
| **Teach me step-by-step** | The whole walk at once. |

Two slips get their own words (`engine/lightCards.js` tags): **`0x + 13`** is right with a zero term left in, so it asks to take it out and retype, *not* a wrong answer (also on the other typing cards); **`x − 8x` typed as `−8x`** tells the student a lone x has an invisible 1, once, before any support (`invisible-one`).

**The pad's x is a variable.** On every pad that types terms, x sits in its own group captioned *variable*, apart from the *sign* group (+ and −), so it doesn't read as a times sign.

**The lasso.** A press anywhere on the Mat starts a drag; a dashed line (a box for the box tool, a pill for the circle) follows it from where the press began, and the parts under its horizontal span are highlighted; a drag that doesn't cross the row of the expression takes nothing. Release snaps a shape around whole terms as before. The first time a lasso is asked for on a device, a pointer shows how (once, `box-drag` in the tips store).

**Asked and not built yet** (waiting on Karl): a Round 2 of Boxes & Circles that shows a picture of boxes and counters and has the student write the expression (it would renumber the levels and the save code), and what the "language" piece would be. **Phone optimization** is queued next: the problems on the Mat look small next to the prompts, and the pad at the very bottom is crowded by the browser's own buttons (move it up).

## 14. Read the model, and phones (Karl, 2026-10-03; built)

**Boxes & Circles Level 2: read the model** (`engine/generateModel.js`, `engine/boxModel.js`, `play/boxModelPlay.js`)
- Some students draw the model well but can't read one back, so this round goes the other way. The Mat shows **columns of boxes, negative boxes and counters** (no expression), with the key (□ = x, −□ = −x); the student types the expression it shows. Three columns most of the time (two or four now and then), at least one box column and one counter column, at least one negative in every picture, an answer with both an x and a number, and no repeated answer in a set; two pictures each have negative boxes and negative counters.
- **Any expression worth the same is right**: in column order (`2x − 3 − x + 1`), reordered, or combined (`x − 2`). A zero term left in (`0x`) asks to take it out, not wrong.
- **No walk.** A wrong answer says the key (*a box is x, a box with a dash is −x, a + counter is +1, a − counter is −1*); a second wrong answer **labels each column with what it is worth and reads the model aloud** ("Column one: two boxes, that's two x. …", with Sound on). I'm stuck goes the same way; Teach me step-by-step labels the columns at once. Each of these counts as help (no streak).
- The old Levels 2–5 are now **Levels 3–6** (each problem keeps its original `level`, which decides whether it starts with Rewrite). **Save code v8** has six Boxes & Circles bits (36 of about 39.6); older codes and saves still work, the new level counting as done once the old Level 2 was; a level the diagnostic opened and a saved level in play shift with it. The diagnostic's Boxes & Circles problems are now Levels 3 and 5 (the old 2 and 4).
- **The language piece (suggestion; Karl asked for one):** the labels read aloud *are* the first version of it. Next could be a fill-in-the-sentence like Group It's ("Column one is ____ boxes: how many, and positive or negative?") or the reverse, hearing "three negative boxes and two positive counters" and building it. Not built; pick when you've heard the read-aloud.

**Phones**
- **The problem comes out bigger.** A phone scales the 860-wide drawing to its width, so the problem was tiny next to the prompt. On a narrow screen the drawing's width is cropped to what's in it (never shrinking again within one problem, so it doesn't zoom back and forth), light mode's drawing is narrower to begin with, and the prompt is smaller (19px).
- **The answer pad moves up.** The page uses the visible height (`100dvh`, the height with the browser's own bars in) and leaves **72px under the last row** (plus the device's safe area), so the pad isn't under the browser's bottom bar, which was stealing taps. The header takes three lines instead of four, and the palette's buttons go two to a row.
- **The pack map fits a phone**: one wide card was widening the whole column past the screen, so the card's right side was cut off. The diagnostic button wraps.
- Checked at 390×664 and 360×600 in a real browser with phone emulation (touch, mobile viewport). The browser's actual bottom bar can't be emulated, so what I could check is that the pad sits well above the bottom edge; Karl's phone is the real test.
