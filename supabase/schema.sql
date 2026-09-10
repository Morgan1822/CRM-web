-- ====================================================================
-- 1. ROLES & GRANULAR PERMISSIONS
-- Shared between Next.js Web CRM and Flutter Mobile App
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  entity TEXT NOT NULL, -- 'contacts', 'companies', 'deals', 'calls', 'tasks', 'activities', 'roles', 'settings'
  can_view BOOLEAN DEFAULT TRUE NOT NULL,
  can_create BOOLEAN DEFAULT FALSE NOT NULL,
  can_edit BOOLEAN DEFAULT FALSE NOT NULL,
  can_delete BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_role_entity UNIQUE (role_id, entity)
);

-- Seed System Default Roles
INSERT INTO public.roles (id, name, description, is_system)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Full unrestricted access to all CRM entities, team roles, and settings', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Manager', 'Can view, create, and manage all leads, deals, tasks, calls, and reports', TRUE),
  ('00000000-0000-0000-0000-000000000003', 'Agent', 'Standard sales agent: can view and manage assigned contacts, deals, calls, and tasks', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed Admin Permissions (All entities full CRUD)
INSERT INTO public.role_permissions (role_id, entity, can_view, can_create, can_edit, can_delete)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  e,
  TRUE, TRUE, TRUE, TRUE
FROM (VALUES ('contacts'), ('companies'), ('deals'), ('calls'), ('tasks'), ('activities'), ('roles'), ('settings')) AS entities(e)
ON CONFLICT (role_id, entity) DO NOTHING;

-- Seed Manager Permissions (Full CRUD on core CRM, view/edit on roles/settings)
INSERT INTO public.role_permissions (role_id, entity, can_view, can_create, can_edit, can_delete)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'contacts', TRUE, TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000002', 'companies', TRUE, TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000002', 'deals', TRUE, TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000002', 'calls', TRUE, TRUE, TRUE, FALSE),
  ('00000000-0000-0000-0000-000000000002', 'tasks', TRUE, TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000002', 'activities', TRUE, TRUE, TRUE, FALSE),
  ('00000000-0000-0000-0000-000000000002', 'roles', TRUE, FALSE, FALSE, FALSE),
  ('00000000-0000-0000-0000-000000000002', 'settings', TRUE, FALSE, FALSE, FALSE)
ON CONFLICT (role_id, entity) DO NOTHING;

-- Seed Agent Permissions (Standard operational CRUD, no destructive deletes)
INSERT INTO public.role_permissions (role_id, entity, can_view, can_create, can_edit, can_delete)
VALUES
  ('00000000-0000-0000-0000-000000000003', 'contacts', TRUE, TRUE, TRUE, FALSE),
  ('00000000-0000-0000-0000-000000000003', 'companies', TRUE, TRUE, TRUE, FALSE),
  ('00000000-0000-0000-0000-000000000003', 'deals', TRUE, TRUE, TRUE, FALSE),
  ('00000000-0000-0000-0000-000000000003', 'calls', TRUE, TRUE, TRUE, FALSE),
  ('00000000-0000-0000-0000-000000000003', 'tasks', TRUE, TRUE, TRUE, FALSE),
  ('00000000-0000-0000-0000-000000000003', 'activities', TRUE, TRUE, TRUE, FALSE),
  ('00000000-0000-0000-0000-000000000003', 'roles', FALSE, FALSE, FALSE, FALSE),
  ('00000000-0000-0000-0000-000000000003', 'settings', FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (role_id, entity) DO NOTHING;

-- Helper SQL Function to evaluate user permissions across RLS policies
CREATE OR REPLACE FUNCTION public.has_permission(
  target_user_id UUID,
  entity_name TEXT,
  action_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role_id UUID;
  v_is_allowed BOOLEAN := FALSE;
BEGIN
  -- Get user's assigned role
  SELECT role_id INTO v_role_id
  FROM public.profiles
  WHERE id = target_user_id;

  -- Default to true if no role assigned yet (initial onboarding safety) or if user is super admin
  IF v_role_id IS NULL THEN
    RETURN TRUE;
  END IF;

  IF v_role_id = '00000000-0000-0000-0000-000000000001'::uuid THEN
    RETURN TRUE;
  END IF;

  -- Check specific entity permission
  IF action_name = 'view' THEN
    SELECT can_view INTO v_is_allowed FROM public.role_permissions WHERE role_id = v_role_id AND entity = entity_name;
  ELSIF action_name = 'create' THEN
    SELECT can_create INTO v_is_allowed FROM public.role_permissions WHERE role_id = v_role_id AND entity = entity_name;
  ELSIF action_name = 'edit' THEN
    SELECT can_edit INTO v_is_allowed FROM public.role_permissions WHERE role_id = v_role_id AND entity = entity_name;
  ELSIF action_name = 'delete' THEN
    SELECT can_delete INTO v_is_allowed FROM public.role_permissions WHERE role_id = v_role_id AND entity = entity_name;
  END IF;

  RETURN COALESCE(v_is_allowed, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ====================================================================
-- 2. PROFILES TABLE (Linked to auth.users with soft delete & roles)
-- Shared between Next.js Web CRM and Flutter Mobile App
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  phone TEXT,
  status TEXT DEFAULT 'active' NOT NULL, -- 'active', 'inactive', 'suspended'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMPTZ -- Soft delete support
);

-- Trigger to auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_default_role_id UUID;
  v_user_count INT;
BEGIN
  -- Count existing users: make first user Admin, subsequent users Agent by default
  SELECT COUNT(*) INTO v_user_count FROM public.profiles;

  IF v_user_count = 0 THEN
    v_default_role_id := '00000000-0000-0000-0000-000000000001'::uuid; -- Admin
  ELSE
    v_default_role_id := '00000000-0000-0000-0000-000000000003'::uuid; -- Agent
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role_id, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_default_role_id,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
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
-- ====================================================================
-- 4. ROW LEVEL SECURITY (RLS) & SUPABASE REALTIME CONFIGURATION
-- Enforced equally across Next.js Web CRM and Flutter Mobile App
-- ====================================================================

-- 4.1 ENABLE RLS ON ALL TABLES
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- 4.2 PROFILES POLICIES
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY "Users can update their own profile or Admins can update any"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.has_permission(auth.uid(), 'roles', 'edit'));

-- 4.3 ROLES & PERMISSIONS POLICIES
CREATE POLICY "Authenticated users can view roles"
  ON public.roles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only Admins can manage roles"
  ON public.roles FOR ALL
  USING (public.has_permission(auth.uid(), 'roles', 'edit'));

CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only Admins can manage role permissions"
  ON public.role_permissions FOR ALL
  USING (public.has_permission(auth.uid(), 'roles', 'edit'));

-- 4.4 COMPANIES POLICIES
CREATE POLICY "Users can view companies"
  ON public.companies FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL AND public.has_permission(auth.uid(), 'companies', 'view'));

CREATE POLICY "Users can insert companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'companies', 'create'));

CREATE POLICY "Users can update companies"
  ON public.companies FOR UPDATE
  USING (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'companies', 'edit'));

CREATE POLICY "Users can delete companies"
  ON public.companies FOR DELETE
  USING (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'companies', 'delete'));

