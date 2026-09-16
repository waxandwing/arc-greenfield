# Overnight / agent docs index

## Behavior contract (active)

While visual fidelity and desk-asset work continue, treat this as the **UI behavior contract**:

**[`ARC-HARD-UI-AUDIT-INTUITIVE-HELPFUL-2026-09-15.md`](./ARC-HARD-UI-AUDIT-INTUITIVE-HELPFUL-2026-09-15.md)**  
Commit on `main`: `88c9fef` · Kelly hard UI pass (intuitive + helpful)

**Standard:** not “does this look polished?” — **can a tired teacher use Arc correctly without first learning Arc’s internal logic?**

**North star:** Arc should feel simpler than the work it is managing.

Do not ship UI behavior changes that fail the six teacher scenarios below (even if pixels improve).

### Acceptance checks — six teacher scenarios

| ID | Scenario | Must succeed |
|----|----------|--------------|
| A | **7:25 AM open** | Today obvious; first/current class easy; no admin interrupt; Start class from same surface |
| B | **Hallway thought** | Capture in seconds; no date/class required; visibly saved; later sorting obvious |
| C | **Assembly kills period 3** | Move lessons; preview no-school skip; preserve sequence; immediate Undo |
| D | **Planning period** | Ideas + to-dos accessible; planner stays context; drag idea into plan without model switch |
| E | **Accidental furniture edit** | Edit mode unmistakable; lessons ≠ furniture; obvious exit; no work lost |
| F | **Where did that go?** | Recent move/capture findable; Undo/recovery; nothing silently vanishes |

Full scenario detail and P0/P1 requirements live in the audit doc.

### Prioritized backlog stub (do not implement wholesale here)

Derived from the audit’s biggest problems — gate visual PRs against these:

1. **Ownership** — planner / Ideas / To-dos / Capture / Start Class / Settings each have one self-evident job
2. **Capture thought-first** — type → save; categorize later; destination visible
3. **Move trust** — destination react + in-context confirm + immediate Undo
4. **Desk-edit vs lesson-move** — modes cannot be confused
5. **Week hierarchy** — teaching sequence outranks chrome
6. **Today / current / selected** — one grammar, three related-but-distinct treatments
7. **Nav recovery** — always answer “how do I get back to Week?”
8. **Micro-action pruning** — primary + contextual; no permanent action strip on every object
9. **Drawer contract** — same open/close/Escape/focus return across utilities
10. **Visible automation** — preview large changes; never silent multi-lesson moves

Repair sequence order matches the audit (§ Recommended repair sequence).

## Related visual / build docs

- Queue: [`AGENT-WORK-QUEUE.md`](./AGENT-WORK-QUEUE.md)
- Visual north star: [`MASTER-DESK-VISUAL-GOAL.md`](./MASTER-DESK-VISUAL-GOAL.md)
- Audit ↔ build loop: [`ARC-BUILD-AUDIT-LOOP.md`](./ARC-BUILD-AUDIT-LOOP.md)
- Desk surface authority: [`DESK-SURFACE-AUTHORITY.md`](./DESK-SURFACE-AUTHORITY.md)
