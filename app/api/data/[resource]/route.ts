import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { hasOwnerSession } from "@/lib/auth/session";
import { applications, companies, db, documents, events, ownerSettings } from "@/lib/db";
import { applicationSchema, companySchema, documentSchema, eventSchema, isResource, settingsSchema } from "@/lib/data/schemas";

type Context = { params: Promise<{ resource: string }> };

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  try {
    return origin === new URL(request.url).origin || (appUrl !== undefined && origin === new URL(appUrl).origin);
  } catch {
    return false;
  }
}

async function bodyJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: Context) {
  if (!(await hasOwnerSession())) return badRequest("Unauthorized", 401);
  const { resource } = await params;
  if (resource === "settings") {
    const [saved] = await db.select().from(ownerSettings).where(eq(ownerSettings.id, "owner")).limit(1);
    return NextResponse.json(saved ?? { id: "owner", displayName: "", email: "", weeklyGoal: 10 });
  }
  if (!isResource(resource)) return badRequest("Unknown resource", 404);

  switch (resource) {
    case "companies":
      return NextResponse.json(await db.select().from(companies).orderBy(companies.name));
    case "applications":
      return NextResponse.json(await db.select({
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
      }).from(applications).leftJoin(companies, eq(applications.companyId, companies.id)).orderBy(desc(applications.updatedAt)));
    case "events":
      return NextResponse.json(await db.select({
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
      }).from(events).leftJoin(applications, eq(events.applicationId, applications.id)).orderBy(events.startsAt));
    case "documents":
      return NextResponse.json(await db.select({
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
      }).from(documents).leftJoin(applications, eq(documents.applicationId, applications.id)).orderBy(desc(documents.updatedAt)));
  }
}

export async function POST(request: Request, { params }: Context) {
  if (!(await hasOwnerSession())) return badRequest("Unauthorized", 401);
  if (!sameOrigin(request)) return badRequest("Invalid request origin", 403);
  const { resource } = await params;
  const body = await bodyJson(request);
  if (body === null) return badRequest("Invalid JSON body");
  const id = randomUUID();

  switch (resource) {
    case "companies": {
      const parsed = companySchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid company");
      const [created] = await db.insert(companies).values({ id, ...parsed.data }).returning();
      return NextResponse.json(created, { status: 201 });
    }
    case "applications": {
      const parsed = applicationSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid application");
      const [created] = await db.insert(applications).values({
        id,
        ...parsed.data,
        companyId: parsed.data.companyId || null,
        appliedAt: parsed.data.appliedAt || null,
      }).returning();
      return NextResponse.json(created, { status: 201 });
    }
    case "events": {
      const parsed = eventSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid calendar event");
      const [created] = await db.insert(events).values({
        id,
        ...parsed.data,
        applicationId: parsed.data.applicationId || null,
        startsAt: new Date(parsed.data.startsAt),
      }).returning();
      return NextResponse.json(created, { status: 201 });
    }
    case "documents": {
      const parsed = documentSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid document");
      const [created] = await db.insert(documents).values({
        id,
        ...parsed.data,
        applicationId: parsed.data.applicationId || null,
      }).returning();
      return NextResponse.json(created, { status: 201 });
    }
    case "settings": {
      const parsed = settingsSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid settings");
      const [saved] = await db.insert(ownerSettings).values({ id: "owner", ...parsed.data, updatedAt: new Date() })
        .onConflictDoUpdate({ target: ownerSettings.id, set: { ...parsed.data, updatedAt: new Date() } })
        .returning();
      return NextResponse.json(saved);
    }
    default:
      return badRequest("Unknown resource", 404);
  }
}