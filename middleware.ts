import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isAuthPublicPath, isBetaPublicPath } from "./lib/access-routing";
import { ARC_BETA_COOKIE, betaAccessToken } from "./lib/beta-access";
import { arcAuthConfig } from "./lib/auth-config";

function redirectTo(request: NextRequest, pathname: string, next?: string) {
  const destination = request.nextUrl.clone();
  destination.pathname = pathname;
  destination.search = "";
  if (next) destination.searchParams.set("next", next);
  return NextResponse.redirect(destination);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const betaPublic = isBetaPublicPath(pathname);
  const configuredPassword = process.env.ARC_BETA_PASSWORD;

  // Beta access is the outer gate. Auth routes are still beta-only when a beta
  // password is configured, but the beta screen itself must never require login.
  if (configuredPassword && !betaPublic) {
    const expected = await betaAccessToken(configuredPassword);
    const current = request.cookies.get(ARC_BETA_COOKIE)?.value;
    if (current !== expected) return redirectTo(request, "/beta", `${pathname}${request.nextUrl.search}`);
  }

  if (betaPublic) return NextResponse.next();

  const authConfig = arcAuthConfig();
  if (!authConfig) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(authConfig.url, authConfig.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data: { user } } = await supabase.auth.getUser();
  const authPublic = isAuthPublicPath(pathname);

  if (!user && !authPublic) return redirectTo(request, "/login");
  if (user && pathname === "/login") return redirectTo(request, "/");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
