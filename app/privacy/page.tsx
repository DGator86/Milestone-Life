import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Milestone",
  description: "How Milestone collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated="May 28, 2026"
      intro="This policy describes how Milestone (“we”, “us”) handles information when you use our web and mobile applications."
    >
      <Section title="Information we collect">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Account data:</strong> email address and a securely hashed
            password used to authenticate your account.
          </li>
          <li>
            <strong>Content you create:</strong> goals, milestones, groups, and
            activity related to your account.
          </li>
          <li>
            <strong>Technical data:</strong> standard server logs (IP address,
            browser type, timestamps) from our hosting provider.
          </li>
        </ul>
      </Section>
      <Section title="How we use information">
        <p>We use your information to provide the service, secure your account, improve the product, and respond to support requests. We do not sell your personal information.</p>
      </Section>
      <Section title="Storage and security">
        <p>
          Data is stored in a hosted PostgreSQL database (Neon), and every query
          is scoped to your account so each user can only access their own
          records. Passwords are hashed (bcrypt) and never stored in plain text.
          Use a strong, unique password.
        </p>
      </Section>
      <Section title="Third parties">
        <p>
          We use Neon (database), Vercel (application hosting), and Anthropic
          (the optional AI assistant). These processors act on our instructions
          and under their own privacy terms.
        </p>
      </Section>
      <Section title="Your rights">
        <p>
          You may request access, correction, or deletion of your account data by
          contacting support. You can delete your account from Settings when that
          feature is available, or by emailing us.
        </p>
      </Section>
      <Section title="Children">
        <p>Milestone is not directed at children under 13. We do not knowingly collect data from children.</p>
      </Section>
      <Section title="Changes">
        <p>We may update this policy. The “Last updated” date at the top will change when we do.</p>
      </Section>
      <Section title="Contact">
        <p>
          Questions:{" "}
          <a href="mailto:support@milestone.app" className="text-milestone-blue hover:underline">
            support@milestone.app
          </a>{" "}
          (replace with your production support address before launch).
        </p>
      </Section>
    </LegalDocument>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function LegalDocument({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
}) {
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
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400 mt-1">Last updated: {updated}</p>
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">{intro}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-10 text-xs text-gray-400">
          <Link href="/terms" className="text-milestone-blue hover:underline">
            Terms of Service
          </Link>
        </p>
      </main>
    </div>
  );
}
