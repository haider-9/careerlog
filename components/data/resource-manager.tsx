"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, CalendarDays, FilePlus2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Resource } from "@/lib/data/schemas";

export type ResourceRow = { id: string } & Record<string, unknown>;

export type ResourceField = {
  key: string;
  label: string;
  type?: "text" | "url" | "email" | "date" | "datetime-local" | "number" | "select" | "textarea" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  optionsFrom?: "companies" | "applications";
};

export type ResourceColumn = {
  key: string;
  label: string;
  link?: "application" | "company" | "document";
  format?: (value: unknown, row: ResourceRow) => string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const result = await response.json().catch(() => null) as { error?: string } | T | null;
  if (!response.ok) {
    const message = result && typeof result === "object" && "error" in result ? result.error : "Request failed.";
    throw new Error(typeof message === "string" ? message : "Request failed.");
  }
  return result as T;
}

export function useResource<T extends ResourceRow>(resource: Resource) {
  return useQuery({
    queryKey: ["resource", resource],
    queryFn: () => requestJson<T[]>(`/api/data/${resource}`),
  });
}

function displayDate(value: unknown, withTime = false) {
  if (typeof value !== "string" && !(value instanceof Date)) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }).format(date);
}

function inputValue(field: ResourceField, value: unknown) {
  if (value === null || value === undefined) return field.type === "checkbox" ? false : "";
  if (field.type === "checkbox") return Boolean(value);
  if (field.type === "datetime-local") {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return "";
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  }
  if (field.type === "date") return String(value).slice(0, 10);
  return String(value);
}

function localDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function timeOptions() {
  return Array.from({ length: 96 }, (_, index) => {
    const hour = Math.floor(index / 4);
    const minute = (index % 4) * 15;
    const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hour, minute));
    return { value, label };
  });
}

function relatedOptions(field: ResourceField, companies: ResourceRow[], applications: ResourceRow[]) {
  if (field.optionsFrom === "companies") {
    return [{ label: "No company", value: "__none__" }, ...companies.map((company) => ({ label: String(company.name), value: company.id }))];
  }
  if (field.optionsFrom === "applications") {
    return [{ label: "Not linked", value: "__none__" }, ...applications.map((application) => ({
      label: `${String(application.role)}${application.companyName ? ` · ${String(application.companyName)}` : ""}`,
      value: application.id,
    }))];
  }
  return field.options ?? [];
}

