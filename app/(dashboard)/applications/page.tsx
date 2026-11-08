"use client";

import { ResourceManager, formatDateColumn, type ResourceColumn, type ResourceField } from "@/components/data/resource-manager";

const fields: ResourceField[] = [
  { key: "role", label: "Role", required: true, placeholder: "Product Designer" },
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
  { key: "role", label: "Role", link: "application" },
  { key: "companyName", label: "Company" },
  { key: "status", label: "Stage", format: (value) => String(value ?? "").replace(/^./, (letter) => letter.toUpperCase()) },
  { key: "appliedAt", label: "Applied", format: formatDateColumn },
  { key: "location", label: "Location" },
];

export default function ApplicationsPage() {
  return (
    <ResourceManager resource="applications" title="Applications" description="Track each role from saved posting through the final decision." fields={fields} columns={columns} emptyTitle="No applications yet" emptyDescription="Add a role to begin tracking stages, contacts, and next steps." />
  );
}
