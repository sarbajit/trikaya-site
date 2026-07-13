import { Skeleton } from "@/components/ui/skeleton";

export default function AvailabilityLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-7 w-64" />
      <Skeleton className="mt-1 h-4 w-full max-w-md" />
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
