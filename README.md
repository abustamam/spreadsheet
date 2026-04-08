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
- **Click-to-edit directly** — clicking a cell selects a cell, and typing enters edit mode. Finance users expect to click and type, not click-then-press-Enter.
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

I used [GStack](https://github.com/garrytan/gstack) and [Obra Superpowers](https://github.com/obra/superpowers) to help me prepare for the exercise by preparing the codebase for rapid iteration (agentic harness).

GStack is a relatively new tool that I am honestly evaluating. It seems more suited towards making business decisions, which I think could be extremely helpful when we have the "vibes" for a new feature (users think they want X) but need to evaluate how it fits in with the rest of the product.

Obra Superpowers is a tool I have been using for quite some time. I give requirements (loose or detailed) and it will provide me 2-3 approaches, with pros and cons for each, and I select which one seems most reasonable. I didn't get an opportunity to show it in this app, but other times when I use it, the brainstorming phase is where I would validate assumptions the LLM made. When designing larger features/architectural slices, I use this as an opportunity to learn and explore. For example, recently it suggested we can use an event-driven architecture with outbox pattern for a vibe coded personal project. I wanted to learn more so I told it to explain to me how that pattern works, and why it's better than the alternative.

Even though tests were explicitly excluded from the submission instructions, having tests prevents the LLM from hallucinating code that does not work.

LLM usage accelerated execution and caught edge cases I would have missed (e.g., negative zero formatting, controlled input blur/escape race condition, column header alignment).

Session logs are included in the `ai-coding-exporter/exports/` directory.