-- 4.5 CONTACTS POLICIES
CREATE POLICY "Users can view contacts"
  ON public.contacts FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL AND public.has_permission(auth.uid(), 'contacts', 'view'));

CREATE POLICY "Users can insert contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'contacts', 'create'));

CREATE POLICY "Users can update contacts"
  ON public.contacts FOR UPDATE
  USING (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'contacts', 'edit'));

CREATE POLICY "Users can delete contacts"
  ON public.contacts FOR DELETE
  USING (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'contacts', 'delete'));

-- 4.6 PIPELINE STAGES POLICIES
CREATE POLICY "Authenticated users can view pipeline stages"
  ON public.pipeline_stages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins/Managers can manage pipeline stages"
  ON public.pipeline_stages FOR ALL
  USING (public.has_permission(auth.uid(), 'deals', 'edit'));

-- 4.7 DEALS POLICIES
CREATE POLICY "Users can view deals"
  ON public.deals FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL AND public.has_permission(auth.uid(), 'deals', 'view'));

CREATE POLICY "Users can insert deals"
  ON public.deals FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'deals', 'create'));

CREATE POLICY "Users can update deals"
  ON public.deals FOR UPDATE
  USING (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'deals', 'edit'));

CREATE POLICY "Users can delete deals"
  ON public.deals FOR DELETE
  USING (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'deals', 'delete'));

