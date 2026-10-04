// Messages for Boxes & Circles' "read the model" round (Karl, 2026-10-03).

const KEY = 'A box is x. A box with a dash is −x. A + counter is +1 and a − counter is −1.';

const BM = {
  bmIntro: () => 'Write the expression this model shows: read each column, then type them all. Then Check.',
  bmCorrect: ({ answer }) => `Yes! That model is worth ${answer}.`,
  bmKey: () => `${KEY} Say what each column is worth, then write them all.`,
  bmKeyWrong: () => `Not quite. ${KEY} Say what each column is worth, then write them all.`,
  bmSay: ({ col }) => `Say it in words. Column ${col} has ____: pick what the picture shows.`,
  bmSayNext: ({ said, label, col }) => `Yes: ${said}, that’s ${label}. Column ${col} has ____: pick what the picture shows.`,
  bmPickWrong: ({ why }) => `Not that one. ${why}`,
  bmLabels: () => 'Every column is labelled (listen). Write them all as one expression: you can combine them, or leave them in order.',
  bmZeroTerm: () => 'One of those terms is zero (0x, or 0 on its own), so it isn’t really there. Take it out and type what’s left.',
  typeAnswer: () => 'Type your answer with the pad, then Check.',
  answerUnreadable: () => 'I can’t read that. Type terms like 2x + 3, with x, + and −.',
};

export function boxModelFeedbackText(fb) {
  const f = fb && BM[fb.key];
  return f ? f(fb.params ?? {}) : '';
}
