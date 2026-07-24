import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectDB } from "../lib/db";
import { Booking } from "../models/Booking";

async function main() {
  await connectDB();

  const result = await Booking.updateMany({ source: "manual" }, { $set: { source: "direct" } });

  console.log(`Migrated ${result.modifiedCount} booking(s) from source "manual" to "direct".`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
