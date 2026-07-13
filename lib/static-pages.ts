export interface StaticPageDef {
  slug: "terms" | "privacy-policy" | "refund-cancellation-policy" | "about";
  title: string;
  publicPath: string;
}

export const STATIC_PAGES: StaticPageDef[] = [
  { slug: "terms", title: "Terms & Conditions", publicPath: "/terms" },
  { slug: "privacy-policy", title: "Privacy Policy", publicPath: "/privacy-policy" },
  {
    slug: "refund-cancellation-policy",
    title: "Refund & Cancellation Policy",
    publicPath: "/refund-cancellation-policy",
  },
  { slug: "about", title: "About Us", publicPath: "/about" },
];

export const STATIC_PAGE_SLUGS = STATIC_PAGES.map((p) => p.slug);

export function getStaticPageDef(slug: string): StaticPageDef | undefined {
  return STATIC_PAGES.find((p) => p.slug === slug);
}
