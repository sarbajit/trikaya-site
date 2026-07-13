import { PageHeader } from "../../_components/PageHeader";
import { CustomerForm } from "../_components/CustomerForm";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New customer" description="Create a customer or admin account directly." />
      <div className="mt-8">
        <CustomerForm mode="create" />
      </div>
    </div>
  );
}
