import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import {
  buildAvatarBlobPath,
  deleteBlobsBestEffort,
  isBlobConfigured,
  readBlob,
  safeExtension,
  uploadBlob,
} from "@/lib/blobStorage";
import { ACCEPTED_AVATAR_MIME_TYPES, MAX_AVATAR_BYTES, MAX_AVATAR_LABEL } from "@/lib/uploadLimits";

export const runtime = "nodejs";

/** Streams the signed-in user's own avatar. 404 (not an error page) when there isn't one — the UI falls back to an initial-letter circle. */
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const [user] = await db
    .select({ avatarBlobPath: users.avatarBlobPath, avatarMimeType: users.avatarMimeType })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);

  if (!user?.avatarBlobPath) {
    return NextResponse.json({ error: "No avatar set." }, { status: 404 });
  }

  const blob = await readBlob(user.avatarBlobPath);
  if (!blob) {
    return NextResponse.json({ error: "No avatar set." }, { status: 404 });
  }

  return new Response(blob.stream, {
    headers: {
      "Content-Type": user.avatarMimeType || "application/octet-stream",
      "Content-Length": String(blob.size),
      // Each upload gets a fresh path (see buildAvatarBlobPath), so caching
      // the old bytes under the old URL is never wrong — but this URL
      // itself has no cache-buster, so let the browser revalidate rather
      // than assume today's response is still right tomorrow.
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!isBlobConfigured()) {
    return NextResponse.json(
      { error: "Avatar uploads aren't available: Blob storage isn't configured on this deployment." },
      { status: 503 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
  }
  if (!ACCEPTED_AVATAR_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "That file type isn't supported. Use PNG, JPEG, WebP, or GIF." },
      { status: 400 }
    );
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json(
      { error: `That image is too large. Avatars are limited to ${MAX_AVATAR_LABEL}.` },
      { status: 413 }
    );
  }

  const [user] = await db
    .select({ avatarBlobPath: users.avatarBlobPath })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);

  const path = buildAvatarBlobPath({
    userId: sessionUser.id,
    extension: safeExtension(file.name, file.type.split("/")[1] ?? "png"),
  });
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await uploadBlob(path, buffer, file.type);
  } catch (e) {
    console.error(`Avatar upload failed for user ${sessionUser.id}`, e);
    return NextResponse.json({ error: "Couldn't upload that image. Try again." }, { status: 502 });
  }

  await db
    .update(users)
    .set({ avatarBlobPath: path, avatarMimeType: file.type, updatedAt: new Date() })
    .where(eq(users.id, sessionUser.id));

  // Best-effort: the new avatar is already live either way.
  if (user?.avatarBlobPath) {
    await deleteBlobsBestEffort([user.avatarBlobPath], `replaced avatar for user ${sessionUser.id}`);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const [user] = await db
    .select({ avatarBlobPath: users.avatarBlobPath })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);

  await db
    .update(users)
    .set({ avatarBlobPath: null, avatarMimeType: null, updatedAt: new Date() })
    .where(eq(users.id, sessionUser.id));

  if (user?.avatarBlobPath) {
    await deleteBlobsBestEffort([user.avatarBlobPath], `removed avatar for user ${sessionUser.id}`);
  }

  return NextResponse.json({ ok: true });
}
