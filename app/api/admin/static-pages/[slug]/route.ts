import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { StaticPage } from "@/models/StaticPage";
import { getStaticPageDef } from "@/lib/static-pages";
import { updateStaticPageSchema } from "@/lib/validation/staticPage";
import { sanitizeRichText } from "@/lib/sanitize-html";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const def = getStaticPageDef(slug);
  if (!def) {
    return NextResponse.json({ error: "Unknown static page" }, { status: 404 });
  }

  await connectDB();
  const page = await StaticPage.findOne({ slug });

  return NextResponse.json({
    slug: def.slug,
    title: page?.title ?? def.title,
    content: page?.content ?? "",
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const def = getStaticPageDef(slug);
  if (!def) {
    return NextResponse.json({ error: "Unknown static page" }, { status: 404 });
  }

  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = updateStaticPageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const content = sanitizeRichText(parsed.data.content);

  const updated = await StaticPage.findOneAndUpdate(
    { slug },
    { $set: { title: parsed.data.title, content } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  revalidatePath("/admin/content");
  revalidatePath(def.publicPath);

  return NextResponse.json(updated);
}
