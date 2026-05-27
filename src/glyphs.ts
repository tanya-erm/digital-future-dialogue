export const GLYPH_COLS = 5;

export const GLYPHS = {
  f: [
    [0, 0, 1, 1, 1],
    [0, 1, 1, 0, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [1, 1, 1, 1, 0],
  ],
  d: [
    [0, 0, 0, 1, 1],
    [0, 1, 1, 1, 1],
    [1, 0, 0, 1, 1],
    [1, 0, 0, 1, 1],
    [1, 1, 0, 1, 1],
    [0, 1, 1, 0, 1],
  ],
} as const satisfies Record<string, number[][]>;
