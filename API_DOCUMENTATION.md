# Krew AI Frontend — Backend API Documentation

Base URL: `http://localhost:3000` (Development)

All endpoints are prefixed with `/api`. Auth uses a bearer token in the `Authorization: Bearer <token>` header (stored in localStorage under `auth_token` — see `lib/auth.ts`).

---

## Table of Contents

1. [Authentication](#authentication)
2. [User](#user)
3. [Onboarding](#onboarding)
4. [Agents (My Krew)](#agents-my-krew)
5. [Luna — Overview](#luna--overview)
6. [Luna — Conversations](#luna--conversations)
7. [Luna — Issues](#luna--issues)
8. [Luna — Reports](#luna--reports)
9. [Luna — Knowledge Base](#luna--knowledge-base)
10. [Luna — Settings](#luna--settings)
11. [Integrations](#integrations)

---

## Authentication

### POST /api/auth/register
Body: `{ first_name, last_name, business_name, email, password }`
Returns: `{ access_token, user: { id, first_name, last_name, email } }`

### POST /api/auth/login
Body: `{ email, password }`
Returns: `{ access_token, user: { id, first_name, last_name, email } }`

### POST /api/auth/logout
Returns: `{ success: boolean }`

---

## User

### GET /api/user/info
Returns: `{ first_name, last_name, email }`

---

## Onboarding

### POST /api/onboarding
Body: `{ business_type, revenue_range, dm_volume, pain_point }`
Returns: `{ success: boolean }`

---

## Agents (My Krew page)

### GET /api/agents
Returns: `[{ id, name, role, status: 'live'|'soon', stats: object }]`

### GET /api/notifications
Returns: `[{ id, agent: 'Luna'|'Ivy', message: string, time: string }]`
Used for the notification chips row on the My Krew dashboard.

---

## Luna — Overview

### GET /api/luna/overview?period=today|yesterday|week|month
Returns:
```json
{
  "stats": {
    "orders_from_dms": 48,
    "return_requests": 23,
    "refund_requests": 15,
    "total_conversations": 142,
    "orders_delta": 12,
    "returns_delta": -8,
    "refunds_delta": 5,
    "conversations_delta": 18
  },
  "hourly_volume": [30,20,25,40,60,75,95,80,70,65,50,45],
  "hourly_labels": ["8am","10","12","2pm","4","6","8","10","12","2am","4","6"],
  "weekly_volume": [55,62,48,70,65,92,78],
  "weekly_labels": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  "top_issues": [
    { "id": "1", "name": "Sizing issue", "description": "...", "count": 12, "delta_pct": 20 }
  ],
  "sentiment": { "angry": 15, "neutral": 45, "positive": 40 }
}
```

---

## Luna — Conversations

### GET /api/luna/conversations?period=today|week|month&status=all|resolved|escalated|pending
Returns:
```json
{
  "conversations": [
    {
      "id": "string",
      "customer": "@sarah.style",
      "channel": "instagram | whatsapp",
      "topic": "Size inquiry",
      "status": "resolved | escalated | pending",
      "timestamp": "2m ago"
    }
  ]
}
```

---

## Luna — Issues

### GET /api/luna/issues?period=today|week|month
Returns:
```json
{
  "issues": [
    {
      "id": "string",
      "name": "Sizing issue",
      "description": "Customers can't find their size in the chart",
      "count": 12,
      "delta_pct": 20
    }
  ],
  "sentiment": { "angry": 15, "neutral": 45, "positive": 40 }
}
```

### POST /api/luna/issues/export
Body: `{ format: "pdf" | "csv" }`
Returns: `{ download_url: string }`

### POST /api/luna/issues/flag-team
Body: `{ issue_ids: string[] }`
Returns: `{ success: boolean }`

---

## Luna — Reports

### GET /api/luna/reports/summary?period=month|week
Returns:
```json
{
  "total_dms": 1842,
  "resolution_rate": 96,
  "avg_response_ms": 400,
  "escalations": 31,
  "total_dms_delta": 18,
  "resolution_delta": 3,
  "response_delta": 100,
  "escalations_delta": -2,
  "monthly_volume": [55,68,44,78,60,94],
  "monthly_labels": ["Sep","Oct","Nov","Dec","Jan","Feb"]
}
```

### POST /api/luna/reports/export
Body: `{ format: "pdf" | "csv", period: "daily" | "weekly" | "monthly" }`
Returns: `{ download_url: string }`

### POST /api/luna/reports/send-email
Body: `{ period: "daily" | "weekly" | "monthly" }`
Returns: `{ success: boolean }`

### POST /api/luna/reports/send-whatsapp
Body: `{ period: "daily" }`
Returns: `{ success: boolean }`

---

## Luna — Knowledge Base

### GET /api/luna/knowledge-base
Returns: `{ items: [{ id, question, answer, fixed: boolean }] }`

### POST /api/luna/knowledge-base
Body: `{ items: [{ id?, question, answer }] }`
Returns: `{ success: boolean }`

### DELETE /api/luna/knowledge-base/:id
Returns: `{ success: boolean }`

---

## Luna — Settings

### GET /api/luna/settings
Returns:
```json
{
  "brand_tone": "Friendly | Professional | Casual | Luxury",
  "escalation_threshold": "3_messages | 5_messages | any_complaint | never",
  "active_channels": { "instagram": true, "whatsapp": true }
}
```

### PUT /api/luna/settings
Body: same shape as GET response
Returns: `{ success: boolean }`

---

## Integrations

### Shopify

#### GET /api/integrations/shopify/status
Returns: `{ linked: boolean, shop_domain?: string }`

#### POST /api/integrations/shopify/connect
Body: `{ shop_domain: "store-name.myshopify.com" }`
Returns: `{ oauth_url: string }` ← frontend redirects user to this URL for OAuth

After OAuth completes, Shopify redirects back to:
`/dashboard/luna/settings?shopify=connected`

#### DELETE /api/integrations/shopify/disconnect
Returns: `{ success: boolean }`

---

### Meta Business (Instagram + WhatsApp)

#### GET /api/integrations/meta/status
Returns: `{ linked: boolean, account_id?: string }`

#### POST /api/integrations/meta/connect
Body: `{ business_account_id: string, access_token: string }`
Returns: `{ success: boolean }`

#### DELETE /api/integrations/meta/disconnect
Returns: `{ success: boolean }`

---

### Bosta

#### GET /api/integrations/bosta/status
Returns: `{ linked: boolean }`

#### POST /api/integrations/bosta/connect
Body: `{ api_key: string }`
Returns: `{ success: boolean }`

#### DELETE /api/integrations/bosta/disconnect
Returns: `{ success: boolean }`
