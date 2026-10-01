# The Mat — what comes after Group It (Karl's notes, 2026-09-30)

*Not yet specced. This records what Karl asked for, in his words as closely as possible, so it survives between sessions. Each pack gets its own spec (like SPEC-LASSO.md) and Karl's approval before it's built.*

**Where the visuals are:** all three algebra packs are on **page 2 of Karl's notes** (Integers_Notes_WORKED.pdf), under "Combining Like Terms", "Distributive Property" and "Distribute, then combine." The details below come from that page.

## Combine it (integer addition), new 2026-10-01

**Status: Karl's request, not yet specced.** *"A simple 'Combine it' section about integer addition. Similar to Flip It, without the flipping, of course."*
- **Round 1:** adding a positive and a negative (all **battles**). Modeled with the + and − counters.
- **Round 2:** adding negatives and negatives. Modeled with counters.
- **Round 3:** three or more terms. Modeled with counters.
- **Final level:** larger values (**magnitude 11 to 60**) and **no modeling** with + or −. Students **circle the positive and negative terms, including the addition symbol in front**, then decide **party or battle**, whether to **add or subtract the values**, and **the sign of the result**.

## Flip It: a final mixed level, new 2026-10-01

**Status: Karl's request, not yet specced.** Add a **mixed practice of addition and subtraction** at the end of Flip It, so both operations show up as the final challenge there.

## Boxes & Circles (combining like terms)

**Status: revised spec in SPEC-BOXES.md, waiting on Karl's go-ahead.** Karl's answers of 2026-09-30:
- Levels: (1) only + terms; (2) negative constants; (3) negative x terms and −x / +x as 1x; (4) subtracting a negative term; (5) mixed order. *"That looks good."*
- A boxed `−3x` gets **three negative boxes drawn above the expression**, and the drawing is a separate step after boxing and circling.
- Cancelling works the same as in Flip It.
- Answers are typed with the buttons at the bottom of the screen, **and** on the keyboard, which quick-keys those buttons.
- Boxes and circles separate the terms into two kinds (boxes for variable terms, circles for constants), and help students capture the + or − operation in front to see how it influences the term's sign.

- Should **function very closely to the notes page**, and **feel very similar to Flip It**.
- Given an expression with variable terms and constant terms (all with absolute value below 10).
- Students are asked to **"Box the variable terms, remembering to include the signs and + or − operation in front of it."**
- Then they **circle the constant terms**, also including the sign and/or operation in front.
- Then they **draw boxes (or negative boxes) above the boxed x terms**, and **+ or − above all the terms**.
- Then they **combine the boxes**, but may need to **cancel pairs**. Then the same for the constants.
- Include **−x and +x**, so students see them as **−1x and 1x**.
- Include **subtraction of a negative term**.

## Groups of Terms (the distributive property)

*From the notes:* "Still **A** groups of **B**. Now **B** has 2+ terms."
- `3(2x − 1)` is "3 groups of (2x − 1)". Each group is an oval holding **two boxes and a negative counter** (`□□−`). Three ovals stack, and an arrow leads to the result `6x − 3`, with the note *"6 boxes, 3 negatives."*
- `−2(x − 4)` is "the opposite of 2 groups of (x − 4)". Each oval holds a box and four negatives (`□−−−−`). The result is `2x − 8`, then an **opp.** arrow (magenta) to `−2x + 8`, exactly as the Group It flip.
- Examples: `4(3x − 2) = 12x − 8` and `−3(x − 5) = −3x + 15`. The colors are as in Group It: blue for A, green for B and the ovals, magenta for opposite.

- Students start by **drawing groups, just like in Group It**.
- The progression through the levels is **very similar to Group It's**, except that now the **box drawings for all the x terms** are included.
- It **ends with fractions of groups**, as long as the products come out as integer coefficients and constant terms.

## Distribute, then combine (last in this build)

*From the notes:* "You can't combine until you know how many of each you have. Open the groups first!"
- `2(3x − 4) − x + 5` → **① distribute:** `= 6x − 8 − x + 5` → **② combine:** `= 5x − 3`.
- Examples: `3(x + 2) − 5x = 3x + 6 − 5x = −2x + 6`, and `5 − 2(2x − 3) = 5 + −2(2x − 3) = 5 − 4x + 6 = −4x + 11`, with the magenta note *"subtract = add the opposite"* (the `+ −2` is underlined in magenta).

- **Round 1:** problems in the forms **A + B(Cx + D)** and **B(Cx + D) + A**. Students distribute first to "open up" the groups, then combine like terms, using the modeling tools already built and small values that are fast to draw.
- **Round 2:** problems in the forms **A + (Bx + C)** and **A − (Bx + C)**, focused on **writing the invisible 1 in front of the parentheses** and distributing it.
- **Round 3:** the same form as round 1, but the B values are negative, written **A − B(Cx + D)**, with integer values for A, C and D.
- **Later rounds:** strip out some of the visual work (drawing all the +, − and boxes), so students apply the properties they've learned with less visual support.

## Later builds (in order)

1. **Substitute it:** find the value of an algebraic expression for a given value, modeling with +, − and boxes first (filling the boxes with the value of x), and eventually rewriting expressions with a **"Parentheses package"** where the variables are, and evaluating that way.
2. **Solve it:** one-step equations, then two-step, then variables on both sides, culminating in problems with no solution, one solution, and infinite solutions.
3. **Model it:** students draw pictures and write equations to model situations using algebraic expressions.
