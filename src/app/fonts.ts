import { Cormorant_Garamond, Inter, Tiro_Devanagari_Hindi } from "next/font/google";

/** High-contrast serif for display headings and the wordmark. Variable font (300–700). */
export const fontDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cormorant",
});

/** Body copy and all UI (storefront and admin). Variable font, so no weight list. */
export const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Devanagari face for the phase-2 Hindi pages. Not preloaded: no English page uses it, so the
 * browser fetches it only when Devanagari text actually renders.
 */
export const fontDevanagari = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  display: "swap",
  preload: false,
  variable: "--font-tiro-devanagari",
});

/** Class names that expose every font as a CSS variable; apply once on <html>. */
export const fontVariables = [
  fontDisplay.variable,
  fontSans.variable,
  fontDevanagari.variable,
].join(" ");
