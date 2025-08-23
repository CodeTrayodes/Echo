import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip auth in middleware for the cron path; the route does its own secret check
  if (pathname === "/api/internal/webhooks/dispatch") {
    return NextResponse.next();
  }

  // Admin-only utility endpoints guarded by X-Admin-Secret in the route/mw
  const adminOnly = ["/api/v1/auth/token", "/api/v1/webhooks/register"];
  if (adminOnly.includes(pathname)) {
    const admin = request.headers.get("x-admin-secret");
    if (admin && admin === process.env.ADMIN_TOKEN) return NextResponse.next();
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Protect all other /api/v1 routes with Bearer
  if (pathname.startsWith("/api/v1")) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    try {
      jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
      return NextResponse.next();
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid or expired token" }), { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/api/v1/:path*", "/api/internal/:path*"] };
