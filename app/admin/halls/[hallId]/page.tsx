import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { ManageHallEditorClient } from "@/features/admin/components/manage-hall-editor-client";
import { getManageHallEditorPayload } from "@/features/admin/server/manage-hall";
import { requireRole } from "@/lib/rbac";

type AdminManageHallPageProps = {
  params: Promise<{
    hallId: string;
  }>;
};

export default async function AdminManageHallPage({ params }: AdminManageHallPageProps) {
  try {
    await requireRole("admin");
  } catch {
    redirect("/");
  }

  const { hallId } = await params;
  if (!hallId || hallId.trim().length === 0) {
    redirect("/admin/halls");
  }

  const payload = await getManageHallEditorPayload(hallId);
  if (!payload) {
    redirect("/admin/halls");
  }

  return (
    <section className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30">
        <SiteHeader mode="admin" className="rounded-none border-x-0 border-t-0 shadow-none" />
      </header>

      <main className="mx-auto w-full max-w-[1360px] space-y-5 px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <section className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Manage Hall
          </h1>
          <p className="max-w-3xl text-sm text-zinc-600 sm:text-base">
            Edit only database-backed hall fields and photo records.
          </p>
        </section>

        <ManageHallEditorClient
          mode="edit"
          initialData={{
            hall: payload.hall,
            host: payload.host,
            photos: payload.photos,
            amenities: payload.amenities,
            amenityCatalog: payload.amenityCatalog,
          }}
        />
      </main>
    </section>
  );
}
