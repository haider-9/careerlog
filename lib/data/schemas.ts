import { z } from "zod";

const shortText = z.string().trim().max(500).optional().default("");
const notes = z.string().trim().max(10000).optional().default("");
const idOrEmpty = z.string().trim().max(64).optional().default("");

export const companySchema = z.object({
  name: z.string().trim().min(1).max(150),
  website: shortText,
  industry: shortText,
  location: shortText,
  notes,
});

export const applicationSchema = z.object({
  role: z.string().trim().min(1).max(180),
  companyId: idOrEmpty,
  status: z.enum(["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"]).default("saved"),
  appliedAt: z.string().trim().max(10).optional().default("").refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value)),
  location: shortText,
  employmentType: shortText,
  salaryRange: shortText,
  url: z.string().trim().max(2048).optional().default(""),
  contactName: shortText,
  contactEmail: z.string().trim().max(254).optional().default("").refine((value) => !value || z.email().safeParse(value).success),
  notes,
});

export const eventSchema = z.object({
  title: z.string().trim().min(1).max(180),
  applicationId: idOrEmpty,
  type: z.enum(["interview", "follow-up", "task", "other"]).default("follow-up"),
  startsAt: z.string().min(1).max(64).refine((value) => !Number.isNaN(new Date(value).getTime())),
  notes,
  completed: z.boolean().optional().default(false),
});

export const documentSchema = z.object({
  name: z.string().trim().min(1).max(180),
  applicationId: idOrEmpty,
  category: z.enum(["resume", "cover-letter", "portfolio", "reference", "other"]).default("other"),
  url: z.string().trim().max(2048).optional().default(""),
  notes,
});

export const settingsSchema = z.object({
  displayName: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().max(254).optional().default("").refine((value) => !value || z.email().safeParse(value).success),
  weeklyGoal: z.number().int().min(1).max(200).default(10),
});

export const updateSchemas = {
  companies: companySchema.partial(),
  applications: applicationSchema.partial(),
  events: eventSchema.partial(),
  documents: documentSchema.partial(),
};

export type Resource = keyof typeof updateSchemas;

export function isResource(value: string): value is Resource {
  return value in updateSchemas;
}