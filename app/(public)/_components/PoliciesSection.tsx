import { ScrollText } from "lucide-react";
import { RICH_TEXT_CLASS } from "@/lib/rich-text-classes";
import { cn } from "@/lib/utils";

interface Policies {
  checkIn?: string;
  checkOut?: string;
  houseRules?: string;
}

export function PoliciesSection({ policies }: { policies?: Policies }) {
  const checkIn = policies?.checkIn ?? "2:00 PM";
  const checkOut = policies?.checkOut ?? "11:00 AM";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-8">
        <div>
          <p className="text-sm text-muted-foreground">Check-in</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{checkIn}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Check-out</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{checkOut}</p>
        </div>
      </div>
      <div className="rounded-md border border-border bg-card p-4">
        <ScrollText className="size-4 text-primary" aria-hidden />
        <p className="mt-2 text-lg font-semibold text-foreground">House rules</p>
        <div
          className={cn(RICH_TEXT_CLASS, "mt-1 text-sm text-muted-foreground")}
          dangerouslySetInnerHTML={{
            __html:
              policies?.houseRules ||
              "Standard house rules apply. Details will be shared upon booking confirmation.",
          }}
        />
      </div>
    </div>
  );
}
