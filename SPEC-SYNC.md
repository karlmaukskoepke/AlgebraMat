# Class sheet sync (Karl, 2026-10-04; built)

*So students keep their progress across devices and clearing the browser, and a teacher sees how the class is doing, with no names anywhere.*

## 1. What Karl decided
- Progress saved by **signing in**; a **Google Sheet in the teacher's own Drive** (his district is on Google Workspace for Education) with data going back and forth **anonymous**.
- In the meantime: a spreadsheet template and script, set up by the teacher (`teacher/`).
- Done since: the landing page. Next: the solving-equations cards.

## 2. Who a student is
**Their school Google account.** A school email holds the student ID (`s1234567@pcsdny.org`). The class sheet's script checks the Google ID token with Google (right app, not expired, the district's domain, email verified), takes the ID out of the email, and makes the student's id in the sheet: `S-` and 10 characters of an HMAC-SHA-256 of the ID with a **secret key** (`ID_KEY`) only the teacher has. The email and the real ID are looked at and forgotten; no name, email or real ID is ever stored in the class sheet. Nothing is typed. (The older period-and-number sign-in is still in the script, and is refused whenever Google sign-in is on unless `ALLOW_NUMBER_SIGNIN` is yes.)

## 3. What the app does (`engine/sync.js`, `sync.js`, `syncStore.js`, `view/account.js`)
- The class address is the Apps Script web app URL, from the class link (`?class=…`) or pasted into the Sign in dialog (a link, or just its long id). Kept on the device (`mat.sync.v1`).
- Signed in, it sends one POST (text/plain, so no preflight) with: **progress** (levels done, diagnostic-opened levels), the **problems** after its cursor (the anonymous log: problem, answers typed with their tags, supports, stuck/taught, clean) and **fluency runs** after theirs; at most 200 of each per request, repeated until all are sent.
- The sheet answers with the merged progress; the app takes the union (**a level finished anywhere stays finished**), and redraws the map only if that changed anything.
- When: a few seconds after each problem or run (debounced), when the page is shown again, when the phone is back online, and at the start. Offline or failing, nothing is lost: the device keeps everything and the next try sends what's new. The cursor moves only after the sheet takes a request.
- Signing in checks with the sheet first; a number the sheet refuses is not kept. Signing out forgets the student, not the class.

## 4. What the script does (`teacher/Code.gs`)
Merges progress (never un-finishes a level), adds each problem and run **once** (a key per row), makes each cell safe (nothing that starts with `=`, `+`, `-` or `@` is left as a formula), limits sizes, and adds columns for new pack levels. It is tested against an in-memory stand-in for the sheet (`tests/classSheet.test.js`); what is **not** tested here is the Google side (deploying, permissions, the real sheet).

## 5. The roster, and the class list (built)
- A second, **private** file (`teacher/The-Mat-roster.xlsx` + `RosterSync.gs`) reads the teacher's master list (First, Last, Period, StudentID) and writes (1) its own Roster tab (names, periods, real IDs, each scrambled id), and (2) the class sheet's **Directory** tab: scrambled id and period, no names, no real IDs. It holds the same `ID_KEY`, so both make the same scrambled id for a student (tested). A daily trigger keeps it current.
- The Directory is what tells the class sheet a student's **period**, and who may sign in: an account whose ID isn't on the list is refused ("not on the class list"). A student who changes period is moved by the next sync: nothing to do, and their progress stays (the scrambled id doesn't depend on the period).
- A teacher's own account can sign in for testing only if listed in `TEST_EMAILS`; it is kept apart (`T-…`, period TEST).
- After the first Google sign-in the sheet answers with a **device token** (random; only its hash is kept, in the Devices tab). From then on that token is the sign-in, so Google isn't needed on every sync. Deleting a Devices row signs that phone out. A second phone with the same account is the same student and gets its own token.
- **Retiring:** `RETIRE_ON` (a date). After it the sheet refuses new data with a message the app shows, and its `doGet` says `retired`. Progress stays on each device (Save code still works).
- Honest limit: the ID token (which holds the email) passes through the teacher's own script to be checked, and its ID is used for the scrambled id; the script doesn't store either.

## 6. Not built (next)
- The class **high-score list**, from the Fluency tab, shown in the app.
- The **diagnostic result** and the **skills/streaks** in the sync (the diagnostic's opened levels already ride in progress).
- A teacher-facing page that reads the sheet (the Summary and Slips tabs are the first version of the teacher report).

## 7. Known limits
- With number-only sign-in, anyone with the class link and a guessed period and number can add to that student's progress (never remove). Google sign-in without `ALLOW_NUMBER_SIGNIN` fixes it.
- The class link is a secret in a URL: if it leaks, redeploy the script as a new web app.