-- 4.8 CALLS POLICIES
CREATE POLICY "Users can view calls"
  ON public.calls FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL AND public.has_permission(auth.uid(), 'calls', 'view'));

CREATE POLICY "Users can insert calls"
  ON public.calls FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'calls', 'create'));

CREATE POLICY "Users can update calls"
  ON public.calls FOR UPDATE
  USING (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'calls', 'edit'));

-- 4.9 TASKS POLICIES
CREATE POLICY "Users can view tasks"
  ON public.tasks FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL AND public.has_permission(auth.uid(), 'tasks', 'view'));

CREATE POLICY "Users can insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'tasks', 'create'));

CREATE POLICY "Users can update tasks"
  ON public.tasks FOR UPDATE
  USING (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'tasks', 'edit'));

CREATE POLICY "Users can delete tasks"
  ON public.tasks FOR DELETE
  USING (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'tasks', 'delete'));

-- 4.10 ACTIVITIES POLICIES
CREATE POLICY "Users can view activities"
  ON public.activities FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL AND public.has_permission(auth.uid(), 'activities', 'view'));

CREATE POLICY "Users can insert activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND public.has_permission(auth.uid(), 'activities', 'create'));

-- 4.11 DEVICE TOKENS POLICIES (Push Notifications)
CREATE POLICY "Users can manage own device tokens"
  ON public.device_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4.12 HIGH-PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON public.contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON public.deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON public.deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON public.deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON public.calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON public.activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON public.activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);

-- 4.13 ENABLE SUPABASE REALTIME FOR INSTANT CROSS-APP REPLICATION
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_stages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
-- ====================================================================
-- 5. INITIAL SEED DATA FOR CRM WEB & FLUTTER MOBILE DEMO
-- ====================================================================

-- 5.1 SEED SAMPLE COMPANIES
INSERT INTO public.companies (id, name, domain, industry, size, phone, website, city, state, country)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'Acme Cloud Dynamics', 'acmecloud.io', 'Cloud Infrastructure', '51-200', '+1 (555) 234-5678', 'https://acmecloud.io', 'San Francisco', 'CA', 'USA'),
  ('20000000-0000-0000-0000-000000000002', 'Starlight FinTech', 'starlightpay.com', 'Financial Technology', '201-1000', '+1 (555) 345-6789', 'https://starlightpay.com', 'New York', 'NY', 'USA'),
  ('20000000-0000-0000-0000-000000000003', 'Apex BioHealth', 'apexbio.health', 'Healthcare AI', '11-50', '+1 (555) 456-7890', 'https://apexbio.health', 'Boston', 'MA', 'USA')
ON CONFLICT (id) DO NOTHING;

