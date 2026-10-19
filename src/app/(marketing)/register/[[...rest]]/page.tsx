import { redirect } from "next/navigation";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (typeof sp.plan === "string" && sp.plan) qs.set("plan", sp.plan);
  if (typeof sp.period === "string" && sp.period) qs.set("period", sp.period);
  const suffix = qs.toString();
  // Pricing buttons land here with ?plan=&period= — carry the selection into
  // Clerk's sign-up so the visitor's plan choice isn't lost.
  redirect(suffix ? `/sign-up?${suffix}` : "/sign-up");
}
