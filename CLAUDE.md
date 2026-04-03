# Interview Coding Principles

This is a take-home exercise for Runway — a collaborative business planning platform (think "Figma for finance"). Their bar is: **best way since Excel to model your business**. Build accordingly.

## What Runway is evaluating

From their JD, they want to see:
1. **Ownership mindset** — make real architectural decisions, don't just implement the minimum spec
2. **High-quality products, built fast** — polished UX + iterative, shippable increments
3. **React/TypeScript expertise** — proper types, no `any`, idiomatic hooks and component design
4. **Raises the bar** — "wow" factor, UX that delights rather than just works
5. **Collaborative clarity** — code that communicates intent; easy for teammates to extend

## Coding principles

### TypeScript
- No `any`. Use proper types everywhere, including event handlers and state shapes.
- If cell data gets more complex than `string`, define a named type (e.g., `CellValue`) rather than inlining unions.
- Prefer `interface` for props; prefer `type` for unions and computed types.

### React
- State lives at the right level — grid-wide state in `Spreadsheet`, display-only logic in `Cell`.
- Use `useCallback` and `useMemo` when passing callbacks or computing derived data in render — this app renders 100 cells; unnecessary re-renders will be visible.
- New cell behaviors → add typed props to `Cell`. New grid behaviors → add state/handlers to `Spreadsheet`.
- Don't reach for `useEffect` when derived state or event handlers suffice.

### UX quality bar
- Keyboard navigation should feel native (arrow keys, Tab, Enter to commit, Escape to cancel).
- Active/selected state should be visually clear — Runway builds data-dense UIs; affordances matter.
- Transitions and focus management should feel fluid, not janky.
- If building formula support: show clear error states (e.g., `#ERR` in cell, tooltip on hover).

### Performance awareness
- Runway's roadmap explicitly mentions "millions of rows." Show you're thinking about it:
  - Avoid re-rendering the whole grid on every keystroke — derive only what changed.
  - If adding computed/formula cells, memoize evaluated values.
  - Don't block the main thread with synchronous formula evaluation on large ranges.

### Code clarity
- Small, focused components. If `Cell` grows beyond ~60 lines, it probably needs splitting.
- Name things for what they represent in the domain: `cellValue`, `formulaResult`, `activeCell` — not `data`, `val`, `thing`.
- Co-locate types with the components that own them.

### Chakra UI
- Already configured — use it. Don't introduce inline styles or a second styling approach.
- For custom interactions (e.g., selected cell highlight), use Chakra's `sx` prop or extend the theme rather than raw CSS.

## What "raising the bar" looks like here

Runway values people who "scrap the status quo and push yourself to create something that wows." In a spreadsheet exercise, that means:
- Smooth keyboard UX (feels like a real spreadsheet, not a form)
- Thoughtful error handling (invalid formulas, circular refs, etc.)
- Visual polish (selection highlights, hover states, focus rings)
- Extensible data model (future-proof cell type design)

Don't gold-plate everything — ship iteratively — but pick one area to go genuinely deep and make it excellent.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
