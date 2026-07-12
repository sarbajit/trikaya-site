import { connectDB } from "@/lib/db";
import { Property } from "@/models/Property";

export type HomepageDisplayMode = "empty" | "single" | "portfolio" | "portal";

/**
 * Chooses which home page layout to render, purely from the live property
 * count (spec section 4's "auto" behavior). Thresholds match the spec's own
 * bucketing: 2-10 properties is a "small portfolio", 10s-100s is a "large
 * catalogue" portal.
 */
export async function resolveHomepageMode(): Promise<HomepageDisplayMode> {
  await connectDB();
  const count = await Property.countDocuments({ isActive: true });
  if (count === 0) return "empty";
  if (count === 1) return "single";
  if (count <= 10) return "portfolio";
  return "portal";
}
