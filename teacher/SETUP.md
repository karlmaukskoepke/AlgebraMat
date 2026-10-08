# The class sheet and the roster: setting them up

Students open The Mat, tap **Sign in**, tap the **Google button**, and use their school account. They type nothing. Their levels, the problems they did (with the slips) and their fluency scores arrive in a Google Sheet in your own Drive, under a **scrambled id**: no names, no emails, no real student IDs.

How it works, in short: a student's school email holds their ID (`s1234567@yourdistrict.org`). The class sheet's script checks the sign-in with Google, takes the ID out of the email, **scrambles it with a secret key only you have**, and forgets the email and the real ID. A private **roster file** (yours) holds the same key, so only you can turn a scrambled id back into a name. The roster file also tells the class sheet which period each scrambled id is in (and, by listing them, who may sign in at all).

Two Google Sheets, two scripts:
- **The class sheet** (`The-Mat-class-sheet.xlsx` + `Code.gs`): receives the data. No names.
- **The roster** (`The-Mat-roster.xlsx` + `RosterSync.gs`): your private file. Names and real IDs live here and nowhere else.

## Part 1. Make the class sheet
1. Upload `The-Mat-class-sheet.xlsx` to Google Drive (drive.google.com, New, File upload).
2. Open it, then **File > Save as Google Sheets**. Use the new Google Sheet from here on. Its tabs: Start here, Students, Directory, Progress, Log, Fluency, Summary, Slips. Leave each tab's first row as it is.

