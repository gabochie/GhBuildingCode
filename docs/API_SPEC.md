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
- `POST /api/v1/auth/register` — {email, password, name}; password must be 8–128 chars with lowercase + uppercase + number + special char
- `POST /api/v1/auth/login` — {email, password} → sets httpOnly cookie
- `POST /api/v1/auth/logout` — clears session cookie (POST only, CSRF-safe)
- `GET /api/v1/auth/me` — current user + memberships

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

## Auth model for API
- Web: httpOnly JWT cookie.
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
