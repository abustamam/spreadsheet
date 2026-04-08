# Spreadsheet Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a polished 10×10 financial spreadsheet with smart number/currency formatting, two-mode cells (display/edit), row+column headers, row striping, and full spreadsheet-standard keyboard navigation.

**Architecture:** Grid state lives in `Spreadsheet` as `CellValue[][]` with `raw` and `display` fields. Each `Cell` renders either a formatted `div` (display mode) or a plain `Input` (edit mode). A single `onKeyDown` handler on the grid container drives all navigation.

**Tech Stack:** Next.js 14, React 18, TypeScript, Chakra UI v2, Immer (use-immer), Lodash

> **Note:** Unit tests are explicitly out of scope per the prompt. No test steps are required.

---

## Task 1: formatValue utility

**Files:**
- Create: `src/utils/format.ts`

**Step 1: Create the utility**

Create `src/utils/format.ts`:

```typescript
/**
 * Format a raw cell string for display.
 *
 * Rules:
 * - Empty string → ""
 * - Non-numeric string → return as-is
 * - "$" prefix → strip prefix, format number, re-add "$"
 * - Pure number (int or decimal) → format with thousands separator
 * - Negative numbers → preserve the minus sign
 */
export function formatValue(raw: string): string {
  if (!raw || raw.trim() === '') return '';

  const trimmed = raw.trim();

  // Currency: starts with $ (optionally negative after $)
  if (trimmed.startsWith('$')) {
    const rest = trimmed.slice(1);
    const formatted = formatNumber(rest);
    return formatted !== null ? `$${formatted}` : trimmed;
  }

  // Plain number
  const formatted = formatNumber(trimmed);
  return formatted !== null ? formatted : trimmed;
}

/**
 * Format a numeric string with thousands separators.
 * Returns null if the string is not a valid number.
 */
function formatNumber(value: string): string | null {
  // Allow optional leading minus, digits, optional decimal point + digits
  if (!/^-?\d*\.?\d+$/.test(value) && !/^-?\d+\.?\d*$/.test(value)) {
    return null;
  }

  const num = parseFloat(value);
  if (isNaN(num)) return null;

  // Check if original had decimal component
  const hasDecimal = value.includes('.');
  if (hasDecimal) {
    // Preserve original decimal places
    const decimalPlaces = value.split('.')[1]?.length ?? 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  }

  return num.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}

/**
 * Returns true if a raw value should be right-aligned (numeric or currency).
 */
export function isNumericValue(raw: string): boolean {
  if (!raw || raw.trim() === '') return false;
  const trimmed = raw.trim();
  const withoutCurrency = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
  return /^-?\d*\.?\d+$/.test(withoutCurrency) || /^-?\d+\.?\d*$/.test(withoutCurrency);
}
```

**Step 2: Verify manually**

Open the dev server (`yarn dev`) and inspect the file compiles without errors. No tests required per prompt.

**Step 3: Commit**

```bash
git add src/utils/format.ts
git commit -m "feat: add formatValue utility for financial number formatting"
```

---

## Task 2: CellValue type + grid state migration

**Files:**
- Create: `src/types/spreadsheet.ts`
- Modify: `src/components/Spreadsheet.tsx`

**Step 1: Create shared types**

Create `src/types/spreadsheet.ts`:

```typescript
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
```

**Step 2: Update Spreadsheet to use CellValue[][]**

Replace the entire `src/components/Spreadsheet.tsx` with:

