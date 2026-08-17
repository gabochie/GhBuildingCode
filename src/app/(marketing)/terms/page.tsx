import { LegalPage } from "@/components/legal-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms and conditions for using the GHBC compliance intelligence platform for Ghana Building Code (GS 1207:2018) compliance."
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="15 August 2026">
      <h2>1. Acceptance of terms</h2>
      <p>
        By creating an account or using GHBC, you agree to these Terms of Use. If you do not
        agree, do not use the service.
      </p>

      <h2>2. The service</h2>
      <p>
        GHBC provides compliance intelligence for the Ghana Building Code (GS&nbsp;1207:2018):
        searchable code exploration, project compliance profiles, checklists, reports and an
        AI copilot. Output is preliminary and explanatory, as described in our Disclaimer.
      </p>

      <h2>3. Accounts and security</h2>
      <p>
        You are responsible for safeguarding your credentials and for activity on your account.
        Do not share API keys; they grant access to your workspace. Notify us immediately of any
        suspected unauthorized use.
      </p>

      <h2>4. Acceptable use</h2>
      <p>
        You may not: upload unlawful or infringing content; attempt to access other users&apos;
        data or interfere with the service; resell or redistribute GS&nbsp;1207:2018 content in
        full; or use the platform to impersonate an authority or produce documents presented as
        official approvals.
      </p>

      <h2>5. Professional responsibility</h2>
      <p>
        You remain solely responsible for the professional correctness of your designs,
        submissions and compliance decisions. GHBC output does not replace professional judgment
        or required approvals by the applicable authority.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        The GHBC software, branding and design are owned by GHBC. The Ghana Building Code and
        related regulations remain the property of their respective right holders and are used
        under license, authorization or applicable exceptions.
      </p>

      <h2>7. Termination</h2>
      <p>
        We may suspend or terminate access for violation of these terms. You may delete your
        account at any time. Sections that by their nature survive termination will survive.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, GHBC and its operators are not liable for
        indirect, incidental or consequential damages arising from use of the service.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these terms from time to time. Continued use after changes constitutes
        acceptance. Material changes will be noted by an updated &ldquo;last updated&rdquo; date.
      </p>
    </LegalPage>
  );
}
