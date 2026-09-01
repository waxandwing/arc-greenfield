import { NextRequest, NextResponse } from "next/server";
import { ARC_BETA_COOKIE, betaAccessToken } from "./lib/beta-access";

export async function middleware(request: NextRequest) {
  const configuredPassword = process.env.ARC_BETA_PASSWORD;
  if (!configuredPassword) return NextResponse.next();

  const pathname = request.nextUrl.pathname;
  if (pathname === "/beta" || pathname.startsWith("/api/beta-access")) return NextResponse.next();

  const expected = await betaAccessToken(configuredPassword);
  const current = request.cookies.get(ARC_BETA_COOKIE)?.value;
  if (current === expected) return NextResponse.next();

  const destination = request.nextUrl.clone();
  destination.pathname = "/beta";
  destination.search = "";
  destination.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
