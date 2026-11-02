import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's default scale. Without registering the brand tokens
 * from globals.css it would read `text-display-lg` as a text colour and drop it when merged
 * with `text-foreground`, so the custom font sizes, shadows and containers are declared here.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display-2xl", "display-xl", "display-lg", "display-md", "display-sm", "eyebrow"],
      shadow: ["card", "raised", "overlay"],
      container: ["prose", "content", "wide"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
