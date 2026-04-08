export type CellValue = {
  raw: string;      // what the user typed
  display: string;  // formatted for display
};

export type CellPosition = {
  row: number;
  col: number;
};

export const EMPTY_CELL: CellValue = { raw: '', display: '' };

export const NUM_ROWS = 10;
export const NUM_COLUMNS = 10;

/** Column letters A–J */
export const COLUMN_LABELS = Array.from({ length: NUM_COLUMNS }, (_, i) =>
  String.fromCharCode(65 + i)
);

/** Row numbers 1–10 */
export const ROW_LABELS = Array.from({ length: NUM_ROWS }, (_, i) => String(i + 1));
