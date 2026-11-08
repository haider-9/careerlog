import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { hasOwnerSession } from "@/lib/auth/session";
import { applications, companies, db, documents, events } from "@/lib/db";
import { isResource, updateSchemas } from "@/lib/data/schemas";
import { deleteStoredDocument } from "@/lib/storage/s3";

type Context = { params: Promise<{ resource: string; id: string }> };

function responseError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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

export async function GET(_request: Request, { params }: Context) {
  if (!(await hasOwnerSession())) return responseError("Unauthorized", 401);
  const { resource, id } = await params;
  if (!isResource(resource)) return responseError("Unknown resource", 404);

  let record;
  switch (resource) {
    case "companies":
      [record] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
      break;
    case "applications":
      [record] = await db.select({
        id: applications.id,
        companyId: applications.companyId,
        role: applications.role,
        status: applications.status,
        appliedAt: applications.appliedAt,
        location: applications.location,
        employmentType: applications.employmentType,
        salaryRange: applications.salaryRange,
        url: applications.url,
        contactName: applications.contactName,
        contactEmail: applications.contactEmail,
        notes: applications.notes,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        companyName: companies.name,
      }).from(applications).leftJoin(companies, eq(applications.companyId, companies.id)).where(eq(applications.id, id)).limit(1);
      break;
    case "events":
      [record] = await db.select({
        id: events.id,
        applicationId: events.applicationId,
        title: events.title,
        type: events.type,
        startsAt: events.startsAt,
        notes: events.notes,
        completed: events.completed,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        applicationRole: applications.role,
      }).from(events).leftJoin(applications, eq(events.applicationId, applications.id)).where(eq(events.id, id)).limit(1);
      break;
    case "documents":
      [record] = await db.select({
        id: documents.id,
        applicationId: documents.applicationId,
        name: documents.name,
        fileName: documents.fileName,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        category: documents.category,
        url: documents.url,
        notes: documents.notes,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        applicationRole: applications.role,
      }).from(documents).leftJoin(applications, eq(documents.applicationId, applications.id)).where(eq(documents.id, id)).limit(1);
      break;
  }
  return record ? NextResponse.json(record) : responseError("Record not found", 404);
}

export async function PATCH(request: Request, { params }: Context) {
  if (!(await hasOwnerSession())) return responseError("Unauthorized", 401);
  if (!sameOrigin(request)) return responseError("Invalid request origin", 403);
  const { resource, id } = await params;
  if (!isResource(resource)) return responseError("Unknown resource", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return responseError("Invalid JSON body");
  }
  const updatedAt = new Date();
  let record;

  switch (resource) {
    case "companies": {
      const parsed = updateSchemas.companies.safeParse(body);
      if (!parsed.success) return responseError(parsed.error.issues[0]?.message ?? "Invalid company");
      [record] = await db.update(companies).set({ ...parsed.data, updatedAt }).where(eq(companies.id, id)).returning();
      break;
    }
    case "applications": {
      const parsed = updateSchemas.applications.safeParse(body);
      if (!parsed.success) return responseError(parsed.error.issues[0]?.message ?? "Invalid application");
      const data = parsed.data;
      [record] = await db.update(applications).set({
        ...data,
        ...(data.companyId !== undefined ? { companyId: data.companyId || null } : {}),
        ...(data.appliedAt !== undefined ? { appliedAt: data.appliedAt || null } : {}),
        updatedAt,
      }).where(eq(applications.id, id)).returning();
      break;
    }
    case "events": {
      const parsed = updateSchemas.events.safeParse(body);
      if (!parsed.success) return responseError(parsed.error.issues[0]?.message ?? "Invalid event");
      const data = parsed.data;
      const { startsAt, ...eventData } = data;
      [record] = await db.update(events).set({
        ...eventData,
        ...(data.applicationId !== undefined ? { applicationId: data.applicationId || null } : {}),
        ...(startsAt !== undefined ? { startsAt: new Date(startsAt) } : {}),
        updatedAt,
      }).where(eq(events.id, id)).returning();
      break;
    }
    case "documents": {
      const parsed = updateSchemas.documents.safeParse(body);
      if (!parsed.success) return responseError(parsed.error.issues[0]?.message ?? "Invalid document");
      const data = parsed.data;
      [record] = await db.update(documents).set({
        ...data,
        ...(data.applicationId !== undefined ? { applicationId: data.applicationId || null } : {}),
        updatedAt,
      }).where(eq(documents.id, id)).returning();
      break;
    }
  }
  return record ? NextResponse.json(record) : responseError("Record not found", 404);
}

export async function DELETE(request: Request, { params }: Context) {
  if (!(await hasOwnerSession())) return responseError("Unauthorized", 401);
  if (!sameOrigin(request)) return responseError("Invalid request origin", 403);
  const { resource, id } = await params;
  if (!isResource(resource)) return responseError("Unknown resource", 404);

  let deleted;
  switch (resource) {
    case "companies":
      [deleted] = await db.delete(companies).where(eq(companies.id, id)).returning({ id: companies.id });
      break;
    case "applications":
      [deleted] = await db.delete(applications).where(eq(applications.id, id)).returning({ id: applications.id });
      break;
    case "events":
      [deleted] = await db.delete(events).where(eq(events.id, id)).returning({ id: events.id });
      break;
    case "documents": {
      const [existing] = await db.select({ storageKey: documents.storageKey }).from(documents).where(eq(documents.id, id)).limit(1);
      if (!existing) return responseError("Record not found", 404);
      if (existing.storageKey) {
        try {
          await deleteStoredDocument(existing.storageKey);
        } catch {
          return responseError("Could not remove the stored file. The document record was kept.", 502);
        }
      }
      [deleted] = await db.delete(documents).where(eq(documents.id, id)).returning({ id: documents.id });
      break;
    }
  }
  return deleted ? NextResponse.json({ ok: true }) : responseError("Record not found", 404);
}