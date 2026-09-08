# Group 5 QA / Preview Steward

This branch owns QA evidence only. It must not edit product styling, planner state/drag logic, or access/auth behavior.

Required evidence:
- non-Vercel Vite build/preview
- populated Week at 1440x900, 1280x720, and 390x844
- Settings, Fridge, Task Bar closed/open/all-open states
- keyboard/a11y, reduced motion, zoom/reflow, overflow, runtime errors
- B01, B05/B06, B07 interaction gates

Classification vocabulary is fixed:
- visual Red
- functional Red
- infrastructure Red

A passing automated run is not an overall Green. The exact-head screenshot pack must still be visually compared against the canonical Arc architecture and approved asset references before release Green is permitted.
