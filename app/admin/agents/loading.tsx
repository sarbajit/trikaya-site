import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/ui/data-table";

export default function AdminAgentsLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <Skeleton className="h-7 w-72" />
      <Skeleton className="mt-2 h-4 w-96" />
      <div className="mt-6">
        <DataTableSkeleton columns={6} />
      </div>
    </div>
  );
}
