import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/** Web app manifest: name, colours and icons for "Add to home screen" and search previews. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "browser",
    // ivory-100, the page background, matching the viewport themeColor in the root layout.
    background_color: "#fbf7ee",
    theme_color: "#fbf7ee",
    lang: "en-IN",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/brand/logo-512.png", type: "image/png", sizes: "512x512" },
      { src: "/brand/png/app-icon-1024.png", type: "image/png", sizes: "1024x1024" },
    ],
  };
}
