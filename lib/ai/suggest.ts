// Lightweight, single-shot milestone suggester used by the "Suggest milestones"
// button in the Create Goal form. Uses the platform Anthropic key when present,
// and always falls back to sensible keyword-based templates so the button never
// dead-ends.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_SUGGEST_MODEL ?? "claude-haiku-4-5-20251001";

const TYPE_HINTS: Record<string, string> = {
  concrete: "a project with a clear finish line",
  deadline: "something that must be done by a specific date",
  maintenance: "an ongoing, continuous effort",
  touches: "a recurring habit or cadence",
};

const KEYWORD_RULES: Array<{ keywords: string[]; milestones: string[] }> = [
  { keywords: ["launch", "ship", "release", "deploy", "publish", "product", "feature"], milestones: ["Research & spec", "Design", "Build", "Test & QA", "Ship"] },
  { keywords: ["deal", "sales", "client", "contract", "close", "prospect", "pitch"], milestones: ["Prospect & qualify", "Discovery call", "Demo", "Send proposal", "Negotiate & close"] },
  { keywords: ["learn", "study", "course", "skill", "master", "read"], milestones: ["Set learning path", "Core fundamentals", "Practice project", "Apply in real work", "Teach or share"] },
  { keywords: ["hire", "recruit", "interview", "team", "candidate", "onboard"], milestones: ["Define role", "Source candidates", "Screen & interview", "Select & offer", "Onboard"] },
  { keywords: ["write", "blog", "article", "book", "newsletter", "content"], milestones: ["Outline & research", "First draft", "Edit & revise", "Final proofread", "Publish"] },
  { keywords: ["fitness", "gym", "run", "exercise", "workout", "health", "marathon"], milestones: ["Establish baseline", "Build the routine", "First milestone event", "Lock in the habit", "Level up"] },
  { keywords: ["fundraise", "raise", "investor", "funding", "seed"], milestones: ["Refine pitch deck", "Build investor list", "First meetings", "Follow-ups & diligence", "Close round"] },
];

export function fallbackMilestones(title: string): string[] {
  const lower = title.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.milestones;
  }
  return ["Research & plan", "First step", "Build momentum", "Reach halfway", "Complete"];
}

export async function suggestMilestones(title: string, goalType?: string): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackMilestones(title);

  const hint = TYPE_HINTS[goalType ?? ""] ?? "a goal";

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: "You are a goal-planning assistant. Reply with ONLY a JSON array of 4-6 concrete, ordered milestone titles (3-7 words each). No markdown, no prose.",
        messages: [{ role: "user", content: `Goal: "${title}" (${hint}). Return the JSON array of milestone titles.` }],
      }),
    });
    if (!res.ok) return fallbackMilestones(title);
    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? "";
    const match = text.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(match ? match[0] : text);
    if (Array.isArray(arr) && arr.length) {
      return arr.map((m) => String(m)).filter(Boolean).slice(0, 6);
    }
    return fallbackMilestones(title);
  } catch {
    return fallbackMilestones(title);
  }
}
