# Class sheet sync (Karl, 2026-10-04; built)

*So students keep their progress across devices and clearing the browser, and a teacher sees how the class is doing, with no names anywhere.*

## 1. What Karl decided
- Progress saved by **signing in**; a **Google Sheet in the teacher's own Drive** (his district is on Google Workspace for Education) with data going back and forth **anonymous**.
- In the meantime: a spreadsheet template and script, set up by the teacher (`teacher/`).
- Next: sign in with a Google account (below), then the landing page, then the solving-equations cards.

## 2. Who a student is
A **period** and a **student number** the teacher hands out (letters and digits, up to 12 each, capital letters). The sheet's id is `period-number` (`3-12`). No names or emails exist anywhere.

## 3. What the app does (`engine/sync.js`, `sync.js`, `syncStore.js`, `view/account.js`)
- The class address is the Apps Script web app URL, from the class link (`?class=…`) or pasted into the Sign in dialog (a link, or just its long id). Kept on the device (`mat.sync.v1`).
- Signed in, it sends one POST (text/plain, so no preflight) with: **progress** (levels done, diagnostic-opened levels), the **problems** after its cursor (the anonymous log: problem, answers typed with their tags, supports, stuck/taught, clean) and **fluency runs** after theirs; at most 200 of each per request, repeated until all are sent.
- The sheet answers with the merged progress; the app takes the union (**a level finished anywhere stays finished**), and redraws the map only if that changed anything.
- When: a few seconds after each problem or run (debounced), when the page is shown again, when the phone is back online, and at the start. Offline or failing, nothing is lost: the device keeps everything and the next try sends what's new. The cursor moves only after the sheet takes a request.
- Signing in checks with the sheet first; a number the sheet refuses is not kept. Signing out forgets the student, not the class.

## 4. What the script does (`teacher/Code.gs`)
Merges progress (never un-finishes a level), adds each problem and run **once** (a key per row), makes each cell safe (nothing that starts with `=`, `+`, `-` or `@` is left as a formula), limits sizes, and adds columns for new pack levels. It is tested against an in-memory stand-in for the sheet (`tests/classSheet.test.js`); what is **not** tested here is the Google side (deploying, permissions, the real sheet).

## 5. Not built (next)
- **Google sign-in.** Students sign in with their school Google account (Google Identity Services). The app sends the ID token; the script verifies it with Google, takes only the opaque account id (`sub`), hashes it with a secret salt, and uses that as the student's id. No email or name is stored. The teacher links the hash to a student number once (a first-sign-in step). It needs a Google Cloud "OAuth client ID" created by the teacher's district account. It would replace the number guessing risk below.
- The class **high-score list**, from the Fluency tab, shown in the app.
- The **diagnostic result** and the **skills/streaks** in the sync (the diagnostic's opened levels already ride in progress).
- A teacher-facing page that reads the sheet (the Summary and Slips tabs are the first version of the teacher report).

## 6. Known limits
- Anyone with the class link and a guessed period and number can add to that student's progress (never remove). Fine for a classroom; Google sign-in fixes it.
- The class link is a secret in a URL: if it leaks, redeploy the script as a new web app.
