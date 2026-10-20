# The Mat: notes for Claude sessions

A browser app (Vite, plain JavaScript) for middle school math. `npm test` runs the unit tests; `npm run parity` compares the app
with a recorded baseline (see `tests/parity/README.md`).

## Working with Karl

Karl is a middle school math teacher and designer, not a developer. He tests by clicking, not by typing addresses.

1. **Reports start with the link to the test-links page, then a plain summary.** Item (1) is: "Open this first: the test-links page,
   Features to check section", with its full link and how many new items the build added to it. Then five to eight short lines in
   plain words: what changed, what to click, what needs his decision. Then the decisions, each with a recommendation. No branch
   names, commit ids or file paths in those lines (only the links he should click). Details go below, under a line.
2. **Everything he should test gets a full clickable link and an entry on the test-links page** (`/test-links.html`, built from
   `public/test-links.json`). Finishing a build includes adding or updating its entries there. The page is not linked from the app.
   It is a change list in four sections: **Features to check** (at the top, see rule 8), **Live** (on the site for everyone),
   **Testing** (behind a flag) and **Retired** (deleted); each entry is a name, one plain sentence and, for Live and Testing, its
   buttons. Karl tells the design chat which Testing items to keep or retire. **Anything Karl says to keep becomes the default and loses its flag. Anything retired is
   deleted** (its code, tests, styles and links), and its entry moves to Retired.
3. **He never types an address or picks a level or seed.** Each link carries the card, level, seed, flags and `nosignin=1`. A link
   that needs a fresh student uses `"reset": true`. Note that `level` in a link is the saved level number, which can differ from the
   number on screen (Add to both sides and Divide it: link `level=2` is shown as Level 1).
4. **Experiments ship behind flags that default off** (like `?ui=grab`), so they can go to `main` safely and the
   student-facing site doesn't change.
5. **A change with no flag goes to `main` only after `npm run parity` passes**, and the report says which parity differences were
   intended (listed in `tests/parity/INTENDED-CHANGES.md`).
6. **Always say which address to open.** Students use GitHub Pages: https://karlmaukskoepke.github.io/AlgebraMat/ (a push to
   `main` is tested and published by `.github/workflows/ci-deploy.yml` in about a minute; Karl's website links there). Test links:
   https://karlmaukskoepke.github.io/AlgebraMat/test-links.html. Netlify (https://eloquent-rugelach-64f88b.netlify.app) also builds
   `main`. Say plainly if a link won't work and why (for example, the build isn't merged yet). On the test-links page, say it with
   `notLive`.
7. **Save codes are hidden from students** (2026-10-19). The code still works behind `?codes=1`; don't change what a code means.
8. **Every build finishes by adding its new features to Features to check on the test-links page** (the `checks` list in
   `public/test-links.json`), written from the real code and walked through on the live site. A build is not finished until that is
   done. Each item has exactly: a name, the build it came from, one big link button (card, level, seed, `nosignin=1`, `"reset": true`,
   so the same problem appears every time), numbered steps with the typed values in them, what he should see (one or two plain
   sentences), and a tick box (ticks live in his browser, in a key of their own). No file names, branch names or developer words in
   an item: `npm test` checks that. Write the item's walk in `tests/features/walk.mjs` (it does exactly what the steps say and checks
   the words on screen), and run it on the live site before calling the build finished:
   `node tests/features/walk.mjs https://karlmaukskoepke.github.io/AlgebraMat/ docs/build-<letter>`. If a step does not produce
   what the item says, fix the item or the feature; a real bug found this way goes in the report. Put one screenshot of each item's
   end state in `docs/build-<letter>/`.
9. **Every new card adds a "Play it like a student" item** to Features to check, as part of finishing it: three or more deliberate
   mistakes a student might make (a wrong value, a move that makes things worse, a move that only half works, ignoring the screen
   for 10 seconds, pressing I'm stuck at the wrong moment), each with what a good response looks like. A checklist the builder writes
   only checks what the builder meant; this one checks what a student might do.
10. **No backfill.** The list holds only what has not been checked, plus the collapsed Checked group. Older builds are not added
    after the fact.

Don't change Count it or Build it, what a save code means, the problems a seed generates, or the class-sheet event words, unless
Karl asks for exactly that.
