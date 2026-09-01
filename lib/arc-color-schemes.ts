import type { ArcColorScheme } from "./domain";

export type ArcPalette = {
  id: ArcColorScheme;
  label: string;
  description: string;
  paper: string;
  deep: string;
  blue: string;
  gold: string;
  yellow: string;
  orange: string;
  coral: string;
  quarters: [string, string, string, string];
};

/**
 * Arc color is derived from the approved painted/collage asset family.
 * Schemes may change emphasis and quarter order, but they do not invent
 * unrelated SaaS palettes or assign semantic meaning to a hue.
 */
export const ARC_COLOR_SCHEMES: readonly ArcPalette[] = [
  {
    id: "studio",
    label: "Arc Studio",
    description: "The full original Arc mix: cream paper, blue, gold, yellow, orange and coral.",
    paper: "#F6F1E7", deep: "#174F64", blue: "#AAC7D0", gold: "#EFBE3F", yellow: "#F0D538", orange: "#EFAA57", coral: "#DF8968",
    quarters: ["#F0D538", "#EFAA57", "#AAC7D0", "#DF8968"]
  },
  {
    id: "sunroom",
    label: "Sunroom",
    description: "Warmer Arc emphasis with yellow and gold forward while blue keeps the planner grounded.",
    paper: "#F6F1E7", deep: "#174F64", blue: "#AAC7D0", gold: "#EFBE3F", yellow: "#F0D538", orange: "#EFAA57", coral: "#DF8968",
    quarters: ["#F0D538", "#EFBE3F", "#AAC7D0", "#DF8968"]
  },
  {
    id: "blueprint",
    label: "Blueprint",
    description: "A calmer blue-led Arc arrangement with warm accents retained for hierarchy and quarters.",
    paper: "#F6F1E7", deep: "#174F64", blue: "#AAC7D0", gold: "#EFBE3F", yellow: "#F0D538", orange: "#EFAA57", coral: "#DF8968",
    quarters: ["#AAC7D0", "#174F64", "#EFBE3F", "#DF8968"]
  },
  {
    id: "clay",
    label: "Clay + Paper",
    description: "Coral and orange lead, balanced by Arc blue and the original cream paper field.",
    paper: "#F6F1E7", deep: "#174F64", blue: "#AAC7D0", gold: "#EFBE3F", yellow: "#F0D538", orange: "#EFAA57", coral: "#DF8968",
    quarters: ["#EFBE3F", "#EFAA57", "#DF8968", "#AAC7D0"]
  }
] as const;

export function arcColorScheme(id: ArcColorScheme | undefined): ArcPalette {
  return ARC_COLOR_SCHEMES.find((scheme) => scheme.id === id) ?? ARC_COLOR_SCHEMES[0];
}
