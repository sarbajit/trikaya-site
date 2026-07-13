import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/ui/data-table";

export default function RatePlansLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <Skeleton className="h-4 w-32" />
      <div className="mt-2 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="mt-6">
        <DataTableSkeleton columns={6} />
      </div>
    </div>
  );
}
