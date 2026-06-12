import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import ImportWizard from "@/components/import/ImportWizard";
import { Upload } from "lucide-react";
import type { AppUser } from "@/lib/types";
import { getDataOwnerId } from "@/lib/workspace";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user: AppUser = { id: session.user.id, email: session.user.email };
  const ownerId = await getDataOwnerId();
  const { customFields } = await getSettings(ownerId);

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl">
        <div className="mb-6 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-milestone-blue flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
            <Upload size={19} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Import CSV</h1>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
              Import companies, contacts, and opportunities from any CRM export. Extra columns become custom data
              blocks on each record.
            </p>
          </div>
        </div>
        <ImportWizard customFields={customFields} />
      </div>
    </AppShell>
  );
}
