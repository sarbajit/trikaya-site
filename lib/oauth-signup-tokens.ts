import { PendingOAuthSignup } from "@/models/PendingOAuthSignup";
import { generateToken, hashToken } from "@/lib/crypto-tokens";

const EXPIRY_MS = 15 * 60 * 1000;

export async function createPendingOAuthSignup(params: { name: string; email: string }): Promise<string> {
  const rawToken = generateToken();
  const expiresAt = new Date(Date.now() + EXPIRY_MS);

  await PendingOAuthSignup.create({
    tokenHash: hashToken(rawToken),
    name: params.name,
    email: params.email.toLowerCase(),
    expiresAt,
  });

  return rawToken;
}

export async function consumePendingOAuthSignup(
  rawToken: string
): Promise<{ name: string; email: string } | null> {
  const tokenHash = hashToken(rawToken);

  const pending = await PendingOAuthSignup.findOneAndDelete({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  return pending ? { name: pending.name, email: pending.email } : null;
}
