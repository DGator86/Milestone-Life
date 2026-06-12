"use client";

import { useState } from "react";
import { Zap, Briefcase, Home, Heart, ChevronRight } from "lucide-react";
import { completeOnboarding } from "@/app/onboarding/actions";
import confetti from "canvas-confetti";

const CATEGORIES = [
  { icon: Briefcase, label: "Work", desc: "Projects, deals, and career goals", color: "#1769FF" },
  { icon: Home, label: "Home", desc: "Renovations, errands, family", color: "#36A852" },
  { icon: Heart, label: "Health", desc: "Fitness, habits, and self-care", color: "#F8B400" },
];

export default function OnboardingWizard({ email }: { email: string }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");

  function handleGetStarted() {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
  }

  return (
    <div className="w-full max-w-sm">
      {step === 0 && (
        <div className="bg-white rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.4)] p-7 animate-fade-up">
          <h2 className="text-[18px] font-bold text-gray-900 mb-0.5">Welcome to Milestone 👋</h2>
          <p className="text-sm text-gray-400 mb-5">Let&apos;s get your workspace ready in 30 seconds.</p>

          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Your name <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={email.split("@")[0]}
              className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent text-sm transition-all"
            />
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full bg-milestone-blue text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-1.5"
          >
            Continue
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="animate-fade-up">
          <div className="bg-white rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.4)] p-7">
            <h2 className="text-[18px] font-bold text-gray-900 mb-0.5">Your workspace is set up</h2>
            <p className="text-sm text-gray-400 mb-5">Three goal categories are ready for you.</p>

            <div className="space-y-2.5 mb-5">
              {CATEGORIES.map(({ icon: Icon, label, desc, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-milestone-line bg-gray-50/50"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <form action={completeOnboarding}>
              <input type="hidden" name="name" value={name} />
              <button
                type="submit"
                onClick={handleGetStarted}
                className="w-full bg-milestone-blue text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
              >
                <Zap size={15} className="fill-white" />
                Let&apos;s go!
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
