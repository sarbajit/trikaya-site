import { FileText } from "lucide-react";
import { connectDB } from "@/lib/db";
import { StaticPage } from "@/models/StaticPage";
import { getStaticPageDef } from "@/lib/static-pages";
import { RICH_TEXT_CLASS } from "@/lib/rich-text-classes";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";

export async function getStaticPageContent(slug: string) {
  await connectDB();
  const def = getStaticPageDef(slug);
  const page = await StaticPage.findOne({ slug }).lean();
  return {
    title: page?.title ?? def?.title ?? slug,
    content: page?.content ?? "",
  };
}

export function StaticPageView({ title, content }: { title: string; content: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl text-foreground sm:text-4xl">{title}</h1>
      {content ? (
        <div className={cn(RICH_TEXT_CLASS, "mt-8")} dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <EmptyState
          icon={FileText}
          title="This page hasn't been published yet"
          description="Check back soon — we're putting the finishing touches on this content."
          className="mt-8"
        />
      )}
    </div>
  );
}
