# Financial Spreadsheet

A 10×10 spreadsheet editor designed for financial data entry, built with Next.js, React, and TypeScript.

## Running the project

### Install dependencies

```bash
yarn install
```

### Start the development server

```bash
yarn dev
```

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

The core engineering judgment — what to build, what to skip, how to structure the components — was mine. Claude accelerated execution and caught edge cases I would have missed (e.g., negative zero formatting, controlled input blur/escape race condition, column header alignment).

Session logs are included in the `ai-logs/` directory as specified in the submission instructions.
