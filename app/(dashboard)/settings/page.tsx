"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SettingsRecord = { displayName: string; email: string; weeklyGoal: number };

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["resource", "settings"],
    queryFn: async () => {
      const response = await fetch("/api/data/settings", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load preferences.");
      return response.json() as Promise<SettingsRecord>;
    },
  });
  const [draft, setDraft] = useState<Partial<SettingsRecord>>({});
  const values: SettingsRecord = {
    displayName: draft.displayName ?? query.data?.displayName ?? "",
    email: draft.email ?? query.data?.email ?? "",
    weeklyGoal: draft.weeklyGoal ?? query.data?.weeklyGoal ?? 10,
  };
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/data/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("Could not save preferences.");
      return response.json();
    },
    onSuccess: async () => {
      setDraft({});
      await queryClient.invalidateQueries({ queryKey: ["resource", "settings"] });
      toast.success("Preferences saved.");
    },
    onError: (error) => toast.error(error.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutation.mutateAsync();
  }

  return (
    <div className="space-y-5">
      <div className="border-b border-border pb-5"><p className="font-mono text-[11px] uppercase text-muted-foreground">Workspace / Settings</p><h1 className="mt-2 font-serif text-3xl">Preferences</h1><p className="mt-2 text-sm text-muted-foreground">Set the profile details and weekly pace shown in your workspace.</p></div>
      <Card className="max-w-2xl rounded-lg shadow-none">
        <CardHeader className="border-b border-border"><CardTitle className="font-serif text-xl">Owner profile</CardTitle></CardHeader>
        <CardContent className="p-5">
          {query.isError ? <p className="mb-4 text-sm text-destructive">{query.error.message}</p> : null}
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="displayName">Display name</Label><Input id="displayName" autoComplete="name" value={values.displayName} onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="email">Contact email</Label><Input id="email" type="email" autoComplete="email" value={values.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="weeklyGoal">Weekly application goal</Label><Input id="weeklyGoal" type="number" min={1} max={200} value={values.weeklyGoal} onChange={(event) => setDraft((current) => ({ ...current, weeklyGoal: Number(event.target.value) }))} /></div>
            <Button type="submit" disabled={mutation.isPending || query.isLoading}>{mutation.isPending ? "Saving…" : "Save preferences"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
