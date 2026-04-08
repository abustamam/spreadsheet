# Spreadsheet Editor Design

## Goal

Build a polished 10×10 financial spreadsheet editor with smart number formatting, natural keyboard navigation, and visual affordances (row striping, column/row headers, alignment) that make it feel purpose-built for finance.

---

## Core Decisions

### Formatting: auto-detect, user-guided
- Numbers formatted with commas automatically: `1234567` → `1,234,567`
- `$` prefix triggers currency display: `$1234567` → `$1,234,567`
- Raw value stored underneath; display computed on commit
- Edit mode always shows raw value (Option A)

### Cell interaction: two-mode cell (Option A)
- **Display mode**: styled `div`, formatted value, click → edit mode
- **Edit mode**: plain `<Input>` with raw value, commit on Enter/Tab/blur
- Architecture note: Option C (single hidden textarea, all cells as divs) noted for future exploration

### Keyboard navigation: spreadsheet-standard (Option B)
- Arrow keys navigate in nav mode
- Enter = commit + move down, Tab = commit + move right, Shift+Tab = move left, Shift+Enter = move up
- Typing any printable character from nav mode enters edit mode with that character
- Escape discards and returns to nav mode
- Future (if time): Shift+Arrow range selection, Home/End row jump

---

## State Shape

```typescript
type CellValue = {
  raw: string;      // what the user typed
  display: string;  // formatted output
};

// In Spreadsheet:
activeCell: { row: number; col: number } | null
editingCell: { row: number; col: number } | null
grid: CellValue[][]   // 10x10, replaces string[][]
```

---

## Components

### `Spreadsheet`
- Owns all state: `grid`, `activeCell`, `editingCell`
- Grid-level `onKeyDown` handler on container
- Renders `ColumnHeaders`, `RowHeaders`, and the cell grid

### `Cell`
- Props: `value: CellValue`, `isActive`, `isEditing`, `onActivate`, `onEdit`, `onChange`, `onCommit`, `onCancel`
- Display mode: styled `div`, right-aligned if numeric, left-aligned otherwise
- Edit mode: `<Input>` showing `raw`, auto-focused

### `ColumnHeaders`
- Renders A–J above the grid
- `gray.100` background, slightly bold

### `RowHeaders`
- Renders 1–10 left of the grid
- `gray.100` background, slightly bold

### `src/utils/format.ts`
```typescript
export function formatValue(raw: string): string
// "" → ""
// "hello" → "hello"
// "1234" → "1,234"
// "1234.56" → "1,234.56"
// "$1234" → "$1,234"
// "-1234" → "-1,234"
```

---

## Visual Affordances

| Element | Treatment |
|---|---|
| Even rows | `gray.50` background stripe |
| Odd rows | white background |
| Header row/column | `gray.100` bg, semibold text |
| Active cell | Blue border ring (`blue.400`) |
| Numeric cells | Right-aligned |
| Text cells | Left-aligned |
| Cell sizing | Fixed width (equal columns), comfortable padding |

---

## Keyboard Map

| Context | Key | Action |
|---|---|---|
| Nav mode | Arrow keys | Move active cell |
| Nav mode | Enter | Enter edit mode |
| Nav mode | Shift+Enter | Move up |
| Nav mode | Tab | Move right |
| Nav mode | Shift+Tab | Move left |
| Nav mode | Printable char | Enter edit mode, replace content with typed char |
| Nav mode | Backspace/Delete | Clear cell |
| Edit mode | Enter | Commit, move down |
| Edit mode | Tab | Commit, move right |
| Edit mode | Shift+Tab | Commit, move left |
| Edit mode | Shift+Enter | Commit, move up |
| Edit mode | ArrowUp/Down | Commit, move |
| Edit mode | Escape | Discard, restore previous raw |
| Mouse | Click cell | Set active, enter edit mode |
| Mouse | Click outside | Commit current edit |

Edge handling: all navigation clamps at grid boundaries. Tab at last column wraps to first cell of next row.

---

## Out of Scope (this exercise)
- Formulas / expression evaluation
- Data visualization / charts
- Persistence across refreshes
- Range selection (future: Shift+Arrow)
- Single textarea architecture (future: Option C)
- Unit tests (explicitly excluded by prompt)
