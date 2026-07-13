import Link from "next/link";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../_components/PageHeader";
import { CustomersTable, type CustomerRow } from "./CustomersTable";

export default async function AdminCustomersPage() {
  await connectDB();
  const users = await User.find({ role: "customer" }).sort({ createdAt: -1 });

  const rows: CustomerRow[] = users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    loginEnabled: user.loginEnabled,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Customers"
        description="Guest accounts registered on the site or created by an admin."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/customers/new">New customer</Link>
          </Button>
        }
      />
      <div className="mt-8">
        <CustomersTable rows={rows} />
      </div>
    </div>
  );
}
