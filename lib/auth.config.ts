import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";

// Edge-safe config shared by middleware.ts and lib/auth.ts. Must not import
// Mongoose or bcryptjs — both are Node-only and break the Edge runtime bundle
// that middleware.ts compiles into.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
    authorized({ auth, request }) {
      const isAdmin = auth?.user?.role === "admin";
      if (isAdmin) return true;

      if (request.nextUrl.pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const signInUrl = new URL("/login", request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    },
  },
};
