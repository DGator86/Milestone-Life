import type { GoalType, GoalImportance } from "./types";

export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  goal_type: GoalType;
  importance: GoalImportance;
  milestones: string[];
  color: string;
}

export const TEMPLATES: GoalTemplate[] = [
  {
    id: "ship-feature",
    title: "Ship a Feature",
    description: "Take a feature from idea to production-ready",
    icon: "🚀",
    goal_type: "deadline",
    importance: "important",
    milestones: ["Research & spec", "Design", "Build", "Code review", "Ship"],
    color: "from-blue-50 to-indigo-50 border-blue-100",
  },
  {
    id: "close-deal",
    title: "Close a Deal",
    description: "Move a prospect from lead to signed contract",
    icon: "🤝",
    goal_type: "deadline",
    importance: "critical",
    milestones: ["Prospect & qualify", "Discovery call", "Demo", "Send proposal", "Negotiate & close"],
    color: "from-green-50 to-emerald-50 border-green-100",
  },
  {
    id: "learn-skill",
    title: "Learn a Skill",
    description: "Go from zero to proficient in a new area",
    icon: "📚",
    goal_type: "concrete",
    importance: "normal",
    milestones: ["Define learning path", "Core fundamentals", "Practice projects", "Apply in real work", "Teach or share"],
    color: "from-purple-50 to-violet-50 border-purple-100",
  },
  {
    id: "launch-product",
    title: "Launch a Product",
    description: "Take a product from concept to public launch",
    icon: "📦",
    goal_type: "deadline",
    importance: "critical",
    milestones: ["Market research", "Build MVP", "Beta launch", "Collect feedback", "Full launch"],
    color: "from-orange-50 to-amber-50 border-orange-100",
  },
  {
    id: "get-fit",
    title: "Get Fit",
    description: "Build a consistent fitness habit and hit a goal",
    icon: "💪",
    goal_type: "maintenance",
    importance: "important",
    milestones: ["Establish baseline", "Week 1–4 routine", "First milestone (5K / first rep)", "Build the habit", "Level up"],
    color: "from-red-50 to-rose-50 border-red-100",
  },
  {
    id: "write-publish",
    title: "Write & Publish",
    description: "Take a piece of writing from idea to published",
    icon: "✍️",
    goal_type: "concrete",
    importance: "normal",
    milestones: ["Outline & research", "First draft", "Edit & revise", "Final proofread", "Publish"],
    color: "from-yellow-50 to-lime-50 border-yellow-100",
  },
];
