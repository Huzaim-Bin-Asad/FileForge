import { NextResponse } from "next/server";
import { rotateSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  const rotated = await rotateSession();
  if (!rotated) {
    return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
