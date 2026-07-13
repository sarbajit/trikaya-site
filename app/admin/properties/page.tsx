import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Property } from "@/models/Property";
import { Button } from "@/components/ui/button";
import { PropertiesTable } from "./PropertiesTable";
import { PageHeader } from "../_components/PageHeader";

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
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Properties"
        description="Manage properties, room types, rate plans, and availability."
        actions={
          <Button asChild>
            <Link href="/admin/properties/new">New property</Link>
          </Button>
        }
      />
      <PropertiesTable initialProperties={initialProperties} />
    </div>
  );
}
