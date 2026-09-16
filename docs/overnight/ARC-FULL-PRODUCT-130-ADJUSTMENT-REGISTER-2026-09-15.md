# Arc full-product UI gauntlet — 130 concrete adjustments

**Date:** 2026-09-15  
**Current audit base:** `main` around `0de0b693` plus current source reviewed in `ArcOnboarding`, `CalendarSetup`, `ClassSetup`, `TeachingDaySetup`, `SettingsFurnitureContent`, `DeskSetupSettings`, `PlanningWeekDayView`, `DeskQuickCaptureSticky`, `B01Furniture`, `DeskGreenFoldersDrawer`, `DeskTodosFolder`, `ArcTableSurfaces`, and existing UX tests.

## Progress (overnight / integration)

**Slice landed:** first repair wave — comprehension nouns + onboarding P0 entry (branch `cursor/register-130-first-wave-32a6`).

| Register # | Status | Notes |
|---|---|---|
| 1 | done | Welcome CTA → **Set up my school year** |
| 2 | done | One-sentence path outcomes under CTAs |
| 3 | done | Minimal path is a real button: **Just set my school year** |
| 4 | done | Welcome body shortened; day-one reassurance near paths |
| 5 | done | Step rail: School year → Courses → Teaching day → Done |
| 8 | done | Import dependency callout on calendar stage |
| 12 | done | Back uses destination labels |
| 66 / 86 | done | User-facing **Tray** → **IDEAS** (labels/empty/settings/help) |
| 69 / 70 | done | **Open Arc to** + Year absence explained |
| 73 | done | Planner shown as fixed text, not disabled checkbox |
| 74 / 76 | done | Show-on-desk labels match objects; Day notes |
| 121 | done | Prefix syntax demoted to optional Help; blank sticky stays Enter→IDEAS |
| 136–138 / 141 | done | **Arrange desk** band, IDEAS/To-dos size labels, **Reset desk layout** |
| 137 | done | Exit remains **Done arranging** |
| 101 | already | Whole lesson object opens (prior gauntlet Pass 1) |
| 88 / 89 / 90 | already | Dead prev/next removed; search scoped; Enlarge → Open |
| Rest of register | open | See sections below; do not boil the ocean |

---

## How to read this register

This is not a wish list. Each item is a concrete UI debt item. `P0` means it can cause misunderstanding, wrong action, lost orientation, or broken recovery. `P1` means recurring friction or unnecessary cognitive load. `P2` means trust, accessibility, polish, or consistency debt.

Where an item describes current behavior, it is source-derived from the current implementation. Where it prescribes a change, it is an audit recommendation based on the product goal: **Arc should feel like the teacher already knew how to use it.**

---

## A. Onboarding / first-run experience

1. **P0 — Welcome CTA mismatch.** ~~`Set up my teaching day` sends the user first to Calendar Setup.~~ **DONE:** renamed to **Set up my school year**.
2. **P0 — Three first-run choices are not cleanly differentiated.** ~~need one-sentence outcome descriptions~~ **DONE:** path outcomes list under CTAs.
3. **P1 — “Start simple” is an anchor link, not a first-class path.** ~~Make it a real button~~ **DONE:** **Just set my school year** button with `intent: 'simple'`.
4. **P1 — Welcome copy is too dense before first action.** **DONE:** shortened; reassurance near paths.
5. **P0 — Onboarding lacks visible step count/state.** **DONE:** `School year → Courses → Teaching day → Done` rail.
6. **P1 — “School year” and “Calendar” are used as overlapping concepts.** Pick one user-facing label and use it in onboarding, Settings, setup nav, and validation.
7. **P1 — `calendar` onboarding stage is labeled “School year” elsewhere.** Remove implementation-stage naming inconsistency from user-visible breadcrumbs.
8. **P0 — Import path requires calendar first but the dependency is only explained in footnote copy.** **DONE:** stage callout when Import chosen.
9. **P1 — Import path lands directly in import after calendar without a visible transition summary.** Insert a lightweight confirmation: **School year saved. Now bring in your curriculum.**
10. **P0 — Cancel behavior differs by onboarding stage.** Define one rule: Cancel always returns to the prior safe surface and preserves drafts.
11. **P0 — Draft preservation is implicit.** Add visible `Saved as you go` messaging or equivalent state once a setup draft has persisted.
12. **P1 — Back button always says `← Back`.** **DONE:** destination labels (**Back to welcome / School year / Courses**).
13. **P1 — Onboarding has no “do this later” affordance on Classes/Teaching Day even though the welcome says everything is not required day one.** Add explicit defer actions where product state permits.
14. **P0 — The product auto-resolves a requested stage based on capabilities.** If Arc redirects the user because a prerequisite is missing, explain why rather than silently changing the destination.
15. **P2 — Welcome uses product manifesto language before demonstrating utility.** Lead with the first useful outcome, then brand statement.
16. **P1 — “What do you teach” lacks punctuation and reads like a label fragment.** Change to **What do you teach?** or remove the redundant kicker.
17. **P1 — Onboarding mixes editorial title tone with setup-form tone.** Standardize hierarchy so each step has one title, one short explanation, one primary action.
18. **P0 — Onboarding does not visibly indicate what is already complete when returning later.** Add checkmarks/status for established school year, courses, and teaching day.
19. **P1 — Re-entering onboarding from Settings should not look identical to first-run onboarding.** Use edit language: **Edit school year**, **Edit courses**, **Edit teaching day**.
20. **P2 — Completion needs a clear landing explanation.** When setup finishes, briefly orient the user to the Week desk instead of dropping them into a changed surface with no handoff.

