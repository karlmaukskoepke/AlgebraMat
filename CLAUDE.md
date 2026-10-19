# The Mat: notes for Claude sessions

A browser app (Vite, plain JavaScript) for middle school math. `npm test` runs the unit tests; `npm run parity` compares the app
with a recorded baseline (see `tests/parity/README.md`).

## Working with Karl

Karl is a middle school math teacher and designer, not a developer. He tests by clicking, not by typing addresses.

1. **Reports start with a plain summary.** Five to eight short lines in plain words: what changed, what to click, what needs his
   decision. No branch names, commit ids or file paths there (only the links he should click). Details go below, under a line.
2. **Everything he should test gets a full clickable link and an entry on the test-links page** (`/test-links.html`, built from
   `public/test-links.json`). Finishing a build includes adding or updating its entries there. The page is not linked from the app.
   It is a change list in three sections: **Live** (on the site for everyone), **Testing** (behind a flag) and **Retired**
   (deleted); each entry is a name, one plain sentence and, for Live and Testing, its buttons. Karl tells the design chat which
   Testing items to keep or retire. **Anything Karl says to keep becomes the default and loses its flag. Anything retired is
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

Don't change Count it or Build it, what a save code means, the problems a seed generates, or the class-sheet event words, unless
Karl asks for exactly that.
