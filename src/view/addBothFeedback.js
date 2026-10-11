// What the Add to both sides card says (SPEC-ADD-TO-BOTH-SIDES.md §4–§5). Words from the printed notes: box, counters,
// border, Party!, Battle!, cancel pairs, add the opposite, balance, check. Never "take away from both sides".
// Parameters: con (the number next to x, with its sign), opp (its opposite), other (the other side), battle (does the
// opposite meet a number of the other sign?), g1 and g2 (two groups being combined), amount, tilt, heavier, typed.

const NOT = (p) => `Put ${p.typed} back in for x and it doesn't balance.`;

// The slips (§5), merged: one message per slip, shaped by the equation.
const SLIP = {
  'wrong-op': (p) => (p.mirror
    ? `${NOT(p)} The ${p.con} changed sides but stayed ${p.con}: when a number is on the other side it needs its opposite, ${p.opp}.`
    : `${NOT(p)} The ${p.con} next to x needs its opposite to cancel: add ${p.opp} to both sides, not ${p.con}.`),
  untouched: (p) => `${NOT(p)} What's still hiding next to x? The ${p.con} is still there.`,
  'sign-flipped': (p) => (p.battle
    ? `${NOT(p)} Battle! ${p.opp} and ${p.other} fight, and the bigger team wins: which team has more?`
    : `${NOT(p)} Right size, wrong team: check the sign.`),
  'sizes-added': (p) => `${NOT(p)} ${p.opp} and ${p.other} are opposites, so it's a Battle, not a Party: take the bigger side's sign.`,
  unmatched: (p) => `${NOT(p)} Cancel the ${p.con} with its opposite, ${p.opp}, on both sides.`,
};
const slip = (p) => (SLIP[p.tag] ?? SLIP.unmatched)(p);

const M = {
  // building the equation (L1–L2)
  aBuild: (p) => `Build the equation up above: drag the □, the + and the − up onto the sides (or tap one, then tap a side). ${p.mirror ? `The □ goes on the right.` : `The □ goes on the left.`}`,
  aBuilding: () => 'Keep going. Tap a counter to take one back off.',
  aPickFirst: () => 'Pick a piece first (□, + or −), then tap the side to put it on.',
  aBuildXSide: (p) => `The □ goes on the ${p.xside} side in this equation.`,
  aBuildXHave: () => 'The □ is already up. Tap it to take it back off.',
  aChooseMoveFirst: () => 'Choose “Add ___ to both sides” first.',
  aChipSign: (p) => `The blank says ${p.amount}, so it takes a ${p.chip === 'minus' ? '−' : '+'} counter, not a ${p.chip === 'minus' ? '+' : '−'}. Drag the matching one.`,
  aAmountSet: (p) => `The blank says ${p.amount}. Is that what you need to add to cancel? Change it with the pad (±) if not.`,
  aBuildOneSign: () => 'A group is all one sign. Tap a counter to take one off first.',
  aBuilt: () => 'That is the equation. Now choose a move.',
  // the first moves
  aIntro: () => 'Choose a move. To get x alone, cancel the number next to it.',
  aPickAmount: () => 'Pick an amount with the pad, then add it to one side.',
  aAmountZero: () => 'Pick an amount that is not 0.',
  aAmountBig: () => 'That is a big number. Try a smaller amount.',
  aOtherSide: () => 'You added to this side already. Now add the same to the other side.',
  aAddedOne: (p) => `${p.amount} on the ${p.side}: the ${p.heavier} side is heavier by ${p.tilt}. Now add the same to the other side.`,
  aBalanced: (p) => `Both sides got ${p.amount}: balanced. Tap Go.`,
  aUnbalanced: (p) => `Not the same amount: the ${p.heavier} side is heavier by ${p.tilt}. Both sides must hold the same amount.`,
  aGoNotYet: () => 'Go works when both sides got the same amount and it is balanced.',
  aForced: (p) => `In this walkthrough the move is ${p.amount}. It is the opposite of the number next to x.`,
  // combining groups (Party or Battle? how many are left?)
  aCombineGroups: () => 'Now combine the groups on each side: tap two groups.',
  aOnlyNumbers: () => 'Tap two groups of counters (numbers) on the same side.',
  aSameSide: () => 'Both groups have to be on the same side of the border.',
  aPartyOrBattle: (p) => `${p.g1} and ${p.g2}: Party or Battle?`,
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
  aGreen: () => 'Fewer terms: that move helped.',
  aNeutral: () => 'Same number of terms: that move did not get you closer.',
  aRed1: (p) => `That made it worse: the ${p.con} next to x is still there, and there is more of it. You can Undo it. Try the opposite of ${p.con}.`,
  aRed2: (p) => `Still going the wrong way. Counters are on if you want them. What cancels ${p.con}?`,
  aRed3: () => 'Want a fresh start? Tap Start over (or keep going).',
  aSolvedBoard: (p) => `x is alone: ${p.mirror ? `${p.answer} = x` : `x = ${p.answer}`}. Do you know x? Type it.`,
  aStartedOver: () => 'Back to the start. Try again.',
  aUndone: () => 'Undone.',
  // the other moves
  aTraded: () => 'The sides traded places. Same equation, new view.',
  aTradedSolved: () => 'Same equation, new view.',
  aCross: () => 'Tap the number to send it across the border. It switches teams.',
  aCrossed: (p) => `${p.number} crossed the border, but it did not switch teams: it is not balanced. Tap it to switch teams.`,
  aSwitchedTeams: (p) => `It switched teams: ${p.number}. Balanced. Tap Go.`,
  // I'm stuck, Teach me
  aStuck1: (p) => `Which number would cancel the ${p.constant}? Tap it, then add its opposite to both sides. Do you know x now?`,
  aStuck2: () => 'Choose "Add ___ to both sides" and pick an amount. Do you know x now?',
  aStuck3: (p) => `${p.opposite} cancels the ${p.constant}. Add it to both sides yourself.`,
  aStuckSolved: () => 'x is alone on the board. Read the other side: that is x.',
  aTeach: (p) => `Step by step: the ${p.constant} next to x cancels with its opposite, ${p.opposite}. Add ${p.opposite} to the left, then to the right, then Go.`,
  // typing the answer early (the drag-check)
  aEarlyYes: (p) => `Yes! ${p.typed}. Now check it: put ${p.typed} in for x.`,
  aEarlyDrag: (p) => `Let's check ${p.typed}: put it in for x.`,
  aCheckStart: (p) => `${p.typed} goes in for x. Tap Next to follow the steps.`,
  aEarlyMove: () => 'Balanced! Which move would get you there? Add the opposite to both sides.',
  aCheckFailed: slip,
  aDoneEarly: () => 'Yes! That is the move that gets you there.',
  aCorrect: (p) => `Yes! x = ${p.answer}, and it balances.`,
  aReadBoard: (p) => `${slip(p)} The board says x = ${p.answer}: read the other side.`,
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
  tuQuizIntro: (p) => `Quick quiz. ${p.say}: does it keep the balance or upset it?`,
  tuQuizRight: (p) => `Yes! Next: ${p.say}. Keep or upset?`,
  tuQuizWrong: (p) => `Not quite. ${p.say} ${p.correct === 'keeps' ? 'keeps' : 'upsets'} the balance. Compare the two: then try again.`,
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
