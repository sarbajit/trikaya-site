import { connectDB } from "@/lib/db";
import { StaticPage } from "@/models/StaticPage";
import { STATIC_PAGES } from "@/lib/static-pages";
import { StaticPagesEditor } from "./StaticPagesEditor";
import { PageHeader } from "../_components/PageHeader";

export default async function AdminContentPage() {
  await connectDB();
  const pages = await StaticPage.find({ slug: { $in: STATIC_PAGES.map((p) => p.slug) } });
  const bySlug = new Map(pages.map((p) => [p.slug, p]));

  const initialPages = STATIC_PAGES.map((def) => ({
    slug: def.slug,
    title: bySlug.get(def.slug)?.title ?? def.title,
    content: bySlug.get(def.slug)?.content ?? "",
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Static content"
        description="Edit Terms & Conditions, Privacy Policy, Refund/Cancellation Policy, and About Us. Changes appear on the public site immediately."
      />
      <StaticPagesEditor initialPages={initialPages} />
    </div>
  );
}