---

## B. Calendar / school-year setup

21. **P0 — Calendar Setup presents all steps in one long form while progress labels imply sequential steps.** Either make the steps truly sequential or style progress as section navigation, not a wizard.
22. **P1 — `School`, `Dates & week`, `Class times`, `Calendar preview` can all appear active at once.** Replace “active” semantics with `complete/current/available` states.
23. **P1 — “Tell Arc which days are actually yours” is strong, but the following `More info` repeats structure rather than solving uncertainty.** Make helper copy contextual and specific to the current state.
24. **P0 — School search and manual date entry coexist without a clear precedence rule.** Explain: **Use a school for suggestions, or enter dates manually. You can override any suggestion.**
25. **P0 — Auto-prefilled district dates can appear without a persistent source marker after the transient note.** Keep source provenance adjacent to the populated dates until save.
26. **P1 — `School year` text input invites format ambiguity.** Infer the label from first/last day where possible and make manual editing secondary.
27. **P1 — Instructional weekdays include Saturday/Sunday by default as peer options.** Visually separate weekend toggles from Mon–Fri to reduce accidental changes.
28. **P0 — Removing every instructional weekday should be blocked immediately, not only via save validation.
29. **P1 — Exceptions are data-entry heavy.** Add common quick actions such as **No school**, **Teacher workday**, **Holiday**, **Early release** with date-first entry.
30. **P1 — Early-release exception asks for label and end time with equal weight.** Make end time primary, label optional.
31. **P0 — Recurring early release can be partially configured before validation.** Mark incomplete rules inline as soon as the user leaves the row.
32. **P1 — Recurring early-release count is useful but should say what it means, e.g. **This affects 18 Wednesdays**.
33. **P0 — Source-backed edits risk overwriting official-calendar truth without enough consequence preview.** Show exactly what changes from source data before save.
34. **P1 — Calendar Preview should highlight exceptions and early releases, not merely show the year.** The purpose is confirmation of unusual days.
35. **P2 — Error summary is good, but individual fields should receive direct error text, not only `aria-describedby` back to a global block.
36. **P1 — `Calendar dates` in Settings and `Calendar Setup` in setup nav are not the same phrase.** Normalize naming.
37. **P1 — “Class times” inside Calendar Setup overlaps conceptually with Teaching Day Setup.** Decide whether bell/class times belong to School Year setup or Teaching Day, not both.
38. **P0 — If School Identity lookup fails or has no suggestion, the fallback path should be prominent and neutral, not feel like an error state.
39. **P1 — The calendar form should expose a dirty-state indicator before Cancel if edits would be discarded.
40. **P0 — Cancel from an existing calendar edit should explicitly say whether changes are discarded or preserved as draft.

---

## C. Courses / sections / teaching-day setup

