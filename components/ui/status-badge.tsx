import { Badge, type BadgeProps } from "@/components/ui/badge";

export type AdminStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "active"
  | "inactive"
  | "confirmed"
  | "cancelled"
  | "completed";

const STATUS_CONFIG: Record<AdminStatus, { label: string; variant: BadgeProps["variant"] }> = {
  pending: { label: "Pending", variant: "muted" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  suspended: { label: "Suspended", variant: "destructive" },
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "muted" },
  confirmed: { label: "Confirmed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  completed: { label: "Completed", variant: "muted" },
};

export function StatusBadge({ status, className }: { status: AdminStatus; className?: string }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
