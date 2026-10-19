// What the Add to both sides card says (SPEC-ADD-TO-BOTH-SIDES.md §4–§5). Words from the printed notes: box, counters,
// border, Party!, Battle!, cancel pairs, add the opposite, balance, check. Never "take away from both sides".
// Parameters: con (the number next to x, with its sign), opp (its opposite), other (the other side), battle (does the
// opposite meet a number of the other sign?), g1 and g2 (two groups being combined), amount, tilt, heavier, typed.


const NOT = (p) => `Put ${p.typed} back in for x and it doesn't balance.`;
// "−6 + 3" for the number typed and the number next to x
const withCon = (p) => `${p.typed} ${String(p.con).startsWith('−') ? '−' : '+'} ${String(p.con).slice(1)}`;

// The slips (§5): one message per slip, shaped by the equation.
const SLIP = {
  'wrong-op': (p) => (p.mirror
    ? `The ${String(p.con).slice(1)} changed sides but stayed ${p.con}. Put ${p.typed} back in: ${withCon(p)} is not ${p.other}.`
    : `${NOT(p)} The ${p.con} next to x needs its opposite to cancel: add ${p.opp} to both sides, not ${p.con}.`),
  untouched: (p) => `Put ${p.typed} back in for x: ${withCon(p)} = ${p.value}, not ${p.other}. What's still hiding next to x?`,
  'sign-flipped': (p) => (p.battle
    ? `Battle! ${p.opp} and ${p.other} fight, and the bigger team wins. Which team has more?`
    : 'Right size, wrong team. Check the sign.'),
  'sizes-added': (p) => `${p.opp} and ${p.other} are opposites, so it's a Battle, not a Party. Take the bigger side's sign.`,
  unmatched: (p) => `${NOT(p)} Cancel the ${p.con} with its opposite, ${p.opp}, on both sides.`,
};
export const slip = (p) => (SLIP[p.tag] ?? SLIP.unmatched)(p);
// The pop-up when a checked value does not balance. Typing the opposite of the number next to x gets its own words (Build D).
const notBalanced = (p) => (p.tag === 'gave-opposite'
  ? `${p.typed} is an important number, but it’s not the value of x. It’s what we add to both sides to find x.`
  : `When x = ${p.typed}, the equation is not balanced.`);

// Why a move waits for Undo, in one sentence (aUndoFirstHelp).
const UNDO_REASON = {
  red: 'That move made the equation bigger.',
  partial: 'That move only partly cancelled the number next to x.',
  zero: 'That move made the other side 0, but x isn’t alone.',
  fail: 'That fraction doesn’t split evenly.',
};

