import type { Metadata } from "next";
import { StaticPageView, getStaticPageContent } from "../_components/StaticPageView";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getStaticPageContent("terms");
  return { title: `${title} | Trikaya` };
}

export default async function TermsPage() {
  const { title, content } = await getStaticPageContent("terms");
  return <StaticPageView title={title} content={content} />;
}
