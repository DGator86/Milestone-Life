import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import TemplateGrid from "@/components/templates/TemplateGrid";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user: AppUser = { id: session.user.id, email: session.user.email };

  return (
    <AppShell user={user}>
      <TemplateGrid />
    </AppShell>
  );
}