const M = {
  // building the equation (L1–L2)
  aBuild: (p) => `Build the equation on the balance: drag the □, the + and the − up onto the sides (or tap one, then tap a side). ${p.mirror ? `The □ goes on the right.` : `The □ goes on the left.`}`,
  aBuilding: () => 'Keep going. Tap a counter to take one back off.',
  aSimplifyFirst: () => 'Finish combining first: say whether the highlighted numbers are a Party or a Battle.',
  aPickFirst: () => 'Pick a piece first (□, + or −), then tap the side to put it on.',
  aBuildXSide: (p) => `The □ goes on the ${p.xside} side in this equation.`,
  aBuildXHave: () => 'The □ is already up. Tap it to take it back off.',
  aChooseMoveFirst: () => 'Choose “Add ___ to both sides” first.',
  aChipSign: (p) => `The blank says ${p.amount}, so it takes a ${p.chip === 'minus' ? '−' : '+'} counter, not a ${p.chip === 'minus' ? '+' : '−'}. Drag the matching one.`,
  aAmountSet: (p) => `The blank says ${p.amount}. Is that what you need to add to cancel? Change it with the pad (±) if not.`,
  aBuildOneSign: () => 'A group is all one sign. Tap a counter to take one off first.',
  aBuilt: () => 'That is the equation. Now choose a move.',
  // the first moves
  aFindX: () => 'Find x.',                                             // the prompt, on every card and at every state (Build C)
  aTradeIntro: () => 'x is on the right. Click “Trade places” to rewrite the equation with x on the left.',
  aTraded: () => 'The same equation with the sides traded: x is on the left now. Choose “Add ___ to both sides”.',
  aTradeFirst: () => 'First click “Trade places” to put x on the left.',
  aTradeNot: () => 'Trade places is for an equation with x on the right.',
  aMustMove: () => 'Let’s try solving this one using a move.',
  aLater: () => 'That move unlocks on a later card.',
  aNotNeeded: () => 'You don’t need that move here.',
  aPlace: (p) => `Drag your answer onto the x in the ${p.where === 'current' ? 'current' : 'original'} equation (or tap your answer, then tap the x).`,
  aPlugCurrent: (p) => `Let’s plug ${p.typed} back in for x, into this equation. Click Next for each line.`,
  aUndoFirst: () => 'Press Undo first.',
  aIntro: () => 'Choose a move. To get x alone, cancel the number next to it.',
  aPickAmount: () => 'Type a number to add to both sides, then press Go.',
  aAmountZero: () => 'Add a number that isn’t 0.',
  aAmountBig: () => 'That is a big number. Try a smaller amount.',
  aOtherSide: () => 'You added to this side already. Now add the same to the other side.',
  aAddedOne: (p) => `${p.amount} on the ${p.side}: the ${p.heavier} side is heavier by ${p.tilt}. Now add the same to the other side.`,
  aBalanced: (p) => `Both sides got ${p.amount}: balanced. Tap Go.`,
  aUnbalanced: (p) => `Not the same amount: the ${p.heavier} side is heavier by ${p.tilt}. Both sides must hold the same amount.`,
  aGoNotYet: () => 'Go works when both sides got the same amount and it is balanced.',
  aForced: (p) => `In this walkthrough the move is ${p.amount}. It is the opposite of the number next to x.`,
  // combining groups (Party or Battle? how many are left?)
  aCombineGroups: () => 'Now combine the numbers on each side.',
  aOnlyNumbers: () => 'Tap two numbers on the same side.',
  aSameSide: () => 'Both groups have to be on the same side of the border.',
  aPartyOrBattle: (p) => `${p.before ? `${p.before} ` : ''}Look at the highlighted ${p.g1} and ${p.g2}. Is this a Party or a Battle?`,
  aKindWrong: (p) => (p.kind === 'party'
    ? `Look at the signs: ${p.g1} and ${p.g2} are the same team, so it's a Party.`
    : `Look at the signs: ${p.g1} and ${p.g2} are opposite teams, so it's a Battle.`),
  aHowMany: (p) => (p.kind === 'party'
    ? `Party! The same team joins up. How many are there?`
    : `Battle! The pairs cancel. How many are left, and which team?`),
  aCrossedOff: (p) => `Here are the pairs cancelling. Count what is left over (${p.g1} and ${p.g2}) and type it.`,
  aCountWrong: (p) => (p.tag === 'sizes-added'
    ? `That adds the sizes, but ${p.g1} and ${p.g2} are opposite teams: the pairs cancel. Count what is left.`
    : p.tag === 'sign-flipped' ? 'Right size, wrong team. Which team has more?' : 'Not quite. Try again, or tap Cross off to see the pairs cancel.'),
  typeCount: () => 'Type how many are left, with the pad, then Check.',
  aPickKind: () => 'Tap Party or Battle first.',
  aAbandoned: () => 'Never mind. Tap two groups when you are ready.',
  aCombined: () => 'Combined. Keep going: tap two more groups.',
  // judging the move
  aGreen: () => 'Fewer terms: that move helped. Keep going, or type your guess for x.',
  // an addition that did not cancel, and one that only partly did, in the student's own numbers (Build D-2)
  aRed: (p) => (p.before ? `Adding to both sides is used to eliminate terms by adding the opposite. ${p.before} + ${p.added} did not eliminate the term. Let’s try again.`
    : 'That didn’t give you fewer terms. Try adding the opposite of the number next to x. Undo it and try a different number to add to both sides.'),
  aZeroOther: () => 'The right side is 0, but x isn’t any more alone. Look at the left side. Press Undo.',
  aZeroUndone: () => 'What do we add to both sides to eliminate this?',
  aRed3: (p) => (p.before ? `Adding to both sides is used to eliminate terms by adding the opposite. ${p.before} + ${p.added} did not eliminate the term. Let’s try again, or try I’m stuck.`
    : 'That didn’t give you fewer terms. Undo it and try a different number, or try I’m stuck.'),
  aPartial: (p) => (p.before ? `${p.before} was only partially canceled by the ${p.added} you added. What value instead of ${p.added} would have completely canceled the ${p.before}?`
    : `The ${p.con} is still there, partly cancelled. What would cancel it all? Undo it and try a different number.`),
  aSolvedBoard: () => 'x is alone. What is it? Type it.',
  aStartedOver: () => 'Back to the start. Try again.',
  aUndone: () => 'Undone. Choose “Add ___ to both sides” and try a different number.',
  // I'm stuck, Teach me
  aStuckHint: (p) => `Look at the ${p.constant} next to x. What would we add to both sides to eliminate it? Type it in the blank, then press Go.`,
  aStuck1: (p) => `Which number would cancel the ${p.constant}? Tap it, then add its opposite to both sides. Do you know x now?`,
  aStuck2: () => 'Choose "Add ___ to both sides" and pick an amount. Do you know x now?',
  aStuck3: (p) => `${p.opposite} cancels the ${p.constant}. Add it to both sides yourself.`,
  aStuckSolved: () => 'x is alone. Work out what x is and type it.',
  // x alone with numbers still to put together (Build A): the sum in plain words, a little more each ask; never the value
  aStuckSum: (p) => [
    p.many ? `What is ${p.sum}? Put them together two at a time: is each a party (same signs) or a battle (opposite signs)?`
      : `What is ${p.sum}? Is it a party (same signs) or a battle (opposite signs)?`,
    p.level >= 2 ? (p.party ? 'In a party the teams join.' : 'In a battle the bigger team wins.') : '',
    p.level >= 3 ? 'Think of each number as counters, and count each side.' : '',
  ].filter(Boolean).join(' '),
  // the help at x alone (Build C, Part 3): Party/Battle at the two numbers, then x =, then Count it's counters
  aAlonePB: (p) => `${p.sum}: party or battle?`,
  aAloneRight: (p) => `${p.kind === 'party' ? 'Yes, a party: the teams join.' : 'Yes, a battle: the bigger team wins.'} Now type x.`,
  aAloneCounters: () => 'Make the two numbers with counters, cancel the pairs, and count what is left. Then type x.',
  aAloneCount: () => 'Count what is left, then type x.',
  aStruck: (p) => `Battle! ${p.g1} and ${p.g2}: the pairs cancel. See the crossed-off pairs, then press Next.`,
  aTeachDo: (p) => `To cancel the ${p.constant} we add its opposite, ${p.opposite}, to both sides.`,
  aAloneBig: () => 'Work out the two numbers step by step, then type x.',
  aKindRight: (p) => `${p.kind === 'party' ? 'Yes, a party: the teams join.' : 'Yes, a battle: the bigger team wins.'}${p.alone ? ' Work it out and type x.' : p.after && M[p.after.key] ? ` ${M[p.after.key](p.after.params ?? {})}` : ''}`,
  // I'm stuck or Teach me while a move waits for Undo (shared with every card on the loop)
  aUndoFirstHelp: (p) => `${UNDO_REASON[p.reason] ?? UNDO_REASON.red} Let’s undo it first: press Undo.`,
  aTeach: (p) => `Step by step: the ${p.constant} next to x cancels with its opposite, ${p.opposite}. Add ${p.opposite} to the left, then to the right, then Go.`,
  // typing the answer early (the drag-check)
  // a value that does not balance (Build D, Part 2): what the check showed, never "put it back into x"; the slip shapes the hint after Undo
  aWrong: (p) => notBalanced(p),
  aGuessed: (p) => `You guessed x = ${p.typed}. This unbalances the equation.`,
  aUndoGuess: (p) => notBalanced(p),
  aSimplerFirst: () => 'Let’s make the equation simpler first, and then find the solution.',
  aPlugIn: (p) => `Let’s plug ${p.typed} back in for x, into the original equation. Click Next for each line.`,
  aCorrect: (p) => `Yes! x = ${p.answer}, and it balances.`,
  aFinishMoveFirst: () => 'Finish the move first, then type your answer.',
  typeAnswer: () => 'Type your answer with the pad, then Check.',
  answerUnreadable: () => 'I can’t read that. Type a whole number, with − if it’s negative.',
};


