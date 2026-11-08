import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { hasOwnerSession } from "@/lib/auth/session";
import { db, documents } from "@/lib/db";
import { documentSchema } from "@/lib/data/schemas";
import { DOCUMENTS_BUCKET, deleteStoredDocument, getStorageClient } from "@/lib/storage/s3";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function safeFilename(filename: string) {
  return filename.replace(/[\\/\r\n\0]/g, "_").slice(0, 180) || "document";
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return origin === new URL(request.url).origin || (process.env.NEXT_PUBLIC_APP_URL !== undefined && origin === new URL(process.env.NEXT_PUBLIC_APP_URL).origin);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!(await hasOwnerSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload form is invalid." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  if (file.size === 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Files must be between 1 byte and 15 MB." }, { status: 413 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Use a PDF, Word document, plain text file, or PNG/JPEG/WebP image." }, { status: 415 });

  const filename = safeFilename(file.name);
  const data = documentSchema.safeParse({
    name: String(form.get("name") || filename),
    category: String(form.get("category") || "other"),
    applicationId: String(form.get("applicationId") || ""),
    notes: String(form.get("notes") || ""),
    url: "",
  });
  if (!data.success) return NextResponse.json({ error: data.error.issues[0]?.message ?? "Document details are invalid." }, { status: 400 });

  const id = randomUUID();
  const storageKey = `${id}/${filename}`;
  try {
    await getStorageClient().send(new PutObjectCommand({
      Bucket: DOCUMENTS_BUCKET,
      Key: storageKey,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      ContentDisposition: "attachment",
      Metadata: { owner: "careerlog", documentId: id },
    }));

    try {
      const [created] = await db.insert(documents).values({
        id,
        ...data.data,
        applicationId: data.data.applicationId || null,
        fileName: filename,
        storageKey,
        mimeType: file.type,
        sizeBytes: file.size,
      }).returning({ id: documents.id, name: documents.name, fileName: documents.fileName, category: documents.category, sizeBytes: documents.sizeBytes });
      return NextResponse.json(created, { status: 201 });
    } catch (error) {
      await deleteStoredDocument(storageKey).catch(() => undefined);
      throw error;
    }
  } catch {
    return NextResponse.json({ error: "Could not save this file to private document storage." }, { status: 502 });
  }
}