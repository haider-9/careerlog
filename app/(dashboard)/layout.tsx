import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { hasOwnerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasOwnerSession())) {
    redirect("/login");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
