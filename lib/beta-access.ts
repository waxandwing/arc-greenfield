export const ARC_BETA_COOKIE = "arc_beta_access";

export async function betaAccessToken(password: string) {
  const bytes = new TextEncoder().encode(`arc-beta:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
