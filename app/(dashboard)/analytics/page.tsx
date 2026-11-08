"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useResource, type ResourceRow } from "@/components/data/resource-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const emptyRecords: ResourceRow[] = [];

export default function AnalyticsPage() {
  const applicationQuery = useResource<ResourceRow>("applications");
  const eventQuery = useResource<ResourceRow>("events");
  const applications = applicationQuery.data ?? emptyRecords;
  const events = eventQuery.data ?? emptyRecords;
  const stages = ["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"];
  const stageCounts = stages.map((stage) => ({
    stage: stage[0].toUpperCase() + stage.slice(1),
    count: applications.filter((application) => application.status === stage).length,
  }));
  const monthlyActivity = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const count = applications.filter((application) => {
        if (typeof application.appliedAt !== "string") return false;
        const appliedAt = new Date(application.appliedAt);
        return appliedAt.getMonth() === month.getMonth() && appliedAt.getFullYear() === month.getFullYear();
      }).length;
      return { month: new Intl.DateTimeFormat(undefined, { month: "short" }).format(month), applications: count };
    });
  }, [applications]);
  const responseCount = applications.filter((application) => ["screening", "interview", "offer", "rejected"].includes(String(application.status))).length;
  const responseRate = applications.length ? Math.round((responseCount / applications.length) * 100) : 0;
  const interviews = events.filter((event) => event.type === "interview").length;

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5"><p className="font-mono text-[11px] uppercase text-muted-foreground">Workspace / Analytics</p><h1 className="mt-2 font-serif text-3xl">Search signals</h1><p className="mt-2 text-sm text-muted-foreground">A live read on application activity and stage movement.</p></div>
      {applicationQuery.isError || eventQuery.isError ? <p className="text-sm text-destructive">{applicationQuery.error?.message ?? eventQuery.error?.message}</p> : null}
      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Applications", applications.length],
          ["Interviews", interviews],
          ["Responses", responseCount],
          ["Response rate", `${responseRate}%`],
        ].map(([label, value]) => <div key={String(label)} className="bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 font-serif text-4xl">{applicationQuery.isLoading ? "—" : value}</p></div>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-lg shadow-none">
          <CardHeader className="border-b border-border"><CardTitle className="font-serif text-xl">Applications by month</CardTitle></CardHeader>
          <CardContent className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyActivity} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="applications" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-lg shadow-none">
          <CardHeader className="border-b border-border"><CardTitle className="font-serif text-xl">Current stage mix</CardTitle></CardHeader>
          <CardContent className="space-y-4 p-5">
            {stageCounts.map(({ stage, count }) => <div key={stage} className="grid grid-cols-[90px_1fr_32px] items-center gap-3 text-sm">
              <span className="text-muted-foreground">{stage}</span>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${applications.length ? (count / applications.length) * 100 : 0}%` }} /></div>
              <span className="text-right font-mono text-xs">{count}</span>
            </div>)}
            {applications.length === 0 ? <p className="pt-2 text-xs text-muted-foreground">Stage distribution appears as you add applications.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
