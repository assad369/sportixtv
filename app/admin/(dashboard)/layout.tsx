import { Suspense } from "react";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";

// Session check reads cookies (runtime data) — must live under Suspense so
// the route still has a prerenderable shell under cacheComponents.
async function Gate({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  if (!session) redirect("/admin/login");
  return <AdminShell email={session.email}>{children}</AdminShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center">
          <div className="size-10 animate-spin rounded-full border-4 border-edge border-t-brand" />
        </div>
      }
    >
      <Gate>{children}</Gate>
    </Suspense>
  );
}