export function RecordFormDialog({
  resource,
  title,
  fields,
  record,
  initialValues,
  open,
  onOpenChange,
}: {
  resource: Resource;
  title: string;
  fields: ResourceField[];
  record: ResourceRow | null;
  initialValues?: Partial<Record<string, string | boolean>>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string | boolean>>(() => Object.fromEntries(fields.map((field) => [field.key, initialValues?.[field.key] ?? inputValue(field, record?.[field.key])] )));
  const companyQuery = useResource<ResourceRow>("companies");
  const applicationQuery = useResource<ResourceRow>("applications");
  const mutation = useMutation({
    mutationFn: async (payload: Record<string, string | boolean>) => {
      const prepared = Object.fromEntries(Object.entries(payload).map(([key, value]) => {
        const field = fields.find((candidate) => candidate.key === key);
        if (field?.type === "datetime-local" && value) return [key, new Date(String(value)).toISOString()];
        if (field?.type === "number" && value !== "") return [key, Number(value)];
        if (field?.type === "select" && value === "__none__") return [key, ""];
        return [key, value];
      }));
      const url = record ? `/api/data/${resource}/${record.id}` : `/api/data/${resource}`;
      return requestJson(url, {
        method: record ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(prepared),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resource"] });
      toast.success(record ? "Changes saved." : "Record added.");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message),
  });

  function updateField(key: string, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutation.mutateAsync(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{record ? `Edit ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`}</DialogTitle>
          <DialogDescription>Keep the details current in your search workspace.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const value = values[field.key] ?? (field.type === "checkbox" ? false : "");
              const options = relatedOptions(field, companyQuery.data ?? [], applicationQuery.data ?? []);
              const dateValue = String(value);
              const datePart = dateValue.slice(0, 10);
              const selectedDate = datePart ? new Date(`${datePart}T12:00:00`) : undefined;
              const timeValue = field.type === "datetime-local" && dateValue.includes("T") ? dateValue.slice(11, 16) : "09:00";
              return (
                <div key={field.key} className={field.type === "textarea" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                  {field.type === "checkbox" ? (
                    <div className="flex min-h-10 items-center gap-2"><Checkbox id={`field-${field.key}`} checked={Boolean(value)} onCheckedChange={(checked) => updateField(field.key, checked === true)} /><Label htmlFor={`field-${field.key}`}>{field.label}</Label></div>
                  ) : <Label htmlFor={`field-${field.key}`}>{field.label}{field.required ? " *" : ""}</Label>}
                  {field.type === "textarea" ? (
                    <Textarea id={`field-${field.key}`} value={String(value)} placeholder={field.placeholder} onChange={(event) => updateField(field.key, event.target.value)} />
                  ) : field.type === "select" ? (
                    <Select value={String(value) || "__none__"} onValueChange={(nextValue) => { if (typeof nextValue === "string") updateField(field.key, nextValue === "__none__" ? "" : nextValue); }}>
                      <SelectTrigger id={`field-${field.key}`} className="w-full" aria-required={field.required}><SelectValue placeholder={`Choose ${field.label.toLowerCase()}`} /></SelectTrigger>
                      <SelectContent>{options.map((option) => <SelectItem key={option.value || "__empty"} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : field.type === "date" || field.type === "datetime-local" ? (
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger render={<Button type="button" variant="outline" className="min-w-0 flex-1 justify-start text-left font-normal" />}>
                          <CalendarDays className="size-4" />
                          {selectedDate ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(selectedDate) : "Choose date"}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={selectedDate} onSelect={(nextDate) => {
                            if (!nextDate) return;
                            const day = localDateValue(nextDate);
                            updateField(field.key, field.type === "date" ? day : `${day}T${timeValue}`);
                          }} />
                        </PopoverContent>
                      </Popover>
                      {field.type === "datetime-local" ? <Select value={timeValue} onValueChange={(nextValue) => {
                        if (typeof nextValue !== "string") return;
                        const day = selectedDate ? localDateValue(selectedDate) : localDateValue(new Date());
                        updateField(field.key, `${day}T${nextValue}`);
                      }}>
                        <SelectTrigger className="w-32" aria-label="Choose time"><SelectValue /></SelectTrigger>
                        <SelectContent>{timeOptions().map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                      </Select> : null}
                    </div>
                  ) : field.type !== "checkbox" ? (
                    <Input
                      id={`field-${field.key}`}
                      type={field.type ?? "text"}
                      required={field.required}
                      min={field.type === "number" ? 1 : undefined}
                      value={String(value)}
                      placeholder={field.placeholder}
                      onChange={(event) => updateField(field.key, event.target.value)}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ResourceManager({
  resource,
  title,
  description,
  fields,
  columns,
  emptyTitle,
  emptyDescription,
}: {
  resource: Resource;
  title: string;
  description: string;
  fields: ResourceField[];
  columns: ResourceColumn[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";
  const query = useResource<ResourceRow>(resource);
  const [search, setSearch] = useState(initialSearch);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceRow | null>(null);
  const deleteMutation = useMutation({
    mutationFn: (id: string) => requestJson(`/api/data/${resource}/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resource"] });
      toast.success("Record deleted.");
    },
    onError: (error) => toast.error(error.message),
  });

  const rows = useMemo(() => (query.data ?? []).filter((row) => {
    const phrase = search.trim().toLowerCase();
    return !phrase || columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(phrase));
  }), [columns, query.data, search]);

  function editRecord(row: ResourceRow) {
    setEditing(row);
    setDialogOpen(true);
  }

  function addRecord() {
    setEditing(null);
    setDialogOpen(true);
  }

  function deleteRecord(row: ResourceRow) {
    if (window.confirm(`Delete this ${title.toLowerCase().replace(/s$/, "")} record? This cannot be undone.`)) {
      deleteMutation.mutate(row.id);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Workspace / {title}</p>
          <h1 className="mt-2 font-serif text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={addRecord}><Plus className="mr-2 size-4" /> Add {title.slice(0, -1).toLowerCase()}</Button>
      </div>

      <Card className="rounded-lg shadow-none">
        <CardHeader className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{rows.length} {rows.length === 1 ? "record" : "records"}</p>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {query.isLoading ? <p className="p-8 text-center text-sm text-muted-foreground">Loading records…</p> : null}
          {query.isError ? <p className="p-8 text-center text-sm text-destructive">{query.error.message}</p> : null}
          {!query.isLoading && !query.isError && rows.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <FilePlus2 className="mb-3 size-8 text-primary" />
              <h2 className="font-serif text-xl">{search ? "No matches" : emptyTitle}</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">{search ? "Try a different search term." : emptyDescription}</p>
              {!search ? <Button variant="outline" className="mt-5" onClick={addRecord}><Plus className="mr-2 size-4" /> Add first record</Button> : null}
            </div>
          ) : null}
          {rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead><tr className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                  {columns.map((column) => <th key={column.key} className="px-4 py-3 font-medium">{column.label}</th>)}
                  <th className="w-24 px-4 py-3 text-right font-medium">Actions</th>
                </tr></thead>
                <tbody>
                  {rows.map((row) => <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    {columns.map((column) => {
                      const raw = row[column.key];
                      const value = column.format ? column.format(raw, row) : raw instanceof Date ? displayDate(raw) : String(raw ?? "—");
                      const href = column.link === "application" ? `/applications/${row.id}` : column.link === "company" ? `/companies/${row.id}` : column.link === "document" && row.fileName ? `/api/data/documents/${row.id}/file` : null;
                      return <td key={column.key} className="max-w-[280px] truncate px-4 py-3 text-foreground">
                        {href ? <Link className="inline-flex items-center gap-1 font-medium text-primary hover:underline" href={href}>{column.link === "document" ? "Download" : value}{column.link === "document" ? <ArrowUpRight className="size-3" /> : null}</Link> : column.key === "url" && typeof raw === "string" && raw ? <a href={raw} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Open<ArrowUpRight className="size-3" /></a> : value}
                      </td>;
                    })}
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${title.toLowerCase()} record`} onClick={() => editRecord(row)}><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${title.toLowerCase()} record`} disabled={deleteMutation.isPending} onClick={() => deleteRecord(row)}><Trash2 className="size-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {dialogOpen ? <RecordFormDialog key={editing?.id ?? "new"} resource={resource} title={title.slice(0, -1)} fields={fields} record={editing} open onOpenChange={setDialogOpen} /> : null}
    </div>
  );
}

export function ResourceDetail({
  resource,
  id,
  title,
  columns,
  fields,
  backHref,
}: {
  resource: Resource;
  id: string;
  title: string;
  columns: ResourceColumn[];
  fields: ResourceField[];
  backHref: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const query = useQuery({
    queryKey: ["resource", resource, id],
    queryFn: () => requestJson<ResourceRow>(`/api/data/${resource}/${id}`),
  });
  const deleteMutation = useMutation({
    mutationFn: () => requestJson(`/api/data/${resource}/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resource"] });
      router.replace(backHref);
      toast.success("Record deleted.");
    },
    onError: (error) => toast.error(error.message),
  });

  if (query.isLoading) return <p className="p-8 text-sm text-muted-foreground">Loading record…</p>;
  if (query.isError || !query.data) return <div className="space-y-4"><p className="text-destructive">{query.error?.message ?? "Record not found."}</p><Button variant="outline" onClick={() => router.replace(backHref)}>Back to {title.toLowerCase()}</Button></div>;

  const row = query.data;
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <Link href={backHref} className="text-xs text-muted-foreground hover:text-foreground">Back to {title}</Link>
          <p className="mt-3 font-mono text-[11px] uppercase text-muted-foreground">Workspace / {title} / Detail</p>
          <h1 className="mt-2 font-serif text-3xl">{String(row.role ?? row.name ?? row.title ?? title)}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{String(row.companyName ?? row.industry ?? "Record details")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDialogOpen(true)}><Pencil className="mr-2 size-4" /> Edit</Button>
          <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => {
            if (window.confirm(`Delete this ${title.toLowerCase().replace(/s$/, "")} record? This cannot be undone.`)) deleteMutation.mutate();
          }}><Trash2 className="mr-2 size-4" /> Delete</Button>
        </div>
      </div>
      <Card className="rounded-lg shadow-none">
        <CardContent className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {columns.map((column) => <div key={column.key} className="min-w-0">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">{column.label}</p>
            <p className="mt-1 break-words text-sm">{column.format ? column.format(row[column.key], row) : String(row[column.key] ?? "—")}</p>
          </div>)}
          {typeof row.notes === "string" && row.notes ? <div className="sm:col-span-2 lg:col-span-3">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{row.notes}</p>
          </div> : null}
        </CardContent>
      </Card>
      {dialogOpen ? <RecordFormDialog key={row.id} resource={resource} title={title.slice(0, -1)} fields={fields} record={row} open onOpenChange={setDialogOpen} /> : null}
    </div>
  );
}

export function formatDateColumn(value: unknown) {
  return displayDate(value);
}

export function formatDateTimeColumn(value: unknown) {
  return displayDate(value, true);
}