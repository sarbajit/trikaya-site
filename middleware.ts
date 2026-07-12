import { NextResponse, type NextRequest } from "next/server";

function isAuthorized(request: NextRequest): boolean {
  const user = process.env.ADMIN_BASIC_AUTH_USER;
  const password = process.env.ADMIN_BASIC_AUTH_PASSWORD;
  if (!user || !password) return false;

  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Basic ")) return false;

  const decoded = atob(header.slice("Basic ".length));
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;

  const suppliedUser = decoded.slice(0, separatorIndex);
  const suppliedPassword = decoded.slice(separatorIndex + 1);
  return suppliedUser === user && suppliedPassword === password;
}

export function middleware(request: NextRequest) {
  if (isAuthorized(request)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
