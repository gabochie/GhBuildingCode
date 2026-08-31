import { getDb, now } from "@/lib/db";

export type FeatureKey =
  | "projects"
  | "aiQuestionsPerMonth"
  | "complianceChecksPerMonth"
  | "documents"
  | "reportsPerMonth"
  | "apiKeys";

export interface PlanLimits {
  projects: number;
  aiQuestionsPerMonth: number;
  complianceChecksPerMonth: number;
  documents: number;
  reportsPerMonth: number;
  apiKeys: number;
}

export interface Plan {
  id: string;
  label: string;
  name: string;
  tagline: string;
  monthly: string;
  limits: PlanLimits;
  features: string[];
  leadGen?: boolean;
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: "free",
    label: "FREE",
    name: "Free",
    tagline: "Try GHBC",
    monthly: "US$0",
    limits: {
      projects: 1,
      aiQuestionsPerMonth: 5,
      complianceChecksPerMonth: 3,
      documents: 0,
      reportsPerMonth: 0,
      apiKeys: 0
    },
    features: [
      "Ghana Building Code explorer",
      "1 project",
      "5 AI questions / month",
      "3 compliance checks / month",
      "Basic permit checklist",
      "Source citations on every answer"
    ],
    leadGen: true
  },
  professional: {
    id: "professional",
    label: "PROFESSIONAL",
    name: "Professional",
    tagline: "For architects and consultants",
    monthly: "US$29",
    limits: {
      projects: 10,
      aiQuestionsPerMonth: 100,
      complianceChecksPerMonth: 50,
      documents: 50,
      reportsPerMonth: 25,
      apiKeys: 0
    },
    features: [
      "Everything in Free",
      "Multiple projects (10)",
      "AI copilot with project context",
      "Compliance reviews",
      "Document uploads",
      "PDF compliance reports",
      "Project history"
    ]
  },
  studio: {
    id: "studio",
    label: "STUDIO",
    name: "Studio",
    tagline: "For practices",
    monthly: "US$99",
    limits: {
      projects: 50,
      aiQuestionsPerMonth: 500,
      complianceChecksPerMonth: 250,
      documents: 200,
      reportsPerMonth: 100,
      apiKeys: 3
    },
    features: [
      "Everything in Professional",
      "Team projects (roadmap)",
      "Project templates",
      "Advanced compliance",
      "Authority intelligence",
      "API access (3 keys)"
    ]
  },
  enterprise: {
    id: "enterprise",
    label: "ENTERPRISE",
    name: "Enterprise",
    tagline: "For developers, banks, insurers and government",
    monthly: "Custom",
    limits: {
      projects: Infinity,
      aiQuestionsPerMonth: Infinity,
      complianceChecksPerMonth: Infinity,
      documents: Infinity,
      reportsPerMonth: Infinity,
      apiKeys: 10
    },
    features: [
      "Everything in Studio",
      "Unlimited projects & usage",
      "SSO",
      "Audit logs",
      "Dedicated deployment",
      "Custom knowledge base",
      "Enterprise support"
    ]
  }
};

export const PLAN_ORDER = ["free", "professional", "studio", "enterprise"];

export function getPlan(planId?: string | null): Plan {
  return PLANS[(planId ?? "free").toLowerCase()] ?? PLANS.free;
}

export function monthlyPeriod(d: Date = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface UsageCounts {
  projects: number;
  documents: number;
  apiKeys: number;
  aiQuestions: number;
  complianceChecks: number;
  reports: number;
}

export async function getUsage(userId: string): Promise<UsageCounts> {
  const db = await getDb();
  const period = monthlyPeriod();
  const monthly = async (feature: string): Promise<number> =>
    ((await db.prepare("SELECT COALESCE(SUM(count), 0) c FROM feature_usage WHERE user_id = ? AND feature = ? AND period = ?").get(userId, feature, period)) as { c: number }).c;
  return {
    projects: ((await db.prepare("SELECT COUNT(*) c FROM projects WHERE user_id = ?").get(userId)) as { c: number }).c,
    documents: ((await db.prepare("SELECT COUNT(*) c FROM documents WHERE user_id = ?").get(userId)) as { c: number }).c,
    apiKeys: ((await db.prepare("SELECT COUNT(*) c FROM api_keys WHERE user_id = ?").get(userId)) as { c: number }).c,
    aiQuestions: await monthly("ai_questions"),
    complianceChecks: await monthly("compliance_checks"),
    reports: await monthly("reports")
  };
}

const USAGE_FIELD: Record<FeatureKey, keyof UsageCounts> = {
  projects: "projects",
  aiQuestionsPerMonth: "aiQuestions",
  complianceChecksPerMonth: "complianceChecks",
  documents: "documents",
  reportsPerMonth: "reports",
  apiKeys: "apiKeys"
};

export interface LimitCheck {
  allowed: boolean;
  feature: FeatureKey;
  used: number;
  limit: number;
  plan: Plan;
}

export async function checkLimit(userId: string, planId: string, feature: FeatureKey): Promise<LimitCheck> {
  const plan = getPlan(planId);
  const usage = await getUsage(userId);
  const used = usage[USAGE_FIELD[feature]];
  const limit = plan.limits[feature];
  return { allowed: used < limit, feature, used, limit, plan };
}

export async function incrementUsage(userId: string, feature: string, period: string = monthlyPeriod()): Promise<void> {
  const db = await getDb();
  await db.prepare(
    `INSERT INTO feature_usage (user_id, feature, period, count, updated_at) VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(user_id, feature, period) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at`
  ).run(userId, feature, period, now());
}

export interface QuotaResult {
  allowed: boolean;
  feature: FeatureKey;
  used: number;
  limit: number;
  plan: Plan;
}

/**
 * Atomically check-and-consume a monthly quota. Unlike a separate
 * `checkLimit` + `incrementUsage` pair, this is a single conditional
 * `UPDATE ... WHERE count < limit` that cannot overshoot the limit under
 * concurrent requests (avoids the double-charge race).
 *
 * Returns `allowed: false` and the current usage when the limit is met.
 */
export async function consumeQuota(userId: string, planId: string, feature: FeatureKey): Promise<QuotaResult> {
  const plan = getPlan(planId);
  const limit = plan.limits[feature];
  const db = await getDb();
  const period = monthlyPeriod();

  if (limit === Infinity) {
    await incrementUsage(userId, feature, period);
    return { allowed: true, feature, used: Infinity, limit, plan };
  }

  const result = await db.prepare(
    `INSERT INTO feature_usage (user_id, feature, period, count, updated_at) VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(user_id, feature, period) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
     WHERE count < ?`
  ).run(userId, feature, period, now(), limit);

  if (result.changes === 0) {
    const used = ((await db.prepare(
      "SELECT COALESCE(SUM(count), 0) c FROM feature_usage WHERE user_id = ? AND feature = ? AND period = ?"
    ).get(userId, feature, period)) as { c: number }).c;
    return { allowed: false, feature, used, limit, plan };
  }

  return { allowed: true, feature, used: limit, limit, plan };
}