41. **P1 — Course vs section distinction requires too much explanatory copy.** Put examples directly in labels: **Course (AP Art History)** / **Class period (Period 2)**.
42. **P0 — `Remove course` is visually available even when removal will be blocked by units/progress.** Disable with an inline reason or hide until allowed.
43. **P1 — Protected-course explanation appears after the control.** Put the reason next to the disabled destructive action.
44. **P0 — Removing a course also removes its sections and teaching-day blocks.** Before allowed removal, preview those consequences or provide Undo.
45. **P0 — Removing a section alters Teaching Day.** Show that relationship before removal.
46. **P1 — Empty state says `No classes yet` while action says `Add a course`.** Use one vocabulary consistently.
47. **P1 — `Add another course` should become the primary continuation after a course is complete, not a visually quiet afterthought.
48. **P2 — Course cards need stronger scan hierarchy between course title and section list.
49. **P1 — Save button says `Save classes` while the model uses Courses and Sections.** Prefer **Save courses** or **Save courses & classes** based on final terminology.
50. **P0 — Validation happens mostly on submit.** Mark blank course/section names inline before the user reaches the bottom.
51. **P1 — Teaching Day defaults one teaching block per section but does not explain the assumption.** Label it as a starting point: **We started with one block for each class.**
52. **P0 — Bell schedule proposal may map teaching blocks to sections by position.** Force explicit review of section mapping before applying when confidence is uncertain.
53. **P1 — `Use proposed schedule` is too broad.** Change to **Review and use schedule** unless the proposal is already visibly expanded.
54. **P0 — Applying a proposal replaces the existing block list.** Show a before/after preview or provide immediate Undo.
55. **P1 — Teaching Day blocks expose label, type, class, start, end, order controls simultaneously.** Collapse optional times until requested.
56. **P1 — `Earlier`/`Later` controls are slower than drag for many blocks.** Support reorder drag with keyboard alternative while keeping buttons as accessible fallback.
57. **P2 — Two-digit order numbers (`01`, `02`) are decorative unless they aid scanning.** Reduce prominence if they compete with block labels.
58. **P1 — `Lunch / other` mixes a specific and catch-all category.** Use **Non-teaching block** with presets such as Lunch, Duty, Advisory, Other.
59. **P0 — A teaching block can have `Choose a class` empty state.** Make missing class assignment visibly incomplete before save.
60. **P1 — Planning-period setup should visually distinguish planning from free time or lunch so downstream Planning Period behavior is predictable.

---

## D. Settings architecture and content

61. **P0 — Settings is mixed into the same edge-tab rhythm as Day/Week/Month/Year.** Visually separate utility navigation from time navigation.
62. **P0 — Settings currently contains eight conceptual groups.** Reduce to 4–5 top-level groups and progressive disclosure.
63. **P1 — `My school year`, `My teaching day`, `My courses` are good categories; `Planning`, `Desk setup`, `ArcTable`, `Accessibility & display`, `Data / import / reuse` are flatter and more implementation-like.** Reorganize around teacher goals.
64. **P1 — ArcTable Settings section contains only explanatory copy.** Either add actual ArcTable controls there or remove the dead section.
65. **P1 — Accessibility & Display contains only explanatory copy.** Put actual display/accessibility controls there or remove the pseudo-section.
66. **P0 — Settings says `Tray` while desk semantics are moving to `IDEAS`.** **DONE:** user-facing Tray → IDEAS in desk settings / home desk / arrange mode.
67. **P1 — `Edit Workspace` should be renamed **Arrange desk**.** **DONE** (prior + this slice).
68. **P0 — Settings must clearly distinguish configuration changes that affect existing plans from cosmetic preferences.
69. **P1 — `Preferred default planner view` should be labeled by outcome: **Open Arc to** Day / Week / Month.** **DONE.**
70. **P1 — Year is absent from default-view choices without explanation.** **DONE:** hint explains Year is not a home view yet.
71. **P2 — `Show weekends in Week view` belongs with Week display preferences, not necessarily Desk Setup.
72. **P1 — Object size controls should live inside Arrange Desk if size is primarily spatial, reducing duplicate adjustment paths.
73. **P1 — `Planner (required)` as a disabled checkbox is odd interaction language.** **DONE:** fixed text **Planner — always on the desk**.
74. **P1 — `Show on desk` should use the same labels as the objects themselves: IDEAS, To-dos, ArcTable, Notes.** **DONE** (Day notes).
75. **P1 — `Must / Should / Could pad` competes with user-facing `TO-DOS`.** Pick one concept; likely TO-DOS externally, Must/Should/Could internally within it. **Partial:** arrange/settings use To-dos.
76. **P2 — `Desk notes strip` is implementation-shaped wording.** **DONE:** **Day notes**.
77. **P1 — Task Bar appears under `My teaching day`, but To-dos live as desk furniture.** Move task/to-do settings to a consistent location.
78. **P0 — Settings subpages need a persistent way back to Settings with preserved scroll/focus.
79. **P1 — Setup nav has Calendar / Terms / Courses / Teaching day / Units / Lessons / Import, while Settings group hierarchy differs.** Unify the information architecture.
80. **P1 — Settings needs search only if it becomes large enough; do not add search to compensate for bad grouping.** Fix grouping first.
81. **P2 — Destructive configuration actions should be visually separated from everyday preferences.
82. **P1 — Settings changes should communicate save behavior.** If immediate autosave, say so; if staged, expose Save/Cancel.
83. **P0 — Returning to ArcTable from Settings during class must preserve live timer/cleanup/media state.
84. **P2 — Settings should preserve the section the teacher was editing after returning from a deeper setup flow.
85. **P1 — “Data / import / reuse” is three jobs in one label.** Separate Import from future backup/reuse controls when those exist.

