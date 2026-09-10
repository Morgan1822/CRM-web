-- ====================================================================
-- 3. CORE CRM ENTITIES & RELATIONSHIPS
-- Shared source of truth between Web CRM and Flutter Mobile App
-- ====================================================================

-- 3.1 COMPANIES / ACCOUNTS
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT, -- '1-10', '11-50', '51-200', '201-1000', '1000+'
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- 3.2 CONTACTS / LEADS
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  job_title TEXT,
  status TEXT DEFAULT 'lead' NOT NULL, -- 'lead', 'contacted', 'qualified', 'customer', 'unqualified'
  lead_source TEXT, -- 'website', 'inbound_call', 'referral', 'campaign', 'outbound'
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- 3.3 PIPELINE STAGES (Customizable deal stages)
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  order_index INT DEFAULT 0 NOT NULL,
  color TEXT DEFAULT '#3B82F6' NOT NULL,
  win_probability INT DEFAULT 10 NOT NULL, -- 0 to 100 percentage
  is_closed_won BOOLEAN DEFAULT FALSE NOT NULL,
  is_closed_lost BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Default Pipeline Stages
INSERT INTO public.pipeline_stages (id, name, order_index, color, win_probability, is_closed_won, is_closed_lost)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Lead / Discovery', 1, '#6366F1', 10, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000002', 'Meeting Scheduled', 2, '#3B82F6', 30, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000003', 'Proposal Sent', 3, '#EC4899', 60, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000004', 'Negotiation', 4, '#F59E0B', 80, FALSE, FALSE),
  ('10000000-0000-0000-0000-000000000005', 'Closed Won', 5, '#10B981', 100, TRUE, FALSE),
  ('10000000-0000-0000-0000-000000000006', 'Closed Lost', 6, '#EF4444', 0, FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3.4 DEALS
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  value NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE RESTRICT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expected_close_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- 3.5 CALLS (Integrated with Twilio Voice / WebRTC Dialer)
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT DEFAULT 'twilio' NOT NULL, -- 'twilio', 'exotel', etc.
  provider_call_sid TEXT,
  direction TEXT DEFAULT 'outbound' NOT NULL, -- 'inbound', 'outbound'
  from_number TEXT,
  to_number TEXT NOT NULL,
  status TEXT DEFAULT 'completed' NOT NULL, -- 'initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer'
  duration_seconds INT DEFAULT 0 NOT NULL,
  recording_url TEXT,
  notes TEXT,
  outcome TEXT, -- 'connected_interested', 'left_voicemail', 'busy', 'wrong_number', 'follow_up_needed'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- 3.6 TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'todo' NOT NULL, -- 'call', 'meeting', 'email', 'todo', 'follow_up'
  priority TEXT DEFAULT 'medium' NOT NULL, -- 'low', 'medium', 'high', 'urgent'
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- 3.7 ACTIVITIES & TIMELINE AUDIT
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'call', 'meeting', 'note', 'task', 'stage_change', 'email', 'created'
  title TEXT NOT NULL,
  description TEXT,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- 3.8 DEVICE TOKENS (For Flutter iOS/Android FCM Push Notifications)
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL, -- 'ios', 'android', 'web'
  last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
