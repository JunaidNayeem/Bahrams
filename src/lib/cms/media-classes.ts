/**
 * Styles for the images and videos that CMS markup produces (src/lib/cms/simple-markup.ts).
 * Shared by the store page and the admin preview so both look the same.
 */
export const CMS_MEDIA_CLASSES = [
  "[&_figure]:my-8",
  "[&_figure_img]:h-auto [&_figure_img]:w-full [&_figure_img]:rounded-md",
  "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground",
  "[&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-md [&_iframe]:border-0",
  "[&_video]:w-full [&_video]:rounded-md [&_video]:bg-charcoal-900",
].join(" ");
