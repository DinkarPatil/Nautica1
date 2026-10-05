import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES: Record<string, string[]> = {
  "/dashboard": ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel", "port_ops"],
  "/fleet":     ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel", "port_ops"],
  "/ports":     ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel", "port_ops"],
  "/risk":      ["ai_core", "executive", "fleet_ops", "risk_intel"],
  "/trade":     ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel"],
  "/agi":       ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel"],
  "/voyage":    ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel", "port_ops"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip landing/login/unauthorized/static
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check session cookie (set by client-side AuthContext)
  const sessionCookie = request.cookies.get("glimmora_session");

  if (!sessionCookie?.value) {
    // No session → redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Parse role from cookie
  let role: string | null = null;
  try {
    const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
    role = parsed.role;
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check page-level access
  const matchedRoute = Object.keys(PROTECTED_ROUTES).find((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (matchedRoute) {
    const allowedRoles = PROTECTED_ROUTES[matchedRoute];
    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|unauthorized).*)",
  ],
};
