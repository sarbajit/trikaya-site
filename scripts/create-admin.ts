import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import { User } from "../models/User";

async function main() {
  const [name, email, password] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error("Usage: npm run create-admin -- \"<name>\" <email> <password>");
    process.exit(1);
  }

  await connectDB();

  const passwordHash = await bcrypt.hash(password, 10);
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: "admin",
        emailVerified: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  console.log(`Admin ready: ${user.email} (role: ${user.role})`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("create-admin failed:", err);
    process.exit(1);
  });
