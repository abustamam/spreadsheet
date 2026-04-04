# Interview Prep Roadmap

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up infrastructure (Vitest + Immer) before the interview prompt arrives, and maintain architectural briefs for likely feature areas so implementation starts fast when the prompt is received.

**Architecture:** Phases 1–2 are executable now (no prompt needed). Phases 3–6 are architectural briefs — decision records to adapt when the actual prompt arrives, not pre-built code.

**Tech Stack:** Next.js 14 (Pages Router), React 18, TypeScript, Chakra UI, Vitest, Immer

---

## Phase 1: Vitest Setup

### Task 1: Install Vitest and testing libraries

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

**Step 1: Install dependencies**

```bash
yarn add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

**Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      components: path.resolve(__dirname, './src/components'),
    },
  },
});
```

**Step 3: Create test setup file**

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

**Step 4: Add test scripts to package.json**

Add to `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

**Step 5: Run to verify setup works**

```bash
yarn test:run
```

Expected: `No test files found` (not an error — means config is valid)

**Step 6: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json yarn.lock
git commit -m "chore: add Vitest + Testing Library"
```

---

### Task 2: Write smoke tests for existing components

**Files:**
- Create: `src/components/Cell.test.tsx`
- Create: `src/components/Spreadsheet.test.tsx`

**Step 1: Write Cell smoke test**

Create `src/components/Cell.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Cell from './Cell';

describe('Cell', () => {
  it('renders the current value', () => {
    render(<Cell value="hello" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
  });

  it('calls onChange when the user types', async () => {
    const onChange = vi.fn();
    render(<Cell value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
```

**Step 2: Run and verify**

```bash
yarn test:run src/components/Cell.test.tsx
```

Expected: 2 tests pass

**Step 3: Write Spreadsheet smoke test**

Create `src/components/Spreadsheet.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import Spreadsheet from './Spreadsheet';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider>{children}</ChakraProvider>
);

describe('Spreadsheet', () => {
  it('renders a 10x10 grid', () => {
    render(<Spreadsheet />, { wrapper });
    const cells = screen.getAllByRole('textbox');
    expect(cells).toHaveLength(100);
  });
});
```

**Step 4: Run and verify**

```bash
yarn test:run src/components/Spreadsheet.test.tsx
```

Expected: 1 test passes

**Step 5: Commit**

```bash
git add src/components/Cell.test.tsx src/components/Spreadsheet.test.tsx
git commit -m "test: add smoke tests for Cell and Spreadsheet"
```

---

## Phase 2: Immer Setup

### Task 3: Install Immer and migrate Spreadsheet state

**Files:**
- Modify: `package.json`
- Modify: `src/components/Spreadsheet.tsx`

**Step 1: Install Immer**

```bash
yarn add immer use-immer
```

**Step 2: Update Spreadsheet to use useImmer**

In `src/components/Spreadsheet.tsx`, replace:

```typescript
// Before
import { useState } from 'react';
const [spreadsheetState, setSpreadsheetState] = useState(
  _.times(NUM_ROWS, () => _.times(NUM_COLUMNS, _.constant(''))),
);
```

With:

```typescript
// After
import { useImmer } from 'use-immer';
const [spreadsheetState, setSpreadsheetState] = useImmer(
  _.times(NUM_ROWS, () => _.times(NUM_COLUMNS, _.constant(''))),
);
```

Then simplify the onChange handler from:

```typescript
onChange={(newValue: string) => {
  const newRow = [
    ...spreadsheetState[rowIdx].slice(0, columnIdx),
    newValue,
    ...spreadsheetState[rowIdx].slice(columnIdx + 1),
  ];
  setSpreadsheetState([
    ...spreadsheetState.slice(0, rowIdx),
    newRow,
    ...spreadsheetState.slice(rowIdx + 1),
  ]);
}}
```

To:

```typescript
onChange={(newValue: string) => {
  setSpreadsheetState(draft => {
    draft[rowIdx][columnIdx] = newValue;
  });
}}
```

**Step 3: Run existing tests to verify nothing broke**

```bash
yarn test:run
```

Expected: all 3 tests still pass

**Step 4: Commit**

```bash
git add src/components/Spreadsheet.tsx package.json yarn.lock
git commit -m "refactor: use immer for immutable spreadsheet state updates"
```

---

## Phase 3: Architectural Brief — Cell Selection & Keyboard Navigation

> **Status:** BRIEF ONLY — implement when prompt is received.
> **Trigger:** Any prompt involving selection, navigation, or UX polish.

### Decision record

**State to add to Spreadsheet:**
```typescript
type CellPosition = { row: number; col: number };
const [activeCell, setActiveCell] = useImmer<CellPosition | null>(null);
```

**Two modes to implement:**
- **Navigation mode** — arrow keys move `activeCell`, Enter/F2 enters edit mode
- **Edit mode** — typing goes into cell input, Escape returns to nav mode, Enter commits and moves down, Tab commits and moves right

**Cell prop changes needed:**
```typescript
interface Props {
  value: string;
  onChange: (newValue: string) => void;
  isActive: boolean;           // highlight ring
  onActivate: () => void;      // click handler
}
```

