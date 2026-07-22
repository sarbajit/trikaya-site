import { Clock, ScrollText, ShieldCheck } from "lucide-react";
import { RICH_TEXT_CLASS } from "@/lib/rich-text-classes";
import { cn } from "@/lib/utils";

interface Policies {
  checkIn?: string;
  checkOut?: string;
  houseRules?: string;
  cancellationPolicy?: string;
}

export function PoliciesSection({ policies }: { policies?: Policies }) {
  const items = [
    {
      icon: Clock,
      title: "Check-in / check-out",
      body:
        policies?.checkIn || policies?.checkOut
          ? `Check-in from ${policies?.checkIn ?? "2:00 PM"}, check-out by ${policies?.checkOut ?? "11:00 AM"}.`
          : "Check-in from 2:00 PM, check-out by 11:00 AM.",
    },
    {
      icon: ScrollText,
      title: "House rules",
      body: policies?.houseRules || "Standard house rules apply. Details will be shared upon booking confirmation.",
    },
    {
      icon: ShieldCheck,
      title: "Cancellation policy",
      body:
        policies?.cancellationPolicy ||
        "Refer to our refund & cancellation policy for this property's terms.",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="rounded-md border border-border bg-card p-4">
          <item.icon className="size-4 text-primary" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-foreground">{item.title}</p>
          <div
            className={cn(RICH_TEXT_CLASS, "mt-1 text-sm text-muted-foreground")}
            dangerouslySetInnerHTML={{ __html: item.body }}
          />
        </div>
      ))}
    </div>
  );
}
