# Ruthless audit gate

A source/type/test pass is only a prerequisite. It is never a release-readiness score.

This gate is evaluated against the current Phase 0 Baseline Lock and the Arc R&D / Implementation Merge Blueprint. Every scored finding should trace to an A2K rule, acceptance scenario, metric, or release gate.

Required before Arc external beta:
- zero dead primary controls or false affordances;
- zero silent clipping/disappearing plans;
- 100% Unit-tree integrity across move/cut/copy/paste/Fridge/delete/Undo;
- calendar remains the dominant product canvas; no competing dashboard or forced tutorial (A2K-DEC-012 / A2K-GATE-002 / A2K-PRN-002);
- Week, Month and Quarter are editing surfaces, not read-only projections;
- all critical drag workflows have complete non-drag/keyboard alternatives using the same operation semantics (A2K-A11Y-001);
- focus remains visible and returns to the initiating/destination object after consequential actions;
- normal desktop planning occupies one viewport with no document scrolling;
- 200% zoom keeps essential controls reachable and permits intentional internal canvas scrolling;
- forced-colors/high-contrast and reduced-motion states preserve hierarchy, selection, movement preview, and recovery;
- VoiceOver/Safari and NVDA/Chrome manually complete the core planning and movement scenarios before accessibility parity can be called complete;
- contextual Help/Getting to Know Arc is optional, keyboard reachable, independently reopenable, and never blocks the calendar;
- help marks and first-time explanations may be disabled without removing global Help;
- folders push/reflow the calendar without covering the Arc logo or primary calendar controls;
- clicking a magnet opens in-context editor without changing planning horizon;
- Fridge, calendar and Must/Should/Could object relationships are reversible;
- drag Trash is recoverable through Undo;
- school-calendar truth drives Shift/Tack/Extend and Year Map;
- movement consequences are previewable before consequential commits as the movement engine matures (A2K-MOV-002 / A2K-GATE-003);
- exact rendered checks cover approved Arc branding and shell states at 1728, 1440, 1366, 1280, 200% zoom, and high-contrast/reduced-motion conditions;
- authenticated save/hard reload, reconnect and account isolation verification;
- private/family/personal/reflection data does not leak into shared/export/Easel surfaces before whole-life calendar features can ship (A2K-GATE-005);
- no cloud, AI, district lookup, import, or synchronization control may imply capability that is not actually durable and verified.

Objective gate:
- TypeScript/typecheck: 100% pass;
- behavioral/unit tests: 100% pass;
- production build: 100% pass;
- required rendered browser checks: 100% pass;
- core scripted teacher tasks: 100% success;
- overall scripted interaction success: >=95%;
- zero critical blockers and zero known repeated defects;
- core workflows have complete non-drag alternatives;
- approved shell/brand regression: pass.

Simulated panel threshold (never represented as human research):
- 15 varied teacher personas + 15 UI/product/accessibility expert personas;
- UI professional mean >= 92/100; no individual below 85;
- teacher unaided task success >= 95%; core planning loop 100%;
- teacher mean >= 92/100; no individual below 85;
- teacher return intent >= 4.6/5;
- at least 24/30 five-star-equivalent ratings;
- zero critical blockers;
- repeated failure across 3+ personas becomes Must Do and resets the audit cycle.

A green automated suite does not override a failed visual, teacher-comprehension, privacy, focus, or screen-reader gate.