---

## E. Desk, navigation, Week/Day/Month/Year

86. **P0 — IDEAS vs TRAY duplicated mental model.** **DONE:** teacher-facing noun is IDEAS (internal ids may still say tray).
87. **P0 — `PLANNING` is too broad for a tab in a planning app.** Rename to **Planning period** or remove as permanent navigation.
88. **P0 — Header has hard-disabled previous/next arrows.** **DONE** (prior): removed until functional.
89. **P1 — Search field has no visible scope.** **DONE** (prior): **Find a lesson, unit, note…**
90. **P1 — `Enlarge` is implementation language.** **DONE** (prior): **Open** / Open calendar.
91. **P0 — Today button, Today highlight, and selected date must remain visually distinct.
92. **P1 — Active Day/Week/Month/Year tab should be recognizable without relying on color alone.
93. **P1 — Settings active state should not look like another calendar view.
94. **P0 — Deep lesson/unit focus must always expose **Back to Week** or equivalent parent path.
95. **P1 — Switching Day/Week/Month/Year should preserve relevant focus date and course context.
96. **P0 — Week must show current teaching sequence above management tools on normal laptop height.
97. **P1 — Empty Week slots should not repeat `No Lesson placed` across a grid; use lighter empty structure.
98. **P1 — Non-school days need understandable visual treatment plus labels where exceptional; do not rely on muted color only.
99. **P2 — Month and Year must remain planning tools, not thumbnail galleries. Ensure key object status remains legible.
100. **P0 — Any automatic schedule shift around no-school days must preview affected lessons and provide Undo.

---

## F. Lessons, units, object interaction

101. **P0 — Lesson title click opens while lesson-body click reveals actions.** **DONE** (prior gauntlet): whole lesson object opens; actions stay on controls.
102. **P0 — Touch users should not need a first tap merely to reveal actions unless the primary object behavior is still obvious.** Prefer open-on-tap and explicit More affordance. **Partial:** open-on-tap landed with #101.
103. **P1 — Lesson drag should be the obvious move gesture, with `Move to date…` retained as accessible alternative.
104. **P0 — Lesson move must preview destination date/class and sequence effects before committing when more than one item is affected.
105. **P1 — Important status needs a stable icon/mark that does not compete with delivery status.
106. **P1 — Fixed-date, section override, in-progress, completed, and important are too many possible badges.** Create a priority order and hide low-value status by default.
107. **P0 — In-progress lesson recovery should be easy to find from the lesson itself, not buried behind a generic menu.
108. **P1 — Resume note should surface when reopening an in-progress lesson, not only in accessibility text.
109. **P0 — Start Class should appear only when context is clear: correct section, lesson, and live date.
110. **P1 — Lesson title buttons need full-row touch targets for Smart Board use.
111. **P0 — Unit click currently jumps to Month at unit start.** Open/focus the unit first; make **Show in Month** a secondary command.
112. **P1 — Unit span title tooltip contains raw start/end dates; use readable date format for visible/accessible detail.
113. **P1 — Shared course plan vs section-specific override must be understandable without internal wording.
114. **P0 — Copy vs Move must be explicit whenever dragging or duplicating across classes/sections.
115. **P1 — Lesson object menus should never include actions impossible in the current state.
116. **P2 — Context menus need predictable keyboard opening and focus return.
117. **P1 — Selected lesson state should remain visible after opening/closing a contextual menu.
118. **P0 — Deleting or unplacing a lesson with progress requires consequence messaging and recovery.
119. **P1 — Lesson editor should autosave drafts or warn before navigation if unsaved.
120. **P2 — Unit/lesson library terminology should match planner terminology exactly.

