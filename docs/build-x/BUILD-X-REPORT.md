# Build X report: two Solve it sections, earned and placed levels, a clickable main menu with metallic progress (2026-11-01)

Everything is on `main` and live, with no flags, after the unit tests, the real-browser sweeps and `npm run parity`, in four pushes: Parts
0 and 0b, Part 2, Parts 3 and 4, and a walk fix. Decision log: "2026-10-26: main menu and progress colours" and "2026-10-31: two Solve it
sections".

Features to check: 10 new items (two Solve it sections; a card name opens its card; pointing, the keyboard and a tap expand a section; every
status at once; a placed level earned by one problem; the shine and a section turning gold; reduced motion; "New levels added!"), and 5
earlier items updated for the new menu (`k-credit`, `l-placement`, `m-placement-old`, `m-practice`, and their walks). Every Build X item and
every updated item passes on the live site. Pictures in `docs/build-x/`, at 1366×768 and 1366×650: the menu in each status
(`x-statuses-*`), a section expanded (`x-expand-*`, `x-expand-keys-open`, `x-expand-tap-768`), the card name list and a card opened
(`x-card-name-*`, `x-card-view-*`), the level dots with placed and earned (`x-dots-*`, `x-placed-before`, `x-placed-earned-*`), the note
(`x-placed-earned-note`), the gold section (`x-section-gold-*`, `x-shine-768` mid-shine), reduced motion, a grown card, the two sections.

**What this build touched that Count it and Build it appear on:** the shared home screen (their panels, card names and statuses, their
cards' dots and level buttons) and the progress record (their placement quizzes now place levels too, see Part 2). Nothing in how their cards
play changed. Class-sheet event words, save codes' meaning, problems and seeds are unchanged.

## Part 0 and 0b

- Decision log: Karl's decisions recorded as written (metallic statuses, earned and placed, counting rules, the eventual support-aware rule
  with its proposal and note, the eventual teacher view), and the two Solve it sections with the queued Fractions of x card and the later
  Plus fractions card (recorded, nothing built).
- **Solve it** (7th grade): Add to both sides, Divide it, Flip everything, One-step equations, Two-step equations, Distribute, combine,
  solve. **Solve it Plus** (8th grade, lavender): Variables on both sides, Distribute more, Strange solutions. A configuration change:
  pack ids, saved levels, save codes, the class sheet, every `?pack=` link and "resume where you left off" are unchanged.
- **Boundary checked** (a test now holds it): Distribute, combine, solve Levels 1-4 have x once, inside the group; Level 5 adds an x-term on
  the same side; the other side is always a number. No Solve it level has x on both sides.
- **Placement quiz:** stays Solve it's; none of its problems or the cards it opens is a Solve it Plus card. Solve it Plus has no quiz and
  says so where the quiz button would be: "Solve it Plus has no placement quiz: start at Level 1 of any card."
- **Everything that treated Solve it as one section, and what changed:** `SECTIONS` (a fourth section, a `grade` subtitle); the home screen
  (four panels, the grade under the title, the no-quiz line); the styles (a lavender line for the new section, four columns, two by two
  between 761 and 1100 px wide, one column on a phone, a fourth entrance delay, a long card name wraps its dots); `SPEC-HOME.md` (a note at
  the top, then the new menu); eight test files that listed Solve it's cards (`packs`, `flip`, `bothSides`, `distSolve`, `twoStep`,
  `distMore`, `strange`, `switch`); the test-links page (an item and a Live entry). Not changed: the placement quiz's own words (they name
  Solve it only), the older specs and the README's build history (they describe Solve it as it was then).

## Part 1: what progress is saved today (before this build)

