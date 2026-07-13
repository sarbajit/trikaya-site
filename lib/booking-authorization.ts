import type { Session } from "next-auth";
import type { IBooking } from "@/models/Booking";

/**
 * Shared ownership rule for booking-scoped routes/pages: the booking's
 * customer, the booking's agent, or any admin.
 */
export function canAccessBooking(
  session: Session | null | undefined,
  booking: Pick<IBooking, "userId" | "agentId">
): boolean {
  if (!session?.user) return false;
  if (session.user.role === "admin") return true;

  const isOwner =
    (session.user.role === "customer" && booking.userId?.toString() === session.user.id) ||
    (session.user.role === "agent" && booking.agentId?.toString() === session.user.id);
  return isOwner;
}
