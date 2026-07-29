import { NextResponse } from "next/server";
import { revokeCurrentSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  await revokeCurrentSession();
  return NextResponse.json({ ok: true });
}
