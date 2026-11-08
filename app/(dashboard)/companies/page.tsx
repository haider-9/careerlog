"use client";

import { ResourceManager, type ResourceColumn, type ResourceField } from "@/components/data/resource-manager";

const fields: ResourceField[] = [
  { key: "name", label: "Company name", required: true },
  { key: "website", label: "Website", type: "url" },
  { key: "industry", label: "Industry" },
  { key: "location", label: "Location" },
  { key: "notes", label: "Research notes", type: "textarea" },
];

const columns: ResourceColumn[] = [
  { key: "name", label: "Company", link: "company" },
  { key: "industry", label: "Industry" },
  { key: "location", label: "Location" },
  { key: "website", label: "Website" },
];

export default function CompaniesPage() {
  return (
    <ResourceManager resource="companies" title="Companies" description="Keep a lightweight research file for teams you are pursuing." fields={fields} columns={columns} emptyTitle="No companies tracked" emptyDescription="Add a company to attach research notes to your search." />
  );
}
