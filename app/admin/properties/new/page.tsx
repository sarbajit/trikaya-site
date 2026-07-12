import { PropertyForm } from "../_components/PropertyForm";

export default function NewPropertyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">New property</h1>
      <PropertyForm />
    </main>
  );
}
