"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";

interface RoomTypeRow {
  id: string;
  name: string;
  pricingModel: string;
  basePriceB2C: number;
  basePriceB2B: number;
  totalInventory: number;
}

export function RoomTypesSection({
  propertyId,
  initialRoomTypes,
}: {
  propertyId: string;
  initialRoomTypes: RoomTypeRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/room-types/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast({ title: body?.error ?? "Failed to delete room type", variant: "destructive" });
        return;
      }
      setRoomTypes((prev) => prev.filter((rt) => rt.id !== id));
      toast({ title: `${name} deleted.`, variant: "success" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const columns: DataTableColumn<RoomTypeRow>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (rt) => rt.name,
      className: "font-medium text-foreground",
      render: (rt) => rt.name,
    },
    {
      key: "pricingModel",
      header: "Pricing model",
      render: (rt) => (rt.pricingModel === "per_night" ? "Per night" : "Per person/night"),
    },
    {
      key: "b2c",
      header: "B2C rate",
      sortValue: (rt) => rt.basePriceB2C,
      render: (rt) => `₹${rt.basePriceB2C.toLocaleString("en-IN")}`,
    },
    {
      key: "b2b",
      header: "B2B rate",
      sortValue: (rt) => rt.basePriceB2B,
      render: (rt) => `₹${rt.basePriceB2B.toLocaleString("en-IN")}`,
    },
    {
      key: "inventory",
      header: "Inventory",
      sortValue: (rt) => rt.totalInventory,
      render: (rt) => rt.totalInventory,
    },
    {
      key: "actions",
      header: "Actions",
      render: (roomType) => (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/room-types/${roomType.id}/edit`}>Edit</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/room-types/${roomType.id}/rate-plans`}>Rates</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/room-types/${roomType.id}/availability`}>Availability</Link>
          </Button>
          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost" size="sm" disabled={deletingId === roomType.id}>
                <Trash2 />
              </Button>
            }
            title={`Delete ${roomType.name}?`}
            description="This permanently deletes the room type along with its rate plans and availability records. This cannot be undone."
            confirmLabel="Delete"
            onConfirm={() => handleDelete(roomType.id, roomType.name)}
          />
        </div>
      ),
    },
  ];

  return (
    <Card className="mt-8">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Room types</CardTitle>
        <Button asChild size="sm">
          <Link href={`/admin/properties/${propertyId}/room-types/new`}>Add room type</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={roomTypes}
          rowKey={(rt) => rt.id}
          emptyMessage="No room types yet."
        />
      </CardContent>
    </Card>
  );
}
