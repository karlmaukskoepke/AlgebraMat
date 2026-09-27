// Pure geometry for the Mat. No DOM, so it can be unit-tested.

export const COUNTER_SIZE = 22;   // glyph size, per SPEC §3
export const COUNTER_PITCH = 44;  // cell size; also the 44px touch target
export const PER_ROW = 5;
export const MAX_PER_ZONE = 12;

// Counter centers relative to the zone's anchor (bottom row, centered).
// Rows of 5 stack upward, away from the number, each row centered.
export function counterPositions(count, pitch = COUNTER_PITCH, perRow = PER_ROW) {
  if (count < 0 || count > MAX_PER_ZONE) throw new Error(`Bad counter count: ${count}`);
  const out = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const inRow = Math.min(perRow, count - row * perRow);
    out.push({ x: (col - (inRow - 1) / 2) * pitch, y: -row * pitch });
  }
  return out;
}
