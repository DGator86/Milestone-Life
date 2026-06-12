"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
  goal_type: string;
  milestones: string[];
  emoji: string;
}

const TEMPLATES: Template[] = [
  {
    id: "close-deal",
    title: "Close a Deal",
    description: "Move a prospect through the full sales cycle to a signed contract.",
    goal_type: "deadline",
    milestones: ["Initial outreach", "Discovery call", "Send proposal", "Negotiate terms", "Close & onboard"],
    emoji: "🤝",
  },
  {
    id: "onboard-client",
    title: "Onboard Client",
    description: "Get a new client fully set up and delivering value from day one.",
    goal_type: "concrete",
    milestones: ["Kickoff call", "Account setup", "Training session", "Go-live", "30-day check-in"],
    emoji: "🚀",
  },
  {
    id: "hit-quota",
    title: "Hit Quota",
    description: "Track progress toward your sales target with clear checkpoints.",
    goal_type: "deadline",
    milestones: ["25% of target", "50% of target", "75% of target", "Goal achieved"],
    emoji: "📈",
  },
  {
    id: "launch-product",
    title: "Launch Product",
    description: "Take an idea from concept to live launch with structured milestones.",
    goal_type: "concrete",
    milestones: ["Finalize specs", "Build MVP", "Beta test", "Fix feedback", "Launch"],
    emoji: "🎯",
  },
  {
    id: "weekly-checkins",
    title: "Weekly Check-ins",
    description: "Stay consistent with regular customer touch points every week.",
    goal_type: "touches",
    milestones: ["Week 1 check-in", "Week 2 check-in", "Week 3 check-in", "Week 4 check-in"],
    emoji: "🔄",
  },
];

export default function TemplateGrid() {
  const router = useRouter();

  function handleSelect(template: Template) {
    sessionStorage.setItem(
      "goal_prefill",
      JSON.stringify({
        title: template.title,
        goal_type: template.goal_type,
        milestones: template.milestones,
      })
    );
    router.push("/dashboard");
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Templates</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Pick a template to jump-start your goal — edit everything before creating.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => handleSelect(template)}
            className="bg-white border border-milestone-line rounded-xl p-4 text-left hover:border-milestone-blue hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">{template.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-milestone-blue transition-colors">
                    {template.title}
                  </p>
                  <ChevronRight size={14} className="text-gray-200 group-hover:text-milestone-blue transition-colors shrink-0" />
                </div>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{template.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.milestones.slice(0, 3).map((m) => (
                    <span
                      key={m}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium"
                    >
                      {m}
                    </span>
                  ))}
                  {template.milestones.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                      +{template.milestones.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
