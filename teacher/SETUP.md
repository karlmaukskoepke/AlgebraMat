# The class sheet: setting it up

Students sign in on The Mat with their **school Google account** (or, if you leave it on, a **period and student number**). Their levels, the problems they did (with the slips) and their fluency scores arrive in a Google Sheet in your own Drive. The sheet stores **no names and no emails**: a student is a scrambled id plus the period and number they typed, so you can tell who is who.

Do the parts in order. Parts 1 to 3 (about 15 minutes) already work with period-and-number sign-in; Part 4 adds Google sign-in.

## Part 1. Make the sheet
1. Upload `The-Mat-class-sheet.xlsx` to Google Drive (drive.google.com, New, File upload).
2. Open it, then **File > Save as Google Sheets**. Use the new Google Sheet from here on. Its tabs: Start here, Students, Progress, Log, Fluency, Summary, Slips. Leave each tab's first row as it is.

## Part 2. Add the script
1. In the sheet: **Extensions > Apps Script** (a new tab opens).
2. Delete the little bit of code that is there. Open `Code.gs` from this folder, copy all of it, paste it in, and click the **Save** (disk) icon.
3. Click **Deploy > New deployment**. Click the gear next to "Select type" and choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**. Google asks you to **Authorize access**: choose your account, then (if it warns the app isn't verified) **Advanced > Go to (project name) > Allow**. It asks to see and edit your spreadsheets and to connect to an external service: both are needed (the second is how it checks a Google sign-in).
5. Copy the **Web app URL** (it ends in `/exec`). Keep it: it is your class's link.

("Anyone" means anyone who has that long URL can send it data. That is how a student's phone reaches it. Treat the URL like a password: give it to students only through the class link.)

## Part 3. Try it with a number
1. Open `https://karlmaukskoepke.github.io/AlgebraMat/?class=` followed by your Web app URL, on a phone or a computer.
2. Tap **Sign in**, type a period (`3`) and a number (`1`), tap **Sign in**. The button shows ✓ 3-1.
3. Play a problem or two, wait ten seconds, and look at your sheet: **Students**, **Progress** and **Log** each have a row. If so, it works.

## Part 4. Google sign-in
This needs an "OAuth client ID" from Google Cloud. Use your **school Google account** (a Workspace for Education account), so you can pick *Internal*, which skips Google's app review.

1. Go to **console.cloud.google.com**, signed in with your school account. At the top, **Select a project > New project**, name it `The Mat`, **Create**. (If it says you don't have permission to create projects, ask your district's Google admin; that is the one thing they may need to allow.)
2. Open the menu **APIs & Services > OAuth consent screen** (it may be called **Google Auth Platform**). Choose **Internal** and **Create** (Internal means only accounts in your district can sign in). App name: `The Mat`; user support email and developer email: yours. Save through the steps; you don't need to add any scopes.
3. **Credentials > Create credentials > OAuth client ID**. Application type: **Web application**. Name: `The Mat web`. Under **Authorized JavaScript origins** click **Add URI** and enter exactly `https://karlmaukskoepke.github.io`. (No redirect URI.) **Create**, then copy the **Client ID** (it ends in `.apps.googleusercontent.com`).
4. Back in the Apps Script tab: the **gear (Project Settings)**, scroll to **Script properties**, **Add script property** for each:
   - `GOOGLE_CLIENT_ID` = the Client ID you copied
   - `ALLOWED_DOMAIN` = your district's domain (such as `yourdistrict.org`), so only school accounts are accepted
   - `ALLOW_NUMBER_SIGNIN` = `yes` while you test (so you can still sign in with a number); delete this property once Google sign-in works for you, so students can't pick another student's number
5. Open the class link again and tap **Sign in**: it now asks for a period and number **and shows a Google button**. Sign in with your school account. The first time, a row appears in **Students** with an id starting `G-` (not your email), your period and number, and a row in **Devices**.

If the Google button doesn't appear: the class link is missing the `?class=…` part, or `GOOGLE_CLIENT_ID` has a typo. If Google says "origin not allowed": the JavaScript origin in step 3 is not exactly `https://karlmaukskoepke.github.io`.

## Part 5. Names, numbers and slips (the roster file)
`The-Mat-roster.xlsx` is a second, **private** file: it is the only place student names and their numbers meet (the class sheet never has names).
1. Upload it to Drive and **File > Save as Google Sheets**. Keep it to yourself.
2. **Roster** tab: paste your class list into the yellow columns, Name and Period. Student numbers fill in (1, 2, 3 … within each period). After you hand out slips, don't sort the Roster: freeze the numbers (copy column C, then Edit > Paste special > Values only).
3. **Slips** tab: one slip per student, two across, plain text. **File > Print**, "Current sheet", Letter, portrait, narrow margins, fit to width; choose the pages you need. Cut along the dashed lines.
4. **Settings** tab: the site address on the slips is already there. For named results, paste your class sheet's browser address into B2, then on the **Imported** tab click cell A1 and choose **Allow access** (once). The **Named results** tab then shows each student's levels, problems, % clean, stuck presses and fluency runs next to their name.

## What students do
Open The Mat, tap **Sign in**, type the period and student number from their slip, and tap the Google button. (If the class address has not been built into the site yet, they open the class link once first; it is remembered.) After that, their progress is saved a few seconds after each problem or fluency run, and when the phone is back online. Signing in on a second device (or after clearing the browser) brings their levels back.

## What you see
- **Students**: who has signed in, with period and number, first and last sync. Google students have ids starting `G-`.
- **Progress**: a row per student, a column per level (TRUE = finished). Columns ending `-open` are levels the diagnostic opened.
- **Log**: each problem: what they typed and which slip it looked like (`30 → no-parens`), which supports showed, whether it was clean.
- **Fluency**: each 60-second run and its score.
- **Devices**: one row per signed-in phone (a scrambled key, never the key itself). Delete a row and that phone has to sign in again.
- **Summary** and **Slips**: formulas over the tabs above. Add your own tabs and charts: the script only writes to the data tabs.

## Care and limits
- A level finished anywhere stays finished; the script never deletes a row.
- Each phone sends at most 200 new problems at a time; each problem is added once, however often it is sent.
- Summary and Slips look at the first 150 students and 5,000 log rows; widen the ranges if you need more.
- Changing the script later: paste the new code, then **Deploy > Manage deployments > the pencil > Version: New version > Deploy**. (The URL stays the same. Script properties change at once, without redeploying.)
- New school year: **File > Make a copy**, clear the data rows of Students, Progress, Log, Fluency and Devices in the copy, deploy it as a new web app, and give students the new link. (The `ID_SALT` script property is made fresh in a new copy.)
- Do not delete the `ID_SALT` script property: it is what keeps the ids stable.
- If the app can't reach the sheet it says so and keeps everything on the phone; the next try catches up.