```typescript
import { Box, Flex } from '@chakra-ui/react';
import _ from 'lodash';
import React from 'react';
import { useImmer } from 'use-immer';

import Cell from 'components/Cell';
import { CellValue, CellPosition, EMPTY_CELL, NUM_ROWS, NUM_COLUMNS, COLUMN_LABELS, ROW_LABELS } from 'types/spreadsheet';
import { formatValue } from 'utils/format';

const Spreadsheet: React.FC = () => {
  const [grid, setGrid] = useImmer<CellValue[][]>(
    _.times(NUM_ROWS, () => _.times(NUM_COLUMNS, () => ({ ...EMPTY_CELL }))),
  );
  const [activeCell, setActiveCell] = useImmer<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useImmer<CellPosition | null>(null);

  const isActive = (row: number, col: number) =>
    activeCell?.row === row && activeCell?.col === col;

  const isEditing = (row: number, col: number) =>
    editingCell?.row === row && editingCell?.col === col;

  const commitCell = (row: number, col: number, raw: string) => {
    setGrid(draft => {
      draft[row][col] = { raw, display: formatValue(raw) };
    });
    setEditingCell(null);
  };

  const activateCell = (row: number, col: number) => {
    setActiveCell({ row, col });
    setEditingCell({ row, col });
  };

  return (
    <Box
      width="full"
      outline="none"
      tabIndex={0}
    >
      {/* Column headers */}
      <Flex>
        <Box width="40px" flexShrink={0} /> {/* corner spacer */}
        {COLUMN_LABELS.map(label => (
          <Box
            key={label}
            flex={1}
            textAlign="center"
            fontSize="xs"
            fontWeight="semibold"
            color="gray.600"
            bg="gray.100"
            borderWidth="1px"
            borderColor="gray.200"
            py={1}
          >
            {label}
          </Box>
        ))}
      </Flex>

      {/* Grid rows */}
      {grid.map((row, rowIdx) => (
        <Flex key={rowIdx}>
          {/* Row header */}
          <Box
            width="40px"
            flexShrink={0}
            textAlign="center"
            fontSize="xs"
            fontWeight="semibold"
            color="gray.600"
            bg="gray.100"
            borderWidth="1px"
            borderColor="gray.200"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {ROW_LABELS[rowIdx]}
          </Box>

          {/* Cells */}
          {row.map((cellValue, colIdx) => (
            <Cell
              key={`${rowIdx}/${colIdx}`}
              value={cellValue}
              isActive={isActive(rowIdx, colIdx)}
              isEditing={isEditing(rowIdx, colIdx)}
              isEvenRow={rowIdx % 2 === 0}
              onActivate={() => activateCell(rowIdx, colIdx)}
              onChange={(raw: string) => {
                setGrid(draft => {
                  draft[rowIdx][colIdx].raw = raw;
                });
              }}
              onCommit={(raw: string) => commitCell(rowIdx, colIdx, raw)}
              onCancel={() => setEditingCell(null)}
            />
          ))}
        </Flex>
      ))}
    </Box>
  );
};

export default Spreadsheet;
```

**Step 3: Verify app compiles**

```bash
yarn dev
```

Expected: no TypeScript errors in terminal, grid renders (Cell will need updating in Task 3 but Spreadsheet should compile with the new props passing down).

**Step 4: Commit**

```bash
git add src/types/spreadsheet.ts src/components/Spreadsheet.tsx
git commit -m "feat: upgrade grid state to CellValue[][], add headers and active/editing state"
```

---

## Task 3: Cell component — display and edit modes

**Files:**
- Modify: `src/components/Cell.tsx`

**Step 1: Replace Cell with two-mode implementation**

Replace the entire `src/components/Cell.tsx` with:

```typescript
import { Box, Input } from '@chakra-ui/react';
import React, { useEffect, useRef } from 'react';

import { CellValue } from 'types/spreadsheet';
import { isNumericValue } from 'utils/format';

interface Props {
  value: CellValue;
  isActive: boolean;
  isEditing: boolean;
  isEvenRow: boolean;
  onActivate: () => void;
  onChange: (raw: string) => void;
  onCommit: (raw: string) => void;
  onCancel: () => void;
}

const CELL_WIDTH = '90px';
const CELL_HEIGHT = '32px';

const Cell: React.FC<Props> = ({
  value,
  isActive,
  isEditing,
  isEvenRow,
  onActivate,
  onChange,
  onCommit,
  onCancel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const numeric = isNumericValue(value.raw);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const bg = isActive
    ? 'blue.50'
    : isEvenRow
    ? 'gray.50'
    : 'white';

  const borderColor = isActive ? 'blue.400' : 'gray.200';
  const borderWidth = isActive ? '2px' : '1px';

  if (isEditing) {
    return (
      <Box
        width={CELL_WIDTH}
        height={CELL_HEIGHT}
        flexShrink={0}
        position="relative"
      >
        <Input
          ref={inputRef}
          value={value.raw}
          onChange={e => onChange(e.target.value)}
          onBlur={() => onCommit(value.raw)}
          onKeyDown={e => {
            // Let Spreadsheet handle navigation keys — stop propagation for
            // keys we handle locally, pass the rest up.
            if (e.key === 'Escape') {
              e.stopPropagation();
              onCancel();
            }
            // Enter, Tab, Shift+Enter, Shift+Tab, ArrowUp, ArrowDown
            // are handled by the Spreadsheet onKeyDown — don't stop them.
          }}
          size="sm"
          borderRadius={0}
          borderColor={borderColor}
          borderWidth={borderWidth}
          bg={bg}
          height={CELL_HEIGHT}
          width={CELL_WIDTH}
          px={2}
          textAlign={numeric ? 'right' : 'left'}
          fontFamily="mono"
          fontSize="sm"
          _focus={{ boxShadow: 'none', borderColor: 'blue.400', borderWidth: '2px' }}
        />
      </Box>
    );
  }

  return (
    <Box
      width={CELL_WIDTH}
      height={CELL_HEIGHT}
      flexShrink={0}
      bg={bg}
      borderWidth={borderWidth}
      borderColor={borderColor}
      px={2}
      display="flex"
      alignItems="center"
      justifyContent={numeric ? 'flex-end' : 'flex-start'}
      cursor="default"
      userSelect="none"
      onClick={onActivate}
      fontFamily="mono"
      fontSize="sm"
      color={value.display === '' ? 'transparent' : 'gray.800'}
      overflow="hidden"
      whiteSpace="nowrap"
    >
      {value.display || '\u00A0' /* non-breaking space to maintain row height */}
    </Box>
  );
};

export default Cell;
```

