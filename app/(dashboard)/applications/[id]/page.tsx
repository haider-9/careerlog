"use client";

import { useParams } from "next/navigation";
import { ResourceDetail, formatDateColumn, type ResourceColumn, type ResourceField } from "@/components/data/resource-manager";

const fields: ResourceField[] = [
  { key: "role", label: "Role", required: true },
  { key: "companyId", label: "Company", type: "select", optionsFrom: "companies" },
  { key: "status", label: "Stage", type: "select", options: ["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"].map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value })) },
  { key: "appliedAt", label: "Applied on", type: "date" },
  { key: "location", label: "Location" },
  { key: "employmentType", label: "Employment", type: "select", options: [{ label: "Not specified", value: "__none__" }, ...["Full-time", "Part-time", "Contract", "Internship"].map((value) => ({ label: value, value }))] },
  { key: "salaryRange", label: "Compensation" },
  { key: "url", label: "Job posting URL", type: "url" },
  { key: "contactName", label: "Contact name" },
  { key: "contactEmail", label: "Contact email", type: "email" },
  { key: "notes", label: "Notes", type: "textarea" },
];

const columns: ResourceColumn[] = [
  { key: "companyName", label: "Company" },
  { key: "status", label: "Stage", format: (value) => String(value ?? "").replace(/^./, (letter) => letter.toUpperCase()) },
  { key: "appliedAt", label: "Applied", format: formatDateColumn },
  { key: "location", label: "Location" },
  { key: "employmentType", label: "Employment" },
  { key: "salaryRange", label: "Compensation" },
  { key: "url", label: "Posting URL" },
  { key: "contactName", label: "Contact" },
  { key: "contactEmail", label: "Contact email" },
];

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ResourceDetail resource="applications" id={id} title="Applications" columns={columns} fields={fields} backHref="/applications" />;
}
