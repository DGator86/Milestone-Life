import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isPro } from "@/lib/billing";
import Link from "next/link";
import { Zap } from "lucide-react";

interface ProGateProps {
  children: React.ReactNode;
  feature?: string;
}

export default async function ProGate({ children, feature = "This feature" }: ProGateProps) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  const pro = isPro(dbUser?.subscription_status);

  if (pro) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#EEF3FF] flex items-center justify-center mb-4">
        <Zap size={20} className="text-milestone-blue fill-milestone-blue" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1">{feature} requires Pro</h3>
      <p className="text-sm text-gray-400 mb-5 max-w-xs">
        Upgrade to unlock AI, CRM, team workspaces, and more — starting at $9/month.
      </p>
      <Link
        href="/pricing"
        className="bg-milestone-blue text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200"
      >
        View pricing
      </Link>
    </div>
  );
}
