import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import UpgradeClient from "./upgrade-client";

export default async function UpgradePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <UpgradeClient currentPlan={session.plan} email={session.email} />;
}
