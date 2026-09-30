import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

/**
 * Every visit to /convert (a new tab, the sidebar link)
 * starts a fresh session by minting its id and moving to /convert/{id}.
 * Nothing is written here — the session row is created by its first
 * conversion (see claimSession in lib/convertSessions.ts), so tabs opened
 * and abandoned leave no trace.
 */
export default async function NewConvertSessionPage() {
  // Also what makes this render per-request, so each visit gets a new id.
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/convert");
  redirect(`/convert/${randomUUID()}`);
}
