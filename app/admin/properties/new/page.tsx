import { PropertyForm } from "../_components/PropertyForm";
import { PageHeader } from "../../_components/PageHeader";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New property" />
      <PropertyForm />
    </div>
  );
}
