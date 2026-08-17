import { LegalPage } from "@/components/legal-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "GHBC compliance intelligence is for informational purposes. Always verify requirements against the official Ghana Building Code (GS 1207:2018)."
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" updated="15 August 2026">
      <h2>Not a legal determination</h2>
      <p>
        GHBC (Ghana Building Compliance Intelligence) is a software product that provides
        preliminary, source-backed intelligence about the Ghana Building Code (GS&nbsp;1207:2018)
        and related regulatory material. Nothing on this platform constitutes a legal opinion,
        an official compliance determination, or an approval by any authority.
      </p>

      <h2>Not a substitute for professional advice</h2>
      <p>
        Output produced by GHBC — including compliance matrices, findings, readiness scores,
        checklists, reports and copilot answers — must be reviewed and confirmed by a qualified
        professional (registered architect, engineer, fire-safety consultant or other competent
        professional) and by the applicable approving authority. Always rely on the original
        published text of the code and regulations.
      </p>

      <h2>Requirement verification status</h2>
      <p>
        Many requirements in the source library carry a <strong>NOT VERIFIED</strong> status.
        GHBC never presents unverified material as an authoritative requirement, and it does not
        fabricate requirements, dimensions, section numbers or standards. Where extraction
        coverage is limited, GHBC flags the gap rather than guessing.
      </p>

      <h2>Regulatory source control</h2>
      <p>
        The Ghana Building Code is a controlled regulatory document. GHBC supports the use of
        licensed, authorized or public materials only and does not redistribute copyrighted
        material in full. Content is presented with provenance for compliance intelligence
        purposes under applicable copyright and fair-use principles.
      </p>

      <h2>No warranty</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; without warranties of any kind, express or
        implied. GHBC and its operators accept no liability for any loss, damage or claim arising
        from reliance on the platform, including but not limited to permit delays, design changes,
        professional fees or regulatory penalties.
      </p>
    </LegalPage>
  );
}
