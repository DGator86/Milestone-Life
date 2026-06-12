import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { runAgent, agentConfigured } from "@/lib/ai/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ClientMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!agentConfigured()) {
    return NextResponse.json(
      { error: "The AI assistant isn't configured yet. Add a GEMINI_API_KEY environment variable to enable it." },
      { status: 503 }
    );
  }

  let body: { messages?: ClientMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const history = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20);

  if (!history.length || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Expected a trailing user message" }, { status: 400 });
  }

  try {
    const result = await runAgent({ userId: await getDataOwnerId() }, history);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Assistant error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
