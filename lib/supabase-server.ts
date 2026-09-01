import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { arcAuthConfig } from "./auth-config";

export async function createArcServerClient() {
  const config = arcAuthConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write refreshed cookies. Route handlers/actions can.
        }
      }
    }
  });
}