---

## G. Capture, IDEAS, TO-DOS, notes

121. **P0 — Remove `u/l/i/n` command syntax from primary Quick Capture placeholder/helper.** **DONE:** blank sticky says Enter→IDEAS; prefixes only optional in Help / after typed command.
122. **P0 — A captured thought must remain one object/ID when represented on desk and in IDEAS unless user explicitly copies it.
123. **P0 — Quick Capture confirmation that lasts ~1.4 seconds cannot be the only evidence of destination.** Keep a spatial/recent-action cue.
124. **P1 — Rename `Quick capture` to **Jot** or test a more teacher-native label if Quick Capture feels product-y.
125. **P1 — Enter should always save; Shift+Enter should always create a line break across capture/note surfaces.
126. **P0 — Half-written capture text should survive temporary navigation/interruption.
127. **P0 — `Clean up` is duplicated inside and outside IDEAS.** Show one obvious command at a time.
128. **P1 — Only show Clean up when loose desk notes actually exist.
129. **P1 — IDEAS empty state should invite action: **Jot something or drag a loose idea here.**
130. **P0 — To-dos must own teacher obligations, never teaching lessons. Enforce the semantic boundary in drop targets and creation flows.
131. **P1 — MUST/SHOULD/COULD should be visually subordinate to the TO-DOS object, not three equal application cards.
132. **P1 — Adding multiple to-dos should support Enter-to-add without forcing repeated button clicks.
133. **P0 — Completing a to-do should be reversible immediately with Undo.
134. **P1 — Moving a to-do to a date should clarify whether it becomes a calendar note, deadline, or lesson-like item.
135. **P2 — Notes row and loose Post-its must not look interchangeable if they have different persistence/placement rules.

---

## H. Arrange Desk / furniture mode

136. **P0 — Rename `Desk edit mode` to **Arrange desk**.** **DONE.**
137. **P0 — Rename primary exit `Pin it down` to **Done arranging**; brand-flavor language can remain secondary.** **DONE.**
138. **P1 — Replace internal `MSC size` with **To-dos size**.** **DONE** (+ IDEAS size).
139. **P0 — Planning drag must visibly lock while arranging furniture, not merely be disabled in code.** **Partial:** toolbar copy states planning drag is paused.
140. **P1 — Selected furniture needs a clear but calm outline plus object name.
141. **P0 — Reset must say **Reset desk layout** and explain that content is not deleted.** **DONE** (button + title).
142. **P0 — Reset should offer Undo after completion rather than a cryptic double-click confirmation pattern.
143. **P1 — Arrow-key movement should announce destination/position changes for screen-reader users.
144. **P1 — Dragging furniture should snap to understandable zones and preview the drop before commit.
145. **P2 — Do not expose layout grid unless Arrange Desk is active.

---

## I. ArcTable / live-class mode

146. **P0 — ArcTable needs a strict live-class hierarchy: lesson directions and timer above configuration controls.
147. **P1 — Teacher Monitor header currently includes Plan View, Settings, Live chip, End Class.** Reduce visual weight of Plan/Settings while teaching.
148. **P0 — End Class must be distinct from navigation and require a clear outcome flow, not accidental proximity to Settings.
149. **P1 — Timer duration input + presets + start/reset are all visible.** Hide manual duration field behind edit/custom unless frequently used.
150. **P1 — Cleanup countdown should be one obvious teacher action with state-aware controls, not another mini settings form.
151. **P1 — Phase controls should use semantic next/previous labels in addition to +/- for accessibility and teacher clarity.
152. **P1 — `Board Locked/Editable` is implementation-shaped.** Rename around teacher intent, e.g. **Lock student board**.
153. **P0 — Student Preview must make it unmistakable whether the teacher is previewing or actually projecting.
154. **P1 — People / Pass / Media tool tabs need consistent open/close behavior, focus return, and one-at-a-time rule.
155. **P1 — People picker should not require roster management during live class if roster can be prepared elsewhere.** Emphasize Pick first, Manage roster second.
156. **P0 — Pass state must clearly show who has the pass, when it began, and how to return it; avoid ambiguous active counts only.
157. **P1 — Media add form should not dominate live teaching.** Make Project existing media the primary path.
158. **P0 — Timer and cleanup timer must survive Plan View and Settings round-trips without resetting.
159. **P0 — Returning from Settings to ArcTable should restore the same open tool/teaching context where practical.
160. **P1 — `Teacher controls` rail contains too many peer controls.** Group into **Now**, **Room**, and **More** or equivalent priority layers.

