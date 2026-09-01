# Arc workspace reconstruction checkpoint

This branch is the only active reconstruction lane.

Implemented in this checkpoint:
- canonical Unit/Lesson tree movement, nesting, detaching, deletion and Fridge movement;
- hierarchy-preserving cross-view clipboard targets;
- Fridge object model for Idea, Note, Lesson and Unit;
- red-circle / cross-out / remove priority states and plan linking;
- Tack, Extend +1 instructional day, Copy next, week reuse, quarter checkpoints;
- full-screen desktop workspace shell with attached folder tabs that push/reflow the calendar;
- calendar-owned horizon navigation;
- one collapsible Must/Should/Could surface;
- drag-time Trash target with Undo through workspace history;
- six calendar horizons including Year mini-months with quarter bands and elapsed-school-day X treatment;
- lightweight in-context Magnet Details / Unit Focus editor;
- persisted landing view and content/class filter preferences;
- Save now and Cmd/Ctrl-S local-save path.

Still release-blocking:
- authenticated account persistence / Drive mirror and two-account isolation;
- full Shift collision preflight and schedule-specific A/B/block rules;
- stronger Semester direct manipulation;
- browser/device rendered verification and accessibility testing;
- school calendar source-backed lookup/upload extraction end-to-end;
- final visual QA at smaller laptop/200% zoom;
- Sub Plans / Student Leaders remain later product families by current canonical spec.

No production deployment is authorized from this branch.