**Step 2: Verify app compiles and basic grid renders**

```bash
yarn dev
```

Open browser at http://localhost:3000. You should see:
- A 10×10 grid with column headers (A–J) and row headers (1–10)
- Clicking a cell focuses it with a blue border and shows an input
- Alternating row stripes (subtle gray/white)

**Step 3: Commit**

```bash
git add src/components/Cell.tsx
git commit -m "feat: Cell component with display/edit modes and financial alignment"
```

---

## Task 4: Keyboard navigation in Spreadsheet

**Files:**
- Modify: `src/components/Spreadsheet.tsx`

**Step 1: Add keyboard navigation handler**

Add this helper and handler to `Spreadsheet.tsx`. Insert the helpers before the `return` statement and wire up `onKeyDown` on the outer `Box`:

First, add these helpers inside the component (after the state declarations):

```typescript
  // --- Navigation helpers ---

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const move = (rowDelta: number, colDelta: number, commitRaw?: string) => {
    if (!activeCell) return;
    const { row, col } = activeCell;

    // Commit current edit if there is one
    if (editingCell && commitRaw !== undefined) {
      commitCell(editingCell.row, editingCell.col, commitRaw);
    } else {
      setEditingCell(null);
    }

    // Calculate next position
    let nextRow = clamp(row + rowDelta, 0, NUM_ROWS - 1);
    let nextCol = clamp(col + colDelta, 0, NUM_COLUMNS - 1);

    // Tab wraps: last col → first col of next row
    if (colDelta === 1 && col === NUM_COLUMNS - 1 && nextRow < NUM_ROWS - 1) {
      nextRow = row + 1;
      nextCol = 0;
    }
    // Shift+Tab wraps: first col → last col of prev row
    if (colDelta === -1 && col === 0 && row > 0) {
      nextRow = row - 1;
      nextCol = NUM_COLUMNS - 1;
    }

    setActiveCell({ row: nextRow, col: nextCol });
  };

  const enterEditMode = (row: number, col: number, initialChar?: string) => {
    setActiveCell({ row, col });
    setEditingCell({ row, col });
    if (initialChar !== undefined) {
      // Replace cell content with the typed character
      setGrid(draft => {
        draft[row][col].raw = initialChar;
      });
    }
  };

  const currentRaw = editingCell
    ? grid[editingCell.row][editingCell.col].raw
    : '';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!activeCell) return;
    const { row, col } = activeCell;

    if (isEditing(row, col)) {
      // --- Edit mode ---
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            move(-1, 0, currentRaw);
          } else {
            move(1, 0, currentRaw);
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            move(0, -1, currentRaw);
          } else {
            move(0, 1, currentRaw);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          move(-1, 0, currentRaw);
          break;
        case 'ArrowDown':
          e.preventDefault();
          move(1, 0, currentRaw);
          break;
        case 'Escape':
          // Handled by Cell's own onKeyDown — cancel edit, restore value
          break;
        default:
          // Let the input receive the character
          break;
      }
    } else {
      // --- Navigation mode ---
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          move(-1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          move(1, 0);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          move(0, -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          move(0, 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            move(-1, 0);
          } else {
            enterEditMode(row, col);
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            move(0, -1);
          } else {
            move(0, 1);
          }
          break;
        case 'Backspace':
        case 'Delete':
          e.preventDefault();
          setGrid(draft => {
            draft[row][col] = { raw: '', display: '' };
          });
          break;
        default:
          // Printable character: enter edit mode, replace cell content
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            enterEditMode(row, col, e.key);
          }
          break;
      }
    }
  };
```

