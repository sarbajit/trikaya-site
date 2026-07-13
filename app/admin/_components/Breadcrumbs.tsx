"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  properties: "Properties",
  agents: "Agents",
  "room-types": "Room types",
  "rate-plans": "Rate plans",
  availability: "Availability",
  edit: "Edit",
  new: "New",
  bookings: "Bookings",
  reviews: "Reviews",
  content: "Content",
  dashboard: "Dashboard",
};

const ID_SEGMENT_RE = /^[a-f0-9]{20,}$/i;

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; href: string }[] = [];
  let hrefAcc = "";
  for (const segment of segments) {
    hrefAcc += `/${segment}`;
    if (ID_SEGMENT_RE.test(segment)) continue;
    crumbs.push({ label: SEGMENT_LABELS[segment] ?? segment, href: hrefAcc });
  }

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3.5 shrink-0" />}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground hover:underline">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
