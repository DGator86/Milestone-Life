import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { suggestMilestones } from "@/lib/ai/suggest";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, goal_type } = await req.json().catch(() => ({}));
  if (!title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

  const milestones = await suggestMilestones(title.trim(), goal_type);
  return NextResponse.json({ milestones });
}
