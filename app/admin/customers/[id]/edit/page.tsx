import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PageHeader } from "../../../_components/PageHeader";
import { CustomerForm } from "../../_components/CustomerForm";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await connectDB();
  const user = await User.findById(id);
  if (!user) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit customer" description={user.name} />
      <div className="mt-8">
        <CustomerForm
          mode="edit"
          customerId={user._id.toString()}
          initialData={{
            name: user.name,
            email: user.email,
            phone: user.phone ?? "",
            role: user.role === "admin" ? "admin" : "customer",
            loginEnabled: user.loginEnabled,
          }}
        />
      </div>
    </div>
  );
}
