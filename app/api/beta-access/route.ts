import { NextResponse } from "next/server";
import { ARC_BETA_COOKIE, betaAccessToken } from "../../../lib/beta-access";

export async function POST(request: Request) {
  const configuredPassword = process.env.ARC_BETA_PASSWORD;
  if (!configuredPassword) {
    return NextResponse.json({ ok: true, gateDisabled: true });
  }

  let submittedPassword = "";
  try {
    const body = await request.json() as { password?: unknown };
    submittedPassword = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const [expected, submitted] = await Promise.all([
    betaAccessToken(configuredPassword),
    betaAccessToken(submittedPassword)
  ]);

  if (submitted !== expected) {
    return NextResponse.json({ ok: false, error: "That beta password does not match." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ARC_BETA_COOKIE,
    value: expected,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
