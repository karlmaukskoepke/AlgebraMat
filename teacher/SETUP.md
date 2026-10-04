# The class sheet: setting it up (about 10 minutes, once)

Students sign in on The Mat with a **period** and a **student number** you give them. No names, no emails. Their levels, the problems they did (with the slips) and their fluency scores arrive in a Google Sheet in your own Drive. Nothing goes anywhere else.

## 1. Make the sheet
1. Upload `The-Mat-class-sheet.xlsx` to Google Drive, open it, and choose **File > Save as Google Sheets**.
2. Open the new Google Sheet. Tabs: Start here, Students, Progress, Log, Fluency, Summary, Slips. Leave the first row of each as it is.

## 2. Add the script
1. In the sheet: **Extensions > Apps Script**.
2. Delete what is there, paste in all of `Code.gs`, and click **Save**.
3. **Deploy > New deployment > Select type: Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. **Deploy**, then approve the permissions (it only reads and writes this one sheet). Copy the **Web app URL** (it ends in `/exec`).

("Anyone" means anyone with the long URL can send it data, which is how the students' phones reach it without signing in to Google. The URL is the class's secret: share it only through the class link.)

## 3. Give students the class link
`https://karlmaukskoepke.github.io/AlgebraMat/?class=` followed by the Web app URL. Open it once on a phone: it is remembered on that device. (Students can also paste the Web app URL into **Sign in** on the pack map.)

## 4. Students sign in
On the pack map: **Sign in**, then their **period** and **student number** (letters and numbers only, up to 12 characters each, so `3` and `12`, or `B` and `A07`). The button then shows a check and their ID. Their progress is saved a few seconds after each problem or fluency run, when they come back to The Mat, and when the phone is back online. A student who signs in on a second device gets their levels back.

## What you see
- **Students**: who has signed in, and when they last synced.
- **Progress**: a row per student, a column per level (TRUE = finished). Columns ending `-open` are levels the diagnostic opened.
- **Log**: each problem: what they typed and which slip it looked like (`30 → no-parens`), which supports showed, whether it was clean.
- **Fluency**: each 60-second run and its score.
- **Summary** and **Slips**: formulas over the tabs above (levels done, problems tried, % clean, stuck presses; counts of each kind of slip). Add your own tabs and charts: the script only writes to the four data tabs.

## Limits and care
- The script keeps a student's levels forever (a level done anywhere stays done), and never deletes a row.
- Each phone sends at most 200 new problems at a time, and every problem is added once however often it is sent.
- One class sheet holds a few thousand students' rows comfortably. Summary and Slips look at the first 150 students and 5,000 log rows; widen the ranges if you need more.
- To start a new year: make a copy of the sheet (File > Make a copy), clear the data rows of the four data tabs, deploy the copy as a new web app, and share the new link.
- Anyone who has the class link and guesses a student's period and number could add to that student's progress (a level can't be taken away). It is a classroom tool, not a secured system. A Google sign-in (so only the student can reach their own row) is the next step; see SPEC-SYNC.md.
- If something fails, the app shows "Couldn't reach the class sheet" and keeps everything on the device; the next try catches up.
