import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isDuplicateKeyError } from "@/lib/mongo-errors";
import { createReviewSchema } from "@/lib/validation/review";
import { Booking } from "@/models/Booking";
import { Review } from "@/models/Review";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createReviewSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { bookingId, rating, comment } = parsed.data;

  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.userId?.toString() !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (booking.status !== "completed") {
    return NextResponse.json({ error: "You can only review a completed stay" }, { status: 400 });
  }

  const existing = await Review.findOne({ bookingId });
  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this booking" }, { status: 409 });
  }

  let review;
  try {
    review = await Review.create({
      userId: session.user.id,
      propertyId: booking.propertyId,
      bookingId: booking._id,
      rating,
      comment,
      status: "pending",
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ error: "You have already reviewed this booking" }, { status: 409 });
    }
    throw error;
  }

  revalidatePath("/account/reviews");

  return NextResponse.json(
    {
      id: review._id.toString(),
      rating: review.rating,
      comment: review.comment,
      status: review.status,
    },
    { status: 201 }
  );
}