## Part 2. Add the script to the class sheet
1. In the class sheet: **Extensions > Apps Script**.
2. Delete what is there, paste in all of `Code.gs`, and click **Save** (the disk icon).
3. **Deploy > New deployment**, the gear next to "Select type", **Web app**. Execute as: **Me**. Who has access: **Anyone**. **Deploy**, then **Authorize access** (choose your account; if it warns the app isn't verified, **Advanced > Go to (project) > Allow**; it needs your spreadsheets and "connect to an external service").
4. Copy the **Web app URL** (ends in `/exec`). The Mat needs it once: see Part 6.

("Anyone" means anyone who has that long URL can send it data; it will only accept a school Google sign-in from a student on your class list, so the URL is not a secret that matters.)

## Part 3. The roster file
1. Upload `The-Mat-roster.xlsx` to Drive and **File > Save as Google Sheets**. **Keep it private.**
2. **Settings** tab, the yellow cells: **Master list web address** (open your master list, copy the address from the browser bar), **Class sheet web address** (the class sheet's address, from Part 1). The master list tab is already `Roster Import`, and the master list needs **First, Last, Period, StudentID** in its first row.
3. **Extensions > Apps Script**: delete what is there, paste in all of `RosterSync.gs`, **Save**, then reload the roster sheet. A **The Mat** menu appears.

## Part 4. Google Cloud: the sign-in button's ID
Use your **school Google account** so you can pick *Internal* (it skips Google's app review).
1. **console.cloud.google.com**, signed in with your school account. **Select a project > New project**, name it `The Mat`, **Create**. (If it says you can't create projects, ask your district's Google admin.)
2. **APIs & Services > OAuth consent screen** (may be called **Google Auth Platform**): **Internal**, App name `The Mat`, your email for support and developer contact. No scopes to add.
3. **Credentials > Create credentials > OAuth client ID**: **Web application**, name `The Mat web`, **Authorized JavaScript origins > Add URI**: exactly `https://karlmaukskoepke.github.io`. **Create**, and copy the **Client ID** (ends in `.apps.googleusercontent.com`).

## Part 5. The settings (script properties)
In **each** Apps Script: the **gear (Project Settings)**, scroll to **Script properties**, **Add script property**.

**Class sheet's script:**
| Property | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | the Client ID from Part 4 |
| `ALLOWED_DOMAIN` | your district's email domain: `pcsdny.org` |
| `ID_KEY` | **a long secret you make up**: 30 or more random letters and numbers (mash the keyboard). Keep a copy somewhere safe. |
| `TEST_EMAILS` | your own school email, so you can sign in to test (it is kept apart as "TEST") |
| `RETIRE_ON` | optional: the day the class sheet stops taking data, like `2028-06-30` (about two years) |
| `ID_EMAIL_PREFIX` | only if the letter before the ID isn't `s` |
| `ALLOW_NUMBER_SIGNIN` | leave it out (a period-and-number sign-in would let one student pick another's number) |

**Roster's script:** `ID_KEY` = **exactly the same secret** as above. Nothing else.

Then in the **roster** sheet: **The Mat > Sync from my master list** (Google asks you to allow it the first time). The Roster tab fills in, and the class sheet's **Directory** tab gets the class list. **The Mat > Turn on automatic daily sync** keeps it current: new students are added and a student who changes period is moved, every morning.

After changing the class sheet's **script** (not its properties), publish it again: **Deploy > Manage deployments > the pencil > Version: New version > Deploy**. The URL stays the same.

## Part 6. Test it, then tell students
1. Open **https://karlmaukskoepke.github.io/AlgebraMat/?class=** followed by your Web app URL, tap **Sign in**, and use your own school account. The button should show **✓ Test**. Play a problem; ten seconds later your class sheet's **Students**, **Progress** and **Log** tabs have a row.
2. When `DEFAULT_CLASS` in `src/syncConfig.js` holds your Web app URL, you don't need the class link at all: students just open The Mat.
3. Tell students: **open The Mat, tap Sign in, tap the Google button, use your school account.** Their button then shows ✓ and their period (like `✓ P3`).

## A student says they're on the list but can't sign in
"Your account is not on the class list" means the scrambled id made from their email isn't in the **Directory** tab. Check, in this order:
1. In the **class sheet**: **The Mat > Check the class list** (reload the sheet once so the menu appears). It says how many students the list holds and whether it was made with this sheet's secret key. If it says **different secret key**, make `ID_KEY` exactly the same in both scripts (copy and paste it; no spaces), then sync again.
2. **The Mat > Check one student by ID number**: type the digits after the `s` in their email. It says whether that student is on the list, and in which period. The number is looked up and not kept.
3. If the student isn't on it, in the **roster** file run **The Mat > Sync from my master list**. It now tells you how many students it read and how many it sent to the class sheet. If the number is short, the student's row in the master list is missing a Period or StudentID (those rows are skipped).
4. **The Mat > Turn on automatic daily sync** (roster file) keeps it current every morning, so a student added today can sign in tomorrow. Sync by hand if they need to sign in today.
A student who really isn't listed also sees a short code in the message: it's the scrambled id, and it matches the **Key** column in the roster file's Roster tab (search for it there to see which student it is).

## What you see
- **Students**: scrambled id, period, first and last sync. **Directory**: the class list the roster file wrote.
- **Progress**: a row per student, a column per level (TRUE = finished); columns ending `-open` are levels the diagnostic opened.
- **Log**: each problem: what they typed and which slip it looked like (`30 → no-parens`), which supports showed, whether it was clean.
- **Fluency**: each 60-second run and its score. **Devices**: one row per signed-in phone (a scrambled key, never the key itself); delete a row and that phone has to sign in again.
- **Summary** and **Slips**: formulas over the tabs above. In the **roster** file, **Named results** (once you allow IMPORTRANGE on the Imported tab, cell A1) shows the same numbers next to names.

## Care and limits
- A level finished anywhere stays finished; the script never deletes a row. A student's progress follows their school account and their ID, so it carries across years while the sheet is open.
- **Retiring:** at the `RETIRE_ON` date the class sheet stops taking data and the app says so (progress stays on each device, and **Save code** still works). To close it for good: **Deploy > Manage deployments > Archive**, then delete both files (the class sheet and the roster) and the roster's `ID_KEY`. Without the key, scrambled ids can't be turned back into students.
- Each phone sends at most 200 new problems at a time; each is added once.
- Summary and Slips look at the first 300 students and 5,000 log rows; widen the ranges if you need more.
- Your own account can only sign in if listed in `TEST_EMAILS`; any other non-student school account (a colleague's) is refused.
- If something fails, the app shows what happened and keeps everything on the phone; the next try catches up.
