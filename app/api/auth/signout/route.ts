import { NextResponse } from "next/server";
import { createArcServerClient } from "../../../../lib/supabase-server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const supabase = await createArcServerClient();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", url.origin), { status: 303 });
}