---

## J. Accessibility, error handling, recovery, system consistency

161. **P0 — No essential action may be hover-only.** Verify every lesson, tab, drawer, tool, and furniture control on touch.
162. **P0 — All tactile-looking interactive assets need visible keyboard focus.
163. **P1 — Decorative tactile assets should be `aria-hidden` and non-focusable consistently.
164. **P0 — Disabled controls must not rely on `title` hover for explanation.
165. **P1 — Error messages should explain what the user can do next, not merely what failed.
166. **P0 — Network/source lookup failures must preserve manual fallback paths.
167. **P1 — Long operations need in-context progress, not global spinners that obscure the teacher’s place.
168. **P0 — Destructive broad changes require preview or explicit consequence confirmation; routine reversible changes should use Undo instead.
169. **P0 — Undo copy must name the action/object: **Undo moving “White Temple” to Thursday**, not generic Undo.
170. **P1 — Recent Activity/History should exist if users can reasonably lose track of moved/captured items; at minimum expose the latest consequential actions.
171. **P0 — Closing drawers/modals must return focus to the trigger and preserve calendar position.
172. **P1 — Escape behavior should close only the topmost temporary surface, never unexpectedly navigate away.
173. **P0 — Browser Back should not be the only recovery path from deep lesson/unit/setup views.
174. **P1 — Loading states must preserve skeleton/layout shape to avoid spatial jumps.
175. **P2 — Reduced-motion mode must keep spatial orientation cues when movement animation is removed.
176. **P0 — Color cannot be the sole distinction for Today, selected, important, fixed, disabled, or off-day states.
177. **P1 — Touch targets for Smart Board use should meet a larger target standard than desktop minimums for primary teaching actions.
178. **P1 — Text embedded over photographic/texture assets must pass contrast at actual display sizes, not only zoomed screenshots.
179. **P1 — All user-facing terms should pass one vocabulary dictionary: Course/Class/Section, IDEAS/Tray, To-dos/MSC, School year/Calendar, Arrange Desk/Edit Workspace.
180. **P0 — Add automated journey tests that cross product boundaries: onboarding → Week; Week lesson → ArcTable → return; capture → IDEAS → schedule; Settings → setup edit → return; arrange desk → plan lesson; schedule disruption → move → Undo.

---

## First repair wave: do these before micro-polish

1. Resolve **IDEAS vs TRAY**. — **DONE** (teacher-facing)
2. Resolve **Course / Class / Section vocabulary**. — open
3. Separate **Settings** from Day/Week/Month/Year navigation. — **in flight / landed** (left copper tab); do not regress
4. Fix **whole lesson object opens** behavior. — **DONE** (prior)
5. Remove **Quick Capture command syntax** from default UI. — **DONE**
6. Simplify **Settings information architecture**. — open (partial labels done)
7. Normalize **Arrange desk** language and recovery. — **DONE** (Undo-after-reset still open #142)
8. Make onboarding steps/dependencies explicit and deferrable. — **partial** (1–5, 8, 12 done; defer/cancel/draft still open)
9. Make move/shift/automatic schedule consequences visible + undoable. — open / parallel work
10. Re-tier ArcTable controls around live-class urgency. — open / parallel (timer, end-class, table settings)
11. Add cross-surface focus/context restoration. — open
12. Run the end-to-end journey tests in item 180 before visual lock. — open

## Recommended next (after this slice)

1. Onboarding #10–11, #14, #18 — Cancel/draft visibility + redirect explanation + return-complete status.
2. Course/Class/Section vocabulary pass (#41–49) without colliding with Teaching Day class-times work.
3. Arrange desk #142 Undo-after-reset + #139 stronger planning-lock visual.
4. ArcTable live-class hierarchy (#146–160) coordinating with timer/end-class/table-settings agents.
5. Journey tests (#180).

## Completion rule

Do not close this register by checking whether a component was touched. Each item closes only when its **teacher-facing behavior** is corrected and verified in the relevant journey.
