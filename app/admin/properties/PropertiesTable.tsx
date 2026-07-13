"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";

interface PropertyRow {
  id: string;
  name: string;
  slug: string;
  destination: string;
  propertyType: string;
  isActive: boolean;
}

export function PropertiesTable({ initialProperties }: { initialProperties: PropertyRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [properties, setProperties] = useState(initialProperties);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast({ title: body?.error ?? "Failed to delete property", variant: "destructive" });
        return;
      }
      setProperties((prev) => prev.filter((p) => p.id !== id));
      toast({ title: `${name} deleted.`, variant: "success" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const columns: DataTableColumn<PropertyRow>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (property) => property.name,
      className: "font-medium text-foreground",
      render: (property) => property.name,
    },
    {
      key: "destination",
      header: "Destination",
      sortValue: (property) => property.destination,
      render: (property) => property.destination,
    },
    {
      key: "type",
      header: "Type",
      sortValue: (property) => property.propertyType,
      className: "capitalize",
      render: (property) => property.propertyType,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (property) => (property.isActive ? 1 : 0),
      render: (property) => <StatusBadge status={property.isActive ? "active" : "inactive"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (property) => (
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/properties/${property.id}/edit`}>Edit</Link>
          </Button>
          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost" size="sm" disabled={deletingId === property.id}>
                <Trash2 />
                Delete
              </Button>
            }
            title={`Delete ${property.name}?`}
            description="This permanently deletes the property along with all its room types, rate plans, and availability records. This cannot be undone."
            confirmLabel="Delete"
            onConfirm={() => handleDelete(property.id, property.name)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="mt-6">
      <DataTable
        columns={columns}
        data={properties}
        rowKey={(property) => property.id}
        emptyMessage="No properties yet."
      />
    </div>
  );
}
