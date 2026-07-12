import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isDuplicateKeyError } from "@/lib/mongo-errors";
import { propertySchema } from "@/lib/validation/property";
import { Property } from "@/models/Property";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = propertySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let property;
  try {
    property = await Property.create(parsed.data);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { error: { formErrors: ["A property with this slug already exists"], fieldErrors: {} } },
        { status: 409 }
      );
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath("/admin/properties");

  return NextResponse.json(property, { status: 201 });
}
