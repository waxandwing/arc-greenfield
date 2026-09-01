export function isBetaPublicPath(pathname: string) {
  return pathname === "/beta" || pathname.startsWith("/api/beta-access");
}

export function isAuthPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/auth/callback") || pathname.startsWith("/api/auth/");
}

export function safeInternalNext(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
