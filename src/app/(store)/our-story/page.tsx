import { CmsPageView, cmsPageMetadata } from "@/components/store/cms-page-view";

export function generateMetadata() {
  return cmsPageMetadata("our-story", "/our-story");
}

export default function Page() {
  return <CmsPageView slug="our-story" />;
}
