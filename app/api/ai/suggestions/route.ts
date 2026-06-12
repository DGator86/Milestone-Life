import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { getAssistantSuggestions } from "@/lib/ai/promptSuggestions";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestions = await getAssistantSuggestions(await getDataOwnerId());
  return NextResponse.json(suggestions);
}
