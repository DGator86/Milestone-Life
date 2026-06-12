import { redirect } from "next/navigation";

// Life-category onboarding (Work/Home/Health) is paused while Milestone ships as a
// business CRM first. Send any legacy links straight to the dashboard.
export default function OnboardingPage() {
  redirect("/dashboard");
}
