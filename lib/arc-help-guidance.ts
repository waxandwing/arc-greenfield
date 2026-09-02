export type ArcHelpTopicId =
  | "calendar"
  | "fridge"
  | "unit"
  | "lesson"
  | "movement"
  | "priority"
  | "shift"
  | "day"
  | "undo-save";

export type ArcHelpTopic = {
  id: ArcHelpTopicId;
  label: string;
  title: string;
  body: string;
  bullets: string[];
};

export const ARC_HELP_TOPICS: ArcHelpTopic[] = [
  {
    id: "calendar",
    label: "Calendar",
    title: "The calendar is home.",
    body: "Arc stays centered on the calendar. Day is for teaching from the plan. Week is for precise instructional movement. Month, Quarter, and Year change the scale without creating another copy of your work.",
    bullets: [
      "Open a plan without leaving the calendar horizon you are using.",
      "The same Unit and Lesson should remain themselves in every range.",
      "School dates and class meeting patterns control where Arc may place instruction."
    ]
  },
  {
    id: "fridge",
    label: "Fridge",
    title: "The Fridge keeps work without forcing a date.",
    body: "Ideas, Notes, Lessons, and Units can stay on the Fridge before they are scheduled—or return there when a day falls apart. Parking something is not deleting it.",
    bullets: [
      "Place a Fridge object on the calendar when it is ready.",
      "Return a scheduled object to the Fridge without losing its context.",
      "A Unit keeps its nested Lesson sequence when it moves."
    ]
  },
  {
    id: "unit",
    label: "Unit",
    title: "Units own ordered Lessons.",
    body: "A Unit is a durable container. Lessons can belong to it before every Lesson has a date. Arc should preserve that hierarchy whenever the Unit moves, copies, cuts, parks, or restores.",
    bullets: [
      "Nest a Lesson inside a Unit without forcing a date.",
      "Reorder the Lesson sequence from Unit Focus.",
      "Moving a Unit carries its Lesson tree instead of flattening it."
    ]
  },
  {
    id: "lesson",
    label: "Lesson",
    title: "A Lesson can be committed in stages.",
    body: "A Lesson may belong to a Unit without belonging to a day yet. When it is scheduled, Arc keeps its Unit relationship and class context visible.",
    bullets: [
      "Open Lesson details without changing the current calendar horizon.",
      "Tack, Extend, and Copy-next use that class's next real meeting.",
      "Returning a Lesson to the Fridge preserves it for later placement."
    ]
  },
  {
    id: "movement",
    label: "Move plans",
    title: "Move the plan instead of rebuilding it.",
    body: "Drag when that is fastest. Keyboard, menu, Cut/Copy/Paste, Tack, and Extend are equally valid. The long-term rule is that every input method uses the same movement command and consequence preview.",
    bullets: [
      "Nothing should require retyping because the week changed.",
      "Protected and displaced work must remain visible before commit.",
      "Undo must restore the complete operation, not just one visible date."
    ]
  },
  {
    id: "priority",
    label: "Must / Should / Could",
    title: "This is an attention strip, not another task app.",
    body: "Use Must / Should / Could when several things are competing for your attention. Link planning objects into the strip instead of creating duplicate copies of them.",
    bullets: [
      "Red-circle means important; it is separate from completion.",
      "Cross out first, then delete when you truly want it gone.",
      "Collapse the strip when the calendar needs the space back."
    ]
  },
  {
    id: "shift",
    label: "Shift",
    title: "Shift is for the day that went sideways.",
    body: "Shift is meant to absorb interruption without rebuilding the week. Arc should show the consequence before anything moves, then let the teacher approve the change once.",
    bullets: [
      "No-school days and class meeting patterns are respected.",
      "Fixed or protected dates remain named and visible.",
      "Collisions should be explained before commit, never discovered afterward."
    ]
  },
  {
    id: "day",
    label: "Day",
    title: "Day is the teach-from-it view.",
    body: "Day turns planning into a working teaching surface: active Unit context, today's Lesson, resources, notes, what changed, and what comes next.",
    bullets: [
      "Mark what was actually taught without maintaining a second calendar.",
      "Capture a short adjustment while it is fresh.",
      "Open Lesson details and return to the same Day context."
    ]
  },
  {
    id: "undo-save",
    label: "Undo + Save",
    title: "Undo freely. Save state must tell the truth.",
    body: "Undo is part of normal planning, not an emergency control. Save and sync language should always describe where the work is actually durable.",
    bullets: [
      "Cmd/Ctrl-Z reverses the last recoverable workspace operation.",
      "Cmd/Ctrl-S saves now.",
      "The current beta saves on this device; Arc must not imply cloud sync until it exists."
    ]
  }
];

export function arcHelpTopic(id: ArcHelpTopicId): ArcHelpTopic {
  const topic = ARC_HELP_TOPICS.find((item) => item.id === id);
  if (!topic) throw new Error(`Unknown Arc help topic: ${id}`);
  return topic;
}
