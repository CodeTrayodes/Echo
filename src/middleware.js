import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow health check etc if you have them
  // if (pathname === "/api/health") return NextResponse.next();

  // Special case: token generation endpoint
  if (pathname === "/api/v1/auth/token") {
    const admin = request.headers.get("x-admin-secret");
    if (admin && admin === process.env.ADMIN_TOKEN) {
      return NextResponse.next(); // allow only if admin secret matches
    }
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Protect all other v1 routes with Bearer token
  if (pathname.startsWith("/api/v1")) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const token = authHeader.split(" ")[1];
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return NextResponse.next();
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/v1/:path*"],
};
