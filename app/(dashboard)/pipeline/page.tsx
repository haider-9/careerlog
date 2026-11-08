"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useResource, type ResourceRow } from "@/components/data/resource-manager";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const stages = ["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"];

export default function PipelinePage() {
  const queryClient = useQueryClient();
  const query = useResource<ResourceRow>("applications");
  const moveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/data/applications/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Could not move application.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resource"] }),
    onError: (error) => toast.error(error.message),
  });
  const applications = query.data ?? [];
  const activeCount = applications.filter((application) => !["rejected", "withdrawn", "offer"].includes(String(application.status))).length;
  const interviewCount = applications.filter((application) => application.status === "interview").length;
  const offerCount = applications.filter((application) => application.status === "offer").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div><p className="font-mono text-[11px] uppercase text-muted-foreground">Workspace / Pipeline</p><h1 className="mt-2 font-serif text-3xl">Hiring stages</h1><p className="mt-2 text-sm text-muted-foreground">Move each role forward as conversations develop.</p></div>
        <Link className={buttonVariants()} href="/applications"><Plus className="size-4" /> Add application</Link>
      </div>
      {query.isError ? <p className="text-sm text-destructive">{query.error.message}</p> : null}
      {query.isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading pipeline…</p> : null}
      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total roles", applications.length],
          ["Active", activeCount],
          ["Interview phase", interviewCount],
          ["Offers", offerCount],
        ].map(([label, value]) => <div key={String(label)} className="bg-card px-4 py-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-serif text-2xl">{query.isLoading ? "—" : value}</p></div>)}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {stages.map((stage) => {
          const records = applications.filter((application) => application.status === stage);
          return <section key={stage} className="w-[260px] shrink-0">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-sm font-medium capitalize">{stage}</h2><span className="font-mono text-xs text-muted-foreground">{records.length.toString().padStart(2, "0")}</span>
            </div>
            <div className="space-y-2">
              {records.map((application) => <Card key={application.id} className="rounded-md shadow-none">
                <CardContent className="space-y-3 p-3">
                  <Link href={`/applications/${application.id}`} className="block hover:text-primary"><p className="text-sm font-medium">{String(application.role)}</p><p className="mt-1 text-xs text-muted-foreground">{String(application.companyName || "No company linked")}</p></Link>
                  <Select value={String(application.status)} onValueChange={(value) => {
                    if (typeof value === "string" && value !== application.status) moveMutation.mutate({ id: application.id, status: value });
                  }}>
                    <SelectTrigger className="h-8 w-full text-xs" aria-label={`Change phase for ${String(application.role)}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{stages.map((option) => <SelectItem key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </CardContent>
              </Card>)}
              {records.length === 0 ? <div className="rounded-md border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">No roles here</div> : null}
            </div>
          </section>;
        })}
      </div>
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? <div className="border-t border-border pt-5 text-sm text-muted-foreground">Your pipeline is empty. Add an application to start tracking stages.</div> : null}
    </div>
  );
}
