import { LegalPage } from "@/components/legal-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How GHBC collects, uses, and protects your data. Read our privacy policy for the Ghana Building Compliance Intelligence platform."
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="15 August 2026">
      <h2>1. What we collect</h2>
      <p>
        When you create an account we collect your name, email address and a password hash
        (stored using a one-way cryptographic hash, never in plain text). We also store the
        project information you provide, uploaded documents, and usage events needed to operate
        the service.
      </p>

      <h2>2. How we use it</h2>
      <p>
        Your data is used to operate the service: run compliance checks, generate reports and
        checklists, answer copilot questions, secure your workspace, and improve the product.
        We do not sell your personal data.
      </p>

      <h2>3. AI processing</h2>
      <p>
        Copilot questions and your project context may be sent to an AI provider you configure
        (or an AI provider we use). When no AI provider is configured, answers are generated
        deterministically from the source library. Do not upload information you are not
        authorized to share.
      </p>

      <h2>4. Cookies and sessions</h2>
      <p>
        We use an httpOnly session cookie to keep you signed in. It is not used for advertising
        or cross-site tracking.
      </p>

      <h2>5. Storage and retention</h2>
      <p>
        Data is stored in secured infrastructure. We retain account and project data while your
        account is active, and delete it on account deletion, subject to legal obligations.
      </p>

      <h2>6. Sharing</h2>
      <p>
        We do not share your personal data except: with your consent, with service providers who
        process data on our behalf under confidentiality obligations, or when required by law.
      </p>

      <h2>7. Your rights</h2>
      <p>
        You may access, correct or delete your personal data, or export your project data, by
        contacting us. You may also delete your account at any time.
      </p>

      <h2>8. Security</h2>
      <p>
        We apply industry-standard controls including encryption in transit, hashed credentials,
        least-privilege access and audit logging. No system is completely secure; we strive to
        protect your data to the best of our ability.
      </p>
    </LegalPage>
  );
}
