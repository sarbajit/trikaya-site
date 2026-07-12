import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Property } from "@/models/Property";
import { Button } from "@/components/ui/button";
import { PropertiesTable } from "./PropertiesTable";

export default async function AdminPropertiesPage() {
  await connectDB();
  const properties = await Property.find().sort({ name: 1 });

  const initialProperties = properties.map((property) => ({
    id: property._id.toString(),
    name: property.name,
    slug: property.slug,
    destination: property.destination,
    propertyType: property.propertyType,
    isActive: property.isActive,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Properties</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage properties, room types, rate plans, and availability.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/properties/new">New property</Link>
        </Button>
      </div>
      <PropertiesTable initialProperties={initialProperties} />
    </main>
  );
}
