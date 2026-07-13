import type { Metadata } from "next";
import { StaticPageView, getStaticPageContent } from "../_components/StaticPageView";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getStaticPageContent("about");
  return { title: `${title} | Trikaya` };
}

export default async function AboutPage() {
  const { title, content } = await getStaticPageContent("about");
  return <StaticPageView title={title} content={content} />;
}
