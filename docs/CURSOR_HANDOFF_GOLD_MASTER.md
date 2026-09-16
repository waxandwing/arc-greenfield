# Arc Gold Master → Cursor Handoff Contract

## Purpose
This handoff is for implementation hardening, not redesign.

Cursor should treat these authorities in this order:
1. **DAEDYLUS Gold Handoff Authority frames** — visual/interface authority.
2. **v23.3 recovered planner composition** — comprehension and planning-surface authority.
3. **Greenfield code/data model** — behavior and data authority.
4. **Arc Family Master Visual Brand System** — brand, product-family, material, and terminology authority.

## Non-negotiable product rule
If preserving a Greenfield capability makes the visible interface materially more complicated, hide or contextualize the capability instead of deleting it.

The brain stays deep. The planner stays calm.

## Do not redesign
Cursor must not:
- invent a new navigation model;
- introduce generic SaaS cards, dashboard chrome, glassmorphism, or productivity-app furniture;
- reintroduce the old Fridge as literal furniture;
- use green as the dominant focal color throughout Arc;
- substitute ArcTable branding for Arc branding;
- refer to the mobile product as Arc Pocket. The product is **ArcPal**; **Pocket** is a surface inside ArcPal;
- turn ArcTable into a generic remote-control grid;
- add decorative floral/botanical elements;
- shrink text to solve overflow;
- make drag the only way to move essential planning objects;
- remove Greenfield behavior because it is not visible in the simplified shell.

## Required visible hierarchy
### Arc desktop
- Planner/calendar is the dominant object.
- Day / Week / Month / Quarter / Year remain legible and predictable.
- v23.3 class-row week composition is the baseline for Week.
- Ideas / To-Do / Shift / More remain secondary edge/context tools.
- ArcTable appears as **Live · ArcTable**, not as part of the Arc logo.
- ArcPal is a family access point, not another planner view.

### ArcPal
- Mobile-native composition.
- Persistent destinations: **Today · Plan · Add · Pocket · Live**.
- Today is class-first.
- Pocket is undated/unassigned capture, not inbox-zero task software.
- Live is the mobile second-screen companion to ArcTable.

### ArcTable
- Live teaching mode.
- Current instructional context appears before controls.
- Previous / Next / Coming up use actual activity names.
- Timer + cleanup + directions + blank screen + end class remain immediately usable.
- Returning to Arc restores teaching/planning context.

## Brand materials
Family palette authority:
- Paper `#F7F0E3`
- Deep Paper `#EEE9DC`
- Ink `#2B251D`
- Muted Ink `#756B5C`
- Terracotta `#E36F52`
- Powder Blue `#8DB5C4`
- Forest `#3C5B32`
- Mustard `#D9A551`

Use color as identification/state, not decoration. Green is one supporting family color, not the overall shell.

Tactility should come from:
- paper tone;
- restrained texture;
- editorial typography;
- thin rules;
- carefully controlled layering;
- occasional authored marks with semantic roles.

Tactility should **not** come from fake furniture, excessive sticky-note rotation, repeated tape, floral doodles, or heavy shadows.

## Typography / containment rules
- Never solve density by shrinking functional text below its approved floor.
- Calendar titles must remain readable on a 1280×800 laptop.
- Mobile body/input text should remain 16px or greater where it is primary reading/input content.
- Metadata may be 13–14px on mobile only at strong contrast.
- Every bounded text object must wrap, clamp, scroll, or truncate intentionally.
- No text may visually leave its card, panel, button, rail, header, or viewport.
- Test at browser/text scale 100%, 125%, 150%, and 200%.
- Test long lesson names, unit names, class names, event names, and localized strings.

## Scroll contract
Desktop Arc:
- Browser page should remain stable.
- Main calendar/planner scrolls vertically **inside its frame** when schedules become dense.
- Secondary rail/tool regions may scroll independently when required.
- Avoid nested scroll traps.
- Sticky headers/labels may be used where they improve orientation.

Mobile:
- Return to natural document flow rather than forcing desktop scroll behavior.

## Greenfield behavior that must remain intact
- Course → Section → Unit → Lesson relationships.
- Shared course plan with section-level divergence.
- Taught-history protection.
- Fixed-date protections.
- Shift preview and consequence logic.
- Undo/recovery safeguards.
- Unfinished-lesson recovery.
- Quick Capture.
- Ideas persistence/grouping.
- Must / Should / Could priority metadata.
- School-calendar intelligence.
- Import/reuse.
- ArcTable continuity.
- ArcPal synchronization.
- Offline/local resilience.
- Keyboard/non-drag alternatives.

## Recovery language
Prefer teacher language over implementation language.

Examples:
- “Period 6 fell behind.”
- “12 minutes unfinished.”
- “Rejoin shared plan.”
- “Friday assessment stays fixed.”
- “Past teaching history stays.”

Avoid exposing internal terms such as divergence graphs, cascade operations, record branches, or synchronization internals unless in diagnostics.

## Cursor nitpick pass
After Figma is locked, Cursor should fix implementation mismatches including:
- 1–4px alignment errors;
- font metric differences;
- clipped text;
- flex/grid min-width issues;
- long-string overflow;
- z-index problems;
- scroll-container math;
- focus-visible states;
- hover/pressed/selected states;
- browser zoom behavior;
- responsive breakpoints;
- tablet/mobile safe-area behavior;
- projector readability in ArcTable;
- actual icon alignment;
- visible scrollbars where needed;
- text wrapping vs truncation decisions;
- duplicate or misleading state labels;
- hidden dev/QA chrome.

## Required verification before handoff complete
1. Build passes.
2. Typecheck passes.
3. Gold Master smoke suite passes.
4. Layout-rigor suite passes.
5. Gold handoff authority suite passes.
6. Screenshots generated for all authority states.
7. Week tested at 1440×1024, 1280×800, 1100×760, and 1024×768.
8. ArcPal tested at 430×900 and narrower common phone widths.
9. 200% text scaling does not clip core content.
10. Keyboard-only path works for core planning actions.
11. No accidental page-level horizontal overflow.
12. Main desktop calendar remains internally scrollable.
13. No stale “Arc Pocket” or “Easel” product language.
14. Arc / ArcPal / ArcTable identity is correct on every surface.
15. No Greenfield capability is silently lost during visual simplification.

## Final release test
A veteran teacher should be able to answer, without tutorial copy:
- Where am I?
- What am I teaching next?
- What changed?
- What will move if I change this?
- What stays fixed?
- How do I recover?
- How do I get back to Today?

A control is acceptable only when its job, state, and consequence are clear.