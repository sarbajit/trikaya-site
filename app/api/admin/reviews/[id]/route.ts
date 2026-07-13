import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { adminUpdateReviewStatusSchema } from "@/lib/validation/review";
import { Review } from "@/models/Review";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = adminUpdateReviewStatusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const review = await Review.findByIdAndUpdate(id, { $set: { status: parsed.data.status } }, { new: true });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/account/reviews");

  return NextResponse.json(review);
}
