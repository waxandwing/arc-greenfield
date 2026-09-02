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
    body: "Arc always comes back to the calendar. Day is what you teach from. Week is where you make the little moves. Month, Quarter, and Year pull back without making a second copy of your plans.",
    bullets: [
      "Open a plan and come back to the same place.",
      "A Unit or Lesson stays the same thing in every view.",
      "School dates and class schedules matter when Arc moves instruction."
    ]
  },
  {
    id: "fridge",
    label: "Fridge",
    title: "The Fridge is where good plans can wait.",
    body: "Not everything needs a date yet. Park an Idea, Note, Lesson, or Unit on the Fridge until you know where it belongs. Sending something back is not the same as deleting it.",
    bullets: [
      "Move something onto the calendar when it is ready.",
      "Send it back when the week changes again.",
      "A Unit keeps its Lessons with it."
    ]
  },
  {
    id: "unit",
    label: "Unit",
    title: "A Unit keeps the run of Lessons together.",
    body: "You do not have to know every exact date before you map a Unit. Add Lessons, put them in order, and schedule them as the shape of the Unit becomes clearer.",
    bullets: [
      "Add Lessons before every date is decided.",
      "Reorder the sequence from Unit Focus.",
      "Move the Unit without leaving its Lessons behind."
    ]
  },
  {
    id: "lesson",
    label: "Lesson",
    title: "A Lesson can be planned before it is pinned down.",
    body: "A Lesson can belong to a Unit before you know the exact day. Once you schedule it, Arc keeps the class and Unit connection with it.",
    bullets: [
      "Open the Lesson without losing your place on the calendar.",
      "Tack, Extend, and Copy next follow the days that class actually meets.",
      "Send a Lesson back to the Fridge if it needs another home."
    ]
  },
  {
    id: "movement",
    label: "Move plans",
    title: "Move it. Do not rebuild it.",
    body: "Plans move because school moves. Drag when that is fastest, or use the keyboard and buttons when it is not. Either way, Arc should protect the same dates and warn you about the same conflicts.",
    bullets: [
      "A changed week should not mean retyping your work.",
      "Arc should tell you what is in the way before anything disappears.",
      "Undo should put the whole move back."
    ]
  },
  {
    id: "priority",
    label: "Must / Should / Could",
    title: "This is the stuff yelling the loudest.",
    body: "Must / Should / Could is a small attention strip for the days when everything feels equally urgent. It is not another task app hiding inside your planner.",
    bullets: [
      "Circle something when it needs your eye.",
      "Cross it out when it is done.",
      "Collapse the strip when you want the calendar space back."
    ]
  },
  {
    id: "shift",
    label: "Shift",
    title: "Shift is for the day that went sideways.",
    body: "Assembly ran long. Fire drill. Half the class was out. Shift is for that. Arc shows the ripple first, then moves only the part that can move safely.",
    bullets: [
      "No-school days and real class schedules still count.",
      "Fixed dates stay put.",
      "If something collides, Arc names it before you commit."
    ]
  },
  {
    id: "day",
    label: "Day",
    title: "Day is the view you teach from.",
    body: "Day should feel more like the paper on your desk while you are teaching. See the Lesson, grab a resource, jot what changed, and keep moving.",
    bullets: [
      "Record what you actually got through.",
      "Leave yourself a quick note while you still remember it.",
      "See what comes next without opening another planner."
    ]
  },
  {
    id: "undo-save",
    label: "Undo + Save",
    title: "Undo is normal. Save text should not bluff.",
    body: "Planning is messy. Undo should be easy to use, and Arc should say where your work is really saved instead of pretending it synced somewhere it did not.",
    bullets: [
      "Cmd/Ctrl-Z backs up the last recoverable change.",
      "Cmd/Ctrl-S saves now.",
      "This beta saves on this device unless Arc clearly tells you otherwise."
    ]
  }
];

export function arcHelpTopic(id: ArcHelpTopicId): ArcHelpTopic {
  const topic = ARC_HELP_TOPICS.find((item) => item.id === id);
  if (!topic) throw new Error(`Unknown Arc help topic: ${id}`);
  return topic;
}
