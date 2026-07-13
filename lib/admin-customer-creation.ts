import { connectDB } from "@/lib/db";
import { PRIVACY_POLICY_VERSION } from "@/lib/legal";
import { ConsentLog } from "@/models/ConsentLog";
import { User, type IUser, type UserRole } from "@/models/User";

export class DuplicateEmailError extends Error {
  constructor() {
    super("Email already registered");
    this.name = "DuplicateEmailError";
  }
}

export interface AdminManagedUserInput {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  loginEnabled: boolean;
  passwordHash?: string;
}

/**
 * Creates a User the way the admin panel does — bypassing self-serve email
 * verification and cookie-banner consent capture, since the admin is vouching
 * for this customer directly. Mirrors the exact gdprConsent/ConsentLog shape
 * app/api/auth/register/route.ts uses so this account is indistinguishable
 * from a self-registered one in the GDPR audit trail. Shared by the manual
 * booking route (new walk-in customer) and the Customer CRUD create route.
 */
export async function createAdminManagedUser(input: AdminManagedUserInput, adminIp: string): Promise<IUser> {
  await connectDB();

  const normalizedEmail = input.email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new DuplicateEmailError();
  }

  const timestamp = new Date();

  const user = await User.create({
    name: input.name,
    email: normalizedEmail,
    phone: input.phone || undefined,
    passwordHash: input.passwordHash,
    role: input.role,
    loginEnabled: input.loginEnabled,
    emailVerified: timestamp,
    gdprConsent: { version: PRIVACY_POLICY_VERSION, timestamp, ip: adminIp },
  });

  await ConsentLog.create({
    userId: user._id,
    consentType: "privacy_policy",
    granted: true,
    timestamp,
    ip: adminIp,
  });

  return user;
}
