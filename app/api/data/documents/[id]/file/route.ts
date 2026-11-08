import { GetObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { hasOwnerSession } from "@/lib/auth/session";
import { db, documents } from "@/lib/db";
import { DOCUMENTS_BUCKET, getStorageClient } from "@/lib/storage/s3";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasOwnerSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [document] = await db.select({ storageKey: documents.storageKey, fileName: documents.fileName, mimeType: documents.mimeType })
    .from(documents).where(eq(documents.id, id)).limit(1);
  if (!document?.storageKey) return NextResponse.json({ error: "File not found" }, { status: 404 });

  try {
    const object = await getStorageClient().send(new GetObjectCommand({ Bucket: DOCUMENTS_BUCKET, Key: document.storageKey }));
    if (!object.Body) return NextResponse.json({ error: "Stored file is empty" }, { status: 404 });
    const bytes = await object.Body.transformToByteArray();
    const body = new Uint8Array(bytes.byteLength);
    body.set(bytes);
    const filename = encodeURIComponent(document.fileName || "document");
    return new Response(body.buffer, {
      headers: {
        "content-type": document.mimeType || "application/octet-stream",
        "content-disposition": `attachment; filename*=UTF-8''${filename}`,
        "content-length": String(bytes.byteLength),
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not retrieve this file." }, { status: 502 });
  }
}