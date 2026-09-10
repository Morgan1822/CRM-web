# Shared Schema Architecture Guide: Next.js CRM Web & Flutter Mobile App

Apex CRM is designed as a **unified two-app sales system**:
1. **CRM Web App** (`CRM web`): Built with Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, and `@supabase/ssr`.
2. **CRM Mobile App** (`CRM`): Built with Flutter (iOS & Android).

Both applications connect directly to **ONE shared Supabase project** (Postgres + Auth + Realtime + Storage + Edge Functions).

---

## 1. Core Principles

- **Single Source of Truth**: All schema definitions, table constraints, triggers, and Row Level Security (RLS) policies live in `supabase/migrations/` and apply identically to both Web and Mobile requests.
- **Audit & Soft-Deletes**:
  - Every operational table contains `id (uuid)`, `created_at`, `updated_at`, `updated_by`, and `deleted_at`.
  - Records are **never hard-deleted** in application queries (`deleted_at IS NULL` is enforced). This prevents data synchronization mismatches and maintains activity history for mobile agents in the field.
- **Role-Based Access Control (RBAC)**:
  - Permissions (`view`, `create`, `edit`, `delete`) are configured in `roles` and `role_permissions` tables.
  - The Postgres security function `public.has_permission(auth.uid(), entity, action)` enforces access directly at the SQL level.

---

## 2. Table Summary & Shared Usage

| Table Name | Primary Fields | Web CRM Usage | Flutter Mobile Usage |
| :--- | :--- | :--- | :--- |
| `profiles` | `id`, `email`, `full_name`, `role_id`, `avatar_url`, `status` | Team directory, user management | Logged-in agent profile |
| `roles` & `role_permissions` | `id`, `name`, `entity`, `can_view`, `can_create`, `can_edit`, `can_delete` | Admin role editor & matrix permissions | Permission checks on mobile screens |
| `companies` | `id`, `name`, `domain`, `industry`, `size`, `phone`, `city` | Account directory, group deal analytics | Company details lookup |
| `contacts` | `id`, `first_name`, `last_name`, `email`, `phone`, `company_id`, `status` | Lead pipeline, CSV import/export, click-to-call | Contact cards, native phone calling |
| `pipeline_stages` | `id`, `name`, `order_index`, `color`, `win_probability` | Kanban stage definitions, conversion metrics | Pipeline stage selector |
| `deals` | `id`, `title`, `value`, `stage_id`, `contact_id`, `company_id`, `assigned_to` | Drag-and-drop Kanban board, deal creator | Deal tracker and value summaries |
| `calls` | `id`, `contact_id`, `provider`, `direction`, `duration_seconds`, `notes`, `outcome` | WebRTC dialer logs, duration timer, call history | Call history log |
| `tasks` | `id`, `title`, `priority`, `due_date`, `is_completed`, `assigned_to` | Task manager, daily checklist | Action items and push notifications |
| `activities` | `id`, `type`, `title`, `description`, `contact_id`, `deal_id`, `metadata` | Real-time activity timeline | Customer interaction history |
| `device_tokens` | `id`, `user_id`, `token`, `platform`, `last_seen_at` | Read token count in admin settings | Registers FCM device token on app launch |

---

## 3. Real-Time Synchronization

Supabase Realtime publication `supabase_realtime` is enabled for:
- `public.contacts`
- `public.deals`
- `public.tasks`
- `public.calls`
- `public.activities`
- `public.profiles`
- `public.companies`
- `public.pipeline_stages`

When a sales agent updates a lead's stage or logs a call in the Web CRM, the Flutter mobile app receives a WebSocket change payload within milliseconds, and vice-versa.

---

## 4. Supabase Edge Functions (Serverless Backend)

1. **`push-dispatcher`** (`supabase/functions/push-dispatcher/`):
   - Fired by Database Webhooks when leads or tasks are assigned.
   - Looks up recipient's FCM tokens in `device_tokens`.
   - Sends native iOS/Android push alerts via Firebase Cloud Messaging HTTP v1 API.
2. **`twilio-webhook`** (`supabase/functions/twilio-webhook/`):
   - Receives Twilio Voice call lifecycle webhooks.
   - Records call duration, recording URLs, and outcome notes directly to the shared Postgres DB.
