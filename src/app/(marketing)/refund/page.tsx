import { LegalPage } from "@/components/legal-page";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Refund and cancellation policy for GHBC paid subscriptions (Professional, Studio and Enterprise) and annual plans."
};

export default function RefundPage() {
  return (
    <LegalPage title="Refund Policy" updated="21 October 2026">
      <p>
        This policy explains when you can get a refund for a paid GHBC subscription. It applies to
        all paid plans (Professional, Studio and Enterprise), whether billed monthly or annually,
        in Ghana Cedis (GHS) or US Dollars (USD).
      </p>

      <h2>1. Free plan</h2>
      <p>
        The Free plan costs nothing and is not subject to refunds. You can stop using it at any time.
      </p>

      <h2>2. First-time monthly subscriptions — 7-day money-back guarantee</h2>
      <p>
        If you subscribe to a paid plan for the first time and are not satisfied, request a refund
        within <strong>7 days</strong> of the initial payment and we will refund it in full. This
        applies to your <strong>first</strong> payment on a plan only.
      </p>

      <h2>3. Renewals</h2>
      <p>
        Renewal charges for a subscription you already hold are <strong>non-refundable</strong>,
        because access to the service was made available for the new billing period. You can cancel
        at any time before the next renewal to avoid the next charge (see section 4).
      </p>

      <h2>4. Cancellation</h2>
      <p>
        You may cancel your subscription at any time from your account or by contacting us. On
        cancellation:
      </p>
      <ul>
        <li>You keep access until the end of the period you already paid for.</li>
        <li>The subscription does not renew and no further charges are made.</li>
        <li>We do not issue a pro-rata refund for the unused part of a paid period, except where
          required by law or as stated in this policy.</li>
      </ul>

      <h2>5. Annual plans</h2>
      <p>
        Annual plans are billed once for 12 months at the price of 10 months (two months free). If
        you are a first-time subscriber and request a refund within 7 days of the initial annual
        payment, we will refund it in full. After that 7-day window, annual payments are
        non-refundable, but you may cancel to stop renewal at the end of the term.
      </p>

      <h2>6. Failed, duplicate or incorrect charges</h2>
      <p>
        If you were charged in error — for example a duplicate charge, a charge after cancelling, or
        an amount that does not match your plan — contact us and we will investigate and refund any
        amount you were not due to pay. Gateway settlement timings apply (see section 8).
      </p>

      <h2>7. Service unavailability</h2>
      <p>
        If a paid feature is materially unavailable for an extended period through our fault, we may,
        at our discretion, extend your subscription or refund the affected portion of the fees.
      </p>

      <h2>8. How refunds are processed</h2>
      <p>
        Approved refunds are returned to the original payment method through the same gateway used
        for the purchase (for example Mobile Money, card, or bank). Refunds are issued in the same
        currency as the original payment. Processing times vary by provider and typically take
        <strong> 5–14 business days</strong> after approval; Mobile Money refunds are usually faster
        than card refunds. Any gateway fees charged to us are not passed on to you.
      </p>

      <h2>9. Abuse</h2>
      <p>
        We may decline a refund where the request forms part of abuse — for example repeated
        subscribe-and-refund cycles, or use that breaches our{" "}
        <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Use</Link>{" "}
        (such as reselling or redistributing Ghana Building Code content).
      </p>

      <h2>10. Your statutory rights</h2>
      <p>
        This policy is in addition to, and does not limit, any rights you have under applicable
        Ghanaian consumer-protection law. Where the law gives you a stronger right to a refund, that
        right prevails.
      </p>

      <h2>11. How to request a refund</h2>
      <p>
        Email{" "}
        <a href="mailto:support@ghbc.gabochie.com" className="font-medium text-primary hover:underline">
          support@ghbc.gabochie.com
        </a>{" "}
        with the email address on your account, your plan, the payment date and (if available) the
        gateway transaction reference. Or call +233 24 326 2019. We aim to respond within 3 business
        days. Full details: Klagon Newsite, Tema, Ghana — see our{" "}
        <Link href="/contact" className="font-medium text-primary hover:underline">contact page</Link>.
      </p>
    </LegalPage>
  );
}
