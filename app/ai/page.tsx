import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import AgentChat from "@/components/ai/AgentChat";
import { agentConfigured } from "@/lib/ai/agent";
import { Bot } from "lucide-react";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AIPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user: AppUser = { id: session.user.id, email: session.user.email };
  const configured = agentConfigured();

  return (
    <AppShell user={user}>
      <div className="ms-page max-w-3xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-milestone-blue flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="ms-page-title">AI Assistant</h1>
            <p className="ms-page-subtitle">
              Plan goals, break them into milestones, work your kill list, and manage your CRM — by chat.
            </p>
          </div>
        </div>

        {!configured && (
          <div className="bg-milestone-amber-dim border border-milestone-amber/20 rounded-xl px-5 py-4 mb-4 space-y-1">
            <p className="text-sm font-semibold text-milestone-amber">Assistant not connected</p>
            <p className="text-xs text-milestone-amber/80">
              Set <code className="bg-white/60 dark:bg-white/10 px-1 rounded">GEMINI_API_KEY</code> in your Vercel environment variables to enable the AI assistant.
              Get a free key at <code className="bg-white/60 dark:bg-white/10 px-1 rounded">aistudio.google.com</code>.
            </p>
          </div>
        )}

        <div className="ms-card">
          <AgentChat variant="page" />
        </div>
      </div>
    </AppShell>
  );
}
