"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RecordFormDialog, useResource, type ResourceField, type ResourceRow } from "@/components/data/resource-manager";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

const fields: ResourceField[] = [
  { key: "title", label: "Event", required: true },
  { key: "type", label: "Type", type: "select", options: ["interview", "follow-up", "task", "other"].map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value })) },
  { key: "startsAt", label: "Date and time", type: "datetime-local", required: true },
  { key: "applicationId", label: "Related application", type: "select", optionsFrom: "applications" },
  { key: "completed", label: "Completed", type: "checkbox" },
  { key: "notes", label: "Notes", type: "textarea" },
];

function dateKey(value: unknown) {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function displayTime(value: unknown) {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "Time not set" : new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const query = useResource<ResourceRow>("events");
  const events = query.data ?? [];
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceRow | null>(null);
  const selectedKey = localDateKey(selectedDay);
  const selectedEvents = events.filter((event) => dateKey(event.startsAt) === selectedKey).sort((a, b) => new Date(String(a.startsAt)).getTime() - new Date(String(b.startsAt)).getTime());
  const upcomingCount = events.filter((event) => !event.completed).length;
  const interviewCount = events.filter((event) => event.type === "interview" && !event.completed).length;
  const completedCount = events.filter((event) => event.completed).length;
  const eventDays = events.map((event) => new Date(String(event.startsAt))).filter((date) => !Number.isNaN(date.getTime()));

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/data/events/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete the event.");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resource", "events"] });
      toast.success("Event deleted.");
    },
    onError: (error) => toast.error(error.message),
  });

  function addEvent() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div><p className="font-mono text-[11px] uppercase text-muted-foreground">Workspace / Calendar</p><h1 className="mt-2 font-serif text-3xl">Plan the next move.</h1><p className="mt-2 text-sm text-muted-foreground">Interviews, follow-ups, and tasks in one view.</p></div>
        <Button onClick={addEvent}><Plus className="size-4" /> Add event</Button>
      </div>
      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        {[["Upcoming", upcomingCount], ["Interviews", interviewCount], ["Completed", completedCount]].map(([label, value]) => <div key={String(label)} className="bg-card px-4 py-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-serif text-2xl">{value}</p></div>)}
      </div>
      {query.isError ? <p className="text-sm text-destructive">{query.error.message}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_1.1fr]">
        <section className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-5">
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={selectedDay}
            onSelect={(day) => { if (day) setSelectedDay(day); }}
            modifiers={{ hasEvent: eventDays }}
            modifiersClassNames={{ hasEvent: "font-semibold text-primary underline decoration-primary decoration-2 underline-offset-4" }}
            className="mx-auto w-full"
          />
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-primary" /> Days with scheduled events</div>
        </section>
        <section className="min-w-0 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4">
            <div><p className="font-mono text-[10px] uppercase text-muted-foreground">Selected day</p><h2 className="mt-1 font-serif text-xl">{new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(selectedDay)}</h2></div>
            <Button variant="outline" size="sm" onClick={addEvent}><Plus className="size-4" /> Add</Button>
          </div>
          <div className="divide-y divide-border">
            {query.isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading events…</p> : null}
            {!query.isLoading && selectedEvents.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center"><CalendarDays className="mb-3 size-7 text-primary" /><p className="font-medium">No events on this day</p><p className="mt-1 text-sm text-muted-foreground">Choose another date or add a new checkpoint.</p></div> : null}
            {selectedEvents.map((event) => <article key={event.id} className="flex gap-3 p-4">
              <div className="flex w-14 shrink-0 flex-col items-center border-r border-border pr-3 text-center"><Clock3 className="mb-1 size-4 text-primary" /><span className="text-xs font-medium">{displayTime(event.startsAt)}</span></div>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{String(event.title)}</h3>{event.completed ? <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"><Check className="size-3" />Done</span> : null}</div><p className="mt-1 text-xs capitalize text-muted-foreground">{String(event.type)}{event.applicationRole ? ` · ${String(event.applicationRole)}` : ""}</p>{event.notes ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{String(event.notes)}</p> : null}</div>
              <div className="flex shrink-0 items-start gap-1"><Button variant="ghost" size="icon-sm" aria-label="Edit event" onClick={() => { setEditing(event); setDialogOpen(true); }}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon-sm" aria-label="Delete event" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm("Delete this event? This cannot be undone.")) deleteMutation.mutate(event.id); }}><Trash2 className="size-4 text-destructive" /></Button></div>
            </article>)}
          </div>
        </section>
      </div>
      {dialogOpen ? <RecordFormDialog
        key={editing?.id ?? `${selectedKey}-new`}
        resource="events"
        title="event"
        fields={fields}
        record={editing}
        initialValues={editing ? undefined : { type: "follow-up", startsAt: `${selectedKey}T09:00`, completed: false }}
        open
        onOpenChange={setDialogOpen}
      /> : null}
    </div>
  );
}
