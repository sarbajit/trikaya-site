import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { createPendingOAuthSignup } from "@/lib/oauth-signup-tokens";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email-not-verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        await connectDB();
        const user = await User.findOne({ email });
        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        if (!user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    // Only registered when configured, so local/dev without Google credentials
    // doesn't ship a dead "Continue with Google" button.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = profile?.email?.toLowerCase();
      if (!email) return false;

      await connectDB();
      const existing = await User.findOne({ email });

      if (existing) {
        // Google is a customer-only sign-in path — admins keep password-only
        // login, so their security model doesn't change now that Basic Auth
        // is retired.
        if (existing.role !== "customer") return false;

        if (!existing.emailVerified) {
          existing.emailVerified = new Date();
          await existing.save();
        }

        user.id = existing._id.toString();
        user.role = existing.role;
        return true;
      }

      // Brand-new signup: don't create the User yet — GDPR consent hasn't
      // been captured. Redirect to a one-time consent interstitial instead;
      // the User is created there, then this flow runs again and takes the
      // "existing" branch above.
      const rawToken = await createPendingOAuthSignup({
        name: profile?.name ?? email,
        email,
      });
      return `/complete-registration?token=${rawToken}`;
    },
  },
});