**Keyboard handler lives in Spreadsheet** via `onKeyDown` on the wrapping `Box`.

**Edge cases to handle:**
- Arrow at grid boundary (clamp, don't wrap)
- Tab at last column → move to first cell of next row
- Shift+Tab for reverse
- Clicking a cell should set it active AND enter edit mode immediately

**Test first:**
```typescript
it('arrow keys move the active cell', ...)
it('Tab moves to next column', ...)
it('Enter commits and moves down', ...)
it('Escape cancels edit and restores previous value', ...)
```

---

## Phase 4: Architectural Brief — Formula Evaluation

> **Status:** BRIEF ONLY — implement when prompt is received.
> **Trigger:** Any prompt involving formulas, `=` expressions, or computed values.

### Decision record

**Richer cell state (requires changing the grid type):**
```typescript
type CellValue = {
  raw: string;        // what the user typed: "=A1+B2" or "42"
  display: string;    // what to show: "84" or "#REF!"
  error?: string;     // "Circular reference" etc.
};

// In Spreadsheet:
useImmer<CellValue[][]>(
  _.times(NUM_ROWS, () =>
    _.times(NUM_COLUMNS, _.constant({ raw: '', display: '' }))
  )
)
```

**Formula detection:** if `raw.startsWith('=')`, evaluate; else `display = raw`.

**Evaluation approach (build, don't import):**
1. Parse cell refs: `A1` → `{ col: 0, row: 0 }`
2. Replace refs with current cell values
3. Evaluate arithmetic with `Function('return ' + expr)()`  — safe for an interview, note the limitation
4. Wrap in try/catch → set `error` on failure

**Functions to support (start minimal):**
- `=A1+B2` arithmetic
- `=SUM(A1:A3)` range function
- `=IF(A1>0, "pos", "neg")` conditional

**Circular reference detection:** track a `visiting: Set<string>` during evaluation; if you see a cell you're already evaluating, return `#CIRC!`.

**Dependency tracking for reactivity:** when a cell changes, find all cells whose `raw` references it and re-evaluate them. Simple: re-evaluate the whole grid on every change (fine for 10×10).

**Test first:**
```typescript
it('displays raw value for non-formula cells', ...)
it('evaluates =A1+B2 correctly', ...)
it('shows #REF! for out-of-bounds references', ...)
it('shows #CIRC! for circular references', ...)
it('SUM(A1:A3) sums a range', ...)
```

---

## Phase 5: Architectural Brief — Data Visualization

> **Status:** BRIEF ONLY — implement when prompt is received.
> **Trigger:** Any prompt involving charts, graphs, or visualization.

### Decision record

**Library:** Add `recharts` — well-known, React-native, minimal setup.

```bash
yarn add recharts
yarn add -D @types/recharts  # if needed
```

**UX approach (keep it simple):**
1. User selects a range of cells (needs active cell / multi-select from Phase 3)
2. A "Chart" button appears in a toolbar
3. Clicking opens a `ChartPanel` component next to the grid
4. Default to `BarChart`; toggle to `LineChart`

**Data shape:** selected column = X axis labels, adjacent column = values.

**State to add to Spreadsheet:**
```typescript
type CellRange = { start: CellPosition; end: CellPosition };
const [selectedRange, setSelectedRange] = useImmer<CellRange | null>(null);
const [showChart, setShowChart] = useImmer(false);
```

**Component to create:** `src/components/ChartPanel.tsx`

**Test first:**
```typescript
it('derives chart data from selected range', ...)
it('renders a bar chart with correct data points', ...)
```

---

## Phase 6: Architectural Brief — Collaboration

> **Status:** BRIEF ONLY — implement when prompt is received.
> **Trigger:** Any prompt involving comments, presence, or multi-user.

### Decision record

**Scope for 2-hour exercise:** real-time WebSockets are out of scope. Build the UI and state; stub the transport.

**Two most likely sub-features:**

**A) Cell comments:**
```typescript
type Comment = { author: string; body: string; createdAt: string };
type CommentsMap = Record<string, Comment[]>; // key: "row/col"

const [comments, setComments] = useImmer<CommentsMap>({});
```
- Cell shows a small indicator dot if it has comments
- Clicking the indicator opens a `CommentThread` popover (Chakra `Popover`)
- Add comment form in the popover

**B) User presence (active cell indicators):**
```typescript
type RemoteUser = { id: string; name: string; color: string; activeCell: CellPosition };
// Stub: hardcode 1-2 fake users for the demo
const [remoteUsers] = useState<RemoteUser[]>([
  { id: '2', name: 'Alex', color: '#E53E3E', activeCell: { row: 2, col: 3 } },
]);
```
- Show colored border on cells where remote users are active
- Show avatar badges at the top

**If WebSockets are required:** use a stub `useCollaboration()` hook that emits/receives from a mock transport. Keeps the component layer clean regardless of real vs fake transport.

**Test first:**
```typescript
it('shows comment indicator on cells with comments', ...)
it('opens comment thread on indicator click', ...)
it('adds a comment correctly', ...)
```