-- 5.2 SEED SAMPLE CONTACTS
INSERT INTO public.contacts (id, first_name, last_name, email, phone, company_id, job_title, status, lead_source, notes)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'Sarah', 'Jenkins', 'sarah.jenkins@acmecloud.io', '+1 (555) 123-4567', '20000000-0000-0000-0000-000000000001', 'VP of Engineering', 'qualified', 'website', 'Interested in multi-region failover and dedicated support tier.'),
  ('30000000-0000-0000-0000-000000000002', 'Michael', 'Chang', 'mchang@starlightpay.com', '+1 (555) 987-6543', '20000000-0000-0000-0000-000000000002', 'Chief Product Officer', 'lead', 'inbound_call', 'Met at FinTech Summit 2026. Evaluating API integration throughput.'),
  ('30000000-0000-0000-0000-000000000003', 'Elena', 'Rostova', 'elena@apexbio.health', '+1 (555) 876-5432', '20000000-0000-0000-0000-000000000003', 'Head of Clinical Tech', 'contacted', 'referral', 'Looking for HIPAA compliant CRM sync with native mobile agent app.')
ON CONFLICT (id) DO NOTHING;

-- 5.3 SEED SAMPLE DEALS
INSERT INTO public.deals (id, title, value, currency, stage_id, contact_id, company_id, expected_close_date, notes)
VALUES
  ('40000000-0000-0000-0000-000000000001', 'Enterprise Cloud Migration 2026', 120000.00, 'USD', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', (CURRENT_DATE + INTERVAL '30 days')::date, 'Proposal submitted, security review pending.'),
  ('40000000-0000-0000-0000-000000000002', 'Payment Gateway Integration', 65000.00, 'USD', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', (CURRENT_DATE + INTERVAL '45 days')::date, 'Architecture review meeting scheduled for next Tuesday.'),
  ('40000000-0000-0000-0000-000000000003', 'Healthcare AI Platform License', 240000.00, 'USD', '10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', (CURRENT_DATE + INTERVAL '15 days')::date, 'Final stage contract redlining with legal counsel.')
ON CONFLICT (id) DO NOTHING;

-- 5.4 SEED SAMPLE TASKS
INSERT INTO public.tasks (id, title, description, type, priority, due_date, is_completed, contact_id, deal_id)
VALUES
  ('50000000-0000-0000-0000-000000000001', 'Follow up on SLA questions with Sarah Jenkins', 'Review SLA uptime guarantees and share disaster recovery documentation.', 'call', 'high', (CURRENT_TIMESTAMP + INTERVAL '1 day'), FALSE, '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000002', 'Prepare FinTech Integration Deck', 'Customize API latency benchmarks for Michael Chang.', 'todo', 'medium', (CURRENT_TIMESTAMP + INTERVAL '3 days'), FALSE, '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000003', 'Legal contract final review with Elena', 'Schedule 30-min call to finalize data protection addendum.', 'meeting', 'urgent', (CURRENT_TIMESTAMP + INTERVAL '2 days'), FALSE, '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- 5.5 SEED SAMPLE CALL LOGS
INSERT INTO public.calls (id, contact_id, deal_id, provider, direction, from_number, to_number, status, duration_seconds, notes, outcome)
VALUES
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'twilio', 'outbound', '+1 (555) 000-1111', '+1 (555) 123-4567', 'completed', 342, 'Sarah confirmed budget is approved. Needs proposal sent before Friday.', 'connected_interested'),
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'twilio', 'outbound', '+1 (555) 000-1111', '+1 (555) 987-6543', 'completed', 180, 'Initial discovery call with Michael. Discussed payment throughput requirements.', 'connected_interested')
ON CONFLICT (id) DO NOTHING;

-- 5.6 SEED SAMPLE ACTIVITIES
INSERT INTO public.activities (id, type, title, description, contact_id, deal_id, company_id)
VALUES
  ('70000000-0000-0000-0000-000000000001', 'call', 'Outbound call with Sarah Jenkins', 'Completed 5m 42s call regarding cloud migration roadmap.', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000002', 'stage_change', 'Deal moved to Proposal Sent', 'Deal advanced from Meeting Scheduled to Proposal Sent.', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000003', 'note', 'Technical requirement note', 'Client requires 99.99% SLA and SOC 2 Type II compliance verification.', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;
