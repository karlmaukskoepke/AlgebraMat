// Pure geometry for the Mat. No DOM, so it can be unit-tested.

export const COUNTER_SIZE = 22;   // glyph size, per SPEC §3
export const COUNTER_PITCH = 44;  // cell size; also the 44px touch target
export const MAX_PER_ROW = 4;
export const MAX_PER_ZONE = 12;

// Row sizes for a zone, bottom row first: a balanced grid, never more than
// 4 across, wider rows nearest the number. 6 → [3,3], 7 → [4,3], 12 → [4,4,4].
export function rowSizes(count) {
  if (count === 0) return [];
  const rows = Math.ceil(count / MAX_PER_ROW);
  const base = Math.floor(count / rows);
  const extra = count % rows;
  return Array.from({ length: rows }, (_, r) => base + (r < extra ? 1 : 0));
}

// Counter centers relative to the zone's anchor (bottom row, centered).
// Rows stack upward, away from the number, each row centered.
export function counterPositions(count, pitch = COUNTER_PITCH) {
  if (count < 0 || count > MAX_PER_ZONE) throw new Error(`Bad counter count: ${count}`);
  const out = [];
  rowSizes(count).forEach((inRow, row) => {
    for (let col = 0; col < inRow; col++) {
      out.push({ x: (col - (inRow - 1) / 2) * pitch, y: row === 0 ? 0 : -row * pitch });
    }
  });
  return out;
}
