import type { Metadata } from "next";
import { StaticPageView, getStaticPageContent } from "../_components/StaticPageView";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { title } = await getStaticPageContent("privacy-policy");
  return { title: `${title} | Trikaya` };
}

export default async function PrivacyPolicyPage() {
  const { title, content } = await getStaticPageContent("privacy-policy");
  return <StaticPageView title={title} content={content} />;
}
