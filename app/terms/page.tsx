import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Milestone",
  description: "Terms governing use of the Milestone application.",
};

export default function TermsPage() {
  return (
    <div className="ms-marketing min-h-screen bg-milestone-bg">
      <header className="border-b border-milestone-line bg-white ms-marketing-card">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900 font-bold">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-milestone-blue flex items-center justify-center">
              <Zap size={14} className="text-white fill-white" />
            </span>
            Milestone
          </Link>
          <Link href="/login" className="text-sm text-milestone-blue font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
        <p className="text-xs text-gray-400 mt-1">Last updated: May 28, 2026</p>
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">
          By using Milestone, you agree to these terms. If you do not agree, do not use the service.
        </p>

        <section className="mt-8 mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-2">The service</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Milestone is a goal-tracking application provided as-is. Features may change or be
            removed. We may suspend access for abuse, illegal use, or security reasons.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-2">Your account</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            You are responsible for your account credentials and for content you create. You must
            provide accurate information and comply with applicable laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-2">Acceptable use</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Do not attempt to breach security, scrape other users&apos; data, overload our systems,
            or use the service to distribute malware or spam.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-2">Disclaimer</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE ARE NOT
            LIABLE FOR INDIRECT OR CONSEQUENTIAL DAMAGES TO THE EXTENT PERMITTED BY LAW.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-2">Contact</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            <a href="mailto:support@milestone.app" className="text-milestone-blue hover:underline">
              support@milestone.app
            </a>
          </p>
        </section>

        <p className="text-xs text-gray-400">
          <Link href="/privacy" className="text-milestone-blue hover:underline">
            Privacy Policy
          </Link>
        </p>
      </main>
    </div>
  );
}
