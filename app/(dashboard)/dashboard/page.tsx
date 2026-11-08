"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useResource, type ResourceRow } from "@/components/data/resource-manager";

function displayDate(value: unknown) {
  if (!value) return "Date not set";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "Date not set" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export default function DashboardPage() {
  const applicationQuery = useResource<ResourceRow>("applications");
  const eventQuery = useResource<ResourceRow>("events");
  const applications = applicationQuery.data ?? [];
  const events = (eventQuery.data ?? []).filter((event) => !event.completed).slice(0, 4);
  const activeApplications = applications.filter((application) => !["rejected", "withdrawn", "offer"].includes(String(application.status))).length;
  const interviews = applications.filter((application) => application.status === "interview").length;
  const followUps = (eventQuery.data ?? []).filter((event) => event.type === "follow-up" && !event.completed).length;
  const stats = [
    { label: "Active applications", value: activeApplications, detail: `${applications.length} total tracked` },
    { label: "Interview stage", value: interviews, detail: "Applications in conversation" },
    { label: "Open follow-ups", value: followUps, detail: "Next actions on your calendar" },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Overview / {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date())}</p>
          <h1 className="mt-2 font-serif text-3xl">Your search, in focus.</h1>
        </div>
        <Link className={buttonVariants()} href="/applications"><Plus className="size-4" /> Add application</Link>
      </div>

      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-3 font-serif text-4xl">{applicationQuery.isLoading ? "—" : stat.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <div>
              <CardTitle className="font-serif text-xl">Recent applications</CardTitle>
              <CardDescription className="mt-1">The latest roles in your search.</CardDescription>
            </div>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/applications">All applications<ArrowRight className="size-3.5" /></Link>
          </CardHeader>
          <CardContent className="p-0">
            {applications.slice(0, 5).map((application) => <Link key={application.id} href={`/applications/${application.id}`} className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/30">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{String(application.role)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{String(application.companyName || "Company not set")}</p></div>
              <div className="shrink-0 text-right"><p className="text-xs capitalize text-primary">{String(application.status)}</p><p className="mt-1 text-xs text-muted-foreground">{displayDate(application.appliedAt)}</p></div>
            </Link>)}
            {!applicationQuery.isLoading && applications.length === 0 ? <div className="p-8 text-center"><p className="font-serif text-lg">No applications tracked yet</p><p className="mt-2 text-sm text-muted-foreground">Add a role to see your progress here.</p><Link className={`${buttonVariants({ variant: "outline" })} mt-4`} href="/applications">Add your first role</Link></div> : null}
            {applicationQuery.isError ? <p className="p-5 text-sm text-destructive">{applicationQuery.error.message}</p> : null}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <div><CardTitle className="font-serif text-xl">Next up</CardTitle><CardDescription className="mt-1">Upcoming interviews and follow-ups.</CardDescription></div>
            <Link className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="Open calendar" href="/calendar"><CalendarDays className="size-4" /></Link>
          </CardHeader>
          <CardContent className="p-0">
            {events.map((event) => <Link key={event.id} href="/calendar" className="flex items-center gap-3 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/30">
              <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-md bg-accent text-accent-foreground"><span className="font-mono text-[9px] uppercase">{new Intl.DateTimeFormat(undefined, { month: "short" }).format(new Date(String(event.startsAt)))}</span><span className="text-sm font-semibold">{new Date(String(event.startsAt)).getDate()}</span></div>
              <div className="min-w-0"><p className="truncate text-sm font-medium">{String(event.title)}</p><p className="mt-1 truncate text-xs capitalize text-muted-foreground">{String(event.type)} · {displayDate(event.startsAt)}</p></div>
            </Link>)}
            {!eventQuery.isLoading && events.length === 0 ? <div className="p-8 text-center"><Clock3 className="mx-auto mb-3 size-6 text-primary" /><p className="font-medium">Nothing scheduled</p><p className="mt-1 text-sm text-muted-foreground">Create a follow-up or interview reminder.</p><Link className={`${buttonVariants({ variant: "outline" })} mt-4`} href="/calendar">Open calendar</Link></div> : null}
            {eventQuery.isError ? <p className="p-5 text-sm text-destructive">{eventQuery.error.message}</p> : null}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-5">
        <Link className={buttonVariants({ variant: "outline" })} href="/calendar"><CalendarDays className="size-4" /> Schedule a follow-up</Link>
        <Link className={buttonVariants({ variant: "outline" })} href="/companies"><Plus className="size-4" /> Add company</Link>
      </div>
    </div>
  );
}
