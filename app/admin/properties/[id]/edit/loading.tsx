import { FormSkeleton } from "../../../_components/FormSkeleton";
import { DataTableSkeleton } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditPropertyLoading() {
  return (
    <>
      <FormSkeleton sections={5} />
      <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-border p-6">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4">
          <DataTableSkeleton columns={6} rows={3} />
        </div>
      </div>
    </>
  );
}
