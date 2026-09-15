# Handback — Quick jot / post-it sticky restored

**Audience:** Kelly + ArcBuild audit  
**Product branch:** `main`

## Where they are (answer for Kelly)

Quick jot post-its live on the **desk wood, upper-right** — not in a chat widget:

| Layer | Location |
|-------|----------|
| Component wrapper | `src/components/DeskQuickCaptureSticky.tsx` (`data-testid="arc-desk-quick-capture"`) |
| Affordance | `src/components/GlobalCaptureAffordance.tsx` (`data-testid="global-capture-trigger"`) |
| Wired in | `src/components/AppFrame.tsx` → `deskQuickCapture` on `B01Furniture` when `deskEnabled && globalCaptureEnabled` |
| Placement CSS | `src/styles/arc-desk.css` — `.arc-desk-surface … > .arc-desk-capture-sticky` (`right: 4.5%; top: 4%; z-index: 7`) |
| Sticky look | `.arc-desk-capture-sticky` yellow pad + quiet dashed `+ Capture` well |

Captures still land in **IDEAS / tray**; the sticky is the discoverable quick-jot entry.

## Why they were missing

Not prefs / `showQuickCapture`, and not an unrendered component. Pixel pass `b030b24` intentionally hid the wood sticky for Kelly-comp fidelity:

```css
.b01-furniture-composition--desk .arc-desk-capture-sticky {
  visibility: hidden;
  pointer-events: none;
  opacity: 0;
}
```

Smokes still found `global-capture-trigger` in the DOM (`count === 1`) while the sticky was invisible on screen.

## Fix

- Visibility restored on `main` in `05a1ecd` (Teaching week grid + SETTINGS pass also re-enabled the sticky)
- Quiet sticky trigger styling (dashed well, not blue chat pill)
- `test:arc-desk-pass` / figma evidence assert sticky + trigger **visible**
- Req #33 in `DESK-PIXEL-REQUIREMENTS.md` requires the wood sticky

## ArcBuild handback

- **Branch:** main
- **SHA:** `715d33717eaeeb5201cb012fb7dabd4ad7947cf2` (`715d337`) — sticky visibility asserts + handback
- **Current origin/main tip:** `7a968b5c4992f645a40fb8aac5f0dba88b3a60e3` (`7a968b5`)
- **Pushed:** yes — `origin/main` at `715d337`

### Requirements addressed
| Req | Status | Notes |
|-----|--------|-------|
| Restore visible quick jot sticky | DONE | Upper-right `DeskQuickCaptureSticky` |
| Document component + CSS | DONE | This handback |
| `test:arc-desk-pass` visibility | DONE | sticky + `global-capture-trigger` |

### Tests
| Command | Result |
|---------|--------|
| test:arc-desk-pass | PASS |
| test:contracts | PASS |
