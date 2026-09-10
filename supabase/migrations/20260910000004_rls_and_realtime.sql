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
