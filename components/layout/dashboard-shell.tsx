"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BriefcaseBusiness, LogOut, Menu, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState("");
  const settingsQuery = useQuery({
    queryKey: ["resource", "settings"],
    queryFn: async () => {
      const response = await fetch("/api/data/settings", { cache: "no-store" });
      if (!response.ok) return null;
      return response.json() as Promise<{ displayName?: string }>;
    },
  });
  const ownerName = settingsQuery.data?.displayName?.trim() || "Owner";
  const initials = ownerName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "O";

  async function signOut() {
    setIsSigningOut(true);
    try {
      const response = await fetch("/api/session", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not sign out.");
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-5 lg:px-6 xl:px-8">
        <aside className="hidden w-64 shrink-0 rounded-lg border border-sidebar-border bg-sidebar p-4 lg:block">
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <BriefcaseBusiness className="size-4" />
            </div>
            <div>
              <p className="font-serif text-lg text-sidebar-foreground">Careerlog</p>
              <p className="text-xs text-muted-foreground">Job search system</p>
            </div>
          </div>

          <div className="mb-6 rounded-md border border-sidebar-border bg-sidebar-accent p-3">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase text-muted-foreground">
              <span>Workspace</span>
              <Sparkles className="size-3.5 text-primary" />
            </div>
            <p className="mt-2 text-sm font-medium text-sidebar-foreground">Primary search</p>
          </div>

          <SidebarNav />
        </aside>

        <div className="flex-1">
          <header className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Toggle navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}>
                <Menu className="h-4 w-4" />
              </Button>
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-64 pl-9 text-sm"
                  placeholder="Search applications"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && search.trim()) router.push(`/applications?q=${encodeURIComponent(search.trim())}`);
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Sign out" title="Sign out" disabled={isSigningOut} onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
              <Link href="/settings" className="flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1.5 text-sm font-medium">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">{initials}</span>
                <span className="hidden md:inline">{ownerName}</span>
              </Link>
            </div>
          </header>

          {mobileNavOpen ? <div className="mb-5 rounded-lg border border-sidebar-border bg-sidebar p-3 lg:hidden"><SidebarNav onNavigate={() => setMobileNavOpen(false)} /></div> : null}

          <main className="min-h-[80vh] rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase text-muted-foreground">
              <span className="inline-block size-2 rounded-full bg-primary" />
              {pathname === "/dashboard" ? "Dashboard" : pathname.replace("/", "").replace("/", " / ")}
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
