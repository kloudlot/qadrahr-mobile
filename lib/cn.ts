import clsx, { type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge, taught this app's theme.
 *
 * Out of the box it does not know the custom type scale, so `text-body`
 * reads as a COLOUR and is silently dropped the moment a real colour
 * (`text-text-secondary`) follows it — every <Text> lost its size that way.
 * And `font-sans/medium/semibold/bold` are FAMILIES here (Inter_400…700,
 * because React Native resolves weight by family), so they must replace
 * one another rather than stack as family + weight.
 */
const twMerge = extendTailwindMerge({
  override: {
    classGroups: {
      "font-weight": [],
      "font-family": [{ font: ["sans", "medium", "semibold", "bold"] }],
    },
  },
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h1", "h2", "h3", "body", "small", "caption", "micro"] }],
    },
  },
});

/** Merges class names, with later Tailwind utilities winning over earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
