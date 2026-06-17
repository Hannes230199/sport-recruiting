import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getApplications } from "@/lib/data/applications";
import KanbanBoard from "./KanbanBoard";

export default async function BewerbungenPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/login?next=/bewerbungen");

  const applications = await getApplications(supabase, user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meine Bewerbungen</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ziehe Karten in die nächste Spalte, wenn sich dein Status ändert.
          </p>
        </div>
        <Link
          href="/jobs"
          className="rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          + Bewerbung tracken
        </Link>
      </div>

      <KanbanBoard initialApplications={applications} />
    </div>
  );
}
