"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [properties, setProperties] = useState(initialProperties);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Failed to delete property");
        return;
      }
      setProperties((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => (
            <TableRow key={property.id}>
              <TableCell className="font-medium text-foreground">{property.name}</TableCell>
              <TableCell>{property.destination}</TableCell>
              <TableCell className="capitalize">{property.propertyType}</TableCell>
              <TableCell>
                <Badge variant={property.isActive ? "success" : "muted"}>
                  {property.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/properties/${property.id}/edit`}>Edit</Link>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" disabled={deletingId === property.id}>
                        <Trash2 />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle>Delete {property.name}?</DialogTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        This permanently deletes the property along with all its room types, rate plans,
                        and availability records. This cannot be undone.
                      </p>
                      <div className="mt-4 flex justify-end gap-2">
                        <DialogClose asChild>
                          <Button type="button" variant="outline" size="sm">
                            Cancel
                          </Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(property.id)}>
                            Delete
                          </Button>
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {properties.length === 0 && <p className="text-sm text-muted-foreground">No properties yet.</p>}
    </div>
  );
}
