import { asc, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { db } from "@/db";
import { hall } from "@/db/schema";
import { ManageHallsClient } from "@/features/admin/components/manage-halls-client";
import { requireRole } from "@/lib/rbac";

export default async function AdminManageHallsPage() {
  try {
    await requireRole("admin");
  } catch {
    redirect("/");
  }

  const halls = await db
    .select({
      id: hall.id,
      name: hall.name,
      slug: hall.slug,
      city: hall.city,
      state: hall.state,
      maxCapacity: hall.maxCapacity,
      coverPhotoUrl: hall.coverPhotoUrl,
      status: hall.status,
    })
    .from(hall)
    .orderBy(desc(hall.updatedAt), asc(hall.id))
    .limit(20);

  return (
    <section className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30">
        <SiteHeader mode="admin" className="rounded-none border-x-0 border-t-0 shadow-none" />
      </header>

      <main className="mx-auto w-full max-w-[1360px] space-y-5 px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <section className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Manage Halls
          </h1>
          <p className="max-w-3xl text-sm text-zinc-600 sm:text-base">
            Browse, update, and monitor hall inventory in a grid view.
          </p>
        </section>

        <ManageHallsClient initialItems={halls} />
      </main>
    </section>
  );
}
