import { Skeleton } from "@/components/ui/skeleton";

export function FormSkeleton({ sections = 3, titleWidth = "w-56" }: { sections?: number; titleWidth?: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className={`h-7 ${titleWidth}`} />
      <div className="mt-8 flex flex-col gap-6">
        {Array.from({ length: sections }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-xl border border-border p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
