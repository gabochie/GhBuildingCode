# GHBC API Specification (v1)

Base URL: `/api/v1` (same-origin in V1; `https://api.ghbc.gabochie.com` reserved).

## Response envelope

Every response:

```json
{
  "request_id": "uuid",
  "timestamp": "ISO8601",
  "status": "ok" | "error",
  "data": {},
  "warnings": [],
  "sources": []
}
```

## Endpoints

### Auth
Authentication is handled by **Clerk** (SSO + email/password). Sessions are
managed by Clerk's SDK; the legacy in-house `login`/`register`/`logout`
`/api/v1/auth/*` routes were retired on the Clerk switch.
- `GET /api/v1/auth/me` — current user (Clerk-authenticated via `auth()`/`getSession()`)

### Projects
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/{id}`
- `PATCH /api/v1/projects/{id}`
- `POST /api/v1/projects/{id}/review` — run compliance check → findings
- `GET /api/v1/projects/{id}/report` — PDF report (streamed)
- `GET /api/v1/projects/{id}/matrix` — compliance matrix

### Regulatory
- `GET /api/v1/regulations`
- `GET /api/v1/regulations/{id}`
- `GET /api/v1/parts`
- `GET /api/v1/parts/{partNo}`
- `GET /api/v1/sections?part=3`
- `GET /api/v1/requirements?occupancy=residential&part=10&type=mandatory&query=stair`
- `GET /api/v1/requirements/{id}`
- `GET /api/v1/definitions?term=stair`
- `GET /api/v1/occupancies`

### Search
- `GET /api/v1/search?q=minimum stair width&part=10&limit=10`

### AI
- `POST /api/v1/ai/ask` — {question, project_id?, conversation_id?}
- `POST /api/v1/chat` — streaming chat (SSE) with project context
- `GET /api/v1/chat/conversations`

### Compliance
- `POST /api/v1/compliance/check` — {project_input} → applicable requirements + findings

### Authorities
- `GET /api/v1/authorities`
- `GET /api/v1/authorities/{id}`
- `GET /api/v1/authorities/{id}/checklist`

### Checklists
- `GET /api/v1/checklists?project_id=`
- `POST /api/v1/checklists` — generate permit-readiness checklist

### Documents
- `POST /api/v1/documents` — multipart upload (project-scoped)
- `GET /api/v1/documents?project_id=`
- `GET /api/v1/documents/{id}`
- `POST /api/v1/documents/{id}/process` — extract text, review findings

### Rules
- `GET /api/v1/rules`

### Agent API (machine-readable)
- `POST /api/v1/agent/compliance-check`
  ```json
  {
    "project_type": "residential",
    "location": "Accra",
    "storeys": 3,
    "floor_area": 1200,
    "occupancy": "residential"
  }
  ```
  → `{status, applicable_requirements, issues, missing_information, sources, confidence}`

- `GET /api/v1/agent/capabilities` — capability list (S24)

## Billing & payments (Ghana)
Payments are collected in Ghana Cedis via local gateways and activate a paid
plan for one billing period (renewal done by the human super-admin, or by a
follow-up payment). Payment records and subscriptions live in D1.

- `GET /api/v1/billing/config` — available payment gateways + GHS prices
  (no secrets). Auth required.
  ```json
  { "gateways": [{"id":"moolre","label":"Moolre (MoMo)"}], "plans": [{"id":"professional","name":"Professional","price":{"currency":"GHS","amountMinor":"399","label":"GH₵399"}}] }
  ```
- `POST /api/v1/billing/checkout` — initiate a payment. Auth required.
  ```json
  { "plan": "professional", "gateway": "moolre", "phone": "0244000000", "billingPeriod": "monthly" }
  ```
  `billingPeriod` is `monthly` (default) or `annual`. **Monthly** charges the
  plan's monthly GHS price and activates the plan for 1 month. **Annual**
  charges the annual GHS price (10 months billed, 2 free, e.g. GH₵3,990 for
  Professional) and activates the plan for 12 months. The stored payment amount
  determines the period at webhook time, so no schema migration is required.
  → `{ payment_id, reference, gateway, redirectUrl, message }`. For Moolre,
  `redirectUrl` is `null` and `message` asks the user to approve the MoMo
  prompt on their phone; for ExpressPay, `redirectUrl` points to the hosted
  checkout page.
- `GET /api/v1/billing/status?reference=<pay_ref>` — poll a payment status.
  Auth required (own payments only). `status` ∈ `pending | paid | failed | cancelled`.
- `POST /api/v1/billing/webhooks/{moolre|expresspay}` — gateway webhook
  receiver (public). The gateway identifies the transaction; the service then
  re-queries the gateway for an authoritative status before activating a plan,
  so a forged POST cannot grant a paid plan. Returns HTTP 200 immediately.

Gateways are enabled only when their env credentials are set (see `.env.example`):
- **Moolre**: `MOOLRE_API_KEY`, `MOOLRE_ACCOUNT_NUMBER` (mobile-money
  aggregator: MTN / Telecel / AirtelTigo MoMo).
- **ExpressPay**: `EXPRESSPAY_MERCHANT_ID`, `EXPRESSPAY_API_KEY` (cards +
  mobile money + gh-link).

### Admin (human super-admin in the loop)
- `GET /api/v1/admin/subscriptions` — subscriptions + payments list.
- `POST /api/v1/admin/subscriptions/{userId}` — manually renew/extend a user's
  plan period (e.g. after an off-platform payment). Body:
  ```json
  { "plan": "professional", "months": 1 }
  ```

### Cron / scheduled maintenance (internal)
- `POST /api/v1/cron/billing` — daily auto-renewal sweep. **Internal only**:
  invoked by the Worker's `scheduled` handler via a loopback fetch with the
  shared `x-cron-secret` header (set with `wrangler secret put CRON_SECRET`).
  Rejects any request with a wrong or missing secret. Behaviour:
  1. **Expires** subscriptions whose period ended more than the 3-day grace
     period ago, so the effective-plan resolution falls back to Free (no
     involuntary re-charging). Subscriptions within the grace window are left
     `active` so the user can still log in and view their dashboard.
  2. **Flags** subscriptions expiring within 7 days for the admin renewal queue.
  Returns `{ ok, expired, dueForRenewal, remainingActive, at }`.
- Cron trigger configured in `wrangler.jsonc` (`triggers.crons`), currently
  `0 3 * * *` (daily 03:00 UTC). The wrapper entrypoint
  `worker-scheduled.js` re-exports the OpenNext handler and fans `scheduled`
  events into the route above; it no-ops if `CRON_SECRET`/`APP_URL` are unset.

## Auth model for API
- Web: Clerk session (`auth()`/`getSession()`), on the `<ClerkProvider>` + server-side layout guards.
- Public/agent API: `Authorization: Bearer <api_key>` → `api_keys` table, usage events logged.
- Rate limiting per key/user.

## Rate limiting
Sensitive/expensive endpoints are rate-limited with a distributed D1-backed
fixed-window limiter. When the limit is hit, the API returns `429` with the
envelope error code `RATE_LIMITED` plus `Retry-After`, `X-RateLimit-Limit` and
`X-RateLimit-Remaining` headers.

| Endpoint               | Window   | Limit |
|------------------------|----------|-------|
| `POST /auth/login`     | 1 min    | 10    |
| `POST /auth/register`  | 1 hour   | 5     |
| `POST /auth/forgot-password` | 15 min | 5 (per IP) + 10/hour (per email) |
| `POST /ai/ask`         | 1 min    | 30 (per user) |

## Caching
Stable public reference endpoints (regulations, parts, occupancies,
requirements/{id}, authorities/{id}) return CDN-friendly `Cache-Control`
headers (`s-maxage`) so Cloudflare can serve them without hitting D1. The
published blog listing/post cache briefly (60s) with `stale-while-revalidate`.
Auth-dependent and search endpoints are not cached.

## Capability list (S24)
get_applicable_requirements, classify_occupancy, check_fire_requirements,
check_accessibility, check_means_of_escape, check_site_requirements,
check_documentation, check_permit_readiness, find_authority_requirements,
get_requirement_source, explain_requirement, generate_compliance_report.
