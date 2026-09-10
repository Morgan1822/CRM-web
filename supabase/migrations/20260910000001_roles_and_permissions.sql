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
