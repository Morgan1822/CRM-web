# Apex CRM Web Application

> Production-grade, omnichannel sales & telephony CRM built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**, powered by a shared **Supabase Postgres + Realtime** backend.

---

## 🚀 Key Highlights

- **Shared Two-App Backend**: Built to operate alongside a companion **Flutter Mobile App (iOS & Android)** sharing one Supabase Postgres database.
- **Role-Based Row Level Security (RLS)**: Enforced directly in Postgres (`Admin`, `Manager`, `Agent`) with granular matrix controls.
- **Click-to-Call Dialer**: Integrated in-CRM WebRTC dialer supporting **Twilio Voice** (with a modular interface to swap in **Exotel** or custom VoIP gateways).
- **Automated Mobile Push Alerts**: Supabase Edge Functions dispatch FCM HTTP v1 notifications to mobile devices when leads or tasks are assigned.
- **Comprehensive CRM Suite**:
  - 📊 **Executive Dashboard**: Real-time revenue metrics, win rate, call stats, and live activity feed.
  - 👥 **Contacts & Leads Hub**: Filterable lead table, CSV import/export, click-to-call actions.
  - 📈 **Deals & Pipeline Board**: Interactive Kanban board grouped by stage with deal values and probability weighting.
  - 🏢 **Companies & Accounts**: Organization profiles with linked contacts and aggregate deal tracking.
  - 📞 **Calls & Telephony Logs**: WebRTC call duration logs, direction, outcome tags, and agent notes.
  - 📋 **Tasks & Reminders**: Priority checklist (`Urgent`, `High`, `Medium`, `Low`) with auto-reminders.
  - 🛡️ **Roles & Permissions Matrix**: Admin matrix table configuring entity CRUD rights and team invitations.
  - 🌓 **Theme Customization**: Full Light and Dark mode with persistent storage via `next-themes`.

---

## 📁 Project Architecture

```
CRM web/
├── app/
│   ├── (dashboard)/            # Authenticated App Router routes
│   │   ├── dashboard/          # Analytics & metrics
│   │   ├── contacts/           # Leads & customer management
│   │   ├── companies/          # Organization accounts
│   │   ├── deals/              # Kanban pipeline board
│   │   ├── calls/              # Telephony call records
│   │   ├── tasks/              # Daily task manager
│   │   ├── roles/              # RBAC matrix & team management
│   │   └── settings/           # Workspace & dialer preferences
│   ├── api/
│   │   └── dialer/token/       # Twilio Voice capability token generator
│   ├── auth/                   # Sign in, sign up & PKCE callback
│   ├── globals.css             # Tailwind theme variables
│   └── layout.tsx              # Root layout & providers
├── components/
│   ├── layout/                 # Sidebar, Header, ThemeToggle, DialerPanel
│   ├── providers/              # Supabase SSR & Theme providers
│   └── ui/                     # Accessible shadcn/ui primitives
├── docs/
│   ├── SHARED_SCHEMA_GUIDE.md  # Shared backend documentation with Flutter mobile
│   └── FCM_PUSH_SETUP.md       # Firebase Cloud Messaging setup guide
├── features/                   # Domain-driven feature modules
├── hooks/                      # Custom hooks (usePermissions, etc.)
├── lib/
│   ├── dialer/                 # Telephony adapter interface (Twilio / Exotel)
│   └── supabase/               # Client, Server, and Middleware Supabase SSR clients
├── supabase/
│   ├── functions/
│   │   ├── push-dispatcher/    # Edge Function for FCM HTTP v1 push alerts
│   │   └── twilio-webhook/     # Edge Function for Twilio call logging
│   ├── migrations/             # Idempotent versioned SQL migrations
│   └── schema.sql              # Master SQL script for one-click deployment
└── types/                      # Database & entity TypeScript interfaces
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **Supabase Project**: Free or Pro tier at [supabase.com](https://supabase.com)

### 2. Installation
```bash
# Clone repository
git clone https://github.com/Morgan1822/CRM-web.git
cd CRM-web

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Populate the following keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-never-expose-to-client

# Optional: Twilio Voice click-to-call
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=SKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_API_SECRET=your_api_secret
TWILIO_TWIML_APP_SID=APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_CALLER_ID=+1234567890
```

### 4. Database Setup
You can set up the database in **two easy ways**:

#### Option A: Supabase SQL Editor (Fastest)
1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.

#### Option B: Supabase CLI
```bash
supabase db push
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📞 Click-to-Call Dialer (Twilio / Exotel)

- **Default Provider**: Twilio Voice (WebRTC).
- **Swapping Providers**:
  1. Implement `IDialerProvider` in `lib/dialer/`.
  2. See `lib/dialer/exotel-adapter.ts` for an Exotel implementation.
  3. Update factory in `lib/dialer/index.ts`.

---

## 📱 Mobile Push Notifications (FCM HTTP v1)

- See [`docs/FCM_PUSH_SETUP.md`](./docs/FCM_PUSH_SETUP.md) for full instructions on generating a Firebase Service Account key and deploying the Supabase Edge Function:
```bash
supabase functions deploy push-dispatcher
supabase functions deploy twilio-webhook
```

---

## 🚢 Deployment

### Deploying to Vercel
1. Push your repository to GitHub.
2. Import project in [Vercel](https://vercel.com).
3. Set environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Click **Deploy**.

---

## 📄 License
MIT License. Developed for enterprise multi-platform CRM deployments.