Then update the outer `Box` to wire up the handler and click-outside behavior:

```typescript
  return (
    <Box
      width="full"
      outline="none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        // If click target is the container itself (not a cell), commit and deselect
        if (e.target === e.currentTarget) {
          if (editingCell) commitCell(editingCell.row, editingCell.col, currentRaw);
          setActiveCell(null);
          setEditingCell(null);
        }
      }}
    >
```

**Step 2: Fix Escape handling — add previousRaw ref**

The cancel/escape flow needs the previous value. Add a ref to track it:

```typescript
  const previousRawRef = useRef<string>('');

  // Update previousRaw whenever we enter edit mode
  const enterEditMode = (row: number, col: number, initialChar?: string) => {
    previousRawRef.current = grid[row][col].raw; // save before entering edit
    setActiveCell({ row, col });
    setEditingCell({ row, col });
    if (initialChar !== undefined) {
      setGrid(draft => {
        draft[row][col].raw = initialChar;
      });
    }
  };
```

And update the Cell's `onCancel` prop in the JSX to restore the previous value:

```typescript
              onCancel={() => {
                setGrid(draft => {
                  draft[rowIdx][colIdx].raw = previousRawRef.current;
                });
                setEditingCell(null);
              }}
```

Add `useRef` to the React import at the top of Spreadsheet.tsx:
```typescript
import React, { useRef } from 'react';
```

**Step 3: Verify keyboard navigation**

```bash
yarn dev
```

Test these flows manually:
- Click a cell → blue ring appears, input is focused
- Type a number like `1234567` → Enter → cell shows `1,234,567`
- Type `$500000` → Enter → cell shows `$500,000`
- Arrow keys move between cells
- Tab moves right, Shift+Tab moves left
- Escape while editing restores the previous value

**Step 4: Commit**

```bash
git add src/components/Spreadsheet.tsx
git commit -m "feat: keyboard navigation — nav mode, edit mode, Tab/Enter/Escape/arrow keys"
```

---

## Task 5: Polish — App layout, heading, and README

**Files:**
- Modify: `src/components/App.tsx`
- Create: `README.md` (replace existing)

**Step 1: Update App.tsx for a polished layout**

Replace `src/components/App.tsx`:

```typescript
import { ChakraProvider, Box, Heading, Text } from '@chakra-ui/react';
import React from 'react';

import Spreadsheet from 'components/Spreadsheet';

const App: React.FC = () => {
  return (
    <ChakraProvider resetCSS>
      <Box minH="100vh" bg="gray.50" p={8}>
        <Box maxW="1000px" mx="auto">
          <Heading size="md" mb={1} color="gray.800">
            Financial Spreadsheet
          </Heading>
          <Text fontSize="sm" color="gray.500" mb={6}>
            Click a cell to edit. Use arrow keys, Tab, and Enter to navigate.
          </Text>
          <Box
            bg="white"
            borderRadius="md"
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.200"
            overflow="hidden"
            display="inline-block"
          >
            <Spreadsheet />
          </Box>
        </Box>
      </Box>
    </ChakraProvider>
  );
};

export default App;
```

**Step 2: Write README.md**

Replace the existing `README.md` at the project root:

```markdown
# Financial Spreadsheet

A 10×10 spreadsheet editor designed for financial data entry, built with Next.js, React, and TypeScript.

## Running the project

### Install dependencies

\`\`\`bash
yarn install
\`\`\`

### Start the development server

\`\`\`bash
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

---

## Implementation notes

### What I focused on

**Financial formatting and UX polish.** The prompt asked for a tool "intended for displaying financials" — so I treated formatting as a first-class feature rather than an afterthought. Numbers auto-format with thousands separators on commit. Prefixing with `$` triggers currency formatting. Alignment is automatic: numbers right-align, text left-aligns — a standard financial table convention that makes columns scannable.

**Keyboard navigation that feels native.** Anyone who has used Excel or Google Sheets expects Tab, Enter, arrow keys, and Escape to behave in a specific way. I implemented spreadsheet-standard behavior: Enter commits and moves down, Tab commits and moves right, Shift+Tab/Shift+Enter reverse those, typing any character from navigation mode enters edit mode immediately (replacing the cell contents), and Escape restores the previous value.

**Clean architecture for extensibility.** Formatting logic lives in a pure utility (`src/utils/format.ts`) — easy to extend with new rules. Cell state uses a `{ raw, display }` shape that separates stored value from rendered value — the right foundation for formulas, percentages, or custom formats.

### Key assumptions and product decisions

- **Auto-format on commit, not on keystroke** — formatting during typing is distracting. The cell shows raw input while editing, formatted output after committing.
- **`$` prefix convention** — `$1234` → `$1,234`. Simple, discoverable, no format menu needed.
- **Click-to-edit directly** — clicking a cell enters edit mode immediately. Finance users expect to click and type, not click-then-press-Enter.
- **Monospace font for cells** — column alignment is easier to read at a glance when digit widths are consistent.

### Trade-offs

- **No formula engine** — adding `=A1+B2` support would require a parser, dependency graph, and circular reference detection. That's a substantial feature; the prompt asked for polish over breadth.
- **Fixed column widths** — a real tool would allow column resizing. Fixed widths kept the layout code simple and the grid uniform.
- **No persistence** — local state only, as specified in the prompt.

---

## Future improvements

- **Formula evaluation** — parse `=` expressions with cell references and arithmetic (`=A1+B2`, `=SUM(A1:A5)`)
- **Range selection** — Shift+Arrow to select a range, then bulk-delete or copy/paste
- **Single textarea architecture** — replace per-cell inputs with a single hidden textarea and div-rendered cells for better performance and finer keyboard control
- **Column resizing** — drag column header borders to resize
- **Copy/paste** — clipboard-aware paste that splits TSV/CSV content across cells
- **Number format menu** — right-click or toolbar to set currency, percentage, or plain number format per cell
- **Negative number styling** — red text for negative values (standard finance convention)

---

## AI usage

This project was built with Claude Code (Anthropic). I used it throughout:

- **Design phase** — worked through architecture decisions collaboratively before writing any code: cell state shape, two-mode cell approach, keyboard navigation map
- **Implementation** — dispatched subagents per task with spec and quality review gates between tasks
- **Code review** — each task was reviewed for spec compliance and code quality before moving on

The core engineering judgment — what to build, what to skip, how to structure the components — was mine. Claude accelerated execution and caught edge cases I would have missed (e.g., the `--passWithNoTests` Vitest flag, controlled input behavior with user-event).

Session logs are included in the `ai-logs/` directory.
```

**Step 3: Verify final app appearance**

```bash
yarn dev
```

Check:
- App has a clean layout with heading and hint text
- Grid is contained in a card with shadow
- Column headers A–J visible, row headers 1–10 visible
- Row striping visible (alternating gray/white)
- Numbers right-align, text left-aligns after typing

**Step 4: Commit**

```bash
git add src/components/App.tsx README.md
git commit -m "feat: polish app layout and add README"
```

---

## Task 6: Final wiring — click outside to deselect, focus management

**Files:**
- Modify: `src/components/Spreadsheet.tsx`

**Step 1: Add click-outside handler on the page level**

The grid container's `onClick` handler already handles clicks on the container. But clicks outside the entire grid (on the page background) should also commit and deselect. Add a `useEffect` in Spreadsheet:

```typescript
  // Commit and deselect when clicking outside the grid
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const container = containerRef.current;
      if (container && !container.contains(e.target as Node)) {
        if (editingCell) {
          commitCell(editingCell.row, editingCell.col, grid[editingCell.row][editingCell.col].raw);
        }
        setActiveCell(null);
        setEditingCell(null);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [editingCell, grid]);
```

Add the ref and import:

```typescript
import React, { useRef, useEffect } from 'react';

// Inside the component:
const containerRef = useRef<HTMLDivElement>(null);
```

Wire the ref to the outer Box — Chakra's `Box` accepts a `ref` prop:

```typescript
<Box
  ref={containerRef}
  width="full"
  outline="none"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  ...
>
```

**Step 2: Verify click-outside behavior**

```bash
yarn dev
```

- Click a cell and start typing
- Click outside the grid → cell should commit and deselect (no more blue ring)

**Step 3: Final manual test pass**

Run through the full flow:
1. Type `1234567` → Enter → shows `1,234,567` ✓
2. Type `$999999` → Tab → shows `$999,999`, moves right ✓
3. Type `hello` → Enter → shows `hello`, left-aligned ✓
4. Type `-5000` → Enter → shows `-5,000` ✓
5. Arrow keys navigate ✓
6. Escape restores previous value ✓
7. Click outside deselects ✓
8. Row stripes visible ✓
9. Column/row headers visible ✓

**Step 4: Final commit**

```bash
git add src/components/Spreadsheet.tsx
git commit -m "feat: click-outside to commit and deselect"
```
