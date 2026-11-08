"use client";

import { useParams } from "next/navigation";
import { ResourceDetail, type ResourceColumn, type ResourceField } from "@/components/data/resource-manager";

const fields: ResourceField[] = [
  { key: "name", label: "Company name", required: true },
  { key: "website", label: "Website", type: "url" },
  { key: "industry", label: "Industry" },
  { key: "location", label: "Location" },
  { key: "notes", label: "Research notes", type: "textarea" },
];

const columns: ResourceColumn[] = [
  { key: "industry", label: "Industry" },
  { key: "location", label: "Location" },
  { key: "website", label: "Website" },
];

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ResourceDetail resource="companies" id={id} title="Companies" columns={columns} fields={fields} backHref="/companies" />;
}
