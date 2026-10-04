# Class sheet sync (Karl, 2026-10-04; built)

*So students keep their progress across devices and clearing the browser, and a teacher sees how the class is doing, with no names anywhere.*

## 1. What Karl decided
- Progress saved by **signing in**; a **Google Sheet in the teacher's own Drive** (his district is on Google Workspace for Education) with data going back and forth **anonymous**.
- In the meantime: a spreadsheet template and script, set up by the teacher (`teacher/`).
- Next: the landing page, then the solving-equations cards.

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

## 5. Google sign-in (built; needs the teacher's OAuth client ID, see teacher/SETUP.md Part 4)
- The class sheet's `doGet` says whether Google sign-in is on (script property `GOOGLE_CLIENT_ID`) and whether a bare number still works (`ALLOW_NUMBER_SIGNIN`). The app asks before showing the Sign in form.
- The student types a period and a number (so the teacher can tell who is who), then taps Google's button (Google Identity Services, loaded only then). Google gives the page an **ID token**; the page sends it to the script **once**.
- The script checks it with Google (`oauth2.googleapis.com/tokeninfo`): right app (`aud`), not expired, from Google, and (optionally) from the district's domain (`ALLOWED_DOMAIN`, the `hd` claim). It keeps **only the opaque account id (`sub`), hashed with a secret salt** (HMAC-SHA-256, first 10 hex characters, `G-…`) as the student's id. **No email or name is read into the sheet or the app.** The salt is made on first use (`ID_SALT`).
- It answers with a **device token** (random, kept in the app; only its SHA-256 hash is kept in a Devices tab). From then on that token is the sign-in, so a student isn't asked for Google every hour. Deleting a Devices row signs that phone out (it is told to sign in again). A second phone with the same Google account is the same student and gets its own token.
- With Google on and `ALLOW_NUMBER_SIGNIN` not `yes`, a bare number is refused, which removes the guessing risk in §6.
- Honest limit: the ID token (which contains the email) passes through the teacher's own script once to be checked; the script does not store it, but it is the teacher's script.

## 6. Not built (next)
- The class **high-score list**, from the Fluency tab, shown in the app.
- The **diagnostic result** and the **skills/streaks** in the sync (the diagnostic's opened levels already ride in progress).
- A teacher-facing page that reads the sheet (the Summary and Slips tabs are the first version of the teacher report).

## 7. Known limits
- With number-only sign-in, anyone with the class link and a guessed period and number can add to that student's progress (never remove). Google sign-in without `ALLOW_NUMBER_SIGNIN` fixes it.
- The class link is a secret in a URL: if it leaks, redeploy the script as a new web app.