- **On the device** (`mat.v1` in the browser's storage): each card's finished levels, how far the placement quiz or the legacy credit
  opened each card, and the level in play: its card, level, problem set (seed) and **problem number**. So yes, progress *within* a level is
  saved: a reload or a closed browser comes back to the same problem number of the same set. Also kept on the device: each section's quiz
  answers, best streaks, the light-mode supports, the last 500 problems (for the class sheet) and fluency runs.
- **What survives:** closing the browser and a reload, everything (unless storage is blocked, a private window, or the site's data is
  cleared; the app asks the browser to keep it). **A different device after Google sign-in:** finished levels and opened levels come across
  (merged); the level in play and its problem number do not (the other device starts at the home screen), and neither do quiz answers,
  streaks or supports.
- **The class sheet** gets, per student, one TRUE/FALSE column per card level and a `-open` number per card (Progress tab), every finished
  problem (Log) and fluency runs. Two devices merge as: a level TRUE on either stays TRUE; the higher `-open` wins; the sheet answers with
  the merged row and each device takes it back.
- **Placement quiz and legacy credit today.** The legacy credit (an older card's finished level counted on its new card) wrote finished bits,
  saved and synced like any other: indistinguishable from earned. **The placement quiz did not**: it only *opened* levels (except that a
  high Add to both sides or Divide it result marked the "See why it works" walkthrough done). This surprised me: the brief expected the
  quiz to write finished bits.
- **What that made necessary in Part 2:** a separate record of placed levels for both kinds of credit (the quiz's levels below the one it
  starts the student at become placed; legacy credit becomes placed instead of finished), and a rule for old saves so nothing that showed as
  finished becomes less.

## Part 2: earned versus placed

- **How it is stored.** Each card keeps its list of finished levels, which now means *earned*, and, when anything is placed, a second list
  `placed` beside it. A level is never both. Every level saved as finished before this build is earned. A save from before this build is
  read with any legacy credit as earned (it showed as finished); from then on the save is marked as the new kind (`v: 2`) and new credit is
  placed. Placed opens the next level, as the credit did.
- **Earning a placed level** (the minimal rule, as built): one problem of that level finished on the card, with no help beyond a reminder
  (the class-sheet words `hint`, and `crossoff`, the old tap-to-cancel; anything else, the picture, the move offered, the guided step or
  Teach me, does not earn it; the next problem can). A note "Level 1 earned!" shows at the top for 3.5 seconds; the level goes on as usual.
  Finishing the level's five problems earns it too.
- **Merging:** earned beats placed beats none, everywhere: two devices, a code, the class sheet. Tested both ways round, and with a random
  run of 600 steps (finish, place, merge, reload, code, class sheet) in which no earned level ever becomes placed or none.
- **Hidden levels** (Strange solutions 4-5, One-step's two early levels, the walkthrough levels) are never placed and never counted; their
  saved bits and sheet columns are untouched.
- **Save codes** carry earned levels only. A restored code gives back earned levels; legacy credit is worked out again from the old cards'
  levels, as placed. **What the quiz placed cannot be stored in a code** (codes are hidden from students, so this only matters to a teacher
  moving a student by hand: the student would see those levels open but not silver). Every layout v1-v20 still round-trips.
- **The class sheet: does Karl need to do anything?** No, nothing breaks without it. The level columns (like `add-both-3`) show TRUE only for
  earned levels, as before. To also see placed levels on the sheet, paste the new `Code.gs` into the class sheet and publish a new version
  (`teacher/SETUP.md`, "Placed levels"): each card then gets a column like `add-both-placed` listing the placed level numbers (`2 3`). Until
  then, placed levels live on each student's device (and still merge there).
- **Old app versions:** the app has no offline cache, so an old version only runs in a tab left open across the update. If one saved, it
  would turn placed levels into earned (never fewer).

## Parts 3 and 4: the menu and the colours

- **Before:** a bar of three section tabs (each rolled down its section's full cards on hover or click) above three big panels (each one big
  button with its cards' names and "2/5"); no way to open one card. **Now:** the bar is gone. Four panels, each with its title, grade,
  blurb, a status line and its card names as buttons. A name opens the card on its own (big level buttons, dots, "3 of 5", "← All
  sections"). The title expands the section over all four panels (the old dropdown's contents, with its own title at the top).
- **Expanding:** resting the pointer on a title for 0.25 s (a quick pass on the way to a name does nothing), a click, Tab onto the title,
  or a tap. It goes when the pointer leaves, when focus moves out (Tab on to the card names), on Escape, a click or tap outside, Close, or a
  second tap on its title. Enter on an open title steps into it. On a phone the section opens over its own panel.
- **Thresholds as built:** plain (nothing placed or earned), green (begun: at least one level placed or earned, under half), silver (half
  or more, exactly half included), gold (every displayed level earned; placed never makes gold). A section is gold when every card in it
  with a status is gold; otherwise "2 of 6 cards gold". Each status has its own shape (a ring, a leaf, a medal, a star) and "3 of 5". Dots:
  plain, silver (placed), a gold star (earned), the current level ringed; a placed level's button says "One problem earns it".
- **Strange solutions' partial levels:** it counts the three levels it shows (3 of 3 can be gold). When Build V2 shows five, the card keeps
  its earned levels, its status is worked out over five (gold becomes silver, 3 of 5), and it says "New levels added!" once. This is
  general: any card whose displayed-level count grows gets the note (the device remembers what it last showed for each card).
- **The shine:** once, the next time the menu is seen, for a card whose status went up, a level that went from placed to earned, or a
  section that turned gold: a light band across the metal (1.5 s), a gold glow on a gold section. Any key or click stops it. Under reduced
  motion nothing moves (the colours and words are the same).
- **Look and speed:** CSS gradients only, inline SVG shapes, no images or canvas; the shine animates only a moving band and a glow.
  Checked with Chromium's processor slowed 6× (a stand-in for a low-end Chromebook): with 30 things shining at once, 60 frames a second
  (median 17 ms, 95th percentile 17 ms, one 33-100 ms frame as it starts). Contrast: the names and counts are dark ink on light metal (at
  least 8.5:1, on the darkest gold); the small grey and purple words are at least 5:1 (checked by calculation on the darkest stop of each
  gradient).
- **Testing-only states:** `?demo=menu`, `placed`, `shine` and `grew` (with `menu=1`) put a test student in a fixed state for the
  test-links page. They are merged in (never lowering anything), applied once per device, and not linked from the app.

## Tests, sweeps and parity

- **Unit tests:** all pass (2027). New: `tests/buildX.test.js` (Part 2: old devices, placement, legacy credit, merges, retired and hidden
  levels, every code layout, the 600-step never-lower run, the class sheet with and without the update; Part 4: the status table, every
  combination of none/placed/earned over 1 to 7 levels, 3,279 in all, the 50% line, displayed levels only, sections, the shine, a growing
  card).
- **Real-browser sweeps** (run locally before every push): typing, drags, redraws, font size, the room round the Moves panel and the Add
  cross-out all pass (`screenSweep`, `panelRoom` and the rest; no SKIP line). New `menuSweep`: every card name at 1366×768 and 1366×650
  (its count, shape and dots agree with the card), pointer, keyboard, touch, no sideways scroll, the shine once, reduced motion, the slowed
  processor, "New levels added!".
- **Parity:** PASS on all five families. Problems, class-sheet records of the scripted runs, traces and the 70 play screens are unchanged.
  Save codes: unchanged; five states (One-step Levels 1, 2, 3, 5 and Switch sides Level 4) now read back exactly (their credit is placed,
  not added into the next code), and three new states record placed, earned-after-placed and a merge (listed in `INTENDED-CHANGES.md`).
  **Home screens that changed** (none is in the screen set): the first screen (four panels, card names with statuses, section status lines,
  no top bar); the expanded section (replaces the dropdown); the new card view; each card's head (dots, the status badge in place of
  "Complete ✓") and level buttons (gold and silver); on the play screen, the "Level N earned!" note (only when a placed level is earned).
