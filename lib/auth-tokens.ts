import { AuthToken, type AuthTokenType } from "@/models/AuthToken";
import { generateToken, hashToken } from "@/lib/crypto-tokens";
import type { Types } from "mongoose";

const EXPIRY_MS: Record<AuthTokenType, number> = {
  "email-verification": 24 * 60 * 60 * 1000,
  "password-reset": 60 * 60 * 1000,
};

export async function createAuthToken(
  userId: Types.ObjectId,
  type: AuthTokenType
): Promise<string> {
  await AuthToken.deleteMany({ userId, type });

  const rawToken = generateToken();
  const expiresAt = new Date(Date.now() + EXPIRY_MS[type]);

  await AuthToken.create({
    userId,
    tokenHash: hashToken(rawToken),
    type,
    expiresAt,
  });

  return rawToken;
}

export async function consumeAuthToken(
  rawToken: string,
  type: AuthTokenType
): Promise<Types.ObjectId | null> {
  const tokenHash = hashToken(rawToken);

  const token = await AuthToken.findOneAndDelete({
    tokenHash,
    type,
    expiresAt: { $gt: new Date() },
  });

  return token ? token.userId : null;
}
