// Typing an answer with the pad or keyboard, as one pure function the quiz screens share (the fluency challenges and
// the diagnostic). `pad` is 'integer' (± and digits) or 'algebra' (digits with x, + and −).

export const MAX_ENTRY = { integer: 4, algebra: 20 };

// The entry after one action, or the same string when the action does nothing.
export function typeInto(entry, action, pad) {
  const max = MAX_ENTRY[pad];
  switch (action.type) {
    case 'digit':
      if (!Number.isInteger(action.digit) || action.digit < 0 || action.digit > 9) return entry;
      return entry.replace('-', '').length >= max ? entry : entry + String(action.digit);
    case 'toggleSign':
      if (pad !== 'integer') return entry;
      return entry.startsWith('-') ? entry.slice(1) : `-${entry}`;
    case 'typeChar':
      if (pad === 'integer' ? !(action.ch === '-' && entry === '') : !['x', '+', '-'].includes(action.ch)) return entry;
      return entry.length >= max ? entry : entry + action.ch;
    case 'backspace':
      return entry === '' ? entry : entry.slice(0, -1);
    default:
      return entry;
  }
}

export const isTyping = (action) => ['digit', 'toggleSign', 'typeChar', 'backspace'].includes(action.type);
