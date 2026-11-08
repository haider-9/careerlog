"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import { ResourceManager, type ResourceColumn, type ResourceField } from "@/components/data/resource-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResource, type ResourceRow } from "@/components/data/resource-manager";

const fields: ResourceField[] = [
  { key: "name", label: "Document name", required: true },
  { key: "category", label: "Category", type: "select", options: ["resume", "cover-letter", "portfolio", "reference", "other"].map((value) => ({ label: value.replace("-", " ").replace(/^./, (letter) => letter.toUpperCase()), value })) },
  { key: "url", label: "Document URL", type: "url", placeholder: "https://…" },
  { key: "applicationId", label: "Related application", type: "select", optionsFrom: "applications" },
  { key: "notes", label: "Notes", type: "textarea" },
];

const columns: ResourceColumn[] = [
  { key: "name", label: "Document" },
  { key: "category", label: "Category", format: (value) => String(value ?? "").replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase()) },
  { key: "applicationRole", label: "Application" },
  { key: "fileName", label: "Stored file", link: "document", format: (value) => value ? String(value) : "—" },
  { key: "url", label: "Link" },
];

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const applicationQuery = useResource<ResourceRow>("applications");
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("resume");
  const [applicationId, setApplicationId] = useState("");
  const [inputKey, setInputKey] = useState(0);
  const uploadMutation = useMutation({
    mutationFn: async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!file) throw new Error("Choose a file first.");
      const body = new FormData();
      body.set("file", file);
      body.set("name", name.trim() || file.name);
      body.set("category", category);
      body.set("applicationId", applicationId);
      const response = await fetch("/api/data/documents/upload", { method: "POST", body });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? "Could not upload this file.");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resource"] });
      setFile(null);
      setName("");
      setApplicationId("");
      setInputKey((current) => current + 1);
      toast.success("Document uploaded.");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5"><p className="font-mono text-[11px] uppercase text-muted-foreground">Workspace / Documents</p><h1 className="mt-2 font-serif text-3xl">Application materials</h1><p className="mt-2 text-sm text-muted-foreground">Private file storage and durable links, connected to the roles they support.</p></div>
      <section className="space-y-4 border-b border-border pb-6">
        <div><h2 className="font-serif text-xl">Upload a file</h2><p className="mt-1 text-xs text-muted-foreground">PDF, Word, text, or image files up to 15 MB. Files are stored privately.</p></div>
        <form className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1.2fr_auto]" onSubmit={(event) => { void uploadMutation.mutateAsync(event); }}>
          <div className="space-y-2"><Label htmlFor="document-file">File</Label><Input key={inputKey} id="document-file" type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></div>
          <div className="space-y-2"><Label htmlFor="document-name">Display name</Label><Input id="document-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={file?.name ?? "Optional"} /></div>
          <div className="space-y-2"><Label htmlFor="document-category">Category</Label><Select value={category} onValueChange={(value) => { if (typeof value === "string") setCategory(value); }}><SelectTrigger id="document-category" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{["resume", "cover-letter", "portfolio", "reference", "other"].map((value) => <SelectItem key={value} value={value}>{value.replace("-", " ").replace(/^./, (letter) => letter.toUpperCase())}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="document-application">Related application</Label><Select value={applicationId || "__none__"} onValueChange={(value) => { if (typeof value === "string") setApplicationId(value === "__none__" ? "" : value); }}><SelectTrigger id="document-application" className="w-full"><SelectValue placeholder="Not linked" /></SelectTrigger><SelectContent><SelectItem value="__none__">Not linked</SelectItem>{(applicationQuery.data ?? []).map((application) => <SelectItem key={application.id} value={application.id}>{String(application.role)}{application.companyName ? ` · ${String(application.companyName)}` : ""}</SelectItem>)}</SelectContent></Select></div>
          <Button type="submit" disabled={uploadMutation.isPending || !file}><FileUp className="size-4" /> {uploadMutation.isPending ? "Uploading…" : "Upload"}</Button>
        </form>
      </section>
      <ResourceManager resource="documents" title="Documents" description="Edit metadata, attach a document to a role, open external links, or download private files." fields={fields} columns={columns} emptyTitle="No documents yet" emptyDescription="Upload a file or add an external document link." />
    </div>
  );
}