// ---------- the tutorials (SPEC-ADD-TO-BOTH-SIDES.md §3A–§3C): the move justified on numbers, and the quiz ----------
const TU = {
  tuIntro_add: () => 'The = sign is a border: both sides must hold the same amount. Add a number to one side and watch the readout.',
  tuIntro_trade: () => 'Tap Trade places and watch both sides: does the balance hold?',
  tuIntro_trade2: () => 'Another one. Trade places again.',
  tuIntro_cross: () => 'Tap a number to send it across the border. Watch the readout.',
  tuSuggestPos: () => 'Try adding 3 to both sides: it is already in the blank. Add it to one side, then the other.',
  tuSuggestNeg: () => 'Now a negative: try adding −2 to both sides. It is in the blank.',
  tuTryPos: (p) => `${p.amount} on both sides kept the balance: ${p.readout}. Now try adding a positive number to both sides.`,
  tuTryNeg: (p) => `${p.amount} on both sides kept the balance: ${p.readout}. Now try adding a negative number to both sides.`,
  tuPickAmount: () => 'Pick an amount with the pad (not 0), then add it to a side.',
  tuAmountZero: () => 'Pick an amount that is not 0.',
  tuAmountBig: () => 'Try a smaller amount.',
  tuOtherSide: () => 'You added to this side already. Now add the same to the other side.',
  tuAddedOne: (p) => `${p.amount} on the ${p.side}: ${p.readout}. One side got more than the other.`,
  tuBalanced: (p) => `${p.amount} on both sides: ${p.readout}. Tap Go.`,
  tuUnbalanced: (p) => `Not the same amount: ${p.readout}. Both sides must hold the same amount.`,
  tuGoNotYet: () => 'Go works when both sides are balanced.',
  tuTryMore: (p) => `${p.amount} on both sides kept the balance: ${p.readout}. Try another amount.`,
  tuTryMoreDone: (p) => `${p.amount} on both sides kept the balance: ${p.readout}. Try one more, or tap Continue for a quick quiz.`,
  tuUndone: () => 'Undone.',
  tuNotYet: () => 'Try a bit more first.',
  tuTraded: (p) => `${p.equation}: ${p.readout}. Trading places keeps the balance.`,
  tuTradeDone: (p) => `${p.equation}: ${p.readout}. Same amount on each side, just traded. Tap Continue for a quick quiz.`,
  tuCrossedBare: (p) => `${p.number} crossed the border and stayed ${p.number}: ${p.readout}. It did not balance. Tap it to switch teams.`,
  tuSwitched: (p) => `It switched teams: ${p.readout}. It balances again. Tap Go.`,
  tuUpset: (p) => `Changing just one sign: ${p.readout}. That upsets the balance.`,
  tuCrossed: (p) => `Crossed and switched teams: ${p.readout}. Try another, or tap Change every sign.`,
  tuCrossDone: (p) => `Crossed and switched teams: ${p.readout}. Tap Continue for a quick quiz.`,
  tuFlipAll: (p) => `Every sign on both sides: ${p.readout}. That keeps the balance.`,
  tuFlipModeOn: () => 'Tap any number to change its sign.',
  tuFlipModeOff: () => 'Tap a number to send it across the border.',
  tuQuizIntro: () => 'Quick quiz: three questions. Read the question, then pick an answer.',
  tuQuizRight: () => 'Yes! Next question.',
  tuQuizWrong: () => 'Not quite. Compare the before and after, then try again.',
  tuQuizPassed: () => 'Quiz done! Tap Continue.',
  tuAllDone: () => 'Nice. On to the real thing.',
  tuBoxIntro: () => 'Now with a box. The box is x: we don\u2019t know what is in it. Add the same to both sides and combine the groups to get x alone.',
  tuSymbolsIntro: () => 'Same equation with symbols only. Try it again.',
  tuBack: () => 'Back to your problem.',
};
Object.assign(M, TU);

export function addBothFeedbackText(fb) {
  const f = fb && M[fb.key];
  return f ? f(fb.params ?? {}) : '';
}

export { M as ADD_BOTH_MESSAGES };
