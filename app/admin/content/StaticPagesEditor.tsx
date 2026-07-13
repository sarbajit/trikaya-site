"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { StaticPageDef } from "@/lib/static-pages";

interface PageState {
  slug: StaticPageDef["slug"];
  title: string;
  content: string;
}

export function StaticPagesEditor({ initialPages }: { initialPages: PageState[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pages, setPages] = useState<PageState[]>(initialPages);
  const [activeSlug, setActiveSlug] = useState<PageState["slug"]>(initialPages[0].slug);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  const active = pages.find((p) => p.slug === activeSlug)!;

  function updateActive(patch: Partial<PageState>) {
    setPages((prev) => prev.map((p) => (p.slug === activeSlug ? { ...p, ...patch } : p)));
  }

  async function handleSave() {
    setIsSaving(true);
    setErrors(null);
    try {
      const response = await fetch(`/api/admin/static-pages/${active.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: active.title, content: active.content }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErrors(body?.error?.fieldErrors ?? { form: ["Failed to save page"] });
        toast({ title: "Failed to save page", variant: "destructive" });
        return;
      }

      toast({ title: `${active.title} saved.`, variant: "success" });
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap gap-1 border-b border-border">
        {pages.map((page) => (
          <button
            key={page.slug}
            type="button"
            onClick={() => setActiveSlug(page.slug)}
            className={cn(
              "relative px-3 py-2.5 text-sm font-medium transition-colors",
              page.slug === activeSlug ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {page.title}
            {page.slug === activeSlug && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <FormField label="Page title" htmlFor="page-title" error={errors?.title} required>
            <Input
              id="page-title"
              value={active.title}
              onChange={(e) => updateActive({ title: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Content" error={errors?.content}>
            <RichTextEditor value={active.content} onChange={(content) => updateActive({ content })} />
          </FormField>

          <Button type="button" onClick={handleSave} disabled={isSaving} className="w-fit">
            {isSaving ? "Saving..." : "Save page"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
