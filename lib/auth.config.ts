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
        token.approved = user.approved;
        token.agentStatus = user.agentStatus;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.approved = token.approved;
      session.user.agentStatus = token.agentStatus;
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAdmin = auth?.user?.role === "admin";
      if (isAdmin) return true;

      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (pathname.startsWith("/agent/dashboard")) {
        if (auth?.user?.role === "agent") return true;

        const agentLoginUrl = new URL("/agent/login", request.url);
        agentLoginUrl.searchParams.set("callbackUrl", request.url);
        return NextResponse.redirect(agentLoginUrl);
      }

      // Any authenticated user (customer/agent/admin) may proceed — the
      // /account layout itself redirects non-customer roles onward, so this
      // gate only needs to require a session, not a specific role.
      if (pathname.startsWith("/account")) {
        if (auth?.user) return true;

        const signInUrl = new URL("/login", request.url);
        signInUrl.searchParams.set("callbackUrl", request.url);
        return NextResponse.redirect(signInUrl);
      }

      const signInUrl = new URL("/login", request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    },
  },
};
