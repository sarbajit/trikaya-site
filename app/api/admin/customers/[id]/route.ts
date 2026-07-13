import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isDuplicateKeyError } from "@/lib/mongo-errors";
import { adminUpdateCustomerSchema } from "@/lib/validation/customer";
import { User } from "@/models/User";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = adminUpdateCustomerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, phone, role, loginEnabled, password } = parsed.data;

  const update: Record<string, unknown> = {
    name,
    email: email.toLowerCase().trim(),
    phone,
    role,
    loginEnabled,
  };
  if (password) {
    update.passwordHash = await bcrypt.hash(password, 10);
  }

  try {
    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    revalidatePath("/admin/customers");
    return NextResponse.json({ id: user._id.toString() });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { error: { formErrors: [], fieldErrors: { email: ["Email already registered"] } } },
        { status: 409 }
      );
    }
    throw error;
  }
}
