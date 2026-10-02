# The Mat: the scaffold engine, piloted on Combine it (approved 2026-10-02)

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
- `sign-dropped`, `wrong-winner`: the cloze first.

While a support is on, a problem answered **right on the first try** counts as a **clean** one. **Three clean** answers in a row turn the support off; a wrong first answer resets the count to three. (Three is a guess to tune in class.) A student who has never made a mistake never sees a support, except by pressing **I'm stuck**.

State is kept per device in `localStorage` under its own key (`mat.skills.v1`): `{ partyBattle: n, sign: n }`, the clean answers still needed. The tour's "seen" flag is `mat.tour.v1`. It is **not** in the save code, so a new device starts light. Okay for a pilot; a decision for the teacher-report step.

## 6. The event log (anonymous)

Every problem appends events to a small ring buffer in `localStorage` (`mat.events.v1`, newest 500, nothing identifying):

`{ t, pack, level, problem, event }` where `event` is one of `answer { typed, correct, tag }`, `support { kind, rung }`, `stuck`, `done { clean, supports }`.

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
3. **The cloze on the Mat:** choices, the spoken sentence, the leftover counters.
4. **Support that stays on, fading, and the event log.**
5. **The spotlight tour** (§1b), skippable and replayable.
6. **Touch audit and real-browser runs** on Combine it Levels 1 to 3, docs.

## 9. Decisions (Karl, 2026-10-02)

- A spotlight tour on a new device's first problem, with a **required** press of **I'm stuck** (§1b).
- On/off counts and the tour flag are **per device** for the pilot (§5).
- The cloze has **four choices and no "not sure"** (§4).
