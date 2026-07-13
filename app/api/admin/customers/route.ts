import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createAdminManagedUser, DuplicateEmailError } from "@/lib/admin-customer-creation";
import { getClientIp } from "@/lib/http";
import { adminCreateCustomerSchema } from "@/lib/validation/customer";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = adminCreateCustomerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, phone, role, loginEnabled, password } = parsed.data;

  try {
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
    const user = await createAdminManagedUser(
      { name, email, phone, role, loginEnabled, passwordHash },
      getClientIp(request)
    );
    revalidatePath("/admin/customers");
    return NextResponse.json({ id: user._id.toString() }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return NextResponse.json(
        { error: { formErrors: [], fieldErrors: { email: ["Email already registered"] } } },
        { status: 409 }
      );
    }
    throw error;
  }
}
